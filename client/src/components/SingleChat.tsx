import { useEffect, useState, useRef } from "react";
import { useChatStore } from "../store/useChatStore";
import api from "../lib/axios";
import ScrollableChat from "./ScrollableChat";
import { Send, ArrowLeft, Loader2, Info, MoreVertical, Paperclip, FileText, Mic, X, Search as SearchIcon, Volume2, Square, ChevronUp, ChevronDown, Sparkles, Wand2, PenTool, BadgeCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ProfileModal from "./miscellaneous/ProfileModal";
import UpdateGroupChatModal from "./miscellaneous/UpdateGroupChatModal";
import WhiteboardModal from "./WhiteboardModal";

let selectedChatCompare: any;

const SingleChat = () => {
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
    const [isWhiteboardOpen, setIsWhiteboardOpen] = useState(false);
    const [firstUnreadId, setFirstUnreadId] = useState<string | null>(null);
    const [isSummarizing, setIsSummarizing] = useState(false);
    const [chatSummary, setChatSummary] = useState<string | null>(null);
    const [isCatchMeUpOpen, setIsCatchMeUpOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[] | null>(null);
    const [activeSearchIndex, setActiveSearchIndex] = useState(-1);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingDuration, setRecordingDuration] = useState(0);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const timerRef = useRef<any>(null);
    const typingTimeoutRef = useRef<any>(null);

    const { user, selectedChat, setSelectedChat, notification, setNotification, socket, onlineUsers, updateChatPreview } = useChatStore();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Bootstraps initial chat load by hitting the backend message index endpoint.
    // Explicitly computes read/unread deltas upon fetch to display unread dividers.
    const fetchMessages = async () => {
        if (!selectedChat || !socket) return;
        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                },
            };
            setLoading(true);
            const { data } = await api.get(
                `/api/message/${selectedChat._id}`,
                config
            );
            setMessages(data);

            const unreadIndex = data.findIndex((m: any) => m.sender._id !== user._id && !(m.readBy?.includes(user._id)));
            if (unreadIndex !== -1) {
                setFirstUnreadId(data[unreadIndex]._id);
            } else {
                setFirstUnreadId(null);
            }

            setLoading(false);
            socket.emit("join chat", selectedChat._id);
            socket.emit("read message", { chatId: selectedChat._id, userId: user._id });

            // If we have messages, update the preview with the last one
            if (data.length > 0) {
                updateChatPreview(data[data.length - 1]);
            }
        } catch (error: any) {
            console.error("Fetch messages error:", error);
        }
    };

    // Core summarizer handler triggering context generation.
    // Slices local message datasets depending on whether the user requests 'today' vs 'unread'.
    // Dispatches the refined transcript over POST for robust LLM processing.
    const handleCatchMeUp = async (type: "unread" | "today") => {
        if (!selectedChat) return;
        setIsCatchMeUpOpen(false);
        setIsSummarizing(true);
        try {
            let messagesToSummarize = [...messages];

            if (type === "unread") {
                if (!firstUnreadId) {
                    setChatSummary("You have no unread messages to summarize.");
                    setIsSummarizing(false);
                    return;
                }
                const startIndex = messages.findIndex(m => m._id === firstUnreadId);
                if (startIndex !== -1) {
                    messagesToSummarize = messages.slice(startIndex);
                }
            } else if (type === "today") {
                const today = new Date().toLocaleDateString();
                messagesToSummarize = messages.filter(m => {
                    const msgDate = new Date(m.createdAt || Date.now()).toLocaleDateString();
                    return msgDate === today;
                });
                if (messagesToSummarize.length === 0) {
                    setChatSummary("No messages sent today to summarize.");
                    setIsSummarizing(false);
                    return;
                }
            }

            const transcript = messagesToSummarize.map((m: any) => `${m.sender?.name || 'Unknown'}: ${m.content || '[attachment/image]'}`).join('\n');

            const config = {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                },
            };
            const { data } = await api.post(`/api/message/summary/${selectedChat._id}`, { transcript }, config);
            setChatSummary(data.summary);
        } catch (error) {
            console.error("Summary error:", error);
            setChatSummary("Failed to generate summary. Please try again.");
        } finally {
            setIsSummarizing(false);
        }
    };

    // Triggers local client-side string permutation searches.
    // Avoids network roundtrips by leveraging already populated message arrays inline.
    const handleSearch = (query: string) => {
        setSearchQuery(query);
        if (!query.trim()) {
            setSearchResults(null);
            setActiveSearchIndex(-1);
            return;
        }

        // Search locally within the already-loaded messages for instant, 100% reliable results
        const matches = messages.filter((m) =>
            m.content &&
            m.content.toLowerCase().includes(query.toLowerCase()) &&
            !m.isDeleted
        );

        // Sort matches by time (newest at bottom, but search should probably go from newest to oldest)
        // Actually, we'll keep them in the order they appear in the chat (usually oldest to newest)
        setSearchResults(matches);

        if (matches.length > 0) {
            // Start from the most recent match (the last one in the chronological array)
            setActiveSearchIndex(matches.length - 1);
        } else {
            setActiveSearchIndex(-1);
        }
    };

    const nextMatch = () => {
        if (searchResults && searchResults.length > 0) {
            setActiveSearchIndex((prev) => (prev + 1) % searchResults.length);
        }
    };

    const prevMatch = () => {
        if (searchResults && searchResults.length > 0) {
            setActiveSearchIndex((prev) => (prev - 1 + searchResults.length) % searchResults.length);
        }
    };

    // Transmits outgoing messages, evaluating if they represent media or simple text strings.
    // Handles multi-part data uploads to external providers like Cloudinary before forwarding the final URL.
    const sendMessage = async (event?: any) => {
        if ((event && event.key !== "Enter") && event.type !== "click") return;
        if (!newMessage.trim() && !imagePreview && !filePreview && !audioBlob) return;

        if (socket) socket.emit("stop typing", selectedChat._id);

        try {
            const config = {
                headers: {
                    "Content-type": "application/json",
                    Authorization: `Bearer ${user.token}`,
                },
            };

            let payload: any = {
                chatId: selectedChat._id,
                content: newMessage,
            };

            // If we have an audio blob, we need to upload it first
            if (audioBlob) {
                setUploadingFile(true);
                const data = new FormData();
                data.append("file", audioBlob);
                data.append("upload_preset", "chat-app");
                data.append("cloud_name", "dtga8lwj3");

                const res = await fetch(`https://api.cloudinary.com/v1_1/dtga8lwj3/video/upload`, {
                    method: "POST",
                    body: data,
                });
                const cloudData = await res.json();
                payload.audioUrl = cloudData.secure_url;
                payload.audioDuration = recordingDuration;
                payload.content = ""; // Clear content for audio messages
                setAudioBlob(null);
                setAudioUrl(null);
                setRecordingDuration(0);
            }

            setNewMessage("");
            const { data } = await api.post("/api/message", payload, config);
            socket.emit("new message", data);
            setMessages([...messages, data]);
            updateChatPreview(data); // Local update instead of flipping fetchAgain
            setUploadingFile(false);
        } catch (error: any) {
            console.error("Send message error:", error);
            setUploadingFile(false);
        }
    };

    // Configures the user's local microphone streaming tracks constraints.
    // Buffers arbitrary voice memo lengths aggressively using Opus codec compression formats.
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            const chunks: BlobPart[] = [];

            mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
            mediaRecorder.onstop = () => {
                const blob = new Blob(chunks, { type: "audio/ogg; codecs=opus" });
                setAudioBlob(blob);
                setAudioUrl(URL.createObjectURL(blob));
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingDuration(0);
            timerRef.current = setInterval(() => {
                setRecordingDuration(prev => prev + 1);
            }, 1000);
        } catch (error) {
            console.error("Failed to start recording:", error);
            alert("Microphone access denied or not available");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            clearInterval(timerRef.current);
        }
    };

    const cancelRecording = () => {
        stopRecording();
        setAudioBlob(null);
        setAudioUrl(null);
        setRecordingDuration(0);
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
        data.append("cloud_name", "dtga8lwj3");

        try {
            const res = await fetch(`https://api.cloudinary.com/v1_1/dtga8lwj3/${isImage ? 'image' : 'raw'}/upload`, {
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

            const { data: messageData } = await api.post("/api/message", payload, config);

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

    const handleWhiteboardSend = async (dataUrl: string) => {
        if (!socket) return;
        setUploadingFile(true);

        // Convert base64 dataUrl to File object
        const arr = dataUrl.split(',');
        const mimeMatch = arr[0].match(/:(.*?);/);
        const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        const file = new File([u8arr], 'whiteboard.jpg', { type: mime });

        const data = new FormData();
        data.append("file", file);
        data.append("upload_preset", "chat-app");
        data.append("cloud_name", "dtga8lwj3");

        try {
            const res = await fetch(`https://api.cloudinary.com/v1_1/dtga8lwj3/image/upload`, {
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
                content: "",
                image: fileUrl
            };

            const { data: messageData } = await api.post("/api/message", payload, config);

            socket.emit("new message", messageData);
            setMessages((prev) => [...prev, messageData]);
        } catch (error: any) {
            console.error("Board Upload error:", error);
            alert("Failed to send whiteboard");
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
                setNotification((prev: any[]) => {
                    if (!prev.find((n: any) => n._id === newMessageRecieved._id)) {
                        return [newMessageRecieved, ...prev];
                    }
                    return prev;
                });
                updateChatPreview(newMessageRecieved);
            } else {
                setMessages((prev) => [...prev, newMessageRecieved]);
                socket.emit("read message", { chatId: selectedChatCompare._id, userId: user._id });
                updateChatPreview(newMessageRecieved);
            }
        });

        socket.on("message read", (data: any) => {
            if (selectedChatCompare && selectedChatCompare._id === data.chatId) {
                setMessages((prev) => prev.map(msg => {
                    const senderId = msg.sender?._id || msg.sender;
                    // Only process messages sent by someone other than the reader
                    if (senderId !== data.userId) {
                        const currentReadBy = msg.readBy || [];
                        if (!currentReadBy.includes(data.userId)) {
                            return { ...msg, readBy: [...currentReadBy, data.userId] };
                        }
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
    }, [socket, updateChatPreview]);

    useEffect(() => {
        fetchMessages();
        selectedChatCompare = selectedChat;
        setIsSearchOpen(false);
        setSearchQuery("");
        setSearchResults(null);
        setActiveSearchIndex(-1);
        setChatSummary(null);

        // Clear notifications for this chat when it's opened
        if (selectedChat) {
            setNotification(notification.filter((n: any) => n.chat._id !== selectedChat._id));
        }
    }, [selectedChat, socket]);

    const typingHandler = (e: any) => {
        setNewMessage(e.target.value);
        if (!socket) return;

        if (!typing) {
            setTyping(true);
            socket.emit("typing", selectedChat._id);
        }

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

        typingTimeoutRef.current = setTimeout(() => {
            socket.emit("stop typing", selectedChat._id);
            setTyping(false);
        }, 3000);
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

        const lastSeenTime = formatLastSeen(presence.lastSeen);
        return lastSeenTime === "Offline" ? "Offline" : `Last seen ${lastSeenTime}`;
    };

    return (
        <div className="w-full h-full flex flex-col pt-0 relative overflow-hidden">
            {selectedChat ? (
                <>
                    <div className="px-6 py-4 flex justify-between items-center w-full border-b border-gray-200/60 dark:border-white/[0.04] relative z-20">
                        <div className="flex items-center gap-4 flex-1">
                            <button
                                className="md:hidden flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20 text-gray-500 dark:text-zinc-400 transition-colors mr-1"
                                onClick={() => setSelectedChat("")}
                            >
                                <ArrowLeft size={18} />
                            </button>
                            {!selectedChat.isGroupChat ? (
                                <>
                                    <div className="relative group">
                                        <div className="absolute inset-0 bg-emerald-500/10 blur-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                        <img
                                            src={getSenderFull(user, selectedChat.users).pic}
                                            className="w-10 h-10 rounded-full object-cover relative border border-gray-200 dark:border-white/5"
                                            alt="avatar"
                                            onError={(e) => { (e.target as HTMLImageElement).src = '/default-avatar.svg'; }}
                                        />
                                        <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white transition-colors ${getStatus() === 'Online' || isTyping ? 'bg-emerald-500' : 'bg-gray-300'}`}></div>
                                    </div>
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-gray-900 dark:text-white tracking-tight">{getSender(user, selectedChat.users)}</span>
                                            {getSenderFull(user, selectedChat.users).isVerified && (
                                                <BadgeCheck size={16} className="text-emerald-500 fill-emerald-500/10" />
                                            )}
                                            <button
                                                onClick={() => setIsProfileOpen(true)}
                                                className="p-1 text-gray-400 dark:text-zinc-500 hover:text-emerald-500 transition-colors bg-gray-50 dark:bg-[#0e0e13] hover:bg-emerald-50 rounded-lg outline-none"
                                            >
                                                <Info size={14} />
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <div className={`w-1.5 h-1.5 rounded-full ${getStatus() === 'Online' || isTyping ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`}></div>
                                            <span className={`text-[10px] uppercase font-bold tracking-widest ${getStatus() === 'Online' || isTyping ? 'text-emerald-600' : 'text-gray-400 dark:text-zinc-500'}`}>
                                                {getStatus()}
                                            </span>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold text-lg border border-emerald-200">
                                        {selectedChat.chatName[0]?.toUpperCase()}
                                    </div>
                                    <div className="flex flex-col text-left">
                                        <span className="font-bold text-gray-900 dark:text-white tracking-tight">{selectedChat.chatName}</span>
                                        <span className="text-[10px] uppercase font-bold tracking-widest text-gray-400 dark:text-zinc-500 mt-0.5">Community Channel</span>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setIsWhiteboardOpen(true)}
                                disabled={uploadingFile}
                                title="Live Collaborative Whiteboard"
                                className="px-3 py-1.5 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-all bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 rounded-xl border border-blue-200 dark:border-blue-500/20 hover:border-blue-300 dark:hover:border-blue-500/30 hidden sm:flex items-center gap-2 group disabled:opacity-50"
                            >
                                <PenTool size={16} className="group-hover:-rotate-12 transition-transform" />
                                <span className="text-[10px] font-bold uppercase tracking-widest hidden lg:inline">Live Whiteboard</span>
                            </button>
                            <div className="relative">
                                <button
                                    onClick={() => setIsCatchMeUpOpen(!isCatchMeUpOpen)}
                                    disabled={isSummarizing || messages.length === 0}
                                    title="Catch Me Up (AI Summary)"
                                    className="px-3 py-1.5 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-all bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 rounded-xl border border-emerald-200 dark:border-emerald-500/20 hover:border-emerald-300 dark:hover:border-emerald-500/30 flex items-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSummarizing ? <Loader2 size={16} className="animate-spin text-emerald-500" /> : <Wand2 size={16} className="group-hover:rotate-12 transition-transform text-emerald-500" />}
                                    <span className="text-[10px] font-black uppercase tracking-widest hidden lg:inline text-emerald-600 dark:text-emerald-400">Catch Me Up</span>
                                    <ChevronDown size={14} className="text-emerald-500 opacity-60 ml-1 group-hover:opacity-100" />
                                </button>

                                <AnimatePresence>
                                    {isCatchMeUpOpen && (
                                        <>
                                            <div className="fixed inset-0 z-40" onClick={() => setIsCatchMeUpOpen(false)}></div>
                                            <motion.div
                                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-[#0a0a0f] border border-emerald-200 rounded-2xl shadow-xl z-50 overflow-hidden"
                                            >
                                                <div className="p-1 space-y-1">
                                                    <button
                                                        onClick={() => handleCatchMeUp("unread")}
                                                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-gray-600 dark:text-zinc-300 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all text-left"
                                                    >
                                                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 shadow-[0_0_10px_rgba(16,185,129,0.6)]"></span>
                                                        Summarize Unread
                                                    </button>
                                                    <button
                                                        onClick={() => handleCatchMeUp("today")}
                                                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-gray-600 dark:text-zinc-300 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all text-left"
                                                    >
                                                        <span className="w-2 h-2 rounded-full border border-emerald-500 shrink-0"></span>
                                                        Summarize Today
                                                    </button>
                                                </div>
                                            </motion.div>
                                        </>
                                    )}
                                </AnimatePresence>
                            </div>
                            <AnimatePresence>
                                {isSearchOpen && (
                                    <motion.div
                                        initial={{ width: 0, opacity: 0 }}
                                        animate={{ width: 200, opacity: 1 }}
                                        exit={{ width: 0, opacity: 0 }}
                                        className="relative overflow-hidden flex items-center bg-gray-50 dark:bg-[#0e0e13] rounded-full px-4 border border-gray-200 dark:border-white/5"
                                    >
                                        <SearchIcon size={14} className="text-gray-400 dark:text-zinc-500" />
                                        <input
                                            autoFocus
                                            className="bg-transparent border-none outline-none text-xs text-gray-900 dark:text-white py-2 px-2 w-full placeholder:text-gray-400 dark:text-zinc-500 font-medium"
                                            placeholder="Search messages..."
                                            value={searchQuery}
                                            onChange={(e) => handleSearch(e.target.value)}
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            <button
                                onClick={() => setIsSearchOpen(!isSearchOpen)}
                                className={`p-2.5 transition-colors rounded-xl border border-transparent ${isSearchOpen ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20' : 'text-gray-400 dark:text-zinc-500 hover:text-gray-700 dark:text-zinc-200 dark:hover:text-zinc-200 hover:bg-gray-50 dark:bg-[#0e0e13] dark:hover:bg-white/5 hover:border-gray-200 dark:border-white/5 dark:hover:border-white/10'}`}
                            >
                                <SearchIcon size={20} />
                            </button>
                            <button
                                onClick={() => selectedChat.isGroupChat ? setIsGroupOpen(true) : setIsProfileOpen(true)}
                                className="p-2.5 text-gray-400 dark:text-zinc-500 hover:text-gray-700 dark:text-zinc-200 dark:hover:text-zinc-200 transition-colors hover:bg-gray-50 dark:bg-[#0e0e13] dark:hover:bg-white/5 rounded-xl border border-transparent hover:border-gray-200 dark:border-white/5 dark:hover:border-white/10"
                            >
                                <MoreVertical size={20} />
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col w-full overflow-hidden relative">
                        <AnimatePresence>
                            {chatSummary && (
                                <motion.div
                                    initial={{ opacity: 0, y: -20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="absolute top-4 inset-x-0 mx-auto w-[90%] max-w-2xl bg-white dark:bg-[#0a0a0f] backdrop-blur-xl border border-emerald-200 p-6 rounded-3xl z-40 shadow-xl"
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl">
                                                <Sparkles className="text-emerald-500" size={20} />
                                            </div>
                                            <h3 className="text-emerald-600 font-bold tracking-tight text-lg">AI Chat Summary</h3>
                                        </div>
                                        <button onClick={() => setChatSummary(null)} className="text-gray-400 dark:text-zinc-500 hover:text-gray-700 dark:text-zinc-200 dark:hover:text-zinc-200 transition-colors bg-gray-100 dark:bg-white/5 p-2 rounded-full">
                                            <X size={16} />
                                        </button>
                                    </div>
                                    <div className="text-gray-600 dark:text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">
                                        {chatSummary}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {loading ? (
                            <div className="flex flex-col items-center justify-center h-full gap-4">
                                <Loader2 className="animate-spin text-emerald-500/50" size={32} />
                                <span className="text-[10px] uppercase font-bold tracking-[0.3em] text-gray-400 dark:text-zinc-500">Loading messages</span>
                            </div>
                        ) : (
                            <ScrollableChat
                                messages={messages}
                                socket={socket}
                                activeMessageId={searchResults && activeSearchIndex >= 0 ? searchResults[activeSearchIndex]._id : undefined}
                                searchQuery={searchResults ? searchQuery : ""}
                                setMessages={setMessages}
                                firstUnreadId={firstUnreadId}
                            />
                        )}
                        {searchResults && (
                            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-emerald-50 dark:bg-[#0e0e13]/80 backdrop-blur-sm border border-emerald-200 dark:border-emerald-500/20 px-6 py-2.5 rounded-full z-30 flex items-center gap-4 shadow-md">
                                <div className="flex items-center gap-2 border-r border-emerald-200 pr-4">
                                    <span className="text-[10px] uppercase font-black tracking-widest text-emerald-600">
                                        {searchResults.length > 0 ? `${activeSearchIndex + 1} of ${searchResults.length}` : "0 results"}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={prevMatch}
                                        disabled={!searchResults || searchResults.length === 0}
                                        className="p-1 text-emerald-500 hover:text-emerald-700 hover:bg-emerald-100 rounded-md transition-all disabled:opacity-20"
                                    >
                                        <ChevronUp size={18} />
                                    </button>
                                    <button
                                        onClick={nextMatch}
                                        disabled={!searchResults || searchResults.length === 0}
                                        className="p-1 text-emerald-500 hover:text-emerald-700 hover:bg-emerald-100 rounded-md transition-all disabled:opacity-20"
                                    >
                                        <ChevronDown size={18} />
                                    </button>
                                </div>
                                <button onClick={() => { setSearchResults(null); setSearchQuery(""); setIsSearchOpen(false); setActiveSearchIndex(-1); }} className="text-gray-400 dark:text-zinc-500 hover:text-gray-700 dark:text-zinc-200 dark:hover:text-zinc-200 ml-2">
                                    <X size={16} />
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="p-6 pt-2 mt-auto relative z-20">
                        <AnimatePresence>
                            {(imagePreview || filePreview || audioUrl) && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="absolute bottom-full mb-6 left-8"
                                >
                                    <div className="relative group">
                                        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-emerald-500/40 blur-2xl rounded-full"></div>
                                        {imagePreview ? (
                                            <img src={imagePreview} className="w-32 h-32 object-cover rounded-3xl border-2 border-emerald-500/50 relative z-10 shadow-[0_20px_50px_rgba(16,185,129,0.3)]" />
                                        ) : audioUrl ? (
                                            <div className="bg-white dark:bg-[#0a0a0f] rounded-3xl border-2 border-emerald-300 relative z-10 p-4 flex flex-col items-center gap-2 shadow-lg min-w-[120px]">
                                                <Volume2 className="text-emerald-500 animate-pulse" size={32} />
                                                <span className="text-[10px] text-gray-700 dark:text-zinc-200 font-bold uppercase">{Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}</span>
                                                <button onClick={cancelRecording} className="text-[8px] text-gray-400 dark:text-zinc-500 hover:text-red-500 font-black uppercase tracking-widest mt-1">Cancel Stream</button>
                                            </div>
                                        ) : (
                                            <div className="w-32 h-32 bg-white dark:bg-[#0a0a0f] rounded-3xl border-2 border-emerald-300 relative z-10 flex flex-col items-center justify-center p-4 shadow-lg">
                                                <FileText className="text-emerald-500 mb-2" size={32} />
                                                <p className="text-[8px] text-gray-700 dark:text-zinc-200 truncate w-full text-center font-bold uppercase">{filePreview?.name}</p>
                                            </div>
                                        )}
                                        {uploadingFile && (
                                            <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 rounded-3xl backdrop-blur-[1px]">
                                                <Loader2 className="text-emerald-400 animate-spin" size={24} />
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="relative group/input">
                            <AnimatePresence>
                                {isRecording && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="absolute inset-0 bg-emerald-50 dark:bg-[#0a0a0f]/90 backdrop-blur-sm rounded-[2rem] z-50 flex items-center justify-between px-8 border border-emerald-300 dark:border-emerald-500/30"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
                                            <span className="text-sm font-bold text-gray-700 dark:text-zinc-200 tracking-widest">RECORDING: {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <button onClick={cancelRecording} className="text-gray-400 dark:text-zinc-500 hover:text-gray-700 dark:text-zinc-200 dark:hover:text-zinc-200 text-xs font-bold uppercase tracking-widest">Discard</button>
                                            <button onClick={stopRecording} className="p-3 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors">
                                                <Square size={16} fill="white" />
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="absolute -inset-px rounded-[2rem] opacity-0 group-focus-within/input:opacity-100 transition-opacity duration-500" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, transparent 50%, rgba(6,182,212,0.06) 100%)' }}></div>
                            <div className="relative flex items-center gap-2 bg-gray-50 dark:bg-[#0e0e13] border border-gray-200 dark:border-white/5 rounded-[2rem] p-2 pl-5 group-focus-within/input:border-emerald-300 transition-all">
                                <button
                                    className="text-gray-400 dark:text-zinc-500 hover:text-emerald-500 transition-colors p-2"
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
                                    className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-white text-sm py-3 placeholder:text-gray-400 dark:text-zinc-500 placeholder:font-medium selection:bg-emerald-500/20"
                                    placeholder="Type a message..."
                                    onKeyDown={sendMessage}
                                    value={newMessage}
                                    onChange={typingHandler}
                                />
                                <button
                                    className={`p-2 transition-colors ${isRecording ? 'text-red-500' : 'text-gray-400 dark:text-zinc-500 hover:text-emerald-500'}`}
                                    onClick={startRecording}
                                    title="Voice Note"
                                >
                                    <Mic size={22} className={isRecording ? 'animate-pulse' : ''} />
                                </button>
                                <button
                                    onClick={() => sendMessage({ type: "click" })}
                                    disabled={!newMessage.trim() && !audioUrl && !imagePreview && !filePreview}
                                    className="p-3.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-[1.5rem] transition-all shadow-md disabled:opacity-50 disabled:shadow-none disabled:bg-gray-200 dark:bg-white/10 disabled:text-gray-400 dark:text-zinc-500 active:scale-95"
                                >
                                    <Send size={18} />
                                </button>
                            </div>
                        </div>
                    </div>

                    <WhiteboardModal
                        isOpen={isWhiteboardOpen}
                        onClose={() => setIsWhiteboardOpen(false)}
                        socket={socket}
                        chatId={selectedChat._id}
                        onSend={handleWhiteboardSend}
                    />

                    <ProfileModal
                        user={getSenderFull(user, selectedChat.users)}
                        isOpen={isProfileOpen}
                        onClose={() => setIsProfileOpen(false)}
                    />

                    {selectedChat.isGroupChat && (
                        <UpdateGroupChatModal
                            fetchMessages={fetchMessages}
                            isOpen={isGroupOpen}
                            onClose={() => setIsGroupOpen(false)}
                            socket={socket}
                        />
                    )}
                </>
            ) : (
                <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md">
                        <div className="w-24 h-24 bg-emerald-50 dark:bg-emerald-500/10 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 border border-emerald-200 dark:border-emerald-500/20">
                            <Send size={40} className="text-emerald-500" />
                        </div>
                        <h2 className="text-4xl font-bold text-gray-900 dark:text-white tracking-tighter mb-4">Select a Conversation</h2>
                        <p className="text-gray-400 dark:text-zinc-500 font-medium leading-relaxed">
                            Select a chat to start messaging. <br />
                            Your conversations are secured with end-to-end encryption.
                        </p>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default SingleChat;
