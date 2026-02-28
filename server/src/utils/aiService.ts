import { GoogleGenerativeAI } from "@google/generative-ai";
import Message from "../models/messageModel";
import Chat from "../models/chatModel";
import User from "../models/userModel";

export const handleAIResponse = async (newMessage: any, io: any) => {
    const { chat, content, sender } = newMessage;
    const chatId = chat._id?.toString() || chat.toString();

    if (!chat || !content) return;

    try {
        // 1. Find Orbit AI user
        const orbitAI = await User.findOne({ email: "orbit-ai@orbit.app" });
        if (!orbitAI) {
            console.error("Orbit AI user not found in database");
            return;
        }

        // 2. Add 'typing' indicator — emit to each user's personal room
        chat.users.forEach((u: any) => {
            const uid = u._id?.toString() || u.toString();
            io.in(uid).emit("typing", chatId);
        });

        const apiKey = process.env.GEMINI_API_KEY;
        let aiResponseText = "";

        if (!apiKey) {
            // Mock response if no API key
            await new Promise(r => setTimeout(r, 1500));
            aiResponseText = "I'm Orbit AI! The GEMINI_API_KEY is not configured on the server, so I'm running in mock mode. How can I help you today?";
        } else {
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

            // Fetch recent context for the AI — exclude the current message as it will be sent via sendMessage
            const history = await Message.find({
                chat: chatId,
                _id: { $ne: newMessage._id }
            })
                .sort({ createdAt: -1 })
                .limit(10)
                .populate("sender", "name email")
                .lean();

            history.reverse();

            // Build chat history, ensuring alternating user/model roles
            // Gemini requires strict alternation: user, model, user, model...
            const rawHistory = history
                .filter((m: any) => m.content && m.sender)
                .map((m: any) => ({
                    role: m.sender.email === "orbit-ai@orbit.app" ? "model" : "user",
                    parts: [{ text: m.content }],
                }));

            // Collapse consecutive same-role entries (Gemini will reject otherwise)
            const cleanHistory: { role: string; parts: { text: string }[] }[] = [];
            for (const entry of rawHistory) {
                if (cleanHistory.length > 0 && cleanHistory[cleanHistory.length - 1].role === entry.role) {
                    // Merge into previous entry
                    cleanHistory[cleanHistory.length - 1].parts[0].text += "\n" + entry.parts[0].text;
                } else {
                    cleanHistory.push(entry);
                }
            }

            // Identity prompt
            const systemPrompt = "Your name is Orbit AI. You are the official AI assistant for the Orbit Chat application. You are helpful, professional, and slightly futuristic in your tone. You should answer questions clearly and can help with anything from coding to general knowledge. Keep responses concise.";

            const chatSession = model.startChat({
                history: [
                    { role: "user", parts: [{ text: `System Instruction: ${systemPrompt}` }] },
                    { role: "model", parts: [{ text: "Understood. I am Orbit AI. How can I assist you today?" }] },
                    ...cleanHistory,
                ],
            });

            const result = await chatSession.sendMessage(content);
            const response = await result.response;
            aiResponseText = response.text();
        }

        // 3. Save AI message to database
        let aiMessage: any = await Message.create({
            sender: orbitAI._id,
            content: aiResponseText,
            chat: chatId,
            readBy: [orbitAI._id],
        });

        aiMessage = await aiMessage.populate("sender", "name pic email isVerified isOnline");
        aiMessage = await aiMessage.populate("chat");
        aiMessage = await User.populate(aiMessage, {
            path: "chat.users",
            select: "name pic email isVerified isOnline lastSeen",
        });

        // 4. Update latest message in chat
        await Chat.findByIdAndUpdate(chatId, { latestMessage: aiMessage });

        // 5. Emit the AI response to each user's personal room (matching index.ts pattern)
        chat.users.forEach((u: any) => {
            const uid = u._id?.toString() || u.toString();
            io.in(uid).emit("stop typing", chatId);
            io.in(uid).emit("message recieved", aiMessage);
        });

    } catch (error) {
        console.error("Orbit AI Error:", error);
        // Stop typing indicator on error
        try {
            chat.users.forEach((u: any) => {
                const uid = u._id?.toString() || u.toString();
                io.in(uid).emit("stop typing", chat._id?.toString() || chat.toString());
            });
        } catch (_) { }
    }
};
