/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './public/index.html',
  ],
  theme: {
    extend: {
      colors: {
        // Brand greens (logo + primary CTA)
        brand: {
          DEFAULT: '#1F6E3A',
          dark: '#16542B',
          light: '#2E8B4F',
          50: '#E8F3EC',
          100: '#CFE6D7',
          600: '#1F6E3A',
          700: '#16542B',
          900: '#0E3A1D',
        },
        // Surfaces
        surface: {
          DEFAULT: '#FFFFFF',
          muted: '#F6F7F8',
          subtle: '#F0F2F4',
          sunken: '#E9ECEF',
        },
        ink: {
          DEFAULT: '#111418',
          soft: '#3B4149',
          muted: '#6B7280',
          faint: '#9AA1A9',
        },
        line: {
          DEFAULT: '#E5E7EB',
          strong: '#D1D5DB',
        },
        // Status / accents
        accent: {
          danger: '#D03A2E',
          warning: '#E0A12B',
          info: '#2563EB',
          success: '#1F6E3A',
        },
        // Badges
        badge: {
          new: '#16542B',
          edition: '#0E3A1D',
          sale: '#D03A2E',
          lowStock: '#FEE2E2',
          lowStockText: '#B42318',
          inStock: '#D1FAE0',
          inStockText: '#065F2A',
          outStock: '#E5E7EB',
          outStockText: '#6B7280',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
        mono: ['"Roboto Mono"', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(17, 20, 24, 0.04), 0 1px 3px rgba(17, 20, 24, 0.06)',
        'card-hover': '0 4px 12px rgba(17, 20, 24, 0.08)',
        elevated: '0 8px 24px rgba(17, 20, 24, 0.10)',
      },
      borderRadius: {
        lg: '10px',
        xl: '14px',
        '2xl': '18px',
      },
      animation: {
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
      },
      keyframes: {
        slideInRight: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
