/** @type {import('tailwindcss').Config} */
//
// The palette below was recovered from the compiled CSS of an earlier build
// (.next/cache) after the original config file went missing — these are the
// project's real Eduport colours, not approximations. Only the shades the app
// actually uses are defined; add more from the brand guide rather than guessing,
// since an invented shade will silently look almost-right.
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
    "./lib/**/*.{js,jsx}",
    "./state/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Eduport orange — buttons, the plan hero gradient, selected chapters.
        brand: {
          50: "#fff4ee",
          100: "#ffe4d5",
          400: "#f5854e",
          500: "#f26a2c",
          600: "#e15718",
          700: "#bb4512",
        },
        // Announcement bar.
        accent: {
          500: "#2e7cf6",
        },
        // The sparkle icons on the announcement bar and Build button.
        gold: {
          400: "#f7c65a",
        },
      },
      fontFamily: {
        // The three next/font families wired up in app/layout.jsx.
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ["var(--font-lora)", "ui-serif", "Georgia", "serif"],
        // `font-hand` is the handwritten accent used by the header and plan hero.
        hand: ["var(--font-caveat)", "ui-serif", "cursive"],
      },
    },
  },
  plugins: [],
};
