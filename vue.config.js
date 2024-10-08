const path = require('path'); // Ensure the path module is imported

module.exports = {
    devServer: {
        port: 8080
    },
    chainWebpack: config => {
        config.module
          .rule('js')
          .test(/\.js$/)
        //   .exclude
            // This breaks on windows
            // .add(/node_modules(?!\/@web3-onboard\/core)/)  // Exclude all node_modules except @web3-onboard/core
            // .end()
          .use('babel-loader')
          .loader('babel-loader')
          .options({
            presets: ['@babel/preset-env'],
            plugins: [
              '@babel/plugin-transform-optional-chaining', 
              '@babel/plugin-proposal-nullish-coalescing-operator',
              '@babel/plugin-syntax-bigint'
            ]
          });
      },
      transpileDependencies: [
        '@metamask/abi-utils',
        'superstruct',
        '@ethereumjs/util',
        '@web3-onboard/core',
      ],
      configureWebpack: {
        devtool: 'source-map',
        resolve: {
            alias: {
                '@web3-onboard/core': path.resolve(__dirname, 'node_modules/@web3-onboard/core/dist/index.js'),
                '@web3-onboard/vue': path.resolve(__dirname, 'node_modules/@web3-onboard/vue/dist/index.js'),
                '@ethereumjs/util': path.resolve(__dirname, 'node_modules/@ethereumjs/util/dist/index.browser.js'),
                '@metamask/abi-utils': path.resolve(__dirname, 'node_modules/@metamask/abi-utils/lib/index.js')
            }
        }
    }
}
