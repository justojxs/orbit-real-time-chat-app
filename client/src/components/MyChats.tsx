import { useEffect, useState } from "react";
import api from "../lib/axios";
import { useChatStore } from "../store/useChatStore";
import { Plus, Pin, BadgeCheck, MessageSquare } from "lucide-react";
import GroupChatModal from "./miscellaneous/GroupChatModal";
import { motion, AnimatePresence } from "framer-motion";

// Compact relative time formatter
const formatRelativeTime = (dateStr: string) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "now";
    if (diffMins < 60) return `${diffMins}m`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h`;
    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays < 7) return date.toLocaleDateString([], { weekday: 'short' });
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

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
        <div className={`flex flex-col p-0 bg-white/80 dark:bg-[#0a0a0f]/80 backdrop-blur-sm w-full md:w-[32%] h-full border-r border-gray-200/60 dark:border-white/[0.04] ${selectedChat ? "hidden md:flex" : "flex"}`}>
            <div className="py-5 px-5 flex w-full justify-between items-center border-b border-gray-200/60 dark:border-white/[0.04]">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Messages</h1>
                    {sortedChats.length > 0 && (
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400 dark:text-zinc-500 mt-0.5">{sortedChats.length} conversation{sortedChats.length !== 1 ? 's' : ''}</p>
                    )}
                </div>
                <GroupChatModal>
                    <button className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-3.5 py-2 rounded-xl border border-emerald-200 hover:bg-emerald-100 transition-all font-bold text-[10px] uppercase tracking-widest active:scale-95">
                        <Plus size={14} strokeWidth={2.5} /> Group
                    </button>
                </GroupChatModal>
            </div>

            <div className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5 custom-scrollbar w-full">
                <AnimatePresence initial={false}>
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-zinc-500 gap-3">
                            <div className="w-7 h-7 border-2 border-gray-300 dark:border-white/10 border-t-emerald-500 rounded-full animate-spin"></div>
                        </div>
                    ) : sortedChats.length > 0 ? (
                        sortedChats.map((chat: any) => {
                            const isPinned = chat.pinnedBy?.includes(user?._id);
                            const isActive = selectedChat?._id === chat._id;
                            const unreadCount = notification.filter((n: any) => n.chat._id === chat._id).length;
                            const hasUnread = unreadCount > 0 && !isActive;
                            return (
                                <motion.div
                                    layout
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    onClick={() => setSelectedChat(chat)}
                                    key={chat._id}
                                    className={`cursor-pointer px-3 py-3 rounded-xl transition-all border group relative ${isActive
                                        ? "bg-emerald-50 border-emerald-200/60"
                                        : "bg-transparent border-transparent hover:bg-gray-50 dark:bg-[#0e0e13] dark:hover:bg-white/5"
                                        } active:scale-[0.99]`}
                                >
                                    {isActive && (
                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-emerald-500 rounded-r-full" />
                                    )}

                                    <div className="flex items-center gap-3 w-full">
                                        <div className="relative flex-shrink-0">
                                            {!chat.isGroupChat ? (
                                                <img
                                                    src={getSenderFull(chat.users)?.pic || "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg"}
                                                    className="w-11 h-11 rounded-full object-cover border border-gray-200 dark:border-white/5"
                                                    alt="avatar"
                                                />
                                            ) : (
                                                <div className="w-11 h-11 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold text-base border border-emerald-200">
                                                    {chat.chatName[0]?.toUpperCase()}
                                                </div>
                                            )}
                                            {isUserOnline(chat) && (
                                                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white"></div>
                                            )}
                                        </div>

                                        <div className="flex flex-col flex-1 overflow-hidden min-w-0">
                                            <div className="flex justify-between items-center w-full gap-2">
                                                <h3 className={`font-semibold text-[14px] truncate flex items-center gap-1.5 ${isActive ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-zinc-200'}`}>
                                                    {!chat.isGroupChat
                                                        ? getSender(chat.users)
                                                        : chat.chatName}
                                                    {!chat.isGroupChat && (getSenderFull(chat.users) as any)?.isVerified && (
                                                        <BadgeCheck size={13} className="text-emerald-500 fill-emerald-500/10 shrink-0" />
                                                    )}
                                                </h3>
                                                <div className="flex items-center gap-1.5 shrink-0">
                                                    {isPinned && <Pin size={10} className="text-emerald-500/60 fill-emerald-500/20" />}
                                                    <span className={`text-[10px] font-medium tabular-nums ${hasUnread ? 'text-emerald-600' : 'text-gray-400 dark:text-zinc-500'}`}>
                                                        {chat.latestMessage ? formatRelativeTime(chat.latestMessage.createdAt || chat.updatedAt) : ''}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex justify-between items-center mt-0.5">
                                                {chat.latestMessage ? (
                                                    <p className={`text-xs truncate ${hasUnread ? 'text-gray-700 dark:text-zinc-200 font-medium' : 'text-gray-400 dark:text-zinc-500'}`}>
                                                        <span className="opacity-60">{chat.latestMessage.sender?.name?.split(' ')[0]}: </span>
                                                        {chat.latestMessage.image ? "Sent a photo" : chat.latestMessage.fileUrl ? "Shared a file" : chat.latestMessage.audioUrl ? "Voice message" : chat.latestMessage.content}
                                                    </p>
                                                ) : (
                                                    <p className="text-[11px] text-gray-400 dark:text-zinc-500 italic">No messages yet</p>
                                                )}

                                                {hasUnread && (
                                                    <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 ml-2">
                                                        <span className="text-[10px] text-white font-bold">{unreadCount}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Pin button on hover */}
                                        <button
                                            onClick={(e) => togglePin(chat._id, e)}
                                            className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-gray-100 dark:bg-white/5 dark:hover:bg-white/10 rounded-lg transition-all text-gray-400 dark:text-zinc-500 hover:text-emerald-500 shrink-0"
                                        >
                                            <Pin size={13} className={isPinned ? "fill-current" : ""} />
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center px-6 py-16">
                            <div className="w-14 h-14 rounded-2xl bg-gray-50 dark:bg-[#0e0e13] flex items-center justify-center mb-5 border border-gray-200 dark:border-white/5">
                                <MessageSquare size={22} className="text-gray-400 dark:text-zinc-500" />
                            </div>
                            <p className="text-sm font-semibold text-gray-700 dark:text-zinc-200 mb-1">No conversations yet</p>
                            <p className="text-xs text-gray-400 dark:text-zinc-500 leading-relaxed">Search for a user or create a group to get started.</p>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default MyChats;
