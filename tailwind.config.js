/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#0C121E',
          900: '#111A29',
          800: '#172235', // Primary brand dark navy
          700: '#22334A', // Card surface
          600: '#2E415E', // Border & divider
          500: '#3D5477',
        },
        gold: {
          300: '#F3E5C8',
          400: '#DFBE82',
          500: '#C5A66A', // Champagne gold brand
          600: '#A4854B',
          700: '#7E6433',
        },
        cream: {
          50: '#FAF8F5',
          100: '#F7F5F0',
          200: '#EAE6DC',
        }
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        'gold-glow': '0 0 20px rgba(197, 166, 106, 0.35)',
        'gold-glow-lg': '0 0 35px rgba(197, 166, 106, 0.55)',
        'card-subtle': '0 8px 24px -4px rgba(12, 18, 30, 0.6)',
      }
    },
  },
  plugins: [],
}
