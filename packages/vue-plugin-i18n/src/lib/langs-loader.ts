import fs from 'fs'
import path from 'path'
import webpack from 'webpack'
import _ from 'lodash'

const FRAMEWORK_NAMESPACE = 'udock'

type I18nOptions = {
  debug: boolean,
  path: string,
  fallback: string,
  default: string
}

function generate (loader: webpack.loader.LoaderContext, options: I18nOptions) {
  const dir = path.join(loader.resourcePath, '..')
  let chunkNameBase = path.relative(path.resolve('.'), dir)
    .toLowerCase()
    .replace(/^src\//, '')
    .replace(/\/i18n\/langs$/, '')
    .split(/\/|\\/)
    .filter((item) => item !== 'modules')
    .join('/')

  const langs = fs.readdirSync(dir)
    .filter((file) => {
      let tsPath = path.join(dir, file, 'index.ts')
      let jsPath = path.join(dir, file, 'index.js')
      return fs.existsSync(tsPath) || fs.existsSync(jsPath)
    })
    .map((item) => {
      let filePath = path.join(dir, item, 'index.ts')
      filePath = fs.existsSync(filePath) ? filePath : filePath.replace(/\.ts$/, '.js')
      loader.addDependency(filePath)
      const fileContent = fs.readFileSync(filePath, 'utf8') + ''
      return {
        name: item,
        lazy: !/\/\/\s*lazy\s*=\s*false\b/.test(fileContent)
      }
    })
  const data = {
    langs,
    defaultLang: 'zh-CN',
    fallbackLang: 'zh-CN',
    chunkNameBase
  }
  const imports = {}
  const templateFilePath = path.resolve(__dirname, '..', '..', 'template', 'langs.js')
  const fileContent = fs.readFileSync(templateFilePath, 'utf8')
  const template = _.template(fileContent, { imports })
  return {
    code: template(Object.assign({}, data))
  }
}

export = function i18nLangsLoader(this: webpack.loader.LoaderContext, content: string, map: any) {
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

  if (content.length < 30) {
    const result = generate(this, i18nConfig)
    if (i18nConfig.debug) {
      console.log('======== i18n langs =========')
      console.log(result.code)
      console.log('======== =========== =========')
    }
    return result.code
  } else {
    return content
  }
}
