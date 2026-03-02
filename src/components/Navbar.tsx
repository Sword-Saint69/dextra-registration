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
    { name: 'Gallery', path: '/gallery' },
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
                className={`fixed top-0 z-[60] w-full flex items-center justify-between whitespace-nowrap px-6 py-4 md:px-10 transition-all duration-500 ${scrolled || isOpen ? "bg-[#121212]/90 backdrop-blur-xl border-b border-white/10 py-3" : "bg-transparent border-b border-transparent py-5"
                    }`}
            >
                {/* Logo / Title Area */}
                <Link href="/" className="flex items-center gap-4 text-white group relative z-[70]">
                    <span className="font-display text-xl font-bold tracking-tighter hover:text-accent-gold transition-colors">
                        DEXTRA
                    </span>
                </Link>

                {/* Desktop Navigation */}
                <div className="hidden md:flex flex-1 justify-end gap-8 items-center">
                    <nav className="flex items-center gap-8">
                        {menuItems.map((item) => (
                            <Link
                                key={item.name}
                                href={item.path}
                                className={`group relative transition-colors text-sm font-medium leading-normal ${pathname === item.path ? 'text-accent-gold' : 'text-white/80 hover:text-white'
                                    }`}
                            >
                                {item.name}
                                {pathname === item.path && (
                                    <motion.div
                                        layoutId="nav-underline"
                                        className="absolute -bottom-1 left-0 w-full h-px bg-accent-gold"
                                    />
                                )}
                            </Link>
                        ))}
                    </nav>
                    <Magnetic>
                        <Link
                            href="/register"
                            className="group relative flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden border border-accent-gold h-10 px-6 bg-transparent text-accent-gold hover:text-[#121212] transition-all duration-500 text-sm font-bold leading-normal tracking-[0.015em] hover:shadow-[0_0_15px_rgba(198,166,100,0.3)]"
                        >
                            <span className="absolute inset-0 bg-accent-gold -translate-x-full transition-transform duration-500 ease-in-out group-hover:translate-x-0"></span>
                            <span className="relative z-10 truncate">Register Now</span>
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
