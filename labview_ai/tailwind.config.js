/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class', // <--- INI WAJIB ADA
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: '#0052CC',
            },
            boxShadow: {
                'antigravity': '0 20px 40px -10px rgba(0, 82, 204, 0.15), 0 10px 20px -5px rgba(0, 82, 204, 0.1)',
            },
            blur: {
                '25': '25px',
            },
            animation: {
                'spring': 'spring 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
            },
            keyframes: {
                spring: {
                    '0%': { transform: 'scale(0.95)', opacity: 0 },
                    '100%': { transform: 'scale(1)', opacity: 1 },
                }
            }
        },
    },
    plugins: [],
}