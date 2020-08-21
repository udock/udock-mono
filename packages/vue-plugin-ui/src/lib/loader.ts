import fs from 'fs'
import path from 'path'
import webpack from 'webpack'
import generate from './generator'

const FRAMEWORK_NAMESPACE = 'udock'

export = function uiLoader(this: webpack.loader.LoaderContext, content: string, map: any) {
  const uiConfig = {
    debug: true,
    components: {}
  }

  const configPath = path.resolve(`./src/${FRAMEWORK_NAMESPACE}.config.js`)
  this.addDependency(configPath)
  delete require.cache[configPath]

  if (fs.existsSync(configPath)) {
    try {
      const config = require(configPath)
      Object.assign(uiConfig, config.plugins.ui)
    } catch (e) {
      console.log('\nframework config error:')
      this.callback(e)
      return
    }
  }

  const result = generate(this, uiConfig)
  if (uiConfig.debug) {
    console.log('======== ui =========')
    console.log(result.code)
    console.log('======== =========== =========')
  }
  return result.code
}
