import asyncHandler from "express-async-handler";
import Chat from "../models/chatModel";
import User from "../models/userModel";
import Message from "../models/messageModel";
import { Request, Response } from "express";

//@description     Create or fetch One to One Chat
//@route           POST /api/chat/
//@access          Protected
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
        .populate("users", "name pic email isOnline lastSeen")
        .populate("latestMessage");

    // @ts-ignore
    isChat = await User.populate(isChat, {
        path: "latestMessage.sender",
        select: "name pic email isOnline lastSeen",
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
                "-password"
            );
            res.status(200).json(FullChat);
        } catch (error: any) {
            res.status(400);
            throw new Error(error.message);
        }
    }
});

//@description     Fetch all chats for a user
//@route           GET /api/chat/
//@access          Protected
const fetchChats = asyncHandler(async (req: any, res: Response) => {
    try {
        const chats = await Chat.find({ users: { $elemMatch: { $eq: req.user._id } } })
            .populate("users", "name pic email isOnline lastSeen")
            .populate("groupAdmin", "name pic email isOnline lastSeen")
            .populate("latestMessage")
            .sort({ updatedAt: -1 });

        const results = await User.populate(chats, {
            path: "latestMessage.sender",
            select: "name pic email isOnline lastSeen",
        });

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

        const chatsWithUnread = results.map((chat: any) => {
            return {
                ...chat.toObject(),
                unreadCount: unreadMap[chat._id.toString()] || 0
            };
        });

        res.status(200).send(chatsWithUnread);
    } catch (error: any) {
        res.status(400);
        throw new Error(error.message);
    }
});

//@description     Toggle Pin Chat
//@route           PUT /api/chat/pin
//@access          Protected
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

//@description     Create New Group Chat
//@route           POST /api/chat/group
//@access          Protected
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
            .populate("users", "name pic email isOnline lastSeen")
            .populate("groupAdmin", "name pic email isOnline lastSeen");

        res.status(200).json(fullGroupChat);
    } catch (error: any) {
        res.status(400);
        throw new Error(error.message);
    }
});

//@description     Rename Group
//@route           PUT /api/chat/rename
//@access          Protected
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
        .populate("users", "name pic email isOnline lastSeen")
        .populate("groupAdmin", "name pic email isOnline lastSeen");

    if (!updatedChat) {
        res.status(404);
        throw new Error("Chat Not Found");
    } else {
        res.json(updatedChat);
    }
});

//@description     Remove user from Group
//@route           PUT /api/chat/groupremove
//@access          Protected
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
        .populate("users", "name pic email isOnline lastSeen")
        .populate("groupAdmin", "name pic email isOnline lastSeen");

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
                    select: "name pic email isOnline lastSeen",
                });

            await Chat.findByIdAndUpdate(chatId, { latestMessage: message });
            res.json({ removed, message });
        } catch (error: any) {
            res.status(400);
            throw new Error(error.message);
        }
    }
});

//@description     Add user to Group / Leave
//@route           PUT /api/chat/groupadd
//@access          Protected
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
        .populate("users", "name pic email isOnline lastSeen")
        .populate("groupAdmin", "name pic email isOnline lastSeen");

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
                    select: "name pic email isOnline lastSeen",
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
