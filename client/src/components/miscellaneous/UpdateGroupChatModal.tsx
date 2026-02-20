import { useState, useEffect } from "react";
import { useChatStore } from "../../store/useChatStore";
import axios from "axios";
import { X, Pencil, Plus, LogOut, Loader2, Search, Trash2, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";

interface UpdateGroupChatModalProps {
    fetchAgain: boolean;
    setFetchAgain: any;
    fetchMessages: any;
    isOpen: boolean;
    onClose: () => void;
    socket?: any;
}

const UpdateGroupChatModal = ({ fetchAgain, setFetchAgain, fetchMessages, isOpen, onClose, socket }: UpdateGroupChatModalProps) => {
    const [groupChatName, setGroupChatName] = useState("");
    const [search, setSearch] = useState("");
    const [searchResult, setSearchResult] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [renameLoading, setRenameLoading] = useState(false);

    const { selectedChat, setSelectedChat, user } = useChatStore();

    useEffect(() => {
        if (!isOpen) {
            setSearch("");
            setSearchResult([]);
        }
    }, [isOpen]);

    const handleRemove = async (user1: any) => {
        if (!selectedChat) return;
        if (selectedChat.groupAdmin._id !== user._id && user1._id !== user._id) {
            alert("Only admins can remove someone!");
            return;
        }

        try {
            setLoading(true);
            const config = {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                },
            };
            const { data } = await axios.put(
                `/api/chat/groupremove`,
                {
                    chatId: selectedChat._id,
                    userId: user1._id,
                },
                config
            );

            if (data.message && socket) {
                socket.emit("new message", data.message);
            }

            const updatedChat = data.removed;
            user1._id === user._id ? setSelectedChat(null) : setSelectedChat(updatedChat);
            setFetchAgain(!fetchAgain);
            fetchMessages();
            setLoading(false);
        } catch (error: any) {
            alert("Error Occured!");
            setLoading(false);
        }
    };

    const handleRename = async () => {
        if (!groupChatName || !selectedChat) return;

        try {
            setRenameLoading(true);
            const config = {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                },
            };
            const { data } = await axios.put(
                `/api/chat/rename`,
                {
                    chatId: selectedChat._id,
                    chatName: groupChatName,
                },
                config
            );

            setSelectedChat(data);
            setFetchAgain(!fetchAgain);
            setRenameLoading(false);
            setGroupChatName("");
        } catch (error: any) {
            alert("Error Occured!");
            setRenameLoading(false);
        }
    };

    const handleSearch = async (query: string) => {
        setSearch(query);
        if (!query) {
            setSearchResult([]);
            return;
        }

        try {
            setLoading(true);
            const config = {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                },
            };
            const { data } = await axios.get(`/api/user?search=${query}`, config);
            setLoading(false);
            setSearchResult(data);
        } catch (error) {
            setLoading(false);
        }
    };

    const handleAddUser = async (user1: any) => {
        if (!selectedChat) return;
        if (selectedChat.users.find((u: any) => u._id === user1._id)) {
            alert("User Already in group!");
            return;
        }

        if (selectedChat.groupAdmin._id !== user._id) {
            alert("Only admins can add someone!");
            return;
        }

        try {
            setLoading(true);
            const config = {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                },
            };
            const { data } = await axios.put(
                `/api/chat/groupadd`,
                {
                    chatId: selectedChat._id,
                    userId: user1._id,
                },
                config
            );

            setSelectedChat(data);
            setFetchAgain(!fetchAgain);
            setLoading(false);
        } catch (error: any) {
            alert("Error Occured!");
            setLoading(false);
        }
    };

    if (!selectedChat) return null;

    const modalContent = (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-hidden">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-zinc-950/80 backdrop-blur-md"
                        onClick={onClose}
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-xl bg-[#0d0d12] border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden pt-10 pb-8 px-10 flex flex-col z-10"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h2 className="text-3xl font-bold text-white tracking-tighter">{selectedChat.chatName}</h2>
                                <div className="flex items-center gap-2 mt-2">
                                    <ShieldCheck size={14} className="text-emerald-500" />
                                    <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-[0.2em]">Group Settings</span>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-2 text-zinc-500 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Members Area */}
                        <div className="mb-8">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 mb-4">Active Members ({selectedChat.users.length})</p>
                            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto custom-scrollbar">
                                {selectedChat.users.map((u: any) => (
                                    <div
                                        key={u._id}
                                        className="flex items-center gap-2 bg-white/[0.03] border border-white/[0.05] rounded-xl px-3 py-2 group hover:border-emerald-500/30 transition-all"
                                    >
                                        <img src={u.pic} className="w-5 h-5 rounded-full object-cover" alt={u.name} />
                                        <span className="text-xs font-semibold text-zinc-300">{u.name}</span>
                                        {u._id !== user._id && selectedChat.groupAdmin._id === user._id && (
                                            <Trash2
                                                size={14}
                                                className="text-zinc-600 hover:text-red-500 cursor-pointer transition-colors"
                                                onClick={() => handleRemove(u)}
                                            />
                                        )}
                                        {u._id === selectedChat.groupAdmin._id && (
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Actions Area */}
                        <div className="space-y-6">
                            {/* Rename Section */}
                            <div className="relative">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 mb-3">Update Group Identity</p>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Pencil className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                                        <input
                                            placeholder="Enter New Group Name"
                                            className="glass-input !py-3.5 !pl-11 !rounded-2xl"
                                            value={groupChatName}
                                            onChange={(e) => setGroupChatName(e.target.value)}
                                        />
                                    </div>
                                    <button
                                        onClick={handleRename}
                                        disabled={renameLoading}
                                        className="btn-primary !py-px px-6 rounded-2xl flex items-center justify-center min-w-[100px]"
                                    >
                                        {renameLoading ? <Loader2 className="animate-spin" size={18} /> : "Update"}
                                    </button>
                                </div>
                            </div>

                            {/* Add Section */}
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 mb-3">Add a Member</p>
                                <div className="relative mb-3">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                                    <input
                                        placeholder="Search users to add..."
                                        className="glass-input !py-3.5 !pl-11 !rounded-2xl"
                                        onChange={(e) => handleSearch(e.target.value)}
                                        value={search}
                                    />
                                </div>
                                <div className="max-h-40 overflow-y-auto space-y-2 custom-scrollbar">
                                    {loading ? (
                                        <div className="flex justify-center p-4"><Loader2 className="animate-spin text-emerald-500" /></div>
                                    ) : (
                                        searchResult?.map((user) => (
                                            <div
                                                key={user._id}
                                                className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/[0.05] rounded-2xl hover:bg-white/[0.05] transition-all cursor-pointer group"
                                                onClick={() => handleAddUser(user)}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <img src={user.pic} className="w-8 h-8 rounded-full border border-white/10" alt={user.name} />
                                                    <div>
                                                        <p className="text-sm font-bold text-white">{user.name}</p>
                                                        <p className="text-[10px] text-zinc-500 font-medium">{user.email}</p>
                                                    </div>
                                                </div>
                                                <Plus size={18} className="text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Danger Zone */}
                            <div className="pt-4 mt-auto">
                                <button
                                    onClick={() => handleRemove(user)}
                                    className="w-full py-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-3 active:scale-95"
                                >
                                    <LogOut size={16} />
                                    Leave Group
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );

    return createPortal(modalContent, document.body);
};

export default UpdateGroupChatModal;
