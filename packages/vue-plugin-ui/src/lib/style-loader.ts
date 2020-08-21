import fs from 'fs'
import path from 'path'
import webpack from 'webpack'

const FRAMEWORK_NAMESPACE = 'udock'

type ComponentOptions = {
  [key: string]: {
    'pre-styles': string[] | undefined,
    'post-styles': string[] | undefined,
    'replace-styles': string[] | undefined
  }
}

export = function styleLoader(this: webpack.loader.LoaderContext, content: string, map: any) {

  const uiConfig = {
    debug: false,
    theme: '@/themes/base',
    'pre-styles': [],
    'post-styles': [],
    components: {} as ComponentOptions
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

  const componentName = 'input'

  // let preStyles = `@import '${uiConfig.theme}';\n`
  let preStyles = "@import '@udock/vue-plugin-ui--theme-default';\n"
  // 全局预加载样式
  uiConfig['pre-styles'].forEach((item: string) => {
    preStyles += `@import '${item}';\n`
  })

  // 组件预加载样式
  uiConfig.components[componentName]['pre-styles']!.forEach((item: string) => {
    preStyles += `@import '${item}';\n`
  })

  if (uiConfig.components[componentName]['replace-styles']) {
    // 组件替换样式
    content = preStyles
    uiConfig.components[componentName]['replace-styles']!.forEach((item: string) => {
      content += `\n@import '${item}';`
    })
  } else {
    content = preStyles + content
  }

  // 组件后加载样式
  uiConfig.components[componentName]['post-styles']!.forEach((item: string) => {
    content += `\n@import '${item}';`
  })

  // 全局后加载样式
  uiConfig['post-styles'].forEach((item: string) => {
    content += `\n@import '${item}';`
  })
  return content
}
