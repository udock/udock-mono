import { useReducer } from 'react';
import safeParseJSON from './utils/safeParseJSON'

type UseStorageOptions<T> = {
  readonly?: boolean;
  defaultValue: T;
}

export default function <T> (key: string, options: UseStorageOptions<T>): [T, React.Dispatch<T>] {

  const value = localStorage.getItem(key)
  const defaultValue = safeParseJSON<T>(value, options.defaultValue)

  const [val, setVal] = useReducer(
    (oldValue: T, newValue: T) => {
      if (!options.readonly) {
        localStorage.setItem(key, JSON.stringify(newValue))
        return newValue
      } else {
        console.warn('try change readonly localStorage: ', key)
        return oldValue
      }
    },
    defaultValue
  )

  return [val, setVal]
}
