import { ref, computed, UnwrapRef, nextTick } from '@vue/composition-api'
import safeParseJSON from './utils/safeParseJSON'

type UseSessionOptions<T> = {
  readonly?: boolean;
  defaultValue: T;
}

export default function <T> (key: string, options: UseSessionOptions<T>) {
  const val = ref(safeParseJSON<T>(sessionStorage.getItem(key), options.defaultValue))

  return computed({
    get () {
      return val.value
    },
    set (value) {
      if (!options.readonly) {
        sessionStorage.setItem(key, JSON.stringify(value))
        val.value = value as UnwrapRef<T>
      } else {
        val.value = undefined as UnwrapRef<T>
        nextTick(() => {
          val.value = safeParseJSON<T>(sessionStorage.getItem(key), options.defaultValue)
        })
        console.warn('try change readonly sessionStorage: ', key)
      }
    }
  })
}
