import { App, h, defineComponent } from 'vue'
import Form from './components/Form.vue'
import FormItem from './components/FormItem.vue'
import componentsOptions from './config/components-options'

type FormOptions = {
  name: string;
  i18n: Function;
  i18nMessages: object;
  validator: {
    rules: string;
    messages: string;
  };
}

export default function (app: App, options: FormOptions) {
  if (options.validator) {
    Object.assign(componentsOptions.validator.rules, options.validator.rules)
    Object.assign(componentsOptions.validator.messages, options.validator.messages)
  }

  app.component(options.name || 'UForm', defineComponent({
    setup (props, context) {
      return () => h(Form, {
        i18n: options.i18n,
        i18nMessages: options.i18nMessages,
        ...props
      }, context.slots)
    }
  })).component(options.name || 'UFormItem', defineComponent({
    setup (props, context) {
      return () => h(FormItem, {
        i18n: options.i18n,
        i18nMessages: options.i18nMessages,
        ...props
      }, context.slots)
    }
  }))
}

const formatRegExp = /%[sdj%]/g
function format (f: string, args: (string | number)[]) {
  let i = 0
  if (typeof f === 'string') {
    const str = String(f).replace(formatRegExp, (x) => {
      if (x === '%%') {
        return '%'
      }

      if (i >= args.length) {
        return x
      }

      switch (x) {
        case '%s':
          return String(args[i++])

        case '%d':
          return Number(args[i++]) + ''

        case '%j':
          try {
            return JSON.stringify(args[i++])
          } catch (_) {
            return '[Circular]'
          }
        default:
          return x
      }
    })
    return str
  }

  return f
}

export function defaultMessagesI18nWrapper (i18n: Function) {
  const { $t: t } = i18n()
  return (key: string) => {
    return (...args: (string | number)[]) => format(t(key), args)
  }
}
