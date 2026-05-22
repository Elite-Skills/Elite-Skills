/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './App.tsx',
    './LandingPage.tsx',
    './index.tsx',
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './state/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'elite-black': '#0a0a0a',
        'elite-gray': '#1a1a1a',
        'elite-gold': '#D4AF37',
        'elite-gold-dim': '#AA8C2C',
        'elite-white': '#F5F5F5',
        'elite-text-muted': '#A3A3A3',
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'serif'],
        sans: ['"Inter"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
