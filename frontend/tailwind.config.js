/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#0A1628',
          soft: '#1E3A5F',
        },
        sage: {
          DEFAULT: '#5C8B7E',
          deep: '#3E6B5E',
          light: '#E8F0EC',
        },
        cream: '#FAF7F2',
        paper: '#FFFFFF',
        stone: {
          50: '#F7F5F0',
          100: '#EDEBE4',
          200: '#D9D5CA',
          300: '#B8B2A3',
          400: '#8A8576',
          500: '#5C584D',
          600: '#3A3832',
        },
        accent: {
          DEFAULT: '#D4704C',
          warm: '#E89B7E',
        },
        clinical: {
          danger: '#C14545',
          warning: '#E0A447',
          success: '#4A8B6F',
          info: '#4A6FA5',
        },
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        'serif-italic': ['Instrument Serif', 'Georgia', 'serif'],
        sans: ['Geist', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        soft: '0 1px 2px rgba(10, 22, 40, 0.04), 0 2px 6px rgba(10, 22, 40, 0.04)',
        card: '0 1px 2px rgba(10, 22, 40, 0.05), 0 8px 24px -8px rgba(10, 22, 40, 0.08)',
        lift: '0 10px 40px -12px rgba(10, 22, 40, 0.18), 0 2px 6px rgba(10, 22, 40, 0.06)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease',
        'scale-in': 'scaleIn 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        'slide-in': 'slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        scaleIn: {
          '0%': { opacity: '0', transform: 'translateY(8px) scale(0.98)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(8px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
};
