/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        carbonyx: {
          bg: '#0B0F17',
          surface: '#111827',
          card: 'rgba(17, 24, 39, 0.75)',
          border: 'rgba(255, 255, 255, 0.08)',
          emerald: '#10B981',
          cyan: '#06B6D4',
          amber: '#F59E0B',
          crimson: '#EF4444',
          purple: '#8B5CF6'
        }
      },
      backdropBlur: {
        glass: '16px'
      }
    },
  },
  plugins: [],
}
