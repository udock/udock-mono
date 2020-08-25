import { App, h } from 'vue'
import Icon from './components/Icon.vue'
import './scss/index.scss'

export default function (app: App, options: any) {
  app.component(options.name || 'UIcon', Icon)
}
