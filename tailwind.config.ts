import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#f5f0e8',
        'paper-dark': '#ede6d6',
        ink: {
          950: '#1a1a1a',
          800: '#2d2d2d',
          600: '#4a4a4a',
          400: '#a0a0a0',
          200: '#d0ccc4',
          100: '#e8e4dc',
        },
      },
      fontFamily: {
        serif: ['Georgia', 'Cambria', '"Times New Roman"', 'serif'],
        mono: ['"Courier New"', 'Courier', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
