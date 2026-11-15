import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: "#3E9BDB",
          teal: "#1F9E94",
          orange: "#EE8A2B",
          "orange-text": "#B85E00",
          purple: "#8E6BBF",
          green: "#43A047",
          coral: "#E5624F",
          pale: "#EAF4FC",
          dark: "#1A1A2E",
          mid: "#2D3748",
        },
      },
      borderRadius: {
        card: "0.75rem",
      },
      fontFamily: {
        sans: [
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Noto Sans Devanagari",
          "sans-serif",
        ],
      },
      screens: {
        xs: "360px",
      },
    },
  },
  plugins: [],
};

export default config;
