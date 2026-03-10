"use client";

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Navbar from '@/components/Navbar';
import { luxuryEase, blurReveal, getStaggerContainer } from '@/lib/animations';

interface House {
    id: string;
    name: string;
    points: number;
}

export default function ScoreboardPage() {
    const [houses, setHouses] = useState<House[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const housesQuery = query(collection(db, 'houses'));
        const unsubscribe = onSnapshot(housesQuery, (snapshot) => {
            const liveHouses: House[] = [];
            snapshot.forEach((docSnap) => {
                liveHouses.push({ id: docSnap.id, ...docSnap.data() } as House);
            });
            // Sort by points descending
            setHouses(liveHouses.sort((a, b) => b.points - a.points));
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const maxPoints = Math.max(...houses.map(h => h.points), 100);

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
                    <span className="text-accent-gold text-[10px] md:text-xs font-bold uppercase tracking-[0.4em] mb-4 block">Festival Standings</span>
                    <h1 className="text-5xl md:text-7xl font-display font-medium tracking-tighter mb-6">
                        The <span className="italic text-accent-gold">Leaderboard</span>
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
                    ) : houses.length === 0 ? (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-20 text-white/40 italic"
                        >
                            Results are being compiled. Stay tuned.
                        </motion.div>
                    ) : (
                        <motion.div
                            key="results"
                            variants={getStaggerContainer(0.1, 0.15)}
                            initial="hidden"
                            animate="show"
                            className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12"
                        >
                            {houses.map((house, idx) => (
                                <motion.div
                                    key={house.id}
                                    variants={blurReveal}
                                    className="group relative"
                                >
                                    {/* Rank Badge */}
                                    <div className="absolute -top-4 -left-4 size-10 bg-accent-gold text-black font-display font-bold text-lg flex items-center justify-center rounded-sm z-10 shadow-[0_0_20px_rgba(198,166,100,0.3)]">
                                        {idx + 1}
                                    </div>

                                    <div className="bg-[#121212] border border-white/5 p-8 relative overflow-hidden transition-all duration-500 hover:border-accent-gold/30 hover:shadow-[0_0_50px_rgba(198,166,100,0.05)]">
                                        {/* Progress Bar Background */}
                                        <div className="absolute bottom-0 left-0 w-full h-[2px] bg-white/5" />
                                        <motion.div
                                            initial={{ scaleX: 0 }}
                                            animate={{ scaleX: house.points / maxPoints }}
                                            transition={{ duration: 1.5, ease: luxuryEase, delay: 0.5 }}
                                            style={{ originX: 0 }}
                                            className="absolute bottom-0 left-0 w-full h-[2px] bg-accent-gold shadow-[0_0_10px_rgba(198,166,100,0.5)]"
                                        />

                                        <div className="flex justify-between items-end mb-6">
                                            <div>
                                                <h2 className="text-2xl md:text-3xl font-display font-bold tracking-tight mb-1">{house.name}</h2>
                                                <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold">House Points</p>
                                            </div>
                                            <div className="text-right">
                                                <motion.span
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    transition={{ duration: 1, delay: 1 }}
                                                    className="text-4xl font-display font-medium text-accent-gold"
                                                >
                                                    {house.points}
                                                </motion.span>
                                            </div>
                                        </div>

                                        <div className="flex gap-2">
                                            {Array.from({ length: 4 }).map((_, i) => (
                                                <div
                                                    key={i}
                                                    className={`h-1 flex-1 ${i < (houses.length - idx) ? 'bg-accent-gold/20' : 'bg-white/5'}`}
                                                />
                                            ))}
                                        </div>
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
                    Real-time synchronization active • Points updated by the control center
                </motion.p>
            </div>
        </main>
    );
}
