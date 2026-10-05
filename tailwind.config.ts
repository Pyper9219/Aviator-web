import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        aerocrash: {
          bg: "#0B0E14",
          surface: "#10131A",
          card: "#191C22",
          cardHigh: "#22262E",
          border: "#282C35",
          red: "#E51E3D",
          redHover: "#FF2B4D",
          green: "#00E575",
          greenHover: "#00FF82",
          gold: "#F59E0B",
          purple: "#A855F7",
        }
      },
      fontFamily: {
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
      }
    },
  },
  plugins: [],
};
export default config;
