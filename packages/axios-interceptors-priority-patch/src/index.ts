import { __PATCHED__ } from './symbols'
import axios from 'axios'

const InterceptorManager = axios.interceptors.request.constructor as Function & { __PATCHED__?: symbol }

type PRIORITY = {
  LOW: number;
  NORMAL: number;
  HEIGHT: number;
}

declare module 'axios' {
  export interface AxiosInterceptorManager<V> {
    PRIORITY: PRIORITY;
  }
}

InterceptorManager.prototype.PRIORITY = {
  LOW: -10000,
  NORMAL: 0,
  HEIGHT: 10000
}

if (InterceptorManager.__PATCHED__ !== __PATCHED__) {
  InterceptorManager.__PATCHED__ === __PATCHED__

  const INITIAL_ID = 100000000

  let id = INITIAL_ID
  const genId = () => ++id

  InterceptorManager.prototype.use = function (fulfilled: unknown, rejected: unknown, priority: number) {
    this.handlers.push({
      fulfilled,
      rejected,
      priority,
      id: genId()
    });
    this.handlers.sort((a: { priority: number }, b: { priority: number }) => {
      return (a.priority || 0) - (b.priority || 0)
    })
    return id
  }

  InterceptorManager.prototype.reject = function (id: number) {
    if (id > INITIAL_ID) {
      id = this.handlers.findIndex((item: { id?: number }) => item.id === id)
    }
    if (this.handlers[id]) {
      this.handlers[id] = null
    }
  }
}

axios.interceptors.request.PRIORITY.HEIGHT
