"use client";

import { motion, AnimatePresence, Easing, Variants } from 'framer-motion';
import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import CustomCursor from '@/components/CustomCursor';
import Magnetic from '@/components/Magnetic';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, limit, startAfter, getDocs, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import UploadButton from '@/components/UploadButton';

// Custom Easing (Luxury Ease)
const luxuryEase: Easing = [0.22, 1, 0.36, 1];

// Animation Variants
const fadeUp: Variants = {
    hidden: { y: 20, opacity: 0 },
    show: {
        y: 0,
        opacity: 1,
        transition: { duration: 0.8, ease: luxuryEase }
    }
};

interface GalleryItem {
    id: string;
    category: string;
    title: string;
    size: string;
    image: string;
    userName?: string;
    ktuId?: string;
    house?: string;
}

export default function PhotoRecreationPage() {
    const [isReady, setIsReady] = useState(false);
    const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
    const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const ITEMS_PER_PAGE = 6;

    const handleDownload = async (url: string, title: string) => {
        try {
            const finalUrl = url.startsWith('http')
                ? url
                : `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/f_auto,q_auto/${url}`;

            const response = await fetch(finalUrl);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = `${title.replace(/\s+/g, '_')}_DEXTRA2026.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.error("Download failed:", error);
            const fallbackUrl = url.startsWith('http')
                ? url
                : `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/f_auto,q_auto/${url}`;
            window.open(fallbackUrl, '_blank');
        }
    };

    useEffect(() => {
        const hasRun = sessionStorage.getItem('dextra_loader_run');
        const delay = hasRun ? 100 : 3000;
        const timer = setTimeout(() => setIsReady(true), delay);

        // Fetch from recreation_media collection
        const q = query(
            collection(db, 'recreation_media'),
            orderBy('timestamp', 'desc'),
            limit(ITEMS_PER_PAGE)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const items: GalleryItem[] = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                const imageSource = data.url || data.publicId || data.image || 'cld-sample-5';
                items.push({
                    id: doc.id,
                    category: data.category || 'Recreation',
                    title: data.title || 'Untitled',
                    size: data.size || 'square',
                    image: imageSource,
                    userName: data.userName,
                    ktuId: data.ktuId,
                    house: data.house
                });
            });
            setGalleryItems(items);
            setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
            setHasMore(snapshot.docs.length === ITEMS_PER_PAGE);
        });

        return () => {
            clearTimeout(timer);
            unsubscribe();
        };
    }, []);

    const handleLoadMore = async () => {
        if (!lastDoc || loading) return;
        setLoading(true);

        const q = query(
            collection(db, 'recreation_media'),
            orderBy('timestamp', 'desc'),
            startAfter(lastDoc),
            limit(ITEMS_PER_PAGE)
        );
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
            const newItems: GalleryItem[] = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                const imageSource = data.url || data.publicId || data.image || 'cld-sample-5';
                newItems.push({
                    id: doc.id,
                    category: data.category || 'Recreation',
                    title: data.title || 'Untitled',
                    size: data.size || 'square',
                    image: imageSource,
                    userName: data.userName,
                    ktuId: data.ktuId,
                    house: data.house
                });
            });
            setGalleryItems(prev => [...prev, ...newItems]);
            setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
            setHasMore(snapshot.docs.length === ITEMS_PER_PAGE);
        } else {
            setHasMore(false);
        }
        setLoading(false);
    };

    return (
        <div className="bg-background-dark min-h-screen flex flex-col overflow-x-hidden text-slate-100 selection:bg-accent-gold/30">
            <CustomCursor />
            <Navbar />

            <motion.main
                initial={{ opacity: 0, y: 30 }}
                animate={isReady ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                transition={{ duration: 1, ease: luxuryEase, delay: 0.2 }}
                className="flex-1 relative"
            >
                <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
                    <div className="absolute inset-0 bg-gradient-to-br from-accent-red/5 via-transparent to-accent-gold/5"></div>
                </div>

                <section className="relative z-10 px-6 py-16 md:py-24 max-w-[1400px] mx-auto">
                    <motion.div
                        initial="hidden"
                        animate={isReady ? "show" : "hidden"}
                        variants={{
                            show: { transition: { staggerChildren: 0.1 } }
                        }}
                        className="text-center mb-16"
                    >
                        <motion.h1
                            variants={fadeUp}
                            className="text-white text-5xl md:text-7xl lg:text-8xl font-display font-medium mb-6"
                        >
                            Photo <span className="text-accent-gold italic">Recreation</span>
                        </motion.h1>
                        <motion.p
                            variants={fadeUp}
                            className="text-white/60 font-sans max-w-2xl mx-auto text-sm md:text-lg uppercase tracking-[0.3em] font-light mb-12"
                        >
                            Relive and Recreate the Magic
                        </motion.p>

                        <motion.div variants={fadeUp} className="flex justify-center">
                            <UploadButton category="Recreation" collectionName="recreation_media" showMetadataForm={true} />
                        </motion.div>
                    </motion.div>

                    {/* Grid */}
                    <motion.div
                        layout
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 auto-rows-[250px] gap-6"
                    >
                        <AnimatePresence mode='popLayout'>
                            {galleryItems.map((item) => (
                                <motion.div
                                    key={item.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
                                    animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                                    exit={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
                                    whileHover="hover"
                                    transition={{ duration: 0.6, ease: luxuryEase }}
                                    className={`relative group overflow-hidden cursor-pointer ${item.size === 'tall' ? 'row-span-2' :
                                        item.size === 'wide' ? 'md:col-span-2' : ''
                                        }`}
                                >
                                    <div className="absolute inset-0 bg-background-dark/20 group-hover:bg-transparent transition-colors duration-500 z-10" />
                                    <img
                                        src={item.image || 'https://res.cloudinary.com/ddx7vzskv/image/upload/v1/cld-sample-5'}
                                        alt={item.title}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = 'https://res.cloudinary.com/ddx7vzskv/image/upload/v1/cld-sample-5';
                                        }}
                                    />

                                    <motion.div
                                        variants={{
                                            initial: { opacity: 0 },
                                            hover: { opacity: 1 }
                                        }}
                                        transition={{ duration: 0.4 }}
                                        className="absolute inset-0 bg-gradient-to-t from-background-dark/95 via-background-dark/40 to-transparent flex flex-col justify-end p-8 z-20"
                                    >
                                        <div className="flex flex-col gap-1 mb-4">
                                            {item.userName && (
                                                <motion.div
                                                    variants={{
                                                        initial: { y: 10, opacity: 0 },
                                                        hover: { y: 0, opacity: 1 }
                                                    }}
                                                    className="flex items-center gap-2"
                                                >
                                                    <span className="text-[10px] text-accent-gold/60 uppercase tracking-widest font-bold">Artist:</span>
                                                    <span className="text-white text-sm font-medium">{item.userName}</span>
                                                </motion.div>
                                            )}
                                            {item.ktuId && (
                                                <motion.div
                                                    variants={{
                                                        initial: { y: 10, opacity: 0 },
                                                        hover: { y: 0, opacity: 1 }
                                                    }}
                                                    className="flex items-center gap-2"
                                                >
                                                    <span className="text-[10px] text-accent-gold/60 uppercase tracking-widest font-bold">KTU ID:</span>
                                                    <span className="text-white/80 text-xs">{item.ktuId}</span>
                                                </motion.div>
                                            )}
                                            {item.house && (
                                                <motion.div
                                                    variants={{
                                                        initial: { y: 10, opacity: 0 },
                                                        hover: { y: 0, opacity: 1 }
                                                    }}
                                                    className="flex items-center gap-2"
                                                >
                                                    <span className="text-[10px] text-accent-gold/60 uppercase tracking-widest font-bold">House:</span>
                                                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${item.house === 'Agni' ? 'border-accent-red text-accent-red' :
                                                            item.house === 'Astra' ? 'border-purple-400 text-purple-400' :
                                                                item.house === 'Vajra' ? 'border-blue-400 text-blue-400' :
                                                                    'border-orange-400 text-orange-400'
                                                        } font-bold uppercase`}>{item.house}</span>
                                                </motion.div>
                                            )}
                                        </div>

                                        <motion.h3
                                            variants={{
                                                initial: { y: 10, opacity: 0 },
                                                hover: { y: 0, opacity: 1 }
                                            }}
                                            className="text-white text-xl font-display italic"
                                        >
                                            {item.title}
                                        </motion.h3>

                                        <motion.div
                                            variants={{
                                                initial: { scale: 0, opacity: 0 },
                                                hover: { scale: 1, opacity: 1 }
                                            }}
                                            className="absolute top-8 right-8 flex gap-3"
                                        >
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDownload(item.image, item.title);
                                                }}
                                                className="size-10 rounded-full border border-accent-gold flex items-center justify-center bg-background-dark/80 hover:bg-accent-gold hover:text-background-dark transition-all duration-300"
                                                title="Download"
                                            >
                                                <span className="material-symbols-outlined text-lg">download</span>
                                            </button>
                                        </motion.div>
                                    </motion.div>
                                    <div className="absolute inset-0 border border-white/0 group-hover:border-accent-gold/30 transition-all duration-500 z-30 pointer-events-none" />
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </motion.div>

                    {galleryItems.length === 0 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="mt-20 text-center py-20 border border-dashed border-white/10"
                        >
                            <span className="material-symbols-outlined text-5xl text-white/10 mb-4">collections</span>
                            <p className="text-white/30 font-sans tracking-widest uppercase text-sm">No recreations yet. Be the first to share!</p>
                        </motion.div>
                    )}

                    {hasMore && galleryItems.length > 0 && (
                        <div className="mt-20 flex justify-center">
                            <Magnetic>
                                <button
                                    onClick={handleLoadMore}
                                    disabled={loading}
                                    className="group relative flex min-w-[240px] cursor-pointer items-center justify-center border border-accent-gold h-14 px-10 bg-transparent text-accent-gold hover:text-[#121212] transition-[color,background-color,border-color,box-shadow] duration-500 text-xs font-bold tracking-[0.3em] uppercase disabled:opacity-50 overflow-hidden"
                                >
                                    <span className="absolute inset-0 bg-accent-gold -translate-x-full transition-transform duration-500 ease-in-out group-hover:translate-x-0"></span>
                                    <span className="relative z-10">{loading ? 'Loading...' : 'Load More Recreations'}</span>
                                </button>
                            </Magnetic>
                        </div>
                    )}
                </section>
            </motion.main>

            <footer className="bg-[#0f0e0b] border-t border-white/10 px-6 py-16 relative z-10">
                <div className="container mx-auto max-w-[1200px] flex flex-col items-center">
                    <p className="text-white/40 text-[10px] uppercase tracking-widest leading-relaxed text-center">
                        &quot;Different Paths. One Celebration.&quot;<br />
                        © 2026 DEXTRA Arts Festival. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
}
