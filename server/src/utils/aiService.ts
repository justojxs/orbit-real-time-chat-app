import { GoogleGenerativeAI } from "@google/generative-ai";
import Message from "../models/messageModel";
import Chat from "../models/chatModel";
import User from "../models/userModel";

export const handleAIResponse = async (newMessage: any, io: any) => {
    const { content } = newMessage;
    // Extract chat ID reliably — the chat might be a populated object or just an ID
    const chatId = newMessage.chat?._id?.toString() || newMessage.chat?.toString();

    if (!chatId || !content) return;

    // Re-fetch the chat from the database with fully populated users
    // The socket payload may have stale or partially populated user data
    let chatDoc: any;
    try {
        chatDoc = await Chat.findById(chatId).populate("users", "name pic email isVerified isOnline lastSeen").lean();
    } catch (err) {
        console.error("Orbit AI: Failed to fetch chat document:", err);
        return;
    }

    if (!chatDoc || !chatDoc.users) {
        console.error("Orbit AI: Chat not found or has no users for chatId:", chatId);
        return;
    }

    // Helper to emit to all users in the chat
    const emitToUsers = (event: string, payload: any) => {
        chatDoc.users.forEach((u: any) => {
            const uid = u._id?.toString();
            if (uid) io.in(uid).emit(event, payload);
        });
    };

    // Find the Orbit AI user
    let orbitAI: any;
    try {
        orbitAI = await User.findOne({ email: "orbit-ai@orbit.app" });
    } catch (err) {
        console.error("Orbit AI: DB lookup failed:", err);
        return;
    }

    if (!orbitAI) {
        console.error("Orbit AI user not found in database");
        return;
    }

    // Emit typing indicator immediately
    emitToUsers("typing", chatId);

    // Immediately mark the incoming message as read by Orbit AI
    try {
        await Message.findByIdAndUpdate(newMessage._id, { $addToSet: { readBy: orbitAI._id } });
        emitToUsers("message read", { chatId: chatId, userId: orbitAI._id });
    } catch (err) {
        console.error("Orbit AI: Failed to mark message as read:", err);
    }

    try {
        const apiKey = process.env.GEMINI_API_KEY;
        let aiResponseText = "";

        if (!apiKey) {
            // Mock response when no API key is configured
            await new Promise(r => setTimeout(r, 1500));
            aiResponseText = "I'm Orbit AI! The GEMINI_API_KEY is not configured on the server, so I'm running in mock mode. How can I help you today?";
        } else {
            const genAI = new GoogleGenerativeAI(apiKey);

            // Fetch recent conversation context
            const history = await Message.find({
                chat: chatId,
                _id: { $ne: newMessage._id }
            })
                .sort({ createdAt: -1 })
                .limit(10)
                .populate("sender", "name email")
                .lean();

            history.reverse();

            // Build chat history with strict alternating user/model roles (Gemini requirement)
            const rawHistory = history
                .filter((m: any) => m.content && m.sender)
                .map((m: any) => ({
                    role: m.sender.email === "orbit-ai@orbit.app" ? "model" : "user",
                    parts: [{ text: m.content }],
                }));

            // Collapse consecutive same-role entries
            const cleanHistory: { role: string; parts: { text: string }[] }[] = [];
            for (const entry of rawHistory) {
                if (cleanHistory.length > 0 && cleanHistory[cleanHistory.length - 1].role === entry.role) {
                    cleanHistory[cleanHistory.length - 1].parts[0].text += "\n" + entry.parts[0].text;
                } else {
                    cleanHistory.push({ role: entry.role, parts: [{ text: entry.parts[0].text }] });
                }
            }

            // Ensure cleanHistory starts with "user" to maintain alternation with the prefix (User -> Model)
            if (cleanHistory.length > 0 && cleanHistory[0].role === "model") {
                cleanHistory.shift(); // Drop the model message so we start with user
            }

            // Ensure cleanHistory ends with "model" because the next action is a User sendMessage(content)
            if (cleanHistory.length > 0 && cleanHistory[cleanHistory.length - 1].role === "user") {
                // Append a dummy model acknowledgement to satisfy the Gemini constraint
                cleanHistory.push({ role: "model", parts: [{ text: "Acknowledged." }] });
            }

            const systemPrompt = "Your name is Orbit AI. You are the official AI assistant for the Orbit Chat application. You are helpful, professional, and slightly futuristic in your tone. You should answer questions clearly and can help with anything from coding to general knowledge. Keep responses concise.";

            // Retry logic with exponential backoff and model fallback
            const models = ["gemini-2.0-flash", "gemini-2.0-flash-lite"];
            const MAX_RETRIES = 3;
            let lastError: any = null;

            for (const modelName of models) {
                for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
                    try {
                        const model = genAI.getGenerativeModel({ model: modelName });
                        const chatSession = model.startChat({
                            history: [
                                { role: "user", parts: [{ text: `System Instruction: ${systemPrompt}` }] },
                                { role: "model", parts: [{ text: "Understood. I am Orbit AI. How can I assist you today?" }] },
                                ...cleanHistory,
                            ],
                        });

                        const timeoutPromise = new Promise<never>((_, reject) =>
                            setTimeout(() => reject(new Error("Gemini API timeout after 30s")), 30000)
                        );

                        const result = await Promise.race([
                            chatSession.sendMessage(content),
                            timeoutPromise,
                        ]);
                        const response = await result.response;
                        aiResponseText = response.text();
                        lastError = null;
                        break; // Success — exit retry loop
                    } catch (err: any) {
                        lastError = err;
                        // Only retry on rate limits (429), not on other errors
                        if (err?.status === 429 && attempt < MAX_RETRIES - 1) {
                            const backoffMs = Math.min(1000 * Math.pow(2, attempt), 8000);
                            console.log(`Orbit AI: Rate limited on ${modelName}, retrying in ${backoffMs}ms (attempt ${attempt + 1}/${MAX_RETRIES})`);
                            await new Promise(r => setTimeout(r, backoffMs));
                            continue;
                        }
                        break; // Non-retryable error or max retries reached — try next model
                    }
                }
                if (!lastError) break; // Success — exit model loop
                console.log(`Orbit AI: Model ${modelName} failed, trying fallback...`);
            }

            if (lastError) {
                throw lastError; // All models and retries exhausted
            }
        }

        // Save AI message to database
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

        // Update the chat's latest message
        await Chat.findByIdAndUpdate(chatId, { latestMessage: aiMessage });

        // Emit stop typing and the AI response to all users
        emitToUsers("stop typing", chatId);
        emitToUsers("message recieved", aiMessage);

    } catch (error: any) {
        console.error("Orbit AI Error:", error);

        // Give a more specific message if it's a rate limit issue vs. a general error
        const isRateLimit = error?.status === 429;
        const userMessage = isRateLimit
            ? "I'm experiencing high demand right now and need a moment to catch up. Please try again in a few seconds!"
            : "Sorry, I encountered an issue processing your message. Please try again in a moment.";

        // On any failure, still send a user-facing error message so the chat doesn't just hang
        try {
            let errorMessage: any = await Message.create({
                sender: orbitAI._id,
                content: userMessage,
                chat: chatId,
                readBy: [orbitAI._id],
            });

            errorMessage = await errorMessage.populate("sender", "name pic email isVerified isOnline");
            errorMessage = await errorMessage.populate("chat");
            errorMessage = await User.populate(errorMessage, {
                path: "chat.users",
                select: "name pic email isVerified isOnline lastSeen",
            });

            await Chat.findByIdAndUpdate(chatId, { latestMessage: errorMessage });

            emitToUsers("stop typing", chatId);
            emitToUsers("message recieved", errorMessage);
        } catch (fallbackErr) {
            console.error("Orbit AI fallback error:", fallbackErr);
            // Last resort: at minimum stop the typing indicator
            emitToUsers("stop typing", chatId);
        }
    }
};
