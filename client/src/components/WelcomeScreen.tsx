import GroupChatModal from "./miscellaneous/GroupChatModal";
import { Users, Sparkles, Zap, Shield } from "lucide-react";
import { motion } from "framer-motion";

const WelcomeScreen = () => {
    return (
        <div className="flex flex-col items-center justify-center w-full min-h-full text-center px-8 py-12 relative overflow-y-auto custom-scrollbar">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 blur-[130px] rounded-full point-events-none opacity-50" />

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative group mb-12 flex-shrink-0"
            >
                <div className="absolute inset-0 bg-emerald-500/20 blur-[60px] rounded-full group-hover:bg-emerald-500/30 transition-all duration-700" />
                <div className="relative w-32 h-32 bg-zinc-950/50 backdrop-blur-3xl border border-white/10 rounded-[3rem] flex items-center justify-center shadow-2xl transition-all duration-500 hover:rotate-6">
                    <img src="/logo.png" alt="Orbit Logo" className="w-16 h-16 object-contain drop-shadow-2xl" />
                </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="relative z-10 space-y-4 mb-14 flex-shrink-0"
            >
                <h2 className="text-5xl md:text-7xl font-bold tracking-tighter text-white">
                    Orbit<span className="text-emerald-500">.</span>
                </h2>
                <div className="flex items-center justify-center gap-4">
                    <span className="h-px w-8 bg-zinc-800" />
                    <p className="text-zinc-500 font-bold uppercase tracking-[0.3em] text-[10px]">
                        Seamless Messaging Platform
                    </p>
                    <span className="h-px w-8 bg-zinc-800" />
                </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl w-full relative z-10 mb-12">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    onClick={() => window.dispatchEvent(new CustomEvent('open-search-drawer'))}
                    className="group relative bg-[#0c0c0e]/40 backdrop-blur-3xl p-10 rounded-[3rem] border border-white/[0.05] text-left hover:border-emerald-500/30 hover:bg-white/[0.02] transition-all duration-500 cursor-pointer overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-8 border border-emerald-500/20 group-hover:scale-110 group-hover:bg-emerald-500/20 transition-all">
                        <Zap size={24} />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-3 tracking-tight group-hover:text-emerald-400 transition-colors">Direct Chat</h3>
                    <p className="text-sm text-zinc-500 leading-relaxed font-medium group-hover:text-zinc-400 transition-colors">
                        Connect instantly with any user on the platform through secure, private one-on-one messaging.
                    </p>
                </motion.div>

                <GroupChatModal>
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                        className="group relative bg-[#0c0c0e]/40 backdrop-blur-3xl p-10 rounded-[3rem] border border-white/[0.05] text-left hover:border-teal-500/30 hover:bg-white/[0.02] transition-all duration-500 cursor-pointer h-full overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="w-14 h-14 rounded-2xl bg-teal-500/10 flex items-center justify-center text-teal-400 mb-8 border border-teal-500/20 group-hover:scale-110 group-hover:bg-teal-500/20 transition-all">
                            <Users size={24} />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-3 tracking-tight group-hover:text-teal-400 transition-colors">Group Hub</h3>
                        <p className="text-sm text-zinc-500 leading-relaxed font-medium group-hover:text-zinc-400 transition-colors">
                            Collaborate with multiple members in synchronized group chats for seamless real-time communication.
                        </p>
                    </motion.div>
                </GroupChatModal>
            </div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="relative z-10 flex items-center gap-6 justify-center w-full"
            >
                <div className="flex items-center gap-2 opacity-50">
                    <Shield size={12} className="text-emerald-500" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">End-to-End Encrypted</span>
                </div>
                <div className="w-1.5 h-1.5 rounded-full bg-zinc-800" />
                <div className="flex items-center gap-2 opacity-50">
                    <Sparkles size={12} className="text-emerald-500" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Real-time Stream</span>
                </div>
            </motion.div>
        </div>
    );
};

export default WelcomeScreen;
