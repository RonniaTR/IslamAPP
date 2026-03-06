/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#10b981', light: '#34d399', dark: '#059669' },
        surface: { DEFAULT: '#111827', light: '#1f2937', lighter: '#374151' },
        accent: { DEFAULT: '#f59e0b', light: '#fbbf24' },
        gold: '#d4a373',
      },
      fontFamily: {
        arabic: ['Amiri', 'serif'],
        sans: ['Noto Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
};