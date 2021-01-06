let iconv = require('iconv-lite');
const path = require('path')
const glob = require('glob')
const axios = require('axios')
const {install} = require('@udock/plugin-mock').default

install(null, {
  useProxy: true,
  load: (file) => {
    let ret
    let filePath = path.resolve('./mock', file)
    const r = new RegExp(/^(local-server|third-party)\//)
    const group = r.exec(file)
    if (group) {
      const type = group[1]
      const basePath = path.resolve('./mock', type).replace(/\\/g, '/')
      const files = glob.sync(`${basePath}/**/*.js`)
      for (const item of files) {
        let regx = item
          .replace(/\\/g, '/')
          .substr(basePath.length)
          .replace(/\.js$/, '')
          .replace(/\\/g, '/')
          .replace(/(\.|\/)/g, '\\$1')
          .replace(/\\\/_[^\\]+\\\//g, '\\/[^/]+\\/')
          // .replace(/\\\/_[^/]+$/, '\\/[^/]+')
        regx = new RegExp(`^${type}${regx}$`)
        if (regx.test(file)) {
          filePath = item
          break
        }
      }
    }
    console.log('load file: ', filePath)
    ret = require(filePath)
    setTimeout(() => {
      try {
        delete require.cache[require.resolve(filePath)]
      } catch (e) {
        console.error(`err in delete require.cache: ${filePath}`)
      }
    }, 5000)
    return ret
  }
})

const net = require('net');

const server = net.createServer();

server.on('connection', (person) => {
  // 客户socket进程绑定事件
  person.on('data', (chunk) => {
    chunk = iconv.decode(chunk, 'GB18030')
    console.log(chunk);
    axios.request({
      url: '/@socket/index',
      method: 'POST',
      headers: {},
      data: chunk
    }).then((res) => {
      console.log(res.data)
      person.end(iconv.encode(res.data, 'GB18030'))
    }, (res) => {
      console.log('err', res)
      person.end('mock error')
    })
  })
  person.on('close', (p1) => {

  })
  person.on('error', (p1) => {

  })
})

server.listen(50105);

console.log(require('./mock/local-server/@socket/index'))
