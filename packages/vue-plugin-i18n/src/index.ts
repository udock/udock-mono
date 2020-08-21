import { ref } from 'vue'

type KV = {
  [key: string]: string | number | boolean | KV
}

type I18nOptions = {
  messages: { [key: string]: KV }
}

export default (options?: I18nOptions) => {
  return {
    $lang: ref('zh-CN'),
    $t: () => {}
  }
}
