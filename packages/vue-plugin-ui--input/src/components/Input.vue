<template>
    <div :class="[
    type === 'textarea' ? 'u-textarea' : 'u-input',
    inputSize ? 'u-input--' + inputSize : '',
    {
      'is-disabled': inputDisabled,
      'is-exceed': inputExceed,
      'u-input-group': $slots.prepend || $scopedSlots.prepend || $slots.append || $scopedSlots.append,
      'u-input-group--append': $slots.append || $scopedSlots.append,
      'u-input-group--prepend': $slots.prepend || $scopedSlots.prepend,
      'u-input--prefix': $slots.prefix || $scopedSlots.prefix || prefixIcon,
      'u-input--suffix': $slots.suffix || $scopedSlots.suffix || suffixIcon || clearable || showPassword
    }
    ]"
    @mouseenter="hovering = true"
    @mouseleave="hovering = false"
  >
    <template v-if="type !== 'textarea'">
      <!-- 前置元素 -->
      <div class="u-input-group__prepend" v-if="$slots.prepend || $scopedSlots.prepend">
        <slot name="prepend"></slot>
      </div>
      <input
        :tabindex="tabindex"
        v-if="type !== 'textarea'"
        class="u-input__inner"
        :value="currentValue"
        v-bind="$attrs"
        :type="showPassword ? (passwordVisible ? 'text': 'password') : type"
        :disabled="inputDisabled"
        :readonly="readonly"
        :autocomplete="autoComplete || autocomplete"
        ref="input"
        @compositionstart="handleCompositionStart"
        @compositionupdate="handleCompositionUpdate"
        @compositionend="handleCompositionEnd"
        @input="handleInput"
        @focus="handleFocus"
        @blur="handleBlur"
        @change="handleChange"
        :aria-label="label"
      >
      <!-- 前置内容 -->
      <span class="u-input__prefix" v-if="$slots.prefix || $scopedSlots.prefix || prefixIcon">
        <slot name="prefix"></slot>
        <i class="u-input__icon"
           v-if="prefixIcon"
           :class="prefixIcon">
        </i>
      </span>
      <!-- 后置内容 -->
      <span
        class="u-input__suffix"
        v-if="getSuffixVisible()">
        <span class="u-input__suffix-inner">
          <template v-if="!showClear || !showPwdVisible || !isWordLimitVisible">
            <slot name="suffix"></slot>
            <i class="u-input__icon"
              v-if="suffixIcon"
              :class="suffixIcon">
            </i>
          </template>
          <i v-if="showClear"
            class="u-icon u-input__icon u-icon-close-circled u-input__clear"
            @mousedown.prevent
            @click="clear"
          ></i>
          <i v-if="showPwdVisible"
            class="u-input__icon u-icon-view u-input__clear"
            @click="handlePasswordVisible"
          ></i>
          <span v-if="isWordLimitVisible" class="u-input__count">
            <span class="u-input__count-inner">
              {{ textLength }}/{{ upperLimit }}
            </span>
          </span>
        </span>
        <i class="u-icon u-input__icon"
          v-if="validateState"
          :class="['u-input__validateIcon', validateIcon]">
        </i>
      </span>
      <!-- 后置元素 -->
      <div class="u-input-group__append" v-if="$slots.append || $scopedSlots.append">
        <slot name="append"></slot>
      </div>
    </template>
    <textarea
      v-else
      :tabindex="tabindex"
      class="u-textarea__inner"
      @compositionstart="handleCompositionStart"
      @compositionupdate="handleCompositionUpdate"
      @compositionend="handleCompositionEnd"
      @input="handleInput"
      ref="textarea"
      :value="currentValue"
      v-bind="$attrs"
      :disabled="inputDisabled"
      :readonly="readonly"
      :autocomplete="autoComplete || autocomplete"
      :style="textareaStyle"
      @focus="handleFocus"
      @blur="handleBlur"
      @change="handleChange"
      :aria-label="label"
    >
    </textarea>
    <span v-if="isWordLimitVisible && type === 'textarea'" class="u-input__count">{{ textLength }}/{{ upperLimit }}</span>
  </div>
</template>

<script lang="ts">
import { defineComponent, inject, PropType } from '@vue/composition-api'
// import defaultMessages from '../i18n/langs'
import calcTextareaHeight from '../lib/calcTextareaHeight'
import merge from 'lodash/merge'

export default defineComponent({
  name: 'UInput',
  // componentName: 'UInput',
  inheritAttrs: false,
  model: {
    event: 'update:modelValue',
    prop: 'modelValue'
  },
  props: {
    value: [String, Number] as PropType<string | number>,
    modelValue: [String, Number] as PropType<string | number>,
    size: String,
    resize: String,
    form: String,
    disabled: Boolean,
    readonly: Boolean,
    type: {
      type: String,
      default: 'text'
    },
    autosize: {
      type: [Boolean, Object] as PropType<false | { minRows: number; maxRows: number }>,
      default: false
    },
    autocomplete: {
      type: String,
      default: 'off'
    },
    /** @Deprecated in next major version */
    autoComplete: {
      type: String,
      validator (val) {
        process.env.NODE_ENV !== 'production' &&
          console.warn('[Element Warn][Input]\'auto-complete\' property will be deprecated in next major version. please use \'autocomplete\' instead.')
        return true
      }
    },
    validateEvent: {
      type: Boolean,
      default: true
    },
    suffixIcon: String,
    prefixIcon: String,
    label: String,
    clearable: {
      type: Boolean,
      default: false
    },
    showPassword: {
      type: Boolean,
      default: false
    },
    showWordLimit: {
      type: Boolean,
      default: false
    },
    tabindex: String
  },

  setup () {
    // this.$on('inputSelect', this.select)
    return {
      form$: inject('#UForm', {
        statusIcon: false
      }),
      formItem$: inject('#UFormItem', {
        validateState: ''
      }),
      $ELEMENT: { size: 0 }
    }
  },

  data () {
    return {
      textareaCalcStyle: {},
      hovering: false,
      focused: false,
      isComposing: false,
      passwordVisible: false
    } as {
      textareaCalcStyle: any;
      hovering: boolean;
      focused: boolean;
      isComposing: boolean;
      passwordVisible: boolean;
    }
  },

  computed: {
    currentValue (): string | number {
      // this.handleInputOther(this.value)
      return this.value || this.modelValue || ''
    },
    _elFormItemSize (): number {
      return (this.formItem$ || {}).formItemSize
    },
    validateState (): string {
      return this.formItem$ ? this.formItem$.validateState : ''
    },
    needStatusIcon (): boolean {
      return this.form$ ? this.form$.statusIcon : false
    },
    validateIcon (): string {
      const states = {
        validating: 'u-icon-load-c u-anim-load-loop',
        success: 'u-icon-checkmark-circled',
        error: 'u-icon-close-circled'
      }
      return states[this.validateState as keyof typeof states]
    },
    textareaStyle (): object {
      return merge({}, this.textareaCalcStyle, { resize: this.resize })
    },
    inputSize (): number | string {
      return this.size || this._elFormItemSize || (this.$ELEMENT || {}).size
    },
    inputDisabled (): boolean {
      return this.disabled || (this.formItem$ || {}).disabled
    },
    nativeInputValue (): string {
      return this.value === null || this.value === undefined ? '' : String(this.value)
    },
    showClear (): boolean {
      return this.clearable &&
      !this.inputDisabled &&
      !this.readonly &&
      !!(this.value || this.modelValue || this.nativeInputValue) &&
      (this.focused || this.hovering)
    },
    showPwdVisible (): boolean {
      return this.showPassword &&
        !this.inputDisabled &&
        !this.readonly &&
        (!!this.nativeInputValue || this.focused)
    },
    isWordLimitVisible (): boolean {
      return this.showWordLimit &&
        this.$attrs.maxlength &&
        (this.type === 'text' || this.type === 'textarea') &&
        !this.inputDisabled &&
        !this.readonly &&
        !this.showPassword
    },
    upperLimit (): number {
      return this.$attrs.maxlength as number
    },
    textLength (): number {
      if (typeof this.value === 'number') {
        return String(this.value).length
      }
      return (this.value || '').length
    },
    inputExceed (): boolean {
      // show exceed style if length of initial value greater then maxlength
      return this.isWordLimitVisible &&
        (this.textLength > this.upperLimit)
    }
  },

  watch: {
    value (val) {
      this.$nextTick(this.resizeTextarea)
      if (this.validateEvent) {
        if (this.validateEvent) {
          this.$emit('validate', 'change', val)
          // this.dispatch('ElFormItem', 'el.form.change', [val])
        }
      }
    },
    // native input value is set explicitly
    // do not use v-model / :value in template
    // see: https://github.com/ElemeFE/element/issues/14521
    nativeInputValue () {
      this.setNativeInputValue()
    },
    // when change between <input> and <textarea>,
    // update DOM dependent value and styles
    // https://github.com/ElemeFE/element/issues/14857
    type () {
      this.$nextTick(() => {
        this.setNativeInputValue()
        this.resizeTextarea()
        this.updateIconOffset()
      })
    }
  },

  methods: {
    focus () {
      this.getInput().focus()
    },
    blur () {
      this.getInput().blur()
    },
    getMigratingConfig () {
      return {
        props: {
          icon: 'icon is removed, use suffix-icon / prefix-icon instead.',
          'on-icon-click': 'on-icon-click is removed.'
        },
        events: {
          click: 'click is removed.'
        }
      }
    },
    handleBlur (event: FocusEvent) {
      this.focused = false
      this.$emit('blur', event)
      if (this.validateEvent) {
        this.$emit('validate', 'blur', this.currentValue)
      }
    },
    select () {
      this.getInput().select()
    },
    resizeTextarea () {
      // if (this.$isServer) return
      const { autosize, type } = this
      if (type !== 'textarea') return
      if (!autosize) {
        this.textareaCalcStyle = {
          minHeight: calcTextareaHeight(this.$refs.textarea as HTMLTextAreaElement).minHeight
        }
        return
      }
      const minRows = autosize.minRows
      const maxRows = autosize.maxRows

      this.textareaCalcStyle = calcTextareaHeight(this.$refs.textarea as HTMLTextAreaElement, minRows, maxRows)
    },
    setNativeInputValue () {
      // const input = this.getInput()
      // if (!input) return
      // if (input.value === this.nativeInputValue) return
      // input.value = this.nativeInputValue
    },
    handleFocus (event: FocusEvent) {
      this.focused = true
      this.$emit('focus', event)
    },
    handleCompositionStart () {
      this.isComposing = true
    },
    handleCompositionUpdate (event: any) {
      // const text = event.target.value
      // const lastCharacter = text[text.length - 1] || ''
      this.isComposing = true // !isKorean(lastCharacter)
    },
    handleCompositionEnd (event: any) {
      if (this.isComposing) {
        this.isComposing = false
        this.handleInput(event)
      }
    },
    handleInput (event: any) {
      // should not emit input during composition
      // see: https://github.com/ElemeFE/element/issues/10516
      if (this.isComposing) return
      // hack for https://github.com/ElemeFE/element/issues/8548
      // should remove the following line when we don't support IE
      if (event.target.value === this.nativeInputValue) return
      this.$emit('input', event.target.value)
      this.$emit('update:modelValue', event.target.value)
      // ensure native input value is controlled
      // see: https://github.com/ElemeFE/element/issues/12850
      this.$nextTick(this.setNativeInputValue)
    },
    handleChange (event: any) {
      this.$emit('change', event.target.value)
      this.$emit('update:modelValue', event.target.value)
    },
    calcIconOffset (place: any) {
      const elList = ([] as any).slice.call(this.$el.querySelectorAll(`.u-input__${place}`) || [])
      if (!elList.length) return
      let el = null
      for (let i = 0; i < elList.length; i++) {
        if (elList[i].parentNode === this.$el) {
          el = elList[i]
          break
        }
      }
      if (!el) return
      const pendantMap = {
        suffix: 'append',
        prefix: 'prepend'
      }
      const pendant = pendantMap[place as keyof typeof pendantMap]
      if (this.$slots[pendant] || this.$scopedSlots[pendant]) {
        el.style.transform = `translateX(${place === 'suffix' ? '-' : ''}${this.$el.querySelector(`.u-input-group__${pendant}`).offsetWidth}px)`
      } else {
        el.removeAttribute('style')
      }
    },
    updateIconOffset () {
      this.calcIconOffset('prefix')
      this.calcIconOffset('suffix')
    },
    clear () {
      this.$emit('input', '')
      this.$emit('change', '')
      this.$emit('update:modelValue', '')
      this.$emit('clear')
    },
    handlePasswordVisible () {
      this.passwordVisible = !this.passwordVisible
      this.focus()
    },
    getInput (): HTMLInputElement | HTMLTextAreaElement {
      return (this.$refs.input as HTMLInputElement) || (this.$refs.textarea as HTMLTextAreaElement)
    },
    getSuffixVisible () {
      return this.$slots.suffix || this.$scopedSlots.suffix ||
        this.suffixIcon ||
        this.showClear ||
        this.showPassword ||
        this.isWordLimitVisible ||
        (this.validateState && this.needStatusIcon)
    }
  },

  mounted () {
    this.setNativeInputValue()
    this.resizeTextarea()
    this.updateIconOffset()
  },

  updated () {
    this.$nextTick(this.updateIconOffset)
  }
})
</script>
