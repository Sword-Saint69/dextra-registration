"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence, Easing, Variants } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Magnetic from './Magnetic';

// Luxury Easing
const luxuryEase: Easing = [0.22, 1, 0.36, 1];

const navReveal: Variants = {
    hidden: { y: -20, opacity: 0, filter: "blur(4px)" },
    show: {
        y: 0,
        opacity: 1,
        filter: "blur(0px)",
        transition: { duration: 0.8, ease: luxuryEase }
    }
};

const mobileMenuVariants: Variants = {
    closed: {
        opacity: 0,
        y: -10,
        transition: {
            duration: 0.3,
            ease: "easeInOut"
        }
    },
    open: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.4,
            ease: luxuryEase,
            staggerChildren: 0.1,
            delayChildren: 0.2
        }
    }
};

const mobileItemVariants: Variants = {
    closed: { x: -20, opacity: 0 },
    open: { x: 0, opacity: 1, transition: { duration: 0.4, ease: luxuryEase } }
};

const menuItems = [
    { name: 'Home', path: '/' },
    { name: 'Events', path: '/events' },
    { name: 'Union Day', path: '/union-day' },
    { name: 'Gallery', path: '/gallery' },
    { name: 'Photo recreation', path: '/photo-recreation' },
    { name: 'Certificates', path: '/certificates' },
    { name: 'Contact', path: '/contact' }
];

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Close menu on route change
    useEffect(() => {
        setIsOpen(false);
    }, [pathname]);

    return (
        <>
            <motion.header
                initial="hidden"
                animate="show"
                variants={navReveal}
                className={`fixed top-0 z-[60] w-full flex items-center justify-between whitespace-nowrap px-6 py-4 md:px-10 transition-all duration-700 ${scrolled || isOpen
                    ? "bg-[#0a0a0a]/80 backdrop-blur-2xl border-b border-white/5 py-4 shadow-[0_4px_30px_rgba(0,0,0,0.5)]"
                    : "bg-transparent border-b border-transparent py-6"
                    }`}
            >
                {/* Animated Gradient Border (Bottom) */}
                <AnimatePresence>
                    {scrolled && (
                        <motion.div
                            initial={{ scaleX: 0, opacity: 0 }}
                            animate={{ scaleX: 1, opacity: 1 }}
                            exit={{ scaleX: 0, opacity: 0 }}
                            className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-accent-gold/40 to-transparent origin-center shadow-[0_0_10px_rgba(198,166,100,0.2)]"
                        />
                    )}
                </AnimatePresence>

                {/* Logo / Title Area */}
                <Link href="/" className="flex items-center gap-4 text-white group relative z-[70]">
                    <span className="font-display text-2xl font-bold tracking-tighter transition-all duration-500 group-hover:text-accent-gold group-hover:tracking-normal group-hover:drop-shadow-[0_0_10px_rgba(198,166,100,0.5)]">
                        DEXTRA
                    </span>
                </Link>

                {/* Desktop Navigation */}
                <div className="hidden md:flex flex-1 justify-end gap-10 items-center">
                    <nav className="flex items-center gap-10">
                        {menuItems.map((item) => (
                            <Link
                                key={item.name}
                                href={item.path}
                                className={`group relative transition-all duration-500 text-[11px] uppercase tracking-[0.2em] font-bold hover:text-white ${pathname === item.path ? 'text-accent-gold' : 'text-white/40'
                                    }`}
                            >
                                <span className="relative z-10">{item.name}</span>
                                {pathname === item.path ? (
                                    <motion.div
                                        layoutId="nav-underline"
                                        className="absolute -bottom-2 left-0 w-full h-0.5 bg-accent-gold shadow-[0_0_10px_rgba(198,166,100,0.5)]"
                                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                                    />
                                ) : (
                                    <div className="absolute -bottom-2 left-0 w-0 h-0.5 bg-white/20 transition-all duration-500 group-hover:w-full"></div>
                                )}
                            </Link>
                        ))}
                    </nav>

                    <div className="h-8 w-px bg-white/10 ml-2"></div>

                    <Magnetic>
                        <Link
                            href="/register"
                            className="group relative flex min-w-[120px] cursor-pointer items-center justify-center overflow-hidden border border-accent-gold/50 h-10 px-6 bg-transparent text-accent-gold transition-all duration-500 text-[10px] uppercase tracking-[0.2em] font-black hover:border-accent-gold hover:shadow-[0_0_20px_rgba(198,166,100,0.2)]"
                        >
                            <span className="absolute inset-0 bg-accent-gold -translate-x-full transition-transform duration-500 ease-in-out group-hover:translate-x-0"></span>
                            <span className="relative z-10 transition-colors duration-500 group-hover:text-[#0a0a0a]">Register</span>
                        </Link>
                    </Magnetic>
                </div>

                {/* Mobile Menu Toggle */}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="md:hidden relative z-[70] flex items-center justify-center p-2 text-white focus:outline-none"
                    aria-label="Toggle Menu"
                >
                    <div className="flex flex-col gap-1.5 w-6">
                        <motion.span
                            animate={isOpen ? { rotate: 45, y: 8 } : { rotate: 0, y: 0 }}
                            className="w-full h-0.5 bg-white block origin-center transition-all duration-300"
                        />
                        <motion.span
                            animate={isOpen ? { opacity: 0, x: 20 } : { opacity: 1, x: 0 }}
                            className="w-full h-0.5 bg-white block transition-all duration-300"
                        />
                        <motion.span
                            animate={isOpen ? { rotate: -45, y: -8 } : { rotate: 0, y: 0 }}
                            className="w-full h-0.5 bg-white block origin-center transition-all duration-300"
                        />
                    </div>
                </button>
            </motion.header>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="fixed inset-0 z-[55] md:hidden bg-[#121212]/98 backdrop-blur-2xl flex flex-col pt-32 px-10"
                    >
                        <motion.nav
                            variants={mobileMenuVariants}
                            initial="closed"
                            animate="open"
                            exit="closed"
                            className="flex flex-col gap-8"
                        >
                            {menuItems.map((item) => (
                                <motion.div key={item.name} variants={mobileItemVariants}>
                                    <Link
                                        href={item.path}
                                        className={`text-3xl font-display font-medium ${pathname === item.path ? 'text-accent-gold' : 'text-white/60 hover:text-white'
                                            }`}
                                    >
                                        {item.name}
                                    </Link>
                                </motion.div>
                            ))}

                            <motion.div variants={mobileItemVariants} className="pt-8">
                                <Link
                                    href="/register"
                                    className="block w-full border border-accent-gold py-4 text-center text-accent-gold font-bold uppercase tracking-widest text-sm hover:bg-accent-gold hover:text-black transition-all"
                                >
                                    Register Now
                                </Link>
                            </motion.div>
                        </motion.nav>

                        {/* Decoration */}
                        <div className="mt-auto pb-12 flex flex-col gap-4">
                            <p className="text-white/20 text-[10px] uppercase tracking-[0.3em]">DEXTRA Arts Festival 2026</p>
                            <div className="w-12 h-px bg-white/10"></div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
