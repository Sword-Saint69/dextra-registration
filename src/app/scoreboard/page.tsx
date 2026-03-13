"use client";

import { useEffect, useState } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Navbar from '@/components/Navbar';

interface House {
    id: string;
    name: string;
    points: number;
}

export default function ScoreboardPage() {
    const [culturalHouses, setCulturalHouses] = useState<House[]>([]);
    const [sportsHouses, setSportsHouses] = useState<House[]>([]);
    const [isCulturalLoaded, setIsCulturalLoaded] = useState(false);
    const [isSportsLoaded, setIsSportsLoaded] = useState(false);
    const [activeTab, setActiveTab] = useState<'cultural' | 'sports' | 'combined'>('cultural');

    useEffect(() => {
        const housesQuery = query(collection(db, 'houses'));
        const unsubscribeCultural = onSnapshot(housesQuery, (snapshot) => {
            const liveHouses: House[] = [];
            snapshot.forEach((docSnap) => {
                liveHouses.push({ id: docSnap.id, ...docSnap.data() } as House);
            });
            setCulturalHouses(liveHouses);
            setIsCulturalLoaded(true);
        });

        const sportsQuery = query(collection(db, 'sports_houses'));
        const unsubscribeSports = onSnapshot(sportsQuery, (snapshot) => {
            const liveHouses: House[] = [];
            snapshot.forEach((docSnap) => {
                liveHouses.push({ id: docSnap.id, ...docSnap.data() } as House);
            });
            setSportsHouses(liveHouses);
            setIsSportsLoaded(true);
        });

        return () => {
            unsubscribeCultural();
            unsubscribeSports();
        };
    }, []);

    const isLoading = !(isCulturalLoaded && isSportsLoaded);

    // Helper to calculate combined points
    const getCombinedHouses = (): House[] => {
        const combinedMap = new Map<string, House>();
        
        // Add cultural points
        culturalHouses.forEach(h => {
            if (!h || !h.name) return;
            const normalizedName = String(h.name).toLowerCase();
            combinedMap.set(normalizedName, { ...h, points: Number(h.points) || 0 });
        });

        // Add sports points
        sportsHouses.forEach(sh => {
            if (!sh || !sh.name) return;
            const normalizedName = String(sh.name).toLowerCase();
            if (combinedMap.has(normalizedName)) {
                combinedMap.get(normalizedName)!.points += (Number(sh.points) || 0);
            } else {
                // If the cultural house doesn't exist yet, we add the sports one
                const niceName = String(sh.name).charAt(0).toUpperCase() + String(sh.name).slice(1).toLowerCase();
                combinedMap.set(normalizedName, { ...sh, name: niceName, id: normalizedName, points: Number(sh.points) || 0 });
            }
        });

        return Array.from(combinedMap.values()).sort((a, b) => b.points - a.points);
    };

    const getActiveHouses = () => {
        if (activeTab === 'cultural') {
            return culturalHouses
                .filter(h => h && h.name)
                .map(h => ({ ...h, points: Number(h.points) || 0 }))
                .sort((a, b) => b.points - a.points);
        }
        if (activeTab === 'sports') {
            return sportsHouses
                .filter(h => h && h.name)
                .map(h => ({ ...h, points: Number(h.points) || 0 }))
                .sort((a, b) => b.points - a.points);
        }
        return getCombinedHouses();
    };

    const displayHouses = getActiveHouses();
    const maxPoints = Math.max(...displayHouses.map(h => h.points), 100);

    return (
        <main className="min-h-screen bg-[#0a0a0a] text-white">
            <Navbar />

            {/* Background Texture */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.03] mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />

            <div className="relative pt-32 pb-20 px-6 md:px-10 max-w-7xl mx-auto">
                {/* Header Section */}
                <div className="flex flex-col items-center text-center mb-12">
                    <span className="text-accent-gold text-[10px] md:text-xs font-bold uppercase tracking-[0.4em] mb-4 block">Festival Standings</span>
                    <h1 className="text-5xl md:text-7xl font-display font-medium tracking-tighter mb-6">
                        The <span className="italic text-accent-gold">Leaderboard</span>
                    </h1>
                    <div className="flex gap-2 p-1 bg-white/5 border border-white/10 rounded-full mb-8">
                        {(['cultural', 'sports', 'combined'] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${
                                    activeTab === tab 
                                    ? 'bg-accent-gold text-black shadow-[0_0_15px_rgba(198,166,100,0.4)]' 
                                    : 'text-white/60 hover:text-white hover:bg-white/5'
                                }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="size-12 border-2 border-accent-gold/20 border-t-accent-gold rounded-full animate-spin" />
                    </div>
                ) : displayHouses.length === 0 ? (
                    <div className="text-center py-20 text-white/40 italic">
                        Results are being compiled. Stay tuned.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
                        {displayHouses.map((house, idx) => (
                            <div key={house.id} className="group relative">
                                {/* Rank Badge */}
                                <div className="absolute -top-4 -left-4 size-10 bg-accent-gold text-black font-display font-bold text-lg flex items-center justify-center rounded-sm z-10 shadow-[0_0_20px_rgba(198,166,100,0.3)]">
                                    {idx + 1}
                                </div>

                                <div className="bg-[#121212] border border-white/5 p-8 relative overflow-hidden transition-all duration-500 hover:border-accent-gold/30 hover:shadow-[0_0_50px_rgba(198,166,100,0.05)]">
                                    {/* Progress Bar Background */}
                                    <div className="absolute bottom-0 left-0 w-full h-[2px] bg-white/5" />
                                    <div
                                        style={{ width: `${(house.points / maxPoints) * 100}%` }}
                                        className="absolute bottom-0 left-0 h-[2px] bg-accent-gold shadow-[0_0_10px_rgba(198,166,100,0.5)] transition-all duration-1000"
                                    />

                                    <div className="flex justify-between items-end mb-6">
                                        <div>
                                            <h2 className="text-2xl md:text-3xl font-display font-bold tracking-tight mb-1">{house.name}</h2>
                                            <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold">House Points</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-4xl font-display font-medium text-accent-gold">
                                                {house.points}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        {Array.from({ length: 4 }).map((_, i) => (
                                            <div
                                                key={i}
                                                className={`h-1 flex-1 ${i < (displayHouses.length - idx) ? 'bg-accent-gold/20' : 'bg-white/5'}`}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Footer Tip */}
                <p className="mt-20 text-center text-white/20 text-[10px] uppercase tracking-[0.3em]">
                    Real-time synchronization active • Points updated by the control center
                </p>
            </div>
        </main>
    );
}
