function rule (env) {
  return {
    test: require.resolve('@udock/react-plugin-auto-router'),
    use: [
      {
        loader: require.resolve('babel-loader'),
        options: {
          presets: [
            'react-app'
          ],
          customize: require.resolve(
            'babel-preset-react-app/webpack-overrides'
          ),
          plugins: [
            [
              require.resolve('babel-plugin-named-asset-import'),
              {
                loaderMap: {
                  svg: {
                    ReactComponent:
                      '@svgr/webpack?-svgo,+titleProp,+ref![path]',
                  },
                },
              },
            ],
          ],
          // This is a feature of `babel-loader` for webpack (not Babel itself).
          // It enables caching results in ./node_modules/.cache/babel-loader/
          // directory for faster rebuilds.
          cacheDirectory: true,
          // See #6846 for context on why cacheCompression is disabled
          cacheCompression: false,
          compact: env === 'production',
        }
      },
      {
        loader: require.resolve('@udock/react-plugin-auto-router/lib/loader')
      }
    ]
  }
}

function addAutoRouter (config, env) {
  config.module.rules.unshift(rule(env))
  return config
}

addAutoRouter.rule = rule

module.exports = addAutoRouter
