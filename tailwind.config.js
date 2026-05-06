/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './public/index.html',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#1A1A2E',
          dark: '#0D0D1A',
          surface: '#16213E',
          deep: '#0F3460',
        },
        gold: {
          DEFAULT: '#E8C547',
          hover: '#D4A800',
        },
        ballers: {
          red: '#C0392B',
          muted: '#A8B2C1',
          border: '#2A3550',
          success: '#27AE60',
        },
      },
      fontFamily: {
        bebas: ['Bebas Neue', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
        mono: ['Roboto Mono', 'monospace'],
      },
      fontSize: {
        'hero': ['72px', { lineHeight: '80px' }],
        'section': ['40px', { lineHeight: '48px' }],
        'jersey': ['48px', { lineHeight: '56px' }],
      },
      maxWidth: {
        'container': '1280px',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'pulse-gold': 'pulseGold 0.6s ease-in-out',
        'skeleton': 'skeleton 1.5s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        pulseGold: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(232, 197, 71, 0.4)' },
          '50%': { boxShadow: '0 0 0 8px rgba(232, 197, 71, 0)' },
        },
        skeleton: {
          '0%': { backgroundColor: '#16213E' },
          '50%': { backgroundColor: '#2A3550' },
          '100%': { backgroundColor: '#16213E' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};
