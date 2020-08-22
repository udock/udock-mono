import { App, h } from 'vue'
import Input from './components/Input.vue'

export default function (app: App, options: any) {
  app.component(options.name || 'UInput', {
    setup (props: any, context: any) {
      return () => h(Input as any, {
        i18n: options.i18n,
        i18nMessages: options.i18nMessages,
        ...props
      }, context.slots)
    }
  })
}
