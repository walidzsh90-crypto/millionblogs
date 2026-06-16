import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class", '[data-theme="dark"]'],
  content: [
    "./app/**/*.{ts,tsx}",
    "./features/**/*.{ts,tsx}",
    "./shared/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
    "./services/**/*.{ts,tsx}",
    "./state/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--color-background) / <alpha-value>)",
        foreground: "hsl(var(--color-foreground) / <alpha-value>)",
        surface: "hsl(var(--color-surface) / <alpha-value>)",
        muted: "hsl(var(--color-muted) / <alpha-value>)",
        border: "hsl(var(--color-border) / <alpha-value>)",
        primary: "hsl(var(--color-primary) / <alpha-value>)",
        accent: "hsl(var(--color-accent) / <alpha-value>)",
        success: "hsl(var(--color-success) / <alpha-value>)",
        warning: "hsl(var(--color-warning) / <alpha-value>)",
        danger: "hsl(var(--color-danger) / <alpha-value>)",
        info: "hsl(var(--color-info) / <alpha-value>)",
        promotion: "hsl(var(--color-promotion) / <alpha-value>)"
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)"
      },
      boxShadow: {
        raised: "var(--shadow-raised)",
        overlay: "var(--shadow-overlay)"
      },
      fontFamily: {
        sans: "var(--font-sans)",
        mono: "var(--font-mono)"
      },
      spacing: {
        "18": "4.5rem",
        "22": "5.5rem"
      }
    }
  },
  plugins: []
};

export default config;
