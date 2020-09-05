<template>
  <form class="u-form" :class="[
    labelPosition ? 'u-form--label-' + labelPosition : '',
    { 'u-form--inline': inline }
  ]">
    <slot></slot>
  </form>
</template>

<script lang="ts">
import { defineComponent, inject } from '@vue/composition-api'
import { i18nFallback } from '@udock/vue-plugin-ui'
import componentsOptions from '../config/components-options'
import defaultMessages from '../i18n/langs'

type FormItem = {
  prop: string;
  resetField: () => void;
  validate: (trigger: string, callback: any, options: any) => any
}

export default defineComponent({
  name: 'UForm',
  // componentName: 'UForm',

  props: {
    model: Object,
    rules: Object,
    labelPosition: String,
    labelWidth: String,
    labelSuffix: {
      type: String,
      default: ''
    },
    inline: Boolean,
    showMessage: {
      type: Boolean,
      default: true
    },
    customizeError: Boolean,
    labelClass: {
      type: String
    },
    contentClass: {
      type: String
    },
    hideRequiredAsterisk: {
      type: Boolean,
      default: false
    },
    inlineMessage: {
      type: Boolean,
      default: undefined
    }
  },

  provide () {
    return {
      '#UForm': this
    }
  },

  setup () {
    const { i18n, messages } = inject('i18n', i18nFallback)
    return {
      ...i18n({
        messages: messages || defaultMessages
      }),
      statusIcon: true
    }
  },
  watch: {
    rules () {
      this.validate()
    }
  },
  data () {
    return {
      fields: [],
      potentialLabelWidthArr: []
    } as {
      fields: Array<FormItem>;
      potentialLabelWidthArr: number[];
    }
  },
  computed: {
    computedRules (): object {
      return Object.assign({}, componentsOptions.validator.rules, this.rules)
    },
    autoLabelWidth () {
      if (!this.potentialLabelWidthArr.length) return 0
      const max = Math.max(...this.potentialLabelWidthArr)
      return max ? `${max}px` : ''
    }
  },
  methods: {
    resolveItem (error: Error) {
      this.$emit('handle-item', error)
    },
    addField (field: FormItem) {
      if (field) {
        this.fields.push(field)
      }
    },
    removeField (field: FormItem) {
      if (field.prop) {
        this.fields.splice(this.fields.indexOf(field), 1)
      }
    },
    resetFields () {
      this.fields.forEach(field => {
        field.resetField()
      })
    },
    validate (callback?: Function, options?: object) {
      let count = 0
      if (this.fields.length === 0 && callback) {
        callback(null)
        return
      }
      const allItemError: object[] = []
      this.fields.forEach((field) => {
        field.validate('', (itemError: object) => {
          if (itemError) {
            allItemError.push(itemError)
          }
          if (typeof callback === 'function' && ++count === this.fields.length) {
            callback(allItemError.length === 0 ? null : allItemError)
          }
        }, Object.assign({ trigger: 'form', silent: false }, options))
      })
    },
    validateField (prop: string, cb?: Function, options?: object) {
      const field = this.fields.filter(field => field.prop === prop)[0]
      if (!field) { throw new Error('must call validateField with valid prop string!') }
      field.validate('', cb, Object.assign({ trigger: 'field' }, options))
    },
    getLabelWidthIndex (width: number) {
      const index = this.potentialLabelWidthArr.indexOf(width)
      // it's impossible
      if (index === -1) {
        throw new Error('[UForm]unpected width: ' + width)
      }
      return index
    },
    registerLabelWidth (val: number, oldVal: number) {
      if (val && oldVal) {
        const index = this.getLabelWidthIndex(oldVal)
        this.potentialLabelWidthArr.splice(index, 1, val)
      } else if (val) {
        this.potentialLabelWidthArr.push(val)
      }
    },
    deregisterLabelWidth (val: number) {
      const index = this.getLabelWidthIndex(val)
      this.potentialLabelWidthArr.splice(index, 1)
    }
  }
})
</script>

<style>

</style>
