/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors:{
        primary : '#F8F5E9',
        secondary : '#9DC08B',
        tertiary : '#3A7D44',
        quaternary : '#3A7D44',
        quinary : '#DF6D14',
      }
    },
  },
  plugins: [],
}