import asyncHandler from "express-async-handler";
import Chat from "../models/chatModel";
import User from "../models/userModel";
import Message from "../models/messageModel";
import { Request, Response } from "express";

// Fetches a one-to-one chat between the logged-in user and a specified user ID.
// If the chat doesn't exist yet, it provisions and creates a new one-to-one room dynamically.
// Populates all required user fields (like 'isOnline') for client-side state management.
const accessChat = asyncHandler(async (req: any, res: Response) => {
    const { userId } = req.body;

    if (!userId) {
        console.log("UserId param not sent with request");
        res.sendStatus(400);
        return;
    }

    var isChat = await Chat.find({
        isGroupChat: false,
        $and: [
            { users: { $elemMatch: { $eq: req.user._id } } },
            { users: { $elemMatch: { $eq: userId } } },
        ],
    })
        .populate("users", "name pic email isOnline lastSeen isVerified")
        .populate("latestMessage");

    // @ts-ignore
    isChat = await User.populate(isChat, {
        path: "latestMessage.sender",
        select: "name pic email isOnline lastSeen isVerified",
    });

    if (isChat.length > 0) {
        res.send(isChat[0]);
    } else {
        var chatData = {
            chatName: "sender",
            isGroupChat: false,
            users: [req.user._id, userId],
        };

        try {
            const createdChat = await Chat.create(chatData);
            const FullChat = await Chat.findOne({ _id: createdChat._id }).populate(
                "users",
                "name pic email isOnline lastSeen isVerified"
            );
            res.status(200).json(FullChat);
        } catch (error: any) {
            res.status(400);
            throw new Error(error.message);
        }
    }
});

// Looks up every chat room (One-to-One and Group) that the requester is a participant of.
// Aggregates unread message counts for each chat using a specialized MongoDB aggregation pipeline.
// Injects the unread counts into the chat object so the client can display notification badges accurately.
const fetchChats: any = asyncHandler(async (req: any, res: Response): Promise<void> => {
    try {
        // lean() returns plain JS objects — skips Mongoose document hydration for faster serialization
        const chats = await Chat.find({ users: { $elemMatch: { $eq: req.user._id } } })
            .populate("users", "name pic email isOnline lastSeen isVerified")
            .populate("groupAdmin", "name pic email isOnline lastSeen isVerified")
            .populate("latestMessage")
            .sort({ updatedAt: -1 })
            .lean();

        const results = await User.populate(chats, {
            path: "latestMessage.sender",
            select: "name pic email isOnline lastSeen isVerified",
        });

        // Skip aggregation entirely if user has no chats yet
        if (results.length === 0) {
            res.status(200).send([]);
            return;
        }

        const chatIds = results.map((chat: any) => chat._id);

        const unreadCounts = await Message.aggregate([
            {
                $match: {
                    chat: { $in: chatIds },
                    sender: { $ne: req.user._id },
                    readBy: { $ne: req.user._id }
                }
            },
            {
                $group: {
                    _id: "$chat",
                    count: { $sum: 1 }
                }
            }
        ]);

        const unreadMap: any = {};
        unreadCounts.forEach(item => {
            unreadMap[item._id.toString()] = item.count;
        });

        // Already lean objects, no need for .toObject()
        const chatsWithUnread = results.map((chat: any) => ({
            ...chat,
            unreadCount: unreadMap[chat._id.toString()] || 0
        }));

        // Ensure Orbit AI chat exists for this user in their list by default
        const orbitAI = await User.findOne({ email: "orbit-ai@orbit.app" });
        if (orbitAI) {
            const hasOrbitChat = results.some((chat: any) =>
                !chat.isGroupChat && chat.users.some((u: any) => u.email === "orbit-ai@orbit.app")
            );

            if (!hasOrbitChat) {
                // Background ensure: Create the chat document if it doesn't exist
                let newOrbitChat: any = await Chat.findOne({
                    isGroupChat: false,
                    $and: [
                        { users: { $elemMatch: { $eq: req.user._id } } },
                        { users: { $elemMatch: { $eq: orbitAI._id } } },
                    ],
                });

                if (!newOrbitChat) {
                    newOrbitChat = await Chat.create({
                        chatName: "Orbit AI",
                        isGroupChat: false,
                        users: [req.user._id, orbitAI._id],
                    });
                }

                // Return fresh list for new user/connection
                return fetchChats(req, res);
            }
        }

        res.status(200).send(chatsWithUnread);
    } catch (error: any) {
        res.status(400);
        throw new Error(error.message);
    }
});

// Modifies the 'pinnedBy' array of a specific chat document.
// If the logged-in user already has the chat pinned, their ID is pulled from the array.
// If not pinned, their ID is pushed, allowing users to independently pin/unpin shared chats.
const togglePin = asyncHandler(async (req: any, res: Response) => {
    const { chatId } = req.body;
    const chat = await Chat.findById(chatId);

    if (!chat) {
        res.status(404);
        throw new Error("Chat Not Found");
    }

    const isPinned = chat.pinnedBy.includes(req.user._id);
    let updatedChat;

    if (isPinned) {
        updatedChat = await Chat.findByIdAndUpdate(chatId, { $pull: { pinnedBy: req.user._id } }, { new: true });
    } else {
        updatedChat = await Chat.findByIdAndUpdate(chatId, { $push: { pinnedBy: req.user._id } }, { new: true });
    }

    res.status(200).json(updatedChat);
});

// Creates a new group chat context containing the requesting user and a provided array of members.
// Validates that there are at least two additional members before creating the chat object.
// The requester is automatically appended to the users list and designated as the group admin.
const createGroupChat = asyncHandler(async (req: any, res: Response) => {
    if (!req.body.users || !req.body.name) {
        res.status(400).send({ message: "Please Fill all the feilds" });
        return;
    }

    var users = JSON.parse(req.body.users);

    if (users.length < 2) {
        res
            .status(400)
            .send("More than 2 users are required to form a group chat");
        return;
    }

    users.push(req.user);

    try {
        const groupChat = await Chat.create({
            chatName: req.body.name,
            users: users,
            isGroupChat: true,
            groupAdmin: req.user,
        });

        const fullGroupChat = await Chat.findOne({ _id: groupChat._id })
            .populate("users", "name pic email isOnline lastSeen isVerified")
            .populate("groupAdmin", "name pic email isOnline lastSeen isVerified");

        res.status(200).json(fullGroupChat);
    } catch (error: any) {
        res.status(400);
        throw new Error(error.message);
    }
});

// Renames an existing group chat by updating the 'chatName' property in MongoDB.
// Returns the updated Chat object enriched with user profiles so the UI correctly displays the new state.
const renameGroup = asyncHandler(async (req: Request, res: Response) => {
    const { chatId, chatName } = req.body;

    const updatedChat = await Chat.findByIdAndUpdate(
        chatId,
        {
            chatName: chatName,
        },
        {
            new: true,
        }
    )
        .populate("users", "name pic email isOnline lastSeen isVerified")
        .populate("groupAdmin", "name pic email isOnline lastSeen isVerified");

    if (!updatedChat) {
        res.status(404);
        throw new Error("Chat Not Found");
    } else {
        res.json(updatedChat);
    }
});

// Removes a user from a group's participant array.
// Used both when an admin kicks someone out or when a member leaves the group voluntarily.
// Also generates an automated system message in the chat signaling the departure/removal.
const removeFromGroup = asyncHandler(async (req: any, res: Response) => {
    const { chatId, userId } = req.body;

    const removed = await Chat.findByIdAndUpdate(
        chatId,
        {
            $pull: { users: userId },
        },
        {
            new: true,
        }
    )
        .populate("users", "name pic email isOnline lastSeen isVerified")
        .populate("groupAdmin", "name pic email isOnline lastSeen isVerified");

    if (!removed) {
        res.status(404);
        throw new Error("Chat Not Found");
    } else {
        // Create a notification message
        const targetUser = await User.findById(userId);
        const isSelf = req.user._id.toString() === userId.toString();
        const notificationContent = isSelf
            ? `${targetUser?.name} has left the group`
            : `${targetUser?.name} was removed from the group`;

        try {
            let message: any = await Message.create({
                sender: req.user._id,
                content: notificationContent,
                chat: chatId,
                isSystemMessage: true,
            });

            message = await Message.findById(message._id)
                .populate("sender", "name pic")
                .populate("chat")
                .populate({
                    path: "chat.users",
                    select: "name pic email isOnline lastSeen isVerified",
                });

            await Chat.findByIdAndUpdate(chatId, { latestMessage: message });
            res.json({ removed, message });
        } catch (error: any) {
            res.status(400);
            throw new Error(error.message);
        }
    }
});

// Checks membership status and pushes a newly added user into the group's 'users' array.
// Automatically fires a system-generated tracking message into the chat announcing the arrival of the new user.
const addToGroup = asyncHandler(async (req: any, res: Response) => {
    const { chatId, userId } = req.body;

    // check if the requester is admin

    const added = await Chat.findByIdAndUpdate(
        chatId,
        {
            $push: { users: userId },
        },
        {
            new: true,
        }
    )
        .populate("users", "name pic email isOnline lastSeen isVerified")
        .populate("groupAdmin", "name pic email isOnline lastSeen isVerified");

    if (!added) {
        res.status(404);
        throw new Error("Chat Not Found");
    } else {
        // Create a notification message
        const targetUser = await User.findById(userId);
        const notificationContent = `${targetUser?.name} was added to the group`;

        try {
            let message: any = await Message.create({
                sender: req.user._id, // Assume the person hitting the endpoint is the admin who added
                content: notificationContent,
                chat: chatId,
                isSystemMessage: true,
            });

            message = await Message.findById(message._id)
                .populate("sender", "name pic")
                .populate("chat")
                .populate({
                    path: "chat.users",
                    select: "name pic email isOnline lastSeen isVerified",
                });

            await Chat.findByIdAndUpdate(chatId, { latestMessage: message });
            res.json({ added, message });
        } catch (error: any) {
            res.status(400);
            throw new Error(error.message);
        }
    }
});

export {
    accessChat,
    fetchChats,
    createGroupChat,
    renameGroup,
    addToGroup,
    removeFromGroup,
    togglePin,
};
