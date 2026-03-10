import { Easing, Variants } from 'framer-motion';

// --- Easings ---
export const luxuryEase: Easing = [0.22, 1, 0.36, 1];
export const softEase: Easing = [0.43, 0.13, 0.23, 0.96];
export const sharpEase: Easing = [0.6, 0.01, 0.05, 0.95];

// --- Variants ---

export const fadeUp: Variants = {
    hidden: { y: 20, opacity: 0 },
    show: (custom?: number) => ({
        y: 0,
        opacity: 1,
        transition: {
            duration: 0.8,
            ease: luxuryEase,
            delay: custom || 0
        }
    }),
    exit: { y: -20, opacity: 0, transition: { duration: 0.4, ease: sharpEase } }
};

export const fadeScale: Variants = {
    hidden: { scale: 0.95, opacity: 0 },
    show: { scale: 1, opacity: 1, transition: { duration: 0.8, ease: luxuryEase } },
    exit: { scale: 1.05, opacity: 0, transition: { duration: 0.4, ease: sharpEase } }
};

export const blurReveal: Variants = {
    hidden: { filter: "blur(12px)", opacity: 0, y: 10 },
    show: { filter: "blur(0px)", opacity: 1, y: 0, transition: { duration: 1, ease: luxuryEase } },
    exit: { filter: "blur(4px)", opacity: 0, transition: { duration: 0.3 } }
};

export const getStaggerContainer = (delay: number = 0, stagger: number = 0.1) => ({
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: stagger,
            delayChildren: delay,
        }
    },
    exit: { opacity: 0, transition: { staggerChildren: 0.05, staggerDirection: -1 } }
});

export const navReveal: Variants = {
    hidden: { y: -20, opacity: 0, filter: "blur(4px)" },
    show: {
        y: 0,
        opacity: 1,
        filter: "blur(0px)",
        transition: { duration: 0.8, ease: luxuryEase }
    }
};

export const headingLine: Variants = {
    hidden: { y: 60, opacity: 0, filter: "blur(8px)" },
    show: {
        y: 0,
        opacity: 1,
        filter: "blur(0px)",
        transition: { duration: 1.0, ease: luxuryEase }
    }
};

export const routeTransition: Variants = {
    initial: {
        opacity: 0,
        y: 8,
        filter: "blur(10px)",
    },
    animate: {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        transition: {
            duration: 0.6,
            ease: luxuryEase,
        }
    },
    exit: {
        opacity: 0,
        y: -20,
        filter: "blur(12px)",
        transition: {
            duration: 0.4,
            ease: sharpEase,
        }
    }
};
