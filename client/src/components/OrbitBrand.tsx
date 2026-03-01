import { motion } from "framer-motion";
import { useThemeStore } from "../store/useThemeStore";

interface OrbitBrandProps {
    size?: "sm" | "md" | "lg";
    showLogo?: boolean;
    animated?: boolean;
}

const OrbitBrand = ({ size = "md", showLogo = true, animated = false }: OrbitBrandProps) => {
    const { theme } = useThemeStore();
    const isDark = theme === "dark";

    const sizeMap = {
        sm: {
            logo: 30,
            textH: 20,
            textW: 72,
            textSize: 26,
            gap: "gap-2.5",
        },
        md: {
            logo: 42,
            textH: 28,
            textW: 100,
            textSize: 36,
            gap: "gap-3",
        },
        lg: {
            logo: 60,
            textH: 48,
            textW: 170,
            textSize: 62,
            gap: "gap-4",
        },
    };

    const config = sizeMap[size];

    // Unique IDs to avoid SVG gradient conflicts when multiple instances exist
    const uid = `orbitBrand_${size}`;

    return (
        <div className={`flex items-center ${config.gap}`}>
            {showLogo && (
                <motion.div
                    initial={animated ? { opacity: 0, scale: 0.8 } : {}}
                    animate={animated ? { opacity: 1, scale: 1 } : {}}
                    transition={
                        animated
                            ? { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
                            : {}
                    }
                    className="flex-shrink-0"
                >
                    <svg
                        viewBox="0 0 120 120"
                        width={config.logo}
                        height={config.logo}
                        className="drop-shadow-md"
                    >
                        <defs>
                            <linearGradient id={`${uid}_grad`} x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#10b981" />
                                <stop offset="50%" stopColor="#14b8a6" />
                                <stop offset="100%" stopColor="#06b6d4" />
                            </linearGradient>
                            <filter id={`${uid}_glow`}>
                                <feGaussianBlur stdDeviation="2" result="blur" />
                                <feMerge>
                                    <feMergeNode in="blur" />
                                    <feMergeNode in="SourceGraphic" />
                                </feMerge>
                            </filter>
                            <radialGradient id={`${uid}_sphere`} cx="40%" cy="35%" r="55%">
                                <stop offset="0%" stopColor="#34d399" />
                                <stop offset="60%" stopColor="#14b8a6" />
                                <stop offset="100%" stopColor="#0891b2" />
                            </radialGradient>
                        </defs>

                        {/* Planet sphere */}
                        <circle
                            cx="60"
                            cy="60"
                            r="30"
                            fill={`url(#${uid}_sphere)`}
                            filter={`url(#${uid}_glow)`}
                        />

                        {/* Highlight reflection on sphere */}
                        <ellipse
                            cx="50"
                            cy="48"
                            rx="12"
                            ry="10"
                            fill="white"
                            opacity="0.15"
                        />

                        {/* Orbital ring — tilted ellipse */}
                        <ellipse
                            cx="60"
                            cy="60"
                            rx="52"
                            ry="18"
                            fill="none"
                            stroke={`url(#${uid}_grad)`}
                            strokeWidth="3.5"
                            opacity="0.85"
                            transform="rotate(-25 60 60)"
                            strokeLinecap="round"
                        />

                        {/* Orbiting particle */}
                        <circle
                            cx="108"
                            cy="46"
                            r="5"
                            fill={`url(#${uid}_grad)`}
                            filter={`url(#${uid}_glow)`}
                            opacity="0.9"
                        />
                    </svg>
                </motion.div>
            )}

            {/* Orbit wordmark — SVG text with gradient fill, 100% reliable */}
            <motion.div
                initial={animated ? { opacity: 0, x: -12 } : {}}
                animate={animated ? { opacity: 1, x: 0 } : {}}
                transition={
                    animated
                        ? { duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.1 }
                        : {}
                }
                className="flex-shrink-0"
            >
                <svg
                    width={config.textW}
                    height={config.textH}
                    viewBox={`0 0 ${config.textW} ${config.textH}`}
                    className="block"
                >
                    <defs>
                        <linearGradient id={`${uid}_textGrad`} x1="0%" y1="0%" x2="100%" y2="0%">
                            {isDark ? (
                                <>
                                    <stop offset="0%" stopColor="#f9fafb" />
                                    <stop offset="55%" stopColor="#e5e7eb" />
                                    <stop offset="100%" stopColor="#6ee7b7" />
                                </>
                            ) : (
                                <>
                                    <stop offset="0%" stopColor="#111827" />
                                    <stop offset="55%" stopColor="#1f2937" />
                                    <stop offset="100%" stopColor="#059669" />
                                </>
                            )}
                        </linearGradient>
                    </defs>
                    <text
                        x="0"
                        y={config.textH * 0.82}
                        fill={`url(#${uid}_textGrad)`}
                        fontFamily="'Outfit', sans-serif"
                        fontWeight="800"
                        fontSize={config.textSize}
                        letterSpacing="1"
                    >
                        Orbit
                    </text>
                </svg>
            </motion.div>
        </div>
    );
};

export default OrbitBrand;
