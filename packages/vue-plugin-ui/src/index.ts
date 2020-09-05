import Vue from 'vue'

export default (Vue: Vue, options: any ) => {

}

export const i18nFallback = {
  i18n (options: any) {
    return {
      $t: (key: string) => key
    }
  },
  messages: {}
}

export type Form = {
  statusIcon: boolean;
}

export type FormItem = {
  formItemSize: number;
  validateState: '';
  onValidate: (trigger: string) => void;
}

type Adapter = (form: Form, fromItem: FormItem) => void | { [key: string]: Function }

export function useForm ({ adapter }: { adapter?: Adapter } = {}): {
  form: Form,
  formItem: FormItem,
  eventHandlers: { [key: string]: Function }
} {
  return {} as any
}
