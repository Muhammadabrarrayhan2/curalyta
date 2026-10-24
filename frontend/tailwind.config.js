/** @type {import('tailwindcss').Config} */
// Palette "porcelain & scrub": cool clinical neutrals, scrub teal as the
// working color, and status colors that follow the NEWS2 bands.
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#0F2529',
          soft: '#1F4A4F',
        },
        sage: {
          DEFAULT: '#0E7C74',
          deep: '#0A5E58',
          light: '#E1F1EE',
        },
        cream: '#F3F6F5',
        paper: '#FFFFFF',
        stone: {
          50: '#F6F8F8',
          100: '#E7ECEB',
          200: '#D3DBDA',
          300: '#AEB9B8',
          400: '#7D8B8A',
          500: '#566463',
          600: '#34403F',
        },
        accent: {
          DEFAULT: '#E8A317',
          warm: '#F4C766',
        },
        clinical: {
          danger: '#D64545',
          warning: '#D98E04',
          success: '#16A37A',
          info: '#2F6FD6',
        },
      },
      fontFamily: {
        display: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        'serif-italic': ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        soft: '0 1px 2px rgba(15, 37, 41, 0.05), 0 1px 3px rgba(15, 37, 41, 0.04)',
        card: '0 1px 2px rgba(15, 37, 41, 0.05), 0 8px 24px -10px rgba(15, 37, 41, 0.10)',
        lift: '0 18px 48px -16px rgba(15, 37, 41, 0.28), 0 2px 6px rgba(15, 37, 41, 0.06)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease',
        'scale-in': 'scaleIn 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        'slide-in': 'slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        rise: 'rise 0.5s cubic-bezier(0.2, 0.7, 0.2, 1) both',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        scaleIn: {
          '0%': { opacity: '0', transform: 'translateY(8px) scale(0.98)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(-8px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        rise: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
