import GroupChatModal from "./miscellaneous/GroupChatModal";
import { MessageSquare, Sparkles, Zap, Users, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import OrbitLogo from "./OrbitLogo";

const ACTIONS = [
    {
        icon: Zap,
        title: "Start a Conversation",
        desc: "Search for any user and send your first message instantly.",
        iconBox: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 border-emerald-200 dark:border-emerald-500/20",
        onClick: () => window.dispatchEvent(new CustomEvent('open-search-drawer')),
    },
    {
        icon: Users,
        title: "Create a Group",
        desc: "Bring people together in a shared space for real-time collaboration.",
        iconBox: "bg-teal-500/10 text-teal-400 border-teal-500/15",
        isGroupTrigger: true,
    },
];

const WelcomeScreen = () => {
    return (
        <div className="flex flex-col items-center justify-center w-full min-h-full text-center px-6 py-12 relative overflow-y-auto custom-scrollbar">
            {/* Ambient glow — performant radial gradient */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.04) 0%, transparent 60%)' }} />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="relative z-10 flex flex-col items-center max-w-lg"
            >
                {/* Logo */}
                <div className="w-16 h-16 bg-gray-50 dark:bg-[#0e0e13] border border-gray-200 dark:border-white/5 rounded-2xl flex items-center justify-center mb-8 shadow-lg">
                    <OrbitLogo size={32} />
                </div>

                {/* Heading */}
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-2">
                    Welcome to Orbit
                </h2>
                <p className="text-sm text-gray-400 dark:text-zinc-500 font-medium leading-relaxed mb-10 max-w-sm">
                    Select a conversation from the sidebar, or start a new one below.
                </p>

                {/* Action cards */}
                <div className="grid grid-cols-1 gap-3 w-full mb-8">
                    {ACTIONS.map((action, i) => {
                        const Card = (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.15 + i * 0.08 }}
                                onClick={!action.isGroupTrigger ? action.onClick : undefined}
                                className={`group flex items-center gap-4 bg-gray-50 dark:bg-[#0e0e13] border border-gray-200/60 dark:border-white/[0.04] rounded-2xl p-5 text-left hover:bg-white/[0.04] hover:border-gray-300 dark:border-white/10 dark:hover:border-white/20 transition-all duration-300 cursor-pointer`}
                            >
                                <div className={`w-10 h-10 rounded-xl ${action.iconBox} flex items-center justify-center border shrink-0 group-hover:scale-110 transition-transform`}>
                                    <action.icon size={18} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-sm font-semibold text-gray-600 dark:text-zinc-300 group-hover:text-gray-900 dark:text-white transition-colors">{action.title}</h3>
                                    <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5 leading-relaxed">{action.desc}</p>
                                </div>
                                <ArrowRight size={14} className="text-gray-300 dark:text-zinc-600 group-hover:text-gray-500 dark:text-zinc-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                            </motion.div>
                        );

                        if (action.isGroupTrigger) {
                            return <GroupChatModal key={i}>{Card}</GroupChatModal>;
                        }
                        return Card;
                    })}
                </div>

                {/* Bottom badges */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="flex items-center gap-4 justify-center"
                >
                    <div className="flex items-center gap-1.5 text-gray-300 dark:text-zinc-600">
                        <MessageSquare size={10} />
                        <span className="text-[9px] font-bold uppercase tracking-[0.15em]">Real-time</span>
                    </div>
                    <div className="w-1 h-1 rounded-full bg-gray-100 dark:bg-white/5" />
                    <div className="flex items-center gap-1.5 text-gray-300 dark:text-zinc-600">
                        <Sparkles size={10} />
                        <span className="text-[9px] font-bold uppercase tracking-[0.15em]">AI-Powered</span>
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
};

export default WelcomeScreen;
