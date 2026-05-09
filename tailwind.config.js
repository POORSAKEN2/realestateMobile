/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./context/**/*.{js,jsx,ts,tsx}",
    "./hooks/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#2563EB",
        whitePrimary: "#FFFFFF",
        description: "#6F6D6D",
        blackPrimary: "#1d1d1f",
      },
      fontSize: {
        font10: ["10px", { lineHeight: "14px" }],
        font14: ["14px", { lineHeight: "20px" }],
        font24: ["24px", { lineHeight: "32px" }],
      },
      fontFamily: {
        sora: ["Sora_400Regular"],
        soraMedium: ["Sora_500Medium"],
        soraSemiBold: ["Sora_600SemiBold"],
        soraBold: ["Sora_700Bold"],
      },
    },
  },
  plugins: [],
};
