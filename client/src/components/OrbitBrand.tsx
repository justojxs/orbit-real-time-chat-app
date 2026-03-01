import { motion } from "framer-motion";

interface OrbitBrandProps {
    size?: "sm" | "md" | "lg";
    showLogo?: boolean;
    animated?: boolean;
}

const OrbitBrand = ({ size = "md", showLogo = true, animated = false }: OrbitBrandProps) => {
    const sizeMap = {
        sm: { logo: 28, text: "text-xl" },
        md: { logo: 40, text: "text-2xl" },
        lg: { logo: 56, text: "text-4xl" },
    };

    const config = sizeMap[size];

    return (
        <div className="flex items-center gap-3 sm:gap-4">
            {showLogo && (
                <motion.div
                    initial={animated ? { opacity: 0, scale: 0.8 } : {}}
                    animate={animated ? { opacity: 1, scale: 1 } : {}}
                    transition={
                        animated
                            ? { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
                            : {}
                    }
                >
                    <svg
                        viewBox="0 0 100 100"
                        width={config.logo}
                        height={config.logo}
                        className="drop-shadow-lg"
                    >
                        <defs>
                            <linearGradient id="brandGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#10b981" />
                                <stop offset="50%" stopColor="#14b8a6" />
                                <stop offset="100%" stopColor="#0891b2" />
                            </linearGradient>
                            <filter id="brandGlow">
                                <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
                                <feMerge>
                                    <feMergeNode in="coloredBlur" />
                                    <feMergeNode in="SourceGraphic" />
                                </feMerge>
                            </filter>
                        </defs>

                        {/* Outer orbit ring */}
                        <circle
                            cx="50"
                            cy="50"
                            r="42"
                            fill="none"
                            stroke="url(#brandGradient)"
                            strokeWidth="2"
                            opacity="0.6"
                            filter="url(#brandGlow)"
                        />

                        {/* Middle orbit ring */}
                        <circle
                            cx="50"
                            cy="50"
                            r="32"
                            fill="none"
                            stroke="url(#brandGradient)"
                            strokeWidth="1.5"
                            opacity="0.4"
                        />

                        {/* Inner circle core */}
                        <circle
                            cx="50"
                            cy="50"
                            r="18"
                            fill="url(#brandGradient)"
                            opacity="0.9"
                            filter="url(#brandGlow)"
                        />

                        {/* Static particles */}
                        <circle cx="50" cy="12" r="3" fill="url(#brandGradient)" opacity="0.8" />
                        <circle cx="88" cy="50" r="2.5" fill="url(#brandGradient)" opacity="0.7" />
                        <circle cx="50" cy="88" r="2" fill="url(#brandGradient)" opacity="0.6" />
                        <circle cx="12" cy="50" r="2.5" fill="url(#brandGradient)" opacity="0.7" />
                    </svg>
                </motion.div>
            )}

            <motion.div
                initial={animated ? { opacity: 0, x: -10 } : {}}
                animate={animated ? { opacity: 1, x: 0 } : {}}
                transition={
                    animated
                        ? { duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.1 }
                        : {}
                }
                className={`font-extrabold tracking-tighter text-gray-900 dark:text-white drop-shadow-sm ${config.text}`}
            >
                Orbit
            </motion.div>
        </div>
    );
};

export default OrbitBrand;
