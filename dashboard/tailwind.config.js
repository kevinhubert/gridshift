/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ercot: {
          cheap: '#10b981',
          neutral: '#6b7280',
          expensive: '#ef4444',
        },
      },
    },
  },
  plugins: [],
};
