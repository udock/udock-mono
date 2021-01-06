import { Vue as _Vue } from 'vue/types/vue'
import { defineComponent, h, provide } from '@vue/composition-api'
import { useForm, Adapter } from '@udock/vue-plugin-ui'
import { Input, Select, Option } from 'element-ui'

import 'element-ui/packages/theme-chalk/src/icon.scss'
import 'element-ui/packages/theme-chalk/src/input.scss'
import 'element-ui/packages/theme-chalk/src/select.scss'

const adapter: Adapter = (form, formItem) => {
  provide('elForm', form)
  provide('elFormItem', formItem);
  (formItem as typeof formItem & { elFormItemSize: number }).elFormItemSize = formItem.formItemSize
}

export default (Vue: typeof _Vue, options: any) => {
  Vue.component('ElInput', defineComponent({
    setup (props, context) {
      const { eventHandlers } = useForm({ adapter })
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

  Vue.component('ElOption', Option)

  Vue.component('ElSelect', defineComponent({
    setup (props, context) {
      const { eventHandlers } = useForm({ adapter })
      return () => h(Select, {
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

