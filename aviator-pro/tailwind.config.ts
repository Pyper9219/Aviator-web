import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        darkbg: "#0B0E14",
        surface: "#10131A",
        card: "#191C22",
        borderline: "#282C35",
        brandred: "#E51E3D",
        brandgreen: "#00E575",
        mpesa: "#00A859",
        airtel: "#E31837"
      },
      fontFamily: {
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"]
      }
    }
  },
  plugins: []
};
export default config;
