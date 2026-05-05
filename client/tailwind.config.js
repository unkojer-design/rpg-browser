/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        pixel: ['"Press Start 2P"', "monospace"],
      },
      colors: {
        rpg: {
          dark: "#0d0d1a",
          panel: "#1a1a2e",
          border: "#4a3f6b",
          gold: "#f0c040",
          hp: "#e74c3c",
          mp: "#3498db",
          xp: "#2ecc71",
        },
        poke: {
          dark: "#0d1a0d",
          panel: "#0f1f0f",
          border: "#2a5a2a",
          yellow: "#f8d030",
        },
      },
    },
  },
  plugins: [],
};
