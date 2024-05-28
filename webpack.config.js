const path = require('path');

module.exports = {
  resolve: {
    alias: {
      'bnc-onboard$': path.resolve(__dirname, 'node_modules/bnc-onboard/dist/bnc-onboard.min.js'),
      '@ethereumjs/util$': path.resolve(__dirname, 'node_modules/@ethereumjs/util/dist/index.browser.js'),
      '@metamask/abi-utils$': path.resolve(__dirname, 'node_modules/@metamask/abi-utils/lib/index.js'),
    },
  },
};
