import { PluginAPI, ProjectOptions } from '@vue/cli-service/types'
const loader = require.resolve('@udock/vue-cli-plugin-mock/dist/lib/loader')

export = function (api: PluginAPI, options: ProjectOptions) {
  api.chainWebpack(function (config) {
    const bootstrap = '@udock/vue-cli-plugin-mock'
    const entry = config.entry
    config.entry('app').prepend(bootstrap) // 正常添加

    // 防止被后续插件清空
    config.entry = (...args) => {
      if (args[0] === 'app') {
        const app = entry.call(config, ...args)
        const clear = app.clear
        app.clear = () => {
          clear.call(app)
          app.add(bootstrap)
          app.clear = clear // 恢复清空函数
          return app
        }
        return app
      } else {
        return entry.call(config, ...args)
      }
    }

    const fjs = require.resolve('@udock/vue-cli-plugin-mock')
    const fts = fjs.replace(/\.js$/i, '.ts')
    config.module
      .rule('@udock/vue-cli-plugin-mock')
      .test((module: string) => (module == fjs) || (module == fts))
      .use('babel-loader')
      .loader('babel-loader')
      .end()
      .use('vue-plugin-auto-router-loaders')
      .loader(loader)
      .end()
  })

  api.configureDevServer(
    require('@udock/plugin-mock').configureDevServer
  )
}
