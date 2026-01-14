/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/react-app/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sac: {
          gold: '#b58d2b',
          yellow: '#f3cf13',
          green: '#9ba96f',
          black: '#000000',
        }
      }
    },
  },
  plugins: [],
};
