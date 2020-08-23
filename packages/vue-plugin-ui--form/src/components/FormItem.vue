<template>
  <div class="u-form-item" :class="{
    'is-error': validateState === 'error' && !silent && !form.customizeError && !customizeError,
    'is-customize-error': validateState === 'error' && (form.customizeError || customizeError),
    'is-validating ivu-form-item-validating': validateState === 'validating',
    'is-required': isRequired || required
  }">
    <label :for="prop" class="u-form-item__label" :class="labelClass || form.labelClass" v-bind:style="labelStyle" v-if="label">
      <slot name="label">{{label + form.labelSuffix}}</slot>
    </label>
    <div class="u-form-item__content" :class="contentClass || form.contentClass" v-bind:style="contentStyle">
      <slot></slot>
      <transition name="el-zoom-in-top">
        <div v-if="validateState === 'error' && showMessage && form.showMessage">
          <div
            class="u-form-item__error u-form-item__custom-error"
            v-if="$slots.customError">
            <slot :errorMessage="validateMessage" name="customError"></slot><br><br>
          </div>
          <div class="u-form-item__error">{{validateMessage}}</div>
        </div>
      </transition>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import defaultMessages from '../i18n/langs'
import template from 'lodash/template'
import isObject from 'lodash/isObject'
import isFunction from 'lodash/isFunction'
import noop from 'lodash/noop'
import componentsOptions from '../config/components-options'
import AsyncValidator, { RuleItem } from 'async-validator'
import get from 'lodash/get'

type ValidateError = {
  label?: string;
  message?: {
    data: object;
    value: string;
  };
}

type Validator = (rule: Rule, value: object, callback: Function, source: object, options: object) => void

type Rule = {
  required: boolean;
  validator: Validator;
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
  componentName: 'UFormItem',
  props: {
    i18n: {
      type: Function,
      required: true
    },
    i18nMessages: Object,
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
    }
  },

  provide () {
    return {
      '#UFormItem': this
    }
  },
  inject: {
    form: '#UForm'
  },

  setup (props) {
    return {
      ...props.i18n({
        messages: props.i18nMessages || defaultMessages
      })
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
        const rule = this.validateError
        if (rule && rule.message) {
          const r = rule.message.data
          const compiled = template(rule.message.value, {
            imports: {
              t: (key: string) => template(this.$t(key))(r)
            }
          })
          return compiled(r)
        }
        return ''
      },
      set (v: string) {
        if (this.validateError) {
          this.validateError.message = {
            data: {},
            value: v
          }
        }
      }
    },
    labelStyle () {
      const ret: { width?: string } = {}
      if (this.form.labelPosition === 'top') return ret
      const labelWidth = this.labelWidth || this.form.labelWidth
      if (labelWidth) {
        ret.width = labelWidth
      }
      return ret
    },
    contentStyle () {
      const ret: { marginLeft?: string } = {}
      if (this.form.labelPosition === 'top' || this.form.inline) return ret
      const labelWidth = this.labelWidth || this.form.labelWidth
      if (labelWidth) {
        ret.marginLeft = labelWidth
      }
      return ret
    },
    fieldValue: {
      cache: false,
      get (): object | undefined {
        const model = this.form.model
        if (!model || !this.prop) { return }
        let path = this.prop
        if (path.indexOf(':') !== -1) {
          path = path.replace(/:/, '.')
        }
        return getPropByPath(model, path).v
      },
      set () { /* */ }
    }
  },
  data () {
    return {
      mergedRules: [],
      validateState: '',
      validateDisabled: false,
      validator: {},
      isRequired: false,
      validateError: {},
      silent: false
    } as {
      validateState: string;
      validateDisabled: boolean;
      validator: object;
      isRequired: boolean;
      validateError: ValidateError;
      silent: boolean | undefined;
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
        if (!options.silent) this.form.resolveItem(error)
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
      const model = this.form.model
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
    getRules (): (RuleItem & { trigger: string })[] {
      return this.mergedRules
    },
    getFilteredRule (trigger: string): RuleItem[] {
      const rules = this.getRules()
      return rules.filter((rule) => {
        return !rule.trigger || rule.trigger.indexOf(trigger) !== -1
      }).map((rule) => {
        return {
          ...rule,
          message: {
            data: rule,
            value: rule.message
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any
        }
      })
    },
    onFieldBlur () {
      this.validate('blur')
    },
    onFieldChange () {
      if (this.validateDisabled) {
        this.validateDisabled = false
        return
      }
      this.validate('change')
    }
  },
  mounted () {
    if (this.prop) {
      this.form.addField(this)
      let initialValue = this.fieldValue
      if (Array.isArray(initialValue)) {
        initialValue = [...initialValue]
      }
      Object.defineProperty(this, 'initialValue', {
        value: initialValue
      })
      const rules: Rule[] = this.mergedRules = this.formatArray(this.rules || get(this.form.computedRules, this.prop))
      if (rules.length === 0 && process.env.NODE_ENV !== 'production') typeof console !== 'undefined' && console.warn(`[@udock/vue-plugin-ui--from] "${this.prop}" rule not found`)
      rules.forEach((rule) => {
        if (rule.validator) {
          rule.validator = rule.validator.bind(this.form)
        } else if (rule.revalidate) {
          rule.validator = (rule: Rule, value, callback) => {
            let revalidate = rule.revalidate
            if (isFunction(revalidate)) {
              revalidate = revalidate(this.form.model) || []
            }
            if (!Array.isArray(revalidate)) { revalidate = [revalidate] }
            revalidate.forEach((r) => {
              this.formValidateField(r)
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
  beforeUnmount () {
    this.form.removeField(this)
  }
})
</script>

<style>

</style>
