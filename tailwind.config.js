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
      {
        light: {
          "primary": "#570df8",
          "secondary": "#f000b8",
          "accent": "#37cdbe",
          "neutral": "#3d4451",
          "base-100": "#ffffff",
          "base-200": "#f2f2f2",
          "base-300": "#e5e6e6",
          "base-content": "#1f2937",
        },
      },
      {
        dark: {
          "primary": "#661ae6",
          "secondary": "#d926aa",
          "accent": "#1fb2a5",
          "neutral": "#191d24",
          "base-100": "#2a303c",
          "base-200": "#242933",
          "base-300": "#20252e",
          "base-content": "#a6adba",
        },
      },
  {
    valentine: {
      primary: "#A72C4B",       // HSL(354, 41%, 65%)
      secondary: "#9A4B88",     // HSL(304, 53%, 62%)
      accent: "#D1D9EB",        // HSL(230, 11%, 82%)
      neutral: "#663333",       // HSL(2, 15%, 40%)
      "base-100": "#F7F7F7",    // HSL(343, 1%, 97%)
      "base-200": "#EFEFEF",    // HSL(342, 3%, 94%)
      "base-300": "#E3E3E3",    // HSL(343, 6%, 89%)
      "base-content": "#865555", // HSL(4, 22%, 52%)
      info: "#D2E0F4",           // HSL(207, 13%, 86%)
      success: "#D5E7D5",        // HSL(165, 14%, 84%)
      warning: "#E6DEB0",        // HSL(56, 18%, 75%)
      error: "#A17A63",          // HSL(25, 24%, 63%)
    },
  },
  {
    aqua: {
      primary: "#D8F0F8",        // HSL(199, 14%, 86%)
      secondary: "#A178B3",      // HSL(310, 11%, 61%)
      accent: "#ECF9E9",         // HSL(94, 10%, 93%)
      neutral: "#443C69",        // HSL(266, 15%, 27%)
      "base-100": "#5F4A8F",     // HSL(266, 15%, 37%)
      "base-200": "#483566",     // HSL(268, 9%, 28%)
      "base-300": "#3A2A3A",     // HSL(268, 9%, 22%)
      "base-content": "#3A3B59", // HSL(231, 6%, 90%)
      info: "#8F7AB2",           // HSL(263, 22%, 55%)
      success: "#6AB285",        // HSL(149, 17%, 63%)
      warning: "#BFB766",        // HSL(58, 16%, 66%)
      error: "#C5A77C",          // HSL(27, 19%, 74%)
    },
  },
  {
    retro: {
      primary: "#CCB28C",        // HSL(20, 11%, 80%)
      secondary: "#EAF0E9",      // HSL(156, 8%, 92%)
      accent: "#AAC68E",         // HSL(76, 16%, 68%)
      neutral: "#70744C",        // HSL(74, 1%, 44%)
      "base-100": "#EAECEC",     // HSL(90, 3%, 92%)
      "base-200": "#E0E2E0",     // HSL(92, 5%, 88%)
      "base-300": "#D6D8D6",     // HSL(91, 7%, 84%)
      "base-content": "#69623A", // HSL(45, 11%, 41%)
      info: "#7A6CC0",           // HSL(242, 16%, 58%)
      success: "#52817F",        // HSL(186, 10%, 51%)
      warning: "#D3B661",        // HSL(41, 22%, 64%)
      error: "#C89D6E",          // HSL(22, 19%, 70%)
       },
      },
    ],
    darkTheme: "dark",
    base: true,
    styled: true,
    utils: true,
    prefix: "",
    logs: false,
    themeRoot: ":root",
  },
}
