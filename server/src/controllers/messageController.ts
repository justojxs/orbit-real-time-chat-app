import asyncHandler from "express-async-handler";
import Message from "../models/messageModel";
import User from "../models/userModel";
import Chat from "../models/chatModel";
import { Request, Response } from "express";

//@description     Get all Messages
//@route           GET /api/Message/:chatId
//@access          Protected
const allMessages = asyncHandler(async (req: Request, res: Response) => {
    try {
        const messages = await Message.find({ chat: req.params.chatId })
            .populate("sender", "name pic email isOnline lastSeen")
            .populate("chat")
            .populate("reactions.user", "name pic");
        res.json(messages);
    } catch (error: any) {
        res.status(400);
        throw new Error(error.message);
    }
});

//@description     Create New Message
//@route           POST /api/Message/
//@access          Protected
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

//@description     Delete Message
//@route           PUT /api/Message/delete
//@access          Protected
const deleteMessage = asyncHandler(async (req: any, res: Response) => {
    const { messageId } = req.body;

    try {
        const message = await Message.findById(messageId);

        if (!message) {
            res.status(404);
            throw new Error("Message Not Found");
        }

        if (!message.sender || message.sender.toString() !== req.user._id.toString()) {
            res.status(401);
            throw new Error("You can only delete your own messages");
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

//@description     Add Reaction to Message
//@route           PUT /api/Message/react
//@access          Protected
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

//@description     Search Messages in a Chat
//@route           GET /api/Message/search/:chatId?query=...
//@access          Protected
const searchMessages = asyncHandler(async (req: Request, res: Response) => {
    const { chatId } = req.params;
    const { query } = req.query;

    if (!query) {
        res.json([]);
        return;
    }

    try {
        const messages = await Message.find({
            chat: chatId,
            content: { $regex: query as string, $options: "i" },
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

export { allMessages, sendMessage, deleteMessage, reactToMessage, searchMessages };
