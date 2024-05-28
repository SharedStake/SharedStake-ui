const path = require('path');

module.exports = {
  output: {
    filename: 'ui.bundle.js',
  },
  module: {
    rules: [
        { test: /\.txt$/, use: 'raw-loader' },
        { test: /\.js$/, use: 'raw-loader' }
    ],
  },
};