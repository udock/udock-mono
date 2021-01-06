import fs from 'fs'
import path from 'path'
import mime from 'mime-types'
import color from 'chalk'
import child_process from 'child_process'
import { Buffer } from 'buffer'
import * as logUtil from './log'
import { networkInterfaces as getNetworkInterfaces } from 'os'

const networkInterfaces = getNetworkInterfaces()

// {"Content-Encoding":"gzip"} --> {"content-encoding":"gzip"}

export function lower_keys (obj: { [key: string]: any }) {
  for (const key in obj) {
    const val = obj[key]
    delete obj[key]

    obj[key.toLowerCase()] = val
  }

  return obj
}

export function merge (baseObj: { [key: string]: any }, extendObj: { [key: string]: any }) {
  for (const key in extendObj) {
    baseObj[key] = extendObj[key]
  }

  return baseObj
}

export function getUserHome() {
  return process.env.HOME || process.env.USERPROFILE || ''
}

export function getAnyProxyHome() {
  const home = path.join(getUserHome(), '/.mini-anyproxy/')
  if (!fs.existsSync(home)) {
    fs.mkdirSync(home)
  }
  return home
}

export function getAnyProxyPath (pathName: string) {
  const home = getAnyProxyHome()
  const targetPath = path.join(home, pathName)
  if (!fs.existsSync(targetPath)) {
    fs.mkdirSync(targetPath)
  }
  return targetPath
}

export function simpleRender (str: string, object: { [key: string]: string }, regexp: RegExp) {
  return String(str).replace(regexp || (/\{\{([^{}]+)\}\}/g), (match, name) => {
    if (match.charAt(0) === '\\') {
      return match.slice(1)
    }
    return (object[name] != null) ? object[name] : ''
  })
}

export function filewalker (root: string, cb: (error: Error | null, ret: any) => void) {
  root = root || process.cwd()

  type RetItem = { name: string; fullPath: string; }
  const ret = {
    directory: [] as RetItem[],
    file: [] as RetItem[]
  }

  fs.readdir(root, (err, list) => {
    if (list && list.length) {
      list.map((item) => {
        const fullPath = path.join(root, item),
          stat = fs.lstatSync(fullPath)

        if (stat.isFile()) {
          ret.file.push({
            name: item,
            fullPath
          })
        } else if (stat.isDirectory()) {
          ret.directory.push({
            name: item,
            fullPath
          })
        }
      })
    }

    cb && cb.apply(null, [null, ret])
  })
}

/*
* 获取文件所对应的content-type以及content-length等信息
* 比如在useLocalResponse的时候会使用到
*/
export function contentType (filepath: string) {
  return mime.contentType(path.extname(filepath))
}

/*
* 读取file的大小，以byte为单位
*/
export function contentLength (filepath: string) {
  try {
    const stat = fs.statSync(filepath)
    return stat.size
  } catch (e) {
    logUtil.printLog(color.red('\nfailed to ready local file : ' + filepath))
    logUtil.printLog(color.red(e))
    return 0
  }
}

/*
* remove the cache before requiring, the path SHOULD BE RELATIVE TO UTIL.JS
*/
export function freshRequire (modulePath: string) {
  delete require.cache[require.resolve(modulePath)]
  return require(modulePath)
}

/*
* format the date string
* @param date Date or timestamp
* @param formatter YYYYMMDDHHmmss
*/
export function formatDate (date: Date, formatter: string) {
  if (typeof date !== 'object') {
    date = new Date(date)
  }
  const transform = function (value: number) {
    return value < 10 ? '0' + value : value + ''
  }
  return formatter.replace(/^YYYY|MM|DD|hh|mm|ss/g, (match: string) => {
    switch (match) {
      case 'YYYY':
        return transform(date.getFullYear())
      case 'MM':
        return transform(date.getMonth() + 1)
      case 'mm':
        return transform(date.getMinutes())
      case 'DD':
        return transform(date.getDate())
      case 'hh':
        return transform(date.getHours())
      case 'ss':
        return transform(date.getSeconds())
      default:
        return ''
    }
  })
}


/**
* get headers(Object) from rawHeaders(Array)
* @param rawHeaders  [key, value, key2, value2, ...]

*/

export function getHeaderFromRawHeaders (rawHeaders: string | any[]) {
  const headerObj: { [key: string]: string | string[]} = {}
  const _handleSetCookieHeader = function (key: string, value: string) {
    if (headerObj[key].constructor === Array) {
      (headerObj[key] as string[]).push(value)
    } else {
      headerObj[key] = [headerObj[key] as string, value]
    }
  }

  if (!!rawHeaders) {
    for (let i = 0; i < rawHeaders.length; i += 2) {
      const key = rawHeaders[i]
      let value = rawHeaders[i + 1]

      if (typeof value === 'string') {
        value = value.replace(/\0+$/g, ''); // 去除 \u0000的null字符串
      }

      if (!headerObj[key]) {
        headerObj[key] = value
      } else {
        // headers with same fields could be combined with comma. Ref: https://www.w3.org/Protocols/rfc2616/rfc2616-sec4.html#sec4.2
        // set-cookie should NOT be combined. Ref: https://tools.ietf.org/html/rfc6265
        if (key.toLowerCase() === 'set-cookie') {
          _handleSetCookieHeader(key, value)
        } else {
          headerObj[key] = headerObj[key] + ',' + value
        }
      }
    }
  }
  return headerObj
}

export function getAllIpAddress () {
  const allIp: string[] = []

  Object.keys(networkInterfaces).map((nic) => {
    networkInterfaces[nic]!.filter((detail) => {
      if (detail.family.toLowerCase() === 'ipv4') {
        allIp.push(detail.address)
      }
    })
  })

  return allIp.length ? allIp : ['127.0.0.1']
}

export function deleteFolderContentsRecursive(dirPath: string, ifClearFolderItself: boolean) {
  if (!dirPath.trim() || dirPath === '/') {
    throw new Error('can_not_delete_this_dir')
  }

  logUtil.info('==>>> clearing cache: ' + dirPath)

  if (fs.existsSync(dirPath)) {
    fs.readdirSync(dirPath).forEach((file) => {
      const curPath = path.join(dirPath, file)
      if (fs.lstatSync(curPath).isDirectory()) {
        deleteFolderContentsRecursive(curPath, true)
      } else { // delete all files
        fs.unlinkSync(curPath)
      }
    })

    if (ifClearFolderItself) {
      try {
        // ref: https://github.com/shelljs/shelljs/issues/49
        const start = Date.now()
        while (true) {
          try {
            fs.rmdirSync(dirPath)
            break
          } catch (er) {
            if (process.platform === 'win32' && (er.code === 'ENOTEMPTY' || er.code === 'EBUSY' || er.code === 'EPERM')) {
              // Retry on windows, sometimes it takes a little time before all the files in the directory are gone
              if (Date.now() - start > 1000) throw er
            } else if (er.code === 'ENOENT') {
              break
            } else {
              throw er
            }
          }
        }
      } catch (e) {
        throw new Error('could not remove directory (code ' + e.code + '): ' + dirPath)
      }
    }
  }
}

export function getFreePort () {
  return new Promise<number>((resolve, reject) => {
    const server = require('net').createServer()
    server.unref()
    server.on('error', reject)
    server.listen(0, () => {
      const port = server.address().port
      server.close(() => {
        resolve(port)
      })
    })
  })
}

export function collectErrorLog (error: any) {
  if (error && error.code && error.toString()) {
    return error.toString()
  } else {
    let result = [error, error.stack].join('\n')
    try {
      const errorString = error.toString()
      if (errorString.indexOf('You may only yield a function') >= 0) {
        result = 'Function is not yieldable. Did you forget to provide a generator or promise in rule file ? \nFAQ http://anyproxy.io/4.x/#faq'
      }
    } catch (e) {}
    return result
  }
}

export function isFunc (source: object) {
  return source && Object.toString.call(source) === '[object Function]'
}

/**
* @param {object} content
* @returns the size of the content
*/
export function getByteSize (content: Buffer) {
  return Buffer.byteLength(content)
}

/*
* identify whether the
*/
export function isIpDomain (domain: string) {
  if (!domain) {
    return false
  }
  const ipReg = /^\d+?\.\d+?\.\d+?\.\d+?$/

  return ipReg.test(domain)
}

export function execScriptSync (cmd: string) {
  let stdout,
    status = 0
  try {
    stdout = child_process.execSync(cmd)
  } catch (err) {
    stdout = err.stdout
    status = err.status
  }

  return {
    stdout: stdout.toString(),
    status
  }
}

export function guideToHomePage () {
  logUtil.info('Refer to http://anyproxy.io for more detail')
}
