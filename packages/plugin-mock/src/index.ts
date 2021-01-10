// @ts-ignore
import settle from 'axios/lib/core/settle'
// @ts-ignore
import createError from 'axios/lib/core/createError'

import '@udock/axios-interceptors-priority-patch'
import './mockjs.patch'
export { configureDevServer } from './configureDevServer'
import {
  isFunction,
  isUndefined ,
  mapValues,
  defaults,
  has,
  pickBy
} from 'lodash'
import path from 'path'
import axios, { AxiosStatic, AxiosRequestConfig, Method, CancelTokenSource } from 'axios'
import Mock, { MockjsValidRsItem } from 'mockjs'
import convert from 'xml-js'
import { getQuery, isQueryObject, duration, success, error, MockResult, Headers } from './utils'
import { mockRealRequest } from './configureDevServer'

export { MockResult, duration, success, error } from './utils'

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
  priority?: number;
  axios?: AxiosStatic;
  allowOverrideAdapter?: boolean;
}

const LOG_STYLE_REQUEST = 'color: gray'
const LOG_STYLE_RESPONSE = 'color: #43BB88'
const LOG_STYLE_TUNNELING = 'color: #CF88FF'
const LOG_STYLE_SKIP = 'color: #99001F'

const useTunneling = Symbol('useTunneling')

function optional<T>(value: T, defaultValue: T) {
  return value === undefined ? defaultValue : value
}

export function tunneling () {
  return {
    status: -1,
    data: useTunneling
  }
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

function valid (rule: MockRequestConf<unknown> | false | undefined, data: AxiosRequestConfig & { query?: unknown }): boolean {
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
        if (typeof rule.query[key] !== 'object') {
          rule.query[key] += '' // 转成字符串
        }
      }
      const items = _valid('query', rule.query, data.query)
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
      const mergedConf = defaults({}, conf, defaultConf)
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
    return async () => confs
  }
}

function mockWithContext (template: any, context: any) {
  template = defaults({}, template)
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

async function handleMockFunction (config: AxiosRequestConfig, mockFunction: MockFunction, mockFilePath: string) {
  try {
    const response = await mockFunction(config, {
      duration,
      success,
      error,
      tunneling
    })
    if (response.data === useTunneling) {
      console.log(`%c>>>> mock tunneling(${config.url}, mock-by: ${mockFilePath})`, LOG_STYLE_TUNNELING, config)
      return
    } else {
      console.log(`%c>>>> mock req(${config.url}, mock-by:: ${mockFilePath}): `, LOG_STYLE_REQUEST, config)
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

export default {
  init (options: MockOptions) {
    defaults(options, {
      priority: Number.MAX_SAFE_INTEGER,
      allowOverrideAdapter: false
    })

    const globalConfig = defaults(options.load!('config'), {
      global: {},
      localServer: {},
      thirdParty: {},
      bridge: {}
    })

    function mock (axios: AxiosStatic) {
      const requestInterceptor = async (config: AxiosRequestConfig) => {
        let hostname
        let mockData
        let url = config.url || ''
        let defaultConf: MockConfItem<unknown, unknown> | undefined

        if (globalConfig.global.enable !== false) { // 全局总开关
          let pathname
          let port
          if (url.startsWith('/')) {
            pathname = url.split('?')[0]
            hostname = undefined
            port = undefined
          } else {
            const oUrl = new URL(config.url!)
            pathname = oUrl.pathname
            hostname = oUrl.hostname.replace(/^www\./, '')
            port = parseInt(oUrl.port)
          }
          pathname = pathname.replace(/\/$/, '/index')
          if (hostname) {
            if (port !==80 && port !== 443) {
              hostname += `:${port}`
            }

            if (globalConfig.thirdParty.enable === false) {
              hostname = undefined
            } else {
              hostname = `third-party/${hostname}`
              defaultConf = globalConfig.thirdParty
            }
          } else {
            if (globalConfig.localServer.enable === false) {
              hostname = undefined
            } else {
              hostname = 'local-server'
              defaultConf = globalConfig.localServer
            }
          }
          defaults(defaultConf, globalConfig.global)
        }

        let mockFilePath = ''

        if (defaultConf && defaultConf.enable !== false &&  hostname) {
          defaults(config, { query: getQuery(config) })
          try {
            // 尝试根据请求路径精确匹配,并获取对应的模拟数据配置文件
            mockFilePath = hostname + url.split('?')[0]
            const mockConf = matching(options.load!(mockFilePath), config, defaultConf)
            if (typeof mockConf === 'function') {
              mockData = await handleMockFunction(config, mockConf, mockFilePath)
              if (!mockData) {
                // 使用透传
                return config
              }
            } else {
              if (mockConf) {
                if (mockConf.tunneling) {
                  // 匹配成功，并使用透传
                  console.log(`%c>>>> mock tunneling(${config.url}, mock-by: ${mockFilePath})`, LOG_STYLE_TUNNELING, config)
                  return config
                } else {
                  // 匹配成功，并且不使用透传, 进行数据模拟
                  mockData = {response: mockWithContext(mockConf.response, {request: config})}
                }
              } else {
                // 找到配置文件，但都不匹配
                throw new Error('try wildcard mock')
              }
            }
          } catch (e) {
            // 尝试根据请求路径精确匹配,并获取对应的模拟数据配置文件失败
            // 尝试匹配默认模拟数据配置文件
            let def = path.relative('.', path.resolve(`${hostname}${url}`, '..', '_'))
            while (!mockData) {
              try {
                mockFilePath = def
                const mockConf = matching(options.load!(mockFilePath), config, defaultConf)
                if (mockConf) {
                  if (typeof mockConf === 'function') {
                    mockData = await handleMockFunction(config, mockConf, mockFilePath)
                    if (!mockData) {
                      return config
                    }
                  } else {
                    if (mockConf.tunneling) {
                      // 匹配成功，并使用透传
                      console.log(`%c>>>> mock tunneling(${config.url}, mock-by: ${mockFilePath})`, LOG_STYLE_TUNNELING, config)
                      return config
                    } else {
                      // 未开启透传, 进行数据模拟
                      mockData = {response: mockWithContext(mockConf.response, {request: config})}
                    }
                  }
                  // 匹配成功，跳出循环
                  break
                }
              } catch (e) {}
              if (def === '_') { break }
              def = path.relative('.', path.resolve(def, '..', '..', '_'))
            }
          }
        }

        if (mockData) {
          if (config.adapter === axios.defaults.adapter || options.allowOverrideAdapter) {
            if (!mockData.logged) console.log(`%c>>>> mock req(${config.url}, mock-by: ${mockFilePath}): `, LOG_STYLE_REQUEST, config)
            let source: CancelTokenSource | undefined
            if (process.env.NODE_ENV === 'development') {
              // 模拟一个真实的网络请求，返回取消源
              source = mockRealRequest(config, mockData)
            }
            const response = defaults({}, mockData.response, defaultConf && defaultConf.response)

            config.adapter = () => {
              return new Promise((resolve, reject) => {
                const timeout = config.timeout || axios.defaults.timeout || 240000
                const duration = response.duration || 0
                let timer: NodeJS.Timeout
                if (timeout > duration) {
                  // 模拟正常返回的请求
                  timer = setTimeout(() => {
                    Object.assign(response, {
                      config: config,
                      __IS_MOCK_DATA__: true
                    })
                    delete response.duration
                    console.log(`%c>>>> mock res(${response.status}, ${config.url}, mock-by: ${mockFilePath}):`, LOG_STYLE_RESPONSE, response)
                    settle(resolve, reject, response)
                  }, duration)
                } else {
                  // 模拟超时请求
                  timer = setTimeout(() => {
                    reject(createError(`timeout of ${config.timeout}ms exceeded, mock-by: ${mockFilePath}`, config, 'ECONNABORTED'));
                  }, timeout)
                }
                if (config.cancelToken) {
                  // 处理请求取消
                  config.cancelToken.promise.then(reason => {
                    // 清除计时器
                    clearTimeout(timer)
                    if (source) {
                      // 如果开启了真实请求模拟，取消模拟的真实请求
                      source.cancel(reason.message)
                    }
                    reject(reason)
                  })
                }
              })
            }
          } else {
            console.log(`%c>>>> mock skip (reason: allowOverrideAdapter=false, mock-by: ${mockFilePath}) ...`, LOG_STYLE_SKIP, config)
          }
        }

        return config
      }

      axios.interceptors.request.use(requestInterceptor, undefined, options.priority)

      const _create = axios.create
      axios.create = (...args) => {
        const instance = _create(...args)
        instance.interceptors.request.use(requestInterceptor, undefined, options.priority)
        return instance
      }
    }

    mock(options.axios || axios)
  }
}
