module.exports = {
    devServer: {
        port: 8080
    },
    chainWebpack: config => {
          config.module
            .rule('js')
            .test(/node_modules\/.*\/*.js$/)
            .use('raw-loader')
            .loader('raw-loader')
      }
}