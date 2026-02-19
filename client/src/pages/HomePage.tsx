import { useState, useEffect } from "react";
import Login from "../components/Authentication/Login";
import Signup from "../components/Authentication/Signup";
import { motion, AnimatePresence } from "framer-motion";

const HomePage = () => {
    const [view, setView] = useState<"login" | "signup">("login");
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 100);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const scrollToAuth = () => {
        const authSection = document.getElementById("auth-section");
        authSection?.scrollIntoView({ behavior: "smooth" });
    };

    const renderAuth = (type: "login" | "signup") => (
        <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-md glass-panel p-1 border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] bg-[#0c0c0e]/80"
        >
            <div className="p-8">
                <div className="flex mb-8 bg-zinc-900/50 p-1 rounded-2xl border border-white/5 relative overflow-hidden">
                    <motion.div
                        animate={{ x: type === "login" ? "0%" : "100%" }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="absolute inset-y-1 left-1 w-[calc(50%-4px)] bg-emerald-500 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                    />
                    <button
                        onClick={() => setView("login")}
                        className={`flex-1 py-3 rounded-xl text-xs font-bold tracking-widest uppercase transition-colors duration-500 relative z-10 ${type === "login" ? "text-white" : "text-zinc-500 hover:text-white"}`}
                    >
                        Log In
                    </button>
                    <button
                        onClick={() => setView("signup")}
                        className={`flex-1 py-3 rounded-xl text-xs font-bold tracking-widest uppercase transition-colors duration-500 relative z-10 ${type === "signup" ? "text-white" : "text-zinc-500 hover:text-white"}`}
                    >
                        Sign Up
                    </button>
                </div>

                <div className="min-h-[420px]">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={type}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            {type === "login" ? <Login /> : <Signup />}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </motion.div>
    );

    return (
        <div className="flex flex-col w-full text-zinc-100 relative font-sans bg-[#0d0d12] min-h-[200vh] selection:bg-emerald-500/30 selection:text-emerald-100">
            {/* Ultra-Premium Background */}
            <div className="fixed inset-0 z-0 premium-bg pointer-events-none"></div>

            {/* Premium Sticky Navbar */}
            <nav className={`fixed top-0 w-full z-50 transition-all duration-700 px-6 py-4 flex justify-center ${isScrolled ? "translate-y-0" : "-translate-y-full opacity-0"}`}>
                <div className="w-full max-w-5xl glass-panel px-6 py-3 flex justify-between items-center rounded-2xl border-white/10">
                    <div className="flex items-center gap-3 cursor-pointer group" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
                        <img src="/logo.png" className="w-8 h-8 object-contain group-hover:rotate-[360deg] transition-transform duration-700" alt="Orbit Logo" />
                        <span className="text-xl font-bold tracking-tighter text-white">ORBIT</span>
                    </div>

                    <div className="flex gap-8 items-center">
                        <button
                            onClick={() => { setView("login"); scrollToAuth(); }}
                            className="text-xs font-bold tracking-widest uppercase text-zinc-400 hover:text-emerald-400 transition-colors"
                        >
                            Log In
                        </button>
                        <button
                            onClick={() => { setView("signup"); scrollToAuth(); }}
                            className="px-6 py-2.5 text-xs font-bold tracking-widest uppercase bg-emerald-500 text-white rounded-xl hover:bg-emerald-400 transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] active:scale-95 hover:scale-105"
                        >
                            Sign Up
                        </button>
                    </div>
                </div>
            </nav>

            <div className="relative z-10 w-full">
                {/* Hero Section */}
                <section className="h-screen w-full flex flex-col items-center justify-center px-6 relative overflow-hidden">
                    {/* Floating Ambient Elements */}
                    <motion.div
                        animate={{
                            y: [0, -20, 0],
                            x: [0, 10, 0],
                            rotate: [0, 5, 0]
                        }}
                        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute top-1/4 -left-20 w-96 h-96 bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none"
                    />
                    <motion.div
                        animate={{
                            y: [0, 30, 0],
                            x: [0, -15, 0],
                        }}
                        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                        className="absolute bottom-1/4 -right-20 w-[500px] h-[500px] bg-teal-500/5 blur-[140px] rounded-full pointer-events-none"
                    />

                    <div className="max-w-4xl w-full flex flex-col items-center relative z-10">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
                            animate={{ opacity: 1, scale: 1, rotate: 0 }}
                            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                            className="mb-12 relative group"
                        >
                            <div className="absolute inset-0 bg-emerald-500/20 blur-[100px] group-hover:bg-emerald-500/40 transition-colors duration-1000"></div>
                            <img
                                src="/logo.png"
                                className="w-32 h-32 md:w-48 md:h-48 object-contain relative animate-float transition-all hover:scale-110 duration-500 cursor-pointer"
                                alt="Orbit Logo"
                                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                            />
                        </motion.div>

                        <motion.div
                            initial="hidden"
                            animate="visible"
                            variants={{
                                hidden: { opacity: 0 },
                                visible: {
                                    opacity: 1,
                                    transition: { staggerChildren: 0.1, delayChildren: 0.3 }
                                }
                            }}
                            className="flex flex-col items-center"
                        >
                            <motion.h1
                                variants={{
                                    hidden: { opacity: 0, y: 40, filter: "blur(10px)" },
                                    visible: { opacity: 1, y: 0, filter: "blur(0px)" }
                                }}
                                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                                className="text-7xl md:text-[10rem] font-bold tracking-tighter text-white mb-6 text-center leading-[0.8] select-none"
                            >
                                ORBIT<span className="text-emerald-500">.</span>
                            </motion.h1>

                            <motion.p
                                variants={{
                                    hidden: { opacity: 0, y: 20 },
                                    visible: { opacity: 1, y: 0 }
                                }}
                                transition={{ duration: 0.8 }}
                                className="text-xl md:text-2xl text-zinc-400 font-medium tracking-tight mb-12 text-center max-w-xl leading-relaxed"
                            >
                                Next-generation messaging dedicated to <span className="text-white hover:text-emerald-400 transition-colors cursor-default">speed</span>, <span className="text-white hover:text-emerald-400 transition-colors cursor-default">clarity</span>, and <span className="text-white hover:text-emerald-400 transition-colors cursor-default">style</span>.
                            </motion.p>

                            <motion.button
                                variants={{
                                    hidden: { opacity: 0, scale: 0.9 },
                                    visible: { opacity: 1, scale: 1 }
                                }}
                                whileHover={{ scale: 1.05, boxShadow: "0 0 40px rgba(16,185,129,0.4)" }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => { setView("signup"); scrollToAuth(); }}
                                className="group px-12 py-5 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-2xl font-bold tracking-widest uppercase text-xs transition-all flex items-center gap-3 shadow-xl"
                            >
                                Get Started
                                <motion.svg
                                    animate={{ x: [0, 5, 0] }}
                                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </motion.svg>
                            </motion.button>
                        </motion.div>
                    </div>

                    {/* Infinite Scroll Hint */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.3 }}
                        transition={{ delay: 1.5, duration: 1 }}
                        className="absolute bottom-12 flex flex-col items-center gap-3"
                    >
                        <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-zinc-500">Scroll Down</span>
                        <div className="w-1 h-12 rounded-full overflow-hidden bg-white/10 relative">
                            <motion.div
                                animate={{ y: [0, 48, 0] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="absolute top-0 w-full h-1/3 bg-emerald-500"
                            />
                        </div>
                    </motion.div>
                </section>

                {/* Auth Section */}
                <section id="auth-section" className="min-h-screen w-full flex flex-col items-center justify-center py-32 px-6">
                    <div className="mb-16 text-center">
                        <span className="text-emerald-500 text-xs font-bold tracking-[0.5em] uppercase mb-4 block">Secure Access</span>
                        <h2 className="text-5xl md:text-6xl font-bold text-white tracking-tighter mb-4">Jump Into Orbit</h2>
                        <p className="text-zinc-400 font-medium text-lg">Join the future of decentralized real-time communication.</p>
                    </div>
                    {renderAuth(view)}
                </section>

                <footer className="w-full py-16 px-6 border-t border-white/[0.05] flex flex-col items-center gap-8">
                    <div className="flex items-center gap-2">
                        <img src="/logo.png" className="w-6 h-6 grayscale opacity-30" alt="Orbit Logo" />
                        <span className="text-sm font-bold tracking-tighter text-zinc-700">ORBIT ENGINE</span>
                    </div>
                    <p className="text-zinc-600 text-[10px] uppercase font-bold tracking-[0.4em]">Ojas Gupta DTU CSE 23/CS/290</p>
                </footer>
            </div>
        </div>
    );
};

export default HomePage;
