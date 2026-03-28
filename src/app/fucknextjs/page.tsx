"use client";

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, Easing } from 'framer-motion';
import * as XLSX from 'xlsx';
import { collection, onSnapshot, addDoc, deleteDoc, doc, query, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// --- Types ---
type EventModel = 'Individual' | 'Group' | 'Duet';
type EventType = 'Onstage' | 'Offstage';

interface ParticipantMember {
    name: string;
    universityCode: string;
}

interface ScoringRules {
    individual: { first: number, second: number, third: number };
    group: { first: number, second: number, third: number };
}

interface House {
    id: string;
    name: string;
    points: number;
}

interface MediaAsset {
    id: string;
    publicId: string;
    url: string;
    title: string;
    category: string;
    size: 'square' | 'tall' | 'wide';
    timestamp: string;
    image?: string; // Fallback for older documents
}

interface Event {
    id: string;
    title: string;
    model: EventModel;
    type: EventType;
    registrationsCount: number;
    time?: string;
    endTime?: string;
    description?: string;
    location?: string;
    winners?: {
        first?: string[];
        second?: string[];
        third?: string[];
    };
}

interface Participant {
    id: string;
    name: string;
    email: string;
    group: string;
    universityCode: string; // Updated from college
    events: string[];
    groupNo?: string;
    members?: ParticipantMember[]; // Added members support
}

// --- Animation Config ---

// --- Animation Config ---
const luxuryEase: Easing = [0.22, 1, 0.36, 1];
const fadeUp = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { duration: 0.5, ease: luxuryEase } },
    exit: { y: -20, opacity: 0, transition: { duration: 0.3 } }
};

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState<'events' | 'participants' | 'media' | 'recreation' | 'spot' | 'results'>('events');

    // State
    const [events, setEvents] = useState<Event[]>([]);
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [media, setMedia] = useState<MediaAsset[]>([]);
    const [recreationMedia, setRecreationMedia] = useState<MediaAsset[]>([]);
    const [spotMedia, setSpotMedia] = useState<MediaAsset[]>([]);
    const [houses, setHouses] = useState<House[]>([]);
    const [sportsHouses, setSportsHouses] = useState<House[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterGroup, setFilterGroup] = useState('All');
    const [filterEvent, setFilterEvent] = useState('All');
    const [isRegOpen, setIsRegOpen] = useState(true);
    const [scoringRules, setScoringRules] = useState<ScoringRules>({
        individual: { first: 5, second: 3, third: 1 },
        group: { first: 10, second: 7, third: 5 }
    });

    // Loading states
    const [loading, setLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<{ current: number, total: number } | null>(null);

    // Form State for New Event
    const [isAddingEvent, setIsAddingEvent] = useState(false);

    // Bulk Upload State
    const [isUploadingExcel, setIsUploadingExcel] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const mediaInputRef = useRef<HTMLInputElement>(null);
    const freeMediaInputRef = useRef<HTMLInputElement>(null);
    const [editingEvent, setEditingEvent] = useState<Event | null>(null);
    const [winnerSearchQuery, setWinnerSearchQuery] = useState('');
    const [quickSearchQuery, setQuickSearchQuery] = useState('');
    const [quickAddHouse, setQuickAddHouse] = useState('NONE');
    const [activeSearch, setActiveSearch] = useState<{ eventId: string, place: 'first' | 'second' | 'third' } | null>(null);
    const [isAddingParticipant, setIsAddingParticipant] = useState(false);
    const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null);
    const [newParticipant, setNewParticipant] = useState<Partial<Participant>>({
        name: '',
        email: '',
        universityCode: '',
        group: 'NONE',
        events: []
    });
    const [newEvent, setNewEvent] = useState<Partial<Event>>({
        title: '',
        model: 'Individual',
        type: 'Onstage',
        time: '',
        endTime: '',
        description: '',
        location: ''
    });

    // Media State
    const [lastUploaded, setLastUploaded] = useState<{ url: string, publicId: string } | null>(null);

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
                liveParticipants.push({
                    id: docSnap.id,
                    ...data,
                    universityCode: data.universityCode || data.college || data.university_code || data.prpCode || data.univ_code || '',
                    members: (data.members || []).map((m: any) => ({
                        ...m,
                        universityCode: m.universityCode || m.college || m.university_code || m.prpCode || m.univ_code || ''
                    }))
                } as Participant);
            });
            setParticipants(liveParticipants);
        });

        // Listen to Media
        const mediaQuery = query(collection(db, 'media'));
        const unsubscribeMedia = onSnapshot(mediaQuery, (snapshot) => {
            console.log("Admin Dashboard: Media Snapshot received, count:", snapshot.size);
            const liveMedia: MediaAsset[] = [];
            snapshot.forEach((docSnap) => {
                const data = docSnap.data();
                liveMedia.push({ id: docSnap.id, ...data } as MediaAsset);
            });
            // Sort by timestamp desc, handling missing or invalid timestamps
            const sortedMedia = [...liveMedia].sort((a, b) => {
                const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
                const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
                return timeB - timeA;
            });
            setMedia(sortedMedia);
        }, (error) => {
            console.error("Admin Dashboard: Media Subscription Error:", error);
        });

        // Listen to Recreation Media

        // Listen to Recreation Media
        const recreationQuery = query(collection(db, 'recreation_media'));
        const unsubscribeRecreation = onSnapshot(recreationQuery, (snapshot) => {
            const liveRecreation: MediaAsset[] = [];
            snapshot.forEach((docSnap) => {
                const data = docSnap.data();
                liveRecreation.push({
                    id: docSnap.id,
                    ...data,
                    publicId: data.publicId || data.image || 'cld-sample-5',
                    url: data.url || (data.image && data.image.startsWith('http') ? data.image : `https://res.cloudinary.com/ddx7vzskv/image/upload/v1/${data.image || 'cld-sample-5'}`)
                } as MediaAsset);
            });
            setRecreationMedia(liveRecreation);
        });

        // Listen to Spot Media
        const spotQuery = query(collection(db, 'spot_media'));
        const unsubscribeSpot = onSnapshot(spotQuery, (snapshot) => {
            const liveSpot: MediaAsset[] = [];
            snapshot.forEach((docSnap) => {
                const data = docSnap.data();
                liveSpot.push({
                    id: docSnap.id,
                    ...data,
                    publicId: data.publicId || data.image || 'cld-sample-5',
                    url: data.url || (data.image && data.image.startsWith('http') ? data.image : `https://res.cloudinary.com/ddx7vzskv/image/upload/v1/${data.image || 'cld-sample-5'}`)
                } as MediaAsset);
            });
            setSpotMedia(liveSpot);
        });

        // Listen to Houses
        const housesQuery = query(collection(db, 'houses'));
        const unsubscribeHouses = onSnapshot(housesQuery, (snapshot) => {
            const liveHouses: House[] = [];
            snapshot.forEach((docSnap) => {
                liveHouses.push({ id: docSnap.id, ...docSnap.data() } as House);
            });
            setHouses(liveHouses);
        });

        // Listen to Sports Houses
        const sportsHousesQuery = query(collection(db, 'sports_houses'));
        const unsubscribeSportsHouses = onSnapshot(sportsHousesQuery, (snapshot) => {
            const liveHouses: House[] = [];
            snapshot.forEach((docSnap) => {
                liveHouses.push({ id: docSnap.id, ...docSnap.data() } as House);
            });
            setSportsHouses(liveHouses);
        });

        // Listen to Scoring Rules
        const rulesDoc = doc(db, 'settings', 'scoring');
        const unsubscribeRules = onSnapshot(rulesDoc, (snapshot) => {
            if (snapshot.exists()) {
                setScoringRules(snapshot.data() as ScoringRules);
            }
        });

        // Listen to Registration Settings
        const regSettingsDoc = doc(db, 'settings', 'registration');
        const unsubscribeRegSettings = onSnapshot(regSettingsDoc, (snapshot) => {
            if (snapshot.exists()) {
                setIsRegOpen(snapshot.data().isOpen);
            }
        });

        return () => {
            unsubscribeEvents();
            unsubscribeParticipants();
            unsubscribeMedia();
            unsubscribeRecreation();
            unsubscribeSpot();
            unsubscribeRegSettings();
            unsubscribeHouses();
            unsubscribeSportsHouses();
            unsubscribeRules();
        };
    }, []);

    // --- Mutations ---
    const updateHousePoints = async (id: string, newPoints: number) => {
        try {
            await updateDoc(doc(db, 'houses', id), { points: newPoints });
        } catch (error) {
            console.error("Error updating house points:", error);
        }
    };

    const updateSportsHousePoints = async (id: string, newPoints: number) => {
        try {
            await updateDoc(doc(db, 'sports_houses', id), { points: newPoints });
        } catch (error) {
            console.error("Error updating sports house points:", error);
        }
    };

    const handleCreateParticipant = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newParticipant.name) return;
        try {
            await addDoc(collection(db, 'participants'), {
                ...newParticipant,
                events: newParticipant.events || [],
                timestamp: new Date().toISOString()
            });
            setIsAddingParticipant(false);
            setNewParticipant({ name: '', email: '', universityCode: '', group: 'NONE', events: [] });
        } catch (error) {
            console.error("Error creating participant:", error);
        }
    };

    const handleUpdateParticipant = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingParticipant?.id || !newParticipant.name) return;
        try {
            const partRef = doc(db, 'participants', editingParticipant.id);
            await updateDoc(partRef, {
                name: newParticipant.name,
                email: newParticipant.email,
                universityCode: newParticipant.universityCode,
                group: newParticipant.group,
                events: newParticipant.events || []
            });
            setIsAddingParticipant(false);
            setEditingParticipant(null);
            setNewParticipant({ name: '', email: '', universityCode: '', group: 'NONE', events: [] });
        } catch (error) {
            console.error("Error updating participant:", error);
        }
    };

    const handleEditParticipant = (p: Participant) => {
        setEditingParticipant(p);
        setNewParticipant({
            name: p.name,
            email: p.email,
            universityCode: p.universityCode,
            group: p.group,
            events: p.events || []
        });
        setIsAddingParticipant(true);
    };

    const updateParticipantGroup = async (participantId: string, newGroup: string) => {
        try {
            const partRef = doc(db, 'participants', participantId);
            await updateDoc(partRef, { group: newGroup });
            // The score recalculation will use the new group data next time it's run
        } catch (error) {
            console.error("Error updating participant group:", error);
        }
    };

    const updateEventWinner = async (eventId: string, place: 'first' | 'second' | 'third', participantId: string, isRemoving: boolean = false) => {
        try {
            const event = events.find(e => e.id === eventId);
            if (!event) return;

            const rawWinners = event.winners?.[place];
            const currentWinners = Array.isArray(rawWinners) ? rawWinners : (rawWinners ? [rawWinners] : []);
            let newWinners: string[];

            if (isRemoving) {
                newWinners = currentWinners.filter(id => id !== participantId);
            } else {
                if (currentWinners.includes(participantId)) return;
                newWinners = [...currentWinners, participantId];
            }

            const eventRef = doc(db, 'events', eventId);
            await updateDoc(eventRef, {
                [`winners.${place}`]: newWinners
            });

            // Recalculate house points after winner change
            const newHousePoints: Record<string, number> = {
                'AGNI': 0, 'ASTRA': 0, 'VAJRA': 0, 'RUDRA': 0
            };

            events.forEach(ev => {
                const winnersForEv = ev.id === eventId
                    ? { ...ev.winners, [place]: newWinners }
                    : ev.winners;

                const rules = ev.model === 'Individual' ? scoringRules.individual : scoringRules.group;

                (['first', 'second', 'third'] as const).forEach(p => {
                    const rawW = winnersForEv?.[p];
                    const winnerIds = Array.isArray(rawW) ? rawW : (rawW ? [rawW] : []);
                    winnerIds.forEach(wid => {
                        const winner = participants.find(part => part.id === wid);
                        if (winner && winner.group) {
                            const houseName = winner.group.toUpperCase();
                            if (newHousePoints[houseName] !== undefined) {
                                newHousePoints[houseName] += rules[p];
                            }
                        }
                    });
                });
            });

            for (const house of houses) {
                const updatedPoints = newHousePoints[house.name.toUpperCase()];
                if (updatedPoints !== undefined && updatedPoints !== house.points) {
                    await updateDoc(doc(db, 'houses', house.id), { points: updatedPoints });
                }
            }
        } catch (error) {
            console.error("Error updating winner and scores:", error);
        }
    };

    const updateScoringRules = async (newRules: ScoringRules) => {
        try {
            await updateDoc(doc(db, 'settings', 'scoring'), newRules as any);
        } catch (error) {
            // Handle if doc doesn't exist
            const { setDoc } = await import('firebase/firestore');
            await setDoc(doc(db, 'settings', 'scoring'), newRules as any);
        }
    };

    const recalculateAllScores = async () => {
        if (!window.confirm("Recalculate all house scores based on current winners and rules? This will overwrite manual point adjustments.")) return;
        setLoading(true);
        try {
            const newHousePoints: Record<string, number> = {
                'AGNI': 0, 'ASTRA': 0, 'VAJRA': 0, 'RUDRA': 0
            };

            events.forEach(event => {
                const rules = event.model === 'Individual' ? scoringRules.individual : scoringRules.group;

                (['first', 'second', 'third'] as const).forEach(place => {
                    const rawW = event.winners?.[place];
                    const winnerIds = Array.isArray(rawW) ? rawW : (rawW ? [rawW] : []);
                    winnerIds.forEach(winnerId => {
                        const winner = participants.find(p => p.id === winnerId);
                        if (winner && winner.group) {
                            const houseName = winner.group.toUpperCase();
                            if (newHousePoints[houseName] !== undefined) {
                                newHousePoints[houseName] += rules[place];
                            }
                        }
                    });
                });
            });

            // Update Firestore
            for (const house of houses) {
                const updatedPoints = newHousePoints[house.name.toUpperCase()];
                if (updatedPoints !== undefined) {
                    await updateDoc(doc(db, 'houses', house.id), { points: updatedPoints });
                }
            }
            alert("Scoreboard recalculated successfully!");
        } catch (error) {
            console.error("Recalculation error:", error);
            alert("Failed to recalculate scores.");
        } finally {
            setLoading(false);
        }
    };

    const seedHouses = async () => {
        const defaultHouses = [
            { name: 'AGNI', points: 0 },
            { name: 'ASTRA', points: 0 },
            { name: 'VAJRA', points: 0 },
            { name: 'RUDRA', points: 0 }
        ];
        try {
            for (const h of defaultHouses) {
                await addDoc(collection(db, 'houses'), h);
            }
        } catch (error) {
            console.error("Error seeding houses:", error);
        }
    };

    const handleCreateEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newEvent.title) return;

        try {
            await addDoc(collection(db, 'events'), {
                title: newEvent.title,
                model: newEvent.model,
                type: newEvent.type,
                registrationsCount: 0,
                time: newEvent.time || '',
                endTime: newEvent.endTime || '',
                description: newEvent.description || '',
                location: newEvent.location || ''
            });
            setIsAddingEvent(false);
            setNewEvent({ title: '', model: 'Individual', type: 'Onstage', time: '', endTime: '', description: '', location: '' });
        } catch (error) {
            console.error("Error creating event:", error);
            alert("Failed to create event. Is Firestore configured?");
        }
    };

    const handleUpdateEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingEvent?.id || !newEvent.title) return;

        try {
            const eventRef = doc(db, 'events', editingEvent.id);
            await updateDoc(eventRef, {
                title: newEvent.title,
                model: newEvent.model,
                type: newEvent.type,
                time: newEvent.time || '',
                endTime: newEvent.endTime || '',
                description: newEvent.description || '',
                location: newEvent.location || ''
            });
            setIsAddingEvent(false);
            setEditingEvent(null);
            setNewEvent({ title: '', model: 'Individual', type: 'Onstage', time: '', endTime: '', description: '', location: '' });
        } catch (error) {
            console.error("Error updating event:", error);
            alert("Failed to update event.");
        }
    };

    const handleEditClick = (event: Event) => {
        setEditingEvent(event);
        setNewEvent({
            title: event.title,
            model: event.model,
            type: event.type,
            time: event.time || '',
            endTime: event.endTime || '',
            description: event.description || '',
            location: event.location || ''
        });
        setIsAddingEvent(true);
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

    const handleDeleteMedia = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this asset from the gallery?")) return;
        try {
            await deleteDoc(doc(db, 'media', id));
        } catch (error) {
            console.error("Error deleting media:", error);
        }
    };

    const handleDeleteRecreationMedia = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this recreation entry?")) return;
        try {
            await deleteDoc(doc(db, 'recreation_media', id));
        } catch (error) {
            console.error("Error deleting recreation media:", error);
        }
    };

    const handleDeleteSpotMedia = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this spot photography entry?")) return;
        try {
            await deleteDoc(doc(db, 'spot_media', id));
        } catch (error) {
            console.error("Error deleting spot media:", error);
        }
    };

    const handleToggleRegistration = async () => {
        try {
            const regRef = doc(db, 'settings', 'registration');
            await updateDoc(regRef, {
                isOpen: !isRegOpen
            });
        } catch (error) {
            console.error("Error toggling registration:", error);
            // If document doesn't exist, create it
            try {
                const regRef = doc(db, 'settings', 'registration');
                const { setDoc } = await import('firebase/firestore');
                await setDoc(regRef, {
                    isOpen: !isRegOpen
                });
            } catch (innerError) {
                console.error("Failed to create settings document:", innerError);
                alert("Failed to update registration status.");
            }
        }
    };

    const handleDownload = async (url: string, title: string) => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = `${title.replace(/\s+/g, '_')}_DEXTRA_RECREATION.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.error("Download failed:", error);
            window.open(url, '_blank');
        }
    };

    const handleImgBBUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setLoading(true);
        setUploadProgress({ current: 0, total: files.length });

        try {
            const apiKey = process.env.NEXT_PUBLIC_IMGBB_API_KEY;

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                setUploadProgress({ current: i + 1, total: files.length });

                const formData = new FormData();
                formData.append('image', file);

                const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
                    method: 'POST',
                    body: formData
                });

                const result = await response.json();

                if (result.success) {
                    const info = result.data;
                    setLastUploaded({
                        url: info.url,
                        publicId: info.id
                    });

                    await addDoc(collection(db, 'media'), {
                        publicId: info.id,
                        url: info.url,
                        title: file.name.split('.')[0] || 'New Asset',
                        category: 'All',
                        size: 'square',
                        timestamp: new Date().toISOString()
                    });
                } else {
                    console.error(`ImgBB Upload Failed for ${file.name}:`, result.error);
                }
            }
        } catch (error) {
            console.error("Error in bulk ImgBB upload:", error);
            alert("Some uploads might have failed. Please check the library.");
        } finally {
            setLoading(false);
            setUploadProgress(null);
            if (mediaInputRef.current) mediaInputRef.current.value = '';
        }
    };

    const handleFreeImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        // 4MB limit for proxy route to avoid 413 Payload Too Large
        const MAX_SIZE = 4 * 1024 * 1024;
        for (const file of Array.from(files)) {
            if (file.size > MAX_SIZE) {
                alert(`File ${file.name} is too large for FreeImage (max 4MB). Please use the "Upload ImgBB" button for larger files.`);
                return;
            }
        }

        setLoading(true);
        setUploadProgress({ current: 0, total: files.length });

        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                setUploadProgress({ current: i + 1, total: files.length });

                const formData = new FormData();
                formData.append('source', file);
                formData.append('action', 'upload');
                formData.append('format', 'json');

                const response = await fetch('/api/upload/freeimage', {
                    method: 'POST',
                    body: formData
                });

                if (!response.ok) {
                    const text = await response.text();
                    console.error(`FreeImage Proxy Error (${response.status}):`, text);
                    throw new Error(`Upload failed with status ${response.status}. The file might be too large for the server.`);
                }

                const result = await response.json();

                if (result.status_code === 200) {
                    const info = result.image;
                    setLastUploaded({
                        url: info.url,
                        publicId: info.id_encoded
                    });

                    await addDoc(collection(db, 'media'), {
                        publicId: info.id_encoded,
                        url: info.url,
                        title: file.name.split('.')[0] || 'New Asset',
                        category: 'All',
                        size: 'square',
                        timestamp: new Date().toISOString()
                    });
                } else {
                    console.error(`FreeImage Upload Failed for ${file.name}:`, result);
                }
            }
        } catch (error) {
            console.error("Error in bulk FreeImage upload:", error);
            alert(error instanceof Error ? error.message : "Some uploads might have failed. Please check the library.");
        } finally {
            setLoading(false);
            setUploadProgress(null);
            if (freeMediaInputRef.current) freeMediaInputRef.current.value = '';
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
        } else if (activeTab === 'participants') {
            doc.text("DEXTRA 2026 - Participant Directory", 14, 20);
            autoTable(doc, {
                startY: 25,
                head: [['Name', 'Contact', 'Code', 'Group', 'G#', 'Events', 'Members']],
                body: filteredParticipants.map(p => [
                    p.name,
                    p.email,
                    p.universityCode,
                    p.group || 'N/A',
                    p.groupNo || 'N/A',
                    p.events.join(", "),
                    (p.members || []).map(m => `${m.name} (${m.universityCode})`).join("\n") || 'N/A'
                ]),
                styles: { fontSize: 8 },
                columnStyles: { 6: { cellWidth: 40 } }
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
        } else if (activeTab === 'participants') {
            const data = filteredParticipants.map(p => ({
                Name: p.name,
                Email: p.email,
                UniversityCode: p.universityCode,
                Group: p.group || 'N/A',
                GroupNo: p.groupNo || 'N/A',
                Events: (p.events || []).join(", "),
                Members: (p.members || []).map(m => `${m.name} (${m.universityCode})`).join(", ") || 'N/A'
            }));
            const worksheet = XLSX.utils.json_to_sheet(data);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Participants");
            XLSX.writeFile(workbook, "dextra_filtered_participants.xlsx");
        }
    };

    const exportWinnersToExcel = () => {
        const rows: any[] = [];
        events.forEach(event => {
            if (!event.winners) return;
            const places = ['first', 'second', 'third'] as const;
            places.forEach(place => {
                const rawW = event.winners?.[place];
                if (!rawW) return;
                const winnerIds = Array.isArray(rawW) ? rawW : [rawW];
                winnerIds.forEach(wid => {
                    const p = participants.find(part => part.id === wid);
                    if (p) {
                        const positionStr = place === 'first' ? '1st' : place === 'second' ? '2nd' : '3rd';
                        const addRow = (name: string, univCode: string, groupOrHouse: string, gNo: string) => {
                            rows.push({
                                Event: event.title,
                                Position: positionStr,
                                'University Code': univCode,
                                Name: name,
                                Group: gNo !== 'N/A' && gNo ? gNo : groupOrHouse
                            });
                        };
                        
                        addRow(p.name, p.universityCode, p.group || 'NONE', p.groupNo || 'N/A');
                        
                        if (p.members && Array.isArray(p.members)) {
                            p.members.forEach((m: any) => {
                                addRow(m.name || 'Unknown', m.universityCode || '', p.group || 'NONE', p.groupNo || 'N/A');
                            });
                        }
                    }
                });
            });
        });
        
        if (rows.length === 0) {
            alert("No winners to export.");
            return;
        }

        const worksheet = XLSX.utils.json_to_sheet(rows);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Winners");
        XLSX.writeFile(workbook, "dextra_event_winners.xlsx");
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
            <div className="flex flex-col md:flex-row border-b border-white/10 gap-8 justify-between items-center">
                <div className="flex gap-8">
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
                    <button
                        onClick={() => setActiveTab('media')}
                        className={`pb-4 text-sm font-bold uppercase tracking-widest transition-colors relative ${activeTab === 'media' ? 'text-accent-gold' : 'text-white/50 hover:text-white/80'}`}
                    >
                        Media Library
                        {activeTab === 'media' && (
                            <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-gold" />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('recreation')}
                        className={`pb-4 text-sm font-bold uppercase tracking-widest transition-colors relative ${activeTab === 'recreation' ? 'text-pink-500' : 'text-white/50 hover:text-white/80'}`}
                    >
                        Recreation
                        {activeTab === 'recreation' && (
                            <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-pink-500" />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('results')}
                        className={`pb-4 text-sm font-bold uppercase tracking-widest transition-colors relative ${activeTab === 'results' ? 'text-accent-gold' : 'text-white/50 hover:text-white/80'}`}
                    >
                        Scoreboard Center
                        {activeTab === 'results' && (
                            <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-gold" />
                        )}
                    </button>
                </div>

                <div className="pb-4">
                    <button
                        onClick={handleToggleRegistration}
                        className={`flex items-center gap-2 px-4 py-2 text-[10px] font-bold uppercase tracking-widest border transition-all ${isRegOpen ? 'border-green-500/50 text-green-400 bg-green-500/5 hover:bg-green-500/10' : 'border-red-500/50 text-red-400 bg-red-500/5 hover:bg-red-500/10'}`}
                    >
                        <span className={`w-2 h-2 rounded-full ${isRegOpen ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                        Registration: {isRegOpen ? 'Open' : 'Closed'}
                    </button>
                </div>
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
                                        <h3 className="font-display text-xl text-white mb-6 border-b border-white/5 pb-2">
                                            {editingEvent ? 'Edit Event' : 'Create New Event'}
                                        </h3>
                                        <form onSubmit={editingEvent ? handleUpdateEvent : handleCreateEvent} className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
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
                                                    <option value="Duet" className="bg-[#181611]">Duet</option>
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

                                            {/* New Detailed Fields */}
                                            <div className="space-y-2">
                                                <label className="block text-xs font-bold uppercase tracking-widest text-white/50">Start Time</label>
                                                <input
                                                    value={newEvent.time}
                                                    onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                                                    className="w-full h-10 px-3 border-white/10 bg-black/20 text-white focus:border-accent-gold"
                                                    placeholder="10:30 AM"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="block text-xs font-bold uppercase tracking-widest text-white/50">End Time</label>
                                                <input
                                                    value={newEvent.endTime}
                                                    onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
                                                    className="w-full h-10 px-3 border-white/10 bg-black/20 text-white focus:border-accent-gold"
                                                    placeholder="12:00 PM"
                                                />
                                            </div>
                                            <div className="space-y-2 md:col-span-2">
                                                <label className="block text-xs font-bold uppercase tracking-widest text-white/50">Location</label>
                                                <input
                                                    value={newEvent.location}
                                                    onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                                                    className="w-full h-10 px-3 border-white/10 bg-black/20 text-white focus:border-accent-gold"
                                                    placeholder="Auditorium / Zoom Link"
                                                />
                                            </div>
                                            <div className="space-y-2 md:col-span-4">
                                                <label className="block text-xs font-bold uppercase tracking-widest text-white/50">Description</label>
                                                <textarea
                                                    value={newEvent.description}
                                                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                                                    className="w-full h-24 p-3 border-white/10 bg-black/20 text-white focus:border-accent-gold"
                                                    placeholder="Describe the event briefly..."
                                                />
                                            </div>

                                            <div className="md:col-span-4 mt-2 flex justify-end gap-4">
                                                {editingEvent && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setIsAddingEvent(false);
                                                            setEditingEvent(null);
                                                            setNewEvent({ title: '', model: 'Individual', type: 'Onstage', time: '', endTime: '', description: '', location: '' });
                                                        }}
                                                        className="h-10 px-8 border border-white/20 text-white/70 font-bold text-xs uppercase tracking-widest hover:bg-white/10 transition-colors"
                                                    >
                                                        Cancel
                                                    </button>
                                                )}
                                                <button type="submit" className="h-10 px-8 bg-accent-gold text-black font-bold text-xs uppercase tracking-widest hover:bg-white transition-colors">
                                                    {editingEvent ? 'Update Event' : 'Save Event'}
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
                                        <th className="px-6 py-4 font-bold">Time</th>
                                        <th className="px-6 py-4 font-bold">Location</th>
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
                                                <td className="px-6 py-4 text-xs italic text-accent-gold/70">{event.time || 'TBD'}</td>
                                                <td className="px-6 py-4 text-xs text-white/60">{event.location || 'TBD'}</td>
                                                <td className="px-6 py-4 text-center text-accent-gold font-bold">
                                                    {participants.filter(p => p.events?.includes(event.title)).length}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-2 text-white/40">
                                                        <button
                                                            onClick={() => handleEditClick(event)}
                                                            className="p-1 hover:text-accent-gold transition-colors"
                                                            title="Edit Event"
                                                        >
                                                            <span className="material-symbols-outlined text-[18px]">edit</span>
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteEvent(event.id)}
                                                            className="text-white/30 hover:text-accent-red transition-colors p-1"
                                                            title="Delete Event"
                                                        >
                                                            <span className="material-symbols-outlined text-[18px]">delete</span>
                                                        </button>
                                                    </div>
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
                                    className="h-10 px-4 bg-[#181611] border border-white/20 text-white text-xs min-w-[200px]"
                                />
                                <button
                                    onClick={() => {
                                        setEditingParticipant(null);
                                        setNewParticipant({ name: '', email: '', universityCode: '', group: 'NONE', events: [] });
                                        setIsAddingParticipant(!isAddingParticipant);
                                    }}
                                    className="group flex min-w-[140px] cursor-pointer items-center justify-center rounded-none border border-accent-gold h-10 px-6 bg-[#181611] text-accent-gold transition-all duration-300 text-xs font-bold tracking-wider uppercase hover:bg-accent-gold hover:text-[#121212]"
                                >
                                    <span className="material-symbols-outlined mr-2 text-[18px]">{isAddingParticipant ? 'close' : 'person_add'}</span>
                                    {isAddingParticipant ? 'Cancel' : 'New Person'}
                                </button>
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

                        {/* Add Participant Form Panel */}
                        <AnimatePresence>
                            {isAddingParticipant && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="bg-[#181611] border border-white/10 p-6 mb-4">
                                        <h3 className="font-display text-xl text-white mb-6 border-b border-white/5 pb-2">
                                            {editingParticipant ? 'Edit Person' : 'Add New Person'}
                                        </h3>
                                        <form onSubmit={editingParticipant ? handleUpdateParticipant : handleCreateParticipant} className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                                            <div className="space-y-2 md:col-span-1">
                                                <label className="block text-xs font-bold uppercase tracking-widest text-white/50">Full Name</label>
                                                <input
                                                    value={newParticipant.name}
                                                    onChange={(e) => setNewParticipant({ ...newParticipant, name: e.target.value })}
                                                    className="w-full h-10 px-3 border-white/10 bg-black/20 text-white focus:border-accent-gold"
                                                    placeholder="John Doe"
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2 md:col-span-1">
                                                <label className="block text-xs font-bold uppercase tracking-widest text-white/50">College / Univ Code</label>
                                                <input
                                                    value={newParticipant.universityCode}
                                                    onChange={(e) => setNewParticipant({ ...newParticipant, universityCode: e.target.value })}
                                                    className="w-full h-10 px-3 border-white/10 bg-black/20 text-white focus:border-accent-gold"
                                                    placeholder="CAS/648"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="block text-xs font-bold uppercase tracking-widest text-white/50">House (Group)</label>
                                                <select
                                                    value={newParticipant.group}
                                                    onChange={(e) => setNewParticipant({ ...newParticipant, group: e.target.value })}
                                                    className="w-full h-10 px-3 border-white/10 bg-black/20 text-white focus:border-accent-gold"
                                                >
                                                    <option value="NONE">NONE</option>
                                                    <option value="AGNI">AGNI</option>
                                                    <option value="ASTRA">ASTRA</option>
                                                    <option value="VAJRA">VAJRA</option>
                                                    <option value="RUDRA">RUDRA</option>
                                                </select>
                                            </div>
                                            <div className="flex justify-end gap-3">
                                                <button type="submit" className="h-10 px-8 bg-accent-gold text-black font-bold text-xs uppercase tracking-widest hover:bg-white transition-colors">
                                                    {editingParticipant ? 'Update' : 'Add Person'}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

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
                                                            <div className="flex gap-1.5">
                                                                {participant.group && (
                                                                    <span className="px-1.5 py-0.5 bg-white/10 text-[9px] uppercase tracking-wider rounded-sm text-white/70">
                                                                        {participant.group}
                                                                    </span>
                                                                )}
                                                                {participant.groupNo && (
                                                                    <span className="px-1.5 py-0.5 bg-accent-gold/10 border border-accent-gold/20 text-[9px] uppercase tracking-wider rounded-sm text-accent-gold">
                                                                        G#{participant.groupNo}
                                                                    </span>
                                                                )}
                                                            </div>
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
                                                    <div className="flex justify-end gap-2 text-white/40">
                                                        <button
                                                            onClick={() => handleEditParticipant(participant)}
                                                            className="p-1 hover:text-accent-gold transition-colors"
                                                            title="Edit Person"
                                                        >
                                                            <span className="material-symbols-outlined text-[18px]">edit</span>
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteParticipant(participant.id)}
                                                            className="text-white/30 hover:text-accent-red transition-colors p-1"
                                                            title="Remove Participant"
                                                        >
                                                            <span className="material-symbols-outlined text-[18px]">delete</span>
                                                        </button>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </AnimatePresence>
                                </tbody>
                            </table>
                        </div>

                    </motion.div>
                )}

                {/* MEDIA VIEW */}
                {activeTab === 'media' && (
                    <motion.div key="media-view" variants={fadeUp} initial="hidden" animate="show" exit="exit" className="flex flex-col gap-12 pb-20">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                            <div>
                                <h1 className="text-3xl font-display font-medium text-white mb-2">Media Library</h1>
                                <p className="text-white/50 text-sm font-sans">Upload and manage visual assets for the festival.</p>
                            </div>

                            <input
                                type="file"
                                ref={mediaInputRef}
                                onChange={handleImgBBUpload}
                                className="hidden"
                                accept="image/*"
                                multiple
                            />
                            <input
                                type="file"
                                ref={freeMediaInputRef}
                                onChange={handleFreeImageUpload}
                                className="hidden"
                                accept="image/*"
                                multiple
                            />
                            <div className="flex flex-col gap-4">
                                <div className="flex flex-wrap gap-4">
                                    <button
                                        onClick={() => mediaInputRef.current?.click()}
                                        disabled={loading}
                                        className="group flex min-w-[180px] cursor-pointer items-center justify-center rounded-none border border-accent-gold h-12 px-8 bg-accent-gold text-black transition-all duration-300 text-xs font-bold tracking-[0.2em] uppercase hover:bg-white disabled:opacity-50"
                                    >
                                        <span className="material-symbols-outlined mr-3">
                                            {loading ? 'sync' : 'upload'}
                                        </span>
                                        {loading ? 'Uploading...' : 'Upload ImgBB'}
                                    </button>
                                    <button
                                        onClick={() => freeMediaInputRef.current?.click()}
                                        disabled={loading}
                                        className="group flex min-w-[180px] cursor-pointer items-center justify-center rounded-none border border-white/20 h-12 px-8 bg-white/5 text-white transition-all duration-300 text-xs font-bold tracking-[0.2em] uppercase hover:bg-white hover:text-black disabled:opacity-50"
                                    >
                                        <span className="material-symbols-outlined mr-3">
                                            {loading ? 'sync' : 'cloud_upload'}
                                        </span>
                                        {loading ? 'Uploading...' : 'Upload FreeImage'}
                                    </button>
                                </div>

                                {uploadProgress && (
                                    <div className="w-full space-y-2">
                                        <div className="flex justify-between items-center text-[10px] uppercase tracking-widest font-bold">
                                            <span className="text-accent-gold">Bulk Uploading...</span>
                                            <span className="text-white/40">{uploadProgress.current} / {uploadProgress.total}</span>
                                        </div>
                                        <div className="h-1 w-full bg-white/5 overflow-hidden">
                                            <motion.div
                                                className="h-full bg-accent-gold"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Last Uploaded Preview */}
                        <AnimatePresence>
                            {lastUploaded && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="p-8 bg-[#181611] border border-accent-gold/30 rounded-sm flex flex-col md:flex-row gap-8 items-center"
                                >
                                    <div className="size-48 relative overflow-hidden bg-black/40 border border-white/5">
                                        <img
                                            src={lastUploaded.url}
                                            alt="Newly uploaded"
                                            className="object-cover w-full h-full"
                                        />
                                    </div>
                                    <div className="flex-1 space-y-4">
                                        <div className="flex items-center gap-2 text-accent-gold">
                                            <span className="material-symbols-outlined">check_circle</span>
                                            <span className="font-bold uppercase tracking-widest text-xs">Upload Successful</span>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest">Public ID</p>
                                            <code className="block bg-black/60 p-2 text-accent-gold text-xs border border-white/10 select-all">
                                                {lastUploaded.publicId}
                                            </code>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest">Permanent URL</p>
                                            <input
                                                readOnly
                                                value={lastUploaded.url}
                                                className="w-full bg-black/60 p-2 text-white/70 text-xs border border-white/10 select-all"
                                            />
                                        </div>
                                        <p className="text-white/50 text-[11px] italic font-sans">
                                            Copy the Public ID above to use this image in the site code or Gallery items.
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setLastUploaded(null)}
                                        className="text-white/30 hover:text-white transition-colors"
                                    >
                                        <span className="material-symbols-outlined">close</span>
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Existing Media List */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between border-b border-white/5 pb-4">
                                <h2 className="text-xl font-display text-white uppercase tracking-widest">Asset Directory</h2>
                                <span className="px-3 py-1 bg-white/5 text-[10px] font-bold text-accent-gold border border-white/10 rounded-full">
                                    {media.length} Total Assets
                                </span>
                            </div>

                            <div className="overflow-x-auto overflow-y-auto max-h-[600px] custom-scrollbar">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-white/10 text-[10px] uppercase tracking-[0.2em] text-white/40 sticky top-0 bg-[#0a0a0a] z-30">
                                            <th className="px-6 py-4 font-bold">Preview</th>
                                            <th className="px-6 py-4 font-bold">Details</th>
                                            <th className="px-6 py-4 font-bold">Category</th>
                                            <th className="px-6 py-4 font-bold text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        <AnimatePresence mode='popLayout'>
                                            {media.map((asset) => (
                                                <motion.tr
                                                    key={asset.id}
                                                    layout
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                    className="hover:bg-white/5 transition-colors group"
                                                >
                                                    <td className="px-6 py-4">
                                                        <div className="size-16 relative overflow-hidden bg-black/40 border border-white/10 rounded-sm">
                                                            {(asset.url || asset.image?.startsWith('http')) ? (
                                                                <img
                                                                    src={asset.url || asset.image}
                                                                    alt={asset.title}
                                                                    className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
                                                                    onError={(e) => {
                                                                        (e.target as HTMLImageElement).src = 'https://res.cloudinary.com/ddx7vzskv/image/upload/v1/cld-sample-5';
                                                                    }}
                                                                />
                                                            ) : (
                                                                <img
                                                                    src={`https://res.cloudinary.com/ddx7vzskv/image/upload/c_fill,h_200,w_200/f_auto/q_auto/${asset.publicId || asset.image || 'cld-sample-5'}`}
                                                                    alt={asset.title}
                                                                    className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
                                                                    onError={(e) => {
                                                                        (e.target as HTMLImageElement).src = 'https://res.cloudinary.com/ddx7vzskv/image/upload/v1/cld-sample-5';
                                                                    }}
                                                                />
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col gap-1">
                                                            <span className="text-sm font-bold text-white tracking-wide">{asset.title}</span>
                                                            <span className="text-[10px] text-white/30 font-mono select-all truncate max-w-[200px]" title={asset.publicId}>
                                                                ID: {asset.publicId}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="px-2 py-0.5 bg-white/5 border border-white/10 text-[10px] text-white/50 uppercase tracking-wider">
                                                            {asset.category}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex justify-end gap-3">
                                                            <button
                                                                onClick={() => {
                                                                    navigator.clipboard.writeText(asset.publicId);
                                                                    alert("ID copied to clipboard!");
                                                                }}
                                                                className="text-white/20 hover:text-accent-gold transition-colors"
                                                                title="Copy Public ID"
                                                            >
                                                                <span className="material-symbols-outlined text-[18px]">content_copy</span>
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteMedia(asset.id)}
                                                                className="text-white/20 hover:text-accent-red transition-colors"
                                                                title="Delete Asset"
                                                            >
                                                                <span className="material-symbols-outlined text-[18px]">delete</span>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </motion.tr>
                                            ))}
                                        </AnimatePresence>
                                        {media.length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-20 text-center text-white/20 italic text-sm font-sans">
                                                    No assets found in the library. Upload some to get started.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[
                                { title: 'Fast Delivery', icon: 'speed', desc: 'Uploaded images are automatically optimized for fast delivery via global CDNs.' },
                                { title: 'High Availability', icon: 'cloud_done', desc: 'Your assets are hosted on reliable cloud infrastructure ensuring 24/7 access.' },
                                { title: 'Asset Security', icon: 'verified_user', desc: 'Images are stored safely with permanent links for your site and gallery.' }
                            ].map((tip, i) => (
                                <div key={i} className="p-6 border border-white/5 bg-white/5 rounded-sm">
                                    <span className="material-symbols-outlined text-accent-gold mb-4">{tip.icon}</span>
                                    <h3 className="text-white font-bold text-sm mb-2 uppercase tracking-wider">{tip.title}</h3>
                                    <p className="text-white/50 text-xs leading-relaxed font-sans">{tip.desc}</p>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* RECREATION VIEW */}
                {activeTab === 'recreation' && (
                    <motion.div key="recreation-view" variants={fadeUp} initial="hidden" animate="show" exit="exit" className="flex flex-col gap-8">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                            <div>
                                <h1 className="text-3xl font-display font-medium text-white mb-2">Photo Recreation Entries</h1>
                                <p className="text-white/50 text-sm font-sans">Manage and download submissions from the Photo Recreation portal.</p>
                            </div>
                            <div className="flex flex-wrap gap-4 items-center">
                                <input
                                    type="text"
                                    placeholder="Search entries..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="h-10 px-4 bg-[#181611] border border-white/20 text-white focus:border-accent-gold text-xs"
                                />
                            </div>
                        </div>

                        <div className="w-full overflow-x-auto border border-white/10 bg-[#181611]/50 mix-blend-screen backdrop-blur-sm">
                            <table className="w-full text-left text-sm text-white/80">
                                <thead className="bg-black/40 text-xs uppercase tracking-widest text-white/50 border-b border-white/10">
                                    <tr>
                                        <th className="px-6 py-4 font-bold">Preview</th>
                                        <th className="px-6 py-4 font-bold">Artist Info</th>
                                        <th className="px-6 py-4 font-bold">Entry Title</th>
                                        <th className="px-6 py-4 font-bold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    <AnimatePresence>
                                        {recreationMedia
                                            .filter(item =>
                                                (item.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                                                ((item as any).userName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                                                ((item as any).ktuId || '').toLowerCase().includes(searchQuery.toLowerCase())
                                            )
                                            .map((item) => (
                                                <motion.tr
                                                    key={item.id}
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                    className="hover:bg-white/5 transition-colors group"
                                                >
                                                    <td className="px-6 py-4 text-white">
                                                        <div className="size-16 relative overflow-hidden bg-black/40 border border-white/10 rounded-sm">
                                                            <img
                                                                src={item.url}
                                                                alt={item.title}
                                                                className="object-cover w-full h-full"
                                                                onError={(e) => {
                                                                    (e.target as HTMLImageElement).src = 'https://res.cloudinary.com/ddx7vzskv/image/upload/v1/cld-sample-5';
                                                                }}
                                                            />
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col">
                                                            <span className="font-medium text-white">{(item as any).userName || 'Anonymous'}</span>
                                                            <span className="text-[10px] text-accent-gold uppercase tracking-tighter">{(item as any).ktuId} • {(item as any).house}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-xs text-white/60">{item.title}</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex justify-end gap-3">
                                                            <button
                                                                onClick={() => handleDownload(item.url, item.title)}
                                                                className="text-white/20 hover:text-accent-gold transition-colors"
                                                                title="Download Full Quality"
                                                            >
                                                                <span className="material-symbols-outlined text-[18px]">download</span>
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteRecreationMedia(item.id)}
                                                                className="text-white/20 hover:text-accent-red transition-colors"
                                                                title="Delete Entry"
                                                            >
                                                                <span className="material-symbols-outlined text-[18px]">delete</span>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </motion.tr>
                                            ))}
                                        {recreationMedia.length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-12 text-center text-white/40 italic">No recreation entries yet.</td>
                                            </tr>
                                        )}
                                    </AnimatePresence>
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}

                {/* SPOT VIEW */}
                {activeTab === 'spot' && (
                    <motion.div key="spot-view" variants={fadeUp} initial="hidden" animate="show" exit="exit" className="flex flex-col gap-8">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                            <div>
                                <h1 className="text-3xl font-display font-medium text-white mb-2">Spot Photography Entries</h1>
                                <p className="text-white/50 text-sm font-sans">Manage and download submissions from the Spot Photography event.</p>
                            </div>
                            <div className="flex flex-wrap gap-4 items-center">
                                <input
                                    type="text"
                                    placeholder="Search entries..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="h-10 px-4 bg-[#181611] border border-white/20 text-white focus:border-accent-gold text-xs"
                                />
                            </div>
                        </div>

                        <div className="w-full overflow-x-auto border border-white/10 bg-[#181611]/50 mix-blend-screen backdrop-blur-sm">
                            <table className="w-full text-left text-sm text-white/80">
                                <thead className="bg-black/40 text-xs uppercase tracking-widest text-white/50 border-b border-white/10">
                                    <tr>
                                        <th className="px-6 py-4 font-bold">Preview</th>
                                        <th className="px-6 py-4 font-bold">Artist Info</th>
                                        <th className="px-6 py-4 font-bold">Entry Title</th>
                                        <th className="px-6 py-4 font-bold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    <AnimatePresence>
                                        {spotMedia
                                            .filter(item =>
                                                (item.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                                                ((item as any).userName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                                                ((item as any).ktuId || '').toLowerCase().includes(searchQuery.toLowerCase())
                                            )
                                            .map((item) => (
                                                <motion.tr
                                                    key={item.id}
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                    className="hover:bg-white/5 transition-colors group"
                                                >
                                                    <td className="px-6 py-4 text-white">
                                                        <div className="size-16 relative overflow-hidden bg-black/40 border border-white/10 rounded-sm">
                                                            <img
                                                                src={item.url}
                                                                alt={item.title}
                                                                className="object-cover w-full h-full"
                                                                onError={(e) => {
                                                                    (e.target as HTMLImageElement).src = 'https://res.cloudinary.com/ddx7vzskv/image/upload/v1/cld-sample-5';
                                                                }}
                                                            />
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col">
                                                            <span className="font-medium text-white">{(item as any).userName || 'Anonymous'}</span>
                                                            <span className="text-[10px] text-accent-gold uppercase tracking-tighter">{(item as any).ktuId} • {(item as any).house}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-xs text-white/60">{item.title}</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex justify-end gap-3">
                                                            <button
                                                                onClick={() => handleDownload(item.url, item.title)}
                                                                className="text-white/20 hover:text-accent-gold transition-colors"
                                                                title="Download Full Quality"
                                                            >
                                                                <span className="material-symbols-outlined text-[18px]">download</span>
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteSpotMedia(item.id)}
                                                                className="text-white/20 hover:text-accent-red transition-colors"
                                                                title="Delete Entry"
                                                            >
                                                                <span className="material-symbols-outlined text-[18px]">delete</span>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </motion.tr>
                                            ))}
                                        {spotMedia.length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-12 text-center text-white/40 italic">No spot photography entries yet.</td>
                                            </tr>
                                        )}
                                    </AnimatePresence>
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}

                {/* RESULTS VIEW */}
                {activeTab === 'results' && (
                    <motion.div key="results-view" variants={fadeUp} initial="hidden" animate="show" exit="exit" className="flex flex-col gap-12">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                            <div>
                                <h1 className="text-3xl font-display font-medium text-white mb-2">Scoreboard Center</h1>
                                <p className="text-white/50 text-sm font-sans">Configure points and manage house standings.</p>
                            </div>
                            <div className="flex gap-4">
                                <button
                                    onClick={recalculateAllScores}
                                    disabled={loading}
                                    className="h-10 px-6 bg-white/5 border border-white/20 text-white font-bold text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2"
                                >
                                    <span className={`material-symbols-outlined text-[16px] ${loading ? 'animate-spin' : ''}`}>sync</span>
                                    Recalculate Scores
                                </button>
                                {houses.length === 0 && (
                                    <button
                                        onClick={seedHouses}
                                        className="h-10 px-6 bg-accent-gold text-black font-bold text-xs uppercase tracking-widest hover:bg-white transition-all"
                                    >
                                        Initialize Houses
                                    </button>
                                )}
                                {sportsHouses.length === 0 && (
                                    <button
                                        onClick={async () => {
                                            setLoading(true);
                                            try {
                                                const housesToSeed = [
                                                    { id: 'AGNI', name: 'AGNI', points: 0 },
                                                    { id: 'ASTRA', name: 'ASTRA', points: 0 },
                                                    { id: 'VAJRA', name: 'VAJRA', points: 0 },
                                                    { id: 'RUDRA', name: 'RUDRA', points: 0 }
                                                ];
                                                for (const house of housesToSeed) {
                                                    const { setDoc } = await import('firebase/firestore');
                                                    await setDoc(doc(db, 'sports_houses', house.id), house);
                                                }
                                                alert("Sports Houses initialized successfully!");
                                            } catch (error) {
                                                console.error("Error seeding sports houses:", error);
                                                alert("Failed to initialize sports houses.");
                                            }
                                            setLoading(false);
                                        }}
                                        className="h-10 px-4 bg-white/10 text-white font-bold text-[10px] uppercase tracking-widest hover:bg-white/20 transition-all border border-white/20"
                                    >
                                        Init Sports
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                            {/* Configuration Column */}
                            <div className="lg:col-span-1 space-y-6">
                                {/* Quick Participant Search & House Assignment */}
                                <div className="p-4 bg-accent-gold/5 border border-accent-gold/20 space-y-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="material-symbols-outlined text-accent-gold text-lg">person_search</span>
                                        <h3 className="text-sm font-bold text-accent-gold uppercase tracking-widest">Quick House Assignment</h3>
                                    </div>
                                    <div className="space-y-2">
                                        <input
                                            type="text"
                                            placeholder="Search participant name..."
                                            value={quickSearchQuery}
                                            onChange={(e) => setQuickSearchQuery(e.target.value)}
                                            className="w-full h-8 bg-black/40 border border-white/10 px-3 text-[11px] text-white focus:border-accent-gold outline-none placeholder:text-white/20"
                                        />
                                        {quickSearchQuery.length >= 2 && (
                                            <div className="max-h-80 overflow-y-auto custom-scrollbar border border-white/10 divide-y divide-white/5 bg-black/40">
                                                {/* Existing Participants */}
                                                {participants
                                                    .filter(p => (p.name || '').toLowerCase().includes(quickSearchQuery.toLowerCase()))
                                                    .slice(0, 10)
                                                    .map(p => (
                                                        <div key={p.id} className="p-2 space-y-1 bg-white/5">
                                                            <div className="flex justify-between items-start text-[9px]">
                                                                <span className="font-bold text-white truncate">{p.name}</span>
                                                                <span className="text-white/40 uppercase">{p.universityCode || 'NO CODE'}</span>
                                                            </div>
                                                            <select 
                                                                value={p.group}
                                                                onChange={(e) => updateParticipantGroup(p.id, e.target.value)}
                                                                className="w-full h-7 bg-accent-gold/10 border border-accent-gold/20 text-[9px] text-accent-gold outline-none cursor-pointer hover:bg-accent-gold/20 transition-colors px-1"
                                                            >
                                                                <option value="AGNI">AGNI</option>
                                                                <option value="ASTRA">ASTRA</option>
                                                                <option value="VAJRA">VAJRA</option>
                                                                <option value="RUDRA">RUDRA</option>
                                                                <option value="NONE">NONE</option>
                                                            </select>
                                                        </div>
                                                    ))}

                                                {/* Quick Add Option */}
                                                <div className="p-3 bg-accent-gold/10 border-t border-accent-gold/20 space-y-2">
                                                    <div className="flex items-center gap-2 text-[9px] text-accent-gold font-bold uppercase tracking-widest">
                                                        <span className="material-symbols-outlined text-[12px]">person_add</span>
                                                        Quick Add New
                                                    </div>
                                                    <p className="text-[10px] text-white font-medium truncate">&quot;{quickSearchQuery}&quot;</p>
                                                    <div className="flex gap-1">
                                                        <select 
                                                            value={quickAddHouse}
                                                            onChange={(e) => setQuickAddHouse(e.target.value)}
                                                            className="flex-1 h-7 bg-black/40 border border-white/10 text-[9px] text-white outline-none px-1"
                                                        >
                                                            <option value="AGNI">AGNI</option>
                                                            <option value="ASTRA">ASTRA</option>
                                                            <option value="VAJRA">VAJRA</option>
                                                            <option value="RUDRA">RUDRA</option>
                                                            <option value="NONE">NONE</option>
                                                        </select>
                                                        <button 
                                                            onClick={async () => {
                                                                try {
                                                                    await addDoc(collection(db, 'participants'), {
                                                                        name: quickSearchQuery,
                                                                        group: quickAddHouse,
                                                                        universityCode: 'QUICK-ADD',
                                                                        events: [],
                                                                        timestamp: new Date().toISOString()
                                                                    });
                                                                    setQuickSearchQuery('');
                                                                    setQuickAddHouse('NONE');
                                                                } catch (err) {
                                                                    console.error("Quick add failed:", err);
                                                                }
                                                            }}
                                                            className="h-7 px-3 bg-accent-gold text-black text-[9px] font-bold uppercase transition-colors hover:bg-white"
                                                        >
                                                            Add
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Scoring Rules */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                                        <span className="material-symbols-outlined text-accent-gold">settings_suggest</span>
                                        <h2 className="text-xl font-display text-white uppercase tracking-widest">Point Rules</h2>
                                    </div>
                                    <div className="space-y-8">
                                        {(['individual', 'group'] as const).map((type) => (
                                            <div key={type} className="space-y-4">
                                                <h3 className="text-xs font-bold text-white/40 uppercase tracking-[0.2em]">{type} Events</h3>
                                                <div className="grid grid-cols-3 gap-4">
                                                    {(['first', 'second', 'third'] as const).map((place) => (
                                                        <div key={place} className="space-y-1">
                                                            <label className="text-[9px] text-white/30 uppercase tracking-widest font-bold">
                                                                {place === 'first' ? '1st' : place === 'second' ? '2nd' : '3rd'}
                                                            </label>
                                                            <input
                                                                type="number"
                                                                value={scoringRules[type][place]}
                                                                onChange={(e) => {
                                                                    const val = parseInt(e.target.value) || 0;
                                                                    const newRules = { ...scoringRules };
                                                                    newRules[type][place] = val;
                                                                    setScoringRules(newRules);
                                                                }}
                                                                onBlur={() => updateScoringRules(scoringRules)}
                                                                className="w-full h-8 bg-[#181611] border border-white/10 px-3 text-xs text-white focus:border-accent-gold outline-none"
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Standings Column */}
                            <div className="lg:col-span-1 space-y-8">
                                {/* Cultural House Standings */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                                        <span className="material-symbols-outlined text-accent-gold">leaderboard</span>
                                        <h2 className="text-xl font-display text-white uppercase tracking-widest">Cultural Standings</h2>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {[...houses].sort((a, b) => b.points - a.points).map((house) => (
                                            <div key={house.id} className="p-4 bg-[#181611] border border-white/10 flex flex-col gap-3">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm font-bold text-white tracking-widest">{house.name}</span>
                                                    <span className="text-xs text-accent-gold font-mono">{house.points} PTS</span>
                                                </div>
                                                <input
                                                    type="number"
                                                    value={house.points}
                                                    onChange={(e) => {
                                                        const val = parseInt(e.target.value) || 0;
                                                        const newHouses = houses.map(h => h.id === house.id ? { ...h, points: val } : h);
                                                        setHouses(newHouses);
                                                    }}
                                                    onBlur={(e) => updateHousePoints(house.id, parseInt(e.target.value) || 0)}
                                                    className="w-full h-8 bg-black/40 border border-white/10 px-3 text-xs text-white focus:border-accent-gold outline-none"
                                                    placeholder="Manual Update"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Sports House Standings */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                                        <span className="material-symbols-outlined text-accent-gold">directions_run</span>
                                        <h2 className="text-xl font-display text-white uppercase tracking-widest">Sports Standings</h2>
                                    </div>
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                        {[...sportsHouses].sort((a, b) => b.points - a.points).map((house) => (
                                            <div key={`sports-${house.id}`} className="p-4 bg-[#181611] border border-white/10 flex flex-col items-center justify-center gap-3 text-center">
                                                <span className="text-sm font-bold text-white tracking-widest">{house.name}</span>
                                                <input
                                                    type="number"
                                                    value={house.points}
                                                    onChange={(e) => {
                                                        const val = parseInt(e.target.value) || 0;
                                                        const newHouses = sportsHouses.map(h => h.id === house.id ? { ...h, points: val } : h);
                                                        setSportsHouses(newHouses);
                                                    }}
                                                    onBlur={(e) => updateSportsHousePoints(house.id, parseInt(e.target.value) || 0)}
                                                    className="w-full h-12 bg-black/40 border-2 border-white/10 text-2xl font-display text-accent-gold text-center focus:border-accent-gold outline-none rounded-sm transition-colors"
                                                    placeholder="0"
                                                />
                                                <span className="text-[9px] text-white/40 uppercase tracking-widest font-bold">Points</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Combined Standings Summary */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                                        <span className="material-symbols-outlined text-accent-gold">public</span>
                                        <h2 className="text-xl font-display text-white uppercase tracking-widest">Combined Standings</h2>
                                    </div>
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                        {Array.from(
                                            (() => {
                                                const map = new Map<string, House>();
                                                houses.forEach(h => {
                                                    if (!h || !h.name) return;
                                                    map.set(String(h.name).toLowerCase(), { ...h, points: Number(h.points) || 0 });
                                                });
                                                sportsHouses.forEach(sh => {
                                                    if (!sh || !sh.name) return;
                                                    const key = String(sh.name).toLowerCase();
                                                    if (map.has(key)) map.get(key)!.points += (Number(sh.points) || 0);
                                                    else map.set(key, { ...sh, name: String(sh.name).charAt(0).toUpperCase() + String(sh.name).slice(1).toLowerCase(), id: key, points: Number(sh.points) || 0 });
                                                });
                                                return map.values();
                                            })()
                                        ).sort((a, b) => b.points - a.points).map((house) => (
                                            <div key={`combined-${house.id}`} className="p-4 bg-accent-gold/5 border border-accent-gold/20 flex flex-col items-center justify-center gap-2 text-center">
                                                <span className="text-sm font-bold text-white tracking-widest">{house.name}</span>
                                                <span className="text-3xl font-display text-accent-gold">{house.points}</span>
                                                <span className="text-[9px] text-white/40 uppercase tracking-widest font-bold">Total</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Winners Management */}
                            <div className="lg:col-span-2 space-y-6">
                                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                                    <div className="flex items-center gap-3">
                                        <span className="material-symbols-outlined text-accent-gold">workspace_premium</span>
                                        <h2 className="text-xl font-display text-white uppercase tracking-widest">Event Winners</h2>
                                    </div>
                                    <button
                                        onClick={exportWinnersToExcel}
                                        className="h-8 px-4 bg-accent-gold text-black font-bold text-[10px] uppercase tracking-widest hover:bg-white transition-all flex items-center gap-2 rounded-sm"
                                    >
                                        <span className="material-symbols-outlined text-[14px]">download</span>
                                        Export
                                    </button>
                                </div>
                                <div className="flex flex-col gap-4 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
                                    {events.sort((a, b) => a.title.localeCompare(b.title)).map((event) => {
                                        const eventParticipants = participants.filter(p => p.events?.includes(event.title));
                                        return (
                                            <div key={event.id} className="p-4 bg-[#181611] border border-white/10 space-y-4">
                                                <h3 className="text-sm font-bold text-accent-gold tracking-wide">{event.title}</h3>
                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">                                                    {(['first', 'second', 'third'] as const).map((place) => {
                                                        const rawW = event.winners?.[place];
                                                        const winnerIds = Array.isArray(rawW) ? rawW : (rawW ? [rawW] : []);
                                                        return (
                                                            <div key={place} className="space-y-2">
                                                                <label className="text-[9px] uppercase tracking-widest text-white/40 font-bold block">
                                                                    {place === 'first' ? '🥇 1st' : place === 'second' ? '🥈 2nd' : '🥉 3rd'}
                                                                </label>
                                                                <div className="flex flex-col gap-2">
                                                                    {winnerIds.map(wid => {
                                                                        const p = participants.find(part => part.id === wid);
                                                                        return (
                                                                            <div key={wid} className="flex items-center justify-between bg-black/60 px-2 py-1 border border-accent-gold/20 rounded-sm">
                                                                                <span className="text-[9px] text-white truncate max-w-[100px]">
                                                                                    {p?.name || 'Unknown'}
                                                                                    {p?.groupNo && <span className="text-accent-gold ml-1 text-[8px]">({p.groupNo})</span>}
                                                                                </span>
                                                                                <div className="flex items-center gap-2">
                                                                                    <button
                                                                                        onClick={() => handleEditParticipant(p as Participant)}
                                                                                        className="text-white/30 hover:text-accent-gold transition-colors"
                                                                                        title="Edit Details"
                                                                                    >
                                                                                        <span className="material-symbols-outlined text-[14px]">edit_note</span>
                                                                                    </button>
                                                                                    <button
                                                                                        onClick={() => updateEventWinner(event.id, place, wid, true)}
                                                                                        className="text-accent-red hover:text-white transition-colors"
                                                                                    >
                                                                                        <span className="material-symbols-outlined text-[14px]">close</span>
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                    <div className="relative">
                                                                        <input
                                                                            type="text"
                                                                            value={activeSearch?.eventId === event.id && activeSearch?.place === place ? winnerSearchQuery : ''}
                                                                            placeholder="Search or select..."
                                                                            onFocus={() => {
                                                                                setActiveSearch({ eventId: event.id, place });
                                                                                setWinnerSearchQuery('');
                                                                            }}
                                                                            onChange={(e) => setWinnerSearchQuery(e.target.value)}
                                                                            className="w-full h-8 bg-black/40 border border-white/10 px-2 text-[10px] text-white focus:border-accent-gold outline-none placeholder:text-white/20"
                                                                        />
                                                                        {activeSearch?.eventId === event.id && activeSearch?.place === place && (
                                                                            <motion.div
                                                                                initial={{ opacity: 0, y: 5 }}
                                                                                animate={{ opacity: 1, y: 0 }}
                                                                                className="absolute z-50 top-full left-0 right-0 mt-1 bg-[#181611] border border-white/20 shadow-2xl max-h-40 overflow-y-auto custom-scrollbar"
                                                                            >
                                                                                {eventParticipants
                                                                                    .filter(pic => !winnerIds.includes(pic.id))
                                                                                    .filter(pic =>
                                                                                        (pic.name || '').toLowerCase().includes(winnerSearchQuery.toLowerCase()) ||
                                                                                        (pic.universityCode || '').toLowerCase().includes(winnerSearchQuery.toLowerCase()) ||
                                                                                        (pic.groupNo || '').toLowerCase().includes(winnerSearchQuery.toLowerCase())
                                                                                    )
                                                                                    .map(pic => (
                                                                                        <button
                                                                                            key={pic.id}
                                                                                            onClick={() => {
                                                                                                updateEventWinner(event.id, place, pic.id);
                                                                                                setActiveSearch(null);
                                                                                                setWinnerSearchQuery('');
                                                                                            }}
                                                                                            className="w-full text-left px-3 py-2 text-[10px] hover:bg-accent-gold hover:text-black transition-colors border-b border-white/5 flex flex-col gap-0.5"
                                                                                        >
                                                                                            <span className="font-bold">{pic.name}</span>
                                                                                            <span className="text-[8px] opacity-70">
                                                                                                {pic.universityCode} {pic.groupNo ? `• G# ${pic.groupNo}` : `• ${pic.group}`}
                                                                                            </span>
                                                                                        </button>
                                                                                    ))}
                                                                                {eventParticipants.filter(pic => !winnerIds.includes(pic.id)).length === 0 && (
                                                                                    <div className="px-3 py-4 text-center text-white/40 italic text-[9px]">No participants found.</div>
                                                                                )}

                                                                                {/* Quick Add Option inside Event Winner Dropdown */}
                                                                                {winnerSearchQuery.length >= 2 && (
                                                                                    <div className="p-2 bg-accent-gold/10 border-t border-accent-gold/20 space-y-1">
                                                                                        <div className="text-[8px] text-accent-gold font-bold uppercase tracking-widest flex items-center gap-1 mb-1">
                                                                                            <span className="material-symbols-outlined text-[10px]">person_add</span> Quick Add
                                                                                        </div>
                                                                                        <p className="text-[9px] text-white font-medium truncate mb-1">&quot;{winnerSearchQuery}&quot;</p>
                                                                                        <div className="flex gap-1">
                                                                                            <select 
                                                                                                value={quickAddHouse}
                                                                                                onChange={(e) => setQuickAddHouse(e.target.value)}
                                                                                                className="flex-1 h-6 bg-black/40 border border-white/10 text-[8px] text-white outline-none px-1"
                                                                                            >
                                                                                                <option value="AGNI">AGNI</option>
                                                                                                <option value="ASTRA">ASTRA</option>
                                                                                                <option value="VAJRA">VAJRA</option>
                                                                                                <option value="RUDRA">RUDRA</option>
                                                                                                <option value="NONE">NONE</option>
                                                                                            </select>
                                                                                            <button 
                                                                                                onClick={async (e) => {
                                                                                                    e.preventDefault();
                                                                                                    try {
                                                                                                        // 1. Create the new participant
                                                                                                        const newDocRef = await addDoc(collection(db, 'participants'), {
                                                                                                            name: winnerSearchQuery,
                                                                                                            group: quickAddHouse,
                                                                                                            universityCode: 'QUICK-ADD',
                                                                                                            events: [event.title], // Register them for this event automatically
                                                                                                            timestamp: new Date().toISOString()
                                                                                                        });
                                                                                                        
                                                                                                        // 2. Assign them as the winner
                                                                                                        updateEventWinner(event.id, place, newDocRef.id);
                                                                                                        
                                                                                                        // 3. Reset state
                                                                                                        setActiveSearch(null);
                                                                                                        setWinnerSearchQuery('');
                                                                                                        setQuickAddHouse('NONE');
                                                                                                    } catch (err) {
                                                                                                        console.error("Quick add winner failed:", err);
                                                                                                    }
                                                                                                }}
                                                                                                className="h-6 px-2 bg-accent-gold text-black text-[8px] font-bold uppercase transition-colors hover:bg-white"
                                                                                            >
                                                                                                Assign
                                                                                            </button>
                                                                                        </div>
                                                                                    </div>
                                                                                )}
                                                                            </motion.div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
