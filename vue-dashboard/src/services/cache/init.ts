/**
 * 缓存系统初始化
 * 在应用启动时初始化缓存系统和相关配置
 */

import { getCacheManager, getCacheMonitor, initCacheMonitoring } from './index'
import { smartCacheRefresh } from '../cachedApi'

/**
 * 初始化缓存系统
 */
export async function initCacheSystem() {
  console.log('🚀 初始化缓存系统...')
  
  try {
    // 1. 获取缓存管理器实例
    const cacheManager = getCacheManager()

    // 2. 检查浏览器存储支持
    const storageSupport = checkStorageSupport()
    console.log('📦 存储支持情况:', storageSupport)

    // 3. 清理可能损坏的旧缓存数据
    await cleanupCorruptedCache()
    console.log('🧹 缓存数据检查完成')
    
    // 3. 开发环境下启动监控
    if (import.meta.env.DEV) {
      // 延迟初始化监控，避免循环依赖
      setTimeout(() => {
        initCacheMonitoring()
        const monitor = getCacheMonitor()
        setupGlobalDebugTools(cacheManager, monitor)
      }, 200)
      console.log('🔍 缓存监控将在200ms后启动')
    }
    
    // 4. 启动智能刷新策略
    smartCacheRefresh.startPeriodicRefresh()
    
    // 5. 预热常用数据 (延迟执行，避免阻塞应用启动)
    setTimeout(async () => {
      try {
        const cachedApiModule = await import('../cachedApi')
        const cachedApi = cachedApiModule.default
        await cachedApi.cache.warmupCommonData()
      } catch (error) {
        console.warn('缓存预热失败:', error)
      }
    }, 2000)
    
    // 6. 设置页面卸载时的清理
    setupCleanupHandlers(cacheManager)
    
    console.log('✅ 缓存系统初始化完成')
    
    return {
      success: true,
      storageSupport,
      cacheManager
    }
  } catch (error) {
    console.error('❌ 缓存系统初始化失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * 检查浏览器存储支持情况
 */
function checkStorageSupport() {
  const support = {
    localStorage: false,
    sessionStorage: false,
    indexedDB: false,
    webWorker: false
  }
  
  // 检查 localStorage
  try {
    const testKey = '__cache_test_ls__'
    localStorage.setItem(testKey, 'test')
    localStorage.removeItem(testKey)
    support.localStorage = true
  } catch {
    console.warn('⚠️ localStorage 不可用')
  }
  
  // 检查 sessionStorage
  try {
    const testKey = '__cache_test_ss__'
    sessionStorage.setItem(testKey, 'test')
    sessionStorage.removeItem(testKey)
    support.sessionStorage = true
  } catch {
    console.warn('⚠️ sessionStorage 不可用')
  }
  
  // 检查 IndexedDB
  try {
    support.indexedDB = 'indexedDB' in window && indexedDB !== null
    if (!support.indexedDB) {
      console.warn('⚠️ IndexedDB 不可用')
    }
  } catch {
    console.warn('⚠️ IndexedDB 检查失败')
  }
  
  // 检查 Web Worker
  try {
    support.webWorker = 'Worker' in window
  } catch {
    console.warn('⚠️ Web Worker 不可用')
  }
  
  return support
}

/**
 * 清理可能损坏的缓存数据
 */
async function cleanupCorruptedCache() {
  try {
    const prefix = 'dashboard_cache_'
    const keysToRemove: string[] = []

    // 检查localStorage中的缓存项
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (!key || !key.startsWith(prefix)) continue

      try {
        const stored = localStorage.getItem(key)
        if (!stored) continue

        const wrapper = JSON.parse(stored)

        // 检查是否是压缩数据
        if (wrapper.compressed && wrapper.data) {
          // 尝试解压缩测试
          try {
            const binaryString = atob(wrapper.data)
            const uint8Array = new Uint8Array(binaryString.length)
            for (let j = 0; j < binaryString.length; j++) {
              uint8Array[j] = binaryString.charCodeAt(j)
            }
            const decoder = new TextDecoder()
            const jsonString = decoder.decode(uint8Array)
            JSON.parse(jsonString)
          } catch {
            // 解压缩失败，标记为需要删除
            keysToRemove.push(key)
          }
        }
      } catch {
        // JSON解析失败，标记为需要删除
        keysToRemove.push(key)
      }
    }

    // 删除损坏的缓存项
    keysToRemove.forEach(key => {
      localStorage.removeItem(key)
    })

    if (keysToRemove.length > 0) {
      console.log(`🧹 清理了 ${keysToRemove.length} 个损坏的缓存项`)
    }
  } catch (error) {
    console.warn('⚠️ 缓存清理过程中出现错误:', error)
  }
}

/**
 * 设置全局调试工具
 */
function setupGlobalDebugTools(cacheManager: any, monitor: any) {
  // 添加到 window 对象，方便调试
  ;(window as any).__cacheSystem = {
    manager: cacheManager,
    monitor,
    
    // 快捷方法
    async stats() {
      return await cacheManager.getAllStats()
    },
    
    async clear() {
      await cacheManager.clear()
      console.log('🧹 所有缓存已清理')
    },
    
    async get(key: string) {
      return await cacheManager.get(key)
    },
    
    async set(key: string, data: any, options?: any) {
      return await cacheManager.set(key, data, options)
    },
    
    async invalidate(pattern: string | RegExp) {
      const count = await cacheManager.invalidate(pattern)
      console.log(`🗑️ 已清理 ${count} 个匹配的缓存项`)
      return count
    },
    
    async export() {
      return await monitor.exportStats()
    },
    
    // 性能测试
    async benchmark(iterations = 1000) {
      console.log(`🏃‍♂️ 开始缓存性能测试 (${iterations} 次迭代)...`)
      
      const testData = { test: 'data', timestamp: Date.now(), array: new Array(100).fill('test') }
      const testKey = '__benchmark_test__'
      
      // 写入测试
      const writeStart = performance.now()
      for (let i = 0; i < iterations; i++) {
        await cacheManager.set(`${testKey}_${i}`, testData)
      }
      const writeTime = performance.now() - writeStart
      
      // 读取测试
      const readStart = performance.now()
      for (let i = 0; i < iterations; i++) {
        await cacheManager.get(`${testKey}_${i}`)
      }
      const readTime = performance.now() - readStart
      
      // 清理测试数据
      for (let i = 0; i < iterations; i++) {
        await cacheManager.delete(`${testKey}_${i}`)
      }
      
      const results = {
        iterations,
        writeTime: writeTime.toFixed(2) + 'ms',
        readTime: readTime.toFixed(2) + 'ms',
        avgWriteTime: (writeTime / iterations).toFixed(3) + 'ms',
        avgReadTime: (readTime / iterations).toFixed(3) + 'ms'
      }
      
      console.table(results)
      return results
    }
  }
  
  console.log('🔧 全局调试工具已加载: window.__cacheSystem')
  console.log('💡 可用方法: stats(), clear(), get(key), set(key, data), invalidate(pattern), export(), benchmark()')
}

/**
 * 设置清理处理器
 */
function setupCleanupHandlers(cacheManager: any) {
  // 页面卸载时的清理
  window.addEventListener('beforeunload', () => {
    // 这里可以添加一些清理逻辑
    // 注意：不要在这里执行异步操作，因为页面即将卸载
  })
  
  // 页面隐藏时暂停一些操作
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      console.log('📱 页面隐藏，缓存系统进入节能模式')
      // 可以在这里暂停一些定时任务
    } else {
      console.log('📱 页面显示，缓存系统恢复正常模式')
      // 可以在这里恢复定时任务
    }
  })
  
  // 内存压力处理 (如果浏览器支持)
  if ('memory' in performance) {
    const checkMemoryPressure = () => {
      const memInfo = (performance as any).memory
      if (memInfo) {
        const usedRatio = memInfo.usedJSHeapSize / memInfo.jsHeapSizeLimit
        if (usedRatio > 0.9) {
          console.warn('⚠️ 内存使用率过高，触发缓存清理')
          // 清理内存缓存
          cacheManager.clear({ layer: 'memory' })
        }
      }
    }
    
    // 每30秒检查一次内存使用情况
    setInterval(checkMemoryPressure, 30000)
  }
}

/**
 * 获取缓存系统健康状态
 */
export async function getCacheSystemHealth() {
  try {
    const cacheManager = getCacheManager()
    const stats = await cacheManager.getAllStats()
    
    const health = {
      overall: 'healthy' as 'healthy' | 'warning' | 'critical',
      issues: [] as string[],
      recommendations: [] as string[],
      stats
    }
    
    // 检查各层缓存的健康状态
    Object.entries(stats).forEach(([layer, stat]) => {
      // 检查命中率
      if (stat.hitRate < 0.5 && stat.hitCount + stat.missCount > 100) {
        health.issues.push(`${layer} 层缓存命中率较低 (${(stat.hitRate * 100).toFixed(1)}%)`)
        health.recommendations.push(`优化 ${layer} 层的缓存策略`)
        health.overall = 'warning'
      }
      
      // 检查存储使用量
      if (layer === 'memory' && stat.totalSize > 50 * 1024 * 1024) { // 50MB
        health.issues.push('内存缓存使用量过高')
        health.recommendations.push('考虑减少内存缓存的TTL或增加清理频率')
        health.overall = 'warning'
      }
      
      if (layer === 'indexedDB' && stat.totalSize > 100 * 1024 * 1024) { // 100MB
        health.issues.push('IndexedDB 使用量过高')
        health.recommendations.push('清理旧数据或减少大数据集的缓存时间')
        health.overall = 'warning'
      }
    })
    
    // 如果有严重问题，标记为 critical
    if (health.issues.length > 3) {
      health.overall = 'critical'
    }
    
    return health
  } catch (error) {
    return {
      overall: 'critical' as const,
      issues: ['缓存系统检查失败'],
      recommendations: ['重启应用或清理缓存'],
      error: error.message
    }
  }
}

/**
 * 缓存系统诊断
 */
export async function diagnoseCacheSystem() {
  console.log('🔍 开始缓存系统诊断...')
  
  const diagnosis = {
    timestamp: new Date().toISOString(),
    browserInfo: {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled
    },
    storageSupport: checkStorageSupport(),
    health: await getCacheSystemHealth(),
    performance: null as any
  }
  
  // 性能测试
  try {
    const cacheSystem = (window as any).__cacheSystem
    if (cacheSystem && cacheSystem.benchmark) {
      diagnosis.performance = await cacheSystem.benchmark(100) // 100次迭代的快速测试
    }
  } catch (error) {
    console.warn('性能测试失败:', error)
  }
  
  console.log('📋 缓存系统诊断完成')
  console.table(diagnosis.health.stats)
  
  if (diagnosis.health.issues.length > 0) {
    console.warn('⚠️ 发现问题:', diagnosis.health.issues)
    console.info('💡 建议:', diagnosis.health.recommendations)
  }
  
  return diagnosis
}
