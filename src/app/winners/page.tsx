"use client";

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Navbar from '@/components/Navbar';
import { luxuryEase, blurReveal, getStaggerContainer, fadeUp } from '@/lib/animations';

interface Participant {
    id: string;
    name: string;
    group: string;
    universityCode: string;
}

interface Event {
    id: string;
    title: string;
    winners?: {
        first?: string;
        second?: string;
        third?: string;
    };
}

export default function WinnersPage() {
    const [events, setEvents] = useState<Event[]>([]);
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Fetch Participants
        const participantsQuery = query(collection(db, 'participants'));
        const unsubscribeParticipants = onSnapshot(participantsQuery, (snapshot) => {
            const list: Participant[] = [];
            snapshot.forEach((doc) => {
                list.push({ id: doc.id, ...doc.data() } as Participant);
            });
            setParticipants(list);
        });

        // Fetch Events
        const eventsQuery = query(collection(db, 'events'));
        const unsubscribeEvents = onSnapshot(eventsQuery, (snapshot) => {
            const list: Event[] = [];
            snapshot.forEach((doc) => {
                list.push({ id: doc.id, ...doc.data() } as Event);
            });
            setEvents(list.filter(e => e.winners?.first || e.winners?.second || e.winners?.third));
            setIsLoading(false);
        });

        return () => {
            unsubscribeParticipants();
            unsubscribeEvents();
        };
    }, []);

    const getParticipantName = (id?: string) => {
        if (!id) return null;
        const p = participants.find(p => p.id === id);
        return p ? { name: p.name, group: p.group } : { name: "Analyzing...", group: "" };
    };

    return (
        <main className="min-h-screen bg-[#0a0a0a] text-white">
            <Navbar />

            {/* Background Texture */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.03] mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />

            <div className="relative pt-32 pb-20 px-6 md:px-10 max-w-7xl mx-auto">
                {/* Header Section */}
                <motion.div
                    initial="hidden"
                    animate="show"
                    variants={blurReveal}
                    className="flex flex-col items-center text-center mb-20"
                >
                    <span className="text-accent-gold text-[10px] md:text-xs font-bold uppercase tracking-[0.4em] mb-4 block">Hall of Fame</span>
                    <h1 className="text-5xl md:text-7xl font-display font-medium tracking-tighter mb-6">
                        The <span className="italic text-accent-gold">Victors</span>
                    </h1>
                    <div className="w-24 h-px bg-gradient-to-r from-transparent via-accent-gold/50 to-transparent" />
                </motion.div>

                <AnimatePresence mode="wait">
                    {isLoading ? (
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex justify-center items-center py-20"
                        >
                            <div className="size-12 border-2 border-accent-gold/20 border-t-accent-gold rounded-full animate-spin" />
                        </motion.div>
                    ) : events.length === 0 ? (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-20 text-white/40 italic"
                        >
                            The podium awaits. Results will be announced shortly.
                        </motion.div>
                    ) : (
                        <motion.div
                            key="winners-grid"
                            variants={getStaggerContainer(0.1, 0.2)}
                            initial="hidden"
                            animate="show"
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
                        >
                            {events.map((event) => (
                                <motion.div
                                    key={event.id}
                                    variants={fadeUp}
                                    className="group bg-[#121212] border border-white/5 p-6 rounded-sm relative overflow-hidden transition-all duration-500 hover:border-accent-gold/20"
                                >
                                    {/* Event Title */}
                                    <div className="border-b border-white/5 pb-4 mb-6">
                                        <h2 className="text-lg md:text-xl font-display font-bold text-white group-hover:text-accent-gold transition-colors">{event.title}</h2>
                                    </div>

                                    {/* Winners List */}
                                    <div className="space-y-6">
                                        {/* 1st Place */}
                                        {event.winners?.first && (
                                            <div className="flex items-center gap-4">
                                                <div className="size-10 bg-accent-gold text-black flex items-center justify-center font-bold text-lg rounded-sm shadow-[0_0_15px_rgba(198,166,100,0.3)] shrink-0">
                                                    1
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-bold text-white tracking-wide">
                                                        {getParticipantName(event.winners.first)?.name}
                                                    </p>
                                                    <p className="text-[10px] uppercase tracking-widest text-accent-gold font-bold">
                                                        {getParticipantName(event.winners.first)?.group}
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {/* 2nd Place */}
                                        {event.winners?.second && (
                                            <div className="flex items-center gap-4 opacity-80">
                                                <div className="size-8 border border-white/20 text-white/80 flex items-center justify-center font-bold text-sm rounded-sm shrink-0">
                                                    2
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-xs font-bold text-white/90">
                                                        {getParticipantName(event.winners.second)?.name}
                                                    </p>
                                                    <p className="text-[9px] uppercase tracking-widest text-white/40 font-bold">
                                                        {getParticipantName(event.winners.second)?.group}
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {/* 3rd Place */}
                                        {event.winners?.third && (
                                            <div className="flex items-center gap-4 opacity-60">
                                                <div className="size-8 border border-white/10 text-white/60 flex items-center justify-center font-bold text-sm rounded-sm shrink-0">
                                                    3
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-xs font-bold text-white/80">
                                                        {getParticipantName(event.winners.third)?.name}
                                                    </p>
                                                    <p className="text-[9px] uppercase tracking-widest text-white/30 font-bold">
                                                        {getParticipantName(event.winners.third)?.group}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Decorative Overlay */}
                                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                        <span className="material-symbols-outlined text-6xl">workspace_premium</span>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Footer Tip */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 2 }}
                    className="mt-20 text-center text-white/20 text-[10px] uppercase tracking-[0.3em]"
                >
                    Official Results of DEXTRA 2026 • Certified by the Arts Committee
                </motion.p>
            </div>
        </main>
    );
}
