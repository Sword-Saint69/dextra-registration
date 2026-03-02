"use client";

import { motion, Easing } from 'framer-motion';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import CustomCursor from '@/components/CustomCursor';
import Navbar from '@/components/Navbar';

// Custom Easing (Luxury Ease)
const luxuryEase: Easing = [0.22, 1, 0.36, 1];

// Animation Variants
const fadeUp = {
    hidden: { y: 20, opacity: 0 },
    show: {
        y: 0,
        opacity: 1,
        transition: { duration: 0.8, ease: luxuryEase }
    }
};

const headingVariant = {
    hidden: { y: 50, opacity: 0, filter: "blur(8px)" },
    show: {
        y: 0,
        opacity: 1,
        filter: "blur(0px)",
        transition: {
            duration: 1,
            ease: luxuryEase
        }
    }
};

export default function CertificateSearch() {
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        // Check if loader has run
        const hasRun = sessionStorage.getItem('dextra_loader_run');
        const delay = hasRun ? 100 : 3000;

        const timer = setTimeout(() => setIsReady(true), delay);

        return () => {
            clearTimeout(timer);
        };
    }, []);

    return (
        <div className="bg-background-dark min-h-screen flex flex-col overflow-x-hidden text-slate-100 selection:bg-accent-gold/30">
            <CustomCursor />
            <Navbar />

            <motion.main
                initial={{ opacity: 0, y: 30 }}
                animate={isReady ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                transition={{
                    duration: 1,
                    ease: luxuryEase,
                    delay: 0.2
                }}
                className="flex-1 flex flex-col relative overflow-hidden"
            >
                {/* Background Ambient Glows */}
                <div className="absolute inset-0 z-0 pointer-events-none">
                    <div className="absolute right-0 top-0 w-full h-full bg-[radial-gradient(circle_at_right,_rgba(161,18,23,0.15)_0%,_rgba(198,166,100,0.05)_50%,_transparent_100%)] opacity-60"></div>
                    <motion.div
                        animate={{
                            scale: [1, 1.05, 1],
                            opacity: [0.5, 0.8, 0.5]
                        }}
                        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute right-[-10%] top-[20%] w-[600px] h-[600px] bg-accent-red/10 blur-[120px] rounded-full"
                    />
                    <motion.div
                        animate={{
                            scale: [1, 1.08, 1],
                            opacity: [0.3, 0.6, 0.3]
                        }}
                        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                        className="absolute left-[-5%] bottom-[10%] w-[400px] h-[400px] bg-accent-gold/5 blur-[100px] rounded-full"
                    />
                </div>

                <section className="relative z-10 flex-1 flex items-center justify-center px-6 py-20">
                    <motion.div
                        initial="hidden"
                        animate={isReady ? "show" : "hidden"}
                        variants={{
                            hidden: { opacity: 0 },
                            show: {
                                opacity: 1,
                                transition: {
                                    staggerChildren: 0.15,
                                    delayChildren: 0.3
                                }
                            }
                        }}
                        className="w-full max-w-2xl text-center"
                    >
                        <motion.span
                            variants={fadeUp}
                            className="inline-block text-accent-gold font-sans font-bold tracking-[0.4em] text-[10px] uppercase mb-8"
                        >
                            Beyond Boundaries
                        </motion.span>

                        <div className="overflow-hidden mb-12">
                            <motion.h1
                                variants={headingVariant}
                                className="text-white font-display text-5xl md:text-7xl lg:text-8xl font-medium leading-tight px-4"
                            >
                                Claim Your
                                <br />
                                <motion.span
                                    animate={{
                                        backgroundPosition: ["200% center", "-200% center"]
                                    }}
                                    transition={{
                                        duration: 5,
                                        repeat: Infinity,
                                        ease: "linear"
                                    }}
                                    className="italic text-transparent bg-clip-text inline-block"
                                    style={{
                                        backgroundImage: "linear-gradient(to right, #C6A664 0%, #fff 50%, #C6A664 100%)",
                                        backgroundSize: "200% auto"
                                    }}
                                >
                                    Honor
                                </motion.span>
                            </motion.h1>
                        </div>

                        <motion.div
                            variants={fadeUp}
                            className="flex flex-col gap-6 max-w-md mx-auto"
                        >
                            <div className="relative group">
                                <motion.input
                                    whileFocus={{
                                        boxShadow: "0 0 0 1px #C6A664",
                                        scale: 1.01
                                    }}
                                    transition={{ duration: 0.3 }}
                                    className="w-full bg-white/5 border border-accent-gold/30 focus:border-accent-gold text-white placeholder-white/20 px-6 py-5 text-lg font-sans transition-all duration-500 outline-none backdrop-blur-sm group-hover:border-accent-gold/50"
                                    placeholder="Enter Registration ID or Email"
                                    type="text"
                                />
                                <div className="absolute inset-0 border border-accent-gold/10 pointer-events-none transition-all duration-500 group-focus-within:border-accent-gold/40" />
                            </div>

                            <div className="relative">
                                <motion.button
                                    whileHover={{ y: -2 }}
                                    whileTap={{ scale: 0.98 }}
                                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                    className="group relative w-full flex items-center justify-center overflow-hidden bg-accent-gold text-background-dark h-16 text-xs font-bold tracking-[0.3em] uppercase transition-all duration-500 hover:bg-white hover:shadow-[0_0_40px_rgba(198,166,100,0.4)]"
                                >
                                    {/* Ripple Slide Effect */}
                                    <motion.div
                                        initial={{ x: "-100%" }}
                                        whileHover={{ x: "0%" }}
                                        transition={{ duration: 0.5, ease: luxuryEase }}
                                        className="absolute inset-0 bg-white"
                                    />

                                    <span className="relative z-10 flex items-center gap-3 transition-colors duration-500 group-hover:text-background-dark">
                                        SEARCH CERTIFICATE
                                        <span className="material-symbols-outlined text-sm transition-transform duration-300 group-hover:translate-x-1">arrow_forward</span>
                                    </span>
                                </motion.button>
                            </div>

                            <motion.p
                                variants={fadeUp}
                                className="mt-4 text-white/20 text-[10px] font-sans tracking-[0.2em] uppercase"
                            >
                                Digital excellence in every path
                            </motion.p>
                        </motion.div>
                    </motion.div>
                </section>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={isReady ? { opacity: 1 } : {}}
                    transition={{ delay: 1, duration: 1.5 }}
                    className="relative z-10 w-full px-10 pb-12 flex justify-between items-end border-t border-white/5 pt-8 bg-background-dark/30 backdrop-blur-sm"
                >
                    <div className="max-w-xs">
                        <p className="text-[9px] text-white/20 uppercase tracking-[0.2em] leading-relaxed">
                            The convergence of diverse artistic expressions. All participants are recognized for their contribution to the unity of art.
                        </p>
                    </div>
                    <span className="text-accent-gold font-display italic text-3xl opacity-10 select-none">2026</span>
                </motion.div>
            </motion.main>

            <footer className="bg-[#0f0e0b] border-t border-white/10 px-6 py-12 md:py-16 relative z-10">
                <div className="container mx-auto max-w-[1200px] flex flex-col items-center">
                    <div className="flex items-center gap-2 mb-8 text-white opacity-40">
                        {/* Logo Removed */}
                    </div>
                    <div className="flex flex-wrap justify-center gap-8 mb-8 text-sm">
                        {['Privacy Policy', 'Terms of Service', 'Code of Conduct'].map((link) => (
                            <a key={link} className="text-white/60 hover:text-accent-gold transition-colors" href="#">{link}</a>
                        ))}
                    </div>
                    <div className="flex gap-6 mb-8">
                        {['IG', 'FB', 'X'].map((social) => (
                            <a key={social} className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white/60 hover:text-accent-gold hover:border-accent-gold transition-all" href="#">
                                <span className="font-bold text-xs">{social}</span>
                            </a>
                        ))}
                    </div>
                    <p className="text-white/30 text-[9px] font-light tracking-[0.2em] uppercase">© 2026 DEXTRA Arts Festival. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
