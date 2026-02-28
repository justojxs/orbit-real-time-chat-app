import { GoogleGenerativeAI } from "@google/generative-ai";
import Message from "../models/messageModel";
import Chat from "../models/chatModel";
import User from "../models/userModel";

export const handleAIResponse = async (newMessage: any, io: any) => {
    const { chat, content, sender } = newMessage;

    if (!chat || !content) return;

    try {
        // 1. Find Orbit AI user
        const orbitAI = await User.findOne({ email: "orbit-ai@orbit.app" });
        if (!orbitAI) return;

        // 2. Add 'typing' indicator from AI
        io.in(chat._id).emit("typing", chat._id);

        const apiKey = process.env.GEMINI_API_KEY;
        let aiResponseText = "";

        if (!apiKey) {
            // Mock response if no API key
            await new Promise(r => setTimeout(r, 2000));
            aiResponseText = "I'm Orbit AI! The GEMINI_API_KEY is not configured on the server, so I'm running in mock mode. How can I help you today?";
        } else {
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

            // Fetch recent context for the AI
            const history = await Message.find({ chat: chat._id })
                .sort({ createdAt: -1 })
                .limit(10)
                .populate("sender", "name")
                .lean();

            history.reverse();

            const chatHistory = history.map((m: any) => ({
                role: m.sender.email === "orbit-ai@orbit.app" ? "model" : "user",
                parts: [{ text: m.content }],
            }));

            // Identity prompt
            const systemPrompt = "Your name is Orbit AI. You are the official AI assistant for the Orbit Chat application. You are helpful, professional, and slightly futuristic in your tone. You should answer questions clearly and can help with anything from coding to general knowledge.";

            const chatSession = model.startChat({
                history: [
                    { role: "user", parts: [{ text: `System Instruction: ${systemPrompt}` }] },
                    { role: "model", parts: [{ text: "Understood. I am Orbit AI, your cosmic chat assistant. How can I assist you in the Orbit network today?" }] },
                    ...chatHistory.slice(0, -1) // All except the very latest message which we'll send as current
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
            chat: chat._id,
            readBy: [orbitAI._id],
        });

        aiMessage = await aiMessage.populate("sender", "name pic email isVerified isOnline");
        aiMessage = await aiMessage.populate("chat");
        aiMessage = await User.populate(aiMessage, {
            path: "chat.users",
            select: "name pic email isVerified isOnline lastSeen",
        });

        // 4. Update latest message in chat
        await Chat.findByIdAndUpdate(chat._id, { latestMessage: aiMessage });

        // 5. Emit the AI response to the room
        io.in(chat._id).emit("stop typing", chat._id);
        io.in(chat._id).emit("message recieved", aiMessage);

    } catch (error) {
        console.error("Orbit AI Error:", error);
        io.in(chat._id).emit("stop typing", chat._id);
    }
};
