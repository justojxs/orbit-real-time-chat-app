import { motion } from "framer-motion";

interface OrbitLogoProps {
    size?: number;
    animated?: boolean;
    variant?: "dark" | "light" | "auto";
}

const OrbitLogo = ({ size = 40, animated = false, variant = "auto" }: OrbitLogoProps) => {
    return (
        <motion.svg
            viewBox="0 0 100 100"
            width={size}
            height={size}
            className="drop-shadow-lg"
            animate={
                animated
                    ? {
                          filter: [
                              "drop-shadow(0 0 4px rgba(16,185,129,0.3))",
                              "drop-shadow(0 0 12px rgba(16,185,129,0.5))",
                              "drop-shadow(0 0 4px rgba(16,185,129,0.3))",
                          ],
                      }
                    : {}
            }
            transition={animated ? { duration: 3, repeat: Infinity } : {}}
        >
            <defs>
                <linearGradient id="orbitGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="50%" stopColor="#14b8a6" />
                    <stop offset="100%" stopColor="#0891b2" />
                </linearGradient>
                <filter id="softGlow">
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
                stroke="url(#orbitGradient)"
                strokeWidth="2"
                opacity="0.6"
                filter="url(#softGlow)"
            />

            {/* Middle orbit ring */}
            <circle
                cx="50"
                cy="50"
                r="32"
                fill="none"
                stroke="url(#orbitGradient)"
                strokeWidth="1.5"
                opacity="0.4"
            />

            {/* Inner circle core */}
            <circle
                cx="50"
                cy="50"
                r="18"
                fill="url(#orbitGradient)"
                opacity="0.9"
                filter="url(#softGlow)"
            />

            {/* Orbiting particle 1 */}
            <motion.circle
                cx="50"
                cy="12"
                r="3"
                fill="url(#orbitGradient)"
                opacity="0.8"
                animate={
                    animated
                        ? { rotate: 360 }
                        : {}
                }
                transition={
                    animated
                        ? { duration: 8, repeat: Infinity, ease: "linear" }
                        : {}
                }
                style={{ transformOrigin: "50px 50px" }}
            />

            {/* Orbiting particle 2 */}
            <motion.circle
                cx="88"
                cy="50"
                r="2.5"
                fill="url(#orbitGradient)"
                opacity="0.7"
                animate={
                    animated
                        ? { rotate: 360 }
                        : {}
                }
                transition={
                    animated
                        ? { duration: 10, repeat: Infinity, ease: "linear" }
                        : {}
                }
                style={{ transformOrigin: "50px 50px" }}
            />

            {/* Orbiting particle 3 */}
            <motion.circle
                cx="50"
                cy="88"
                r="2"
                fill="url(#orbitGradient)"
                opacity="0.6"
                animate={
                    animated
                        ? { rotate: 360 }
                        : {}
                }
                transition={
                    animated
                        ? { duration: 12, repeat: Infinity, ease: "linear" }
                        : {}
                }
                style={{ transformOrigin: "50px 50px" }}
            />

            {/* Orbiting particle 4 */}
            <motion.circle
                cx="12"
                cy="50"
                r="2.5"
                fill="url(#orbitGradient)"
                opacity="0.7"
                animate={
                    animated
                        ? { rotate: 360 }
                        : {}
                }
                transition={
                    animated
                        ? { duration: 9, repeat: Infinity, ease: "linear" }
                        : {}
                }
                style={{ transformOrigin: "50px 50px" }}
            />
        </motion.svg>
    );
};

export default OrbitLogo;
