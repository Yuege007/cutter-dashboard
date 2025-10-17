/**
 * 缓存监控和调试工具
 * 提供缓存性能监控、统计分析和调试功能
 */

import type { CacheMonitor, CacheMetrics, CacheEvent, CacheLayer } from './types'
import { getCacheManager } from './index'
import { CacheUtils } from './utils'

export class CacheMonitorImpl implements CacheMonitor {
  private isMonitoring = false
  private events: CacheEvent[] = []
  private maxEvents = 1000 // 最多保存1000个事件
  private performanceData = new Map<string, number[]>() // 性能数据
  private startTime = Date.now()
  
  private eventCounts = {
    hit: 0,
    miss: 0,
    set: 0,
    delete: 0,
    evict: 0,
    cleanup: 0
  }
  
  startMonitoring(): void {
    if (this.isMonitoring) return

    this.isMonitoring = true
    this.startTime = Date.now()
    this.events = []
    this.eventCounts = { hit: 0, miss: 0, set: 0, delete: 0, evict: 0, cleanup: 0 }

    // 延迟获取缓存管理器，避免循环依赖
    setTimeout(() => {
      try {
        const cacheManager = getCacheManager()

        // 监听所有缓存事件
        const eventTypes = ['hit', 'miss', 'set', 'delete', 'evict', 'cleanup'] as const

        eventTypes.forEach(eventType => {
          cacheManager.on(eventType, (event: CacheEvent) => {
            this.recordEvent(event)
          })
        })

        console.log('🔍 缓存监控已启动')
      } catch (error) {
        console.warn('⚠️ 缓存监控启动失败:', error)
      }
    }, 100) // 延迟100ms
  }
  
  stopMonitoring(): void {
    if (!this.isMonitoring) return
    
    this.isMonitoring = false
    
    // 这里应该移除事件监听器，但当前实现没有提供off方法的完整支持
    // 在实际使用中，可以通过重新创建CacheManager来清理监听器
    
    console.log('⏹️ 缓存监控已停止')
  }
  
  async getMetrics(): Promise<CacheMetrics> {
    const cacheManager = getCacheManager()
    const stats = await cacheManager.getAllStats()
    
    // 计算性能指标
    const totalOperations = Object.values(this.eventCounts).reduce((sum, count) => sum + count, 0)
    const totalHits = this.eventCounts.hit
    const totalMisses = this.eventCounts.miss
    const overallHitRate = totalHits + totalMisses > 0 ? totalHits / (totalHits + totalMisses) : 0
    
    // 计算平均响应时间
    const getOperations = this.events.filter(e => e.type === 'hit' || e.type === 'miss')
    const averageGetTime = getOperations.length > 0
      ? getOperations.reduce((sum, e) => sum + (e.metadata?.duration || 0), 0) / getOperations.length
      : 0
    
    const setOperations = this.events.filter(e => e.type === 'set')
    const averageSetTime = setOperations.length > 0
      ? setOperations.reduce((sum, e) => sum + (e.metadata?.duration || 0), 0) / setOperations.length
      : 0
    
    // 计算错误率
    const errorEvents = this.events.filter(e => e.metadata?.error)
    const errorRate = totalOperations > 0 ? errorEvents.length / totalOperations : 0
    
    // 计算存储使用情况
    const totalSize = Object.values(stats).reduce((sum, stat) => sum + stat.totalSize, 0)
    const memoryUsage = stats.memory?.totalSize || 0
    const localStorageUsage = stats.localStorage?.totalSize || 0
    const indexedDBUsage = stats.indexedDB?.totalSize || 0
    
    // 计算各层命中率
    const layerHitRates: Record<CacheLayer, number> = {
      memory: stats.memory?.hitRate || 0,
      localStorage: stats.localStorage?.hitRate || 0,
      indexedDB: stats.indexedDB?.hitRate || 0,
      http: stats.http?.hitRate || 0
    }
    
    // 计算淘汰率
    const totalEvictions = Object.values(stats).reduce((sum, stat) => sum + stat.evictionCount, 0)
    const totalItems = Object.values(stats).reduce((sum, stat) => sum + stat.totalItems, 0)
    const evictionRate = totalItems > 0 ? totalEvictions / totalItems : 0
    
    // 计算压缩率 (简化计算)
    const compressionRatio = 0.7 // 假设70%的压缩率
    
    return {
      performance: {
        averageGetTime,
        averageSetTime,
        totalOperations,
        errorRate
      },
      storage: {
        memoryUsage,
        localStorageUsage,
        indexedDBUsage,
        totalUsage: totalSize
      },
      efficiency: {
        overallHitRate,
        layerHitRates,
        evictionRate,
        compressionRatio
      }
    }
  }
  
  async exportStats(): Promise<string> {
    const metrics = await this.getMetrics()
    const cacheManager = getCacheManager()
    const stats = await cacheManager.getAllStats()
    
    const report = {
      timestamp: new Date().toISOString(),
      monitoringDuration: Date.now() - this.startTime,
      summary: {
        totalEvents: this.events.length,
        eventCounts: this.eventCounts,
        isMonitoring: this.isMonitoring
      },
      metrics,
      layerStats: stats,
      recentEvents: this.events.slice(-50), // 最近50个事件
      topKeys: this.getTopKeys(),
      recommendations: this.generateRecommendations(metrics)
    }
    
    return JSON.stringify(report, null, 2)
  }
  
  // 获取实时统计信息
  getRealTimeStats() {
    const now = Date.now()
    const duration = now - this.startTime
    
    return {
      monitoringDuration: duration,
      formattedDuration: CacheUtils.formatDuration(duration),
      totalEvents: this.events.length,
      eventCounts: { ...this.eventCounts },
      eventsPerSecond: this.events.length / (duration / 1000),
      recentEvents: this.events.slice(-10) // 最近10个事件
    }
  }
  
  // 获取热点键统计
  getTopKeys(limit: number = 10) {
    const keyStats = new Map<string, { hits: number, misses: number, sets: number }>()
    
    this.events.forEach(event => {
      if (!keyStats.has(event.key)) {
        keyStats.set(event.key, { hits: 0, misses: 0, sets: 0 })
      }
      
      const stats = keyStats.get(event.key)!
      switch (event.type) {
        case 'hit':
          stats.hits++
          break
        case 'miss':
          stats.misses++
          break
        case 'set':
          stats.sets++
          break
      }
    })
    
    return Array.from(keyStats.entries())
      .map(([key, stats]) => ({
        key,
        ...stats,
        total: stats.hits + stats.misses + stats.sets,
        hitRate: stats.hits + stats.misses > 0 ? stats.hits / (stats.hits + stats.misses) : 0
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, limit)
  }
  
  // 获取性能趋势
  getPerformanceTrend(timeWindow: number = 60000) { // 默认1分钟窗口
    const now = Date.now()
    const recentEvents = this.events.filter(e => now - e.timestamp < timeWindow)
    
    const buckets = new Map<number, { hits: number, misses: number, avgDuration: number }>()
    const bucketSize = 10000 // 10秒一个桶
    
    recentEvents.forEach(event => {
      const bucketTime = Math.floor(event.timestamp / bucketSize) * bucketSize
      
      if (!buckets.has(bucketTime)) {
        buckets.set(bucketTime, { hits: 0, misses: 0, avgDuration: 0 })
      }
      
      const bucket = buckets.get(bucketTime)!
      if (event.type === 'hit') {
        bucket.hits++
      } else if (event.type === 'miss') {
        bucket.misses++
      }
      
      if (event.metadata?.duration) {
        bucket.avgDuration = (bucket.avgDuration + event.metadata.duration) / 2
      }
    })
    
    return Array.from(buckets.entries())
      .map(([timestamp, data]) => ({
        timestamp,
        ...data,
        hitRate: data.hits + data.misses > 0 ? data.hits / (data.hits + data.misses) : 0
      }))
      .sort((a, b) => a.timestamp - b.timestamp)
  }
  
  // 生成优化建议
  private generateRecommendations(metrics: CacheMetrics): string[] {
    const recommendations: string[] = []
    
    // 命中率建议
    if (metrics.efficiency.overallHitRate < 0.7) {
      recommendations.push('整体缓存命中率较低，建议检查缓存策略和TTL设置')
    }
    
    // 内存使用建议
    if (metrics.storage.memoryUsage > 40 * 1024 * 1024) {
      recommendations.push('内存缓存使用量过高，建议增加清理频率或减少TTL')
    }
    
    // 性能建议
    if (metrics.performance.averageGetTime > 10) {
      recommendations.push('缓存读取平均耗时较高，建议优化数据结构或增加内存缓存比例')
    }
    
    if (metrics.performance.averageSetTime > 50) {
      recommendations.push('缓存写入平均耗时较高，建议检查序列化性能或存储策略')
    }
    
    // 淘汰率建议
    if (metrics.efficiency.evictionRate > 0.1) {
      recommendations.push('缓存淘汰率较高，建议增加缓存容量或优化淘汰策略')
    }
    
    // 错误率建议
    if (metrics.performance.errorRate > 0.05) {
      recommendations.push('缓存错误率较高，建议检查存储可用性和错误处理逻辑')
    }
    
    return recommendations
  }
  
  // 记录事件
  private recordEvent(event: CacheEvent): void {
    // 添加到事件列表
    this.events.push(event)
    
    // 限制事件数量
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents)
    }
    
    // 更新计数器
    if (event.type in this.eventCounts) {
      this.eventCounts[event.type as keyof typeof this.eventCounts]++
    }
    
    // 记录性能数据
    if (event.metadata?.duration) {
      const key = `${event.type}_${event.layer}`
      if (!this.performanceData.has(key)) {
        this.performanceData.set(key, [])
      }
      const durations = this.performanceData.get(key)!
      durations.push(event.metadata.duration)
      
      // 限制性能数据数量
      if (durations.length > 100) {
        durations.splice(0, durations.length - 100)
      }
    }
  }
  
  // 清理监控数据
  clearMonitoringData(): void {
    this.events = []
    this.eventCounts = { hit: 0, miss: 0, set: 0, delete: 0, evict: 0, cleanup: 0 }
    this.performanceData.clear()
    this.startTime = Date.now()
    
    console.log('🧹 监控数据已清理')
  }
}

// 创建全局监控实例
let globalMonitor: CacheMonitorImpl | null = null

export function getCacheMonitor(): CacheMonitorImpl {
  if (!globalMonitor) {
    globalMonitor = new CacheMonitorImpl()
  }
  return globalMonitor
}

// 延迟初始化监控（避免循环依赖）
export function initCacheMonitoring() {
  if (import.meta.env.DEV) {
    const monitor = getCacheMonitor()
    monitor.startMonitoring()

    // 添加全局调试方法
    ;(window as any).__cacheDebug = {
      monitor,
      getStats: () => monitor.getRealTimeStats(),
      getMetrics: () => monitor.getMetrics(),
      getTopKeys: (limit?: number) => monitor.getTopKeys(limit),
      exportStats: () => monitor.exportStats(),
      clearData: () => monitor.clearMonitoringData()
    }

    console.log('🔧 缓存调试工具已加载，使用 window.__cacheDebug 访问')
  }
}
