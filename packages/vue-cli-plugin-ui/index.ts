const udockBootstrapLoader = require.resolve('@udock/vue-plugin-ui/lib/loader')
const udockUiStyleLoader = require.resolve('@udock/vue-plugin-ui/lib/style-loader')

export = function (api: any, options: any) {

  const fjs = require.resolve('@udock/vue-plugin-ui')
  const fts = fjs.replace(/\.js$/i, '.ts')

  api.chainWebpack!((webpackConfig: any) => {
    webpackConfig.module
      .rule('vue-plugin-ui')
      .test((module: string) => (module == fjs) || (module == fts))
      .use('babel-loader')
      .loader('babel-loader')
      .end()
      .use('vue-plugin-ui-loaders')
      .loader(udockBootstrapLoader)
      .end()
  })

  api.chainWebpack!((webpackConfig: any) => {
    webpackConfig.module
      .rule('vue-plugin-ui-style')
      .pre()
      .test(/\/vue-plugin-ui--[\w-]+\/src\/scss\/index\.scss$/i)
      .use('vue-plugin-ui-style-loaders')
      .loader(udockUiStyleLoader)
      .end()
  })
}
