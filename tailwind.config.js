/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
            colors: {
        "base-400": "#9CA3AF", // gris clair (équivalent Tailwind gray-400)
        "base-500": "#6B7280", // gris moyen (équivalent Tailwind gray-500)
        "base-600": "#4B5563", // gris foncé
      }
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      "light", "dark", "cupcake", "bumblebee", "emerald",
      "corporate", "synthwave", "retro", "cyberpunk",
      "valentine", "halloween", "garden"
    ],
  },
}
