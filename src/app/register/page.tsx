"use client";

import { motion, useScroll, useTransform, Easing, Variants } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import RedThread from '@/components/RedThread';
import Navbar from '@/components/Navbar';
import { collection, onSnapshot, addDoc, query, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Custom Easing (Luxury Ease)
const luxuryEase: Easing = [0.22, 1, 0.36, 1];

// Animation Variants for Timeline 1.5s - 2.5s
const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.08,
            delayChildren: 1.5,
        }
    }
};

const fadeUp: Variants = {
    hidden: { y: 20, opacity: 0 },
    show: {
        y: 0,
        opacity: 1,
        transition: { duration: 0.8, ease: luxuryEase }
    }
};

const headingLine: Variants = {
    hidden: { y: 40, opacity: 0, filter: "blur(8px)" },
    show: {
        y: 0,
        opacity: 1,
        filter: "blur(0px)",
        transition: { duration: 1.0, ease: luxuryEase }
    }
};

interface EventData {
    id: string;
    title: string;
    type: 'Onstage' | 'Offstage';
}

export default function Register() {
    const heroRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: heroRef,
        offset: ["start start", "end start"]
    });

    const yParallax = useTransform(scrollYProgress, [0, 1], [0, 50]);

    // Firestore Integration State
    const [availableEvents, setAvailableEvents] = useState<EventData[]>([]);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        group: '',
        universityCode: '',
        selectedEvents: [] as string[]
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    // Fetch Events on Load
    useEffect(() => {
        const eventsQuery = query(collection(db, 'events'));
        const unsubscribe = onSnapshot(eventsQuery, (snapshot) => {
            const eventsList: EventData[] = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                eventsList.push({ id: doc.id, title: data.title, type: data.type });
            });
            setAvailableEvents(eventsList);
        });
        return () => unsubscribe();
    }, []);

    // Registration Handler
    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.selectedEvents.length === 0) {
            alert("Please select at least one event to participate in.");
            return;
        }

        setIsSubmitting(true);

        try {
            await addDoc(collection(db, 'participants'), {
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                group: formData.group,
                universityCode: formData.universityCode,
                events: formData.selectedEvents,
                timestamp: new Date()
            });

            // Increment registrationsCount for each selected event
            const updatePromises = formData.selectedEvents.map(eventTitle => {
                const eventDoc = availableEvents.find(e => e.title === eventTitle);
                if (eventDoc) {
                    const eventRef = doc(db, 'events', eventDoc.id);
                    return updateDoc(eventRef, {
                        registrationsCount: increment(1)
                    });
                }
                return Promise.resolve();
            });
            await Promise.all(updatePromises);

            setIsSuccess(true);
        } catch (error) {
            console.error("Error registering participant:", error);
            alert("Registration failed. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // --- Multi-Select Logic ---
    const toggleEvent = (eventTitle: string) => {
        setFormData(prev => {
            const isSelected = prev.selectedEvents.includes(eventTitle);
            if (isSelected) {
                return { ...prev, selectedEvents: prev.selectedEvents.filter(t => t !== eventTitle) };
            } else {
                return { ...prev, selectedEvents: [...prev.selectedEvents, eventTitle] };
            }
        });
    };

    // Calculate current number of selected Offstage events
    const currentOffstageCount = formData.selectedEvents.filter(selectedTitle => {
        const matchingEvent = availableEvents.find(e => e.title === selectedTitle);
        return matchingEvent?.type === 'Offstage';
    }).length;

    const maxOffstageReached = currentOffstageCount >= 5;

    // Split events for UI rendering
    const onstageEvents = availableEvents.filter(e => e.type === 'Onstage');
    const offstageEvents = availableEvents.filter(e => e.type === 'Offstage');

    return (
        <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden">
            <Navbar />

            {/* Main Content */}
            <main ref={heroRef} className="flex-1 flex flex-col lg:flex-row">

                {/* Left Visual Area */}
                <div className="hidden lg:flex w-1/2 relative overflow-hidden bg-background-dark">
                    <motion.div
                        className="absolute inset-0 origin-center"
                        initial={{ scale: 1.05, opacity: 0 }}
                        animate={{
                            scale: [1, 1.01, 1],
                            opacity: 1
                        }}
                        transition={{
                            opacity: { duration: 1.5, ease: luxuryEase },
                            scale: { duration: 8, repeat: Infinity, ease: "easeInOut" }
                        }}
                        style={{ y: yParallax }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-accent-red/20 to-accent-gold/20"></div>
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
                        <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                            <div
                                className="w-full h-full bg-cover bg-center opacity-60 mix-blend-screen"
                                style={{
                                    backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCEFOcZsQa3Hn6DGxn93UyUYB6WMemrReBhY5qCcM2p62VuzDxg_FKI-5W7QPqWpBBDK7POHmzY4xYq0rOnVfGQLASZL12WghSCMzoXX7j8fLU7jNSn21qCCxfyBuXgdDHERo4dfz286DTdNZmH9Vb-WDqK-oLqcwm96MK7_CzbVHFTjjS0mXzCCjxQdKXSrtEpVO6sEHb62vMrt3rf3yb2Mbz2F81r836Zy5KZtbb2VLbh1fd-ZZ_tQuzq0D3ASostoPE55Rlad5KD')",
                                    filter: "contrast(1.2) brightness(0.8)"
                                }}
                            ></div>
                            <div className="absolute inset-0 bg-gradient-to-r from-background-dark via-transparent to-background-dark opacity-80"></div>
                        </div>

                        <RedThread />

                        <motion.div
                            variants={staggerContainer}
                            initial="hidden"
                            animate="show"
                            className="relative z-10 flex flex-col justify-end p-20 w-full h-full pb-32"
                        >
                            <motion.span variants={fadeUp} className="text-accent-gold font-sans font-bold tracking-[0.3em] text-xs uppercase mb-4">
                                Join the Movement
                            </motion.span>
                            <h1 className="text-white font-display text-6xl font-medium leading-[1.1] mb-6 flex flex-col">
                                <motion.span variants={headingLine} className="block overflow-hidden pb-2">Transcend</motion.span>
                                <motion.span variants={headingLine} className="block overflow-hidden text-accent-gold italic">Boundaries.</motion.span>
                            </h1>
                            <motion.p variants={fadeUp} className="text-white/60 text-lg max-w-md font-sans font-light leading-relaxed">
                                Become part of the most awaited college arts festival. Share your craft, learn from masters, and celebrate the unity in our diversity.
                            </motion.p>
                        </motion.div>
                    </motion.div>
                </div>

                {/* Right Form Area */}
                <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 py-12 md:px-16 lg:px-24 xl:px-32 bg-background-dark">
                    <motion.div
                        className="max-w-md w-full mx-auto"
                        variants={staggerContainer}
                        initial="hidden"
                        animate="show"
                    >
                        {isSuccess ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex flex-col items-center justify-center text-center py-20"
                            >
                                <div className="w-20 h-20 rounded-full border border-accent-gold flex items-center justify-center mb-6 text-accent-gold shadow-[0_0_30px_rgba(198,166,100,0.2)]">
                                    <span className="material-symbols-outlined text-4xl">check</span>
                                </div>
                                <h2 className="text-white font-display text-4xl font-bold mb-4">Registration Complete</h2>
                                <p className="text-white/60 font-sans">
                                    Thank you, {formData.name}. Your journey begins now. We look forward to seeing you at DEXTRA 2026.
                                </p>
                                <Link href="/" className="mt-8 text-accent-gold uppercase tracking-widest text-xs font-bold hover:text-white transition-colors flex items-center">
                                    <span className="material-symbols-outlined mr-2 text-sm">arrow_back</span>
                                    Return Home
                                </Link>
                            </motion.div>
                        ) : (
                            <>
                                <div className="mb-10 relative">
                                    <motion.h2 variants={fadeUp} className="text-white font-display text-4xl font-bold mb-2">Registration</motion.h2>
                                    <motion.div
                                        variants={{
                                            hidden: { width: 0 },
                                            show: { width: 48, transition: { duration: 0.8, ease: luxuryEase } }
                                        }}
                                        className="h-1 bg-accent-gold"
                                    ></motion.div>
                                    <motion.p variants={fadeUp} className="mt-6 text-white/50 text-sm font-sans">
                                        Please fill in your details to register for DEXTRA 2026. Fields marked with * are mandatory.
                                    </motion.p>
                                </div>

                                <form className="space-y-6" onSubmit={handleRegister}>
                                    <motion.div variants={fadeUp} className="space-y-2">
                                        <label className="block text-xs font-bold uppercase tracking-widest text-white/70 font-sans" htmlFor="name">Full Name *</label>
                                        <input
                                            className="w-full h-12 px-4 rounded-none border-white/10 bg-transparent text-white focus:border-accent-gold focus:ring-1 focus:ring-accent-gold transition-all"
                                            id="name" name="name" placeholder="Goutham Sankar J L" required type="text"
                                            value={formData.name} onChange={handleInputChange} disabled={isSubmitting}
                                        />
                                    </motion.div>

                                    <motion.div variants={fadeUp} className="space-y-2">
                                        <label className="block text-xs font-bold uppercase tracking-widest text-white/70 font-sans" htmlFor="email">Email Address *</label>
                                        <input
                                            className="w-full h-12 px-4 rounded-none border-white/10 bg-transparent text-white focus:border-accent-gold focus:ring-1 focus:ring-accent-gold transition-all"
                                            id="email" name="email" placeholder="Gouthamsankarjl@gmail.com" required type="email"
                                            value={formData.email} onChange={handleInputChange} disabled={isSubmitting}
                                        />
                                    </motion.div>

                                    <motion.div variants={fadeUp} className="space-y-2">
                                        <label className="block text-xs font-bold uppercase tracking-widest text-white/70 font-sans" htmlFor="phone">Phone Number</label>
                                        <input
                                            className="w-full h-12 px-4 rounded-none border-white/10 bg-transparent text-white focus:border-accent-gold focus:ring-1 focus:ring-accent-gold transition-all"
                                            id="phone" name="phone" placeholder="+91 9074409995" type="tel"
                                            value={formData.phone} onChange={handleInputChange} disabled={isSubmitting}
                                        />
                                    </motion.div>

                                    <motion.div variants={fadeUp} className="space-y-2">
                                        <label className="block text-xs font-bold uppercase tracking-widest text-white/70 font-sans" htmlFor="group">Assigned Group *</label>
                                        <div className="relative">
                                            <select
                                                className="w-full h-12 px-4 rounded-none border-white/10 bg-transparent text-white appearance-none focus:border-accent-gold focus:ring-1 focus:ring-accent-gold transition-all"
                                                id="group" name="group" value={formData.group} onChange={handleInputChange} required disabled={isSubmitting}
                                            >
                                                <option disabled value="">Select your group</option>
                                                <option value="AGNI" className="bg-[#181611] text-white">AGNI</option>
                                                <option value="ASTRA" className="bg-[#181611] text-white">ASTRA</option>
                                                <option value="VAJRA" className="bg-[#181611] text-white">VAJRA</option>
                                                <option value="RUDRA" className="bg-[#181611] text-white">RUDRA</option>
                                            </select>
                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-white/50">
                                                <span className="material-symbols-outlined text-lg">keyboard_arrow_down</span>
                                            </div>
                                        </div>
                                    </motion.div>

                                    <motion.div variants={fadeUp} className="space-y-2">
                                        <label className="block text-xs font-bold uppercase tracking-widest text-white/70 font-sans" htmlFor="universityCode">University Code *</label>
                                        <input
                                            className="w-full h-12 px-4 rounded-none border-white/10 bg-transparent text-white focus:border-accent-gold focus:ring-1 focus:ring-accent-gold transition-all uppercase"
                                            id="universityCode" name="universityCode" placeholder="ex. PRP24CS068" required type="text"
                                            value={formData.universityCode} onChange={handleInputChange} disabled={isSubmitting}
                                        />
                                    </motion.div>

                                    <motion.div variants={fadeUp} className="space-y-4 pt-2">
                                        <label className="block text-xs font-bold uppercase tracking-widest text-white/70 font-sans">
                                            Select Events *
                                        </label>

                                        {/* Onstage Events */}
                                        {onstageEvents.length > 0 && (
                                            <div className="space-y-2">
                                                <h4 className="text-[10px] text-white/40 uppercase tracking-widest border-b border-white/5 pb-1">Onstage</h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {onstageEvents.map((event) => {
                                                        const isSelected = formData.selectedEvents.includes(event.title);
                                                        return (
                                                            <button
                                                                type="button"
                                                                key={event.id}
                                                                onClick={() => toggleEvent(event.title)}
                                                                disabled={isSubmitting}
                                                                className={`px-3 py-1.5 text-xs border transition-all ${isSelected ? 'border-accent-gold bg-accent-gold/10 text-accent-gold' : 'border-white/10 text-white/60 hover:border-white/30'}`}
                                                            >
                                                                {event.title}
                                                            </button>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {/* Offstage Events */}
                                        {offstageEvents.length > 0 && (
                                            <div className="space-y-2 pt-2">
                                                <div className="flex justify-between items-baseline border-b border-white/5 pb-1">
                                                    <h4 className="text-[10px] text-white/40 uppercase tracking-widest">Offstage</h4>
                                                    <span className={`text-[10px] font-bold ${maxOffstageReached ? 'text-accent-red' : 'text-accent-gold'}`}>
                                                        {currentOffstageCount} / 5 Selected
                                                    </span>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {offstageEvents.map((event) => {
                                                        const isSelected = formData.selectedEvents.includes(event.title);
                                                        const isDisabled = isSubmitting || (!isSelected && maxOffstageReached);
                                                        return (
                                                            <button
                                                                type="button"
                                                                key={event.id}
                                                                onClick={() => toggleEvent(event.title)}
                                                                disabled={isDisabled}
                                                                className={`px-3 py-1.5 text-xs border transition-all 
                                                                    ${isSelected ? 'border-accent-gold bg-accent-gold/10 text-accent-gold' :
                                                                        isDisabled ? 'border-white/5 text-white/20 opacity-50 cursor-not-allowed' : 'border-white/10 text-white/60 hover:border-white/30'}`}
                                                            >
                                                                {event.title}
                                                            </button>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                        {availableEvents.length === 0 && (
                                            <div className="text-xs text-white/30 italic">No events currently scheduled.</div>
                                        )}
                                    </motion.div>

                                    <motion.div variants={fadeUp} className="pt-6">
                                        <button
                                            className={`w-full group relative flex min-w-[140px] cursor-pointer items-center justify-center overflow-hidden rounded-none border border-accent-gold h-14 px-6 bg-accent-gold text-[#121212] transition-all duration-500 text-sm font-bold tracking-[0.2em] uppercase ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-[0_0_20px_rgba(198,166,100,0.3)] hover:-translate-y-1'}`}
                                            type="submit"
                                            disabled={isSubmitting}
                                        >
                                            {!isSubmitting && <span className="absolute inset-0 bg-transparent -translate-x-full border border-accent-gold transition-transform duration-500 ease-in-out group-hover:translate-x-0 group-hover:bg-[#121212]"></span>}
                                            <span className="relative z-10 flex items-center transition-colors duration-300 group-hover:text-accent-gold">
                                                <span className="truncate">{isSubmitting ? 'Processing...' : 'Submit Registration'}</span>
                                                {!isSubmitting && <span className="material-symbols-outlined ml-2 text-sm transition-transform duration-300 group-hover:translate-x-1">arrow_forward</span>}
                                            </span>
                                        </button>
                                    </motion.div>

                                    <motion.p variants={fadeUp} className="text-center text-xs text-white/30 font-sans pt-4">
                                        By registering, you agree to our Terms of Service and Code of Conduct.
                                    </motion.p>
                                </form>
                            </>
                        )}
                    </motion.div>
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-[#0f0e0b] border-t border-white/10 px-6 py-8">
                <div className="container mx-auto max-w-[1200px] flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-2 text-white opacity-40">
                        {/* Logo Removed */}
                    </div>
                    <div className="flex flex-wrap justify-center gap-6 text-[10px] uppercase tracking-widest font-bold">
                        <a className="text-white/40 hover:text-accent-gold transition-colors" href="#">Privacy</a>
                        <a className="text-white/40 hover:text-accent-gold transition-colors" href="#">Terms</a>
                        <a className="text-white/40 hover:text-accent-gold transition-colors" href="#">Support</a>
                    </div>
                    <p className="text-white/30 text-[10px] font-light tracking-widest uppercase">© 2026 DEXTRA Arts Festival</p>
                </div>
            </footer>
        </div>
    );
}
