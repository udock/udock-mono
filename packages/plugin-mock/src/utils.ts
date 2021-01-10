import { AxiosRequestConfig } from "axios"
import { extend, mapValues } from "lodash"
import qs from "qs"

export type Headers = { [key: string]: string }

export type MockResult<T> = {
  status: number,
  headers?: Headers,
  data: T
}

export function isQueryObject (obj: any): obj is { [key: string]: any } {
  return obj && typeof obj === 'object'
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
export function getQuery (request: AxiosRequestConfig) {
  return extend(
    {},
    qs.parse((request.url || '').split('?')[1]),
    // 合并 req.params 的参数
    mapValues(request.params, (value, key) => JSON.stringify(value))
  )
}
