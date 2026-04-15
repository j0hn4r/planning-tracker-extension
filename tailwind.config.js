/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./*.html", "./*.js"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "surface-tint": "#004ced",
        "inverse-primary": "#b7c4ff",
        "surface-container-high": "#e6e8ea",
        "on-error": "#ffffff",
        "outline": "#76777d",
        "on-error-container": "#93000a",
        "primary": "#000000",
        "background": "#f7f9fb",
        "error-container": "#ffdad6",
        "on-surface": "#191c1e",
        "on-surface-variant": "#45464d",
        "error": "#ba1a1a",
        "surface": "#f7f9fb",
        "secondary-container": "#d0e1fb",
        "on-primary": "#ffffff",
        "on-background": "#191c1e",
        "surface-container-low": "#f2f4f6",
        "surface-container-lowest": "#ffffff",
        "surface-container": "#eceef0",
        "surface-bright": "#f7f9fb",
        "surface-variant": "#e0e3e5",
        "outline-variant": "#c6c6cd",
        "on-secondary-container": "#54647a",
        "tertiary-container": "#cba829",
        "on-tertiary-container": "#4e3e00"
      },
      fontFamily: {
        headline: ["Manrope"],
        body: ["Inter"],
        label: ["Inter"]
      }
    }
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/container-queries'),
  ],
};
