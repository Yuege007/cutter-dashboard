import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'

// 导入服务
import { registerAllCards } from '@/cards/registry'
import { setupDefaultPollingTasks, pollingService } from '@/services/polling'
import { useThemeStore } from '@/stores/theme'
import { useCardStore } from '@/stores/card'
import { initCacheSystem } from '@/services/cache/init'

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

    // 2. 初始化主题
    const themeStore = useThemeStore()
    themeStore.loadFromLocalStorage()

    // 3. 注册卡片
    const cardStore = useCardStore()
    registerAllCards(cardStore)

    // 4. 设置轮询任务
    setupDefaultPollingTasks()

    // 启动轮询服务
    pollingService.start()

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
