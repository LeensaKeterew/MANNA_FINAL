/** @type {import('tailwindcss').Config} */
// MANNA design tokens (same values as the original D1 theme) exposed to Tailwind.
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  // Preflight stays off so the existing D1 page styles keep their exact look;
  // base resets for forms/fonts live in index.css (@layer base).
  corePlugins: { preflight: false },
  theme: {
    // Overrides Tailwind's default font stacks so no default Tailwind font is ever used.
    fontFamily: {
      heading: ["Playfair Display", "serif"],
      body: ["Nunito Sans", "sans-serif"],
      sans: ["Nunito Sans", "sans-serif"],
      serif: ["Playfair Display", "serif"],
      mono: ["Nunito Sans", "sans-serif"],
    },
    extend: {
      colors: {
        // Every colour reads a CSS variable from index.css, so the light/dark theme
        // (:root vs :root[data-theme="dark"]) changes them all in one place.
        manna: {
          bg: "var(--color-bg)",
          card: "var(--color-card)",
          input: "var(--color-input)",
          primary: "var(--color-primary)",
          "primary-dark": "var(--color-primary-dark)",
          text: "var(--color-text)",
          muted: "var(--color-text-muted)",
          border: "var(--color-border)",
          success: "var(--color-success)",
          "success-bg": "var(--color-success-bg)",
          green: "var(--color-accent-green)",
          gold: "var(--color-accent-gold)",
          "on-primary": "var(--color-on-primary)",
          "on-accent": "var(--color-on-accent)",
          "on-gold": "var(--color-on-gold)",
        },
      },
      borderRadius: { pill: "999px", card: "18px" },
      boxShadow: { card: "var(--shadow-card)" },
      maxWidth: { content: "700px" },
    },
  },
  plugins: [],
};
