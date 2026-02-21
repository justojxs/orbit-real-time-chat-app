import { useState } from "react";
import api from "../../lib/axios";
import { useChatStore } from "../../store/useChatStore";
import { X, Search, Users, Plus, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";

const GroupChatModal = ({ isOpen, onClose, children }: { isOpen?: boolean, onClose?: () => void, children?: React.ReactNode }) => {
    const [groupChatName, setGroupChatName] = useState("");
    const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
    const [search, setSearch] = useState("");
    const [searchResult, setSearchResult] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const { user, chats, setChats } = useChatStore();
    const [modalOpen, setModalOpen] = useState(false);

    const handleOpen = () => {
        if (isOpen === undefined) setModalOpen(true);
    };

    const handleClose = () => {
        if (onClose) onClose();
        else setModalOpen(false);
        setGroupChatName("");
        setSelectedUsers([]);
        setSearch("");
        setSearchResult([]);
    };

    const isCurrentlyOpen = isOpen !== undefined ? isOpen : modalOpen;

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
            const { data } = await api.get(`/api/user?search=${query}`, config);
            setLoading(false);
            setSearchResult(data);
        } catch (error) {
            setLoading(false);
        }
    };

    const handleDelete = (delUser: any) => {
        setSelectedUsers(selectedUsers.filter((sel) => sel._id !== delUser._id));
    };

    const handleGroup = (userToAdd: any) => {
        if (selectedUsers.some(u => u._id === userToAdd._id)) return;
        setSelectedUsers([...selectedUsers, userToAdd]);
    };

    const handleSubmit = async () => {
        if (!groupChatName || selectedUsers.length === 0) {
            alert("Please provide a name and add at least two members");
            return;
        }
        if (selectedUsers.length < 2) {
            alert("Need at least 2 other users to form a group chat");
            return;
        }
        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                },
            };
            const { data } = await api.post(
                "/api/chat/group",
                {
                    name: groupChatName,
                    users: JSON.stringify(selectedUsers.map((u) => u._id)),
                },
                config
            );
            setChats([data, ...chats]);
            handleClose();
        } catch (error: any) {
            alert(error.response?.data?.message || "Failed to Create Group");
        }
    };

    const modalContent = (
        <AnimatePresence>
            {isCurrentlyOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 overflow-hidden">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/70 backdrop-blur-xl"
                        onClick={handleClose}
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="bg-[#0c0c0e]/95 border border-white/[0.08] p-10 rounded-[3rem] shadow-[0_50px_100px_rgba(0,0,0,0.5)] w-full max-w-lg relative z-10 flex flex-col gap-8"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                                    <Users size={24} />
                                </div>
                                <div>
                                    <h2 className="text-3xl font-bold text-white tracking-tighter">New Group</h2>
                                    <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-zinc-500 mt-1">Create Collaborative Space</p>
                                </div>
                            </div>
                            <button onClick={handleClose} className="text-zinc-500 hover:text-white transition-all bg-white/5 p-2.5 rounded-2xl hover:bg-white/10">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase font-bold tracking-widest text-zinc-600 ml-1">Group Identity</label>
                                <input
                                    className="glass-input"
                                    placeholder="Enter group name..."
                                    value={groupChatName}
                                    onChange={(e) => setGroupChatName(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] uppercase font-bold tracking-widest text-zinc-600 ml-1">Add Members</label>
                                <div className="relative">
                                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" />
                                    <input
                                        className="glass-input pl-12"
                                        placeholder="Search by name or email"
                                        value={search}
                                        onChange={(e) => handleSearch(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto custom-scrollbar">
                                {selectedUsers.map((u) => (
                                    <motion.span
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        key={u._id}
                                        className="flex items-center gap-2 bg-emerald-500/10 text-emerald-400 text-xs font-bold px-3 py-2 rounded-xl border border-emerald-500/20 group hover:border-emerald-500/50 transition-colors"
                                    >
                                        {u.name}
                                        <X size={14} className="cursor-pointer text-emerald-600 group-hover:text-emerald-400" onClick={() => handleDelete(u)} />
                                    </motion.span>
                                ))}
                            </div>

                            <div className="space-y-2">
                                {loading ? (
                                    <div className="flex items-center justify-center gap-2 text-emerald-500/50 py-4 text-xs font-bold uppercase tracking-widest animate-pulse">
                                        <Loader2 className="animate-spin" size={14} /> Tracking...
                                    </div>
                                ) : (
                                    <div className="max-h-52 overflow-y-auto custom-scrollbar flex flex-col gap-2 pr-2">
                                        {searchResult?.slice(0, 4).map((userToAdd: any) => (
                                            <div
                                                key={userToAdd._id}
                                                onClick={() => handleGroup(userToAdd)}
                                                className="flex items-center justify-between p-3.5 bg-white/[0.02] hover:bg-white/[0.05] rounded-2xl cursor-pointer transition-all border border-transparent hover:border-white/[0.08] group"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <img src={userToAdd.pic} alt={userToAdd.name} className="w-10 h-10 rounded-full object-cover border border-white/10" />
                                                    <div className="flex-1 overflow-hidden">
                                                        <h4 className="text-sm font-bold text-zinc-100 truncate group-hover:text-emerald-400 transition-colors">{userToAdd.name}</h4>
                                                        <p className="text-[10px] text-zinc-500 font-medium truncate uppercase tracking-tighter">{userToAdd.email}</p>
                                                    </div>
                                                </div>
                                                <Plus size={18} className="text-zinc-700 group-hover:text-emerald-500 transition-colors" />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={handleSubmit}
                            className="btn-primary w-full !py-5 mt-2 flex items-center justify-center gap-3 active:scale-95"
                        >
                            <Users size={20} />
                            Create Group
                        </button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );

    return (
        <div className="contents">
            {children && <span onClick={handleOpen} className="cursor-pointer">{children}</span>}
            {createPortal(modalContent, document.body)}
        </div>
    );
};

export default GroupChatModal;
