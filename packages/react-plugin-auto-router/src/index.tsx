import React from 'react'

export type AutoRouterOptions<T extends React.Component> = {
  loading: JSX.Element | T
}

export default function <T extends React.Component>(options: AutoRouterOptions<T>): JSX.Element {
  return <></>
}
