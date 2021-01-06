const path = require('path')

module.exports = (api) => {
  let type = 'js'
  try {
    const pkg = require(path.resolve('./package.json'))
    type = pkg.devDependencies['@vue/cli-plugin-typescript'] ? 'ts' : 'js'
  } catch (e) {}
  api.render(`./template/${type}`)
}
