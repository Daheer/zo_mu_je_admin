import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "#56A48C",
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "#EFAE37",
          foreground: "#2C3E50",
        },
        muted: {
          DEFAULT: "#F5F5F5",
          foreground: "#7F8C8D",
        },
        destructive: "#E74C3C",
        success: "#27AE60",
        warning: "#E67E22",
        border: "#E0E0E0",
        "text-primary": "#2C3E50",
        "text-secondary": "#7F8C8D",
        "dark-surface": "#1A1A1A",
        "dark-background": "#000000",
      },
      fontFamily: {
        sans: ["var(--font-dm-mono)", "ui-monospace", "monospace"],
        mono: ["var(--font-dm-mono)", "ui-monospace", "monospace"],
      },
      spacing: {
        xs: "4px",
        s: "8px",
        m: "12px",
        l: "16px",
        xl: "20px",
        xxl: "24px",
      },
      borderRadius: {
        s: "8px",
        m: "12px",
        l: "16px",
        xl: "20px",
      },
      boxShadow: {
        card: "0 2px 8px rgba(0, 0, 0, 0.05)",
        dialog: "0 10px 20px rgba(0, 0, 0, 0.1)",
      },
    },
  },
  plugins: [],
};
export default config;
