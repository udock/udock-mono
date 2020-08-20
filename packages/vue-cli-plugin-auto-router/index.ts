const udockBootstrapLoader = require.resolve('@udock/vue-plugin-auto-router/lib/loader')

export = function (api: any, options: any) {

  const fjs = require.resolve('@udock/vue-plugin-auto-router')
  const fts = fjs.replace(/\.js$/i, '.ts')

  api.chainWebpack!((webpackConfig: any) => {
    webpackConfig.module
      .rule('vue-plugin-auto-router')
      .test((module: string) => (module == fjs) || (module == fts))
      .use('babel-loader')
      .loader('babel-loader')
      .end()
      .use('vue-plugin-auto-router-loaders')
      .loader(udockBootstrapLoader)
      .end()
  })
}
