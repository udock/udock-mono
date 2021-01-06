/**
* a util to set and get all configuable constant
*
*/
import path from 'path'

const USER_HOME = process.env.HOME || process.env.USERPROFILE || ''
const DEFAULT_ANYPROXY_HOME = path.join(USER_HOME, '/.anyproxy/')

/**
* return AnyProxy's home path
*/
export function getAnyProxyHome () {
  const ENV_ANYPROXY_HOME = process.env.ANYPROXY_HOME || ''
  return ENV_ANYPROXY_HOME || DEFAULT_ANYPROXY_HOME
}
