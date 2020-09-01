import { useReducer } from 'react';
import safeParseJSON from './utils/safeParseJSON'

type UseSessionOptions<T> = {
  readonly?: boolean;
  defaultValue: T;
}

export default function <T> (key: string, options: UseSessionOptions<T>): [T, React.Dispatch<T>] {

  const value = sessionStorage.getItem(key)
  const defaultValue = safeParseJSON<T>(value, options.defaultValue)

  const [val, setVal] = useReducer(
    (oldValue: T, newValue: T) => {
      if (!options.readonly) {
        sessionStorage.setItem(key, JSON.stringify(newValue))
        return newValue
      } else {
        console.warn('try change readonly sessionStorage: ', key)
        return oldValue
      }
    },
    defaultValue
  )

  return [val, setVal]
}
