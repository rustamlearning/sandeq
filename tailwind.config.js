// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#1A4A7A',
          dark:    '#0A2D52',
          mid:     '#1464A8',
          light:   '#E8F1FB',
        },
        sandeq: {
          'biru-laut':       '#1A4A7A',
          'biru-langit':     '#2E86C1',
          'putih-ombak':     '#F4F9FF',
          'oranye-matahari': '#E67E22',
          'oranye-senja':    '#F39C12',
          'abu-karang':      '#7F8C8D',
          'hijau-mangrove':  '#27AE60',
          'merah-terumbu':   '#E74C3C',
        },
      },
      fontFamily: {
        sans:    ['var(--font-jakarta)', 'var(--font-inter)', 'system-ui', 'sans-serif'],
        heading: ['var(--font-jakarta)', 'var(--font-poppins)', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'slide-up': {
          '0%':   { transform: 'translateY(16px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',    opacity: '1' },
        },
        'fade-in': {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        'slide-up': 'slide-up 0.22s ease-out',
        'fade-in':  'fade-in 0.2s ease-out',
      },
    },
  },
  plugins: [],
};
