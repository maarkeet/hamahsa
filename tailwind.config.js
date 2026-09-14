/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./*.html'],
  theme: {
    extend: {
      fontFamily: { sans: ['Cairo', 'Tajawal', 'sans-serif'] },
      colors: {
        brand: { 50: '#fffef0', 100: '#fffad7', 200: '#fef08a', 300: '#facc15', 400: '#fbbf24', 500: '#f59e0b', 600: '#d97706', 700: '#b45309', 800: '#92400e', 900: '#78350f' },
        accent: { 500: '#f97316', 600: '#ea580c' }
      }
    }
  }
};
