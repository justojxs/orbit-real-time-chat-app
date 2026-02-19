import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
    {
        sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        content: { type: String, trim: true },
        image: { type: String, trim: true },
        fileUrl: { type: String, trim: true },
        fileName: { type: String, trim: true },
        fileType: { type: String, trim: true },
        chat: { type: mongoose.Schema.Types.ObjectId, ref: "Chat" },
        readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
        isDeleted: { type: Boolean, default: false },
        reactions: [
            {
                user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
                emoji: { type: String },
            },
        ],
    },
    { timestamps: true }
);

// Index for fast retrieval of latest messages in a chat
messageSchema.index({ chat: 1, createdAt: -1 });
// Index for unread messages count
messageSchema.index({ chat: 1, readBy: 1 });

const Message = mongoose.model("Message", messageSchema);

export default Message;
