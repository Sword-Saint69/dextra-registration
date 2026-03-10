"use client";

import React, { useState, useEffect } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

export default function CustomCursor() {
    const cursorX = useMotionValue(-100);
    const cursorY = useMotionValue(-100);

    const springConfig = { damping: 25, stiffness: 250 };
    const cursorXSpring = useSpring(cursorX, springConfig);
    const cursorYSpring = useSpring(cursorY, springConfig);

    const [isHovering, setIsHovering] = useState(false);

    useEffect(() => {
        const moveCursor = (e: MouseEvent) => {
            cursorX.set(e.clientX);
            cursorY.set(e.clientY);
        };

        const handleHover = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const interactive = target.closest('button, a, .magnetic, input, select');
            setIsHovering(!!interactive);
        };

        window.addEventListener('mousemove', moveCursor);
        window.addEventListener('mouseover', handleHover);
        return () => {
            window.removeEventListener('mousemove', moveCursor);
            window.removeEventListener('mouseover', handleHover);
        };
    }, [cursorX, cursorY]);

    return (
        <div className="fixed inset-0 pointer-events-none z-[9999]">
            <motion.div
                className="fixed top-0 left-0 w-8 h-8 rounded-full border border-accent-gold/50 mix-blend-difference"
                style={{
                    x: cursorXSpring,
                    y: cursorYSpring,
                    translateX: "-50%",
                    translateY: "-50%",
                }}
                animate={{
                    scale: isHovering ? 2 : 1,
                    backgroundColor: isHovering ? "rgba(255, 255, 255, 0.1)" : "rgba(255, 255, 255, 0)",
                }}
                transition={{ duration: 0.3, ease: "easeOut" }}
            />
            <motion.div
                className="fixed top-0 left-0 w-1.5 h-1.5 bg-accent-gold rounded-full"
                style={{
                    x: cursorX,
                    y: cursorY,
                    translateX: "-50%",
                    translateY: "-50%",
                }}
                animate={{
                    scale: isHovering ? 0 : 1,
                    opacity: isHovering ? 0 : 1,
                }}
            />
        </div>
    );
}
