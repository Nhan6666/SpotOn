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
      },
      fontSize: {
        'xs': ['13px', { lineHeight: '18px' }],
        'sm': ['15px', { lineHeight: '22px' }],
        'base': ['17px', { lineHeight: '24px' }],
        'lg': ['19px', { lineHeight: '26px' }],
        'xl': ['22px', { lineHeight: '28px' }],
        '2xl': ['26px', { lineHeight: '32px' }],
        '3xl': ['32px', { lineHeight: '38px' }],
        '4xl': ['38px', { lineHeight: '44px' }],
      }
    },
  },
  plugins: [],
}
