"use client";

import { motion, AnimatePresence, Easing } from 'framer-motion';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import CustomCursor from '@/components/CustomCursor';
import Magnetic from '@/components/Magnetic';

// Custom Easing (Luxury Ease)
const luxuryEase: Easing = [0.22, 1, 0.36, 1];

interface Event {
    id: string;
    title: string;
    model: string;
    type: string;
    time: string;
    endTime: string;
    description: string;
    location: string;
}

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

export default function EventsPage() {
    const [isReady, setIsReady] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [eventType, setEventType] = useState<'onstage' | 'offstage'>('onstage');
    const [events, setEvents] = useState<Event[]>([]);

    useEffect(() => {
        const hasRun = sessionStorage.getItem('dextra_loader_run');
        const delay = hasRun ? 100 : 3000;
        const timer = setTimeout(() => setIsReady(true), delay);

        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);

        // Fetch events from Firestore
        const eventsQuery = query(collection(db, 'events'));
        const unsubscribe = onSnapshot(eventsQuery, (snapshot) => {
            const liveEvents: Event[] = [];
            snapshot.forEach((docSnap) => {
                liveEvents.push({ id: docSnap.id, ...docSnap.data() } as Event);
            });
            setEvents(liveEvents);
        });

        return () => {
            clearTimeout(timer);
            window.removeEventListener('scroll', handleScroll);
            unsubscribe();
        };
    }, []);

    const onstageEvents = events.filter(e => e.type === 'Onstage');
    const offstageEvents = events.filter(e => e.type === 'Offstage');

    const currentEvents = eventType === 'onstage' ? onstageEvents : offstageEvents;

    return (
        <div className="bg-background-dark min-h-screen flex flex-col overflow-x-hidden text-slate-100 selection:bg-accent-gold/30">
            <CustomCursor />

            <motion.header
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.8, ease: luxuryEase }}
                className={`sticky top-0 z-50 flex items-center justify-between border-b border-white/10 transition-all duration-500 px-6 py-4 md:px-10 ${scrolled ? 'bg-[#121212]/95 backdrop-blur-md py-3' : 'bg-transparent py-5'}`}
            >
                <div className="flex items-center gap-4 text-white">
                    {/* Logo Removed as per request */}
                    <div className="flex items-center justify-center size-8">
                        {/* Placeholder or empty to maintain spacing if needed, but removing visual logo */}
                    </div>
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
                                    className={`group relative transition-colors text-sm font-medium leading-normal ${item === 'Events' ? 'text-accent-gold' : 'text-white/80 hover:text-white'}`}
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
            </motion.header>

            <motion.main
                initial={{ opacity: 0, y: 30 }}
                animate={isReady ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                transition={{ duration: 1, ease: luxuryEase, delay: 0.2 }}
                className="flex-1 relative overflow-hidden"
            >
                <div className="absolute inset-0 pointer-events-none opacity-40">
                    <div className="absolute inset-0 bg-gradient-to-br from-accent-red/5 via-transparent to-accent-gold/5"></div>
                </div>

                <div className="container mx-auto max-w-[1200px] px-6 py-16 relative z-10">
                    <div className="text-center mb-16">
                        <motion.span
                            variants={fadeUp}
                            className="inline-block text-accent-gold font-sans font-bold tracking-[0.3em] text-xs uppercase mb-4"
                        >
                            Schedule of Excellence
                        </motion.span>
                        <motion.h1
                            variants={fadeUp}
                            className="text-white font-display text-5xl md:text-7xl lg:text-8xl font-medium leading-tight mb-8"
                        >
                            The Stage is <span className="italic text-accent-gold">Set</span>
                        </motion.h1>
                        <div className="w-24 h-px bg-accent-gold/30 mx-auto"></div>
                    </div>

                    <div className="flex justify-center mb-16">
                        <div className="inline-flex p-1 bg-white/5 border border-white/10 rounded-none">
                            <button
                                onClick={() => setEventType('onstage')}
                                className={`px-8 py-3 text-sm font-bold tracking-widest uppercase transition-all ${eventType === 'onstage' ? 'bg-accent-gold text-background-dark' : 'text-white/60 hover:text-white'}`}
                            >
                                Onstage Events
                            </button>
                            <button
                                onClick={() => setEventType('offstage')}
                                className={`px-8 py-3 text-sm font-bold tracking-widest uppercase transition-all ${eventType === 'offstage' ? 'bg-accent-gold text-background-dark' : 'text-white/60 hover:text-white'}`}
                            >
                                Offstage Events
                            </button>
                        </div>
                    </div>

                    <div className="space-y-0">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={eventType}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.5, ease: luxuryEase }}
                            >
                                {currentEvents.map((event, idx) => (
                                    <div key={idx} className="group flex flex-col md:flex-row items-start md:items-center py-10 border-b border-white/5 hover:bg-white/[0.02] transition-colors px-4">
                                        <div className="w-full md:w-48 mb-4 md:mb-0">
                                            <span className="block text-accent-gold font-sans font-bold text-lg">{event.time}</span>
                                            <span className="block text-white/40 text-xs font-medium uppercase tracking-tighter">{event.endTime}</span>
                                        </div>
                                        <div className="flex-1 pr-8">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-white font-display text-2xl md:text-3xl group-hover:text-accent-gold transition-colors">{event.title}</h3>
                                                <span className="px-2 py-0.5 border border-accent-gold/40 text-accent-gold text-[10px] font-bold uppercase tracking-widest">{event.model}</span>
                                            </div>
                                            <p className="text-white/60 text-sm font-light leading-relaxed max-w-xl">
                                                {event.description}
                                            </p>
                                        </div>
                                        <div className="w-full md:w-48 mt-4 md:mt-0 text-left md:text-right">
                                            <div className="flex items-center md:justify-end gap-2 text-white/80">
                                                <span className="material-symbols-outlined text-sm text-accent-gold">location_on</span>
                                                <span className="text-sm font-medium">{event.location}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    <div className="mt-20 flex flex-col items-center">
                        <p className="text-white/40 text-sm italic mb-8">Subject to change. Please arrive 15 minutes prior to the start time.</p>
                        <Magnetic>
                            <button className="group relative flex min-w-[240px] cursor-pointer items-center justify-center border border-accent-gold h-14 px-10 bg-accent-gold text-background-dark hover:bg-transparent hover:text-accent-gold transition-all duration-300 text-xs font-bold tracking-[0.3em] uppercase">
                                <span className="relative z-10 flex items-center">
                                    Download Full Program
                                    <span className="material-symbols-outlined ml-3 text-sm transition-transform group-hover:translate-y-1">download</span>
                                </span>
                            </button>
                        </Magnetic>
                    </div>
                </div>
            </motion.main>

            <footer className="bg-[#0f0e0b] border-t border-white/10 px-6 py-16 relative z-10">
                <div className="container mx-auto max-w-[1200px] flex flex-col items-center">
                    <div className="flex items-center gap-2 mb-8 text-white opacity-40">
                        {/* Logo Removed as per request */}
                    </div>
                    <div className="flex flex-wrap justify-center gap-8 mb-8 text-sm">
                        {['Privacy Policy', 'Terms of Service', 'Code of Conduct'].map(link => (
                            <a key={link} className="text-white/60 hover:text-accent-gold transition-colors" href="#">{link}</a>
                        ))}
                    </div>
                    <div className="flex gap-6 mb-8">
                        {['IG', 'FB', 'X'].map(social => (
                            <a key={social} className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white/60 hover:text-accent-gold hover:border-accent-gold transition-all" href="#">
                                <span className="font-bold text-xs">{social}</span>
                            </a>
                        ))}
                    </div>
                    <p className="text-white/40 text-[10px] uppercase tracking-widest leading-relaxed text-center">
                        &quot;Different Paths. One Celebration.&quot;<br />
                        © 2026 DEXTRA Arts Festival. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
}
