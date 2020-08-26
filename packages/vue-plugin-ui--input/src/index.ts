
import { App, defineComponent, h, provide } from 'vue'
import { useForm } from '@udock/vue-plugin-ui'
import Input from './components/Input.vue'

export default function (app: App, options: any) {
  app.component(options.name || 'UInput', defineComponent({
    setup (props, context) {
      const { eventHandlers } = useForm({
        adapter (form, formItem) {
          provide('elForm', form)
          provide('elFormItem', formItem);
          (formItem as typeof formItem & { elFormItemSize: number }).elFormItemSize = formItem.formItemSize
        }
      })
      return () => h(Input, {
        ...context.attrs,
        ...eventHandlers
      }, context.slots)
    }
  }))
}
