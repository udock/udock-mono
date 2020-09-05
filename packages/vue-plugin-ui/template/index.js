import { inject } from '@vue/composition-api'
import udockConfig from '@udock/vue-plugin-ui/dist/lib/config-loader.js!@/udock.config.js'<% for (component in components) { %>
import <%= component %> from '@udock/vue-plugin-ui--<%= component %>'
import '@udock/vue-plugin-ui--<%= component %>/src/scss/index.scss'<% } %>

const config = udockConfig.plugins.ui.components
export default function (Vue, options) {
  if (options.i18n) {
    Vue.mixin({
      provide: {
        i18n: {
          i18n: options.i18n,
          messages: options.i18nMessages
        }
      }
    })
  }<% for (const component in components) { %>
  Vue.use(<%= component %>, { ...options, ...config.<%= component %> })<% } %>
}

export const i18nFallback = {
  i18n () {
    return {
      $t: (key) => key
    }
  },
  messages: {}
}

export function useForm ({ adapter } = {}) {
  const form = inject('#UForm', {
    statusIcon: true
  })

  const formItem = inject('#UFormItem', {
    formItemSize: 0,
    validateState: '',
    onValidate: () => { /**/ }
  })

  const eventHandlers = {
    blur () {
      formItem.onValidate('blur')
    },
    input () {
      formItem.onValidate('change')
    },
    change () {
      formItem.onValidate('change')
    }
  }

  if (adapter) {
    Object.assign(eventHandlers, adapter(form, formItem))
  }

  return {
    form,
    formItem,
    eventHandlers
  }
}
