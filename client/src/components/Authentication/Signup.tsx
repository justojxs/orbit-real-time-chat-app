import { useState } from "react";
import api from "../../lib/axios";
import { useNavigate } from "react-router-dom";
import { User, Mail, Lock, Camera, Loader2, CheckCircle2 } from "lucide-react";
import { useChatStore } from "../../store/useChatStore";
import { GoogleLogin } from "@react-oauth/google";

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
            data.append("cloud_name", "dtga8lwj3");

            try {
                const res = await fetch("https://api.cloudinary.com/v1_1/dtga8lwj3/image/upload", {
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

    const handleGoogleSuccess = async (credentialResponse: any) => {
        setLoading(true);
        try {
            const { data } = await api.post(
                "/api/user/google",
                { token: credentialResponse.credential },
                { headers: { "Content-type": "application/json" } }
            );

            localStorage.setItem("userInfo", JSON.stringify(data));
            setUser(data);
            initSocket(data);
            setLoading(false);
            navigate("/chats");
        } catch (error: any) {
            const errorMsg = error.response?.data?.message || error.message || "Google Signup failed";
            alert("Error Occurred: " + errorMsg);
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4 animate-scale-in">
            <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-zinc-500 ml-1">Full Name</label>
                <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500 group-focus-within:text-emerald-500 transition-colors" size={18} />
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
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-zinc-500 ml-1">Email</label>
                    <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500 group-focus-within:text-emerald-500 transition-colors" size={18} />
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
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-zinc-500 ml-1">Profile Picture (Optional)</label>
                    <label className="flex items-center gap-3 px-4 py-3.5 bg-gray-50 dark:bg-[#0e0e13] border border-gray-200 dark:border-white/5 hover:bg-gray-100 dark:bg-white/5 dark:hover:bg-white/10 hover:border-gray-300 dark:border-white/10 dark:hover:border-white/20 rounded-2xl cursor-pointer transition-all group overflow-hidden relative">
                        {pic ? (
                            <CheckCircle2 className="text-emerald-500 transition-transform animate-scale-in" size={20} />
                        ) : (
                            <Camera className="text-gray-400 dark:text-zinc-500 group-hover:text-emerald-500 transition-colors" size={20} />
                        )}
                        <span className={`text-sm font-medium transition-colors ${pic ? 'text-emerald-500' : 'text-gray-400 dark:text-zinc-500 group-hover:text-gray-600 dark:text-zinc-300'}`}>
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
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-zinc-500 ml-1">Password</label>
                    <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500 group-focus-within:text-emerald-500 transition-colors" size={18} />
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
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-zinc-500 ml-1">Verify</label>
                    <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500 group-focus-within:text-emerald-500 transition-colors" size={18} />
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

            <div className="pt-2">
                <button
                    onClick={submitHandler}
                    disabled={loading}
                    className="btn-primary w-full flex items-center justify-center gap-2 mt-4"
                >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : "Create Account"}
                </button>

                <div className="relative py-4">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-gray-200 dark:border-white/5"></span>
                    </div>
                    <div className="relative flex justify-center text-[9px] font-bold uppercase tracking-widest">
                        <span className="bg-[#f7f8fa] px-4 text-gray-400 dark:text-zinc-500">Or continue with</span>
                    </div>
                </div>

                <div className="w-full flex justify-center [&>div]:w-full [&>div>div]:!pr-0 [&>div>div]:!pl-0 [&>div>div]:w-full [&>div>div]:!w-full [&_iframe]:!w-full">
                    <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={() => alert('Google Signup Failed')}
                        theme="outline"
                        shape="pill"
                        text="signup_with"
                        width="100%"
                    />
                </div>
            </div>
        </div>
    );
};

export default Signup;
