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
        surface: '#16213E',
      },
      fontFamily: {
        bebas: ['Bebas Neue', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
        mono: ['Roboto Mono', 'monospace'],
      },
      fontSize: {
        'hero': ['72px', { lineHeight: '80px' }],
        'section': ['40px', { lineHeight: '1.2' }],
        'jersey': ['48px', { lineHeight: '1' }],
      },
      boxShadow: {
        'gold-glow': '0 8px 32px rgba(232, 197, 71, 0.15)',
        'gold-strong': '0 4px 20px rgba(232, 197, 71, 0.3)',
      },
      animation: {
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'pulse-gold': 'pulseGold 1s ease-in-out',
      },
      keyframes: {
        slideInRight: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGold: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(232, 197, 71, 0.4)' },
          '50%': { boxShadow: '0 0 0 8px rgba(232, 197, 71, 0)' },
        },
      },
      maxWidth: {
        'screen-xl': '1280px',
      },
    },
  },
  plugins: [],
};
