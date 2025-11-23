// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-gothic)', 'sans-serif'],
      },
      colors: {
        brand: {
          // Colors extracted from "web principal.ai" XMP metadata
          primary: "#3FA9F5", // Cyan/Blue from file
          secondary: "#7AC943", // Green from file
          accent: "#FF931E", // Orange from file
          alert: "#FF1D25", // Red from file
          dark: "#1A1A1A", // R=26 G=26 B=26 (Dark Gray)
          navy: "#0D0D0D", // Almost Black
          light: "#FFFFFF",
          gray: "#BDCCD4", // Light Blue-Gray from file
        },
      },
    },
  },
  plugins: [],
};
export default config;