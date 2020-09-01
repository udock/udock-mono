import { ref, UnwrapRef } from '@vue/composition-api'

export default function <T> (defaultValue: T, promise: Promise<T>) {
  const val = ref(defaultValue)

  promise.then((value) => {
    val.value = value as UnwrapRef<T>
  })

  return val
}
