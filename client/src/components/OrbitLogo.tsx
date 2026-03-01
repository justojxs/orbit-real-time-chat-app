import { motion } from "framer-motion";

interface OrbitLogoProps {
    size?: number;
    animated?: boolean;
    variant?: "dark" | "light" | "auto";
}

const OrbitLogo = ({ size = 40, animated = false }: OrbitLogoProps) => {
    // Unique IDs to avoid SVG conflicts
    const uid = `orbitLogo_${size}`;

    return (
        <motion.svg
            viewBox="0 0 120 120"
            width={size}
            height={size}
            className="drop-shadow-md"
            animate={
                animated
                    ? {
                        filter: [
                            "drop-shadow(0 0 4px rgba(16,185,129,0.3))",
                            "drop-shadow(0 0 10px rgba(16,185,129,0.45))",
                            "drop-shadow(0 0 4px rgba(16,185,129,0.3))",
                        ],
                    }
                    : {}
            }
            transition={animated ? { duration: 3, repeat: Infinity } : {}}
        >
            <defs>
                <linearGradient id={`${uid}_grad`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="50%" stopColor="#14b8a6" />
                    <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
                <radialGradient id={`${uid}_sphere`} cx="40%" cy="35%" r="55%">
                    <stop offset="0%" stopColor="#34d399" />
                    <stop offset="60%" stopColor="#14b8a6" />
                    <stop offset="100%" stopColor="#0891b2" />
                </radialGradient>
                <filter id={`${uid}_glow`}>
                    <feGaussianBlur stdDeviation="2" result="blur" />
                    <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>

            {/* Planet sphere */}
            <circle
                cx="60"
                cy="60"
                r="30"
                fill={`url(#${uid}_sphere)`}
                filter={`url(#${uid}_glow)`}
            />

            {/* Highlight reflection */}
            <ellipse
                cx="50"
                cy="48"
                rx="12"
                ry="10"
                fill="white"
                opacity="0.15"
            />

            {/* Orbital ring */}
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
        </motion.svg>
    );
};

export default OrbitLogo;
