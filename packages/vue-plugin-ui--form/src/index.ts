import { App, h } from 'vue'
import Form from './components/Form.vue'

export default function (app: App, options: any) {
  app.component(options.name || 'UForm', {
    setup (props: any, context: any) {
      return () => h(Form as any, {
        i18n: options.i18n,
        i18nMessages: options.i18nMessages,
        ...props
      }, context.slots)
    }
  })
}
