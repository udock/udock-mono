
import { Vue as _Vue } from 'vue/types/vue'
import { defineComponent, h, provide } from '@vue/composition-api'
import { useForm } from '@udock/vue-plugin-ui'
import Input from './components/Input.vue'

export default function (Vue: typeof _Vue, options: any) {
  Vue.component(options.name || 'UInput', defineComponent({
    setup (props, context) {
      console.log('tag', context.slots)
      const { eventHandlers } = useForm({
        adapter (form, formItem) {
          provide('elForm', form)
          provide('elFormItem', formItem);
          (formItem as typeof formItem & { elFormItemSize: number }).elFormItemSize = formItem.formItemSize
        }
      })
      return () => h(Input, {
        attrs: context.attrs,
        on: {
          ...eventHandlers,
          ...context.listeners
        },
        scopedSlots: context.slots
      })
    }
  }))
}
