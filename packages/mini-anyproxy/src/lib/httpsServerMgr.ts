//manage https servers
import https from 'https'
import tls, { SecureContext } from 'tls'
import crypto from 'crypto'
import chalk from 'chalk'
import certMgr from './certMgr'
import * as logUtil from './log'
import * as util from './util'
import * as wsServerMgr from './wsServerMgr'
import constants from 'constants'
import AsyncTask from 'async-task-mgr'

type TypicalCallBack<T> = (error: Error | null, result?: T) => void

const createSecureContext = tls.createSecureContext || (crypto as any).createSecureContext
//using sni to avoid multiple ports
function SNIPrepareCert(serverName: string, SNICallback: (error: Error | null, ctx: SecureContext) => void) {
  let keyContent: string
  let crtContent: string
  let ctx: SecureContext

  new Promise((resolve, reject) => {
    certMgr.getCertificate(serverName, (err, key, crt) => {
      if (err) {
        reject(err)
      } else {
        keyContent = key
        crtContent = crt
        resolve()
      }
    })
  }).then(() => {
    ctx = createSecureContext({
      key: keyContent,
      cert: crtContent
    })
  }).then(() => {
    const tipText = 'proxy server for __NAME established'.replace('__NAME', serverName)
    logUtil.printLog(chalk.yellow(chalk.bold('[internal https]')) + chalk.yellow(tipText))
    SNICallback(null, ctx)
  }).catch((err) => {
    logUtil.printLog('err occurred when prepare certs for SNI - ' + err, logUtil.T_ERR)
    logUtil.printLog('err occurred when prepare certs for SNI - ' + err.stack, logUtil.T_ERR)
  })
}

//config.port - port to start https server
//config.handler - request handler

type ServerConfig = {
  port?: number;
  handler: any;
  ip?: string;
  wsHandler?: any;
}

/**
 * Create an https server
 *
 * @param {object} config
 * @param {number} config.port
 * @param {function} config.handler
 */
function createHttpsServer(config: ServerConfig) {
  if (!config || !config.port || !config.handler) {
    throw (new Error('please assign a port'))
  }

  return new Promise<https.Server>((resolve) => {
    certMgr.getCertificate('anyproxy_internal_https_server', (err, keyContent, crtContent) => {
      const server = https.createServer({
        secureOptions: constants.SSL_OP_NO_SSLv3 || constants.SSL_OP_NO_TLSv1,
        SNICallback: SNIPrepareCert,
        key: keyContent,
        cert: crtContent
      }, config.handler).listen(config.port)
      resolve(server)
    })
  })
}

/**
* create an https server that serving on IP address
* @param @required {object} config
* @param @required {string} config.ip the IP address of the server
* @param @required {number} config.port the port to listen on
* @param @required {function} handler the handler of each connect
*/
function createIPHttpsServer(config: ServerConfig) {
  if (!config || !config.port || !config.handler) {
    throw (new Error('please assign a port'))
  }

  if (!config.ip) {
    throw (new Error('please assign an IP to create the https server'))
  }

  return new Promise<https.Server>((resolve) => {
    certMgr.getCertificate(config.ip!, (err, keyContent, crtContent) => {
      const server = https.createServer({
        secureOptions: constants.SSL_OP_NO_SSLv3 || constants.SSL_OP_NO_TLSv1,
        key: keyContent,
        cert: crtContent
      }, config.handler).listen(config.port)

      resolve(server)
    })
  })
}

// type CallBack<T> = {
//   (error: null, result: T): void
//   (error: Error): void
// }

/**
 *
 *
 * @class httpsServerMgr
 * @param {object} config
 * @param {function} config.handler handler to deal https request
 *
 */
export default class httpsServerMgr {
  private instanceDefaultHost: string
  private httpsAsyncTask: AsyncTask
  private handler: any
  private wsHandler: any

  constructor(config: ServerConfig) {
    if (!config || !config.handler) {
      throw new Error('handler is required')
    }
    this.instanceDefaultHost = '127.0.0.1'
    this.httpsAsyncTask = new AsyncTask()
    this.handler = config.handler
    this.wsHandler = config.wsHandler
  }

  getSharedHttpsServer(hostname: string) {
    // ip address will have a unique name
    const finalHost = util.isIpDomain(hostname) ? hostname : this.instanceDefaultHost

    type ServerInfo = { host: string; port: number; }
    const self = this
    function prepareServer(callback: TypicalCallBack<ServerInfo>) {
      let instancePort: number
      util.getFreePort()
        .then(async (port) => {
          instancePort = port
          let httpsServer = null

          // if ip address passed in, will create an IP http server
          if (util.isIpDomain(hostname)) {
            httpsServer = await createIPHttpsServer({
              ip: hostname,
              port,
              handler: self.handler
            })
          } else {
            httpsServer = await createHttpsServer({
              port,
              handler: self.handler
            })
          }

          wsServerMgr.getWsServer({
            server: httpsServer,
            connHandler: self.wsHandler
          })

          httpsServer.on('upgrade', (req, cltSocket, head) => {
            logUtil.debug('will let WebSocket server to handle the upgrade event')
          })

          const result = {
            host: finalHost,
            port: instancePort,
          }
          callback(null, result)
          return result
        })
        .catch((e: Error) => {
          callback(e)
        })
    }

    return new Promise((resolve, reject) => {
      // each ip address will gain a unit task name,
      // while the domain address will share a common task name
      self.httpsAsyncTask.addTask<ServerInfo>(`createHttpsServer-${finalHost}`, prepareServer, (error, serverInfo) => {
        if (error) {
          reject(error)
        } else {
          resolve(serverInfo)
        }
      })
    })
  }
}
