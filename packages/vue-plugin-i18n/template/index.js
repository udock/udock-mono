import get from 'lodash/get'
import { ref, computed, watch } from '@vue/composition-api'

const langs = {
<% for (let lang of langs) { if (lang !== fallbackLang) { %>  '<%= lang %>': () => import('<%= langsDir %>/<%= lang %>' /* webpackChunkName: "lang_<%= lang %>" */ ),
<% }} %>}

const defaultLang = '<%= defaultLang %>'
const fallbackLang = '<%= fallbackLang %>'
const fallbackLangData = require('<%= langsDir %>/<%= defaultLang %>').default
const langData = ref(fallbackLangData)
const langValue = ref(defaultLang)

const $lang = computed({
  get () {
    return langValue.value
  },
  set (val) {
    if (val === fallbackLang) {
      langData.value = fallbackLangData
    } else {
      langs[val]().then((data) => {
        langData.value = data.default
      })
    }
    langValue.value = val
  }
})

export default function ({ messages } = { messages: {} }) {
  const extraData = ref(messages[fallbackLang])
  const load = async (lang) => {
    const data = messages[lang]
    if (typeof data === 'function') {
      extraData.value = (await data()).default
    } else {
      extraData.value = data
    }
  }
  watch(langValue, load)
  load(fallbackLang)

  return {
    $lang,
    $t (key) {
      return computed({
        get () {
          return get(extraData.value, key, get(langData.value, key, get(fallbackLangData, key)))
        },
        set () {
          //
        }
      }).value
    }
  }
}
