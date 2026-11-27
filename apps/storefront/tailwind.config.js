module.exports = {
  darkMode: "class",
  presets: [require("@medusajs/ui-preset")],
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/pages/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
    "./src/modules/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@medusajs/ui/dist/**/*.{js,jsx,ts,tsx}",
    "../../node_modules/@medusajs/ui/dist/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          // LK Packaging palette (from lkpkg.com)
          navy: "#163E5C",
          "navy-2": "#225D84",
          blue: "#0070B7",
          "blue-dark": "#005A93",
          "blue-light": "#E3F1FC",
          accent: "#FF9900",
          "accent-dark": "#E08600",
          "accent-light": "#FFF5E5",
          ink: "#333333",
          line: "#D5DEE6",
          canvas: "#F4F7FA",
        },
        status: {
          ok: "#16A34A",
          "ok-bg": "#DCFCE7",
          warn: "#D97706",
          "warn-bg": "#FEF3C7",
          bad: "#DC2626",
          "bad-bg": "#FEE2E2",
          info: "#1556C9",
          "info-bg": "#E8F0FC",
          neutral: "#475569",
          "neutral-bg": "#E2E8F0",
        },
      },
      maxWidth: {
        "8xl": "100rem",
      },
      screens: {
        "2xsmall": "320px",
        xsmall: "512px",
        small: "1024px",
        medium: "1280px",
        large: "1440px",
        xlarge: "1680px",
        "2xlarge": "1920px",
      },
      fontFamily: {
        sans: ["\"Open Sans\"", "var(--font-geist-sans)", "sans-serif"],
        condensed: ["\"Open Sans Condensed\"", "\"Open Sans\"", "sans-serif"],
      },
      keyframes: {
        "accordion-open": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-close": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
      },
      animation: {
        "accordion-open": "accordion-open 0.3s ease-out",
        "accordion-close": "accordion-close 0.3s ease-out",
      },
    },
  },
}
