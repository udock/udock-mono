import extend from 'lodash/extend'
import isObject from 'lodash/isObject'
import isFunction from 'lodash/isFunction'
import isUndefined from 'lodash/isUndefined'
import mapValues from 'lodash/mapValues'
import defaults from 'lodash/defaults'
import merge from 'lodash/merge'
import has from 'lodash/has'
import pickBy from 'lodash/pickBy'
import path from 'path'
import axios, { AxiosStatic, AxiosRequestConfig, Method, AxiosResponse, AxiosInterceptorManager } from 'axios'
import Mock, { MockjsValidRsItem } from 'mockjs'
import convert from 'xml-js'
import qs from 'qs'
import './mockjs.patch'

export type MockOptions = {
  load?: (path: string) => any;
  useProxy?: boolean;
  axios?: AxiosStatic;
}

type MockRequestConf = {
  method: Method;
  headers?: {
    [key: string]: string
  };
  query?: {
    [key: string]: string
  };
  data?: any;
  body?: any;
  _valid?: (type: string, template: any, data: any, looseValid?: Function) => MockjsValidRsItem[];
  _format?: string | Function
}

type Context = {

}

type MockResponseConf = {
  time_cost: number;
  status: number;
  headers?: {
    [key: string]: string
  };
  data?: object | ((context: Context) => object);
  _format?: string | Function;
  proxy_pass?: string;
}

type MockConfItem = {
  request: MockRequestConf | false | undefined;
  response: MockResponseConf | false | undefined;
} | false

type MockConf = MockConfItem[]

type MockError = {
  url: string | Error;
  useProxy: Error;
  request: AxiosRequestConfig;
  originalRequest: AxiosRequestConfig;
  response: MockResponseConf;
}

function looseValid (rule: ((data: object) => MockjsValidRsItem[]) | object, data: object): MockjsValidRsItem[] {
  if (isFunction(rule)) {
    return rule(data)
  } else {
    const eg = Mock.mock(rule)
    const toCheck = pickBy(data, (_, key) => has(eg, key))
    const items = Mock.valid(rule, toCheck)
    return items
  }
}

function valid (rule: MockRequestConf | false | undefined, data: AxiosRequestConfig): boolean {
  if (!rule) {
    return true
  } else {
    // 匹配 method
    if (!(data.method || 'get').match(typeof rule.method === 'string'
      ? rule.method.toLowerCase()
      : rule.method)
    ) {
      return false
    }

    const hasCustomValid = isFunction(rule._valid)
    const _valid = (type: string, template: any, data: any) => {
      if (hasCustomValid) {
        const result = rule._valid!(type, template, data, looseValid)
        if (!isUndefined(result)) {
          return result
        }
      }
      return looseValid(template, data)
    }

    // 匹配 headers，只要包含所有规则项就算匹配
    if (rule.headers) {
      const items = _valid('headers', rule.headers!, data.headers!)
      if (items.length > 0) {
        return false
      }
    }

    // 匹配 query
    if (rule.query) {
      for (const key in rule.query) {
        rule.query[key] += '' // 转成字符串
      }
      const items = _valid('query', rule.query, data.params)
      if (items.length > 0) {
        return false
      }
    }

    // 匹配 data
    if (rule.data) {
      let body = data.data
      if (rule._format) {
        try {
          if (isFunction(rule._format)) {
            // 自定义请求报文解析
            body = rule._format(body)
          } else if (rule._format === 'xml') {
            // 解析 xml
            body = convert.xml2json(body, {compact: true})
          }
        } catch (e) {
          console.error(`request parse error: ${e.message}`)
          return false
        }
      }

      // 解析 JSON
      try {
        body = JSON.parse(body)
        (data as any).body = body
      } catch (e) {}

      if (typeof body === 'string') {
        return body === rule.data
      } else {
        const items = _valid('data', rule.data, body)
        if (items.length > 0) {
          return false
        }
      }
    }

    return true
  }
}

function getQuery (request: AxiosRequestConfig) {
  return extend(
    {},
    qs.parse(request.url!),
    // 合并 req.params 的参数
    mapValues(request.params, (value, key) => JSON.stringify(value))
  )
}

function matching (confs: MockConf | false, req: AxiosRequestConfig): MockConfItem | undefined {
  if (confs == false) throw {}
  for (let i=0, n=confs.length; i<n; i++) {
    const conf = confs[i]
    if (conf === false || Object.keys(conf).length === 0) continue
    const ret = valid(conf.request, req)
    if (ret) {
      return ret === true ? conf : undefined
    }
  }
}

function mockWithContext (template: any, context: any) {
  // return Mock.mock(
  //   defaults(
  //     {response: template},
  //     mapValues(context, (val) => () => val)
  //   )
  // ).response
  template = merge({}, template)
  const _format = template._format
  delete template._format
  try {
    template = mapValues(template, val => {
      return isFunction(val) ? val({ context: {root: context} }) : val
    })
    const response = defaults(
      (Mock as any).Handler.gen(template, undefined, {root: context}),
      {
        status: 200
      }
    )
    if (_format) {
      if (isFunction(_format)) {
        // 自定义响应输出
        response.data = _format(response.data)
      } else if (_format === 'xml') {
        // xml 格式
        response.data = convert.json2xml(response.data, {
          compact: true,
          spaces: 2
        })
      }
    }
    return response
  } catch (e) {
    return { time_cost: 200,
      status: 500,
      data: JSON.stringify({
        error: `respone temmplate error: ${e.message}`
      })
    }
  }
}

const mockErr = new Error()
const useProxy = new Error()
const originalAxios = axios.create()

function hackInterceptorsRequestUse (request: AxiosInterceptorManager<AxiosRequestConfig>, requestInterceptor: (request: AxiosRequestConfig) => AxiosRequestConfig) {
  let requestInterceptorId = request.use(requestInterceptor)
  const _use = request.use
  request.use = (...args) => {
    request.eject(requestInterceptorId)
    const id = _use.apply(request, args)
    requestInterceptorId = _use.call(request, requestInterceptor)
    return id
  }
}

export default {
  useProxy,
  init (options: MockOptions) {
    const config = defaults(options.load!('config'), {
      global: {},
      local_server: {},
      third_party: {},
      bridge: {}
    })

    function mock (axios: AxiosStatic) {
      const requestInterceptor = (request: AxiosRequestConfig) => {
        let hostname
        let url
        let mockData
        let originalRequest = request
        let defaultConf
        request = defaults({query: getQuery(request)}, request)
        if (config.global.enabled !== false) {
          url = request.url!
          let pathname
          let port
          if (url.startsWith('/')) {
            pathname = url.split('?')[0]
            hostname = undefined
            port = undefined
          } else {
            const oUrl = new URL(request.url!)
            pathname = oUrl.pathname
            hostname = oUrl.hostname.replace(/^www\./, '')
            port = parseInt(oUrl.port)
          }
          pathname = pathname.replace(/\/$/, '/index')
          if (hostname) {
            if (port !==80 && port !== 443) {
              hostname += `:${port}`
            }

            if (config.third_party.enabled === false) {
              hostname = undefined
            } else {
              hostname = `third-party/${hostname}`
              defaultConf = config.third_party
            }
          } else {
            if (config.local_server.enabled === false) {
              hostname = undefined
            } else {
              hostname = 'local-server'
              defaultConf = config.local_server
            }
          }
        }

        if (hostname) {
          try {
            // 尝试根据请求路径精确匹配,并获取对应的模拟数据配置文件
            const mockConf = matching(options.load!(hostname + url), request)
            if (isObject(mockConf) && mockConf.response) {
              // 匹配成功，并定义了 response, 进行数据模拟
              mockData = {response: mockWithContext(mockConf.response, {request})}
            }
          } catch (e) {
            // 尝试根据请求路径精确匹配,并获取对应的模拟数据配置文件失败
            // 尝试匹配默认模拟数据配置文件
            let def = path.relative('.', path.resolve(`${hostname}${url}`, '..', '_'))
            while (!mockData) {
              try {
                const mockConf = matching(options.load!(def), request)
                if (isObject(mockConf)) {
                  if (!mockConf.response) { break }
                  // 匹配成功，并定义了 response, 跳出循环，进行数据模拟
                  mockData = {response: mockWithContext(mockConf.response, {request})}
                  break
                }
              } catch (e) {}
              if (def === '_') { break }
              def = path.relative('.', path.resolve(def, '..', '..', '_'))
            }
          }
        }
        if (options.useProxy) {
          mockData = mockData || {useProxy}
        }
        if (mockData) {
          console.log(`mock: ${request.url}`)
          throw merge({url: mockErr, request, originalRequest}, config.global, defaultConf, mockData)
        } else {
          return originalRequest
        }
      }

      const responseInterceptor = (error: MockError) => {
        if (error.url === mockErr) {
          const originalRequest = error.originalRequest
          if (error.response.proxy_pass && originalRequest.url?.startsWith('/')) {
            originalRequest.url = error.response.proxy_pass.replace(/\/$/, '') + originalRequest.url
            return originalAxios.request(originalRequest).catch(err => {
              return err.response
            })
          }
          if (error.useProxy === useProxy) {
            return Promise.reject(useProxy)
          }
          // return Promise.resolve(error)
          return new Promise((resolve, reject) => {
            const timeout = error.request.timeout || axios.defaults.timeout || 240000
            const timeCost = error.response.time_cost || 0
            if (timeout > timeCost) {
              setTimeout(() => {
                if (error.response.status >= 200 && error.response.status < 300) {
                  resolve(error.response)
                } else {
                  reject(error.response)
                }
              }, timeCost)
            } else {
              setTimeout(() => {
                reject(new Error(`timeout of ${timeout}ms exceeded`))
              }, timeout)
            }
          })
        } else {
          return Promise.reject(error)
        }
      }

      hackInterceptorsRequestUse(axios.interceptors.request, requestInterceptor)
      axios.interceptors.response.use(undefined, responseInterceptor)

      const _create = axios.create
      axios.create = (...args) => {
        const instance = _create(...args)
        hackInterceptorsRequestUse(instance.interceptors.request, requestInterceptor)
        instance.interceptors.response.use(undefined, responseInterceptor)
        return instance
      }
    }
    mock(options.axios || axios)
  }
}
