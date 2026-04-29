/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'algo-dark': '#0E0E0E',
        'algo-text': '#E6E6E6',
        'algo-accent': '#F1CB83',
        'algo-gray': '#1A1A1A',
        'algo-gray-light': '#2A2A2A',
      },
      fontFamily: {
        'chakra': ['Chakra Petch', 'monospace'],
      },
    },
  },
  plugins: [],
};