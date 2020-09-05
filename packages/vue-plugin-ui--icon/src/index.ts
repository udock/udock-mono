import { Vue as _Vue } from 'vue/types/vue'
import Icon from './components/Icon.vue'
import './scss/index.scss'

export default function (Vue: typeof _Vue, options: any) {
  Vue.component(options.name || 'UIcon', Icon)
}
