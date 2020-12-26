import extend from 'lodash/extend'
import isFunction from 'lodash/isFunction'
import isUndefined from 'lodash/isUndefined'
import mapValues from 'lodash/mapValues'
import defaults from 'lodash/defaults'
import merge from 'lodash/merge'
import has from 'lodash/has'
import pickBy from 'lodash/pickBy'
import path from 'path'
import axios, { AxiosStatic, AxiosRequestConfig, Method, AxiosInterceptorManager } from 'axios'
import Mock, { MockjsValidRsItem } from 'mockjs'
import convert from 'xml-js'
import qs from 'qs'
import './mockjs.patch'

type Headers = { [key: string]: string }

function isQueryObject (obj: any): obj is { [key: string]: any } {
  return obj && typeof obj === 'object'
}

export type MockResult<T> = {
  status: number,
  headers?: Headers,
  data: T
}

export async function duration (time: number) {
  await new Promise(resolve => {
    setTimeout(resolve, time)
  })
}

export function success<T> (data: T, result?: MockResult<T>) {
  return {
    status: 200,
    data,
    ...result
  }
}

export function error<T> (data: T, result?: MockResult<T>) {
  return {
    status: 500,
    data,
    ...result
  }
}

export function tunneling () {
  return {
    status: -1,
    data: useTunneling
  }
}

type Context<Params> = {
  context: {
    root: {
      request: {
        data: Params;
      };
    };
  };
}

type MockRequestConf<Params> = {
  enable?: boolean;
  method?: Method | RegExp;
  headers?: {
    [key: string]: string
  };
  query?: Params;
  data?: Params;
  body?: any;
  _valid?: (type: string, template: any, data: any, looseValid?: Function) => MockjsValidRsItem[];
  _format?: string | Function
}

type MockResponseConf<Params, Result> = {
  status: number;
  data: Result | ((ctx: Context<Params>) => Result);
  duration?: number;
  headers?: Headers;
  _format?: string | Function;
  proxyPass?: string;
}

export type MockFunction<Result = unknown> = (request: AxiosRequestConfig, ctx: {
  tunneling: (request?: AxiosRequestConfig) => MockResult<symbol>;
  duration: (time: number) => Promise<void>;
  success: <T=unknown> (data: T) => MockResult<T>;
  error: <T=unknown> (data: T) => MockResult<T>;
}) => Promise<MockResult<Result>>

type MockConfItem<Params, Result> = {
  enable?: boolean;
  tunneling?: boolean;
  request?: MockRequestConf<Params> | false;
  response?: MockResponseConf<Params, Result> | false;
} | false

export type MockConfig<Params = unknown, Result = unknown> = false
  | MockConfItem<Params, Result>[]
  | MockFunction<Result>
  | MockResult<Result>

export type MockOptions = {
  load?: (path: string) => any;
  useProxy?: boolean;
  axios?: AxiosStatic;
}

type MockError = {
  url: string | symbol;
  useProxy: Error;
  request: AxiosRequestConfig;
  originalRequest: AxiosRequestConfig;
  response: MockResponseConf<unknown, unknown>;
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

function valid (rule: MockRequestConf<unknown> | false | undefined, data: AxiosRequestConfig): boolean {
  if (!rule || rule.enable === false) {
    return true
  } else {
    // 匹配 method
    if (rule.method && !(data.method || 'get').match(typeof rule.method === 'string'
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
    if (isQueryObject(rule.query)) {
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

function matching (
  confs: MockConfig<unknown, unknown> | false,
  req: AxiosRequestConfig,
  defaultConf: MockConfItem<unknown, unknown>
) {
  if (confs == false) throw {}
  if (Array.isArray(confs)) {
    for (let i=0, n=confs.length; i<n; i++) {
      const conf = confs[i]
      if (conf === false || Object.keys(conf).length === 0 || conf.enable === false) continue
      const mergedConf = merge({}, defaultConf, conf)
      if (defaultConf && defaultConf.tunneling !== undefined) {
        mergedConf.tunneling = defaultConf.tunneling // 高优使用全局配置
      }
      const ret = valid(mergedConf.request, req)
      if (ret) {
        return ret === true ? mergedConf : undefined
      }
    }
  } else if (typeof confs === 'function') {
    return confs
  } else if (typeof confs === 'object') {
    return () => {
      return confs
    }
  }
}

function mockWithContext (template: any, context: any) {
  template = merge({}, template)
  const _format = template._format
  delete template._format
  try {
    if (Object.keys(template).length === 0) {
      throw new Error('no respone temmplate!')
    }
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
    return error(JSON.stringify({
      error: `respone temmplate error: ${e.message}`
    }))
  }
}

async function handleMockFunction (originalRequest: AxiosRequestConfig, mockConf: Function) {
  try {
    const response = await mockConf(originalRequest, {
      duration,
      success,
      error,
      tunneling
    })
    if (response.data === useTunneling) {
      return
    } else {
      console.log(`>>>> mock req: ${originalRequest.url}`, originalRequest)
      return {
        response: { ...response, duration: 0 },
        logged: true
      }
    }
  } catch (e) {
    return {
      response: error(e.message)
    }
  }
}

const useTunneling = Symbol('useTunneling')
const useMockData = Symbol('useMockData')
const useProxy = new Error()
const originalAxios = axios.create()

function hackInterceptorsRequestUse (request: AxiosInterceptorManager<AxiosRequestConfig>, requestInterceptor: (request: AxiosRequestConfig) => Promise<AxiosRequestConfig>) {
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
      localServer: {},
      thirdParty: {},
      bridge: {}
    })

    function mock (axios: AxiosStatic) {
      const requestInterceptor = async (request: AxiosRequestConfig) => {
        let hostname
        let url
        let mockData
        let originalRequest = request
        let defaultConf: MockConfItem<unknown, unknown> | undefined
        request = defaults({query: getQuery(request)}, request)
        if (config.global.enable !== false) { // 全局总开关
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

            if (config.thirdParty.enable === false) {
              hostname = undefined
            } else {
              hostname = `third-party/${hostname}`
              defaultConf = config.thirdParty
            }
          } else {
            if (config.localServer.enable === false) {
              hostname = undefined
            } else {
              hostname = 'local-server'
              defaultConf = config.localServer
            }
          }
          defaultConf = merge({}, config.global, defaultConf)
        }

        if (defaultConf && defaultConf.enable !== false &&  hostname) {
          try {
            // 尝试根据请求路径精确匹配,并获取对应的模拟数据配置文件
            const mockConf = matching(options.load!(hostname + url), request, defaultConf)
            if (typeof mockConf === 'function') {
              mockData = await handleMockFunction(originalRequest, mockConf)
              if (!mockData) {
                return originalRequest
              }
            } else {
              if (mockConf && !mockConf.tunneling) {
                // 匹配成功，并且不使用透传, 进行数据模拟
                mockData = {response: mockWithContext(mockConf.response, {request})}
              }
            }
          } catch (e) {
            // 尝试根据请求路径精确匹配,并获取对应的模拟数据配置文件失败
            // 尝试匹配默认模拟数据配置文件
            let def = path.relative('.', path.resolve(`${hostname}${url}`, '..', '_'))
            while (!mockData) {
              try {
                const mockConf = matching(options.load!(def), request, defaultConf)
                if (mockConf) {
                  if (typeof mockConf === 'function') {
                    mockData = await handleMockFunction(originalRequest, mockConf)
                    if (!mockData) {
                      return originalRequest
                    }
                  } else {
                    // 匹配成功，跳出循环
                    if (!mockConf.tunneling) {
                      // 进行数据模拟
                      mockData = {response: mockWithContext(mockConf.response, {request})}
                    }
                  }
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
          if (!mockData.logged) console.log(`>>>> mock req: ${originalRequest.url}`, originalRequest)
          throw merge({url: useMockData, request, originalRequest}, defaultConf, mockData)
        } else {
          return originalRequest
        }
      }

      const responseInterceptor = (error: MockError) => {
        if (error.url === useMockData) {
          const originalRequest = error.originalRequest
          if (error.response.proxyPass && originalRequest.url?.startsWith('/')) {
            originalRequest.url = error.response.proxyPass.replace(/\/$/, '') + originalRequest.url
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
            const duration = error.response.duration || 0
            if (timeout > duration) {
              setTimeout(() => {
                const response = {
                  ...error.response,
                  config: error.request,
                  __IS_MOCK_DATA__: true
                }
                delete response.duration
                if (error.response.status >= 200 && error.response.status < 400) {
                  console.log(`>>>> mock res(${response.status}, ${response.config.url}):`, response)
                  resolve(response)
                } else {
                  console.log(`>>>> mock res(${response.status}, ${response.config.url}):`, response)
                  reject(response)
                }
              }, duration)
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
