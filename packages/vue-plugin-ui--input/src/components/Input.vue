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
  {{$slots.icon}}
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
          v-if="icon"
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
      <i class="u-input__icon u-icon-loading u-anim-load-loop" v-if="validating"></i>
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

<script>
import { defineComponent } from 'vue'
import defaultMessages from '../i18n/langs'
import { mixins } from '@udock/vue-plugin-ui'
import calcTextareaHeight from '../lib/calcTextareaHeight'
import merge from 'lodash/merge'

export default defineComponent({
  name: 'UInput',
  componentName: 'UInput',
  // mixins: [mixins.Emitter],
  data () {
    return {
      textareaCalcStyle: {}
    }
  },
  props: {
    i18n: Function,
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
      type: [Boolean, Object],
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
    currentValue () {
      this.handleInputOther(this.value)
      return this.value || this.modelValue
    },
    validating () {
      return false // this.$parent.validateState === 'validating'
    },
    textareaStyle () {
      return merge({}, this.textareaCalcStyle, { resize: this.resize })
    }
  },
  methods: {
    handleBlur (event) {
      this.$emit('blur', event)
      if (this.validateEvent) {
        // this.dispatch('ElFormItem', 'u.form.blur', [this.currentValue])
      }
    },
    inputSelect () {
      this.$refs.input.select()
    },
    resizeTextarea () {
      if (this.$isServer) return
      const { autosize, type } = this
      if (!autosize || type !== 'textarea') return
      const minRows = autosize.minRows
      const maxRows = autosize.maxRows

      this.textareaCalcStyle = calcTextareaHeight(this.$refs.textarea, minRows, maxRows)
    },
    handleFocus (event) {
      this.$emit('focus', event)
    },
    handleInput (event) {
      const value = this.type === 'number' ? parseFloat(event.target.value) : event.target.value
      this.handleInputOther(value)
      if (this.modelValue !== undefined) {
        this.$emit('update:modelValue', value)
      }
      this.$emit('input', value)
      this.$emit('change', value)
    },
    handleInputOther (value) {
      this.$nextTick(_ => {
        this.resizeTextarea()
      })
      if (this.validateEvent) {
        // this.dispatch('ElFormItem', 'u.form.change', [value])
      }
    },
    handleIconClick (event) {
      if (this.onIconClick) {
        this.onIconClick(event)
      }
      this.$emit('click', event)
    },
    focus () {
      (this.$refs.textarea || this.$refs.input).focus()
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
