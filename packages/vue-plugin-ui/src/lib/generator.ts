import webpack from 'webpack'
import _ from 'lodash'
import path from 'path'
import fs from 'fs'

type UiOptions = {
  debug: boolean;
  components: object;
}

export = function (loader: webpack.loader.LoaderContext, options: UiOptions) {
  const data = {
    components: options.components
  }
  const imports = {}
  const templateFilePath = path.resolve(__dirname, '..', '..', 'template', 'index.js')
  const fileContent = fs.readFileSync(templateFilePath, 'utf8')
  const template = _.template(fileContent, { imports })
  return {
    code: template(Object.assign({}, data))
  }
}
