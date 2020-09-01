import { ref, computed, UnwrapRef, nextTick } from '@vue/composition-api'
import safeParseJSON from './utils/safeParseJSON'

type UseStorageOptions<T> = {
  readonly?: boolean;
  defaultValue: T;
}

export default function <T> (key: string, options: UseStorageOptions<T>) {
  const val = ref(safeParseJSON<T>(localStorage.getItem(key), options.defaultValue))

  return computed({
    get () {
      return val.value
    },
    set (value) {
      if (!options.readonly) {
        localStorage.setItem(key, JSON.stringify(value))
        val.value = value as UnwrapRef<T>
      } else {
        val.value = undefined as UnwrapRef<T>
        nextTick(() => {
          val.value = safeParseJSON<T>(localStorage.getItem(key), options.defaultValue)
        })
        console.warn('try change readonly localStorage: ', key)
      }
    }
  })
}
