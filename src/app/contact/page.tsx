"use client";

import { motion, Easing } from 'framer-motion';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import CustomCursor from '@/components/CustomCursor';
import Magnetic from '@/components/Magnetic';
import { db } from '@/lib/firebase';

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

const getNavReveal = (delay: number) => ({
    hidden: { y: -20, opacity: 0, filter: "blur(4px)" },
    show: {
        y: 0,
        opacity: 1,
        filter: "blur(0px)",
        transition: { duration: 0.8, ease: luxuryEase, delay }
    }
});

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

export default function ContactPage() {
    const [isReady, setIsReady] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        // Check if loader has run
        const hasRun = sessionStorage.getItem('dextra_loader_run');
        const delay = hasRun ? 100 : 3000;

        const timer = setTimeout(() => setIsReady(true), delay);

        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };

        window.addEventListener('scroll', handleScroll);
        return () => {
            clearTimeout(timer);
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    return (
        <div className="bg-background-dark min-h-screen flex flex-col overflow-x-hidden text-slate-100 selection:bg-accent-gold/30">
            <CustomCursor />

            <motion.header
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.8, ease: luxuryEase }}
                className={`sticky top-0 z-50 flex items-center justify-between whitespace-nowrap border-b border-white/10 transition-all duration-500 px-6 py-4 md:px-10 ${scrolled ? 'bg-[#121212]/90 backdrop-blur-md py-3' : 'bg-transparent py-5'
                    }`}
            >
                <div className="flex items-center gap-4 text-white">
                    {/* Logo Removed */}
                    <div className="flex items-center justify-center size-8"></div>
                </div>

                <div className="hidden md:flex flex-1 justify-end gap-8 items-center">
                    <nav className="flex items-center gap-8">
                        {['Home', 'Events', 'Gallery', 'Certificates', 'Contact'].map((item, i) => (
                            <motion.div
                                key={item}
                                initial="hidden"
                                animate={isReady ? "show" : "hidden"}
                                variants={getNavReveal(0.1 + (i * 0.1))}
                            >
                                <Link
                                    href={
                                        item === 'Home' ? '/' :
                                            item === 'Events' ? '/events' :
                                                item === 'Gallery' ? '/gallery' :
                                                    item === 'Certificates' ? '/certificates' :
                                                        item === 'Contact' ? '/contact' : '#'
                                    }
                                    className={`group relative transition-colors text-sm font-medium leading-normal ${item === 'Contact' ? 'text-accent-gold' : 'text-white/80 hover:text-white'
                                        }`}
                                >
                                    {item}
                                </Link>
                            </motion.div>
                        ))}
                    </nav>
                    <Magnetic>
                        <Link href="/register" className="group relative flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden border border-accent-gold h-10 px-6 bg-transparent text-accent-gold hover:text-[#121212] transition-all duration-500 text-sm font-bold leading-normal tracking-[0.015em] hover:shadow-[0_0_15px_rgba(198,166,100,0.3)]">
                            <span className="absolute inset-0 bg-accent-gold -translate-x-full transition-transform duration-500 ease-in-out group-hover:translate-x-0"></span>
                            <span className="relative z-10 truncate">Register Now</span>
                        </Link>
                    </Magnetic>
                </div>

                <button className="md:hidden text-white">
                    <span className="material-symbols-outlined">menu</span>
                </button>
            </motion.header>

            <motion.main
                initial={{ opacity: 0, y: 30 }}
                animate={isReady ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                transition={{ duration: 1, ease: luxuryEase, delay: 0.2 }}
                className="flex-1 flex flex-col lg:flex-row relative overflow-hidden"
            >
                {/* Background Ambient Glows */}
                <div className="absolute inset-0 z-0 pointer-events-none">
                    <motion.div
                        animate={{
                            scale: [1, 1.05, 1],
                            opacity: [0.3, 0.5, 0.3]
                        }}
                        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute right-[-10%] top-[20%] w-[600px] h-[600px] bg-accent-red/10 blur-[120px] rounded-full"
                    />
                </div>

                {/* Left Side: Contact Info */}
                <div className="w-full lg:w-1/2 bg-[#121212] flex flex-col justify-center px-6 py-16 md:px-16 lg:px-24 xl:px-32 relative z-10 order-2 lg:order-1">
                    <motion.div
                        initial="hidden"
                        animate={isReady ? "show" : "hidden"}
                        variants={{
                            hidden: { opacity: 0 },
                            show: {
                                opacity: 1,
                                transition: {
                                    staggerChildren: 0.15,
                                    delayChildren: 0.4
                                }
                            }
                        }}
                        className="max-w-md"
                    >
                        <motion.span
                            variants={fadeUp}
                            className="inline-block text-accent-gold font-sans font-bold tracking-[0.2em] text-xs uppercase mb-6"
                        >
                            Reach Out
                        </motion.span>

                        <div className="overflow-hidden mb-12">
                            <motion.h1
                                variants={headingVariant}
                                className="text-white font-display text-5xl md:text-6xl lg:text-7xl font-medium leading-tight"
                            >
                                Connect <br /><span className="italic">with</span> Us
                            </motion.h1>
                        </div>

                        <div className="space-y-10">
                            <motion.div variants={fadeUp} className="group">
                                <p className="text-white/40 text-xs uppercase tracking-[0.15em] font-sans font-bold mb-3">Location</p>
                                <p className="text-white text-xl md:text-2xl font-sans font-light leading-relaxed">
                                    College of Engineering and Management<br />
                                    Punnapra
                                </p>
                            </motion.div>

                            <motion.div variants={fadeUp} className="pt-6">
                                <p className="text-white/40 text-xs uppercase tracking-[0.15em] font-sans font-bold mb-6">Socials</p>
                                <div className="flex gap-8">
                                    {['IG', 'FB', 'X'].map((social) => (
                                        <motion.a
                                            key={social}
                                            whileHover={{ y: -5, color: '#fff' }}
                                            className="text-accent-gold transition-colors duration-300"
                                            href="#"
                                        >
                                            <span className="font-bold text-lg tracking-widest">{social}</span>
                                        </motion.a>
                                    ))}
                                </div>
                            </motion.div>
                        </div>

                        <motion.div
                            variants={fadeUp}
                            className="mt-16 pt-10 border-t border-white/10"
                        >
                            <a
                                href="https://wa.me/919074409995"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group inline-flex items-center gap-4 text-accent-gold font-sans font-bold uppercase tracking-widest text-sm hover:gap-6 transition-all duration-300"
                            >
                                <span>Send a message</span>
                                <span className="material-symbols-outlined text-xl">east</span>
                            </a>
                        </motion.div>
                    </motion.div>

                    <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-accent-gold/20 to-transparent"></div>
                </div>

                <div className="w-full lg:w-1/2 relative overflow-hidden min-h-[500px] lg:min-h-full order-1 lg:order-2">
                    <motion.div
                        initial={{ scale: 1.1, opacity: 0 }}
                        animate={isReady ? { scale: 1, opacity: 1 } : { scale: 1.1, opacity: 0 }}
                        transition={{ duration: 1.5, ease: luxuryEase, delay: 0.5 }}
                        className="absolute inset-0 w-full h-full"
                    >
                        <div
                            className="w-full h-full bg-cover bg-center opacity-60 mix-blend-screen"
                            style={{
                                backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCEFOcZsQa3Hn6DGxn93UyUYB6WMemrReBhY5qCcM2p62VuzDxg_FKI-5W7QPqWpBBDK7POHmzY4xYq0rOnVfGQLASZL12WghSCMzoXX7j8fLU7jNSn21qCCxfyBuXgdDHERo4dfz286DTdNZmH9Vb-WDqK-oLqcwm96MK7_CzbVHFTjjS0mXzCCjxQdKXSrtEpVO6sEHb62vMrt3rf3yb2Mbz2F81r836Zy5KZtbb2VLbh1fd-ZZ_tQuzq0D3ASostoPE55Rlad5KD')",
                                filter: "contrast(1.2) brightness(0.8)"
                            }}
                        ></div>
                        <div className="absolute inset-0 bg-gradient-to-r from-background-dark via-transparent to-background-dark opacity-80"></div>
                    </motion.div>
                    <div className="absolute inset-0 bg-gradient-to-tr from-accent-red/40 via-transparent to-accent-gold/30 mix-blend-color-dodge"></div>
                    <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60"></div>
                    <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>

                    {/* Animated Shine */}
                    <motion.div
                        animate={{ x: ['-100%', '200%'] }}
                        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent w-[50%] skew-x-[-20deg]"
                    />
                </div>
            </motion.main>

            <footer className="bg-[#0f0e0b] border-t border-white/10 px-6 py-12 relative z-10">
                <div className="container mx-auto max-w-[1200px] flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-2 text-white opacity-40">
                        {/* Logo Removed */}
                    </div>
                    <div className="flex flex-wrap justify-center gap-8 text-xs font-sans uppercase tracking-[0.1em]">
                        {['Privacy Policy', 'Terms', 'Inquiries'].map(link => (
                            <a key={link} className="text-white/60 hover:text-accent-gold transition-colors" href="#">{link}</a>
                        ))}
                    </div>
                    <p className="text-white/40 text-[10px] uppercase tracking-widest">© 2026 DEXTRA Arts Festival</p>
                </div>
            </footer>
        </div>
    );
}
