<template>
  <form class="u-form" :class="[
    labelPosition ? 'u-form--label-' + labelPosition : '',
    { 'u-form--inline': inline }
  ]">
    <slot></slot>
  </form>
</template>

<script lang="ts">
import { defineComponent, inject } from 'vue'
import FormItem from './FormItem.vue'
import { i18nFallback } from '@udock/vue-plugin-ui'
import componentsOptions from '../config/components-options'
import defaultMessages from '../i18n/langs'

export default defineComponent({
  name: 'UForm',
  componentName: 'UForm',

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
      fields: []
    } as {
      fields: Array<typeof FormItem>;
    }
  },
  computed: {
    computedRules (): object {
      return Object.assign({}, componentsOptions.validator.rules, this.rules)
    }
  },
  methods: {
    resolveItem (error: Error) {
      this.$emit('handle-item', error)
    },
    addField (field: typeof FormItem) {
      if (field) {
        this.fields.push(field)
      }
    },
    removeField (field: typeof FormItem) {
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
    }
  }
})
</script>

<style>

</style>
