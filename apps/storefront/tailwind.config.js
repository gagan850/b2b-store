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
          navy: "#0B1F3F",
          "navy-2": "#13305F",
          blue: "#1556C9",
          "blue-dark": "#0F43A0",
          "blue-light": "#E8F0FC",
          accent: "#F28C1B",
          "accent-dark": "#D9760A",
          "accent-light": "#FFF4E5",
          ink: "#1A2233",
          line: "#D6DCE6",
          canvas: "#F3F5F9",
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
        sans: ["var(--font-geist-sans)"],
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
