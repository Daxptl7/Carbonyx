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
        "primary": "#15ed48",
        "primary-hover": "#12d23f",
        "electric-blue": "#15ed48",
        "glow-cyan": "#00a699",
        "deep-navy": "#222222",
        "midnight-blue": "#2f2f2f",
        "corporate-navy": "#222222",
        "text-primary": "#222222",
        "text-secondary": "#484848",
        "text-muted": "#6a6a6a",
        "ice-bg": "#f7f7f7",
        "ice-tint": "#fafafa",
        "card-stroke": "#dddddd",
        carbonyx: {
          bg: '#f7f7f7',
          surface: '#ffffff',
          card: '#ffffff',
          border: '#dddddd',
          emerald: '#008a05',
          cyan: '#00a699',
          amber: '#F59E0B',
          crimson: '#EF4444',
          purple: '#8B5CF6'
        }
      },
      fontFamily: {
        "display-hero": ["Plus Jakarta Sans", "sans-serif"],
        "headline-lg": ["Plus Jakarta Sans", "sans-serif"],
        "headline-md": ["Plus Jakarta Sans", "sans-serif"],
        "headline-sm": ["Plus Jakarta Sans", "sans-serif"],
        "body-lg": ["Inter", "sans-serif"],
        "body-md": ["Inter", "sans-serif"],
        "body-sm": ["Inter", "sans-serif"],
        "label-lg": ["Plus Jakarta Sans", "sans-serif"],
        "label-md": ["Plus Jakarta Sans", "sans-serif"],
        "mono-proof": ["JetBrains Mono", "monospace"],
        "mono-data": ["JetBrains Mono", "monospace"]
      },
      backdropBlur: {
        glass: '16px'
      },
      animation: {
        'horizon-pulse': 'horizonPulse 6s ease-in-out infinite',
        'subtle-float': 'subtleFloat 5s ease-in-out infinite',
        'aurora-glow': 'auroraGlow 8s ease-in-out infinite alternate',
        'marquee': 'marquee 28s linear infinite',
        'fade-in-up': 'fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'fade-in': 'fadeIn 1s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'pulse-slow': 'pulseSlow 4s ease-in-out infinite',
        'glow-expand': 'glowExpand 1.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        horizonPulse: {
          '0%, 100%': { opacity: '0.85', transform: 'translateX(-50%) scale(1)' },
          '50%': { opacity: '1', transform: 'translateX(-50%) scale(1.02)' },
        },
        subtleFloat: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        auroraGlow: {
          '0%': { opacity: '0.35', transform: 'translate(-50%, -50%) scale(0.95)' },
          '100%': { opacity: '0.7', transform: 'translate(-50%, -50%) scale(1.05)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        pulseSlow: {
          '0%, 100%': { opacity: '0.6', transform: 'scale(0.98)' },
          '50%': { opacity: '1', transform: 'scale(1.02)' },
        },
        glowExpand: {
          '0%': { opacity: '0', transform: 'translateX(-50%) scale(0.9)' },
          '100%': { opacity: '1', transform: 'translateX(-50%) scale(1)' },
        },
      }
    },
  },
  plugins: [],
}
