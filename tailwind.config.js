/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "agent-black": "rgb(var(--agent-black) / <alpha-value>)",
        "agent-gold": "rgb(var(--agent-gold) / <alpha-value>)",
        "agent-gold-dark": "rgb(var(--agent-gold-dark) / <alpha-value>)",
      },
      fontFamily: {
        orbitron: ["Orbitron", "sans-serif"],
        fira: ["Fira Code", "monospace"],
      },
      keyframes: {
        scanline: {
          "0%": { transform: "translateY(-120%)", opacity: "0" },
          "10%": { opacity: "0.22" },
          "50%": { opacity: "0.12" },
          "100%": { transform: "translateY(120%)", opacity: "0" },
        },
        glitch: {
          "0%, 100%": {
            transform: "translate3d(0, 0, 0)",
            textShadow: "0 0 0 transparent",
          },
          "20%": {
            transform: "translate3d(-0.4px, 0, 0)",
            textShadow:
              "0.4px 0 0 rgba(255, 0, 64, 0.18), -0.4px 0 0 rgba(0, 255, 255, 0.16)",
          },
          "21%": {
            transform: "translate3d(0.4px, 0, 0)",
            textShadow:
              "-0.4px 0 0 rgba(255, 0, 64, 0.14), 0.4px 0 0 rgba(0, 255, 255, 0.12)",
          },
          "22%": {
            transform: "translate3d(0, 0, 0)",
            textShadow: "0 0 0 transparent",
          },
          "63%": {
            transform: "translate3d(0.3px, -0.2px, 0)",
            textShadow:
              "0.3px 0 0 rgba(255, 0, 64, 0.12), -0.3px 0 0 rgba(0, 255, 255, 0.1)",
          },
          "64%": {
            transform: "translate3d(0, 0, 0)",
            textShadow: "0 0 0 transparent",
          },
        },
      },
      animation: {
        scanline: "scanline 6s linear infinite",
        glitch: "glitch 2.8s steps(2, end) infinite",
      },
    },
  },
  plugins: [],
};
