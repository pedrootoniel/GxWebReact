/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        cinzel: ['Cinzel', 'serif'],
      },
      colors: {
        gold: {
          50: '#fdf8e8',
          100: '#f5ecc4',
          200: '#e8d48a',
          300: '#d4af52',
          400: '#c9a44a',
          500: '#b8862f',
          600: '#8b5c28',
          700: '#6b4c2a',
          800: '#3d2e1a',
          900: '#2a1f12',
        },
        dark: {
          50: '#d4c9b0',
          100: '#8a7e6a',
          200: '#5a5040',
          300: '#2a2520',
          400: '#1a1614',
          500: '#14100c',
          600: '#0f0d0a',
          700: '#0c0a08',
          800: '#0a0a0f',
          900: '#060608',
        },
      },
    },
  },
  plugins: [],
};
