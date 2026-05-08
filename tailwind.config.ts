/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        lumiere: {
          gold: "#c49a2b",
          "gold-dark": "#8b6914",
          cream: "#faf8f3",
        },
        kds: {
          bg: '#18181b', // zinc-950
          card: '#27272a', // zinc-800
          border: '#3f3f46', // zinc-700
          gold: '#e5c04a', // warm gold (LUMIÈRE KDS accent)
          greenBg: 'rgba(34, 197, 94, 0.2)', // green-500 with opacity
          greenText: '#4ade80', // green-400
          blueBg: 'rgba(59, 130, 246, 0.2)',
          blueText: '#60a5fa',
          redBg: 'rgba(239, 68, 68, 0.2)',
          redText: '#f87171',
        }
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', '"Playfair Display"', 'Georgia', 'serif'],
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"DM Sans"', '"Inter"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
};
