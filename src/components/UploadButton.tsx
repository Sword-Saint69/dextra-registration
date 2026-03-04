"use client";

import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useState, useRef } from 'react';

interface UploadButtonProps {
    category: string;
    collectionName: 'media' | 'recreation_media';
}

export default function UploadButton({ category, collectionName }: UploadButtonProps) {
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('source', file);
            formData.append('action', 'upload');
            formData.append('format', 'json');

            const response = await fetch('/api/upload/freeimage', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.status_code === 200 && data.image) {
                await addDoc(collection(db, collectionName), {
                    url: data.image.url,
                    category: category,
                    title: file.name.split('.')[0] || 'Uploaded Image',
                    timestamp: serverTimestamp(),
                    size: 'square'
                });
            } else {
                throw new Error(data.error?.message || 'Upload failed');
            }
        } catch (error) {
            console.error('Error uploading to FreeImage:', error);
            alert('Upload failed. Please try again.');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
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
        </div>
    );
}
