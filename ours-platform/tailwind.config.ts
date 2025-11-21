import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#2c2e63',    // Deep blue-purple
          navy: '#2c2e63',    // Deep blue-purple
          primary: '#afcbff', // Light blue
          accent: '#afcbff',  // Light blue
          surface: '#2c2e63', // Deep blue-purple
          light: '#faf9f6',   // Off-white/cream
        }
      },
      fontFamily: {
        sans: ['Century Gothic', 'CenturyGothic', 'AppleGothic', 'sans-serif'],
      }
    },
  },
  plugins: [],
};
export default config;