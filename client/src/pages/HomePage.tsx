import { useState } from "react";
import Login from "../components/Authentication/Login";
import Signup from "../components/Authentication/Signup";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Zap, Globe, Users, MessageCircle, Bot, Lock, Linkedin } from "lucide-react";
import ThemeToggle from "../components/ThemeToggle";
import OrbiterText from "../components/OrbiterText";

const HIGHLIGHTS = [
    { icon: Zap, text: "Real-time WebSocket messaging" },
    { icon: Shield, text: "End-to-end encrypted conversations" },
    { icon: Bot, text: "Built-in AI assistant (Orbit AI)" },
    { icon: Users, text: "Group chats & file sharing" },
    { icon: Globe, text: "Voice notes & live whiteboard" },
];

const HomePage = () => {
    const [view, setView] = useState<"login" | "signup">("login");

    return (
        <div className="flex min-h-screen w-full bg-[#f7f8fa] dark:bg-[#08080c] text-gray-900 dark:text-white font-sans selection:bg-emerald-500/20 selection:text-emerald-900 relative overflow-hidden">
            {/* Theme Toggle Top Right */}
            <div className="absolute top-6 right-6 z-[100]">
                <ThemeToggle />
            </div>

            {/* Background image - Light Mode */}
            <div
                className="fixed inset-0 z-0 pointer-events-none dark:hidden"
                style={{
                    backgroundImage: 'url(/bg-mesh.png)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    opacity: 0.7,
                }}
            />

            {/* Background gradients - Dark Mode */}
            <div className="fixed inset-0 z-0 pointer-events-none hidden dark:block">
                <div className="absolute top-0 left-[-20%] w-[70%] h-[70%] bg-emerald-500/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-teal-500/10 rounded-full blur-[100px]" />
                <div className="absolute top-[20%] right-[20%] w-[30%] h-[30%] bg-indigo-500/5 rounded-full blur-[80px]" />
            </div>

            {/* Left panel — Brand */}
            <div className="hidden lg:flex flex-col justify-between w-[55%] p-12 xl:p-16 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="flex items-center gap-4"
                >
                    <img src="/logo.png" className="w-14 h-14 object-contain drop-shadow-lg" alt="Orbit" />
                    <span className="text-4xl font-extrabold tracking-tighter text-gray-900 dark:text-white drop-shadow-sm">ORBIT</span>
                </motion.div>

                <div className="flex-1 flex flex-col justify-center max-w-xl">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
                    >
                        <h1 className="text-5xl xl:text-6xl font-bold tracking-tight text-gray-900 dark:text-white leading-[1.1] mb-6">
                            Where individuals
                            <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500">connect</span>
                            <br />
                            without limits.
                        </h1>
                        <p className="text-lg text-gray-500 dark:text-zinc-400 font-medium leading-relaxed mb-10 max-w-md">
                            Orbit is your personal messaging platform engineered for speed, privacy, and intelligence. Everything you need to stay connected — in one place.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4, duration: 0.6 }}
                        className="space-y-3"
                    >
                        {HIGHLIGHTS.map((h, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -15 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.5 + i * 0.06 }}
                                className="flex items-center gap-3 group"
                            >
                                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100 group-hover:bg-emerald-100 transition-colors">
                                    <h.icon size={15} />
                                </div>
                                <span className="text-sm text-gray-600 dark:text-zinc-300 font-medium">{h.text}</span>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="flex items-center gap-6"
                >
                    <div className="flex items-center gap-2 text-gray-400 dark:text-zinc-500">
                        <Lock size={12} />
                        <span className="text-[10px] font-bold uppercase tracking-[0.15em]">256-bit Encryption</span>
                    </div>
                    <div className="w-1 h-1 rounded-full bg-gray-300" />
                    <div className="flex items-center gap-2 text-gray-400 dark:text-zinc-500">
                        <MessageCircle size={12} />
                        <span className="text-[10px] font-bold uppercase tracking-[0.15em]">WebSocket Powered</span>
                    </div>
                </motion.div>
            </div>

            {/* Right panel — Auth */}
            <div className="flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-12 relative z-10 w-full lg:w-auto">
                <div className="w-full max-w-[440px] bg-white dark:bg-[#0c0c12] rounded-[2rem] p-6 sm:p-10 border border-gray-100 dark:border-white/[0.05] shadow-2xl shadow-gray-200/50 dark:shadow-black/50">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center gap-3.5 mb-10 lg:hidden"
                    >
                        <img src="/logo.png" className="w-12 h-12 object-contain drop-shadow-md" alt="Orbit" />
                        <span className="text-3xl font-extrabold tracking-tighter text-gray-900 dark:text-white drop-shadow-sm">ORBIT</span>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
                    >
                        <div className="mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight mb-1 flex items-center gap-2 flex-wrap">
                                {view === "login" ? (
                                    <>
                                        <span>Welcome back,</span>
                                        <OrbiterText />
                                    </>
                                ) : (
                                    "Create your account"
                                )}
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-zinc-400 font-medium mt-1.5">
                                {view === "login"
                                    ? "Enter your credentials to access your account."
                                    : "Join thousands of users already on Orbit."}
                            </p>
                        </div>

                        <div className="flex mb-8 bg-gray-100 dark:bg-[#13131a] p-1.5 rounded-xl border border-gray-200/60 dark:border-white/[0.08] relative overflow-hidden">
                            <motion.div
                                animate={{ x: view === "login" ? "0%" : "100%" }}
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                className="absolute inset-y-1.5 left-1.5 w-[calc(50%-6px)] bg-emerald-500 rounded-lg shadow-md"
                            />
                            <button
                                onClick={() => setView("login")}
                                className={`flex-1 py-3 rounded-lg text-xs font-bold tracking-widest uppercase transition-colors duration-500 relative z-10 ${view === "login" ? "text-white" : "text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:text-zinc-200 dark:hover:text-zinc-200"}`}
                            >
                                Log In
                            </button>
                            <button
                                onClick={() => setView("signup")}
                                className={`flex-1 py-3 rounded-lg text-xs font-bold tracking-widest uppercase transition-colors duration-500 relative z-10 ${view === "signup" ? "text-white" : "text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:text-zinc-200 dark:hover:text-zinc-200"}`}
                            >
                                Sign Up
                            </button>
                        </div>

                        <div className="min-h-[400px]">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={view}
                                    initial={{ opacity: 0, x: 15 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -15 }}
                                    transition={{ duration: 0.25 }}
                                >
                                    {view === "login" ? <Login /> : <Signup />}
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="mt-8 flex items-center justify-center gap-4 lg:hidden"
                    >
                        <div className="flex items-center gap-1.5 text-gray-400 dark:text-zinc-500">
                            <Lock size={10} />
                            <span className="text-[9px] font-bold uppercase tracking-[0.15em]">Encrypted</span>
                        </div>
                        <div className="w-1 h-1 rounded-full bg-gray-300" />
                        <div className="flex items-center gap-1.5 text-gray-400 dark:text-zinc-500">
                            <Zap size={10} />
                            <span className="text-[9px] font-bold uppercase tracking-[0.15em]">Real-time</span>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Footer */}
            <motion.footer
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1, duration: 0.8 }}
                className="fixed bottom-0 left-0 right-0 z-[90] py-4 px-6 flex items-center justify-center gap-2 bg-white/60 dark:bg-[#08080c]/70 backdrop-blur-md"
            >
                <span className="text-[13px] text-gray-400 dark:text-zinc-500 font-medium tracking-wide">
                    Designed & maintained with{" "}
                    <span className="text-red-500 text-base align-middle">❤️</span>{" "}
                    by{" "}
                    <span className="font-semibold text-gray-500 dark:text-zinc-400">Ojas Gupta</span>
                </span>
                <a
                    href="https://www.linkedin.com/in/ojas-gupta-aa6443206/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-1.5 text-gray-400 dark:text-zinc-500 hover:text-[#0A66C2] dark:hover:text-[#0A66C2] transition-colors duration-300"
                    aria-label="Ojas Gupta's LinkedIn Profile"
                >
                    <Linkedin size={18} />
                </a>
            </motion.footer>
        </div>
    );
};

export default HomePage;
