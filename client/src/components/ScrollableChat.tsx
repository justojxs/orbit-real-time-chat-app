import React, { useRef, useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { Check, CheckCheck, Trash2, Smile, Download, FileText, Mic } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";

const ScrollableChat = ({ messages, socket, activeMessageId, searchQuery, setMessages }: { messages: any[], socket: any, activeMessageId?: string, searchQuery?: string, setMessages?: any }) => {
    const { user, selectedChat } = useChatStore();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messageRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
    const [openReactionId, setOpenReactionId] = useState<string | null>(null);
    const [messageToDelete, setMessageToDelete] = useState<string | null>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (activeMessageId && messageRefs.current[activeMessageId]) {
            messageRefs.current[activeMessageId]?.scrollIntoView({ behavior: "smooth", block: "center" });
        } else {
            scrollToBottom();
        }
    }, [messages, activeMessageId]);

    const COMMON_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

    const handleReact = async (messageId: string, emoji: string) => {
        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                },
            };
            const { data } = await axios.put("/api/message/react", { messageId, emoji }, config);
            if (setMessages) {
                setMessages((prev: any[]) => prev.map(msg => msg._id === messageId ? { ...msg, reactions: data.reactions } : msg));
            }
            socket.emit("reaction updated", { messageId, reactions: data.reactions, chatId: selectedChat._id });
        } catch (error) {
            console.error("Reaction error:", error);
        }
    };

    const confirmDelete = async () => {
        if (!messageToDelete) return;
        const messageId = messageToDelete;
        setMessageToDelete(null); // Close the modal immediately for better UX

        try {
            // Optimistic Update
            if (setMessages) {
                setMessages((prev: any[]) => prev.map(msg =>
                    msg._id === messageId ? { ...msg, isDeleted: true, content: "This message was deleted" } : msg
                ));
            }
            const config = {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                },
            };
            await axios.put("/api/message/delete", { messageId }, config);
            socket.emit("message deleted", { messageId, chatId: selectedChat._id });
        } catch (error) {
            console.error("Delete error:", error);
        }
    };

    const highlightText = (text: string, highlight: string) => {
        if (!highlight.trim()) return text;
        const escapedHighlight = highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const parts = text.split(new RegExp(`(${escapedHighlight})`, "gi"));
        return (
            <span>
                {parts.map((part, i) => (
                    <span
                        key={i}
                        className={part.toLowerCase() === highlight.toLowerCase() ? "bg-emerald-500/40 text-white font-bold px-0.5 rounded" : ""}
                    >
                        {part}
                    </span>
                ))}
            </span>
        );
    };

    return (
        <div className="flex-1 overflow-y-auto px-6 space-y-6 custom-scrollbar flex flex-col pt-6 pb-12">
            <AnimatePresence initial={false}>
                {messages &&
                    messages.map((m, i) => {
                        const isMyMessage = m.sender._id === user._id;
                        const hasReactions = m.reactions && m.reactions.length > 0;
                        const isTarget = m._id === activeMessageId;

                        const messageDate = new Date(m.createdAt || Date.now()).toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
                        const previousMessageDate = i > 0 ? new Date(messages[i - 1].createdAt || Date.now()).toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' }) : null;
                        const showDateMarker = messageDate !== previousMessageDate;

                        return (
                            <React.Fragment key={m._id || i}>
                                {showDateMarker && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="flex justify-center my-6 w-full"
                                    >
                                        <span className="bg-black/20 backdrop-blur-3xl text-zinc-500 text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full border border-white/5 shadow-2xl">
                                            {messageDate === new Date().toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' }) ? "Today" : messageDate}
                                        </span>
                                    </motion.div>
                                )}
                                {m.isSystemMessage || m.content?.includes("has left the group") || m.content?.includes("was removed from") || m.content?.includes("was added to") ? (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="flex justify-center my-4 w-full"
                                        ref={(el) => (messageRefs.current[m._id] = el)}
                                    >
                                        <div className="bg-white/5 backdrop-blur-3xl border border-white/5 shadow-2xl px-6 py-2.5 rounded-full flex items-center justify-center">
                                            <span className="text-zinc-400 text-[11px] font-bold uppercase tracking-widest text-center">
                                                {m.content}
                                            </span>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        className={`flex w-full ${isMyMessage ? "justify-end" : "justify-start"} mb-4`}
                                        ref={(el) => (messageRefs.current[m._id] = el)}
                                    >
                                        <div className={`flex flex-col ${isMyMessage ? "items-end" : "items-start"} max-w-[80%] sm:max-w-[65%] transition-all ${isTarget ? 'scale-105' : ''}`}>
                                            <div
                                                className={`px-5 py-4 rounded-[1.5rem] text-[14px] shadow-2xl relative group transition-all ${isTarget ? 'ring-2 ring-emerald-500 ring-offset-4 ring-offset-[#0d0d12]' : ''} ${isMyMessage
                                                    ? "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-tr-none shadow-emerald-500/10"
                                                    : m.isDeleted
                                                        ? "bg-zinc-900/40 text-zinc-600 border border-white/5 italic"
                                                        : "bg-white/[0.04] backdrop-blur-3xl text-zinc-100 rounded-tl-none border border-white/[0.05] shadow-black/20"
                                                    }`}
                                            >
                                                {/* Action Menu (My Messages) */}
                                                {!m.isDeleted && (
                                                    <div className={`absolute top-0 ${isMyMessage ? '-left-12' : '-right-12'} opacity-100 flex flex-col gap-1`}>
                                                        <div className="relative">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setOpenReactionId(openReactionId === m._id ? null : m._id);
                                                                }}
                                                                className="p-2 bg-zinc-900/80 rounded-xl hover:text-emerald-500 transition-colors border border-white/5"
                                                            >
                                                                <Smile size={16} />
                                                            </button>
                                                            {openReactionId === m._id && (
                                                                <div className="absolute bottom-full mb-2 bg-[#121217] border border-white/10 p-1.5 rounded-2xl flex gap-1 shadow-2xl z-50">
                                                                    {COMMON_REACTIONS.map(emoji => (
                                                                        <button
                                                                            key={emoji}
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleReact(m._id, emoji);
                                                                                setOpenReactionId(null);
                                                                            }}
                                                                            className="hover:scale-125 transition-transform p-1 text-lg"
                                                                        >
                                                                            {emoji}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <button
                                                            onClick={() => setMessageToDelete(m._id)}
                                                            className="p-2 bg-zinc-900/80 rounded-xl hover:text-red-500 transition-colors border border-white/5"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                )}

                                                {/* Attachment Handling */}
                                                {!m.isDeleted && m.image && (
                                                    <div className="mb-3 -mx-2 -mt-2 rounded-[1rem] overflow-hidden border border-white/10 bg-black/40">
                                                        <img
                                                            src={m.image}
                                                            alt="attachment"
                                                            className="w-full max-h-80 object-cover hover:scale-105 transition-transform duration-700 cursor-zoom-in"
                                                        />
                                                    </div>
                                                )}

                                                {!m.isDeleted && m.fileUrl && (
                                                    <div className="mb-3 -mx-2 -mt-2 bg-black/20 p-4 rounded-[1.2rem] border border-white/5 flex items-center gap-4 group/file">
                                                        <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                                                            <FileText size={24} />
                                                        </div>
                                                        <div className="flex-1 overflow-hidden">
                                                            <p className="text-xs font-bold text-white truncate max-w-[150px]">{m.fileName}</p>
                                                            <p className="text-[9px] uppercase font-black text-zinc-500 tracking-widest mt-0.5">{m.fileType?.split('/')[1] || 'FILE'}</p>
                                                        </div>
                                                        <a
                                                            href={m.fileUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="p-2.5 bg-white/5 hover:bg-emerald-500 hover:text-white rounded-lg transition-all"
                                                        >
                                                            <Download size={16} />
                                                        </a>
                                                    </div>
                                                )}

                                                {!m.isDeleted && m.audioUrl && (
                                                    <div className="mb-3 -mx-2 -mt-2 bg-black/20 p-3 rounded-[1.2rem] border border-white/5 flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400">
                                                            <Mic size={20} />
                                                        </div>
                                                        <div className="flex-1">
                                                            <audio
                                                                controls
                                                                src={m.audioUrl}
                                                                className="h-8 w-full brightness-90 contrast-125 saturate-150 rounded-full [&::-webkit-media-controls-enclosure]:bg-emerald-500/10 [&::-webkit-media-controls-panel]:bg-transparent"
                                                            />
                                                        </div>
                                                    </div>
                                                )}

                                                {m.content && (
                                                    <div className={`leading-relaxed font-medium tracking-tight ${m.isDeleted ? 'opacity-40' : ''}`}>
                                                        {searchQuery ? highlightText(m.content, searchQuery) : m.content}
                                                    </div>
                                                )}

                                                {/* Status Footer */}
                                                <div className={`flex items-center gap-2 mt-2 pt-1 ${isMyMessage ? 'justify-end' : 'justify-start'}`}>
                                                    <span className="text-[9px] font-bold uppercase tracking-[0.15em] opacity-50">
                                                        {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                                                    </span>
                                                    {isMyMessage && !m.isDeleted && (
                                                        <span className="flex items-center">
                                                            {m.readBy && (selectedChat.isGroupChat ? m.readBy.length >= selectedChat.users.length : m.readBy.length > 1) ? (
                                                                <CheckCheck size={16} className="text-emerald-300 stroke-[2.5]" />
                                                            ) : (
                                                                <Check size={16} className="text-white/80 stroke-[2.5]" />
                                                            )}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Reactions Display */}
                                            {hasReactions && (
                                                <div className={`flex flex-wrap gap-1 mt-1.5 ${isMyMessage ? 'justify-end' : 'justify-start'}`}>
                                                    {m.reactions.map((r: any, idx: number) => (
                                                        <div
                                                            key={idx}
                                                            className="bg-zinc-800/80 border border-white/5 px-2 py-0.5 rounded-full text-[12px] flex items-center shadow-lg cursor-default hover:scale-110 transition-transform"
                                                            title={r.user.name}
                                                        >
                                                            {r.emoji}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </React.Fragment>
                        );
                    })}
            </AnimatePresence>
            <div ref={messagesEndRef} className="pb-4" />

            {/* Custom Delete Confirmation Modal */}
            <AnimatePresence>
                {messageToDelete && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
                        onClick={() => setMessageToDelete(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 10 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 10 }}
                            className="bg-[#121217] w-full max-w-sm rounded-[2rem] border border-white/[0.08] shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-6 text-center space-y-4">
                                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto border border-red-500/20">
                                    <Trash2 size={28} className="text-red-500" />
                                </div>
                                <h3 className="text-xl font-bold text-white tracking-tight">Delete Message?</h3>
                                <p className="text-zinc-400 text-sm px-2">
                                    Are you sure you want to permanently delete this message for everyone in the chat? This action cannot be undone.
                                </p>
                            </div>
                            <div className="flex border-t border-white/[0.05] bg-white/[0.02]">
                                <button
                                    onClick={() => setMessageToDelete(null)}
                                    className="flex-1 py-4 text-zinc-400 font-medium hover:text-white hover:bg-white/[0.02] transition-colors border-r border-white/[0.05]"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="flex-1 py-4 text-red-500 font-bold hover:bg-red-500/10 transition-colors"
                                >
                                    Delete
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ScrollableChat;
