import { useThemeStore } from "../store/useThemeStore";
import { motion } from "framer-motion";

const OrbiterText = () => {
    const { theme } = useThemeStore();
    const isDark = theme === "dark";

    return (
        <motion.span
            className="relative inline-block"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ 
                y: -1,
            }}
        >
            {/* Inline text styled as continuation of heading */}
            <span 
                className="relative inline-block font-bold tracking-tight"
                style={{
                    background: isDark
                        ? "linear-gradient(135deg, #10b981 0%, #14b8a6 50%, #0891b2 100%)"
                        : "linear-gradient(135deg, #10b981 0%, #14b8a6 50%, #0891b2 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    filter: isDark
                        ? "drop-shadow(0 0 8px rgba(16,185,129,0.5))"
                        : "drop-shadow(0 0 6px rgba(16,185,129,0.4))",
                }}
            >
                Orbiter
                
                {/* Subtle animated underline accent */}
                <motion.div
                    className="absolute -bottom-1 left-0 h-0.5 bg-gradient-to-r from-emerald-500 to-transparent rounded-full"
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: "100%", opacity: isDark ? 0.6 : 0.4 }}
                    transition={{ delay: 0.5, duration: 0.6 }}
                    style={{
                        filter: isDark
                            ? "drop-shadow(0 0 6px rgba(16,185,129,0.5))"
                            : "drop-shadow(0 0 4px rgba(16,185,129,0.3))",
                    }}
                />
                
                {/* Subtle glow halo in dark mode */}
                {isDark && (
                    <motion.div
                        className="absolute -inset-2 rounded-lg pointer-events-none"
                        style={{
                            background: "radial-gradient(circle, rgba(16,185,129,0.1) 0%, transparent 70%)",
                            zIndex: -1,
                        }}
                        animate={{
                            opacity: [0.5, 0.8, 0.5],
                        }}
                        transition={{
                            duration: 4,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                    />
                )}
            </span>
        </motion.span>
    );
};

export default OrbiterText;
