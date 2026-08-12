/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        clinical: {
          blue: '#4F46E5',
          'blue-dark': '#3730A3',
          'blue-light': '#EEF2FF',
        },
        trusted: {
          green: '#0F8A5F',
          'green-dark': '#08704C',
          'green-light': '#ECFDF5',
        },
        vet: {
          bg: '#F7F7F5',
          surface: '#FFFFFF',
          'surface-subtle': '#FAF9F6',
          text: '#292D3A',
          secondary: '#667085',
          tertiary: '#98A2B3',
          border: '#E7E7E3',
          'border-subtle': '#F0F0EC',
        },
        urgency: {
          critical: '#DC2626',
          high: '#EA580C',
          moderate: '#D97706',
          low: '#0F8A5F',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'subtle': '0 1px 2px 0 rgba(41, 45, 58, 0.04)',
        'card': '0 1px 3px 0 rgba(41, 45, 58, 0.06), 0 1px 2px -1px rgba(41, 45, 58, 0.04)',
        'modal': '0 10px 25px -5px rgba(41, 45, 58, 0.1), 0 8px 10px -6px rgba(41, 45, 58, 0.05)',
      },
      borderRadius: {
        'xs': '4px',
        'sm': '6px',
        'DEFAULT': '8px',
        'lg': '10px',
        'xl': '12px',
        '2xl': '16px',
      }
    },
  },
  plugins: [],
}
