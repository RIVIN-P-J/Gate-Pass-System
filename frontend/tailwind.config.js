/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', 'Inter', 'Segoe UI', 'Roboto', 'Arial', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#eef7ff',
          100: '#d9edff',
          200: '#badeff',
          300: '#8ac9ff',
          400: '#52a9ff',
          500: '#2f87ff',
          600: '#1f66f5',
          700: '#1c4ed2',
          800: '#1e43aa',
          900: '#1c3b86',
        },
      },
      boxShadow: {
        glass: '0 10px 30px rgba(0,0,0,.25)',
        soft: '0 12px 40px rgba(0,0,0,.18)',
      },
      backdropBlur: {
        glass: '18px',
      },
      keyframes: {
        floaty: {
          '0%,100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '0% 0%' },
          '100%': { backgroundPosition: '-200% 0%' },
        },
      },
      animation: {
        floaty: 'floaty 6s ease-in-out infinite',
        shimmer: 'shimmer 1.2s linear infinite',
      },
    },
  },
  plugins: [],
}

