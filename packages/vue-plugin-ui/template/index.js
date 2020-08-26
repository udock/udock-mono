import { inject } from 'vue'
import udockConfig from '@udock/vue-plugin-ui/dist/lib/config-loader.js!@/udock.config.js'<% for (component in components) { %>
import <%= component %> from '@udock/vue-plugin-ui--<%= component %>'
import '@udock/vue-plugin-ui--<%= component %>/src/scss/index.scss'<% } %>

const config = udockConfig.plugins.ui.components
export default function (app, options) {
  if (options.i18n) {
    app.provide('i18n', {
      i18n: options.i18n,
      messages: options.i18nMessages
    })
  }<% for (const component in components) { %>
  app.use(<%= component %>, { ...options, ...config.<%= component %> })<% } %>
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
    onBlur () {
      formItem.onValidate('blur')
    },
    onInput () {
      formItem.onValidate('change')
    },
    onChange () {
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
