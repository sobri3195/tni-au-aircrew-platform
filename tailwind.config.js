/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        military: {
          900: '#0f172a',
          700: '#1e293b',
          500: '#334155',
          200: '#cbd5e1',
          100: '#e2e8f0'
        }
      }
    }
  },
  plugins: []
};
