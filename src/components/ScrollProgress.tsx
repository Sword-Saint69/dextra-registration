"use client";

import { motion, useScroll, useSpring } from 'framer-motion';

export default function ScrollProgress() {
    const { scrollYProgress } = useScroll();
    const scaleX = useSpring(scrollYProgress, {
        stiffness: 120,
        damping: 30,
    });

    return (
        <motion.div
            className="fixed top-0 left-0 right-0 h-1 bg-accent-gold origin-left z-[100] overflow-hidden"
            style={{ scaleX }}
        >
            <motion.div
                className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent"
                animate={{ x: ["-100%", "200%"] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />
        </motion.div>
    );
}
