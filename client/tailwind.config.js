/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        base: '#FAF6F0',
        ink: '#221B26',
        coral: '#FF6F4D',
        teal: '#1F8A82',
        amber: '#FFC857'
      },
      fontFamily: {
        display: ['"Cabinet Grotesk"', '"General Sans"', 'Poppins', 'sans-serif'],
        body: ['"Public Sans"', '"Work Sans"', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
