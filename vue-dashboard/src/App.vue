<script setup lang="ts">
import { onMounted } from 'vue'
import { useThemeStore } from '@/stores/theme'

const themeStore = useThemeStore()

onMounted(() => {
  console.log('App mounted, initializing theme system')
  // 初始化主题系统
  themeStore.loadFromLocalStorage()
})
</script>

<template>
  <router-view />
</template>

<style scoped>
/* 组件特定样式 */
</style>