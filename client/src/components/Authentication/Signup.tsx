import { useState } from "react";
import api from "../../lib/axios";
import { useNavigate } from "react-router-dom";
import { User, Mail, Lock, Camera, Loader2, CheckCircle2 } from "lucide-react";
import { useChatStore } from "../../store/useChatStore";

const Signup = () => {
    const { setUser, initSocket } = useChatStore();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [confirmpassword, setConfirmpassword] = useState("");
    const [password, setPassword] = useState("");
    const [pic, setPic] = useState<string>();
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const postDetails = async (pics: any) => {
        if (!pics) return;
        setLoading(true);

        if (pics.type === "image/jpeg" || pics.type === "image/png" || pics.type === "image/webp") {
            const data = new FormData();
            data.append("file", pics);
            data.append("upload_preset", "chat-app");
            data.append("cloud_name", "dencovhau");

            try {
                const res = await fetch("https://api.cloudinary.com/v1_1/dencovhau/image/upload", {
                    method: "POST",
                    body: data,
                });

                if (!res.ok) throw new Error("Image upload failed");
                const cloudData = await res.json();
                setPic(cloudData.secure_url || cloudData.url);
            } catch (error: any) {
                console.error("Signup image upload error:", error);
                alert("Failed to upload profile picture: " + (error.message || "Unknown error"));
            } finally {
                setLoading(false);
            }
        } else {
            alert("Please select a valid image (JPEG/PNG/WEBP)");
            setLoading(false);
        }
    };

    const submitHandler = async () => {
        setLoading(true);
        if (!name || !email || !password || !confirmpassword) {
            alert("Please Fill all the Feilds");
            setLoading(false);
            return;
        }
        if (password !== confirmpassword) {
            alert("Passwords Do Not Match");
            setLoading(false);
            return;
        }

        try {
            const config = {
                headers: {
                    "Content-type": "application/json",
                },
            };

            const { data } = await api.post(
                "/api/user",
                { name, email, password, pic },
                config
            );

            localStorage.setItem("userInfo", JSON.stringify(data));
            setUser(data);
            initSocket(data);
            setLoading(false);
            navigate("/chats");
        } catch (error: any) {
            const errorMsg = error.response?.data?.message || error.message || "Unable to sign up. Please try again.";
            alert("Error Occurred: " + errorMsg);
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4 animate-scale-in">
            <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 ml-1">Full Name</label>
                <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-emerald-500 transition-colors" size={18} />
                    <input
                        placeholder="John Doe"
                        className="glass-input pl-12"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 ml-1">Email</label>
                    <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-emerald-500 transition-colors" size={18} />
                        <input
                            type="email"
                            placeholder="email@example.com"
                            className="glass-input pl-12"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 ml-1">Profile Picture (Optional)</label>
                    <label className="flex items-center gap-3 px-4 py-3.5 bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.1] rounded-2xl cursor-pointer transition-all group overflow-hidden relative">
                        {pic ? (
                            <CheckCircle2 className="text-emerald-500 transition-transform animate-scale-in" size={20} />
                        ) : (
                            <Camera className="text-zinc-600 group-hover:text-emerald-500 transition-colors" size={20} />
                        )}
                        <span className={`text-sm font-medium transition-colors ${pic ? 'text-emerald-400' : 'text-zinc-500 group-hover:text-zinc-300'}`}>
                            {pic ? "Image Ready" : "Upload Shot"}
                        </span>
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e: any) => postDetails(e.target.files[0])}
                        />
                    </label>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 ml-1">Password</label>
                    <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-emerald-500 transition-colors" size={18} />
                        <input
                            type="password"
                            placeholder="••••••••"
                            className="glass-input pl-12"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 ml-1">Verify</label>
                    <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-emerald-500 transition-colors" size={18} />
                        <input
                            type="password"
                            placeholder="••••••••"
                            className="glass-input pl-12"
                            value={confirmpassword}
                            onChange={(e) => setConfirmpassword(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <button
                onClick={submitHandler}
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 mt-4"
            >
                {loading ? <Loader2 className="animate-spin" size={20} /> : "Create Account"}
            </button>
        </div>
    );
};

export default Signup;
