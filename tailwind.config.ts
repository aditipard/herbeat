import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "var(--canvas)",
        surface: "var(--surface)",
        surfaceRaised: "var(--surface-raised)",
        ink: "var(--ink)",
        inkSoft: "var(--ink-soft)",
        inkFaint: "var(--ink-faint)",
        line: "var(--line)",
        flow: {
          DEFAULT: "var(--flow)",
          soft: "var(--flow-soft)",
        },
        follicular: {
          DEFAULT: "var(--follicular)",
          soft: "var(--follicular-soft)",
        },
        ovulation: {
          DEFAULT: "var(--ovulation)",
          soft: "var(--ovulation-soft)",
        },
        luteal: {
          DEFAULT: "var(--luteal)",
          soft: "var(--luteal-soft)",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        sm: "8px",
        md: "14px",
        lg: "20px",
        xl: "28px",
      },
      keyframes: {
        drawCurve: {
          "0%": { strokeDashoffset: "1400" },
          "100%": { strokeDashoffset: "0" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseGlow: {
          "0%, 100%": { opacity: "0.55" },
          "50%": { opacity: "1" },
        },
      },
      animation: {
        drawCurve: "drawCurve 1.8s cubic-bezier(0.65, 0, 0.35, 1) forwards",
        fadeUp: "fadeUp 0.5s ease-out forwards",
        pulseGlow: "pulseGlow 2.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
