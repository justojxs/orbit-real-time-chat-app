import mongoose from "mongoose";
import dotenv from "dotenv";
import Message from "./src/models/messageModel";

dotenv.config();

mongoose.connect(process.env.MONGO_URI || "").then(async () => {
    const messages = await Message.find().sort({ createdAt: -1 }).limit(5);
    messages.forEach(m => console.log(m.content, JSON.stringify(m.readBy)));
    process.exit(0);
});
