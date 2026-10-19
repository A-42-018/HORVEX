/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "sans-serif"],
      },
      fontSize: {
        display: ["3.5rem", { lineHeight: "1.08", letterSpacing: "-0.02em", fontWeight: "600" }],
        h1: ["2.75rem", { lineHeight: "1.15", letterSpacing: "-0.02em", fontWeight: "600" }],
        h2: ["2.25rem", { lineHeight: "1.2", letterSpacing: "-0.01em", fontWeight: "600" }],
        h3: ["1.5rem", { lineHeight: "1.3", fontWeight: "600" }],
        body: ["1rem", { lineHeight: "1.65" }],
        small: ["0.875rem", { lineHeight: "1.5" }],
        button: ["0.9375rem", { lineHeight: "1", fontWeight: "600", letterSpacing: "0.01em" }],
        nav: ["0.9375rem", { lineHeight: "1", fontWeight: "500" }],
      },
      colors: {
        bg: {
          DEFAULT: "#FFFFFF",
          secondary: "#F7F6F4",
        },
        ink: {
          DEFAULT: "#161616",
          secondary: "#6E6E6C",
        },
        border: {
          DEFAULT: "#E6E4E1",
        },
        accent: {
          DEFAULT: "#161616",
          foreground: "#FFFFFF",
        },
        success: {
          DEFAULT: "#1E8E5A",
        },
        sale: {
          DEFAULT: "#D6392E",
        },
      },
      borderRadius: {
        sm: "6px",
        DEFAULT: "10px",
        lg: "16px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(0,0,0,0.04), 0 8px 24px -12px rgba(0,0,0,0.08)",
      },
      maxWidth: {
        container: "1280px",
      },
      spacing: {
        section: "6rem",
        "section-sm": "3.5rem",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-up": "fadeUp 0.6s ease-out both",
      },
    },
  },
  plugins: [],
}

