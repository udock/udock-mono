<template>
  <div :class="[
    type === 'textarea' ? 'u-textarea' : 'u-input',
    size ? 'u-input--' + size : '',
    {
      'is-disabled': disabled,
      'u-input-group': $slots.prepend || $slots.append,
      'u-input-group--append': $slots.append,
      'u-input-group--prepend': $slots.prepend
    }
  ]">
    <template v-if="type !== 'textarea'">
      <!-- 前置元素 -->
      <div class="u-input-group__prepend" v-if="$slots.prepend">
        <slot name="prepend"></slot>
      </div>
      <!-- input 图标 -->
      <slot name="icon">
        <i class="u-input__icon"
          :class="[
            'u-icon-' + icon,
            onIconClick ? 'is-clickable' : ''
          ]"
          v-if="icon && !validating"
          @click="handleIconClick">
        </i>
      </slot>
      <input
        v-if="type!=='textarea'"
        ref="input"
        class="u-input__inner"
        v-bind="$props"
        :autocomplete="autoComplete"
        :value="currentValue"
        @keydown="handleInput"
        @keyup="handleInput"
        @input="handleInput"
        @focus="handleFocus"
        @blur="handleBlur"
      >
      <i class="u-input__icon u-icon-loading u-anim-load-loop is-validating" v-if="validating"></i>
      <!-- 后置元素 -->
      <div class="u-input-group__append" v-if="$slots.append">
        <slot name="append"></slot>
      </div>
    </template>
    <textarea
      v-else
      ref="textarea"
      class="u-textarea__inner"
      v-bind="$props"
      :value="currentValue"
      @input="handleInput"
      :style="textareaStyle"
      @keydown="handleInput"
      @keyup="handleInput"
      @focus="handleFocus"
      @blur="handleBlur">
    </textarea>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import defaultMessages from '../i18n/langs'
import calcTextareaHeight from '../lib/calcTextareaHeight'
import merge from 'lodash/merge'

export default defineComponent({
  name: 'UInput',
  componentName: 'UInput',
  inject: {
    formItem: '#UFormItem'
  },
  data () {
    return {
      textareaCalcStyle: {}
    }
  },
  props: {
    i18n: {
      type: Function,
      required: true
    },
    i18nMessages: Object,
    value: {
      type: [String, Number],
      default: ''
    },
    modelValue: {
      type: [String, Number],
      default: ''
    },
    placeholder: String,
    size: String,
    resize: String,
    readonly: Boolean,
    autofocus: Boolean,
    icon: String,
    disabled: Boolean,
    type: {
      type: String,
      default: 'text'
    },
    name: String,
    autosize: {
      type: [Boolean, Object] as boolean & object,
      default: false
    },
    rows: {
      type: Number,
      default: 2
    },
    autoComplete: {
      type: String,
      default: 'off'
    },
    form: String,
    maxlength: Number,
    minlength: Number,
    max: {},
    min: {},
    step: {},
    validateEvent: {
      type: Boolean,
      default: true
    },
    onIconClick: Function
  },
  setup (props) {
    return {
      ...props.i18n({
        messages: props.i18nMessages || defaultMessages
      })
    }
  },
  computed: {
    currentValue (): string | number {
      this.handleInputOther(this.value)
      return this.value || this.modelValue
    },
    validating (): boolean {
      return (this.$parent?.$data as { validateState: string }).validateState === 'validating'
    },
    textareaStyle (): object {
      return merge({}, this.textareaCalcStyle, { resize: this.resize })
    }
  },
  methods: {
    handleBlur (event: FocusEvent) {
      this.$emit('blur', event)
      if (this.validateEvent && this.formItem) {
        this.formItem.onFieldBlur(this.currentValue)
      }
    },
    inputSelect () {
      (this.$refs.input as HTMLInputElement).select()
    },
    resizeTextarea () {
      if (this.$isServer) return
      const { autosize, type } = this
      if (!autosize || type !== 'textarea') return
      const minRows = autosize.minRows
      const maxRows = autosize.maxRows

      this.textareaCalcStyle = calcTextareaHeight(this.$refs.textarea as HTMLTextAreaElement, minRows, maxRows)
    },
    handleFocus (event: FocusEvent) {
      this.$emit('focus', event)
    },
    handleInput (event: KeyboardEvent) {
      const value = this.type === 'number'
        ? parseFloat((event.target as HTMLInputElement).value)
        : (event.target as HTMLInputElement).value
      this.handleInputOther(value)
      if (this.modelValue !== undefined) {
        this.$emit('update:modelValue', value)
      }
      this.$emit('input', value)
      this.$emit('change', value)
    },
    handleInputOther (value: string | number) {
      this.$nextTick(() => {
        this.resizeTextarea()
      })
      if (this.validateEvent && this.formItem) {
        this.formItem.onFieldChange(value)
      }
    },
    handleIconClick (event: MouseEvent) {
      if (this.onIconClick) {
        this.onIconClick(event)
      }
      this.$emit('click', event)
    },
    focus () {
      (this.$refs.textarea as HTMLTextAreaElement || this.$refs.input as HTMLInputElement).focus()
    }
  },
  created () {
    // this.$on('inputSelect', this.inputSelect)
  },
  mounted () {
    this.resizeTextarea()
  }
})
</script>
