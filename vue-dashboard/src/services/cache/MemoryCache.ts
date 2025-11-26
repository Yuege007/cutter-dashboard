/**
 * 内存缓存实现
 * 特点：极速访问、LRU淘汰、TTL过期、内存限制
 */

import type { ICache, CacheItem, CacheOptions, CacheStats, CacheLayer } from './types'
import { CacheUtils } from './utils'

export class MemoryCache implements ICache {
  private cache = new Map<string, CacheItem>()
  private accessOrder = new Map<string, number>() // LRU访问顺序
  private cacheStats = {
    hitCount: 0,
    missCount: 0,
    evictionCount: 0,
    lastCleanup: Date.now()
  }
  
  private readonly maxSize: number
  private readonly maxMemory: number
  private readonly cleanupInterval: number
  private cleanupTimer?: ReturnType<typeof setInterval>
  
  constructor(options: {
    maxSize?: number
    maxMemory?: number // 字节
    cleanupInterval?: number // 毫秒
  } = {}) {
    this.maxSize = options.maxSize || 1000
    this.maxMemory = options.maxMemory || 50 * 1024 * 1024 // 50MB
    this.cleanupInterval = options.cleanupInterval || 60000 // 1分钟
    
    this.startCleanupTimer()
  }
  
  async get<T>(key: string): Promise<T | null> {
    const item = this.cache.get(key)
    
    if (!item) {
      this.cacheStats.missCount++
      return null
    }

    // 检查是否过期
    if (CacheUtils.isExpired(item.timestamp, item.ttl)) {
      this.cache.delete(key)
      this.accessOrder.delete(key)
      this.cacheStats.missCount++
      return null
    }

    // 更新访问信息
    item.lastAccess = Date.now()
    item.accessCount = (item.accessCount || 0) + 1
    this.accessOrder.set(key, Date.now())

    this.cacheStats.hitCount++
    return CacheUtils.deepClone(item.data) as T
  }
  
  async set<T>(key: string, data: T, options: CacheOptions = {}): Promise<boolean> {
    try {
      const now = Date.now()
      const ttl = options.ttl || 300000 // 默认5分钟
      const size = CacheUtils.calculateSize(data)
      
      // 检查内存限制
      if (size > this.maxMemory) {
        console.warn(`数据过大，无法缓存: ${key} (${CacheUtils.formatBytes(size)})`)
        return false
      }
      
      const cacheItem: CacheItem<T> = {
        data: CacheUtils.deepClone(data),
        timestamp: now,
        ttl,
        version: options.version,
        size,
        accessCount: 0,
        lastAccess: now
      }
      
      // 如果缓存已满，执行LRU淘汰
      if (this.cache.size >= this.maxSize) {
        this.evictLRU(1)
      }
      
      // 检查内存使用量
      await this.checkMemoryUsage()
      
      this.cache.set(key, cacheItem)
      this.accessOrder.set(key, now)
      
      return true
    } catch (error) {
      console.error('内存缓存设置失败:', error)
      return false
    }
  }
  
  async delete(key: string): Promise<boolean> {
    const deleted = this.cache.delete(key)
    this.accessOrder.delete(key)
    return deleted
  }
  
  async clear(): Promise<boolean> {
    this.cache.clear()
    this.accessOrder.clear()
    this.resetStats()
    return true
  }
  
  async has(key: string): Promise<boolean> {
    const item = this.cache.get(key)
    if (!item) return false
    
    // 检查是否过期
    if (CacheUtils.isExpired(item.timestamp, item.ttl)) {
      this.cache.delete(key)
      this.accessOrder.delete(key)
      return false
    }
    
    return true
  }
  
  async keys(): Promise<string[]> {
    const validKeys: string[] = []
    const now = Date.now()
    
    for (const [key, item] of this.cache.entries()) {
      if (!CacheUtils.isExpired(item.timestamp, item.ttl)) {
        validKeys.push(key)
      } else {
        // 清理过期项
        this.cache.delete(key)
        this.accessOrder.delete(key)
      }
    }
    
    return validKeys
  }
  
  async size(): Promise<number> {
    await this.cleanup() // 清理过期项后返回准确大小
    return this.cache.size
  }
  
  async stats(): Promise<CacheStats> {
    const totalSize = Array.from(this.cache.values())
      .reduce((sum, item) => sum + (item.size || 0), 0)
    
    const hitRate = this.cacheStats.hitCount + this.cacheStats.missCount > 0
      ? this.cacheStats.hitCount / (this.cacheStats.hitCount + this.cacheStats.missCount)
      : 0

    return {
      layer: 'memory' as CacheLayer,
      totalItems: this.cache.size,
      totalSize,
      hitCount: this.cacheStats.hitCount,
      missCount: this.cacheStats.missCount,
      hitRate,
      evictionCount: this.cacheStats.evictionCount,
      lastCleanup: this.cacheStats.lastCleanup
    }
  }
  
  // 获取缓存详细信息
  getDetailedInfo(): {
    items: Array<{ key: string, size: number, age: number, accessCount: number }>
    memoryUsage: number
    oldestItem: string | null
    newestItem: string | null
  } {
    const items: Array<{ key: string, size: number, age: number, accessCount: number }> = []
    let totalSize = 0
    let oldestTime = Infinity
    let newestTime = 0
    let oldestKey: string | null = null
    let newestKey: string | null = null
    
    const now = Date.now()
    
    for (const [key, item] of this.cache.entries()) {
      const age = now - item.timestamp
      items.push({
        key,
        size: item.size || 0,
        age,
        accessCount: item.accessCount || 0
      })
      
      totalSize += item.size || 0
      
      if (item.timestamp < oldestTime) {
        oldestTime = item.timestamp
        oldestKey = key
      }
      
      if (item.timestamp > newestTime) {
        newestTime = item.timestamp
        newestKey = key
      }
    }
    
    return {
      items: items.sort((a, b) => b.accessCount - a.accessCount), // 按访问次数排序
      memoryUsage: totalSize,
      oldestItem: oldestKey,
      newestItem: newestKey
    }
  }
  
  // LRU淘汰策略
  private evictLRU(count: number): void {
    const entries = Array.from(this.accessOrder.entries())
      .sort(([, timeA], [, timeB]) => timeA - timeB) // 按访问时间排序
    
    for (let i = 0; i < Math.min(count, entries.length); i++) {
      const [key] = entries[i]
      this.cache.delete(key)
      this.accessOrder.delete(key)
      this.cacheStats.evictionCount++
    }
  }
  
  // 检查内存使用量
  private async checkMemoryUsage(): Promise<void> {
    const totalSize = Array.from(this.cache.values())
      .reduce((sum, item) => sum + (item.size || 0), 0)
    
    if (totalSize > this.maxMemory) {
      // 淘汰最少使用的项，直到内存使用量降到阈值以下
      const targetSize = this.maxMemory * 0.8 // 淘汰到80%
      let currentSize = totalSize
      
      const entries = Array.from(this.cache.entries())
        .sort(([, a], [, b]) => (a.lastAccess || 0) - (b.lastAccess || 0))
      
      for (const [key, item] of entries) {
        if (currentSize <= targetSize) break
        
        this.cache.delete(key)
        this.accessOrder.delete(key)
        currentSize -= item.size || 0
        this.cacheStats.evictionCount++
      }
    }
  }
  
  // 清理过期项
  private async cleanup(): Promise<void> {
    const cleanedCount = CacheUtils.cleanupExpiredItems(this.cache)
    
    // 同步清理访问顺序记录
    for (const key of this.accessOrder.keys()) {
      if (!this.cache.has(key)) {
        this.accessOrder.delete(key)
      }
    }
    
    this.cacheStats.lastCleanup = Date.now()
    
    if (cleanedCount > 0) {
      console.debug(`内存缓存清理完成，清理了 ${cleanedCount} 个过期项`)
    }
  }
  
  // 启动清理定时器
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup()
    }, this.cleanupInterval)
  }
  
  // 停止清理定时器
  private stopCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = undefined
    }
  }
  
  // 重置统计信息
  private resetStats(): void {
    this.stats = {
      hitCount: 0,
      missCount: 0,
      evictionCount: 0,
      lastCleanup: Date.now()
    }
  }
  
  // 销毁缓存
  destroy(): void {
    this.stopCleanupTimer()
    this.cache.clear()
    this.accessOrder.clear()
    this.resetStats()
  }
  
  // 预热缓存
  async warmup(data: Record<string, any>, options: CacheOptions = {}): Promise<void> {
    const promises = Object.entries(data).map(([key, value]) =>
      this.set(key, value, options)
    )
    
    await Promise.all(promises)
    console.debug(`内存缓存预热完成，加载了 ${Object.keys(data).length} 个项目`)
  }
}
