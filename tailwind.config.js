/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f0faf9',
          100: '#d0f0ed',
          200: '#a1e1db',
          300: '#6bccc4',
          400: '#41b3aa',
          500: '#289690',
          600: '#1e7975',
          700: '#1c6260',
          800: '#1a4f4d',
          900: '#193d3b',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
