import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'

// 导入服务
import { registerAllCards } from '@/cards/registry'
import { setupDefaultPollingTasks, startDefaultPollingTasks } from '@/services/polling'
import { useThemeStore } from '@/stores/theme'
import { useCardStore } from '@/stores/card'
import { useAuthStore } from '@/stores/auth'
import { initCacheSystem } from '@/services/cache/init'
import { getCacheManager, DEFAULT_DATA_CLASSIFICATION } from '@/services/cache'

const app = createApp(App)
const pinia = createPinia()

// 在开发环境中禁用Pinia的调试日志
if (import.meta.env.DEV) {
  // 重写console.log来过滤Pinia的日志
  const originalLog = console.log
  console.log = (...args: any[]) => {
    const message = args.join(' ')
    // 过滤掉Pinia store安装日志
    if (message.includes('store installed') || message.includes('🍍')) {
      return
    }
    originalLog.apply(console, args)
  }
}

app.use(pinia)
app.use(router)

// 初始化应用
const initializeApp = async () => {
  try {
    // 1. 初始化缓存系统 (优先级最高)
    const cacheResult = await initCacheSystem()
    if (cacheResult.success) {
      console.log('✅ 缓存系统初始化成功')
    } else {
      console.warn('⚠️ 缓存系统初始化失败，应用将继续运行但性能可能受影响')
    }

    // 1.1 刷新后按需清理重数据缓存（保留布局与轻偏好）
    if (import.meta.env.VITE_CACHE_CLEAN_ON_REFRESH === 'true') {
      try {
        const cm = getCacheManager()
        const { largeDataset, apiResponse } = DEFAULT_DATA_CLASSIFICATION
        const patterns = [...largeDataset.patterns, ...apiResponse.patterns]
        for (const p of patterns) {
          await cm.invalidate(p)
        }
        // 同时清理所有卡片数据前缀（不影响布局键）
        await cm.invalidate('card:')
        console.log('🧹 已按刷新策略清理重数据缓存（保留布局）')
      } catch (e) {
        console.warn('刷新清理缓存失败:', e)
      }
    }

    // 2. 初始化主题
    const themeStore = useThemeStore()
    themeStore.loadFromLocalStorage()

    // 3. 注册卡片
    const cardStore = useCardStore()
    registerAllCards(cardStore)

    // 4. 设置轮询任务
    setupDefaultPollingTasks()

    // 5. 仅在已有登录态恢复成功后启动轮询，避免登录页提前打空 token 请求
    const authStore = useAuthStore()
    if (await authStore.restoreFromStorage()) {
      startDefaultPollingTasks()
    }

    console.log('🚀 Application initialized successfully')
    console.log(`📦 Registered ${cardStore.availableCards.length} card types`)
    console.log(`💾 Cache system: ${cacheResult.success ? 'enabled' : 'disabled'}`)
  } catch (error) {
    console.error('❌ Application initialization failed:', error)
    // 即使初始化失败，也要继续运行应用
  }
}

// 挂载应用
app.mount('#app')

// 初始化
initializeApp()
