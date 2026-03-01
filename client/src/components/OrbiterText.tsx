import { useThemeStore } from "../store/useThemeStore";
import { motion } from "framer-motion";

const OrbiterText = () => {
    const { theme } = useThemeStore();
    const isDark = theme === "dark";

    return (
        <motion.div
            className="relative inline-flex items-center h-[28px]"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ 
                y: -2,
                filter: isDark 
                    ? "drop-shadow(0 0 18px rgba(16,185,129,0.8))" 
                    : "drop-shadow(0 0 16px rgba(16,185,129,0.5))"
            }}
        >
            {/* SVG-based text with space theme */}
            <svg
                viewBox="0 0 280 50"
                className="h-[28px] w-auto"
                preserveAspectRatio="xMidYMid meet"
            >
                <defs>
                    {/* Gradient for text - light mode */}
                    {!isDark && (
                        <>
                            <linearGradient id="orbiterGradientLight" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#10b981" stopOpacity="1" />
                                <stop offset="50%" stopColor="#14b8a6" stopOpacity="1" />
                                <stop offset="100%" stopColor="#0891b2" stopOpacity="1" />
                            </linearGradient>
                            <filter id="glowLight" x="-50%" y="-50%" width="200%" height="200%">
                                <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                                <feMerge>
                                    <feMergeNode in="coloredBlur" />
                                    <feMergeNode in="SourceGraphic" />
                                </feMerge>
                            </filter>
                        </>
                    )}

                    {/* Gradient for text - dark mode */}
                    {isDark && (
                        <>
                            <linearGradient id="orbiterGradientDark" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#10b981" stopOpacity="1" />
                                <stop offset="50%" stopColor="#14b8a6" stopOpacity="1" />
                                <stop offset="100%" stopColor="#0891b2" stopOpacity="1" />
                            </linearGradient>
                            <filter id="glowDark" x="-50%" y="-50%" width="200%" height="200%">
                                <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                                <feMerge>
                                    <feMergeNode in="coloredBlur" />
                                    <feMergeNode in="SourceGraphic" />
                                </feMerge>
                            </filter>
                        </>
                    )}
                </defs>

                {/* Subtle background glow - only in dark mode */}
                {isDark && (
                    <circle
                        cx="140"
                        cy="25"
                        r="35"
                        fill="rgba(16,185,129,0.15)"
                        filter="url(#glowDark)"
                        className="animate-pulse"
                        style={{
                            animation: "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                        }}
                    />
                )}

                {/* Main text with glow */}
                <text
                    x="140"
                    y="32"
                    textAnchor="middle"
                    fontSize="36"
                    fontWeight="800"
                    fontFamily="system-ui, -apple-system, sans-serif"
                    fill={isDark ? "url(#orbiterGradientDark)" : "url(#orbiterGradientLight)"}
                    filter={isDark ? "url(#glowDark)" : "url(#glowLight)"}
                    letterSpacing="0.8"
                    className="font-bold select-none"
                    style={{
                        textShadow: isDark
                            ? "0 0 8px rgba(16,185,129,0.4), 0 0 16px rgba(16,185,129,0.2)"
                            : "0 0 4px rgba(16,185,129,0.3)",
                        filter: isDark
                            ? "drop-shadow(0 0 12px rgba(16,185,129,0.4))"
                            : "drop-shadow(0 0 8px rgba(16,185,129,0.3))",
                    }}
                >
                    Orbiter
                </text>

                {/* Decorative space accent - animated particle effect */}
                {isDark && (
                    <>
                        <circle cx="270" cy="15" r="1.5" fill="rgba(16,185,129,0.6)" opacity="0.8" />
                        <circle cx="20" cy="20" r="1" fill="rgba(16,185,129,0.5)" opacity="0.6" />
                        <circle cx="80" cy="8" r="1.2" fill="rgba(16,185,129,0.4)" opacity="0.7" />
                        <circle cx="220" cy="38" r="0.8" fill="rgba(16,185,129,0.5)" opacity="0.6" />
                    </>
                )}
            </svg>

            {/* CSS Animation for pulse effect */}
            <style>{`
                @keyframes pulse {
                    0%, 100% {
                        opacity: 0.6;
                    }
                    50% {
                        opacity: 1;
                    }
                }
            `}</style>
        </motion.div>
    );
};

export default OrbiterText;
