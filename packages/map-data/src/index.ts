// eslint-disable-next-line @typescript-eslint/no-explicit-any
function _get<T> (object: any | any[], path: string | string[], value: T) {
  const pathArray = Array.isArray(path) ? path : path.split('.').filter(key => key)
  const pathArrayFlat = pathArray.reduce((res, item) => {
    res.push(...item.split('.'))
    return res
  }, [] as string[])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return pathArrayFlat.reduce((obj: any, key: string) => obj && obj[key], object) || value
}

function template (templateString: string, ctx: Record<string, unknown>) {
  // eslint-disable-next-line no-new-func
  const func = new Function(...Object.keys(ctx), `return \`${templateString}\`;`)
  return func(...Object.values(ctx))
}

const safeContext: { [key: string]: undefined } = {}
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
Object.keys(window || global || {}).forEach(key => {
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Filter<T=any> = (item: T, index: number, array: T[]) => unknown;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ReducerCallback<T=any> = <R> (previousValue: R, currentValue: T, currentIndex: number, array: T[]) => R;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Reducer<T=any> = ReducerCallback<T> | [ReducerCallback<T>, any];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ExtraConfig<T=any> = {
  filter?: Filter<T>;
  reducer?: Reducer<T>;
}

export type MappingConfig = string // key 值
  | boolean | number | symbol | Map<unknown, unknown> | Set<unknown> | BigInt | [unknown] // 原值
  | Convertor // 转换器
  | [string, MappingConfig | Convertor | { [key: string]: MappingConfig }, (Filter | ExtraConfig)?] // 递归映射或数据转换
  | { [key: string]: string | MappingConfig } // 映射

function get (object: unknown, path?: string, defaultValue?: unknown) {
  return path === '' || path === undefined ? object : _get(object, path, defaultValue)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isMappingObject (obj: any): obj is { [key: string]: MappingConfig } {
  return obj && obj.constructor === Object
}

function getContext<T> (data: T, ctx: Context<T>, isTemplateContext = false) {
  const baseContext = isTemplateContext
    ? {
        ...safeContext,
        ...data
      }
    : undefined
  return {
    ...baseContext,
    ...ctx,
    value: data,
    get: (key: string, defaultValue?: unknown) => get(data, key, defaultValue),
    root: (key: string, defaultValue?: unknown) => get(ctx.root, key, defaultValue)
  }
}

const convertors: { [key: string]: Convertor | undefined } = {
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
  if (mapping === undefined) {
    // 未配置，返回源数据
    return data as unknown as T
  } else if (typeof mapping === 'string') {
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
      ? template(mapping, getContext(data, ctx, true))
      : get(data, mapping)
    return convertor ? convertor(ret, getContext(data, ctx)) : ret
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
      let value = get(data, dataKey)
      if (value === undefined) {
        // 源数据为 undefined，直接返回 undefined
        return undefined as unknown as T
      } else if (Array.isArray(value)) {
        // 源数据为数组，递归处理数组内元素
        const extraConfig = mapping[2]
        let filter: Filter | undefined // Filter
        let reducer: Reducer | undefined // Reducer
        if (extraConfig) {
          filter = typeof extraConfig === 'function' ? extraConfig : extraConfig.filter
          reducer = typeof extraConfig === 'function' ? undefined : extraConfig.reducer
        }
        if (filter) {
          // 过滤
          value = value.filter(filter)
        }
        // 映射
        let result = []
        for (const item of value) {
          result.push(mapData(item, dataMapping, ctx))
        }
        if (reducer) {
          // 合成
          if (Array.isArray(reducer)) {
            result = result.reduce(reducer[0], reducer[1])
          } else {
            result = result.reduce(reducer)
          }
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
