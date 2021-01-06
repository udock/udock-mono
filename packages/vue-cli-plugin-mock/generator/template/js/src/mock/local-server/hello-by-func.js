const dsmOk = require('../MockData').success
export default async ({ params }, { success, duration, tunneling }) => {
  await duration(2000) // 模拟延时
  return success(dsmOk({
    msg: 'hello by func'
  }))
  // return tunneling() // 透传
}
