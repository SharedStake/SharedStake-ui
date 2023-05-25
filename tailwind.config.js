 // tailwind.config.js
 module.exports = {
    purge: [
      './public/**/*.html',
      './src/**/*.vue',
    ],
     theme: {
       extend: {
        colors: {
          'brand-primary': '#e6007a',
          'brand-primary-light': '#e2539e'
        },
        screens: {
          'md-large': '900px'
        }
       },
     },
     variants: {},
     plugins: [],
   };
