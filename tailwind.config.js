/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "base-400": "#9CA3AF", // gris clair
        "base-500": "#6B7280", // gris moyen
        "base-600": "#4B5563", // gris foncé
      },
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      "light",
      "dark", 
      "valentine",
      "retro",
      "aqua"
    ],
    darkTheme: "dark",
    base: true,
    styled: true,
    utils: true,
    logs: true,
    themeRoot: ":root",
  }
}
