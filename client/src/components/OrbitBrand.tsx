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
            fontSize: "text-lg",
            tracking: "tracking-[0.04em]",
            gap: "gap-2.5",
        },
        md: {
            logo: 42,
            fontSize: "text-2xl",
            tracking: "tracking-[0.05em]",
            gap: "gap-3",
        },
        lg: {
            logo: 60,
            fontSize: "text-5xl",
            tracking: "tracking-[0.06em]",
            gap: "gap-4",
        },
    };

    const config = sizeMap[size];

    // Unique IDs to avoid SVG gradient conflicts when multiple instances exist
    const gradientId = `orbitBrandGrad_${size}`;
    const glowId = `orbitBrandGlow_${size}`;

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
                            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#10b981" />
                                <stop offset="50%" stopColor="#14b8a6" />
                                <stop offset="100%" stopColor="#06b6d4" />
                            </linearGradient>
                            <filter id={glowId}>
                                <feGaussianBlur stdDeviation="2" result="blur" />
                                <feMerge>
                                    <feMergeNode in="blur" />
                                    <feMergeNode in="SourceGraphic" />
                                </feMerge>
                            </filter>
                            <radialGradient id={`${gradientId}_sphere`} cx="40%" cy="35%" r="55%">
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
                            fill={`url(#${gradientId}_sphere)`}
                            filter={`url(#${glowId})`}
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
                            stroke={`url(#${gradientId})`}
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
                            fill={`url(#${gradientId})`}
                            filter={`url(#${glowId})`}
                            opacity="0.9"
                        />
                    </svg>
                </motion.div>
            )}

            {/* Orbit wordmark — CSS styled text, responsive to dark/light */}
            <motion.div
                initial={animated ? { opacity: 0, x: -12 } : {}}
                animate={animated ? { opacity: 1, x: 0 } : {}}
                transition={
                    animated
                        ? { duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.1 }
                        : {}
                }
            >
                {size === "sm" ? (
                    /* Solid text for sm — gradient-clip breaks inside backdrop-blur containers */
                    <span
                        className={`font-extrabold select-none inline-block ${config.fontSize} ${config.tracking}`}
                        style={{
                            fontFamily: "'Outfit', sans-serif",
                            color: isDark ? "#e5e7eb" : "#111827",
                            lineHeight: 1.1,
                        }}
                    >
                        Orbit
                    </span>
                ) : (
                    /* Gradient text for md/lg — looks premium on pages without compositing issues */
                    <span
                        className={`font-extrabold select-none inline-block ${config.fontSize} ${config.tracking}`}
                        style={{
                            fontFamily: "'Outfit', sans-serif",
                            background: isDark
                                ? "linear-gradient(135deg, #f9fafb 0%, #e5e7eb 50%, #6ee7b7 100%)"
                                : "linear-gradient(135deg, #111827 0%, #1f2937 50%, #059669 100%)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            backgroundClip: "text",
                            lineHeight: 1.1,
                        }}
                    >
                        Orbit
                    </span>
                )}
            </motion.div>
        </div>
    );
};

export default OrbitBrand;
