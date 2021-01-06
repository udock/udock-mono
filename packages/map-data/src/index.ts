import _get from 'lodash/get'
import template from 'lodash/template'

const safeContext: { [key: string]: undefined } = {}
Object.keys(window).forEach(key => {
  safeContext[key] = undefined
})
safeContext.window = undefined
safeContext.console = undefined

type InnerContext = {
  get: (key: string) => unknown;
  root: (key: string) => unknown;
}

type Context<T> = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
} & { root?: T }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Convertor<S = any, T = any> = (v: S, ctx: Context<T> & InnerContext) => T;

// type ConvertorConfig = string | [string, Array<boolean|number|string>]

export type MappingConfig = string // key 值
  | boolean | number | symbol | Map<unknown, unknown> | Set<unknown> | BigInt | [unknown] // 原值
  | Convertor // 转换器
  | [string, MappingConfig | Convertor | { [key: string]: MappingConfig }] // 递归映射或数据转换
  | { [key: string]: string | MappingConfig } // 映射

function get (object: unknown, path?: string, defaultValue?: unknown) {
  return path === '' || path === undefined ? object : _get(object, path, defaultValue)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isMappingObject (obj: any): obj is { [key: string]: MappingConfig } {
  return obj && obj.constructor === Object
}

function getContext<T> (data: T, ctx: Context<T>, isTemplateContext = false) {
  const baseContext = isTemplateContext ? {
    ...safeContext,
    ...data
  } : undefined
  return {
    ...baseContext,
    ...ctx,
    value: data,
    get: (key: string) => get(data, key),
    root: (key: string) => get(ctx.root, key)
  }
}

const convertors: { [key: string]: Function | undefined } = {
  '@': String,
  '#': Number,
  '&': (v: unknown) => v !== 'false' && Boolean(v)
}

export default function mapData<S, T> (
  data: S,
  mapping: MappingConfig,
  ctx: Context<S> = {}
): T {
  ctx.root = ctx.root || data
  if (typeof mapping === 'string') {
    let convertor
    if (mapping[0] !== mapping[1]) {
      convertor = convertors[mapping[0]]
      if (convertor) {
        mapping = mapping.substr(1)
      }
    } else {
      mapping = mapping.replace(/^([&#@]){2}/, '$1')
    }
    const ret = mapping.match(/\$\{[^}]+\}/)
      ? template(mapping)(getContext(data, ctx, true))
      : get(data, mapping)
    return convertor ? convertor(ret) : ret
  } else if (typeof mapping === 'function') {
    return mapping(data, getContext(data, ctx)) as unknown as T
  } else if (isMappingObject(mapping)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = {} as any
    for (const key in mapping) {
      result[key] = mapData(data, mapping[key], ctx)
    }
    return result
  } else if (Array.isArray(mapping)) {
    if (mapping.length === 1) {
      return mapping[0] as T
    } else {
      const [dataKey, dataMapping] = mapping
      const value = get(data, dataKey)
      if (Array.isArray(value)) {
        const result = []
        for (const item of value) {
          result.push(mapData(item, dataMapping, ctx))
        }
        return result as unknown as T
      } else {
        return mapData(value, dataMapping, ctx)
      }
    }
  } else {
    // 原值
    return mapping as unknown as T
  }
}
