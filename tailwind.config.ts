import type { Config } from "tailwindcss";

export default {
    darkMode: "class",
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                "primary": "#C6A664",
                "primary-dark": "#A11217",
                "background-light": "#f8f7f6",
                "background-dark": "#121212",
                "surface-dark": "#181611",
                "accent-gold": "#C6A664",
                "accent-red": "#A11217",
            },
            fontFamily: {
                "display": ["var(--font-display)", "serif"],
                "sans": ["var(--font-sans)", "sans-serif"],
            },
            borderRadius: {
                "DEFAULT": "0.125rem",
                "lg": "0.25rem",
                "xl": "0.5rem",
                "full": "0.75rem"
            },
        },
    },
    plugins: [
        require('@tailwindcss/forms'),
        require('@tailwindcss/container-queries'),
    ],
} satisfies Config;
