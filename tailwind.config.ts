import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          emerald: "#34d399",
          purple: "#7c3aed",
        },
      },
      boxShadow: {
        glow: "0 0 40px rgba(52, 211, 153, 0.15)",
      },
    },
  },
  plugins: [],
} satisfies Config;
