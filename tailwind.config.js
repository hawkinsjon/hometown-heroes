/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // USMC Dress Blues inspired colors
        marine: {
          blue: {
            900: '#0C1B33', // Darkest blue (almost black) - primary background
            800: '#152642',
            700: '#1D3151',
            600: '#253E61',
            500: '#2C4B70',
            400: '#34587F',
            300: '#3B658F',
            200: '#43729E',
            100: '#4A7FAD',
            50: '#528CBC'
          },
          red: {
            600: '#C90E0E', // Scarlet red from dress blues
            500: '#B30C0C'
          },
          gold: {
            500: '#B3A369', // Brass/gold for accents
            400: '#C4B67D'
          }
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'inner-md': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
      }
    },
  },
  plugins: [],
};