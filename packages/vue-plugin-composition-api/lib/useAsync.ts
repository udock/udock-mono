import { ref, UnwrapRef } from 'vue'

export default function <T> (defaultValue: T, fun: () => Promise<T>) {
  const val = ref(defaultValue);

  (async () => {
    val.value = (await fun()) as UnwrapRef<T>
  })()

  return val
}
