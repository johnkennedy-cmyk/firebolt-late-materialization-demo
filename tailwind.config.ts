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
        firebolt: {
          red: "#EF2F4B", // Primary Firebolt red
          redHover: "#D91A3A", // Darker red for hover states
          orange: "#FF6A13", // Legacy orange (keeping for backwards compatibility)
          blue: "#1E3A8A",
          gray: "#64748B",
          lightGray: "#F8F8F8", // Background color matching firebolt.io
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;

