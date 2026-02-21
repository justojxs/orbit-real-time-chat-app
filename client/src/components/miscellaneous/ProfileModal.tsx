import { useState, useRef, useEffect } from "react";
import { X, Camera, Loader2, User as UserIcon, Lock, Mail, ShieldCheck } from "lucide-react";
import api from "../../lib/axios";
import { useChatStore } from "../../store/useChatStore";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";

interface ProfileModalProps {
    user: any;
    children?: React.ReactNode;
    isOpen: boolean;
    onClose: () => void;
}

const ProfileModal = ({ user: displayUser, children, isOpen, onClose }: ProfileModalProps) => {
    const { user: loggedInUser, setUser } = useChatStore();
    const isCurrentUser = displayUser?._id === loggedInUser?._id;

    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState("");
    const [password, setPassword] = useState("");
    const [pic, setPic] = useState("");
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (displayUser) {
            setName(displayUser.name || "");
            setPic(displayUser.pic || "");
            setPassword("");
            setIsEditing(false);
        }
    }, [displayUser, isOpen]);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageUpload = async (file: File) => {
        if (!file) return;
        setUploading(true);

        const data = new FormData();
        data.append("file", file);
        data.append("upload_preset", "chat-app");
        data.append("cloud_name", "dencovhau");

        try {
            const res = await fetch("https://api.cloudinary.com/v1_1/dencovhau/image/upload", {
                method: "POST",
                body: data,
            });

            if (!res.ok) throw new Error("Image upload failed");
            const imgData = await res.json();
            setPic(imgData.secure_url || imgData.url);
        } catch (error: any) {
            console.error("Profile image upload error:", error);
        } finally {
            setUploading(false);
        }
    };

    const handleUpdate = async () => {
        if (!loggedInUser || !loggedInUser.token) return;
        try {
            setLoading(true);
            const config = {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${loggedInUser.token}`,
                },
            };

            const { data } = await api.put(
                "/api/user/profile",
                { name, password, pic },
                config
            );

            const updatedUser = { ...data, token: loggedInUser.token };
            localStorage.setItem("userInfo", JSON.stringify(updatedUser));
            setUser(updatedUser);

            setIsEditing(false);
            setPassword("");
        } catch (error: any) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const modalContent = (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-hidden">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-md"
                        onClick={onClose}
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="bg-[#121217] border border-white/[0.08] rounded-[2rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] w-full max-w-[380px] relative overflow-hidden flex flex-col items-center p-8 gap-6 z-10"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-5 right-5 text-zinc-500 hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>

                        {/* Header */}
                        <div className="text-center">
                            <h2 className="text-xl font-bold text-white tracking-tight">
                                {isEditing ? "Edit Profile" : isCurrentUser ? "Your Profile" : "User Details"}
                            </h2>
                            <div className="flex items-center justify-center gap-1.5 mt-1">
                                <ShieldCheck size={12} className="text-emerald-500" />
                                <span className="text-[9px] uppercase font-bold tracking-widest text-zinc-500">Verified User Identity</span>
                            </div>
                        </div>

                        {/* Avatar Section */}
                        <div className="relative group">
                            <div className="relative w-28 h-28">
                                <div className="absolute inset-0 bg-emerald-500/10 blur-2xl rounded-full"></div>
                                <img
                                    className="w-full h-full rounded-full border-2 border-white/10 p-1 object-cover relative z-10"
                                    src={pic || displayUser?.pic}
                                    alt={displayUser?.name}
                                />
                                <AnimatePresence>
                                    {isEditing && isCurrentUser && (
                                        <motion.button
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            onClick={() => fileInputRef.current?.click()}
                                            className="absolute inset-0 rounded-full bg-black/60 backdrop-blur-[1px] z-20 flex flex-col items-center justify-center cursor-pointer border border-emerald-500/30"
                                        >
                                            {uploading ? (
                                                <Loader2 className="text-emerald-400 animate-spin" size={20} />
                                            ) : (
                                                <Camera className="text-white" size={20} />
                                            )}
                                        </motion.button>
                                    )}
                                </AnimatePresence>
                                <input
                                    type="file"
                                    className="hidden"
                                    ref={fileInputRef}
                                    accept="image/*"
                                    onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                                />
                            </div>

                        </div>

                        {/* Info Section */}
                        <div className="w-full">
                            <AnimatePresence mode="wait">
                                {isEditing && isCurrentUser ? (
                                    <motion.div
                                        key="editing"
                                        initial={{ opacity: 0, scale: 0.98 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.98 }}
                                        className="w-full space-y-4"
                                    >
                                        <div className="relative">
                                            <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
                                            <input
                                                className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl pl-11 pr-4 py-3 text-sm text-white focus:border-emerald-500/30 outline-none transition-all"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                placeholder="Name"
                                            />
                                        </div>
                                        <div className="relative">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
                                            <input
                                                type="password"
                                                className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl pl-11 pr-4 py-3 text-sm text-white focus:border-emerald-500/30 outline-none transition-all"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                placeholder="New Password (optional)"
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setIsEditing(false)}
                                                className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-zinc-400 rounded-xl text-xs font-bold transition-all"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleUpdate}
                                                disabled={loading || uploading}
                                                className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                                            >
                                                {loading ? <Loader2 className="animate-spin mx-auto" size={18} /> : "Save"}
                                            </button>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="viewing"
                                        initial={{ opacity: 0, scale: 0.98 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.98 }}
                                        className="w-full space-y-3"
                                    >
                                        <div className="bg-white/[0.03] border border-white/[0.05] p-4 rounded-2xl flex items-center gap-3">
                                            <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-500">
                                                <UserIcon size={18} />
                                            </div>
                                            <div className="overflow-hidden">
                                                <p className="text-[9px] uppercase font-black text-zinc-600 tracking-widest">Name</p>
                                                <p className="text-sm font-bold text-white truncate">{displayUser?.name}</p>
                                            </div>
                                        </div>
                                        <div className="bg-white/[0.03] border border-white/[0.05] p-4 rounded-2xl flex items-center gap-3">
                                            <div className="p-2.5 bg-zinc-800 rounded-xl text-zinc-500">
                                                <Mail size={18} />
                                            </div>
                                            <div className="overflow-hidden">
                                                <p className="text-[9px] uppercase font-black text-zinc-600 tracking-widest">Email</p>
                                                <p className="text-sm font-bold text-zinc-400 truncate">{displayUser?.email}</p>
                                            </div>
                                        </div>

                                        {isCurrentUser && (
                                            <button
                                                onClick={() => setIsEditing(true)}
                                                className="w-full mt-2 py-4 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white border border-emerald-500/20 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-[0.98]"
                                            >
                                                Edit Profile
                                            </button>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );

    // If it has children, it behaves like a trigger wrapper
    if (children) {
        return (
            <div className="contents">
                {children}
                {createPortal(modalContent, document.body)}
            </div>
        );
    }

    return createPortal(modalContent, document.body);
};

export default ProfileModal;
