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
        sandeq: {
          'biru-laut': '#1A4A7A',
          'biru-langit': '#2E86C1',
          'putih-ombak': '#F4F9FF',
          'oranye-matahari': '#E67E22',
          'oranye-senja': '#F39C12',
          'abu-karang': '#7F8C8D',
          'hijau-mangrove': '#27AE60',
          'merah-terumbu': '#E74C3C',
        },
      },
      fontFamily: {
        sans: ['var(--font-poppins)', 'var(--font-inter)', 'system-ui', 'sans-serif'],
        heading: ['var(--font-poppins)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};