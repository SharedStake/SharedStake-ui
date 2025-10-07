// tailwind.config.js
module.exports = {
  content: ["./public/**/*.html", "./src/**/*.vue"],
  theme: {
    extend: {
      colors: {
        "brand-primary": "#e6007a",
        "brand-primary-light": "#e2539e",
      },
      screens: {
        "md-large": "900px",
      },
      maxWidth: {
        content: 1300,
      },
    },
  },
  variants: {
    extend: {
      display: ["group-hover"],
      visibility: ["group-hover"],
    },
  },
  plugins: [],
};
