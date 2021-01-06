export function success (data) {
  return {
    data: data,
    msg: 'success',
    code: 200
  }
}

export function success$ (data) {
  return {
    msg: 'success',
    code: 200,
    ...data
  }
}
