const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')

class InlineChunkHtmlPlugin {
  constructor (tests) {
    this.tests = tests
  }

  handleCss (publicPath, assets, tag) {
    if (tag.tagName === 'link' && tag.attributes && tag.attributes.href) {
      const fileName = publicPath
        ? tag.attributes.href.replace(publicPath, '')
        : tag.attributes.href
      if (this.tests.some(test => fileName.match(test))) {
        const asset = assets[fileName]
        if (asset) {
          return {
            tagName: 'style',
            innerHTML: asset.source(),
            closeTag: true
          }
        }
      }
    }
    return tag
  }

  handleJs (publicPath, assets, tag) {
    if (tag.tagName === 'script' && tag.attributes && tag.attributes.src) {
      const fileName = publicPath
        ? tag.attributes.src.replace(publicPath, '')
        : tag.attributes.src
      if (this.tests.some(test => fileName.match(test))) {
        const asset = assets[fileName]
        if (asset) {
          return {
            tagName: 'script',
            innerHTML: asset.source(),
            closeTag: true
          }
        }
      }
    }
    return tag
  }

  getInlinedTag (publicPath, assets, tag) {
    let result = this.handleCss(publicPath, assets, tag)
    if (result === tag) {
      result = this.handleJs(publicPath, assets, tag)
    }
    return result
  }

  apply (compiler) {
    let publicPath = compiler.options.output.publicPath || ''
    if (publicPath && !publicPath.endsWith('/')) {
      publicPath += '/'
    }

    compiler.hooks.compilation.tap('InlineChunkHtmlPlugin', compilation => {
      const tagFunction = tag =>
        this.getInlinedTag(publicPath, compilation.assets, tag)

      const hooks = HtmlWebpackPlugin.getHooks(compilation)
      hooks.alterAssetTagGroups.tap('InlineChunkHtmlPlugin', assets => {
        assets.headTags = assets.headTags.map(tagFunction)
        assets.bodyTags = assets.bodyTags.map(tagFunction)
      })

      // Still emit the runtime chunk for users who do not use our generated
      // index.html file.
      hooks.afterEmit.tap('InlineChunkHtmlPlugin', () => {
        Object.keys(compilation.assets).forEach(assetName => {
          if (this.tests.some(test => assetName.match(test))) {
            delete compilation.assets[assetName]
          }
        })
      })
    })
  }
}

module.exports = function (api) {
  api.chainWebpack((config) => {
    if (process.env.NODE_ENV === 'production') {
      config.optimization.splitChunks({
        minSize: Infinity
      })
      config.module
        .rule('images')
        .use('url-loader')
        .tap(options => Object.assign(options, { limit: Infinity }))
      config.module
        .rule('fonts')
        .use('url-loader')
        .tap(options => Object.assign(options, { limit: Infinity }))
      config.plugin('html')
        .tap((args) => {
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          args[0].filename = `${require(path.resolve('./package.json')).name}.html`
          return args
        })
      config.plugin('InlineSourcePlugin')
        .use(InlineChunkHtmlPlugin, [[/\.(js|css)$/]])
    }
  })
}
