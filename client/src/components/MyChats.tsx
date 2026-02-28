import { useEffect, useState } from "react";
import api from "../lib/axios";
import { useChatStore } from "../store/useChatStore";
import { Plus, Pin, BadgeCheck } from "lucide-react";
import GroupChatModal from "./miscellaneous/GroupChatModal";
import { motion, AnimatePresence } from "framer-motion";

const MyChats = () => {
    const [loading, setLoading] = useState(true);
    const { selectedChat, setSelectedChat, user, chats, setChats, onlineUsers, notification } = useChatStore();

    // Fetches the user's list of active chat connections from the server.
    // Handles authorization payload requirements and triggers the loader state while fetching.
    const fetchChats = async () => {
        setLoading(true);
        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                },
            };
            const { data } = await api.get("/api/chat", config);
            setChats(data);
        } catch (error) {
            console.error("Failed to fetch chats");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchChats();
    }, []);

    // Resolves a basic string name representing the other participant in a one-on-one chat.
    // Relies on simple ID mapping to verify against the local connected user instance.
    const getSender = (users: any[]) => {
        return users[0]?._id === user?._id ? users[1]?.name : users[0]?.name;
    };

    // Extracts the entire user object containing the counterpart details from a one-on-one chat context array.
    // Useful for scenarios requiring the recipient's image profile, online status, or deeper nested props.
    const getSenderFull = (users: any[]) => {
        return users[0]?._id === user?._id ? users[1] : users[0];
    };

    // Derives an online active presence indicator boolean for the counterpart entity handling real-time synchronization lookup.
    // Silently ignores group chats where aggregated presence indicators scale poorly contextually.
    const isUserOnline = (chat: any) => {
        if (chat.isGroupChat) return false;
        const recipient = getSenderFull(chat.users);
        if (!recipient) return false;
        return onlineUsers[recipient._id]?.isOnline || recipient.isOnline;
    };

    // Communicates pinned status changes to the backend mapping array.
    // Issues a direct un-propagated API hit without altering immediate state, forcing a hard refresh via 'fetchChats()'.
    const togglePin = async (chatId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                },
            };
            await api.put("/api/chat/pin", { chatId }, config);
            fetchChats(); // Refresh
        } catch (error) {
            console.error("Failed to pin chat");
        }
    };

    // Sorting logic: Pinned chats first, then by updatedAt
    const sortedChats = chats ? [...chats].sort((a, b) => {
        const aPinned = a.pinnedBy?.includes(user?._id);
        const bPinned = b.pinnedBy?.includes(user?._id);
        if (aPinned && !bPinned) return -1;
        if (!aPinned && bPinned) return 1;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    }) : [];

    return (
        <div className={`flex flex-col items-center p-3 py-6 bg-[#0c0c0e]/60 backdrop-blur-xl w-full md:w-[32%] h-full border-r border-white/5 ${selectedChat ? "hidden md:flex" : "flex"}`}>
            <div className="pb-6 px-4 flex w-full justify-between items-center">
                <h1 className="text-2xl font-bold text-white tracking-tighter">Messages</h1>
                <GroupChatModal>
                    <button className="flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-4 py-2 rounded-xl border border-emerald-500/20 hover:bg-emerald-500/20 transition-all font-bold text-[10px] uppercase tracking-widest active:scale-95 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                        <Plus size={14} strokeWidth={3} /> New Group
                    </button>
                </GroupChatModal>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar w-full">
                <AnimatePresence initial={false}>
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-full text-zinc-400 gap-3">
                            <div className="w-8 h-8 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : sortedChats.length > 0 ? (
                        sortedChats.map((chat: any) => {
                            const isPinned = chat.pinnedBy?.includes(user?._id);
                            return (
                                <motion.div
                                    layout
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    onClick={() => setSelectedChat(chat)}
                                    key={chat._id}
                                    className={`cursor-pointer px-4 py-4 rounded-2xl transition-all border group relative overflow-hidden ${selectedChat?._id === chat._id
                                        ? "bg-white/[0.08] border-white/[0.1] shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
                                        : "bg-transparent border-transparent hover:bg-white/[0.04] hover:border-white/[0.05]"
                                        } active:scale-[0.98]`}
                                >
                                    {selectedChat?._id === chat._id && (
                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-emerald-500 rounded-full" />
                                    )}

                                    <div className="flex items-center gap-3 w-full">
                                        <div className="relative">
                                            {!chat.isGroupChat ? (
                                                <img
                                                    src={getSenderFull(chat.users)?.pic || "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg"}
                                                    className="w-12 h-12 rounded-full object-cover shadow-sm border border-white/5 flex-shrink-0"
                                                    alt="avatar"
                                                />
                                            ) : (
                                                <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-lg shadow-sm border border-emerald-500/30 flex-shrink-0">
                                                    {chat.chatName[0]?.toUpperCase()}
                                                </div>
                                            )}
                                            {isUserOnline(chat) && (
                                                <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-[#121214]"></div>
                                            )}
                                        </div>

                                        <div className="flex flex-col flex-1 overflow-hidden ml-1">
                                            <div className="flex justify-between items-center w-full">
                                                <h3 className="font-semibold text-[15px] text-white truncate max-w-[70%] flex items-center gap-1.5">
                                                    {!chat.isGroupChat
                                                        ? getSender(chat.users)
                                                        : chat.chatName}
                                                    {!chat.isGroupChat && (getSenderFull(chat.users) as any).isVerified && (
                                                        <BadgeCheck size={14} className="text-emerald-500 fill-emerald-500/10 shrink-0" />
                                                    )}
                                                </h3>
                                                <div className="flex items-center gap-2">
                                                    {isPinned && <Pin size={12} className="text-emerald-500 fill-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />}
                                                    <button
                                                        onClick={(e) => togglePin(chat._id, e)}
                                                        className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-white/10 rounded-lg transition-all text-zinc-500 hover:text-emerald-400"
                                                    >
                                                        <Pin size={14} className={isPinned ? "fill-current" : ""} />
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="flex justify-between items-center mt-1">
                                                {chat.latestMessage ? (
                                                    <p className={`text-xs truncate max-w-[80%] ${selectedChat?._id === chat._id ? 'text-zinc-200' : 'text-zinc-400'}`}>
                                                        <span className="font-medium opacity-80">{chat.latestMessage.sender?.name?.split(' ')[0]}: </span>
                                                        {chat.latestMessage.image ? "[Image]" : chat.latestMessage.fileUrl ? "[Document]" : chat.latestMessage.audioUrl ? "[Voice Note]" : chat.latestMessage.content}
                                                    </p>
                                                ) : (
                                                    <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest opacity-60">No messages yet</p>
                                                )}

                                                {notification.filter((n: any) => n.chat._id === chat._id).length > 0 && selectedChat?._id !== chat._id && (
                                                    <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.3)] shrink-0 ml-2">
                                                        <span className="text-[10px] text-white font-bold">{notification.filter((n: any) => n.chat._id === chat._id).length}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-zinc-500 opacity-60 text-center px-4 mt-8">
                            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                                <Plus size={24} className="text-zinc-400" />
                            </div>
                            <p className="text-sm font-medium">No active connections</p>
                            <p className="text-xs mt-1">Search for a user to start encrypting.</p>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default MyChats;
