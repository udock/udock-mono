import { Vue as _Vue } from 'vue/types/vue'
import mock, { MockOptions } from '@udock/plugin-mock'

export default function (Vue: typeof _Vue, options: MockOptions = {}) {
  options.load = options.load || ((path: string) => {
    const m = require('@/mock/' + path)
    console.log('=> path: ', path)
    return m.default || m
  })
  mock.init(options)
}
