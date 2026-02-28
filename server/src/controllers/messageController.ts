import asyncHandler from "express-async-handler";
import Message from "../models/messageModel";
import User from "../models/userModel";
import Chat from "../models/chatModel";
import { Request, Response } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Fetches messages for a specific chat with cursor-based pagination.
// Defaults to latest 50 messages. Client can send `before` (message ID) and `limit` to paginate older messages.
const allMessages = asyncHandler(async (req: Request, res: Response) => {
    try {
        const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
        const before = req.query.before as string;

        // Build query filter — if `before` cursor provided, fetch messages older than that
        const filter: any = { chat: req.params.chatId };
        if (before) {
            filter._id = { $lt: before };
        }

        const messages = await Message.find(filter)
            .sort({ createdAt: -1 }) // Fetch newest first
            .limit(limit)
            .populate("sender", "name pic email isOnline lastSeen")
            .populate("chat")
            .populate("reactions.user", "name pic")
            .lean();

        // Reverse to chronological order for display
        messages.reverse();
        res.json(messages);
    } catch (error: any) {
        res.status(400);
        throw new Error(error.message);
    }
});

// Creates a new message entry in the database.
// Maps incoming attachments like image, file url, or audio notes to the newly instantiated Message.
// Updates the corresponding Chat's 'latestMessage' so the main chat list preview is kept fresh.
// Replies with the created message payload populated with complete sender details.
const sendMessage = asyncHandler(async (req: any, res: Response) => {
    const { content, chatId, image, fileUrl, fileName, fileType, audioUrl, audioDuration } = req.body;

    if (!chatId || (!content && !image && !fileUrl && !audioUrl)) {
        console.log("Invalid data passed into request");
        res.sendStatus(400);
        return;
    }

    var newMessage = {
        sender: req.user._id,
        content: content || "",
        image: image || "",
        fileUrl: fileUrl || "",
        fileName: fileName || "",
        fileType: fileType || "",
        audioUrl: audioUrl || "",
        audioDuration: audioDuration || 0,
        chat: chatId,
        readBy: [req.user._id],
    };

    try {
        var message: any = await Message.create(newMessage);

        message = await message.populate("sender", "name pic email isOnline lastSeen");
        message = await message.populate("chat");
        message = await User.populate(message, {
            path: "chat.users",
            select: "name pic email isOnline lastSeen",
        });

        await Chat.findByIdAndUpdate(req.body.chatId, { latestMessage: message });

        res.json(message);
    } catch (error: any) {
        res.status(400);
        throw new Error(error.message);
    }
});

// Deletes a specified message by masking its content.
// Instead of hard-deleting the database row, it toggles an `isDeleted` flag and obscures the text.
// This allows the front-end to safely display "This message was deleted" while preserving history structure.
const deleteMessage = asyncHandler(async (req: any, res: Response) => {
    const { messageId } = req.body;

    try {
        const message = await Message.findById(messageId);

        if (!message) {
            res.status(404);
            throw new Error("Message Not Found");
        }



        const updatedMessage = await Message.findByIdAndUpdate(
            messageId,
            { isDeleted: true, content: "This message was deleted" },
            { new: true }
        ).populate("sender", "name pic").populate("chat");

        res.json(updatedMessage);
    } catch (error: any) {
        res.status(400);
        throw new Error(error.message);
    }
});

// Adds or removes an emoji reaction from a specific message.
// Reverses a reaction if the user has already tapped it (toggling it on/off).
// Allows the front-end to update state cleanly via optimistic updates.
// Returns the newly updated message with the latest full reaction counts.
const reactToMessage = asyncHandler(async (req: any, res: Response) => {
    const { messageId, emoji } = req.body;

    try {
        const message = await Message.findById(messageId);
        if (!message) {
            res.status(404);
            throw new Error("Message Not Found");
        }

        // Check if user already reacted with same emoji
        const existingReactionIndex = message.reactions.findIndex(
            (r: any) => r.user.toString() === req.user._id.toString() && r.emoji === emoji
        );

        let updatedMessage;
        if (existingReactionIndex > -1) {
            // Remove reaction if it exists
            updatedMessage = await Message.findByIdAndUpdate(
                messageId,
                { $pull: { reactions: { user: req.user._id, emoji: emoji } } },
                { new: true }
            );
        } else {
            // Add reaction
            updatedMessage = await Message.findByIdAndUpdate(
                messageId,
                { $push: { reactions: { user: req.user._id, emoji: emoji } } },
                { new: true }
            );
        }

        updatedMessage = await updatedMessage?.populate("reactions.user", "name pic");
        updatedMessage = await updatedMessage?.populate("sender", "name pic");

        res.json(updatedMessage);
    } catch (error: any) {
        res.status(400);
        throw new Error(error.message);
    }
});

// Handles backend search mechanism explicitly scoping query hits to a discrete chat ID.
// Rejects invalid null queries gracefully to avoid expensive database lookups.
// Returns all non-deleted messages whose content matches via regex evaluation.
const searchMessages = asyncHandler(async (req: Request, res: Response) => {
    const { chatId } = req.params;
    const { query } = req.query;

    if (!query) {
        res.json([]);
        return;
    }

    try {
        const escapedQuery = (query as string).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const messages = await Message.find({
            chat: chatId,
            content: { $regex: escapedQuery, $options: "i" },
            isDeleted: false
        })
            .populate("sender", "name pic")
            .populate("chat")
            .sort({ createdAt: -1 });

        res.json(messages);
    } catch (error: any) {
        res.status(400);
        throw new Error(error.message);
    }
});

// Generates an automated recap of conversational context using Google generative APIs.
// If an explicit transcript is passed, it summarizes just that batch instead of performing a database lookup.
// Designed with fallback delays locally if the configuration keys are inadvertently missing.
const summarizeChat = asyncHandler(async (req: any, res: Response) => {
    try {
        const { chatId } = req.params;
        const { transcript: providedTranscript } = req.body;

        let transcript = providedTranscript;

        if (!transcript) {
            // Fetch last 50 messages implicitly if no transcript sent
            const messages = await Message.find({ chat: chatId, isDeleted: false })
                .sort({ createdAt: -1 })
                .limit(50)
                .populate("sender", "name");

            if (!messages || messages.length === 0) {
                res.json({ summary: "No messages to summarize yet." });
                return;
            }

            // Reverse to chronological order
            messages.reverse();
            transcript = messages.map((m: any) => `${m.sender.name}: ${m.content || '[attachment/image]'}`).join('\n');
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            await new Promise(r => setTimeout(r, 1500)); // Simulate API delay
            res.json({
                summary: "Because the backend is missing the required API keys, here is a mock response.\n\n• The group discussed recent project updates.\n• Someone shared an attachment regarding the new design.\n• Participants agreed to catch up later this week to finalize details."
            });
            return;
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `Please summarize the following chat transcript concisely in 3 bullet points. Focus on the main topics, agreements, and key details.\n\nTranscript:\n${transcript}`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        res.json({ summary: text });
    } catch (error: any) {
        console.error("AI Summary Error:", error);
        res.status(500).json({ summary: "Sorry, I couldn't summarize the chat at this moment." });
    }
});

export { allMessages, sendMessage, deleteMessage, reactToMessage, searchMessages, summarizeChat };
