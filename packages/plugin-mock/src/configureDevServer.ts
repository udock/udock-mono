import axios, { AxiosRequestConfig } from 'axios'
import { Application } from 'express'
import { duration } from './utils'

const instance = axios.create()

export function configureDevServer (app: Application) {
  app.use(async (req, res, next) => {
    if (req.headers.__mock__) {
      try {
        console.log(
          '\n>>> mock req:', req.url,
          '\n'
        )
        const mockData = JSON.parse(decodeURI(req.headers.__mock__ as string))
        if (mockData.headers) {
          for (const key in mockData.headers) {
            res.header(key, mockData.headers[key])
          }
        }
        const time = new Date().getTime()
        await duration(mockData.duration)
        res
          .status(mockData.status)
          .send(mockData.data)
        console.log(
          `\n<<< mock res success(${mockData.status}, ${(new Date().getTime()-time) / 1000}s): `, JSON.stringify(mockData.data, null, 2),
          '\n'
        )
        return
      } catch (e) {
        console.error(
          '\n*** mock res error: ', e.message,
          '\n'
        )
      }
    }
    next()
  })
}

export function mockRealRequest (request: AxiosRequestConfig, mockData: any) {
  const source = axios.CancelToken.source()
  if (request.cancelToken) {
    // 用户定义了取消源
    request.cancelToken.promise.then(reason => {
      // 将用户原来的取消操作映射到新的取消源上
      source.cancel(reason.message)
    })
  }

  instance.request({
    ...request,
    cancelToken: source.token, // 覆盖用户配置的取消源
    headers: {
      ...request.headers,
      __MOCK__: encodeURI(JSON.stringify(mockData.response))
    }
  }).catch((e) => undefined)
  return source
}
