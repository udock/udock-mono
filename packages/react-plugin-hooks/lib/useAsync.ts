import { useState, useEffect } from 'react';

export default function <T> (defaultValue: T, func: () => Promise<T>) {
  const [val, setVal] = useState(defaultValue)

  let isUnmounted = false
  useEffect(() => {
    func().then(value => {
      if (isUnmounted) return
      setVal(value)
    })

    return () => {
      isUnmounted = true;
    }
  })

  return val
}
