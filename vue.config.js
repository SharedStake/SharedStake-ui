module.exports = {
    devServer: {
        port: 8080
    },
    chainWebpack: config => {
        config.module
            .rule('html')
            .test(/\.html$/)
            .use('html-loader')
            .loader('html-loader')
    }
}