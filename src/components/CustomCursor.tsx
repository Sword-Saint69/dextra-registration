"use client";

import React, { useState, useEffect, useRef } from 'react';

export default function CustomCursor() {
    const dotRef = useRef<HTMLDivElement>(null);
    const outlineRef = useRef<HTMLDivElement>(null);
    const [isHovering, setIsHovering] = useState(false);

    useEffect(() => {
        const moveCursor = (e: MouseEvent) => {
            const { clientX, clientY } = e;
            if (dotRef.current) {
                dotRef.current.style.left = `${clientX}px`;
                dotRef.current.style.top = `${clientY}px`;
            }
            if (outlineRef.current) {
                outlineRef.current.animate({
                    left: `${clientX}px`,
                    top: `${clientY}px`
                }, { duration: 500, fill: "forwards" });
            }
        };

        const handleHover = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (target.closest('button, a, .magnetic')) {
                setIsHovering(true);
            } else {
                setIsHovering(false);
            }
        };

        window.addEventListener('mousemove', moveCursor);
        window.addEventListener('mouseover', handleHover);
        return () => {
            window.removeEventListener('mousemove', moveCursor);
            window.removeEventListener('mouseover', handleHover);
        };
    }, []);

    return (
        <>
            <div
                ref={dotRef}
                className="cursor-dot -translate-x-1/2 -translate-y-1/2"
                style={{ transform: isHovering ? 'scale(2) translate(-25%, -25%)' : 'scale(1) translate(-50%, -50%)' }}
            ></div>
            <div
                ref={outlineRef}
                className="cursor-outline -translate-x-1/2 -translate-y-1/2 transition-transform duration-300"
                style={{ transform: isHovering ? 'scale(1.5) translate(-33%, -33%)' : 'scale(1) translate(-50%, -50%)' }}
            ></div>
        </>
    );
}
