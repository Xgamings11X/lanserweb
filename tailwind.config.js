/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        orange: {
          DEFAULT: '#f97316',
          dark: '#ea580c',
          light: '#fb923c',
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
        dark: {
          DEFAULT: '#0a0a0f',
          2: '#111118',
          3: '#1a1a25',
          4: '#22222f',
          5: '#2a2a3a',
        },
      },
      fontFamily: {
        display: ['Cinzel Decorative', 'serif'],
        ui: ['Rajdhani', 'sans-serif'],
        body: ['Exo 2', 'sans-serif'],
      },
      animation: {
        'fade-up': 'fadeInUp 0.5s ease forwards',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
