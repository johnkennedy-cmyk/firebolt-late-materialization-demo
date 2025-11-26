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
          orange: "#FF6A13",
          blue: "#1E3A8A",
          gray: "#64748B",
        },
      },
    },
  },
  plugins: [],
};
export default config;

