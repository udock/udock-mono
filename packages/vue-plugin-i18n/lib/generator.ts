import webpack from 'webpack'
import _ from 'lodash'
import path from 'path'
import fs from 'fs'

type I18nOptions = {
  debug: boolean,
  path: string,
  fallback: string,
  default: string
}

export = function (loader: webpack.loader.LoaderContext, options: I18nOptions) {
  const dir = options.path
  const langs = fs.readdirSync(dir).filter((file) => fs.statSync(path.join(dir, file)).isDirectory())
  const data = {
    langs,
    defaultLang: 'zh-CN',
    fallbackLang: 'zh-CN',
    langsDir: './' + path.relative(path.dirname(loader.resourcePath), dir)
  }
  const imports = {}
  const templateFilePath = path.resolve(__dirname, '..', 'template', 'index.js')
  const fileContent = fs.readFileSync(templateFilePath, 'utf8')
  const template = _.template(fileContent, { imports })
  return {
    code: template(Object.assign({}, data))
  }
}
