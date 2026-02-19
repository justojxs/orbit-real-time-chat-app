import { useRef, useEffect } from "react";
import { useChatState } from "../context/ChatProvider";
import { Check, CheckCheck, Trash2, Smile, Download, FileText, File } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";

const ScrollableChat = ({ messages, socket }: { messages: any[], socket: any }) => {
    const { user, selectedChat } = useChatState();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const COMMON_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🔥"];

    const handleReact = async (messageId: string, emoji: string) => {
        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                },
            };
            const { data } = await axios.put("/api/message/react", { messageId, emoji }, config);
            socket.emit("reaction updated", { messageId, reactions: data.reactions, chatId: selectedChat._id });
        } catch (error) {
            console.error("Reaction error:", error);
        }
    };

    const handleDelete = async (messageId: string) => {
        if (!window.confirm("Delete this message?")) return;
        try {
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

    return (
        <div className="flex-1 overflow-y-auto px-6 space-y-6 custom-scrollbar flex flex-col pt-6 pb-12">
            <AnimatePresence initial={false}>
                {messages &&
                    messages.map((m, i) => {
                        const isMyMessage = m.sender._id === user._id;
                        const hasReactions = m.reactions && m.reactions.length > 0;

                        return (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                className={`flex ${isMyMessage ? "justify-end" : "justify-start"} mb-4`}
                                key={m._id || i}
                            >
                                <div className={`flex flex-col ${isMyMessage ? "items-end" : "items-start"} max-w-[80%] sm:max-w-[65%]`}>
                                    <div
                                        className={`px-5 py-4 rounded-[1.5rem] text-[14px] shadow-2xl relative group ${isMyMessage
                                            ? "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-tr-none shadow-emerald-500/10"
                                            : m.isDeleted
                                                ? "bg-zinc-900/40 text-zinc-600 border border-white/5 italic"
                                                : "bg-white/[0.04] backdrop-blur-3xl text-zinc-100 rounded-tl-none border border-white/[0.05] shadow-black/20"
                                            }`}
                                    >
                                        {/* Action Menu (My Messages) */}
                                        {!m.isDeleted && (
                                            <div className={`absolute top-0 ${isMyMessage ? '-left-12' : '-right-12'} opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1`}>
                                                <div className="relative group/reactions">
                                                    <button className="p-2 bg-zinc-900/80 rounded-xl hover:text-emerald-500 transition-colors border border-white/5">
                                                        <Smile size={16} />
                                                    </button>
                                                    <div className="absolute bottom-full mb-2 bg-[#121217] border border-white/10 p-1.5 rounded-2xl hidden group-hover/reactions:flex gap-1 shadow-2xl z-50">
                                                        {COMMON_REACTIONS.map(emoji => (
                                                            <button
                                                                key={emoji}
                                                                onClick={() => handleReact(m._id, emoji)}
                                                                className="hover:scale-125 transition-transform p-1 text-lg"
                                                            >
                                                                {emoji}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                                {isMyMessage && (
                                                    <button
                                                        onClick={() => handleDelete(m._id)}
                                                        className="p-2 bg-zinc-900/80 rounded-xl hover:text-red-500 transition-colors border border-white/5"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
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

                                        {m.content && (
                                            <div className={`leading-relaxed font-medium tracking-tight ${m.isDeleted ? 'opacity-40' : ''}`}>
                                                {m.content}
                                            </div>
                                        )}

                                        {/* Status Footer */}
                                        <div className={`flex items-center gap-2 mt-2 pt-1 ${isMyMessage ? 'justify-end' : 'justify-start'}`}>
                                            <span className="text-[9px] font-bold uppercase tracking-[0.15em] opacity-50">
                                                {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                                            </span>
                                            {isMyMessage && !m.isDeleted && (
                                                <span className="flex items-center">
                                                    {m.readBy && (selectedChat.isGroupChat ? m.readBy.length > 1 : m.readBy.length > 1) ? (
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
                                                    className="bg-zinc-800/80 border border-white/5 px-2 py-0.5 rounded-full text-[12px] flex items-center shadow-lg"
                                                    title={r.user.name}
                                                >
                                                    {r.emoji}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
            </AnimatePresence>
            <div ref={messagesEndRef} className="pb-4" />
        </div>
    );
};

export default ScrollableChat;
