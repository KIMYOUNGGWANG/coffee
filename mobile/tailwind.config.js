/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}", "./App.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: "#FFF6E8",
          dark: "#2A1A12",
        },
        surface: {
          DEFAULT: "#FFF8EC",
          dark: "#493024",
        },
        primary: {
          amber: "#BD7650",
        },
        muted: {
          DEFAULT: "#8F7867",
        },
        room: {
          canvas: "#FFF6E8",
          muted: "#F0DFC9",
          paper: "#FFF8EC",
          linen: "#E8D8C1",
          espresso: "#2A1A12",
          soil: "#493024",
          cocoa: "#654D3D",
          clay: "#BD7650",
          sage: "#8FA57D",
          leaf: "#4E7452",
        },
      }
    },
  },
  plugins: [],
}
