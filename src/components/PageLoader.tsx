"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PageLoader() {
    const [isLoading, setIsLoading] = useState(true);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        // Prevent loader from running multiple times per session
        const hasRun = sessionStorage.getItem('dextra_loader_run');
        if (hasRun) {
            setTimeout(() => setIsLoading(false), 0);
            return;
        }

        const duration = 2500; // 2.5s load time
        const startTime = Date.now();

        const interval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            let currentProgress = (elapsed / duration) * 100;

            if (currentProgress >= 100) {
                currentProgress = 100;
                clearInterval(interval);
                sessionStorage.setItem('dextra_loader_run', 'true');
                setTimeout(() => setIsLoading(false), 500); // total 3s
            }
            setProgress(currentProgress);
        }, 50);

        return () => clearInterval(interval);
    }, []);

    return (
        <AnimatePresence>
            {isLoading && (
                <motion.div
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
                    transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                    className="fixed inset-0 z-[99999] bg-[#121212] font-display text-slate-100 antialiased overflow-hidden"
                >
                    <style dangerouslySetInnerHTML={{
                        __html: `
                        @keyframes silkFlow {
                            0% { background-position: -200% 0; }
                            100% { background-position: 200% 0; }
                        }
                        @keyframes pulseGlow {
                            0%, 100% { box-shadow: 0 0 15px rgba(161,18,23,0.6); }
                            50% { box-shadow: 0 0 25px rgba(161,18,23,1); }
                        }
                        @keyframes sparkMove {
                            0% { left: 0%; opacity: 0; }
                            10% { opacity: 1; }
                            50% { left: 100%; opacity: 1; }
                            90% { opacity: 0; }
                            100% { left: 100%; opacity: 0; }
                        }
                        .silk-thread {
                            background: linear-gradient(90deg, transparent, #A11217, #C6A664, #A11217, transparent);
                            background-size: 200% 100%;
                            animation: silkFlow 3s linear infinite, pulseGlow 2.5s ease-in-out infinite;
                        }
                        .spark {
                            position: absolute;
                            top: 50%;
                            transform: translateY(-50%);
                            width: 6px;
                            height: 6px;
                            background: #C6A664;
                            border-radius: 50%;
                            box-shadow: 0 0 12px #C6A664;
                            animation: sparkMove 2.5s linear infinite;
                        }
                        .gold-trail {
                            background: linear-gradient(90deg, transparent 0%, rgba(198,166,100,0.1) 50%, rgba(198,166,100,0.3) 100%);
                        }
                    `}} />

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
                            <div className="absolute bottom-12 left-0 right-0 flex justify-center opacity-30">
                                <motion.div
                                    animate={{ opacity: [0.3, 0.8, 0.3] }}
                                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                    className="flex items-center gap-3"
                                >
                                    <span className="material-symbols-outlined text-[#A11217] text-sm">filter_vintage</span>
                                    <p className="text-[9px] tracking-[0.2em] font-light uppercase"> College of Engineering and Management Punnapra</p>
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
