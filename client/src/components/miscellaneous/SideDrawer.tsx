import { useState, useEffect } from "react";
import { useChatStore } from "../../store/useChatStore";
import { useNavigate } from "react-router-dom";
import api from "../../lib/axios";
import { Loader2, Search, Bell, ChevronDown, LogOut, User as UserIcon, X, BadgeCheck } from "lucide-react";
import ThemeToggle from "../ThemeToggle";
import ProfileModal from "./ProfileModal";
import { motion, AnimatePresence } from "framer-motion";

const SideDrawer = () => {
    const [search, setSearch] = useState("");
    const [searchResult, setSearchResult] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingChat, setLoadingChat] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isNotifOpen, setIsNotifOpen] = useState(false);

    const {
        setSelectedChat,
        user,
        notification,
        setNotification,
        chats,
        setChats,
    } = useChatStore();

    const navigate = useNavigate();

    const logoutHandler = () => {
        localStorage.removeItem("userInfo");
        navigate("/");
    };

    useEffect(() => {
        const handleOpenSearch = () => setIsSearchOpen(true);
        window.addEventListener('open-search-drawer', handleOpenSearch);
        return () => window.removeEventListener('open-search-drawer', handleOpenSearch);
    }, []);

    const handleSearch = async () => {
        if (!search) {
            alert("Please enter something in search");
            return;
        }

        try {
            setLoading(true);
            const config = {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                },
            };
            const { data } = await api.get(`/api/user?search=${search}`, config);
            setLoading(false);
            setSearchResult(data);
        } catch (error) {
            alert("Error Occured!");
            setLoading(false);
        }
    };

    const accessChat = async (userId: string) => {
        try {
            setLoadingChat(true);
            const config = {
                headers: {
                    "Content-type": "application/json",
                    Authorization: `Bearer ${user.token}`,
                },
            };
            const { data } = await api.post(`/api/chat`, { userId }, config);

            if (!chats.find((c: any) => c._id === data._id)) setChats([data, ...chats]);
            setSelectedChat(data);
            setLoadingChat(false);
            setIsSearchOpen(false);
        } catch (error: any) {
            alert("Error fetching the chat: " + error.message);
            setLoadingChat(false);
        }
    };

    return (
        <>
            <div className="flex justify-between items-center bg-white/80 dark:bg-[#0a0a0f]/80 backdrop-blur-xl px-6 py-3 border-b border-gray-200/60 dark:border-white/[0.04] w-full relative z-40">
                <button
                    className="flex items-center gap-3 px-5 py-2.5 text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:text-zinc-200 dark:hover:text-zinc-200 transition-all bg-gray-50 dark:bg-[#0e0e13] hover:bg-gray-100 dark:bg-white/5 dark:hover:bg-white/10 border border-gray-200 dark:border-white/5 rounded-2xl group"
                    onClick={() => setIsSearchOpen(true)}
                >
                    <Search size={18} className="group-hover:text-emerald-500 transition-colors" />
                    <span className="hidden md:inline text-[10px] font-bold uppercase tracking-[0.2em]">Search Network</span>
                </button>

                <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/chats')}>
                    <div className="relative">
                        <div className="absolute inset-0 bg-emerald-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <img src="/logo.png" className="w-8 h-8 object-contain relative transition-transform duration-700 group-hover:rotate-[360deg]" alt="Orbit Logo" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tighter text-gray-900 dark:text-white">Orbit</h1>
                </div>

                <div className="flex items-center gap-4">
                    <ThemeToggle />

                    <div className="relative">
                        <button
                            onClick={() => setIsNotifOpen(!isNotifOpen)}
                            className="hover:bg-gray-100 dark:bg-white/5 dark:hover:bg-white/10 p-2.5 rounded-full transition-colors relative"
                        >
                            <Bell className="text-gray-400 dark:text-zinc-500 hover:text-gray-700 dark:text-zinc-200 dark:hover:text-zinc-200 transition-colors" size={20} />
                            {notification.length > 0 && (
                                <span className="absolute top-2 right-2 bg-emerald-500 text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-full font-bold shadow-[0_0_10px_rgba(16,185,129,0.5)]">
                                    {notification.length}
                                </span>
                            )}
                        </button>

                        <AnimatePresence>
                            {isNotifOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute right-0 top-full mt-4 w-72 bg-white dark:bg-[#0a0a0f] border border-gray-200 dark:border-white/5 rounded-[1.5rem] shadow-xl z-50 overflow-hidden"
                                >
                                    <div className="p-3">
                                        <h3 className="px-3 pb-2 text-sm font-semibold text-gray-500 dark:text-zinc-400 border-b border-gray-100">
                                            Notifications
                                        </h3>
                                        <div className="max-h-64 overflow-y-auto mt-2">
                                            {!notification.length && (
                                                <div className="px-3 py-4 text-center text-gray-400 dark:text-zinc-500 text-sm">
                                                    No New Messages
                                                </div>
                                            )}
                                            {notification.map((notif: any) => (
                                                <div
                                                    key={notif._id}
                                                    onClick={() => {
                                                        setSelectedChat(notif.chat);
                                                        setNotification(notification.filter((n: any) => n !== notif));
                                                        setIsNotifOpen(false);
                                                    }}
                                                    className="w-full text-left px-3 py-3 hover:bg-gray-50 dark:bg-[#0e0e13] dark:hover:bg-white/5 rounded-xl transition-colors cursor-pointer text-sm text-gray-700 dark:text-zinc-200"
                                                >
                                                    {notif.chat.isGroupChat
                                                        ? `New Message in ${notif.chat.chatName}`
                                                        : `New Message from ${notif.sender.name}`}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="relative">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="flex items-center gap-3 bg-gray-50 dark:bg-[#0e0e13] hover:bg-gray-100 dark:bg-white/5 dark:hover:bg-white/10 p-1.5 pr-4 rounded-full transition-all border border-gray-200 dark:border-white/5 active:scale-95"
                        >
                            <img
                                src={user.pic}
                                alt={user.name}
                                onError={(e) => { (e.target as HTMLImageElement).src = '/default-avatar.svg'; }}
                                className="w-8 h-8 rounded-full object-cover border border-gray-200 dark:border-white/5"
                            />
                            <ChevronDown size={14} className={`text-gray-400 dark:text-zinc-500 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
                        </button>

                        <AnimatePresence>
                            {isMenuOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute right-0 top-full mt-4 w-60 bg-white dark:bg-[#0a0a0f] border border-gray-200 dark:border-white/5 rounded-[1.5rem] shadow-xl z-50 overflow-hidden"
                                >
                                    <div className="p-3 space-y-1">
                                        <button
                                            onClick={() => { setIsProfileOpen(true); setIsMenuOpen(false); }}
                                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-500 dark:text-zinc-400 hover:bg-gray-50 dark:bg-[#0e0e13] dark:hover:bg-white/5 hover:text-gray-700 dark:text-zinc-200 dark:hover:text-zinc-200 rounded-xl transition-all font-medium group"
                                        >
                                            <UserIcon size={16} className="text-gray-400 dark:text-zinc-500 group-hover:text-emerald-500" />
                                            My Profile
                                        </button>
                                        <div className="h-px bg-gray-100 dark:bg-white/5 my-1 mx-2" />
                                        <button
                                            onClick={logoutHandler}
                                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-500 dark:text-zinc-400 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all font-medium group"
                                        >
                                            <LogOut size={16} className="text-gray-400 dark:text-zinc-500 group-hover:text-red-500" />
                                            Logout Session
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {user && (
                <ProfileModal
                    user={user}
                    isOpen={isProfileOpen}
                    onClose={() => setIsProfileOpen(false)}
                />
            )}

            <AnimatePresence>
                {isSearchOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[60]"
                            onClick={() => setIsSearchOpen(false)}
                        />
                        <motion.div
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed left-0 top-0 h-full w-[400px] max-w-full z-[70] bg-white dark:bg-[#0a0a0f] border-r border-gray-200 dark:border-white/5 shadow-xl p-8 flex flex-col"
                        >
                            <div className="flex justify-between items-center mb-10">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Search Network</h2>
                                    <p className="text-xs text-gray-400 dark:text-zinc-500 font-medium uppercase tracking-widest mt-1">Connect with users</p>
                                </div>
                                <button onClick={() => setIsSearchOpen(false)} className="text-gray-400 dark:text-zinc-500 hover:text-gray-700 dark:text-zinc-200 dark:hover:text-zinc-200 transition-colors p-2 bg-gray-100 dark:bg-white/5 rounded-full hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <div className="relative">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500" size={18} />
                                        <input
                                            className="glass-input pl-12"
                                            placeholder="Name or email address"
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                        />
                                    </div>
                                    <button
                                        onClick={handleSearch}
                                        disabled={loading}
                                        className="btn-primary w-full py-3.5 text-sm"
                                    >
                                        {loading ? <Loader2 className="animate-spin" size={20} /> : "Search Users"}
                                    </button>
                                </div>

                                <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar pr-2 max-h-[calc(100vh-320px)]">
                                    {searchResult?.map((user: any) => (
                                        <div
                                            key={user._id}
                                            onClick={() => accessChat(user._id)}
                                            className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-[#0e0e13] hover:bg-gray-100 dark:bg-white/5 dark:hover:bg-white/10 rounded-[1.25rem] cursor-pointer transition-all border border-gray-200/60 dark:border-white/[0.04] hover:border-gray-300 dark:border-white/10 dark:hover:border-white/20 group"
                                        >
                                            <img src={user.pic} alt={user.name} onError={(e) => { (e.target as HTMLImageElement).src = '/default-avatar.svg'; }} className="w-12 h-12 rounded-full object-cover border border-gray-200 dark:border-white/5 group-hover:border-emerald-400 transition-colors" />
                                            <div className="flex-1 overflow-hidden">
                                                <div className="flex items-center gap-1.5">
                                                    <h4 className="text-sm font-bold text-gray-700 dark:text-zinc-200 truncate group-hover:text-emerald-600 transition-colors">{user.name}</h4>
                                                    {user.isVerified && <BadgeCheck size={14} className="text-emerald-500 fill-emerald-500/10 shrink-0" />}
                                                </div>
                                                <p className="text-[11px] text-gray-400 dark:text-zinc-500 font-medium truncate uppercase tracking-tighter">{user.email}</p>
                                            </div>
                                        </div>
                                    ))}

                                    {loadingChat && <div className="flex items-center justify-center gap-2 text-emerald-500 py-6 text-xs font-bold uppercase tracking-widest animate-pulse">
                                        <Loader2 className="animate-spin" size={14} /> Synching Data...
                                    </div>}

                                    {!loading && searchResult.length === 0 && search && (
                                        <div className="text-center text-gray-400 dark:text-zinc-500 py-20">
                                            <div className="w-12 h-12 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <Search size={20} className="text-gray-300 dark:text-zinc-600" />
                                            </div>
                                            <p className="text-sm font-medium">No results found for "{search}"</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};

export default SideDrawer;
