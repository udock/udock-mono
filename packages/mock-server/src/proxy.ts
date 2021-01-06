// @ts-ignore
import * as AnyProxy from '@udock/mini-anyproxy'
import rule from './rule/mock'

type ProxyServerOptions ={
  port: number
}

let proxyServer

export default {
  start (opts: ProxyServerOptions) {
    const options = {
      port: opts.port,
      rule,
      throttle: 10000,
      forceProxyHttps: true,
      wsIntercept: true,
      silent: false
    }
    proxyServer = new AnyProxy.ProxyServer(options)

    proxyServer.on('ready', () => {

    })

    proxyServer.on('error', (e: Error) => {

    })

    proxyServer.start()
  }
}

