<template>
  <div class="u-form-item" :class="[{
      'u-form-item--feedback': form$ && form$.statusIcon,
      'is-error': validateState === 'error',
      'is-validating': validateState === 'validating',
      'is-success': validateState === 'success',
      'is-required': isRequired || required,
      'is-no-asterisk': form$ && form$.hideRequiredAsterisk
    },
    sizeClass ? 'u-form-item--' + sizeClass : ''
  ]">
    <LabelWrap
      :is-auto-width="labelStyle && labelStyle.width === 'auto'"
      :update-all="form$.labelWidth === 'auto'">
      <label :for="labelFor" class="u-form-item__label" :style="labelStyle" v-if="label || $slots.label">
        <slot name="label">{{label + form$.labelSuffix}}</slot>
      </label>
    </LabelWrap>
    <div class="u-form-item__content" :style="contentStyle">
      <slot></slot>
      <transition name="u-zoom-in-top">
        <slot
          v-if="validateState === 'error' && showMessage && form$.showMessage"
          name="error"
          :error="validateMessage">
          <div
            class="u-form-item__error"
            :class="{
              'u-form-item__error--inline': typeof inlineMessage === 'boolean'
                ? inlineMessage
                : (form$ && form$.inlineMessage || false)
            }"
          >
            {{validateMessage}}
          </div>
        </slot>
      </transition>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, inject } from '@vue/composition-api'
import { i18nFallback } from '@udock/vue-plugin-ui'
import defaultMessages from '../i18n/langs'
import template from 'lodash/template'
import isObject from 'lodash/isObject'
import isFunction from 'lodash/isFunction'
import noop from 'lodash/noop'
import componentsOptions from '../config/components-options'
// eslint-disable-next-line no-unused-vars
import AsyncValidator, { RuleItem, ValidateError } from '@udock/async-validator'
import get from 'lodash/get'
import LabelWrap from './LabelWrap.vue'

type RuleItemEx = RuleItem & {
  trigger: string;
  label: string;
  revalidate: string[];
}

function getPropByPath (obj: object, path: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let tempObj: any = obj
  path = path.replace(/\[(\w+)\]/g, '.$1')
  path = path.replace(/^\./, '')
  const keyArr = path.split('.')
  let i = 0
  for (let len = keyArr.length; i < len - 1; ++i) {
    const key = keyArr[i]
    if (key in tempObj) {
      tempObj = tempObj[key]
    } else {
      throw new Error('please transfer a valid prop path to form item!')
    }
  }
  return {
    o: tempObj,
    k: keyArr[i],
    v: tempObj[keyArr[i]]
  }
}

export default defineComponent({
  name: 'UFormItem',
  // componentName: 'UFormItem',
  components: {
    LabelWrap
  },
  props: {
    label: String,
    labelWidth: String,
    prop: {
      type: String,
      required: true
    },
    required: Boolean,
    rules: [Object, Array],
    error: String,
    validateStatus: String,
    showMessage: {
      type: Boolean,
      default: true
    },
    customizeError: {
      type: Boolean,
      default: false
    },
    autoFocus: {
      type: Boolean,
      default: true
    },
    labelClass: {
      type: String
    },
    contentClass: {
      type: String
    },
    for: String,
    inlineMessage: {
      type: Boolean,
      default: undefined
    }
  },

  provide () {
    return {
      '#UFormItem': this
    }
  },

  setup () {
    const { i18n, messages } = inject('i18n', i18nFallback)
    return {
      form$: inject('#UForm') as {
        resolveItem: (error: any) => void;
        labelPosition: string;
        addField: (field: any) => void;
        removeField: (field: any) => void;
        inline: boolean;
        labelWidth: string;
        model: any;
        computedRules: RuleItem[];
        validateField: (prop: string, cb?: Function, options?: object) => void;
        autoLabelWidth: string;
      },
      ...i18n({
        messages: messages || defaultMessages
      }),
      formItemSize: '',
      disabled: false,
      initialValue: [],
      $ELEMENT: { size: '' }
    }
  },

  watch: {
    error (value) {
      this.validateMessage = value
      this.validateState = value ? 'error' : ''
    },
    validateStatus (value) {
      this.validateState = value
    }
  },

  computed: {
    validateMessage: {
      get (): string {
        if (this.validateState === 'success') return ''
        const validateError = this.validateError
        if (validateError && validateError.message) {
          const rule = validateError.rule
          const data = Object.assign(rule, {
            label: this.label,
            value: this.fieldValue,
            $ctx: {}
          })
          data.$ctx = data
          const compiled = template(validateError.message, {
            imports: {
              t: (key: string) => template(this.$t(key))(data)
            }
          })
          return compiled(data)
        }
        return ''
      },
      set (v: string) {
        if (this.validateError) {
          this.validateError.message = v
        }
      }
    },
    labelStyle () {
      const ret: { width?: string | number } = {}
      if (this.form$.labelPosition === 'top') return ret
      const labelWidth = this.labelWidth || this.form$.labelWidth
      if (labelWidth) {
        ret.width = labelWidth
      }
      return ret
    },
    contentStyle () {
      const ret: { marginLeft?: string } = {}
      const label = this.label
      if (this.form$.labelPosition === 'top' || this.form$.inline) return ret
      if (!label && !this.labelWidth && this.isNested) return ret
      const labelWidth = this.labelWidth || this.form$.labelWidth
      if (labelWidth === 'auto') {
        if (this.labelWidth === 'auto') {
          ret.marginLeft = this.computedLabelWidth
        } else if (this.form$.labelWidth === 'auto') {
          ret.marginLeft = this.form$.autoLabelWidth
        }
      } else {
        ret.marginLeft = labelWidth
      }
      return ret
    },
    fieldValue: {
      cache: false,
      get (): object | undefined {
        const model = this.form$.model
        if (!model || !this.prop) { return }
        let path = this.prop
        if (path.indexOf(':') !== -1) {
          path = path.replace(/:/, '.')
        }
        return getPropByPath(model, path).v
      },
      set () { /* */ }
    },
    sizeClass (): string {
      return this.formItemSize || (this.$ELEMENT || { size: '' }).size
    },
    labelFor (): string {
      return this.for || this.prop
    }
  },
  data () {
    return {
      mergedRules: [] as RuleItemEx[],
      validateState: '',
      validateDisabled: false,
      validator: {},
      isRequired: false,
      validateError: {},
      silent: false,
      computedLabelWidth: '',
      isNested: false
    } as {
      mergedRules: RuleItemEx[];
      validateState: string;
      validateDisabled: boolean;
      validator: object;
      isRequired: boolean;
      validateError: ValidateError;
      silent: boolean | undefined;
      computedLabelWidth: string;
      isNested: boolean;
    }
  },
  methods: {
    resolveRuleClass (obj: object | object[]) {
      return obj ? isObject(obj) && !Array.isArray(obj) ? [obj] : obj : false
    },
    validate (trigger: string, callback = noop, options: { silent?: boolean; trigger?: string } = {}) {
      const rules = this.getFilteredRule(trigger)
      trigger = trigger || options.trigger || ''
      const cb = (error: { message: string; trigger: string; vm: object } | null) => {
        if (!options.silent) this.form$.resolveItem(error)
        callback(error)
      }
      if (!rules || rules.length === 0) {
        cb(null)
        return true
      }
      this.silent = options.silent
      this.validateState = 'validating'
      const descriptor = {
        [this.prop]: rules
      }
      const validator = new AsyncValidator(descriptor)
      // validator.messages(componentsOptions.validator.messages)
      const model = {
        [this.prop]: this.fieldValue
      }

      validator.validate(model, {
        first: true,
        messages: componentsOptions.validator.messages
      } as {}, (errors) => {
        this.validateState = !errors ? 'success' : 'error'
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.validateError = errors && errors[0] as any
        const itemErrorObj = this.validateMessage !== '' ? { message: this.validateMessage, trigger, vm: this } : null
        cb(itemErrorObj)
      })
    },
    resetField () {
      this.validateState = ''
      this.validateMessage = ''
      const model = this.form$.model
      const value = this.fieldValue
      let path = this.prop
      if (path.indexOf(':') !== -1) {
        path = path.replace(/:/, '.')
      }
      const prop = getPropByPath(model, path)
      if (Array.isArray(value)) {
        this.validateDisabled = true
        prop.o[prop.k] = [].concat(this.initialValue)
      } else {
        this.validateDisabled = true
        prop.o[prop.k] = this.initialValue
      }
    },
    formatArray (v = []) {
      return !Array.isArray(v) && isObject(v) ? [v] : v
    },
    getRules (): RuleItemEx[] {
      return this.mergedRules
    },
    getFilteredRule (trigger: string): RuleItem[] {
      const rules = this.getRules()
      return rules.filter((rule) => {
        return !rule.trigger || rule.trigger.indexOf(trigger) !== -1
      }).map((rule) => {
        rule = { ...rule }
        rule.label = this.label || ''
        return rule
      })
    },
    onValidate (trigger: string) {
      if (this.validateDisabled) {
        this.validateDisabled = false
        return
      }
      this.validate(trigger)
    },
    updateComputedLabelWidth (width: number) {
      this.computedLabelWidth = width ? `${width}px` : ''
    }
  },
  mounted () {
    if (this.prop) {
      this.form$.addField(this)
      let initialValue = this.fieldValue
      if (Array.isArray(initialValue)) {
        initialValue = [...initialValue]
      }
      Object.defineProperty(this, 'initialValue', {
        value: initialValue
      })
      const rules: RuleItemEx[] = this.mergedRules = this.formatArray(this.rules || get(this.form$.computedRules, this.prop))
      if (rules.length === 0 && process.env.NODE_ENV !== 'production') typeof console !== 'undefined' && console.warn(`[@udock/vue-plugin-ui--from] "${this.prop}" rule not found`)
      rules.forEach((rule) => {
        if (rule.validator) {
          rule.validator = rule.validator.bind(this.form$)
        } else if (rule.revalidate) {
          rule.validator = (rule, value, callback) => {
            let revalidate = (rule as RuleItemEx).revalidate
            if (isFunction(revalidate)) {
              revalidate = revalidate(this.form$.model) || []
            }
            if (!Array.isArray(revalidate)) { revalidate = [revalidate] }
            revalidate.forEach((r) => {
              this.form$.validateField(r)
            })
            callback()
          }
        }
      })
      if (rules.length) {
        rules.every(rule => {
          if (rule.required) {
            this.isRequired = true
            return false
          }
        })
      }
    }
  },
  beforeDestroy () {
    this.form$.removeField(this)
  }
})
</script>

<style>

</style>
