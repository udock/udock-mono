import path = require('path');
import webpack = require('webpack');

export = function (this: webpack.loader.LoaderContext, content: string, map: any) {
  const configPath = path.resolve(`./vue.config.js`)
  let workdir = '@/mock/'
  let highPriority = true

  try {
    const { pluginOptions } = require(configPath)
    if (pluginOptions && pluginOptions['@udock/mock']) {
      workdir = pluginOptions['@udock/mock'].workdir || workdir
      if (pluginOptions['@udock/mock'].highPriority !== undefined) {
        highPriority = pluginOptions['@udock/mock'].highPriority
      }
    }
  } catch (e) {

  }

  return `if (process.env.NODE_ENV === 'development' || process.env.FORCE_MOCK) {
  require('@udock/plugin-mock').default.init({
    load: file => require('${workdir}' + file).default,
    highPriority: ${highPriority}
  })
}`
}
