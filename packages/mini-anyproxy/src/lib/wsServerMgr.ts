/**
* manage the websocket server
*
*/
import ws from 'ws'
import * as logUtil from './log'

const WsServer = ws.Server;

/**
* get a new websocket server based on the server
* @param @required {object} config
                   {string} config.server
                   {handler} config.handler
*/
export function getWsServer(config: any) {
  const wss = new WsServer({
    server: config.server
  });

  wss.on('connection', config.connHandler);

  wss.on('headers', (headers) => {
    headers.push('x-anyproxy-websocket:true');
  });

  wss.on('error', e => {
    logUtil.error(`error in websocket proxy: ${e.message},\r\n ${e.stack}`);
    console.error('error happened in proxy websocket:', e)
  });

  wss.on('close', (/* e */) => {
    console.error('==> closing the ws server');
  });

  return wss;
}
