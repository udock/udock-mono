<template>
  <div class="u-form-item__label-wrap" :style="{
    marginLeft
  }">
    <slot></slot>
  </div>
</template>

<script lang="ts">
import { defineComponent, inject } from 'vue'

export default defineComponent({
  props: {
    isAutoWidth: Boolean,
    updateAll: Boolean
  },

  setup () {
    return {
      form$: inject('#UForm') as any,
      formItem$: inject('#UFormItem') as any
    }
  },

  computed: {
    marginLeft (): string {
      if (this.isAutoWidth) {
        const autoLabelWidth = this.form$.autoLabelWidth
        if (autoLabelWidth && autoLabelWidth !== 'auto') {
          const marginLeft = parseInt(autoLabelWidth, 10) - this.computedWidth
          if (marginLeft) {
            return marginLeft + 'px'
          }
        }
      }
      return '0'
    }
  },

  methods: {
    getLabelWidth () {
      if (this.$el && this.$el.firstElementChild) {
        const computedWidth = window.getComputedStyle(this.$el.firstElementChild).width
        return Math.ceil(parseFloat(computedWidth))
      } else {
        return 0
      }
    },
    updateLabelWidth (action = 'update') {
      if (this.$slots.default && this.isAutoWidth && this.$el.firstElementChild) {
        if (action === 'update') {
          this.computedWidth = this.getLabelWidth()
        } else if (action === 'remove') {
          this.form$.deregisterLabelWidth(this.computedWidth)
        }
      }
    }
  },

  watch: {
    computedWidth (val, oldVal) {
      if (this.updateAll) {
        this.form$.registerLabelWidth(val, oldVal)
        this.formItem$.updateComputedLabelWidth(val)
      }
    }
  },

  data () {
    return {
      computedWidth: 0
    }
  },

  mounted () {
    this.updateLabelWidth('update')
  },

  updated () {
    this.updateLabelWidth('update')
  },

  beforeUnmount () {
    this.updateLabelWidth('remove')
  }
})
</script>
