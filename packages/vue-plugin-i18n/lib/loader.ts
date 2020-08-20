import fs from 'fs'
import path from 'path'
import webpack from 'webpack'
import generate from './generator'

const FRAMEWORK_NAMESPACE = 'udock'

export = function i18nLoader(this: webpack.loader.LoaderContext, content: string, map: any) {
  const i18nConfig = {
    debug: true,
    path: 'src/i18n/langs',
    fallback: 'en-US',
    default: 'zh-CN'
  }

  const configPath = path.resolve(`./src/${FRAMEWORK_NAMESPACE}.config.js`)
  this.addDependency(configPath)
  delete require.cache[configPath]

  if (fs.existsSync(configPath)) {
    try {
      const config = require(configPath)
      Object.assign(i18nConfig, config.plugins.i18n)
    } catch (e) {
      console.log('\nframework config error:')
      this.callback(e)
      return
    }
  }

  const result = generate(this, i18nConfig)
  if (i18nConfig.debug) {
    console.log('======== i18n =========')
    console.log(result.code)
    console.log('======== =========== =========')
  }
  return result.code
}
