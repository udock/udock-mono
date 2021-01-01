import { AxiosInstance, AxiosRequestConfig } from 'axios'
import { Application } from 'express'
import { duration } from './utils'

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

export function mockRealRequest (axios: AxiosInstance, request: AxiosRequestConfig, mockData: any) {
  axios.request({
    ...request,
    headers: {
      ...request.headers,
      __MOCK__: encodeURI(JSON.stringify(mockData.response))
    }
  })
}
