import http from 'http'
import https from 'https'
import chalk from 'chalk'
import certMgr from './lib/certMgr'
import Recorder from './lib/recorder'
import * as logUtil from './lib/log'
import * as util from './lib/util'
import events from 'events'
import * as wsServerMgr from './lib/wsServerMgr'
import { ThrottleGroup } from 'stream-throttle'
import systemProxyMgr from './lib/systemProxyMgr'
import { Socket } from 'net'

// const memwatch = require('memwatch-next');

// setInterval(() => {
//   console.log(process.memoryUsage());
//   const rss = Math.ceil(process.memoryUsage().rss / 1000 / 1000);
//   console.log('Program is using ' + rss + ' mb of Heap.');
// }, 1000);

// memwatch.on('stats', (info) => {
//   console.log('gc !!');
//   console.log(process.memoryUsage());
//   const rss = Math.ceil(process.memoryUsage().rss / 1000 / 1000);
//   console.log('GC !! Program is using ' + rss + ' mb of Heap.');

//   // var heapUsed = Math.ceil(process.memoryUsage().heapUsed / 1000);
//   // console.log("Program is using " + heapUsed + " kb of Heap.");
//   // console.log(info);
// });

const T_TYPE_HTTP = 'http',
  T_TYPE_HTTPS = 'https',
  DEFAULT_TYPE = T_TYPE_HTTP;

const PROXY_STATUS_INIT = 'INIT';
const PROXY_STATUS_READY = 'READY';
const PROXY_STATUS_CLOSED = 'CLOSED';

/**
 *
 * @class ProxyCore
 * @extends {events.EventEmitter}
 */
export class ProxyCore extends events.EventEmitter {
  private status: string
  private proxyPort: number
  private proxyType: string
  private httpProxyServer: null | http.Server
  private requestHandler: null | any
  private proxyRule: any
  private socketIndex: number = 0
  private socketPool: { [key: string]: any }
  proxyHostName: string
  recorder: null | Recorder
  webServerInstance: any

  /**
   * Creates an instance of ProxyCore.
   *
   * @param {object} config - configs
   * @param {number} config.port - port of the proxy server
   * @param {object} [config.rule=null] - rule module to use
   * @param {string} [config.type=http] - type of the proxy server, could be 'http' or 'https'
   * @param {strign} [config.hostname=localhost] - host name of the proxy server, required when this is an https proxy
   * @param {number} [config.throttle] - speed limit in kb/s
   * @param {boolean} [config.forceProxyHttps=false] - if proxy all https requests
   * @param {boolean} [config.silent=false] - if keep the console silent
   * @param {boolean} [config.dangerouslyIgnoreUnauthorized=false] - if ignore unauthorized server response
   * @param {object} [config.recorder] - recorder to use
   * @param {boolean} [config.wsIntercept] - whether intercept websocket
   *
   * @memberOf ProxyCore
   */
  constructor(config: any) {
    super();
    config = config || {}

    this.status = PROXY_STATUS_INIT;
    this.proxyPort = config.port;
    this.proxyType = /https/i.test(config.type || DEFAULT_TYPE) ? T_TYPE_HTTPS : T_TYPE_HTTP;
    this.proxyHostName = config.hostname || 'localhost';
    this.recorder = config.recorder;
    this.socketPool = {}

    if (parseInt(process.versions.node.split('.')[0], 10) < 8) {
      throw new Error('node.js >= v8.x is required for anyproxy');
    } else if (config.forceProxyHttps && !certMgr.ifRootCAFileExists()) {
      logUtil.printLog('You can run `anyproxy-ca` to generate one root CA and then re-run this command');
      throw new Error('root CA not found. Please run `anyproxy-ca` to generate one first.');
    } else if (this.proxyType === T_TYPE_HTTPS && !config.hostname) {
      throw new Error('hostname is required in https proxy');
    } else if (!this.proxyPort) {
      throw new Error('proxy port is required');
    } else if (!this.recorder) {
      throw new Error('recorder is required');
    } else if (config.forceProxyHttps && config.rule && config.rule.beforeDealHttpsRequest) {
      logUtil.printLog('both "-i(--intercept)" and rule.beforeDealHttpsRequest are specified, the "-i" option will be ignored.', logUtil.T_WARN);
      config.forceProxyHttps = false;
    }

    this.httpProxyServer = null;
    this.requestHandler = null;

    // copy the rule to keep the original proxyRule independent
    this.proxyRule = config.rule || {};

    if (config.silent) {
      logUtil.setPrintStatus(false);
    }

    if (config.throttle) {
      logUtil.printLog('throttle :' + config.throttle + 'kb/s');
      const rate = parseInt(config.throttle, 10);
      if (rate < 1) {
        throw new Error('Invalid throttle rate value, should be positive integer');
      }
      global._throttle = new ThrottleGroup({ rate: 1024 * rate }); // rate - byte/sec
    }

    global.__dirname
    // init recorder
    this.recorder = config.recorder;

    // init request handler
    const RequestHandler = util.freshRequire('./requestHandler').default;
    this.requestHandler = new RequestHandler({
      wsIntercept: config.wsIntercept,
      httpServerPort: config.port, // the http server port for http proxy
      forceProxyHttps: !!config.forceProxyHttps,
      dangerouslyIgnoreUnauthorized: !!config.dangerouslyIgnoreUnauthorized
    }, this.proxyRule, this.recorder);
  }

  /**
  * manage all created socket
  * for each new socket, we put them to a map;
  * if the socket is closed itself, we remove it from the map
  * when the `close` method is called, we'll close the sockes before the server closed
  *
  * @param {Socket} the http socket that is creating
  * @returns undefined
  * @memberOf ProxyCore
  */
  handleExistConnections(socket: Socket) {
    const self = this;
    self.socketIndex ++;
    const key = `socketIndex_${self.socketIndex}`;
    self.socketPool[key] = socket;

    // if the socket is closed already, removed it from pool
    socket.on('close', () => {
      delete self.socketPool[key];
    });
  }
  /**
   * start the proxy server
   *
   * @returns ProxyCore
   *
   * @memberOf ProxyCore
   */
  start() {
    const self = this;
    self.socketIndex = 0;
    self.socketPool = {};

    if (self.status !== PROXY_STATUS_INIT) {
      throw new Error('server status is not PROXY_STATUS_INIT, can not run start()');
    }
    new Promise((resolve, reject) => {
      if (self.proxyType === T_TYPE_HTTPS) {
        certMgr.getCertificate(self.proxyHostName, (err, keyContent, crtContent) => {
          if (err) {
            reject(err);
          } else {
            self.httpProxyServer = https.createServer({
              key: keyContent,
              cert: crtContent
            }, self.requestHandler.userRequestHandler);
            resolve();
          }
        });
      } else {
        self.httpProxyServer = http.createServer(self.requestHandler.userRequestHandler);
        resolve();
      }
    }).then(() => {
      //handle CONNECT request for https over http
      self.httpProxyServer!.on('connect', self.requestHandler.connectReqHandler);
    }).then(() => {
      wsServerMgr.getWsServer({
        server: self.httpProxyServer,
        connHandler: self.requestHandler.wsHandler
      });
      // remember all sockets, so we can destory them when call the method 'close';
      self.httpProxyServer!.on('connection', (socket) => {
        self.handleExistConnections.call(self, socket);
      });
    }).then(() => {
      self.httpProxyServer!.listen(self.proxyPort);
    }).then(() => {
      const tipText = (self.proxyType === T_TYPE_HTTP ? 'Http' : 'Https') + ' proxy started on port ' + self.proxyPort;
      logUtil.printLog(chalk.green(tipText));

      if (self.webServerInstance) {
        const webTip = 'web interface started on port ' + self.webServerInstance.webPort;
        logUtil.printLog(chalk.green(webTip));
      }

      let ruleSummaryString = '';
      const ruleSummary = this.proxyRule.summary;
      if (ruleSummary) {
        (async () => {
          if (typeof ruleSummary === 'string') {
            ruleSummaryString = ruleSummary;
          } else {
            ruleSummaryString = await ruleSummary();
          }

          logUtil.printLog(chalk.green(`Active rule is: ${ruleSummaryString}`));
        })()
      }

      self.status = PROXY_STATUS_READY;
      self.emit('ready');
    })
    .catch((err) => {
      const tipText = 'err when start proxy server :(';
      logUtil.printLog(chalk.red(tipText), logUtil.T_ERR);
      logUtil.printLog(err, logUtil.T_ERR);
      self.emit('error', {
        error: err
      });
    })

    return self;
  }

  /**
   * close the proxy server
   *
   * @returns ProxyCore
   *
   * @memberOf ProxyCore
   */
  close() {
    // clear recorder cache
    return new Promise((resolve) => {
      if (this.httpProxyServer) {
        // destroy conns & cltSockets when closing proxy server
        for (const connItem of this.requestHandler.conns) {
          const key = connItem[0];
          const conn = connItem[1];
          logUtil.printLog(`destorying https connection : ${key}`);
          conn.end();
        }

        for (const cltSocketItem of this.requestHandler!.cltSockets) {
          const key = cltSocketItem[0];
          const cltSocket = cltSocketItem[1];
          logUtil.printLog(`endding https cltSocket : ${key}`);
          cltSocket.end();
        }

        if (this.socketPool) {
          for (const key in this.socketPool) {
            this.socketPool[key].destroy();
          }
        }

        this.httpProxyServer.close((error) => {
          if (error) {
            console.error(error);
            logUtil.printLog(`proxy server close FAILED : ${error.message}`, logUtil.T_ERR);
          } else {
            this.httpProxyServer = null;

            this.status = PROXY_STATUS_CLOSED;
            logUtil.printLog(`proxy server closed at ${this.proxyHostName}:${this.proxyPort}`);
          }
          resolve(error);
        });
      } else {
        resolve();
      }
    })
  }
}

/**
 * start proxy server as well as recorder
 */
export class ProxyServer extends ProxyCore {
  private webPort?: number
  /**
   *
   * @param {object} config - config
   */
  constructor(config: any) {
    // prepare a recorder
    const recorder = new Recorder();
    const configForCore = Object.assign({
      recorder,
    }, config);

    super(configForCore);

    this.recorder = recorder;
    this.webServerInstance = null;
  }

  start() {
    return super.start();
  }

  close() {
    return new Promise((resolve, reject) => {
      super.close()
        .then((error) => {
          if (error) {
            resolve(error);
          }
        });

      if (this.recorder) {
        logUtil.printLog('clearing cache file...');
        this.recorder.clear();
      }
      const tmpWebServer = this.webServerInstance;
      this.recorder = null;
      this.webServerInstance = null;
      if (tmpWebServer) {
        logUtil.printLog('closing webserver...');
        tmpWebServer.close((error: Error) => {
          if (error) {
            console.error(error);
            logUtil.printLog(`proxy web server close FAILED: ${error.message}`, logUtil.T_ERR);
          } else {
            logUtil.printLog(`proxy web server closed at ${this.proxyHostName} : ${this.webPort}`);
          }

          resolve(error);
        })
      } else {
        resolve(null);
      }
    });
  }
}

export const ProxyRecorder = Recorder

export const utils = {
  systemProxyMgr,
  certMgr
};
