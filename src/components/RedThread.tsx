"use client";

import { motion, Easing } from 'framer-motion';

export default function RedThread() {
    const pathData = "M -100 100 C 200 400, 400 -200, 600 500 C 800 1000, 900 300, 1200 600";
    const luxuryEase: Easing = [0.77, 0, 0.175, 1]; // From user prompt

    return (
        <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden z-[5]">
            <motion.svg
                viewBox="0 0 1000 800"
                preserveAspectRatio="xMidYMid slice"
                className="w-full h-full absolute inset-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1.5, ease: luxuryEase }}
            >
                <defs>
                    <linearGradient id="threadGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#A11217" stopOpacity="0.8" />
                        <stop offset="40%" stopColor="#A11217" stopOpacity="1" />
                        <stop offset="80%" stopColor="#C6A664" stopOpacity="1" />
                        <stop offset="100%" stopColor="#eebd2b" stopOpacity="0.8" />
                    </linearGradient>
                    <filter id="glow-large" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="30" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                    <filter id="glow-medium" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="15" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                <motion.g
                    initial={{ y: 0, x: 0 }}
                    animate={{
                        y: [0, -15, 0],
                        x: [0, 8, 0]
                    }}
                    transition={{
                        repeat: Infinity,
                        duration: 6,
                        ease: "easeInOut",
                        delay: 2.5 // Start floating after drawing
                    }}
                >
                    {/* Large glow */}
                    <motion.path
                        d={pathData}
                        fill="none"
                        stroke="url(#threadGradient)"
                        strokeWidth="20"
                        filter="url(#glow-large)"
                        className="mix-blend-screen opacity-30"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 2.5, ease: luxuryEase, delay: 0.2 }}
                    />

                    {/* Medium glow */}
                    <motion.path
                        d={pathData}
                        fill="none"
                        stroke="url(#threadGradient)"
                        strokeWidth="8"
                        filter="url(#glow-medium)"
                        className="mix-blend-screen opacity-60"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 2.0, ease: luxuryEase, delay: 0.1 }}
                    />

                    {/* Core thread */}
                    <motion.path
                        d={pathData}
                        fill="none"
                        stroke="#FFEAA7" // Bright gold/white core
                        strokeWidth="2"
                        className="mix-blend-screen opacity-90"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1.8, ease: luxuryEase }}
                    />
                </motion.g>
            </motion.svg>
        </div>
    );
}
