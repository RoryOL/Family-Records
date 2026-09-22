/** @type {import('tailwindcss').Config} */
export default {
  theme: {
    extend: {
      colors: {
        stone: {
          850: "#2c2622",
        },
        terracotta: {
          DEFAULT: "#F97316",
          deep: "#EA580C",
        },
        honey: "#F59E0B",
        sage: {
          DEFAULT: "#059669",
          soft: "#D1FAE5",
        },
      },
      boxShadow: {
        warm: "0 4px 20px -2px rgba(120, 53, 15, 0.05)",
      },
      fontFamily: {
        sans: ["Nunito", "Segoe UI", "sans-serif"],
        display: ["Quicksand", "Nunito", "sans-serif"],
      },
    },
  },
};
