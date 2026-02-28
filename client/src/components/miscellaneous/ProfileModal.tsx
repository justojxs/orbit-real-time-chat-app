import { useState, useRef, useEffect, useCallback } from "react";
import { X, Camera, Loader2, User as UserIcon, Lock, Mail, ShieldCheck, Crop as CropIcon } from "lucide-react";
import api from "../../lib/axios";
import { useChatStore } from "../../store/useChatStore";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import Cropper from 'react-easy-crop';
import getCroppedImg from "../../utils/cropImage";

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

    // Cropper State
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

    useEffect(() => {
        if (displayUser) {
            setName(displayUser.name || "");
            setPic(displayUser.pic || "");
            setPassword("");
            setIsEditing(false);
        }
    }, [displayUser, isOpen]);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const showCropper = async (file: File) => {
        if (!file) return;
        const reader = new FileReader();
        reader.addEventListener("load", () => {
            setImageSrc(reader.result?.toString() || null);
        });
        reader.readAsDataURL(file);
    };

    const handleCropImage = async () => {
        if (!imageSrc || !croppedAreaPixels || !loggedInUser) {
            return;
        }

        try {
            setUploading(true);

            // Step 1: Crop
            let croppedFile: File | null = null;
            try {
                croppedFile = await getCroppedImg(imageSrc, croppedAreaPixels);
            } catch (err: any) {
                console.error("STEP 1 CROP FAILED: ", err);
                return;
            }
            if (!croppedFile) return;

            // Step 2: Upload to Cloudinary
            let imgData: any;
            try {
                const formData = new FormData();
                formData.append("file", croppedFile);
                formData.append("upload_preset", "chat-app");
                formData.append("cloud_name", "dtga8lwj3");

                const res = await fetch("https://api.cloudinary.com/v1_1/dtga8lwj3/image/upload", {
                    method: "POST",
                    body: formData,
                });
                imgData = await res.json();
            } catch (err: any) {
                console.error("STEP 2 UPLOAD FAILED: ", err);
                return;
            }
            if (imgData.error) {
                console.error("STEP 2 CLOUDINARY ERROR: ", imgData.error);
                return;
            }

            const newPicUrl = imgData.secure_url || imgData.url;
            if (!newPicUrl) return;

            // Step 3: Save to backend
            try {
                const config = {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${loggedInUser.token}`,
                    },
                };
                const { data } = await api.put("/api/user/profile", { name, pic: newPicUrl }, config);

                const updatedUser = { ...data, token: loggedInUser.token };
                localStorage.setItem("userInfo", JSON.stringify(updatedUser));
                setUser(updatedUser);
                setPic(newPicUrl);
                setImageSrc(null);
            } catch (err: any) {
                console.error("STEP 3 BACKEND FAILED: ", err);
                return;
            }
        } catch (e: any) {
            console.error("UNEXPECTED: ", e);
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
                        className="absolute inset-0 bg-black/20 backdrop-blur-md"
                        onClick={onClose}
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="bg-white dark:bg-[#0a0a0f] border border-gray-300 dark:border-white/10 rounded-[2rem] shadow-xl w-full max-w-[380px] relative overflow-hidden flex flex-col items-center p-8 gap-6 z-10"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-5 right-5 text-gray-400 dark:text-zinc-500 hover:text-gray-900 dark:text-white dark:hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>

                        {/* Content Container (Cropper OR Profile) */}
                        {imageSrc ? (
                            <div className="w-full flex flex-col items-center">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight mb-4 flex items-center gap-2">
                                    <CropIcon size={20} className="text-emerald-500" />
                                    Crop Picture
                                </h2>
                                <div className="relative w-full h-64 bg-black rounded-xl overflow-hidden mb-6">
                                    <Cropper
                                        image={imageSrc}
                                        crop={crop}
                                        zoom={zoom}
                                        aspect={1}
                                        cropShape="round"
                                        showGrid={false}
                                        onCropChange={setCrop}
                                        onCropComplete={onCropComplete}
                                        onZoomChange={setZoom}
                                    />
                                </div>
                                <div className="flex gap-2 w-full">
                                    <button
                                        onClick={() => setImageSrc(null)}
                                        className="flex-1 py-3 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20 text-gray-500 dark:text-zinc-400 rounded-xl text-xs font-bold transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleCropImage}
                                        disabled={uploading}
                                        className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-gray-900 dark:text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                                    >
                                        {uploading ? <Loader2 className="animate-spin" size={16} /> : "Crop & Upload"}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* Header */}
                                <div className="text-center">
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                                        {isEditing ? "Edit Profile" : isCurrentUser ? "Your Profile" : "User Details"}
                                    </h2>
                                    <div className="flex items-center justify-center gap-1.5 mt-1">
                                        <ShieldCheck size={12} className="text-emerald-500" />
                                        <span className="text-[9px] uppercase font-bold tracking-widest text-gray-400 dark:text-zinc-500">Verified User Identity</span>
                                    </div>
                                </div>

                                {/* Avatar Section */}
                                <div className="relative group">
                                    <div className="relative w-28 h-28">
                                        <div className="absolute inset-0 bg-emerald-50 blur-2xl rounded-full"></div>
                                        <img
                                            className="w-full h-full rounded-full border-2 border-gray-200 dark:border-white/5 p-1 object-cover relative z-10"
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
                                                    className="absolute inset-0 rounded-full bg-black/20 backdrop-blur-[1px] z-20 flex flex-col items-center justify-center cursor-pointer border border-emerald-300"
                                                >
                                                    {uploading ? (
                                                        <Loader2 className="text-emerald-500 animate-spin" size={20} />
                                                    ) : (
                                                        <Camera className="text-gray-900 dark:text-white" size={20} />
                                                    )}
                                                </motion.button>
                                            )}
                                        </AnimatePresence>
                                        <input
                                            type="file"
                                            className="hidden"
                                            ref={fileInputRef}
                                            accept="image/jpeg,image/png,image/webp"
                                            onChange={(e) => {
                                                if (e.target.files?.[0]) {
                                                    showCropper(e.target.files[0]);
                                                    e.target.value = ''; // Reset input to allow submitting same file again
                                                }
                                            }}
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
                                                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500" size={16} />
                                                    <input
                                                        className="w-full bg-gray-50 dark:bg-[#0e0e13] border border-gray-200 dark:border-white/5 rounded-xl pl-11 pr-4 py-3 text-sm text-gray-900 dark:text-white focus:border-emerald-300 outline-none transition-all"
                                                        value={name}
                                                        onChange={(e) => setName(e.target.value)}
                                                        placeholder="Name"
                                                    />
                                                </div>
                                                <div className="relative">
                                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500" size={16} />
                                                    <input
                                                        type="password"
                                                        className="w-full bg-gray-50 dark:bg-[#0e0e13] border border-gray-200 dark:border-white/5 rounded-xl pl-11 pr-4 py-3 text-sm text-gray-900 dark:text-white focus:border-emerald-300 outline-none transition-all"
                                                        value={password}
                                                        onChange={(e) => setPassword(e.target.value)}
                                                        placeholder="New Password (optional)"
                                                    />
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => setIsEditing(false)}
                                                        className="flex-1 py-3 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20 text-gray-500 dark:text-zinc-400 rounded-xl text-xs font-bold transition-all"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        onClick={handleUpdate}
                                                        disabled={loading || uploading}
                                                        className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-gray-900 dark:text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50"
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
                                                <div className="bg-gray-50 dark:bg-[#0e0e13] border border-gray-200 dark:border-white/5 p-4 rounded-2xl flex items-center gap-3">
                                                    <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-500">
                                                        <UserIcon size={18} />
                                                    </div>
                                                    <div className="overflow-hidden">
                                                        <p className="text-[9px] uppercase font-black text-gray-400 dark:text-zinc-500 tracking-widest">Name</p>
                                                        <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{displayUser?.name}</p>
                                                    </div>
                                                </div>
                                                <div className="bg-gray-50 dark:bg-[#0e0e13] border border-gray-200 dark:border-white/5 p-4 rounded-2xl flex items-center gap-3">
                                                    <div className="p-2.5 bg-gray-100 dark:bg-white/5 rounded-xl text-gray-400 dark:text-zinc-500">
                                                        <Mail size={18} />
                                                    </div>
                                                    <div className="overflow-hidden">
                                                        <p className="text-[9px] uppercase font-black text-gray-400 dark:text-zinc-500 tracking-widest">Email</p>
                                                        <p className="text-sm font-bold text-gray-500 dark:text-zinc-400 truncate">{displayUser?.email}</p>
                                                    </div>
                                                </div>

                                                {isCurrentUser && (
                                                    <button
                                                        onClick={() => setIsEditing(true)}
                                                        className="w-full mt-2 py-4 bg-emerald-50 hover:bg-emerald-500 text-emerald-500 hover:text-gray-900 dark:text-white dark:hover:text-white border border-emerald-200 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-[0.98]"
                                                    >
                                                        Edit Profile
                                                    </button>
                                                )}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </>
                        )}
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
