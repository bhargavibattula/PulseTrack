/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.tsx', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter_400Regular'],
        sansMedium: ['Inter_500Medium'],
        sansBold: ['Inter_600SemiBold'],
        display: ['Manrope_400Regular'],
        displayBold: ['Manrope_700Bold'],
        displayExtraBold: ['Manrope_800ExtraBold'],
      },
      colors: {
        amber: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
          900: '#78350F'
        },
        stone: {
          50: '#FAFAF9',
          100: '#F5F5F4',
          200: '#E7E5E4',
          400: '#A8A29E',
          600: '#57534E',
          900: '#1C1917'
        },
        brand: {
          DEFAULT: '#F59E0B', // amber-500
          dark: '#D97706', // amber-600
        },
        status: {
          empty: '#A8A29E', // stone-400
          filling: '#3B82F6', // blue-500
          full: '#16A34A', // green-600
          emptying: '#EA580C', // orange-600
        },
      },
    },
  },
  plugins: [],
};
