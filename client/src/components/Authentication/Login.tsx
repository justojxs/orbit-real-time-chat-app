import { useState } from "react";
import api from "../../lib/axios";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, Loader2, User as UserIcon } from "lucide-react";
import { useChatStore } from "../../store/useChatStore";
import { GoogleLogin } from "@react-oauth/google";

const Login = () => {
    const { setUser, initSocket } = useChatStore();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const submitHandler = async () => {
        setLoading(true);
        if (!email || !password) {
            alert("Please Fill all the Feilds");
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
                "/api/user/login",
                { email, password },
                config
            );

            localStorage.setItem("userInfo", JSON.stringify(data));
            setUser(data);
            initSocket(data);
            setLoading(false);
            navigate("/chats");
        } catch (error: any) {
            const errorMsg = error.response?.data?.message || error.message || "Unable to login. Please try again.";
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
            const errorMsg = error.response?.data?.message || error.message || "Google Login failed";
            alert("Error Occurred: " + errorMsg);
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-scale-in">
            <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-zinc-500 ml-1">Email Address</label>
                <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500 group-focus-within:text-emerald-500 transition-colors" size={18} />
                    <input
                        type="email"
                        placeholder="name@example.com"
                        className="glass-input pl-12"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>
            </div>

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

            <div className="pt-2 space-y-3">
                <button
                    onClick={submitHandler}
                    disabled={loading}
                    className="btn-primary w-full flex items-center justify-center gap-2"
                >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : "Login to Account"}
                </button>

                <button
                    className="w-full py-4 text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-zinc-500 hover:text-gray-700 dark:text-zinc-200 dark:hover:text-zinc-200 transition-all flex items-center justify-center gap-2 group"
                    onClick={async () => {
                        setLoading(true);
                        try {
                            const { data } = await api.post(
                                "/api/user/login",
                                { email: "guest@example.com", password: "123456" },
                                { headers: { "Content-type": "application/json" } }
                            );
                            localStorage.setItem("userInfo", JSON.stringify(data));
                            setUser(data);
                            initSocket(data);
                            navigate("/chats");
                        } catch (error: any) {
                            alert("Error logging in as guest");
                        } finally {
                            setLoading(false);
                        }
                    }}
                >
                    <UserIcon className="text-gray-400 dark:text-zinc-500 group-hover:text-emerald-500 transition-colors" size={14} />
                    Start As Guest User
                </button>

                <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-gray-200 dark:border-white/5"></span>
                    </div>
                    <div className="relative flex justify-center text-[9px] font-bold uppercase tracking-widest">
                        <span className="bg-[#f7f8fa] px-4 text-gray-400 dark:text-zinc-500">Or continue with</span>
                    </div>
                </div>

                <div className="w-full flex justify-center pt-2 [&>div]:w-full [&>div>div]:!pr-0 [&>div>div]:!pl-0 [&>div>div]:w-full [&>div>div]:!w-full [&_iframe]:!w-full">
                    <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={() => alert('Google Login Failed')}
                        theme="outline"
                        shape="pill"
                        text="signin_with"
                        width="100%"
                    />
                </div>
            </div>
        </div>
    );
};

export default Login;
