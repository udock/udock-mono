import webpack from 'webpack'

export = function uiLoader(this: webpack.loader.LoaderContext, content: string, map: any) {
  return content.replace(/["']([\w-]+)\|require["']\s*:\s*(["'][^"']+["'])/g, "'$1': require($2).default")
}
