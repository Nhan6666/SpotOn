/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/app/**/*.{js,jsx,ts,tsx}", "./src/components/**/*.{js,jsx,ts,tsx}", "./src/features/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#b45309",
        background: "#faf8f5",
        text: "#1a1208",
        muted: "#1f2937",
      },
      fontFamily: {
        lexend: ["Lexend", "sans-serif"],
      }
    },
  },
  plugins: [],
}
