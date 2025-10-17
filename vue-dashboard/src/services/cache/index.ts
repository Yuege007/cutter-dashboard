/**
 * 缓存系统入口文件
 * 导出所有缓存相关的类型和实现
 */

// 类型定义
export type {
  ICache,
  ICacheManager,
  CacheItem,
  CacheOptions,
  CacheStats,
  CacheEvent,
  CacheStrategy,
  CacheLayer,
  CachePriority,
  DataClassification,
  CacheKeyGenerator,
  CacheCompressor,
  CacheMonitor,
  CacheMetrics
} from './types'

// 缓存实现
export { MemoryCache } from './MemoryCache'
export { LocalStorageCache } from './LocalStorageCache'
export { IndexedDBCache } from './IndexedDBCache'
export { HttpCache } from './HttpCache'
export { HybridCacheManager } from './HybridCacheManager'

// 工具类
export {
  CacheUtils,
  DefaultCacheKeyGenerator,
  SimpleCacheCompressor,
  CACHE_KEYS
} from './utils'

// 导入工具类用于内部使用
import { DefaultCacheKeyGenerator } from './utils'

// 默认配置
export { 
  DEFAULT_CACHE_STRATEGY, 
  DEFAULT_DATA_CLASSIFICATION 
} from './types'

// 创建默认缓存管理器实例
import { HybridCacheManager } from './HybridCacheManager'
import { DEFAULT_CACHE_STRATEGY, DEFAULT_DATA_CLASSIFICATION } from './types'

// 全局缓存管理器实例
let globalCacheManager: HybridCacheManager | null = null

/**
 * 获取全局缓存管理器实例
 */
export function getCacheManager(): HybridCacheManager {
  if (!globalCacheManager) {
    globalCacheManager = new HybridCacheManager(
      DEFAULT_CACHE_STRATEGY,
      DEFAULT_DATA_CLASSIFICATION
    )
    
    // 开发环境下添加调试信息
    if (import.meta.env.DEV) {
      globalCacheManager.on('hit', (event) => {
        console.debug(`🎯 缓存命中 [${event.layer}]: ${event.key}`, event.metadata)
      })
      
      globalCacheManager.on('miss', (event) => {
        console.debug(`❌ 缓存未命中 [${event.layer}]: ${event.key}`, event.metadata)
      })
      
      globalCacheManager.on('set', (event) => {
        console.debug(`💾 缓存设置 [${event.layer}]: ${event.key}`, event.metadata)
      })
      
      globalCacheManager.on('evict', (event) => {
        console.debug(`🗑️ 缓存淘汰 [${event.layer}]: ${event.key}`, event.metadata)
      })
    }
  }
  
  return globalCacheManager
}

/**
 * 重置全局缓存管理器
 */
export function resetCacheManager(): void {
  globalCacheManager = null
}

/**
 * 缓存装饰器 - 用于自动缓存函数结果
 */
export function cached(options: {
  key?: string | ((args: any[]) => string)
  ttl?: number
  layer?: CacheLayer
} = {}) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value
    
    descriptor.value = async function (...args: any[]) {
      const cacheManager = getCacheManager()
      
      // 生成缓存键
      let cacheKey: string
      if (typeof options.key === 'function') {
        cacheKey = options.key(args)
      } else if (options.key) {
        cacheKey = options.key
      } else {
        cacheKey = `${target.constructor.name}.${propertyKey}:${JSON.stringify(args)}`
      }
      
      // 尝试从缓存获取
      const cached = await cacheManager.get(cacheKey, { layer: options.layer })
      if (cached !== null) {
        return cached
      }
      
      // 执行原方法
      const result = await originalMethod.apply(this, args)
      
      // 缓存结果
      await cacheManager.set(cacheKey, result, { ttl: options.ttl })
      
      return result
    }
    
    return descriptor
  }
}

/**
 * 缓存键生成辅助函数
 */
export const CacheKeys = {
  // API相关
  api: (endpoint: string, params?: Record<string, any>) => {
    const keyGen = new DefaultCacheKeyGenerator()
    return keyGen.generate('api', endpoint, params)
  },
  
  // 用户配置相关
  userConfig: (userId: string, configType: string) => {
    return `user:${userId}:config:${configType}`
  },
  
  // 应用状态相关
  appState: (stateType: string, identifier?: string) => {
    return identifier ? `app:${stateType}:${identifier}` : `app:${stateType}`
  },
  
  // 数据相关
  data: (dataType: string, identifier: string, version?: string) => {
    return version ? `data:${dataType}:${identifier}:${version}` : `data:${dataType}:${identifier}`
  }
}

/**
 * 缓存统计信息获取
 */
export async function getCacheStatistics() {
  const cacheManager = getCacheManager()
  const stats = await cacheManager.getAllStats()
  
  const totalItems = Object.values(stats).reduce((sum, stat) => sum + stat.totalItems, 0)
  const totalSize = Object.values(stats).reduce((sum, stat) => sum + stat.totalSize, 0)
  const overallHitRate = Object.values(stats).reduce((sum, stat, index, array) => {
    const weight = stat.hitCount + stat.missCount
    const rate = weight > 0 ? stat.hitRate : 0
    return sum + (rate * weight)
  }, 0) / Object.values(stats).reduce((sum, stat) => sum + stat.hitCount + stat.missCount, 0)
  
  return {
    layers: stats,
    summary: {
      totalItems,
      totalSize,
      overallHitRate: overallHitRate || 0,
      formattedSize: CacheUtils.formatBytes(totalSize)
    }
  }
}

/**
 * 缓存健康检查
 */
export async function performCacheHealthCheck() {
  const cacheManager = getCacheManager()
  const stats = await cacheManager.getAllStats()
  
  const issues: string[] = []
  const recommendations: string[] = []
  
  // 检查命中率
  Object.entries(stats).forEach(([layer, stat]) => {
    if (stat.hitRate < 0.5 && stat.hitCount + stat.missCount > 100) {
      issues.push(`${layer} 层缓存命中率较低 (${(stat.hitRate * 100).toFixed(1)}%)`)
      recommendations.push(`考虑调整 ${layer} 层的缓存策略或TTL设置`)
    }
  })
  
  // 检查存储使用量
  const memoryStats = stats.memory
  if (memoryStats.totalSize > 40 * 1024 * 1024) { // 40MB
    issues.push('内存缓存使用量过高')
    recommendations.push('考虑减少内存缓存的TTL或增加淘汰频率')
  }
  
  // 检查IndexedDB使用量
  const indexedDBStats = stats.indexedDB
  if (indexedDBStats.totalSize > 80 * 1024 * 1024) { // 80MB
    issues.push('IndexedDB缓存使用量过高')
    recommendations.push('考虑清理旧数据或减少大数据集的缓存时间')
  }
  
  return {
    healthy: issues.length === 0,
    issues,
    recommendations,
    stats
  }
}

/**
 * 缓存预热
 */
export async function warmupCache(data: Record<string, any>) {
  const cacheManager = getCacheManager()
  
  const promises = Object.entries(data).map(async ([key, value]) => {
    try {
      await cacheManager.set(key, value)
      return { key, success: true }
    } catch (error) {
      console.error(`缓存预热失败: ${key}`, error)
      return { key, success: false, error }
    }
  })
  
  const results = await Promise.allSettled(promises)
  const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length
  
  console.log(`缓存预热完成: ${successful}/${Object.keys(data).length} 项成功`)
  
  return {
    total: Object.keys(data).length,
    successful,
    failed: Object.keys(data).length - successful
  }
}

/**
 * 清理过期缓存
 */
export async function cleanupExpiredCache() {
  const cacheManager = getCacheManager()
  
  // 获取清理前的统计信息
  const beforeStats = await cacheManager.getAllStats()
  const beforeItems = Object.values(beforeStats).reduce((sum, stat) => sum + stat.totalItems, 0)
  
  // 执行清理 (通过获取所有键来触发过期检查)
  await Promise.all([
    cacheManager.getAllStats(), // 这会触发各层的清理
  ])
  
  // 获取清理后的统计信息
  const afterStats = await cacheManager.getAllStats()
  const afterItems = Object.values(afterStats).reduce((sum, stat) => sum + stat.totalItems, 0)
  
  const cleanedItems = beforeItems - afterItems
  
  console.log(`缓存清理完成: 清理了 ${cleanedItems} 个过期项`)
  
  return {
    beforeItems,
    afterItems,
    cleanedItems
  }
}

// 导出监控功能
export { CacheMonitorImpl, getCacheMonitor, initCacheMonitoring } from './CacheMonitor'
