const path = require('path')

module.exports = function packageDir(name) {
  return path.join(__dirname, '..', '..', 'packages', name)
}
