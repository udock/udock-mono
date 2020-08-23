import { App, h } from 'vue'
import Form from './components/Form.vue'
import FormItem from './components/FormItem.vue'

export default function (app: App, options: any) {
  app.component(options.name || 'UForm', {
    setup (props: any, context: any) {
      return () => h(Form, {
        i18n: options.i18n,
        i18nMessages: options.i18nMessages,
        ...props
      }, context.slots)
    }
  }).component(options.name || 'UFormItem', {
    setup (props: any, context: any) {
      return () => h(FormItem, {
        i18n: options.i18n,
        i18nMessages: options.i18nMessages,
        ...props
      }, context.slots)
    }
  })
}
