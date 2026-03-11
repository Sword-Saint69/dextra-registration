"use client";

import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useState, useRef } from 'react';

interface UploadButtonProps {
    category: string;
    collectionName: 'media' | 'recreation_media';
    showMetadataForm?: boolean;
}

export default function UploadButton({ category, collectionName, showMetadataForm = false }: UploadButtonProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [uploadedUrl, setUploadedUrl] = useState('');
    const [tempFileName, setTempFileName] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        ktuId: '',
        house: ''
    });
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // 4MB limit for proxy route to avoid 413 Payload Too Large
        if (file.size > 4 * 1024 * 1024) {
            alert('File is too large for FreeImage (max 4MB). Please use the main Media Library and "Upload ImgBB" for larger files.');
            return;
        }

        setIsUploading(true);
        try {
            const uploadFormData = new FormData();
            uploadFormData.append('source', file);
            uploadFormData.append('action', 'upload');
            uploadFormData.append('format', 'json');

            const response = await fetch('/api/upload/freeimage', {
                method: 'POST',
                body: uploadFormData
            });

            if (!response.ok) {
                const text = await response.text();
                console.error(`FreeImage Proxy Error (${response.status}):`, text);
                throw new Error(`Upload failed with status ${response.status}. The file might be too large.`);
            }

            const data = await response.json();

            if (data.status_code === 200 && data.image) {
                if (showMetadataForm) {
                    setUploadedUrl(data.image.url);
                    setTempFileName(file.name.split('.')[0]);
                    setShowForm(true);
                } else {
                    await addDoc(collection(db, collectionName), {
                        url: data.image.url,
                        category: category,
                        title: file.name.split('.')[0] || 'Uploaded Image',
                        timestamp: serverTimestamp(),
                        size: 'square'
                    });
                }
            } else {
                throw new Error(data.error?.message || 'Upload failed');
            }
        } catch (error) {
            console.error('Error uploading to FreeImage:', error);
            alert(error instanceof Error ? error.message : 'Upload failed. Please try again.');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsUploading(true);
        try {
            await addDoc(collection(db, collectionName), {
                url: uploadedUrl,
                category: category,
                title: tempFileName || 'Uploaded Image',
                timestamp: serverTimestamp(),
                size: 'square',
                userName: formData.name,
                ktuId: formData.ktuId,
                house: formData.house
            });
            setShowForm(false);
            setFormData({ name: '', ktuId: '', house: '' });
        } catch (error) {
            console.error('Error saving metadata:', error);
            alert('Failed to save details. Please try again.');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="flex flex-col items-center gap-4">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
            />
            <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex items-center gap-2 px-6 py-3 bg-accent-gold text-background-dark font-bold rounded-full hover:shadow-[0_0_20px_rgba(198,166,100,0.4)] transition-all active:scale-95 disabled:opacity-50"
            >
                <span className="material-symbols-outlined">upload</span>
                {isUploading ? 'Uploading...' : 'Upload Photo'}
            </button>

            {/* Metadata Form Modal */}
            {showForm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-[#1a1a1a] border border-accent-gold/20 p-8 rounded-2xl max-w-md w-full shadow-2xl">
                        <h2 className="text-white text-2xl font-display font-medium mb-6 text-center">
                            Entry <span className="text-accent-gold italic">Details</span>
                        </h2>
                        <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
                            <div className="flex flex-col gap-1">
                                <label className="text-white/40 text-[10px] uppercase tracking-widest ml-1">Name</label>
                                <input
                                    required
                                    type="text"
                                    placeholder="Enter your name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-accent-gold/50 transition-colors"
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-white/40 text-[10px] uppercase tracking-widest ml-1">KTU ID</label>
                                <input
                                    required
                                    type="text"
                                    placeholder="Enter KTU ID"
                                    value={formData.ktuId}
                                    onChange={(e) => setFormData({ ...formData, ktuId: e.target.value })}
                                    className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-accent-gold/50 transition-colors"
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-white/40 text-[10px] uppercase tracking-widest ml-1">House</label>
                                <select
                                    required
                                    value={formData.house}
                                    onChange={(e) => setFormData({ ...formData, house: e.target.value })}
                                    className="bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-accent-gold/50 transition-colors"
                                >
                                    <option value="" disabled>Select House</option>
                                    <option value="Agni">Agni</option>
                                    <option value="Astra">Astra</option>
                                    <option value="Vajra">Vajra</option>
                                    <option value="Rudra">Rudra</option>
                                </select>
                            </div>
                            <button
                                type="submit"
                                disabled={isUploading}
                                className="mt-4 bg-accent-gold text-background-dark font-bold py-3 rounded-lg hover:shadow-[0_0_15px_rgba(198,166,100,0.4)] transition-all active:scale-95 disabled:opacity-50"
                            >
                                {isUploading ? 'Saving...' : 'Submit Entry'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
