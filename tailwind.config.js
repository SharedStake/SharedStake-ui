// tailwind.config.js
module.exports = {
  purge: ["./public/**/*.html", "./src/**/*.vue"],
  theme: {
    extend: {
      colors: {
        "brand-primary": "#e6007a",
        "brand-primary-light": "#e2539e",
        "brand-dark": "#0f1013",
        "gray-subtle": "rgba(255, 255, 255, 0.1)",
        "gray-muted": "rgba(255, 255, 255, 0.6)",
        "gray-light": "rgba(255, 255, 255, 0.9)",
      },
      fontFamily: {
        'sans': ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
        'display': ['Inter', 'sans-serif'],
        'mono': ['Roboto Mono', 'monospace'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1.16' }],
        '6xl': ['3.75rem', { lineHeight: '1.1' }],
        '7xl': ['4.5rem', { lineHeight: '1.05' }],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '120': '30rem',
      },
      screens: {
        "md-large": "900px",
      },
      maxWidth: {
        content: "1300px",
        prose: "65ch",
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.6s ease-out',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(2rem)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        glow: {
          '0%': { filter: 'brightness(100%) drop-shadow(0 0 0 rgba(230, 0, 122, 0))' },
          '100%': { filter: 'brightness(120%) drop-shadow(0 0 20px rgba(230, 0, 122, 0.5))' },
        },
      },
      backdropBlur: {
        xs: '2px',
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
