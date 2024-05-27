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
      }
}