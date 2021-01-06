import path from 'path'
import glob from 'glob'
import axios from 'axios'
import mock from '@udock/plugin-mock'

mock.init({
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
        const pattern = item
          .replace(/\\/g, '/')
          .substr(basePath.length)
          .replace(/\.js$/, '')
          .replace(/\\/g, '/')
          .replace(/(\.|\/)/g, '\\$1')
          .replace(/\\\/_[^\\]+\\\//g, '\\/[^/]+\\/')
          // .replace(/\\\/_[^/]+$/, '\\/[^/]+')
        const regx = new RegExp(`^${type}${pattern}$`)
        if (regx.test(file)) {
          filePath = item
          break
        }
      }
    }
    console.log('load file: ', filePath)
    ret = require(filePath)
    setTimeout(() => {
      delete require.cache[require.resolve(filePath)]
    }, 5000)
    return ret
  }
})

function adapteResponse(res: any) {
  return {
    response: {
      statusCode: res.status || 200,
      header: res.headers || {},
      body: res.data === undefined
        ? undefined
        : (typeof res.data === 'string' ? res.data : JSON.stringify(res.data))
    }
  }
}

export default {
  summary: 'mock rule',
  beforeSendRequest(requestDetail: any) {
    console.log('beforeSendRequest: ', requestDetail.url)

    return new Promise((resolve, reject) => {

      console.log('url===>>', requestDetail.url)
      console.log('requestData===>>', requestDetail.requestData + '')

      axios.request({
        url: requestDetail.url,
        method: requestDetail.requestOptions.method,
        headers: requestDetail.requestOptions.headers,
        data: requestDetail.requestData
      }).then((res: any) => {
        resolve(adapteResponse(res))
      }, (res: any) => {
        if (res === mock.useProxy) {
          // 通过代理进行真实请求
          resolve(requestDetail)
        } else {
          resolve(adapteResponse(res))
        }
      })
    })
  }
}
