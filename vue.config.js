const path = require('path'); // Ensure the path module is imported

module.exports = {
    devServer: {
        port: 8080
    },
    // SEO and Performance Optimizations
    publicPath: process.env.NODE_ENV === 'production' ? '/' : '/',
    productionSourceMap: false, // Disable source maps in production for smaller bundles
    configureWebpack: {
        // Performance optimizations
        performance: {
            hints: 'warning',
            maxEntrypointSize: 512000,
            maxAssetSize: 512000
        }
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

        // Add rule for markdown files
        config.module
          .rule('markdown')
          .test(/\.md$/)
          .use('raw-loader')
          .loader('raw-loader')
          .options({
            esModule: false  // Return string directly, not ES module
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
        },
        optimization: {
            splitChunks: {
                chunks: 'all',
                cacheGroups: {
                    // Separate Vue ecosystem
                    vue: {
                        test: /[\\/]node_modules[\\/](vue|vue-router|vuex|@vue)[\\/]/,
                        name: 'vue-vendor',
                        chunks: 'all',
                        priority: 20
                    },
                    // Separate Web3 ecosystem
                    web3: {
                        test: /[\\/]node_modules[\\/](web3|ethers|@web3-onboard|@ethereumjs|@metamask)[\\/]/,
                        name: 'web3-vendor',
                        chunks: 'all',
                        priority: 19
                    },
                    // Separate UI libraries
                    ui: {
                        test: /[\\/]node_modules[\\/](sweetalert2|vue-notification|vue-ellipse-progress|three|axios)[\\/]/,
                        name: 'ui-vendor',
                        chunks: 'all',
                        priority: 18
                    },
                    // Separate utility libraries
                    utils: {
                        test: /[\\/]node_modules[\\/](bignumber\.js|rxjs|core-js|bnc-notify)[\\/]/,
                        name: 'utils-vendor',
                        chunks: 'all',
                        priority: 17
                    },
                    // Default vendor chunk
                    vendor: {
                        test: /[\\/]node_modules[\\/]/,
                        name: 'vendor',
                        chunks: 'all',
                        priority: 10
                    }
                }
            }
        }
    }
}
