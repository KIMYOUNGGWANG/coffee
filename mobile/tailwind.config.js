/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}", "./App.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: "#000000",
          dark: "#000000",
        },
        surface: {
          DEFAULT: "#0A0A0A",
          dark: "#0A0A0A",
        },
        primary: {
          amber: "#D4AF37",
        },
        muted: {
          DEFAULT: "#737373",
        }
      }
    },
  },
  plugins: [],
}
