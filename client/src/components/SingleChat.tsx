import { useEffect, useState, useRef } from "react";
import { useChatState } from "../context/ChatProvider";
import axios from "axios";
import ScrollableChat from "./ScrollableChat";
import { Send, ArrowLeft, Loader2, Info, MoreVertical, Paperclip, FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ProfileModal from "./miscellaneous/ProfileModal";
import UpdateGroupChatModal from "./miscellaneous/UpdateGroupChatModal";

let selectedChatCompare: any;

const SingleChat = ({ fetchAgain, setFetchAgain }: { fetchAgain: boolean, setFetchAgain: any }) => {
    const [messages, setMessages] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [newMessage, setNewMessage] = useState("");
    const [typing, setTyping] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [uploadingFile, setUploadingFile] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [filePreview, setFilePreview] = useState<{ name: string, type: string } | null>(null);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isGroupOpen, setIsGroupOpen] = useState(false);

    const { user, selectedChat, setSelectedChat, notification, setNotification, socket, onlineUsers } = useChatState();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchMessages = async () => {
        if (!selectedChat || !socket) return;
        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                },
            };
            setLoading(true);
            const { data } = await axios.get(
                `/api/message/${selectedChat._id}`,
                config
            );
            setMessages(data);
            setLoading(false);
            socket.emit("join chat", selectedChat._id);
            socket.emit("read message", { chatId: selectedChat._id, userId: user._id });
        } catch (error: any) {
            console.error("Fetch messages error:", error);
        }
    };

    const sendMessage = async (event: any) => {
        if (event.key === "Enter" && newMessage && socket) {
            socket.emit("stop typing", selectedChat._id);
            try {
                const config = {
                    headers: {
                        "Content-type": "application/json",
                        Authorization: `Bearer ${user.token}`,
                    },
                };
                const messageToSend = newMessage;
                setNewMessage("");
                const { data } = await axios.post(
                    "/api/message",
                    {
                        content: messageToSend,
                        chatId: selectedChat._id,
                    },
                    config
                );
                socket.emit("new message", data);
                setMessages([...messages, data]);
            } catch (error: any) {
                console.error("Send message error:", error);
            }
        }
    };

    const handleFileUpload = async (e: any) => {
        if (!socket) return;
        const file = e.target.files[0];
        if (!file) return;

        const isImage = file.type.startsWith("image/");
        if (isImage) {
            const reader = new FileReader();
            reader.onload = (e) => setImagePreview(e.target?.result as string);
            reader.readAsDataURL(file);
        } else {
            setFilePreview({ name: file.name, type: file.type });
        }

        setUploadingFile(true);

        const data = new FormData();
        data.append("file", file);
        data.append("upload_preset", "chat-app");
        data.append("cloud_name", "dencovhau");

        try {
            const res = await fetch(`https://api.cloudinary.com/v1_1/dencovhau/${isImage ? 'image' : 'raw'}/upload`, {
                method: "POST",
                body: data,
            });
            if (!res.ok) throw new Error("Cloudinary upload failed");
            const cloudData = await res.json();
            const fileUrl = cloudData.secure_url || cloudData.url;

            const config = {
                headers: {
                    "Content-type": "application/json",
                    Authorization: `Bearer ${user.token}`,
                },
            };

            const payload: any = {
                chatId: selectedChat._id,
                content: ""
            };

            if (isImage) {
                payload.image = fileUrl;
            } else {
                payload.fileUrl = fileUrl;
                payload.fileName = file.name;
                payload.fileType = file.type;
            }

            const { data: messageData } = await axios.post("/api/message", payload, config);

            socket.emit("new message", messageData);
            setMessages((prev) => [...prev, messageData]);
            setImagePreview(null);
            setFilePreview(null);
        } catch (error: any) {
            console.error("Upload error:", error);
            alert("Failed to send file");
            setImagePreview(null);
            setFilePreview(null);
        } finally {
            setUploadingFile(false);
        }
    };

    useEffect(() => {
        if (!socket) return;

        socket.on("typing", (room: string) => {
            if (selectedChatCompare && selectedChatCompare._id === room) {
                setIsTyping(true);
            }
        });
        socket.on("stop typing", (room: string) => {
            if (selectedChatCompare && selectedChatCompare._id === room) {
                setIsTyping(false);
            }
        });

        socket.on("message recieved", (newMessageRecieved: any) => {
            if (!selectedChatCompare || selectedChatCompare._id !== newMessageRecieved.chat._id) {
                if (!notification.includes(newMessageRecieved)) {
                    setNotification([newMessageRecieved, ...notification]);
                    setFetchAgain(!fetchAgain);
                }
            } else {
                setMessages((prev) => [...prev, newMessageRecieved]);
                socket.emit("read message", { chatId: selectedChatCompare._id, userId: user._id });
            }
        });

        socket.on("message read", (data: any) => {
            if (selectedChatCompare && selectedChatCompare._id === data.chatId) {
                setMessages((prev) => prev.map(msg => {
                    if (msg.sender._id !== data.userId && (msg.readBy && !msg.readBy.includes(data.userId))) {
                        return { ...msg, readBy: [...(msg.readBy || []), data.userId] };
                    }
                    return msg;
                }));
            }
        });

        socket.on("message deleted", (data: any) => {
            if (selectedChatCompare && selectedChatCompare._id === data.chatId) {
                setMessages((prev) => prev.map(msg =>
                    msg._id === data.messageId ? { ...msg, isDeleted: true, content: "This message was deleted" } : msg
                ));
            }
        });

        socket.on("reaction updated", (data: any) => {
            if (selectedChatCompare && selectedChatCompare._id === data.chatId) {
                setMessages((prev) => prev.map(msg =>
                    msg._id === data.messageId ? { ...msg, reactions: data.reactions } : msg
                ));
            }
        });

        return () => {
            socket.off("message recieved");
            socket.off("message read");
            socket.off("message deleted");
            socket.off("reaction updated");
            socket.off("typing");
            socket.off("stop typing");
        }
    }, [socket, notification, fetchAgain, setFetchAgain]);

    useEffect(() => {
        fetchMessages();
        selectedChatCompare = selectedChat;
    }, [selectedChat, socket]);

    const typingHandler = (e: any) => {
        setNewMessage(e.target.value);
        if (!socket) return;
        if (!typing) {
            setTyping(true);
            socket.emit("typing", selectedChat._id);
        }
        let lastTypingTime = new Date().getTime();
        var timerLength = 3000;
        setTimeout(() => {
            var timeNow = new Date().getTime();
            var timeDiff = timeNow - lastTypingTime;
            if (timeDiff >= timerLength && typing) {
                socket.emit("stop typing", selectedChat._id);
                setTyping(false);
            }
        }, timerLength);
    };

    const getSender = (loggedUser: any, users: any[]) => {
        return users[0]?._id === loggedUser?._id ? users[1]?.name : users[0]?.name;
    };

    const getSenderFull = (loggedUser: any, users: any[]) => {
        return users[0]?._id === loggedUser?._id ? users[1] : users[0];
    };

    const formatLastSeen = (dateString?: string) => {
        if (!dateString) return "Offline";
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) return "Just now";
        const diffInMins = Math.floor(diffInSeconds / 60);

        if (diffInMins < 60) return `${diffInMins}m ago`;
        if (diffInMins < 1440) return `${Math.floor(diffInMins / 60)}h ago`;
        return date.toLocaleDateString();
    };

    const getStatus = () => {
        if (!selectedChat || selectedChat.isGroupChat) return null;
        const sender = getSenderFull(user, selectedChat.users);
        const presence = onlineUsers[sender._id] || { isOnline: sender.isOnline, lastSeen: sender.lastSeen };

        if (isTyping) return "Typing...";
        if (presence.isOnline) return "Online";

        // Only show last seen if they are truly offline
        const lastSeenTime = formatLastSeen(presence.lastSeen);
        return lastSeenTime === "Offline" ? "Offline" : `Last seen ${lastSeenTime}`;
    };

    return (
        <div className="w-full h-full flex flex-col pt-0 relative overflow-hidden">
            {selectedChat ? (
                <>
                    <div className="px-8 py-5 flex justify-between items-center w-full bg-white/[0.02] border-b border-white/[0.05] relative z-20">
                        <div className="flex items-center gap-4 flex-1">
                            <button
                                className="md:hidden flex items-center justify-center w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-zinc-300 transition-colors mr-1"
                                onClick={() => setSelectedChat("")}
                            >
                                <ArrowLeft size={18} />
                            </button>
                            {!selectedChat.isGroupChat ? (
                                <>
                                    <div className="relative group">
                                        <div className="absolute inset-0 bg-emerald-500/20 blur-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                        <img
                                            src={getSenderFull(user, selectedChat.users).pic}
                                            className="w-10 h-10 rounded-full object-cover relative border border-white/10"
                                            alt="avatar"
                                        />
                                        <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#121214] transition-colors ${getStatus() === 'Online' || isTyping ? 'bg-emerald-500' : 'bg-zinc-600'}`}></div>
                                    </div>
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-white tracking-tight">{getSender(user, selectedChat.users)}</span>
                                            <button
                                                onClick={() => setIsProfileOpen(true)}
                                                className="p-1 text-zinc-600 hover:text-emerald-500 transition-colors bg-white/5 hover:bg-emerald-500/10 rounded-lg outline-none"
                                                title="View User Details"
                                            >
                                                <Info size={14} />
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <div className={`w-1.5 h-1.5 rounded-full ${getStatus() === 'Online' || isTyping ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'}`}></div>
                                            <span className={`text-[10px] uppercase font-bold tracking-widest ${getStatus() === 'Online' || isTyping ? 'text-emerald-400' : 'text-zinc-500'}`}>
                                                {getStatus()}
                                            </span>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-bold text-lg border border-emerald-500/20">
                                        {selectedChat.chatName[0]?.toUpperCase()}
                                    </div>
                                    <div className="flex flex-col text-left">
                                        <span className="font-bold text-white tracking-tight">{selectedChat.chatName}</span>
                                        <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 mt-0.5">Community Channel</span>
                                    </div>
                                </>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => selectedChat.isGroupChat ? setIsGroupOpen(true) : setIsProfileOpen(true)}
                                className="p-2.5 text-zinc-500 hover:text-white transition-colors bg-white/0 hover:bg-white/5 rounded-xl border border-transparent hover:border-white/5"
                            >
                                <Info size={20} />
                            </button>
                            <button
                                onClick={() => selectedChat.isGroupChat ? setIsGroupOpen(true) : setIsProfileOpen(true)}
                                className="p-2.5 text-zinc-500 hover:text-white transition-colors bg-white/0 hover:bg-white/5 rounded-xl border border-transparent hover:border-white/5"
                            >
                                <MoreVertical size={20} />
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col w-full overflow-hidden relative bg-black/10">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center h-full gap-4">
                                <Loader2 className="animate-spin text-emerald-500/50" size={32} />
                                <span className="text-[10px] uppercase font-bold tracking-[0.3em] text-zinc-600">Syncing Stream</span>
                            </div>
                        ) : (
                            <ScrollableChat messages={messages} socket={socket} />
                        )}
                    </div>

                    <div className="p-6 pt-2 mt-auto relative z-20">
                        <AnimatePresence>
                            {(imagePreview || filePreview) && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="absolute bottom-full mb-6 left-8"
                                >
                                    <div className="relative group">
                                        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-emerald-500/40 blur-2xl rounded-full"></div>
                                        {imagePreview ? (
                                            <img
                                                src={imagePreview}
                                                alt="preview"
                                                className="w-32 h-32 object-cover rounded-3xl border-2 border-emerald-500/50 relative z-10 shadow-[0_20px_50px_rgba(16,185,129,0.3)]"
                                            />
                                        ) : (
                                            <div className="w-32 h-32 bg-[#121217] rounded-3xl border-2 border-emerald-500/50 relative z-10 flex flex-col items-center justify-center p-4">
                                                <FileText className="text-emerald-500 mb-2" size={32} />
                                                <p className="text-[8px] text-white truncate w-full text-center font-bold uppercase">{filePreview?.name}</p>
                                            </div>
                                        )}
                                        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 rounded-3xl backdrop-blur-[1px]">
                                            <Loader2 className="text-emerald-400 animate-spin" size={24} />
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="relative group/input">
                            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-[2rem] blur opacity-0 group-focus-within/input:opacity-100 transition-opacity duration-500"></div>
                            <div className="relative flex items-center gap-3 bg-zinc-900/80 backdrop-blur-2xl border border-white/5 rounded-[2rem] p-2 pl-6 shadow-2xl">
                                <button
                                    className="text-zinc-500 hover:text-emerald-400 transition-colors p-2"
                                    onClick={() => fileInputRef.current?.click()}
                                    title="Attach File"
                                    disabled={uploadingFile}
                                >
                                    <Paperclip size={20} className={uploadingFile ? "animate-pulse" : ""} />
                                </button>
                                <input
                                    type="file"
                                    className="hidden"
                                    ref={fileInputRef}
                                    onChange={handleFileUpload}
                                />
                                <input
                                    className="flex-1 bg-transparent border-none outline-none text-white text-sm py-3 placeholder:text-zinc-600 placeholder:font-medium selection:bg-emerald-500/30"
                                    placeholder="Secure encryption enabled..."
                                    onKeyDown={sendMessage}
                                    value={newMessage}
                                    onChange={typingHandler}
                                />
                                <button
                                    onClick={() => sendMessage({ key: "Enter" })}
                                    disabled={!newMessage.trim()}
                                    className="p-3.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-[1.5rem] transition-all shadow-[0_0_30px_rgba(16,185,129,0.3)] disabled:opacity-50 disabled:shadow-none disabled:bg-zinc-800 disabled:text-zinc-600 active:scale-95"
                                >
                                    <Send size={18} />
                                </button>
                            </div>
                        </div>
                    </div>

                    <ProfileModal
                        user={getSenderFull(user, selectedChat.users)}
                        isOpen={isProfileOpen}
                        onClose={() => setIsProfileOpen(false)}
                    />

                    {selectedChat.isGroupChat && (
                        <UpdateGroupChatModal
                            fetchAgain={fetchAgain}
                            setFetchAgain={setFetchAgain}
                            fetchMessages={fetchMessages}
                            isOpen={isGroupOpen}
                            onClose={() => setIsGroupOpen(false)}
                            socket={socket}
                        />
                    )}
                </>
            ) : (
                <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-[#0d0d12]">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="max-w-md"
                    >
                        <div className="w-24 h-24 bg-emerald-500/10 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 border border-emerald-500/20 shadow-[0_0_50px_rgba(16,185,129,0.1)]">
                            <Send size={40} className="text-emerald-500" />
                        </div>
                        <h2 className="text-4xl font-bold text-white tracking-tighter mb-4">Select a Conversation</h2>
                        <p className="text-zinc-500 font-medium leading-relaxed">
                            Pick an identity to begin a high-fidelity cryptographic stream.
                            End-to-end encryption is active for all sectors.
                        </p>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default SingleChat;
