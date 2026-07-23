/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#FAF8F4",
        primary: {
          DEFAULT: "#FB7C29",
          hover: "#E86D1E",
        },
        black: "#111111",
        secondary: "#666666",
        border: "#EAE6DF",
      },
      borderRadius: {
        '20px': '20px',
        'luxury': '20px',
      },
      boxShadow: {
        'premium': '0 4px 30px rgba(251, 124, 41, 0.03), 0 1px 3px rgba(0, 0, 0, 0.02)',
        'luxury': '0 10px 40px -10px rgba(0, 0, 0, 0.04), 0 1px 1px rgba(0, 0, 0, 0.01)',
        'glow': '0 0 20px rgba(251, 124, 41, 0.15)',
        'soft': '0 2px 12px rgba(0, 0, 0, 0.02)',
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
