/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#1e293b",
          dark: "#0f172a",
        },
        accent: {
          DEFAULT: "#34d399",
        },
      },
      fontFamily: {
        poppins: ["Poppins_700Bold"],
        inter: ["Inter_400Regular", "Inter_600SemiBold"],
      },
    },
  },
  darkMode: "class",
  plugins: [],
};
