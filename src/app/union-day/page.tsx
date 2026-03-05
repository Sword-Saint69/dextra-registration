"use client";

import { motion, useScroll, useTransform, Easing, Variants, AnimatePresence } from 'framer-motion';
import { useRef, useState } from 'react';
import Link from 'next/link';
import RedThread from '@/components/RedThread';
import Navbar from '@/components/Navbar';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Custom Easing (Luxury Ease)
const luxuryEase: Easing = [0.22, 1, 0.36, 1];

// Animation Variants
const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.08,
            delayChildren: 0.5,
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

const DEPARTMENTS = ["EC", "CSE", "CE", "ME", "EEE", "CSBS", "MTECH"];
const SEMESTERS = ["1", "2", "3", "4", "5", "6", "7", "8"];

interface Member {
    name: string;
    prpCode: string;
    department: string;
    semester: string;
}

export default function UnionDayRegister() {
    const heroRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: heroRef,
        offset: ["start start", "end start"]
    });

    const yParallax = useTransform(scrollYProgress, [0, 1], [0, 50]);

    // Form State
    const [registrationType, setRegistrationType] = useState<'individual' | 'group'>('individual');
    const [formData, setFormData] = useState({
        name: '',
        prpCode: '',
        department: '',
        semester: '',
        eventName: '',
        email: '',
        phone: ''
    });
    const [members, setMembers] = useState<Member[]>([]);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    // Member Management
    const addMember = () => {
        setMembers([...members, { name: '', prpCode: '', department: '', semester: '' }]);
    };

    const removeMember = (index: number) => {
        setMembers(members.filter((_, i) => i !== index));
    };

    const updateMember = (index: number, field: keyof Member, value: string) => {
        const newMembers = [...members];
        newMembers[index][field] = value;
        setMembers(newMembers);
    };

    // Registration Handler
    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();

        // Basic validation for selects
        if (!formData.department || !formData.semester || !formData.eventName) {
            alert("Please fill in Department, Semester, and Event Name.");
            return;
        }

        if (registrationType === 'group') {
            const invalidMember = members.find(m => !m.department || !m.semester || !m.name || !m.prpCode);
            if (invalidMember) {
                alert("Please fill in all details for team members.");
                return;
            }
        }

        setIsSubmitting(true);

        try {
            const submissionData = {
                ...formData,
                registrationType,
                members: registrationType === 'group' ? members : [],
                timestamp: new Date()
            };

            await addDoc(collection(db, 'union_day_participants'), submissionData);

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

    return (
        <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden bg-[#0a0a0a]">
            {/* Grain Overlay */}
            <div className="fixed inset-0 pointer-events-none z-[100] opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] contrast-150 brightness-150"></div>

            <Navbar />

            {/* Main Content */}
            <main ref={heroRef} className="flex-1 flex flex-col lg:flex-row relative">

                {/* Left Visual Area - Immersive Depth */}
                <div className="hidden lg:flex w-5/12 relative overflow-hidden bg-[#0d0d0d] border-r border-white/5">
                    <motion.div
                        className="absolute inset-0 origin-center"
                        initial={{ scale: 1.1, opacity: 0 }}
                        animate={{
                            scale: [1.05, 1.07, 1.05],
                            opacity: 1
                        }}
                        transition={{
                            opacity: { duration: 2, ease: luxuryEase },
                            scale: { duration: 20, repeat: Infinity, ease: "easeInOut" }
                        }}
                        style={{ y: yParallax }}
                    >
                        {/* Background Layers */}
                        <div className="absolute inset-0 bg-gradient-to-br from-accent-red/10 via-background-dark to-accent-gold/10"></div>
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>

                        <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                            <motion.div
                                className="w-full h-full bg-cover bg-center opacity-40 mix-blend-screen scale-110"
                                style={{
                                    backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCEFOcZsQa3Hn6DGxn93UyUYB6WMemrReBhY5qCcM2p62VuzDxg_FKI-5W7QPqWpBBDK7POHmzY4xYq0rOnVfGQLASZL12WghSCMzoXX7j8fLU7jNSn21qCCxfyBuXgdDHERo4dfz286DTdNZmH9Vb-WDqK-oLqcwm96MK7_CzbVHFTjjS0mXzCCjxQdKXSrtEpVO6sEHb62vMrt3rf3yb2Mbz2F81r836Zy5KZbbb2VLbh1fd-ZZ_tQuzq0D3ASostoPE55Rlad5KD')",
                                    filter: "grayscale(1) contrast(1.5) brightness(0.6)"
                                }}
                                animate={{
                                    rotate: [0, 1, 0, -1, 0],
                                    scale: [1, 1.05, 1]
                                }}
                                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-r from-[#0d0d0d] via-transparent to-[#0d0d0d] opacity-90"></div>
                            <div className="absolute inset-0 bg-gradient-to-b from-[#0d0d0d] via-transparent to-[#0d0d0d] opacity-90"></div>
                        </div>

                        {/* Floating Decorative Elements */}
                        <motion.div
                            className="absolute top-1/4 left-1/4 w-64 h-64 bg-accent-gold/5 rounded-full blur-[100px]"
                            animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
                            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                        />
                        <motion.div
                            className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-accent-red/5 rounded-full blur-[100px]"
                            animate={{ x: [0, -50, 0], y: [0, -30, 0] }}
                            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
                        />

                        <RedThread />

                        <motion.div
                            variants={staggerContainer}
                            initial="hidden"
                            animate="show"
                            className="relative z-10 flex flex-col justify-center p-20 w-full h-full"
                        >
                            <motion.div variants={fadeUp} className="flex items-center gap-4 mb-8">
                                <div className="h-px w-12 bg-accent-gold/40"></div>
                                <span className="text-accent-gold font-sans font-bold tracking-[0.5em] text-[10px] uppercase">
                                    Union Day 2026
                                </span>
                            </motion.div>

                            <h1 className="text-white font-display text-7xl font-bold leading-[0.9] mb-8 flex flex-col">
                                <motion.span variants={headingLine} className="block overflow-hidden pb-4">Unity in</motion.span>
                                <motion.span variants={headingLine} className="block overflow-hidden text-accent-gold italic drop-shadow-[0_0_20px_rgba(198,166,100,0.3)]">Artistic</motion.span>
                                <motion.span variants={headingLine} className="block overflow-hidden pb-4">Spirit.</motion.span>
                            </h1>

                            <motion.div variants={fadeUp} className="space-y-6">
                                <p className="text-white/40 text-sm max-w-xs font-sans font-medium leading-relaxed uppercase tracking-widest">
                                    Join the premier arts festival. A collective celebration of creativity and solidarity.
                                </p>
                                <div className="flex gap-4">
                                    <div className="h-10 w-[1px] bg-white/10"></div>
                                    <div className="flex flex-col justify-center">
                                        <span className="text-[10px] text-white/20 uppercase tracking-widest font-bold">Limited Slots</span>
                                        <span className="text-xs text-white/60 font-mono tracking-tighter">PHASE_01_OPEN</span>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    </motion.div>
                </div>

                {/* Right Form Area - Glassmorphism */}
                <div className="w-full lg:w-7/12 flex flex-col items-center justify-center px-6 py-20 md:px-16 lg:px-24 xl:px-32 relative">
                    <div className="absolute inset-0 bg-[#0a0a0a] opacity-50"></div>

                    {/* Floating Background Glow */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-lg aspect-square bg-accent-gold/5 rounded-full blur-[120px] pointer-events-none"></div>

                    <motion.div
                        className="w-full max-w-lg relative z-10"
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
                                <div className="w-24 h-24 rounded-full border border-accent-gold flex items-center justify-center mb-8 text-accent-gold shadow-[0_0_40px_rgba(198,166,100,0.2)]">
                                    <span className="material-symbols-outlined text-5xl">check</span>
                                </div>
                                <h2 className="text-white font-display text-5xl font-bold mb-6 tracking-tighter">Registration Complete</h2>
                                <p className="text-white/60 font-sans text-sm uppercase tracking-widest leading-loose">
                                    Thank you, {formData.name}.<br />Your entry for <span className="text-accent-gold">{formData.eventName}</span> has been stored.
                                </p>
                                <Link href="/" className="mt-12 group flex items-center gap-3 text-accent-gold uppercase tracking-[0.3em] text-[10px] font-black hover:text-white transition-all duration-500">
                                    <span className="material-symbols-outlined text-sm transition-transform duration-500 group-hover:-translate-x-2">west</span>
                                    Return to Home
                                </Link>
                            </motion.div>
                        ) : (
                            <div className="max-w-md w-full mx-auto">
                                <div className="mb-10 relative">
                                    <motion.h2 variants={fadeUp} className="text-white font-display text-4xl font-bold mb-2">Registration</motion.h2>
                                    <motion.div
                                        variants={{
                                            hidden: { width: 0 },
                                            show: { width: 48, transition: { duration: 0.8, ease: luxuryEase } }
                                        }}
                                        className="h-1 bg-accent-gold"
                                    ></motion.div>
                                    <motion.p variants={fadeUp} className="mt-6 text-white/50 text-sm font-sans uppercase tracking-widest">
                                        Express <span className="text-accent-gold italic">Unity</span> through your artistic craft at Union Day 2026.
                                    </motion.p>
                                </div>

                                <form className="space-y-6" onSubmit={handleRegister}>
                                    {/* Registration Type Selection */}
                                    <motion.div variants={fadeUp} className="flex gap-10 border-b border-white/5 pb-6 mb-4">
                                        <div className="flex items-center gap-4 cursor-pointer group" onClick={() => setRegistrationType('individual')}>
                                            <div className={`w-5 h-5 rounded-none border flex items-center justify-center transition-all duration-500 ${registrationType === 'individual' ? 'border-accent-gold' : 'border-white/10 group-hover:border-white/30'}`}>
                                                {registrationType === 'individual' && <motion.div layoutId="type-dot" className="w-2 h-2 bg-accent-gold" />}
                                            </div>
                                            <span className={`text-[10px] font-bold uppercase tracking-[0.2em] transition-all duration-500 ${registrationType === 'individual' ? 'text-white' : 'text-white/20 group-hover:text-white/40'}`}>Individual</span>
                                        </div>
                                        <div className="flex items-center gap-4 cursor-pointer group" onClick={() => setRegistrationType('group')}>
                                            <div className={`w-5 h-5 rounded-none border flex items-center justify-center transition-all duration-500 ${registrationType === 'group' ? 'border-accent-gold' : 'border-white/10 group-hover:border-white/30'}`}>
                                                {registrationType === 'group' && <motion.div layoutId="type-dot" className="w-2 h-2 bg-accent-gold" />}
                                            </div>
                                            <span className={`text-[10px] font-bold uppercase tracking-[0.2em] transition-all duration-500 ${registrationType === 'group' ? 'text-white' : 'text-white/20 group-hover:text-white/40'}`}>Group</span>
                                        </div>
                                    </motion.div>

                                    <div className="space-y-6">
                                        <motion.div variants={fadeUp} className="space-y-2">
                                            <label className="block text-xs font-bold uppercase tracking-widest text-white/70 font-sans" htmlFor="eventName">Event Name *</label>
                                            <input
                                                className="w-full h-12 px-4 rounded-none border border-white/10 bg-transparent text-white focus:border-accent-gold focus:ring-1 focus:ring-accent-gold transition-all"
                                                id="eventName" name="eventName" placeholder="Enter Event Name" required type="text"
                                                value={formData.eventName} onChange={handleInputChange} disabled={isSubmitting}
                                            />
                                        </motion.div>

                                        <motion.div variants={fadeUp} className="space-y-2">
                                            <label className="block text-xs font-bold uppercase tracking-widest text-white/70 font-sans" htmlFor="name">{registrationType === 'individual' ? 'Name' : 'Captain Name'} *</label>
                                            <input
                                                className="w-full h-12 px-4 rounded-none border border-white/10 bg-transparent text-white focus:border-accent-gold focus:ring-1 focus:ring-accent-gold transition-all"
                                                id="name" name="name" placeholder="Full Name" required type="text"
                                                value={formData.name} onChange={handleInputChange} disabled={isSubmitting}
                                            />
                                        </motion.div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <motion.div variants={fadeUp} className="space-y-2">
                                                <label className="block text-xs font-bold uppercase tracking-widest text-white/70 font-sans" htmlFor="prpCode">PRP Code *</label>
                                                <input
                                                    className="w-full h-12 px-4 rounded-none border border-white/10 bg-transparent text-white focus:border-accent-gold focus:ring-1 focus:ring-accent-gold transition-all uppercase"
                                                    id="prpCode" name="prpCode" placeholder="PRP24CS0XX" required type="text"
                                                    value={formData.prpCode} onChange={handleInputChange} disabled={isSubmitting}
                                                />
                                            </motion.div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <motion.div variants={fadeUp} className="space-y-2">
                                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-white/70 font-sans" htmlFor="department">Department</label>
                                                    <div className="relative">
                                                        <select
                                                            className="w-full h-12 px-4 rounded-none border border-white/10 bg-transparent text-white appearance-none focus:border-accent-gold focus:ring-1 focus:ring-accent-gold transition-all text-xs"
                                                            id="department" name="department" required
                                                            value={formData.department} onChange={handleInputChange} disabled={isSubmitting}
                                                        >
                                                            <option value="" className="bg-[#121212]">Dept</option>
                                                            {DEPARTMENTS.map(dept => (
                                                                <option key={dept} value={dept} className="bg-[#121212]">{dept}</option>
                                                            ))}
                                                        </select>
                                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-white/50">
                                                            <span className="material-symbols-outlined text-sm">keyboard_arrow_down</span>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                                <motion.div variants={fadeUp} className="space-y-2">
                                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-white/70 font-sans" htmlFor="semester">Semester</label>
                                                    <div className="relative">
                                                        <select
                                                            className="w-full h-12 px-4 rounded-none border border-white/10 bg-transparent text-white appearance-none focus:border-accent-gold focus:ring-1 focus:ring-accent-gold transition-all text-xs"
                                                            id="semester" name="semester" required
                                                            value={formData.semester} onChange={handleInputChange} disabled={isSubmitting}
                                                        >
                                                            <option value="" className="bg-[#121212]">Sem</option>
                                                            {SEMESTERS.map(sem => (
                                                                <option key={sem} value={sem} className="bg-[#121212]">{sem}</option>
                                                            ))}
                                                        </select>
                                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-white/50">
                                                            <span className="material-symbols-outlined text-sm">keyboard_arrow_down</span>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            </div>
                                        </div>

                                        <motion.div variants={fadeUp} className="space-y-2">
                                            <label className="block text-xs font-bold uppercase tracking-widest text-white/70 font-sans" htmlFor="email">Mail Id *</label>
                                            <input
                                                className="w-full h-12 px-4 rounded-none border border-white/10 bg-transparent text-white focus:border-accent-gold focus:ring-1 focus:ring-accent-gold transition-all"
                                                id="email" name="email" placeholder="email@address.com" required type="email"
                                                value={formData.email} onChange={handleInputChange} disabled={isSubmitting}
                                            />
                                        </motion.div>

                                        <motion.div variants={fadeUp} className="space-y-2">
                                            <label className="block text-xs font-bold uppercase tracking-widest text-white/70 font-sans" htmlFor="phone">Phone Number *</label>
                                            <input
                                                className="w-full h-12 px-4 rounded-none border border-white/10 bg-transparent text-white focus:border-accent-gold focus:ring-1 focus:ring-accent-gold transition-all"
                                                id="phone" name="phone" placeholder="+91 XXXXX XXXXX" required type="tel"
                                                value={formData.phone} onChange={handleInputChange} disabled={isSubmitting}
                                            />
                                        </motion.div>
                                    </div>

                                    {/* Group Members Section */}
                                    <AnimatePresence>
                                        {registrationType === 'group' && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden space-y-6 pt-4"
                                            >
                                                <div className="flex justify-between items-baseline border-b border-white/5 pb-2">
                                                    <h3 className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Group Members</h3>
                                                    <button
                                                        type="button"
                                                        onClick={addMember}
                                                        className="text-[10px] text-accent-gold uppercase tracking-widest font-bold hover:text-white transition-all flex items-center gap-1"
                                                    >
                                                        <span className="material-symbols-outlined text-sm">add</span> Add Member
                                                    </button>
                                                </div>

                                                <div className="space-y-4">
                                                    {members.map((member, index) => (
                                                        <motion.div
                                                            key={index}
                                                            initial={{ x: -10, opacity: 0 }}
                                                            animate={{ x: 0, opacity: 1 }}
                                                            className="p-4 border border-white/5 bg-white/[0.02] space-y-4 relative group"
                                                        >
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-[9px] text-white/20 uppercase tracking-widest font-bold">Member #{index + 1}</span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeMember(index)}
                                                                    className="text-white/10 hover:text-accent-red transition-all"
                                                                >
                                                                    <span className="material-symbols-outlined text-xs">close</span>
                                                                </button>
                                                            </div>

                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                <input
                                                                    className="w-full h-10 px-3 rounded-none border border-white/10 bg-transparent text-white focus:border-accent-gold transition-all text-sm"
                                                                    value={member.name}
                                                                    onChange={(e) => updateMember(index, 'name', e.target.value)}
                                                                    placeholder="Full Name" required
                                                                />
                                                                <input
                                                                    className="w-full h-10 px-3 rounded-none border border-white/10 bg-transparent text-white focus:border-accent-gold transition-all text-sm uppercase"
                                                                    value={member.prpCode}
                                                                    onChange={(e) => updateMember(index, 'prpCode', e.target.value)}
                                                                    placeholder="PRP Code" required
                                                                />
                                                                <div className="grid grid-cols-2 gap-2 col-span-1 md:col-span-2">
                                                                    <div className="relative">
                                                                        <select
                                                                            className="w-full h-10 px-3 rounded-none border border-white/10 bg-transparent text-white appearance-none focus:border-accent-gold transition-all text-xs"
                                                                            value={member.department}
                                                                            onChange={(e) => updateMember(index, 'department', e.target.value)}
                                                                            required
                                                                        >
                                                                            <option value="" className="bg-[#121212]">Dept</option>
                                                                            {DEPARTMENTS.map(dept => (
                                                                                <option key={dept} value={dept} className="bg-[#121212]">{dept}</option>
                                                                            ))}
                                                                        </select>
                                                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-white/30">
                                                                            <span className="material-symbols-outlined text-xs">keyboard_arrow_down</span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="relative">
                                                                        <select
                                                                            className="w-full h-10 px-3 rounded-none border border-white/10 bg-transparent text-white appearance-none focus:border-accent-gold transition-all text-xs"
                                                                            value={member.semester}
                                                                            onChange={(e) => updateMember(index, 'semester', e.target.value)}
                                                                            required
                                                                        >
                                                                            <option value="" className="bg-[#121212]">Sem</option>
                                                                            {SEMESTERS.map(sem => (
                                                                                <option key={sem} value={sem} className="bg-[#121212]">{sem}</option>
                                                                            ))}
                                                                        </select>
                                                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-white/30">
                                                                            <span className="material-symbols-outlined text-xs">keyboard_arrow_down</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    ))}
                                                    {members.length === 0 && (
                                                        <div className="text-center py-6 border border-dashed border-white/5 text-white/10 text-[9px] uppercase tracking-widest italic">
                                                            No members added yet.
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <motion.div variants={fadeUp} className="pt-6">
                                        <button
                                            className={`w-full group relative flex min-w-[140px] cursor-pointer items-center justify-center overflow-hidden rounded-none border border-accent-gold h-14 px-6 bg-accent-gold text-[#121212] transition-all duration-500 text-sm font-bold tracking-[0.2em] uppercase ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-[0_0_20px_rgba(198,166,100,0.3)] hover:-translate-y-1'}`}
                                            type="submit"
                                            disabled={isSubmitting}
                                        >
                                            {!isSubmitting && <span className="absolute inset-0 bg-transparent -translate-x-full border border-accent-gold transition-transform duration-500 ease-in-out group-hover:translate-x-0 group-hover:bg-[#121212]"></span>}
                                            <span className="relative z-10 flex items-center transition-colors duration-300 group-hover:text-accent-gold">
                                                <span className="truncate">{isSubmitting ? 'Synchronizing...' : 'Submit Registration'}</span>
                                                {!isSubmitting && <span className="material-symbols-outlined ml-2 text-sm transition-transform duration-300 group-hover:translate-x-1">arrow_forward</span>}
                                            </span>
                                        </button>
                                    </motion.div>

                                    <motion.p variants={fadeUp} className="text-center text-[10px] text-white/30 uppercase tracking-widest pt-4">
                                        By registering, you agree to the arts festival protocol.
                                    </motion.p>
                                </form>
                            </div>
                        )}
                    </motion.div>
                </div>
            </main>

            {/* Premium Footer */}
            <footer className="bg-[#050505] border-t border-white/5 px-6 py-16 relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                <div className="container mx-auto max-w-6xl flex flex-col md:flex-row items-center justify-between gap-12">
                    <div className="flex flex-col items-center md:items-start gap-4">
                        <span className="font-display text-2xl font-bold text-white tracking-tighter">DEXTRA</span>
                        <div className="flex gap-4">
                            <div className="w-1.5 h-1.5 bg-accent-gold rounded-full"></div>
                            <div className="w-1.5 h-1.5 bg-accent-red rounded-full"></div>
                            <div className="w-1.5 h-1.5 bg-white/20 rounded-full"></div>
                        </div>
                    </div>
                    <div className="flex flex-wrap justify-center gap-12 text-[9px] uppercase tracking-[0.5em] font-black text-white/20">
                        <a className="hover:text-accent-gold transition-colors" href="#">Manifesto</a>
                        <a className="hover:text-accent-gold transition-colors" href="#">Nexus</a>
                        <a className="hover:text-accent-gold transition-colors" href="#">Protocol</a>
                    </div>
                    <div className="text-center md:text-right">
                        <p className="text-white/20 text-[9px] font-black tracking-[0.4em] uppercase mb-2">© 2026 Collective Intelligence</p>
                        <p className="text-white/10 text-[8px] tracking-widest uppercase">Arts Festival Protocol v2.4.0</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
