const path = require('path'); // Ensure the path module is imported

module.exports = {
    devServer: {
        port: 8080
    },
    chainWebpack: config => {
        config.module
          .rule('js')
          .test(/\.js$/)
          .exclude
            .add(/node_modules(?!\/@metamask\/abi-utils)/)  // Exclude all node_modules except @metamask/abi-utils
            .end()
          .use('babel-loader')
          .loader('babel-loader')
          .options({
            presets: ['@babel/preset-env'],
            plugins: ['@babel/plugin-transform-optional-chaining']
          });
      },
      transpileDependencies: [
        '@metamask/abi-utils',
        'superstruct',
        '@ethereumjs/util'
      ],
      configureWebpack: {
        resolve: {
            alias: {
                'bnc-onboard': path.resolve(__dirname, 'node_modules/bnc-onboard/dist/bnc-onboard.min.js'),
                '@ethereumjs/util': path.resolve(__dirname, 'node_modules/@ethereumjs/util/dist/index.browser.js'),
                '@metamask/abi-utils': path.resolve(__dirname, 'node_modules/@metamask/abi-utils/lib/index.js')
            }
        }
  }
}