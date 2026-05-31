/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        nitj: {
          navy: "#001a33",
          "navy-light": "#002952",
          link: "#1a6bb5",
          "link-hover": "#0d4f8c",
          panel: "#f4f6f8",
          border: "#d8dee6",
          news: "#e8f2fa",
        },
      },
      fontFamily: {
        nitj: ['"Merriweather"', "Georgia", "Cambria", "serif"],
        apple: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"SF Pro Text"',
          '"SF Pro Display"',
          '"Segoe UI"',
          "system-ui",
          "sans-serif",
        ],
      },
      keyframes: {
        "auth-fade-up": {
          "0%": { opacity: "0", transform: "translate3d(0, 20px, 0)" },
          "100%": { opacity: "1", transform: "translate3d(0, 0, 0)" },
        },
        "auth-fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "auth-float": {
          "0%, 100%": { transform: "translate3d(0, 0, 0) scale(1)" },
          "50%": { transform: "translate3d(0, -12px, 0) scale(1.03)" },
        },
        "auth-drift": {
          "0%, 100%": { transform: "translate3d(0, 0, 0)" },
          "50%": { transform: "translate3d(2%, -2%, 0)" },
        },
        "auth-shimmer": {
          "0%": { backgroundPosition: "0% 50%" },
          "100%": { backgroundPosition: "100% 50%" },
        },
      },
      animation: {
        "auth-fade-up": "auth-fade-up 0.9s cubic-bezier(0.16, 1, 0.3, 1) both",
        "auth-fade-in": "auth-fade-in 0.5s ease-out both",
        "auth-float": "auth-float 14s ease-in-out infinite",
        "auth-float-delayed": "auth-float 18s ease-in-out infinite 2s",
        "auth-drift": "auth-drift 22s ease-in-out infinite",
        "auth-shimmer": "auth-shimmer 8s ease-in-out infinite alternate",
      },
    },
  },
  plugins: [],
};
