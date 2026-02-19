import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, Loader2, Sparkles } from "lucide-react";

const Login = () => {
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

            const { data } = await axios.post(
                "/api/user/login",
                { email, password },
                config
            );

            localStorage.setItem("userInfo", JSON.stringify(data));
            setLoading(false);
            navigate("/chats");
            window.location.reload();
        } catch (error: any) {
            const errorMsg = error.response?.data?.message || error.message || "Unable to login. Please try again.";
            alert("Error Occurred: " + errorMsg);
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-scale-in">
            <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 ml-1">Email Address</label>
                <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-emerald-500 transition-colors" size={18} />
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

            <div className="pt-2 space-y-3">
                <button
                    onClick={submitHandler}
                    disabled={loading}
                    className="btn-primary w-full flex items-center justify-center gap-2"
                >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : "Login to Account"}
                </button>

                <button
                    className="w-full py-4 text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-white transition-all flex items-center justify-center gap-2 group"
                    onClick={async () => {
                        setLoading(true);
                        try {
                            const { data } = await axios.post(
                                "/api/user/login",
                                { email: "guest@example.com", password: "123456" },
                                { headers: { "Content-type": "application/json" } }
                            );
                            localStorage.setItem("userInfo", JSON.stringify(data));
                            navigate("/chats");
                            window.location.reload();
                        } catch (error: any) {
                            alert("Error logging in as guest");
                        } finally {
                            setLoading(false);
                        }
                    }}
                >
                    <Sparkles className="text-zinc-700 group-hover:text-emerald-500 transition-colors" size={14} />
                    Start As Guest User
                </button>
            </div>
        </div>
    );
};

export default Login;
