/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "#222",
        input: "#222",
        ring: "#fff",
        background: "#000",
        foreground: "#fff",
        primary: {
          DEFAULT: "#b9e77a", // soft green from image
          foreground: "#222",
        },
        secondary: {
          DEFAULT: "#d8f87e", // pastel yellow-green
          foreground: "#222",
        },
        destructive: {
          DEFAULT: "#ff3131",
          foreground: "#fff",
        },
        muted: {
          DEFAULT: "#f4f6ef", // very light greenish/gray for backgrounds
          foreground: "#222",
        },
        accent: {
          DEFAULT: "#7ec3f8", // pastel blue
          foreground: "#222",
        },
        popover: {
          DEFAULT: "#111",
          foreground: "#fff",
        },
        card: {
          DEFAULT: "#222",
          foreground: "#fff",
        },
        pixelYellow: "#ffe600", // neon yellow (unify with CSS)
        pixelGreen: "#39ff14", // neon green (unify with CSS)
        pixelBlue: "#7ec3f8", // pastel blue
        pixelOrange: "#ff9900", // neon orange
        pixelPink: "#ff00cc",
        pixelPurple: "#b967ff",
        pixelRed: "#ff3131",
        pixelWhite: "#fff",
        pixelGray: "#bfc9c2", // soft gray
        pixelBlack: "#222",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}