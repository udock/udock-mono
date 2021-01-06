import { PluginAPI, ProjectOptions } from '@vue/cli-service/types'

const udockBootstrapLoader = require.resolve('@udock/vue-plugin-i18n/dist/lib/loader')
const udockI18nLangsLoader = require.resolve('@udock/vue-plugin-i18n/dist/lib/langs-loader')

const REGEX_I18N_LANGS = /(\/modules\/[\w-]+)*\/i18n\/langs\/index\.(t|j)s$/i

export = function (api: PluginAPI, options: ProjectOptions) {
  const fjs = require.resolve('@udock/vue-plugin-i18n')
  const fts = fjs.replace(/\.js$/i, '.ts')

  api.chainWebpack!((webpackConfig: any) => {
    webpackConfig.module
      .rule('vue-plugin-i18n')
      .test((module: string) => (module == fjs) || (module == fts))
      .use('babel-loader')
      .loader('babel-loader')
      .end()
      .use('vue-plugin-i18n-loaders')
      .loader(udockBootstrapLoader)
      .end()

    webpackConfig.module
      .rule('vue-plugin-i18n-langs')
      .test(REGEX_I18N_LANGS)
      .use('babel-loader')
      .loader('babel-loader')
      .end()
      .use('vue-plugin-i18n-langs-loaders')
      .loader(udockI18nLangsLoader)
      .end()
  })
}
