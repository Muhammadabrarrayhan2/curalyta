/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ivory: {
          DEFAULT: '#F5F1E8',
          deep: '#EBE5D4',
          paper: '#FDFBF5',
        },
        ink: {
          DEFAULT: '#0F1B1A',
          soft: '#2A3837',
          mute: '#5C6968',
        },
        teal: {
          900: '#0A3A36',
          700: '#136058',
          500: '#2B8680',
          100: '#CFE3DF',
        },
        coral: {
          DEFAULT: '#E15F3F',
          soft: '#F4C9B9',
        },
        sand: '#D9C9A3',
        sage: '#9DB19A',
        amber: {
          medical: '#D4A84B',
        },
        rose: {
          medical: '#C04848',
          soft: '#F1D0D0',
        },
        line: {
          DEFAULT: '#D9D2BF',
          soft: '#E8E1CC',
        },
      },
      fontFamily: {
        serif: ['Fraunces', 'Times New Roman', 'serif'],
        sans: ['Geist', '-apple-system', 'sans-serif'],
        mono: ['Geist Mono', 'Courier New', 'monospace'],
      },
      boxShadow: {
        'soft': '0 1px 0 rgba(15,27,26,0.04), 0 1px 2px rgba(15,27,26,0.06)',
        'medium': '0 4px 12px rgba(15,27,26,0.08), 0 1px 3px rgba(15,27,26,0.06)',
        'large': '0 24px 48px -12px rgba(15,27,26,0.18)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        slideUp: {
          '0%': { opacity: 0, transform: 'translateY(12px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: 0, transform: 'scale(0.95)' },
          '100%': { opacity: 1, transform: 'scale(1)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.6 },
        },
      },
    },
  },
  plugins: [],
}
