<template>
  <div>
    <div>Form</div>
    <div>[{{ $t('UI.UserName') }}]</div>
    <div>[{{ aaa }}]</div>
    <slot></slot>
  </div>
</template>

<script>
import defaultMessages from '../i18n/langs'

export default {

  props: {
    i18n: Function,
    i18nMessages: Object,
    aaa: String
  },

  setup (props) {
    return {
      ...props.i18n({
        messages: props.i18nMessages || defaultMessages
      })
    }
  }
}
</script>

<style>

</style>
