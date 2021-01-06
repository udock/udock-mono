import chalk from 'chalk'
import * as util from './util'

let ifPrint = true
let logLevel = 0
const LogLevelMap = {
  tip: 0,
  system_error: 1,
  rule_error: 2,
  warn: 3,
  debug: 4,
}

export function setPrintStatus(status: boolean) {
  ifPrint = !!status
}

export function setLogLevel(level: string) {
  logLevel = parseInt(level, 10)
}

export function printLog(content: string, type?: number) {
  if (!ifPrint) {
    return
  }

  const timeString = util.formatDate(new Date(), 'YYYY-MM-DD hh:mm:ss')
  switch (type) {
    case LogLevelMap.tip: {
      if (logLevel > 0) {
        return
      }
      console.log(chalk.cyan(`[AnyProxy Log][${timeString}]: ` + content))
      break
    }

    case LogLevelMap.system_error: {
      if (logLevel > 1) {
        return
      }
      console.error(chalk.red(`[AnyProxy ERROR][${timeString}]: ` + content))
      break
    }

    case LogLevelMap.rule_error: {
      if (logLevel > 2) {
        return
      }

      console.error(chalk.red(`[AnyProxy RULE_ERROR][${timeString}]: ` + content))
      break
    }

    case LogLevelMap.warn: {
      if (logLevel > 3) {
        return
      }

      console.error(chalk.yellow(`[AnyProxy WARN][${timeString}]: ` + content))
      break
    }

    case LogLevelMap.debug: {
      console.log(chalk.cyan(`[AnyProxy Log][${timeString}]: ` + content))
      return
    }

    default : {
      console.log(chalk.cyan(`[AnyProxy Log][${timeString}]: ` + content))
      break
    }
  }
}

export function debug (content: string) {
  printLog(content, LogLevelMap.debug)
}

export function info (content: string) {
  printLog(content, LogLevelMap.tip)
}

export function warn (content: string) {
  printLog(content, LogLevelMap.warn)
}

export function error (content: string) {
  printLog(content, LogLevelMap.system_error)
}

export function ruleError (content: string) {
  printLog(content, LogLevelMap.rule_error)
}

export const T_TIP = LogLevelMap.tip
export const T_ERR = LogLevelMap.system_error
export const T_RULE_ERROR = LogLevelMap.rule_error
export const T_WARN = LogLevelMap.warn
export const T_DEBUG = LogLevelMap.debug
