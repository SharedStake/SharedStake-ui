// tailwind.config.js
module.exports = {
  purge: ["./public/**/*.html", "./src/**/*.vue"],
  theme: {
    extend: {
      colors: {
        "brand-primary": "#e6007a",
        "brand-primary-light": "#e2539e",
        "brand-secondary": "#25a7db",
        "brand-accent": "#fa52a0",
        "dark-bg": "#0f1013",
        "dark-card": "#111a19",
        "dark-footer": "#181818",
      },
      screens: {
        "md-large": "900px",
      },
      maxWidth: {
        content: 1300,
      },
      fontFamily: {
        'inter': ['Inter', 'sans-serif'],
        'roboto': ['Roboto', 'sans-serif'],
        'ubuntu': ['Ubuntu', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'glow': 'glow 1s linear alternate infinite',
        'button-shift': 'buttonShift 3s ease-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(2rem)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(-100%)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        glow: {
          '0%': { filter: 'drop-shadow(0px 0px 4px rgba(255, 255, 255, 0.01)) brightness(120%)' },
          '100%': { filter: 'drop-shadow(0px 0px 4px rgba(255, 255, 255, 1)) brightness(200%)' },
        },
        buttonShift: {
          '0%': { backgroundPosition: '0px' },
          '100%': { backgroundPosition: '168.6px' },
        },
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #fa52a0 0%, #25a7db 100%)',
        'gradient-dark': 'linear-gradient(135deg, #0d0e21 0%, #0d0e21 100%)',
      },
    },
  },
  variants: {
    extend: {
      display: ["group-hover"],
      visibility: ["group-hover"],
      filter: ["hover", "focus"],
      brightness: ["hover", "focus"],
    },
  },
  plugins: [],
};
