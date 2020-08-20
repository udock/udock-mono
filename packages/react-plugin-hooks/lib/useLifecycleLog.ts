import { useEffect, useLayoutEffect } from 'react';

export default function (name: string) {
  useEffect(() => {
    console.log(`[${name}]: componentDidMount/Update(useEffect)`)
    return () => {
      console.log(`[${name}]: componentWillUnmount(useEffect)`)
    }
  })

  useLayoutEffect(() => {
    console.log(`[${name}]: componentDidMount/Update(useLayoutEffect)`)
    return () => {
      console.log(`[${name}]: componentWillUnmount(useLayoutEffect)`)
    }
  })
}
