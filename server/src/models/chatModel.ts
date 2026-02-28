import mongoose from "mongoose";

const chatSchema = new mongoose.Schema(
    {
        chatName: { type: String, trim: true },
        isGroupChat: { type: Boolean, default: false },
        users: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        latestMessage: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Message",
        },
        groupAdmin: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        pinnedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    },
    { timestamps: true }
);

// Index for fast chat lookups by user (used in fetchChats — called on every page load)
chatSchema.index({ users: 1, updatedAt: -1 });

const Chat = mongoose.model("Chat", chatSchema);

export default Chat;
