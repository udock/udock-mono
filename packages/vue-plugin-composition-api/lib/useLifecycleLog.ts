import {
  onActivated,
  onBeforeMount,
  onBeforeUpdate,
  onBeforeUnmount,
  onDeactivated,
  onErrorCaptured,
  onMounted,
  onRenderTracked,
  onRenderTriggered,
  onUnmounted,
  onUpdated
} from 'vue'

export default function (name: string) {
  onActivated(() => {
    console.log(`[${name}] onActivated`)
  })

  onBeforeMount(() => {
    console.log(`[${name}] onBeforeMount`)
  })

  onBeforeUpdate(() => {
    console.log(`[${name}] onBeforeUpdate`)
  })

  onBeforeUnmount(() => {
    console.log(`[${name}] onBeforeUnmount`)
  })

  onDeactivated(() => {
    console.log(`[${name}] onDeactivated`)
  })

  onErrorCaptured((...args) => {
    console.log(`[${name}] onErrorCaptured`, args)
  })

  onMounted(() => {
    console.log(`[${name}] onMounted`)
  })

  onRenderTracked(() => {
    console.log(`[${name}] onRenderTracked`)
  })

  onRenderTriggered(() => {
    console.log(`[${name}] onRenderTriggered`)
  })

  onUnmounted(() => {
    console.log(`[${name}] onUnmounted`)
  })

  onUpdated(() => {
    console.log(`[${name}] onUpdated`)
  })
}
