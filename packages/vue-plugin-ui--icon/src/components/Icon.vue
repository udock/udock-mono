<template>
  <i :class="classes" :style="styles"></i>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
// import fontList from '../fonts'
const prefixCls = 'u-icon'

export default defineComponent({
  name: 'UIcon',
  props: {
    type: String,
    size: String,
    color: String
  },
  computed: {
    classes (): string {
      return `${prefixCls} ${prefixCls}-${this.type}`
    },
    // fontStr () {
    //   // html &#xf355 js \x
    //   // return String.fromCharCode(fontList[this.type])
    //   return fontList[this.type]
    // },
    styles () {
      const style: {
        'font-size'?: string;
        color?: string;
      } = {}

      if (this.size) {
        style['font-size'] = `${this.size}`
      }

      if (this.color) {
        style.color = this.color
      }

      return style
    }
  }
})
</script>
