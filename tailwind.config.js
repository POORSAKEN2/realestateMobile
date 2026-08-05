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
        primary: "#8A77F4",
        secondary: "#634CE4",
        accent: "#BEE3DB",
        surface: "#FAF9F9",
        textPrimary: "#1E1F45",
        whitePrimary: "#FFFFFF",
        description: "#6F6D6D",
        blackPrimary: "#1E1F45",
      },
      fontSize: {
        font10: ["10px", { lineHeight: "14px" }],
        font14: ["14px", { lineHeight: "20px" }],
        font24: ["24px", { lineHeight: "32px" }],
      },
      fontFamily: {
        raleway: ["Raleway_400Regular"],
        ralewayMedium: ["Raleway_500Medium"],
        ralewaySemiBold: ["Raleway_600SemiBold"],
        ralewayBold: ["Raleway_700Bold"],
        ralewayExtraBold: ["Raleway_800ExtraBold"],
        ralewayBlack: ["Raleway_900Black"],
      },
    },
  },
  plugins: [],
};
