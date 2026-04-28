import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./hooks/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        war: {
          bg:       "#050810",
          panel:    "#111827",
          surface:  "#1F2937",
          border:   "#374151",
          gold:     "#F5C542",
          goldDark: "#C8960C",
          cyan:     "#67E8F9",
          cyanDim:  "#0E7490",
          red:      "#EF4444",
          redDim:   "#7F1D1D",
          blue:     "#2F80ED",
          purple:   "#7C3AED",
          green:    "#4ADE80",
          text:     "#F8FAFC",
          muted:    "#94A3B8",
          dim:      "#475569",
        },
      },
      fontFamily: {
        sans:    ["var(--font-rajdhani)", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-orbitron)", "var(--font-rajdhani)", "Inter", "sans-serif"],
        mono:    ["ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "monospace"],
      },
      keyframes: {
        floatBoard: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%":      { transform: "translateY(-16px)" },
        },
        cyanPulse: {
          "0%, 100%": { opacity: "0.35", transform: "scale(1)"    },
          "50%":      { opacity: "0.80", transform: "scale(1.05)" },
        },
        fadeInUp: {
          from: { opacity: "0", transform: "translateY(20px)" },
          to:   { opacity: "1", transform: "translateY(0)"    },
        },
        fadeIn: {
          from: { opacity: "0" },
          to:   { opacity: "1" },
        },
        captureFlash: {
          "0%":   { background: "rgba(239,68,68,0.65)" },
          "100%": { background: "transparent"          },
        },
        marqueeLR: {
          "0%":   { transform: "translateX(0)"    },
          "100%": { transform: "translateX(-50%)" },
        },
        rankGlow: {
          "0%, 100%": { boxShadow: "0 0  8px rgba(245,197,66,0.30)" },
          "50%":      { boxShadow: "0 0 24px rgba(245,197,66,0.75)" },
        },
        checkPulse: {
          "0%, 100%": { boxShadow: "0 0 0 2px rgba(239,68,68,0.50)" },
          "50%":      { boxShadow: "0 0 0 8px rgba(239,68,68,0.15)" },
        },
        defeatShake: {
          "0%, 100%": { transform: "translateX(0)"    },
          "20%":      { transform: "translateX(-8px)" },
          "40%":      { transform: "translateX(8px)"  },
          "60%":      { transform: "translateX(-5px)" },
          "80%":      { transform: "translateX(5px)"  },
        },
        victoryPop: {
          "0%":   { transform: "scale(0.85)", opacity: "0" },
          "60%":  { transform: "scale(1.06)", opacity: "1" },
          "100%": { transform: "scale(1)",    opacity: "1" },
        },
        "pulse-red": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(239, 68, 68, 0.6)" },
          "50%":      { boxShadow: "0 0 0 8px rgba(239, 68, 68, 0)" },
        },
      },
      animation: {
        floatBoard:   "floatBoard 5s ease-in-out infinite",
        cyanPulse:    "cyanPulse 3s ease-in-out infinite",
        fadeInUp:     "fadeInUp 0.6s ease-out forwards",
        "fade-in":    "fadeIn 0.6s ease-out forwards",
        "slide-up":   "fadeInUp 0.5s ease-out forwards",
        captureFlash: "captureFlash 0.35s ease-out",
        marqueeLR:    "marqueeLR 25s linear infinite",
        rankGlow:     "rankGlow 2s ease-in-out infinite",
        checkPulse:   "checkPulse 1s ease-in-out infinite",
        defeatShake:  "defeatShake 0.5s ease-in-out",
        victoryPop:   "victoryPop 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards",
        "pulse-red":  "pulse-red 1.4s ease-in-out infinite",
      },
      backgroundImage: {
        "gold-gradient":  "linear-gradient(135deg, #F5C542 0%, #C8960C 100%)",
        "war-gradient":   "linear-gradient(135deg, #F5C542 0%, #FFFFFF 50%, #67E8F9 100%)",
        "panel-gradient": "linear-gradient(180deg, #111827 0%, #0d1117 100%)",
      },
      boxShadow: {
        "gold":    "0 0 24px rgba(245,197,66,0.35)",
        "cyan":    "0 0 40px rgba(103,232,249,0.25)",
        "board":   "0 0 60px rgba(103,232,249,0.20), 0 24px 48px rgba(0,0,0,0.60)",
        "panel":   "0 4px 24px rgba(0,0,0,0.40)",
      },
    },
  },
  plugins: [],
};

export default config;
