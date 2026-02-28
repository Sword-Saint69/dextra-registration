"use client";

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, Easing } from 'framer-motion';
import * as XLSX from 'xlsx';
import { collection, onSnapshot, addDoc, deleteDoc, doc, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// --- Types ---
type EventModel = 'Individual' | 'Group';
type EventType = 'Onstage' | 'Offstage';

interface Event {
    id: string;
    title: string;
    model: EventModel;
    type: EventType;
    registrationsCount: number;
}

interface Participant {
    id: string;
    name: string;
    email: string;
    group: string;
    universityCode: string; // Updated from college
    events: string[];
}

// --- Animation Config ---
const luxuryEase: Easing = [0.22, 1, 0.36, 1];
const fadeUp = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { duration: 0.5, ease: luxuryEase } },
    exit: { y: -20, opacity: 0, transition: { duration: 0.3 } }
};

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState<'events' | 'participants'>('events');

    // State
    const [events, setEvents] = useState<Event[]>([]);
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterGroup, setFilterGroup] = useState('All');
    const [filterEvent, setFilterEvent] = useState('All');

    // Loading states
    // Removed unused loading states

    // Form State for New Event
    const [isAddingEvent, setIsAddingEvent] = useState(false);

    // Bulk Upload State
    const [isUploadingExcel, setIsUploadingExcel] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [newEvent, setNewEvent] = useState<Partial<Event>>({
        title: '',
        model: 'Individual',
        type: 'Onstage'
    });

    // --- Realtime Firestore Subscriptions ---
    useEffect(() => {
        // Listen to Events
        const eventsQuery = query(collection(db, 'events'));
        const unsubscribeEvents = onSnapshot(eventsQuery, (snapshot) => {
            const liveEvents: Event[] = [];
            snapshot.forEach((docSnap) => {
                liveEvents.push({ id: docSnap.id, ...docSnap.data() } as Event);
            });
            setEvents(liveEvents);
        });

        // Listen to Participants
        const participantsQuery = query(collection(db, 'participants'));
        const unsubscribeParticipants = onSnapshot(participantsQuery, (snapshot) => {
            const liveParticipants: Participant[] = [];
            snapshot.forEach((docSnap) => {
                const data = docSnap.data();
                // Map 'college' from Firestore to 'universityCode' in the client-side interface
                liveParticipants.push({
                    id: docSnap.id,
                    ...data,
                    universityCode: data.college // Assuming Firestore still stores it as 'college'
                } as Participant);
            });
            setParticipants(liveParticipants);
        });

        return () => {
            unsubscribeEvents();
            unsubscribeParticipants();
        };
    }, []);

    // --- Mutations ---
    const handleCreateEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newEvent.title) return;

        try {
            await addDoc(collection(db, 'events'), {
                title: newEvent.title,
                model: newEvent.model,
                type: newEvent.type,
                registrationsCount: 0 // Default to zero on creation
            });
            setIsAddingEvent(false);
            setNewEvent({ title: '', model: 'Individual', type: 'Onstage' });
        } catch (error) {
            console.error("Error creating event:", error);
            alert("Failed to create event. Is Firestore configured?");
        }
    };

    const handleDeleteEvent = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this event? This will not cascade delete registrations.")) return;
        try {
            await deleteDoc(doc(db, 'events', id));
        } catch (error) {
            console.error("Error deleting event:", error);
        }
    };

    const handleDeleteParticipant = async (id: string) => {
        if (!window.confirm("Are you sure you want to remove this participant?")) return;
        try {
            await deleteDoc(doc(db, 'participants', id));
        } catch (error) {
            console.error("Error deleting participant:", error);
        }
    };

    // --- Search Logic & Computations ---
    const filteredEvents = events.filter(e =>
        (e.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (e.type || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (e.model || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredParticipants = participants.filter(p => {
        const matchesGroup = filterGroup === 'All' || p.group === filterGroup;
        const matchesEvent = filterEvent === 'All' || (p.events || []).includes(filterEvent);
        const matchesSearch =
            (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (p.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (p.universityCode || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (p.group || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (p.events || []).some(ev => (ev || '').toLowerCase().includes(searchQuery.toLowerCase()));

        return matchesGroup && matchesEvent && matchesSearch;
    });

    // --- PDF Export Logic ---
    const exportToPDF = () => {
        const doc = new jsPDF();

        if (activeTab === 'events') {
            doc.text("DEXTRA 2026 - Events Directory", 14, 20);
            autoTable(doc, {
                startY: 25,
                head: [['Title', 'Model', 'Type', 'Registrations']],
                body: filteredEvents.map(e => [
                    e.title,
                    e.model,
                    e.type,
                    participants.filter(p => p.events.includes(e.title)).length.toString()
                ]),
            });
            doc.save("dextra_events_report.pdf");
        } else {
            doc.text("DEXTRA 2026 - Participant Directory", 14, 20);
            autoTable(doc, {
                startY: 25,
                head: [['Name', 'Contact', 'Code', 'Group', 'Events']],
                body: filteredParticipants.map(p => [
                    p.name,
                    p.email,
                    p.universityCode,
                    p.group || 'N/A',
                    p.events.join(", ")
                ]),
            });
            doc.save("dextra_participants_report.pdf");
        }
    };

    const exportToExcel = () => {
        if (activeTab === 'events') {
            const data = filteredEvents.map(e => ({
                Title: e.title,
                Model: e.model,
                Type: e.type,
                Registrations: participants.filter(p => p.events?.includes(e.title)).length
            }));
            const worksheet = XLSX.utils.json_to_sheet(data);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Events");
            XLSX.writeFile(workbook, "dextra_filtered_events.xlsx");
        } else {
            const data = filteredParticipants.map(p => ({
                Name: p.name,
                Email: p.email,
                UniversityCode: p.universityCode,
                Group: p.group || 'N/A',
                Events: (p.events || []).join(", ")
            }));
            const worksheet = XLSX.utils.json_to_sheet(data);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Participants");
            XLSX.writeFile(workbook, "dextra_filtered_participants.xlsx");
        }
    };

    // --- Excel Bulk Upload ---
    interface ExcelRow {
        Title?: string;
        Model?: string;
        Type?: string;
        [key: string]: unknown;
    }

    const handleDownloadSample = () => {
        const sampleData = [
            { Title: "Dance Battle", Model: "Group", Type: "Onstage" },
            { Title: "Photography", Model: "Individual", Type: "Offstage" },
            { Title: "Coding Hackathon", Model: "Group", Type: "Offstage" },
            { Title: "Solo Singing", Model: "Individual", Type: "Onstage" },
        ];
        const worksheet = XLSX.utils.json_to_sheet(sampleData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Events");
        XLSX.writeFile(workbook, "dextra-sample-events.xlsx");
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploadingExcel(true);
        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json<ExcelRow>(ws);

                let addedCount = 0;
                for (const row of data) {
                    if (row.Title && row.Model && row.Type) {
                        await addDoc(collection(db, 'events'), {
                            title: row.Title,
                            model: row.Model as EventModel,
                            type: row.Type as EventType,
                            registrationsCount: 0
                        });
                        addedCount++;
                    }
                }
                alert(`Successfully uploaded ${addedCount} events from the Excel file!`);
            } catch (error) {
                console.error("Error bulk uploading events:", error);
                alert("Error processing the Excel file. Please ensure it matches the sample format.");
            } finally {
                setIsUploadingExcel(false);
                if (fileInputRef.current) fileInputRef.current.value = "";
            }
        };
        reader.readAsBinaryString(file);
    };

    return (
        <div className="flex flex-col gap-8">

            {/* Tab Navigation */}
            <div className="flex border-b border-white/10 gap-8">
                <button
                    onClick={() => setActiveTab('events')}
                    className={`pb-4 text-sm font-bold uppercase tracking-widest transition-colors relative ${activeTab === 'events' ? 'text-accent-gold' : 'text-white/50 hover:text-white/80'}`}
                >
                    Manage Events
                    {activeTab === 'events' && (
                        <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-gold" />
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('participants')}
                    className={`pb-4 text-sm font-bold uppercase tracking-widest transition-colors relative ${activeTab === 'participants' ? 'text-accent-gold' : 'text-white/50 hover:text-white/80'}`}
                >
                    Participants
                    {activeTab === 'participants' && (
                        <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-gold" />
                    )}
                </button>
            </div>

            <AnimatePresence mode="wait">

                {/* EVENTS VIEW */}
                {activeTab === 'events' && (
                    <motion.div key="events-view" variants={fadeUp} initial="hidden" animate="show" exit="exit" className="flex flex-col gap-8">

                        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                            <div>
                                <h1 className="text-3xl font-display font-medium text-white mb-2">Event Directory</h1>
                                <p className="text-white/50 text-sm font-sans">Organize and structure the festival activities.</p>
                            </div>
                            <div className="flex flex-wrap gap-4">
                                <input
                                    type="text"
                                    placeholder="Search events..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="h-10 px-4 bg-[#181611] border border-white/20 text-white focus:border-accent-gold text-xs"
                                />
                                <button
                                    onClick={exportToPDF}
                                    className="group flex cursor-pointer items-center justify-center rounded-none border border-white/20 h-10 px-4 bg-accent-gold text-black transition-all duration-300 text-[10px] font-bold tracking-wider uppercase hover:bg-white"
                                >
                                    <span className="material-symbols-outlined mr-2 text-[16px]">picture_as_pdf</span>
                                    PDF
                                </button>
                                <button
                                    onClick={exportToExcel}
                                    className="group flex cursor-pointer items-center justify-center rounded-none border border-white/20 h-10 px-4 bg-green-600 text-white transition-all duration-300 text-[10px] font-bold tracking-wider uppercase hover:bg-green-700"
                                >
                                    <span className="material-symbols-outlined mr-2 text-[16px]">table_view</span>
                                    Excel
                                </button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept=".xlsx, .xls"
                                    onChange={handleFileUpload}
                                />
                                <button
                                    onClick={handleDownloadSample}
                                    className="group flex cursor-pointer items-center justify-center rounded-none border border-white/20 h-10 px-4 bg-[#181611] text-white/70 transition-all duration-300 text-[10px] font-bold tracking-wider uppercase hover:bg-white/10 hover:text-white"
                                >
                                    <span className="material-symbols-outlined mr-2 text-[16px]">download</span>
                                    Sample Excel
                                </button>
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploadingExcel}
                                    className={`group flex cursor-pointer items-center justify-center rounded-none border border-white/20 h-10 px-4 transition-all duration-300 text-[10px] font-bold tracking-wider uppercase ${isUploadingExcel ? 'bg-white/10 text-white/50 cursor-not-allowed' : 'bg-[#181611] text-white/70 hover:bg-white/10 hover:text-white'}`}
                                >
                                    <span className="material-symbols-outlined mr-2 text-[16px]">upload_file</span>
                                    {isUploadingExcel ? 'Uploading...' : 'Bulk Upload'}
                                </button>
                                <button
                                    onClick={() => setIsAddingEvent(!isAddingEvent)}
                                    className="group flex min-w-[140px] cursor-pointer items-center justify-center rounded-none border border-accent-gold h-10 px-6 bg-[#181611] text-accent-gold transition-all duration-300 text-xs font-bold tracking-wider uppercase hover:bg-accent-gold hover:text-[#121212]"
                                >
                                    <span className="material-symbols-outlined mr-2 text-[18px]">{isAddingEvent ? 'close' : 'add'}</span>
                                    {isAddingEvent ? 'Cancel' : 'New Event'}
                                </button>
                            </div>
                        </div>

                        {/* Add Event Form Panel */}
                        <AnimatePresence>
                            {isAddingEvent && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="bg-[#181611] border border-white/10 p-6 mb-4">
                                        <h3 className="font-display text-xl text-white mb-6 border-b border-white/5 pb-2">Create New Event</h3>
                                        <form onSubmit={handleCreateEvent} className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                                            <div className="space-y-2 md:col-span-2">
                                                <label className="block text-xs font-bold uppercase tracking-widest text-white/50">Event Title</label>
                                                <input
                                                    value={newEvent.title}
                                                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                                                    className="w-full h-10 px-3 border-white/10 bg-black/20 text-white focus:border-accent-gold focus:ring-1 focus:ring-accent-gold"
                                                    placeholder="E.g. Classical Solo Dance"
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="block text-xs font-bold uppercase tracking-widest text-white/50">Model</label>
                                                <select
                                                    value={newEvent.model}
                                                    onChange={(e) => setNewEvent({ ...newEvent, model: e.target.value as EventModel })}
                                                    className="w-full h-10 px-3 border-white/10 bg-black/20 text-white focus:border-accent-gold"
                                                >
                                                    <option value="Individual" className="bg-[#181611]">Individual</option>
                                                    <option value="Group" className="bg-[#181611]">Group</option>
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="block text-xs font-bold uppercase tracking-widest text-white/50">Type</label>
                                                <select
                                                    value={newEvent.type}
                                                    onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value as EventType })}
                                                    className="w-full h-10 px-3 border-white/10 bg-black/20 text-white focus:border-accent-gold"
                                                >
                                                    <option value="Onstage" className="bg-[#181611]">Onstage</option>
                                                    <option value="Offstage" className="bg-[#181611]">Offstage</option>
                                                </select>
                                            </div>
                                            <div className="md:col-span-4 mt-2 flex justify-end">
                                                <button type="submit" className="h-10 px-8 bg-accent-gold text-black font-bold text-xs uppercase tracking-widest hover:bg-white transition-colors">
                                                    Save Event
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Events Table */}
                        <div className="w-full overflow-x-auto border border-white/10 bg-[#181611]/50 mix-blend-screen backdrop-blur-sm">
                            <table className="w-full text-left text-sm text-white/80">
                                <thead className="bg-black/40 text-xs uppercase tracking-widest text-white/50 border-b border-white/10">
                                    <tr>
                                        <th className="px-6 py-4 font-bold">Event Title</th>
                                        <th className="px-6 py-4 font-bold">Model</th>
                                        <th className="px-6 py-4 font-bold">Type</th>
                                        <th className="px-6 py-4 font-bold text-center">Registrations</th>
                                        <th className="px-6 py-4 font-bold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    <AnimatePresence>
                                        {filteredEvents.map((event) => (
                                            <motion.tr
                                                key={event.id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                className="hover:bg-white/5 transition-colors"
                                            >
                                                <td className="px-6 py-4 font-medium text-white">{event.title}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-block px-2 py-1 text-[10px] uppercase tracking-wider border rounded-sm ${event.model === 'Group' ? 'border-accent-gold/40 text-accent-gold' : 'border-white/20 text-white/70'}`}>
                                                        {event.model}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-block px-2 py-1 text-[10px] uppercase tracking-wider border rounded-sm ${event.type === 'Onstage' ? 'border-accent-red/40 text-accent-red' : 'border-blue-400/40 text-blue-400/80'}`}>
                                                        {event.type}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center text-accent-gold font-bold">
                                                    {participants.filter(p => p.events?.includes(event.title)).length}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => handleDeleteEvent(event.id)}
                                                        className="text-white/30 hover:text-accent-red transition-colors p-1"
                                                        title="Delete Event"
                                                    >
                                                        <span className="material-symbols-outlined text-[18px]">delete</span>
                                                    </button>
                                                </td>
                                            </motion.tr>
                                        ))}
                                        {filteredEvents.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-12 text-center text-white/40 italic">No events generated yet.</td>
                                            </tr>
                                        )}
                                    </AnimatePresence>
                                </tbody>
                            </table>
                        </div>

                    </motion.div>
                )}

                {/* PARTICIPANTS VIEW */}
                {activeTab === 'participants' && (
                    <motion.div key="participants-view" variants={fadeUp} initial="hidden" animate="show" exit="exit" className="flex flex-col gap-8">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                            <div>
                                <h1 className="text-3xl font-display font-medium text-white mb-2">Registered Participants</h1>
                                <p className="text-white/50 text-sm font-sans">View and manage all incoming registrations.</p>
                            </div>
                            <div className="flex flex-wrap gap-4 items-center">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">House</span>
                                    <select
                                        value={filterGroup}
                                        onChange={(e) => setFilterGroup(e.target.value)}
                                        className="h-10 px-3 bg-[#181611] border border-white/20 text-white text-xs focus:border-accent-gold"
                                    >
                                        <option value="All">All Houses</option>
                                        <option value="AGNI">AGNI</option>
                                        <option value="ASTRA">ASTRA</option>
                                        <option value="VAJRA">VAJRA</option>
                                        <option value="RUDRA">RUDRA</option>
                                    </select>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Event</span>
                                    <select
                                        value={filterEvent}
                                        onChange={(e) => setFilterEvent(e.target.value)}
                                        className="h-10 px-3 bg-[#181611] border border-white/20 text-white text-xs focus:border-accent-gold max-w-[200px]"
                                    >
                                        <option value="All">All Events</option>
                                        {events.map(ev => (
                                            <option key={ev.id} value={ev.title}>{ev.title}</option>
                                        ))}
                                    </select>
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search details..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="h-10 px-4 bg-[#181611] border border-white/20 text-white focus:border-accent-gold text-xs min-w-[200px]"
                                />
                                <button
                                    onClick={exportToPDF}
                                    className="group flex cursor-pointer items-center justify-center rounded-none border border-white/20 h-10 px-4 bg-accent-gold text-black transition-all duration-300 text-[10px] font-bold tracking-wider uppercase hover:bg-white"
                                >
                                    <span className="material-symbols-outlined mr-2 text-[16px]">picture_as_pdf</span>
                                    PDF
                                </button>
                                <button
                                    onClick={exportToExcel}
                                    className="group flex cursor-pointer items-center justify-center rounded-none border border-white/20 h-10 px-4 bg-green-600 text-white transition-all duration-300 text-[10px] font-bold tracking-wider uppercase hover:bg-green-700"
                                >
                                    <span className="material-symbols-outlined mr-2 text-[16px]">table_view</span>
                                    Excel
                                </button>
                            </div>
                        </div>

                        {/* Participants Table */}
                        <div className="w-full overflow-x-auto border border-white/10 bg-[#181611]/50 mix-blend-screen backdrop-blur-sm">
                            <table className="w-full text-left text-sm text-white/80">
                                <thead className="bg-black/40 text-xs uppercase tracking-widest text-white/50 border-b border-white/10">
                                    <tr>
                                        <th className="px-6 py-4 font-bold">Name</th>
                                        <th className="px-6 py-4 font-bold">Contact & Univ Code</th>
                                        <th className="px-6 py-4 font-bold">Registered Events</th>
                                        <th className="px-6 py-4 font-bold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    <AnimatePresence>
                                        {filteredParticipants.map((participant) => (
                                            <motion.tr
                                                key={participant.id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                className="hover:bg-white/5 transition-colors"
                                            >
                                                <td className="px-6 py-4 font-medium text-white">{participant.name}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col text-xs gap-1">
                                                        <span className="text-accent-gold">{participant.email}</span>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-white/50">{participant.universityCode}</span>
                                                            {participant.group && (
                                                                <span className="px-1.5 py-0.5 bg-white/10 text-[9px] uppercase tracking-wider rounded-sm text-white/70">
                                                                    {participant.group}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-wrap gap-2">
                                                        {(participant.events || []).map(ev => (
                                                            <span key={ev} className="px-2 py-0.5 bg-white/5 border border-white/10 text-[10px] whitespace-nowrap">
                                                                {ev}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => handleDeleteParticipant(participant.id)}
                                                        className="text-white/30 hover:text-accent-red transition-colors p-1"
                                                        title="Remove Participant"
                                                    >
                                                        <span className="material-symbols-outlined text-[18px]">delete</span>
                                                    </button>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </AnimatePresence>
                                </tbody>
                            </table>
                        </div>

                    </motion.div>
                )}

            </AnimatePresence>
        </div>
    );
}
