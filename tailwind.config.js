import plugin from "tailwindcss/plugin";
import { DURATION, EASE, toCubicBezier } from "./src/lib/motion.js";

// HORVEX design tokens (roadmap §3.1–3.3, §7).
// Old template names (bg, ink-secondary, border, accent, success, sale) are kept
// as aliases onto the new palette so the template sections keep rendering until
// block B rebuilds them; new code should use the palette names directly.

const palette = {
  obsidian: "#0B0B0C", // main dark background
  carbon: "#141416", // cards / surfaces on dark
  graphite: "#1E1F22", // raised surfaces, inputs, drawers
  steel: "#2A2B2F", // borders / dividers on dark
  smoke: "#9A9AA0", // secondary text on dark
  ivory: "#F5F1EA", // light section bg; main text on dark
  parchment: "#EAE4D9", // secondary light bg, cards on ivory
  taupe: "#6B665E", // secondary text on light
  oxblood: "#9E3B34", // sale / discount
  emerald: "#3F7D5A", // success, in stock
  amber: "#C08A2E", // warning, low stock
};

const fonts = {
  sans: ["Manrope Variable", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
  display: ["Cormorant Garamond Variable", "ui-serif", "Georgia", "Times New Roman", "serif"],
  logo: ["Michroma", "Manrope Variable", "ui-sans-serif", "sans-serif"],
};

// 3% film grain, tiled. Grayscale fractal noise baked at 0.03 opacity.
const grain =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E\")";

// Type roles: one class sets family, size, line-height, tracking and weight.
// Registered as components so utilities (font-*, text-<color>, md:text-*) still win.
const typeRole = (family, fontSize, lineHeight, letterSpacing, fontWeight, extra = {}) => ({
  fontFamily: fonts[family].map((f) => (f.includes(" ") ? `"${f}"` : f)).join(", "),
  fontSize,
  lineHeight,
  letterSpacing,
  fontWeight,
  ...extra,
});

const typography = plugin(({ addComponents }) => {
  addComponents({
    ".text-display": typeRole("display", "clamp(2.75rem, 5vw + 1rem, 6.5rem)", "0.95", "-0.01em", "500"),
    ".text-h1": typeRole("display", "clamp(2.25rem, 3.5vw + 1rem, 4rem)", "1.05", "-0.01em", "500"),
    ".text-h2": typeRole("display", "clamp(1.875rem, 2.5vw + 1rem, 3rem)", "1.1", "0", "500"),
    ".text-h3": typeRole("sans", "1.375rem", "1.3", "-0.01em", "600"),
    ".text-eyebrow": typeRole("sans", "0.75rem", "1", "0.28em", "600", {
      textTransform: "uppercase",
      color: "var(--accent-text)",
    }),
    ".text-body": typeRole("sans", "1rem", "1.7", "0", "400"),
    ".text-small": typeRole("sans", "0.875rem", "1.55", "0", "400"),
    ".text-button": typeRole("sans", "0.8125rem", "1", "0.14em", "600", { textTransform: "uppercase" }),
    ".text-price": typeRole("sans", "1.125rem", "1", "0", "600", { fontVariantNumeric: "tabular-nums" }),
    // Template alias (nav links); B1 replaces the header.
    ".text-nav": typeRole("sans", "0.9375rem", "1", "0", "500"),
  });
});

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    screens: {
      xs: "360px",
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    },
    extend: {
      fontFamily: fonts,
      colors: {
        ...palette,
        ink: {
          DEFAULT: "#151412", // main text on light
          secondary: palette.taupe, // alias
        },
        gold: {
          DEFAULT: "#C9A96E", // accent on dark; never as text on ivory
          light: "#D8BC86", // hover
          deep: "#8A6A35", // gold text on light backgrounds
        },
        // Template aliases
        bg: { DEFAULT: palette.ivory, secondary: palette.parchment },
        border: { DEFAULT: "#DDD6CA" }, // hairline on light surfaces
        accent: { DEFAULT: "#151412", foreground: palette.ivory },
        success: { DEFAULT: palette.emerald },
        sale: { DEFAULT: palette.oxblood },
      },
      letterSpacing: {
        eyebrow: "0.28em",
        button: "0.14em",
        wordmark: "0.32em",
      },
      borderRadius: {
        control: "2px", // buttons, inputs
        card: "4px", // cards, images
        pill: "999px", // chips, counters only
        // Template aliases, tightened to the luxury scale
        sm: "2px",
        DEFAULT: "4px",
        md: "4px",
        lg: "4px",
      },
      boxShadow: {
        highlight: "inset 0 1px 0 rgba(255,255,255,0.04)", // elevation on dark (pair with a border)
        soft: "0 20px 40px -24px rgba(21,20,18,0.25)", // elevation on ivory
        card: "0 20px 40px -24px rgba(21,20,18,0.25)", // template alias
      },
      backgroundImage: {
        grain,
        "gold-glow": "radial-gradient(closest-side, rgba(201,169,110,0.12), transparent)",
        vignette: "linear-gradient(to top, rgba(11,11,12,0.85), rgba(11,11,12,0) 60%)",
      },
      maxWidth: {
        container: "1320px",
      },
      spacing: {
        gutter: "var(--gutter)", // container side padding: 16 / 24 / 40
        section: "var(--section-y)", // section padding: 64 / 96 / 128
        "section-sm": "4rem",
      },
      transitionDuration: {
        fast: `${DURATION.fast}ms`,
        base: `${DURATION.base}ms`,
        slow: `${DURATION.slow}ms`,
        reveal: `${DURATION.reveal}ms`,
      },
      transitionTimingFunction: {
        DEFAULT: toCubicBezier(EASE.outExpo),
        "out-expo": toCubicBezier(EASE.outExpo),
        "in-out-cubic": toCubicBezier(EASE.inOutCubic),
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-up": `fadeUp ${DURATION.reveal}ms ${toCubicBezier(EASE.outExpo)} both`,
      },
    },
  },
  plugins: [typography],
};
