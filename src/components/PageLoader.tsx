"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { luxuryEase } from '@/lib/animations';

export default function PageLoader() {
    const [isLoading, setIsLoading] = useState(true);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        // Hydration-safe session check
        const hasRun = typeof window !== 'undefined' && sessionStorage.getItem('dextra_loader_run');
        if (hasRun && isLoading) {
            Promise.resolve().then(() => {
                setIsLoading(false);
            });
            document.body.style.overflow = "";
            return;
        }

        if (!isLoading) {
            document.body.style.overflow = "";
            return;
        }

        document.body.style.overflow = "hidden";

        const duration = 2500;
        const startTime = Date.now();

        const interval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const t = elapsed / duration;

            const eased = 1 - Math.pow(1 - t, 3);
            let currentProgress = eased * 100;

            if (t >= 1) {
                currentProgress = 100;
                clearInterval(interval);
                sessionStorage.setItem("dextra_loader_run", "true");

                setTimeout(() => setIsLoading(false), 400);
            }

            setProgress(currentProgress);
        }, 16);

        return () => {
            clearInterval(interval);
            document.body.style.overflow = "";
        };
    }, [isLoading]);

    return (
        <AnimatePresence>
            {isLoading && (
                <motion.div
                    initial={{ opacity: 1 }}
                    exit={{
                        opacity: 0,
                        y: -40,
                        filter: "blur(12px)"
                    }}
                    transition={{
                        duration: 1,
                        ease: luxuryEase
                    }}
                    className="fixed inset-0 z-[99999] bg-[#121212] font-display text-slate-100 antialiased overflow-hidden"
                >


                    <div className="relative flex min-h-screen w-full flex-col justify-center items-center">
                        {/* Subtle noise texture */}
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-[0.03] mix-blend-overlay pointer-events-none"></div>

                        {/* Background Glow */}
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#A11217]/5 to-transparent pointer-events-none"></div>
                        <div className="layout-container flex h-full grow flex-col w-full max-w-[1200px]">
                            <div className="flex flex-1 flex-col items-center justify-center px-4 md:px-40">

                                {/* Main Silk Thread Component */}
                                <div className="w-full max-w-[600px] flex flex-col items-center gap-12">

                                    {/* Abstract Silk Visual */}
                                    <div className="relative w-full h-32 flex items-center justify-center overflow-hidden">
                                        {/* Subtle radial red glow behind silk */}
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-8 bg-[#A11217] rounded-full blur-2xl opacity-20"></div>

                                        {/* The faint gold trail */}
                                        <div className="absolute w-full h-[1px] gold-trail opacity-40"></div>

                                        {/* The flowing silk thread */}
                                        <div className="relative w-3/4 h-[2px] silk-thread rounded-full">
                                            {/* Golden Moving Spark */}
                                            <div className="spark"></div>
                                        </div>
                                    </div>

                                    {/* Festival Identity */}
                                    <div className="flex flex-col items-center gap-8">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="flex items-center gap-4">
                                                <span className="h-[1px] w-8 bg-[#A11217]/30"></span>
                                                <p className="text-[#C6A664]/80 text-[10px] tracking-[0.5em] font-light uppercase">DEXTRA 2026</p>
                                                <span className="h-[1px] w-8 bg-[#A11217]/30"></span>
                                            </div>
                                            <h1 className="text-slate-100 text-xs font-extralight tracking-[1.2em] uppercase mt-4">
                                                Loading
                                            </h1>
                                        </div>

                                        {/* Minimal Progress Indicator */}
                                        <div className="w-48 h-[1px] bg-[#A11217]/10 relative overflow-hidden">
                                            <div
                                                className="absolute top-0 left-0 h-full bg-[#A11217]/60 shadow-[0_0_4px_rgba(161,18,23,0.4)] transition-all duration-75 ease-out"
                                                style={{ width: `${progress}%` }}
                                            ></div>
                                        </div>
                                    </div>

                                </div>
                            </div>

                            {/* Bottom Brand Mark */}
                            <div className="absolute bottom-12 left-0 right-0 flex justify-center">
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5, duration: 1 }}
                                    className="flex items-center gap-3"
                                >
                                    <motion.span
                                        animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
                                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                        className="material-symbols-outlined text-[#A11217] text-sm"
                                    >
                                        filter_vintage
                                    </motion.span>
                                    <div className="overflow-hidden flex gap-x-[0.3em]">
                                        {"College of Engineering and Management Punnapra".split(" ").map((word, i) => (
                                            <motion.p
                                                key={i}
                                                initial={{ y: 20, opacity: 0 }}
                                                animate={{ y: 0, opacity: 0.4 }}
                                                transition={{
                                                    delay: 0.8 + (i * 0.05),
                                                    duration: 0.8,
                                                    ease: [0.22, 1, 0.36, 1]
                                                }}
                                                className="text-[9px] tracking-[0.2em] font-light uppercase text-slate-100"
                                            >
                                                {word}
                                            </motion.p>
                                        ))}
                                    </div>
                                </motion.div>
                            </div>
                        </div>

                        {/* Decorative Elements */}
                        <div className="absolute top-0 left-0 w-full p-8 flex justify-between items-start pointer-events-none">
                            <div className="border-l border-t border-[#A11217]/20 w-8 h-8"></div>
                            <div className="border-r border-t border-[#A11217]/20 w-8 h-8"></div>
                        </div>
                        <div className="absolute bottom-0 left-0 w-full p-8 flex justify-between items-end pointer-events-none">
                            <div className="border-l border-b border-[#A11217]/20 w-8 h-8"></div>
                            <div className="border-r border-b border-[#A11217]/20 w-8 h-8"></div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
