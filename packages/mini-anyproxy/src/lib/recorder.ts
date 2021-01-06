//start recording and share a list when required
import Datastore from 'nedb'
import path from 'path'
import fs from 'fs'
import * as logUtil from './log'
import events from 'events'
import iconv from 'iconv-lite'
import fastJson from 'fast-json-stringify'
import * as proxyUtil from './util'

type TypicalCallBack<T> = (error: Error | null, result?: T) => void

type DecodedBodyResult = {
  fileName: string;
  statusCode: number;
  method: string;
  type: string;
  mime: string;
  content: string;
}

type KVMap<T> = {
  [key: string]: T
}

type Info = {
  startTime: number;
  endTime?: number;
  statusCode?: number;
  url: string;
  protocol?: string;
  host: string;
  path: string;
  method: string;
  reqBody?: string;
  resBody?: string;
  req: {
    headers: KVMap<string>
  };
  resHeader?: KVMap<string>
  length?: number;
}

type SingleRecord = {
  _id: number;
  id: number;
  url: string;
  protocol: string;
  host: string;
  path: string;
  method: string;
  statusCode?: number;
  reqBody: string;
  length?: number;
  reqHeader: KVMap<string>;
  resHeader?: KVMap<string>;
  startTime: number;
  endTime?: number;
  duration: number;
  mime: string;
}

const wsMessageStingify = fastJson({
  title: 'ws message stringify',
  type: 'object',
  properties: {
    time: {
      type: 'integer'
    },
    message: {
      type: 'string'
    },
    isToServer: {
      type: 'boolean'
    }
  }
})

const BODY_FILE_PRFIX = 'res_body_'
const WS_MESSAGE_FILE_PRFIX = 'ws_message_'
const CACHE_DIR_PREFIX = 'cache_r'
function getCacheDir() {
  const rand = Math.floor(Math.random() * 1000000),
    cachePath = path.join(proxyUtil.getAnyProxyPath('cache'), './' + CACHE_DIR_PREFIX + rand)

  fs.mkdirSync(cachePath)
  return cachePath
}

function normalizeInfo(id: number, info: Info) {
  const singleRecord = {} as SingleRecord

  //general
  singleRecord._id = id
  singleRecord.id = id
  singleRecord.url = info.url
  singleRecord.host = info.host
  singleRecord.path = info.path
  singleRecord.method = info.method

  //req
  singleRecord.reqHeader = info.req.headers
  singleRecord.startTime = info.startTime
  singleRecord.reqBody = info.reqBody || ''
  singleRecord.protocol = info.protocol || ''

  //res
  if (info.endTime) {
    singleRecord.statusCode = info.statusCode
    singleRecord.endTime = info.endTime
    singleRecord.resHeader = info.resHeader
    singleRecord.length = info.length
    const contentType = info.resHeader!['content-type'] || info.resHeader!['Content-Type']
    if (contentType) {
      singleRecord.mime = contentType.split(';')[0]
    } else {
      singleRecord.mime = ''
    }

    singleRecord.duration = info.endTime - info.startTime
  } else {
    singleRecord.statusCode = 0
    singleRecord.endTime = 0
    singleRecord.resHeader = {}
    singleRecord.length = 0
    singleRecord.mime = ''
    singleRecord.duration = 0
  }

  return singleRecord
}

export default class Recorder extends events.EventEmitter {
  private globalId: number
  private cachePath: string
  private db: Datastore
  private recordBodyMap: any

  constructor(config?: object) {
    super(config)
    this.globalId = 1
    this.cachePath = getCacheDir()
    this.db = new Datastore()
    this.db.persistence.setAutocompactionInterval(5001)

    this.recordBodyMap = [];  // id - body
  }

  emitUpdate(id: number, info?: object) {
    const self = this
    if (info) {
      self.emit('update', info)
    } else {
      self.getSingleRecord(id, (err, doc) => {
        if (!err && !!doc && !!doc[0]) {
          self.emit('update', doc[0])
        }
      })
    }
  }

  emitUpdateLatestWsMessage(id: number, message: object) {
    this.emit('updateLatestWsMsg', message)
  }

  updateRecord(id: number, info: Info) {
    if (id < 0) return
    const self = this
    const db = self.db

    const finalInfo = normalizeInfo(id, info)

    db.update({ _id: id }, finalInfo)
    self.updateRecordBody(id, info)

    self.emitUpdate(id, finalInfo)
  }

  /**
  * This method shall be called at each time there are new message
  *
  */
  updateRecordWsMessage(id: number, message: object) {
    const cachePath = this.cachePath
    if (id < 0) return
    try {
      const recordWsMessageFile = path.join(cachePath, WS_MESSAGE_FILE_PRFIX + id)

      fs.appendFile(recordWsMessageFile, wsMessageStingify(message) + ',', () => {})
    } catch (e) {
      console.error(e)
      logUtil.error(e.message + e.stack)
    }

    this.emitUpdateLatestWsMessage(id, {
      id: id,
      message: message
    })
  }

  updateExtInfo(id: number, extInfo: object) {
    const self = this
    const db = self.db

    db.update({ _id: id }, { $set: { ext: extInfo } }, {}, (err, nums) => {
      if (!err) {
        self.emitUpdate(id)
      }
    })
  }

  appendRecord(info: Info) {
    if (info.req.headers.anyproxy_web_req) { //TODO request from web interface
      return -1
    }
    const self = this
    const db = self.db

    const thisId = self.globalId++
    const finalInfo = normalizeInfo(thisId, info)
    db.insert(finalInfo)
    self.updateRecordBody(thisId, info)

    self.emitUpdate(thisId, finalInfo)
    return thisId
  }

  updateRecordBody(id: number, info: Info) {
    const self = this
    const cachePath = self.cachePath

    if (id === -1) return

    if (!id || typeof info.resBody === 'undefined') return
    //add to body map
    //ignore image data
    const bodyFile = path.join(cachePath, BODY_FILE_PRFIX + id)
    fs.writeFile(bodyFile, info.resBody, () => {})
  }

  /**
  * get body and websocket file
  *
  */
  getBody(id: number, cb: TypicalCallBack<Buffer>) {
    const self = this
    const cachePath = self.cachePath

    if (id < 0) {
      cb && cb(new Error())
    }

    const bodyFile = path.join(cachePath, BODY_FILE_PRFIX + id)
    fs.access(bodyFile, fs.constants.F_OK || fs.constants.R_OK, (err) => {
      if (err) {
        cb && cb(err)
      } else {
        fs.readFile(bodyFile, cb)
      }
    })
  }

  getDecodedBody(id: number, cb: TypicalCallBack<DecodedBodyResult>) {
    const self = this
    const result = {
      method: '',
      type: 'unknown',
      mime: '',
      content: ''
    } as DecodedBodyResult

    self.getSingleRecord(id, (err, doc) => {
      //check whether this record exists
      if (!doc || !doc[0]) {
        cb(new Error('failed to find record for this id'))
        return
      }

      // also put the `method` back, so the client can decide whether to load ws messages
      result.method = doc[0].method

      self.getBody(id, (error, bodyContent) => {
        if (error) {
          cb(error)
        } else if (!bodyContent) {
          cb(null, result)
        } else {
          const record = doc[0],
            resHeader = record.resHeader || {}
          try {
            const headerStr = JSON.stringify(resHeader),
              charsetMatch = headerStr.match(/charset='?([a-zA-Z0-9-]+)'?/),
              contentType = resHeader && (resHeader['content-type'] || resHeader['Content-Type'])

            if (charsetMatch && charsetMatch.length) {
              const currentCharset = charsetMatch[1].toLowerCase()
              if (currentCharset !== 'utf-8' && iconv.encodingExists(currentCharset)) {
                result.content = iconv.decode(bodyContent, currentCharset)
              }

              result.mime = contentType
              result.content = bodyContent.toString()
              result.type = contentType && /application\/json/i.test(contentType) ? 'json' : 'text'
            } else if (contentType && /image/i.test(contentType)) {
              result.type = 'image'
              result.mime = contentType
              result.content = bodyContent.toString()
            } else {
              result.type = contentType
              result.mime = contentType
              result.content = bodyContent.toString()
            }
            result.fileName = path.basename(record.path)
            result.statusCode = record.statusCode!
          } catch (e) {
            console.error(e)
          }
          cb(null, result)
        }
      })
    })
  }

  /**
  * get decoded WebSoket messages
  *
  */
  getDecodedWsMessage(id: number, cb: TypicalCallBack<object>) {
    const self = this
    const cachePath = self.cachePath

    if (id < 0) {
      cb && cb(new Error())
    }

    const wsMessageFile = path.join(cachePath, WS_MESSAGE_FILE_PRFIX + id)

    fs.access(wsMessageFile, fs.constants.F_OK || fs.constants.R_OK, (err) => {
      if (err) {
        cb && cb(err)
      } else {
        fs.readFile(wsMessageFile, 'utf8', (error, content) => {
          if (error) {
            cb && cb(err)
          }

          try {
            // remove the last dash "," if it has, since it's redundant
            // and also add brackets to make it a complete JSON structure
            content = `[${content.replace(/,$/, '')}]`
            const messages = JSON.parse(content)
            cb(null, messages)
          } catch (e) {
            console.error(e)
            logUtil.error(e.message + e.stack)
            cb(e)
          }
        })
      }
    })
  }

  getSingleRecord(id: number, cb: TypicalCallBack<SingleRecord[]>) {
    const self = this
    const db = self.db
    db.find({ _id: id }, cb)
  }

  getSummaryList(cb: TypicalCallBack<object>) {
    const self = this
    const db = self.db
    db.find({}, cb)
  }

  getRecords(idStart: number, limit: number, cb: TypicalCallBack<object>) {
    const self = this
    const db = self.db
    limit = limit || 10
    idStart = typeof idStart === 'number' ? idStart : (self.globalId - limit)
    db.find({ _id: { $gte: idStart } })
      .sort({ _id: 1 })
      .limit(limit)
      .exec(cb)
  }

  clear() {
    const self = this
    proxyUtil.deleteFolderContentsRecursive(self.cachePath, true)
  }
}
