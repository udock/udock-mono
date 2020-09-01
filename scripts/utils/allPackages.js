const path = require('path')
const fs = require('fs')

module.exports = fs
  .readdirSync(path.join(__dirname, '..',  '..', 'packages'))
  .filter((name) => {
    const dirName = path.join(__dirname, '..',  '..', 'packages', name)
    return fs.statSync(dirName).isDirectory() && fs.existsSync(dirName, path.join('package.json'))
  })
