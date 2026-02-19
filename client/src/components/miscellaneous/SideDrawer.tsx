import { useState, useEffect } from "react";
import { useChatState } from "../../context/ChatProvider";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Search, Bell, ChevronDown, X, LogOut, User as UserIcon, Loader2 } from "lucide-react";
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

    const {
        setSelectedChat,
        user,
        notification,
        chats,
        setChats,
    } = useChatState();

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
            const { data } = await axios.get(`/api/user?search=${search}`, config);
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
            const { data } = await axios.post(`/api/chat`, { userId }, config);

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
            <div className="flex justify-between items-center bg-zinc-950/40 backdrop-blur-3xl px-8 py-4 border-b border-white/[0.05] w-full relative z-40">
                <button
                    className="flex items-center gap-3 px-5 py-2.5 text-zinc-400 hover:text-white transition-all bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.05] rounded-2xl group"
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
                    <h1 className="text-2xl font-bold tracking-tighter text-white">Orbit</h1>
                </div>

                <div className="flex items-center gap-6">
                    <div className="relative cursor-pointer group">
                        <div className="hover:bg-white/[0.05] p-2.5 rounded-full transition-colors relative">
                            <Bell className="text-zinc-400 group-hover:text-white transition-colors" size={20} />
                            {notification.length > 0 && (
                                <span className="absolute top-2 right-2 bg-emerald-500 text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-full font-bold shadow-[0_0_10px_rgba(16,185,129,0.5)]">
                                    {notification.length}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="relative">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="flex items-center gap-3 bg-white/[0.03] hover:bg-white/[0.06] p-1.5 pr-4 rounded-full transition-all border border-white/[0.1] active:scale-95"
                        >
                            <img
                                src={user.pic}
                                alt={user.name}
                                className="w-8 h-8 rounded-full object-cover border border-white/10"
                            />
                            <ChevronDown size={14} className={`text-zinc-500 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
                        </button>

                        <AnimatePresence>
                            {isMenuOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute right-0 top-full mt-4 w-60 bg-[#0c0c0e]/90 border border-white/[0.08] rounded-[1.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50 overflow-hidden backdrop-blur-3xl"
                                >
                                    <div className="p-3 space-y-1">
                                        <button
                                            onClick={() => { setIsProfileOpen(true); setIsMenuOpen(false); }}
                                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-zinc-400 hover:bg-white/[0.05] hover:text-white rounded-xl transition-all font-medium group"
                                        >
                                            <UserIcon size={16} className="text-zinc-600 group-hover:text-emerald-500" />
                                            My Profile
                                        </button>
                                        <div className="h-px bg-white/[0.05] my-1 mx-2" />
                                        <button
                                            onClick={logoutHandler}
                                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-zinc-500 hover:bg-red-500/10 hover:text-red-400 rounded-xl transition-all font-medium group"
                                        >
                                            <LogOut size={16} className="text-zinc-700 group-hover:text-red-500" />
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
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
                            onClick={() => setIsSearchOpen(false)}
                        />
                        <motion.div
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed left-0 top-0 h-full w-[400px] max-w-full z-[70] bg-[#08080a] border-r border-white/[0.05] shadow-[50px_0_100px_rgba(0,0,0,0.5)] p-8 flex flex-col"
                        >
                            <div className="flex justify-between items-center mb-10">
                                <div>
                                    <h2 className="text-2xl font-bold text-white tracking-tight">Search Network</h2>
                                    <p className="text-xs text-zinc-500 font-medium uppercase tracking-widest mt-1">Connect with users</p>
                                </div>
                                <button onClick={() => setIsSearchOpen(false)} className="text-zinc-500 hover:text-white transition-colors p-2 bg-white/5 rounded-full hover:bg-white/10">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <div className="relative">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
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
                                            className="flex items-center gap-4 p-4 bg-white/[0.02] hover:bg-white/[0.05] rounded-[1.25rem] cursor-pointer transition-all border border-white/[0.02] hover:border-white/[0.08] group"
                                        >
                                            <img src={user.pic} alt={user.name} className="w-12 h-12 rounded-full object-cover border border-white/10 group-hover:border-emerald-500/30 transition-colors" />
                                            <div className="flex-1 overflow-hidden">
                                                <h4 className="text-sm font-bold text-zinc-100 truncate group-hover:text-emerald-400 transition-colors">{user.name}</h4>
                                                <p className="text-[11px] text-zinc-500 font-medium truncate uppercase tracking-tighter">{user.email}</p>
                                            </div>
                                        </div>
                                    ))}

                                    {loadingChat && <div className="flex items-center justify-center gap-2 text-emerald-400 py-6 text-xs font-bold uppercase tracking-widest animate-pulse">
                                        <Loader2 className="animate-spin" size={14} /> Synching Data...
                                    </div>}

                                    {!loading && searchResult.length === 0 && search && (
                                        <div className="text-center text-zinc-500 py-20">
                                            <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <Search size={20} className="text-zinc-700" />
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
