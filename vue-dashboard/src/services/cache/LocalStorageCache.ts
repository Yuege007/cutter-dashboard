/**
 * localStorage缓存实现
 * 特点：持久化存储、版本管理、压缩支持、容量检测
 */

import type { ICache, CacheItem, CacheOptions, CacheStats, CacheLayer } from './types'
import { CacheUtils, SimpleCacheCompressor } from './utils'

export class LocalStorageCache implements ICache {
  private readonly keyPrefix: string
  private readonly maxSize: number
  private readonly enableCompression: boolean
  private readonly versionCheck: boolean
  private readonly compressor: SimpleCacheCompressor
  
  private cacheStats = {
    hitCount: 0,
    missCount: 0,
    evictionCount: 0,
    lastCleanup: Date.now()
  }
  
  constructor(options: {
    keyPrefix?: string
    maxSize?: number // 字节
    enableCompression?: boolean
    versionCheck?: boolean
  } = {}) {
    this.keyPrefix = options.keyPrefix || 'dashboard_cache_'
    this.maxSize = options.maxSize || 5 * 1024 * 1024 // 5MB
    this.enableCompression = options.enableCompression ?? true
    this.versionCheck = options.versionCheck ?? true
    this.compressor = new SimpleCacheCompressor()
    
    // 检查localStorage可用性
    if (!this.isAvailable()) {
      console.warn('localStorage不可用，LocalStorageCache将无法正常工作')
    }
  }
  
  async get<T>(key: string): Promise<T | null> {
    if (!this.isAvailable()) {
      this.cacheStats.missCount++
      return null
    }

    try {
      const fullKey = this.getFullKey(key)
      const stored = localStorage.getItem(fullKey)

      if (!stored) {
        this.cacheStats.missCount++
        return null
      }

      const wrapper = JSON.parse(stored)

      // 检查数据格式
      if (!this.isValidCacheItem(wrapper)) {
        localStorage.removeItem(fullKey)
        this.cacheStats.missCount++
        return null
      }

      // 检查是否过期
      if (CacheUtils.isExpired(wrapper.timestamp, wrapper.ttl)) {
        localStorage.removeItem(fullKey)
        this.cacheStats.missCount++
        return null
      }

      // 版本检查
      if (this.versionCheck && wrapper.version && wrapper.version !== this.getCurrentVersion()) {
        localStorage.removeItem(fullKey)
        this.cacheStats.missCount++
        return null
      }
      
      // 解压数据
      let data = wrapper.data
      if (wrapper.compressed && this.enableCompression) {
        try {
          data = await this.compressor.decompress(wrapper.data)
        } catch (error) {
          console.warn(`缓存数据解压失败，清理损坏的缓存项: ${key}`, error)
          // 清理损坏的缓存项
          localStorage.removeItem(fullKey)
          this.cacheStats.missCount++
          return null
        }
      }

      // 更新访问信息
      wrapper.lastAccess = Date.now()
      wrapper.accessCount = (wrapper.accessCount || 0) + 1

      // 回写更新的访问信息
      localStorage.setItem(fullKey, JSON.stringify(wrapper))

      this.cacheStats.hitCount++
      return data as T
    } catch (error) {
      console.error('localStorage读取失败:', error)
      this.cacheStats.missCount++
      return null
    }
  }
  
  async set<T>(key: string, data: T, options: CacheOptions = {}): Promise<boolean> {
    if (!this.isAvailable()) {
      return false
    }
    
    try {
      const now = Date.now()
      const ttl = options.ttl || 7 * 24 * 60 * 60 * 1000 // 默认7天
      
      // 准备缓存项
      let processedData: any = data
      let compressed = false
      
      // 压缩数据
      if (this.enableCompression && options.compress !== false) {
        const originalSize = CacheUtils.calculateSize(data)
        if (originalSize > 1024) { // 大于1KB才压缩
          processedData = await this.compressor.compress(data)
          compressed = true
        }
      }
      
      const cacheItem = {
        data: processedData,
        timestamp: now,
        ttl,
        version: options.version || this.getCurrentVersion(),
        size: CacheUtils.calculateSize(processedData),
        accessCount: 0,
        lastAccess: now,
        compressed,
        tags: options.tags || []
      }
      
      const fullKey = this.getFullKey(key)
      const serialized = JSON.stringify(cacheItem)
      
      // 检查存储空间
      if (!await this.checkStorageSpace(serialized.length)) {
        console.warn('localStorage空间不足，尝试清理后重试')
        await this.cleanup()
        
        if (!await this.checkStorageSpace(serialized.length)) {
          console.error('localStorage空间不足，无法存储数据')
          return false
        }
      }
      
      localStorage.setItem(fullKey, serialized)
      return true
    } catch (error) {
      console.error('localStorage写入失败:', error)
      
      // 如果是配额超出错误，尝试清理
      if (error.name === 'QuotaExceededError') {
        await this.cleanup()
        try {
          const cacheItem = {
            data,
            timestamp: Date.now(),
            ttl: options.ttl || 7 * 24 * 60 * 60 * 1000,
            version: options.version || this.getCurrentVersion()
          }
          localStorage.setItem(this.getFullKey(key), JSON.stringify(cacheItem))
          return true
        } catch {
          return false
        }
      }
      
      return false
    }
  }
  
  async delete(key: string): Promise<boolean> {
    if (!this.isAvailable()) {
      return false
    }
    
    try {
      const fullKey = this.getFullKey(key)
      localStorage.removeItem(fullKey)
      return true
    } catch (error) {
      console.error('localStorage删除失败:', error)
      return false
    }
  }
  
  async clear(): Promise<boolean> {
    if (!this.isAvailable()) {
      return false
    }
    
    try {
      const keysToRemove: string[] = []
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith(this.keyPrefix)) {
          keysToRemove.push(key)
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key))
      this.resetStats()
      return true
    } catch (error) {
      console.error('localStorage清空失败:', error)
      return false
    }
  }
  
  async has(key: string): Promise<boolean> {
    if (!this.isAvailable()) {
      return false
    }
    
    try {
      const fullKey = this.getFullKey(key)
      const stored = localStorage.getItem(fullKey)
      
      if (!stored) return false
      
      const wrapper = JSON.parse(stored)
      
      // 检查是否过期
      if (CacheUtils.isExpired(wrapper.timestamp, wrapper.ttl)) {
        localStorage.removeItem(fullKey)
        return false
      }
      
      return true
    } catch {
      return false
    }
  }
  
  async keys(): Promise<string[]> {
    if (!this.isAvailable()) {
      return []
    }
    
    const keys: string[] = []
    const now = Date.now()
    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const fullKey = localStorage.key(i)
        if (!fullKey || !fullKey.startsWith(this.keyPrefix)) continue
        
        const key = fullKey.substring(this.keyPrefix.length)
        const stored = localStorage.getItem(fullKey)
        
        if (stored) {
          try {
            const wrapper = JSON.parse(stored)
            if (!CacheUtils.isExpired(wrapper.timestamp, wrapper.ttl)) {
              keys.push(key)
            } else {
              // 清理过期项
              localStorage.removeItem(fullKey)
            }
          } catch {
            // 清理无效项
            localStorage.removeItem(fullKey)
          }
        }
      }
    } catch (error) {
      console.error('获取localStorage键列表失败:', error)
    }
    
    return keys
  }
  
  async size(): Promise<number> {
    const keys = await this.keys()
    return keys.length
  }
  
  async stats(): Promise<CacheStats> {
    const keys = await this.keys()
    let totalSize = 0
    
    for (const key of keys) {
      try {
        const fullKey = this.getFullKey(key)
        const stored = localStorage.getItem(fullKey)
        if (stored) {
          const wrapper = JSON.parse(stored)
          totalSize += wrapper.size || 0
        }
      } catch {
        // 忽略解析错误
      }
    }
    
    const hitRate = this.cacheStats.hitCount + this.cacheStats.missCount > 0
      ? this.cacheStats.hitCount / (this.cacheStats.hitCount + this.cacheStats.missCount)
      : 0

    return {
      layer: 'localStorage' as CacheLayer,
      totalItems: keys.length,
      totalSize,
      hitCount: this.cacheStats.hitCount,
      missCount: this.cacheStats.missCount,
      hitRate,
      evictionCount: this.cacheStats.evictionCount,
      lastCleanup: this.cacheStats.lastCleanup
    }
  }
  
  // 按标签清理
  async clearByTags(tags: string[]): Promise<number> {
    if (!this.isAvailable()) {
      return 0
    }
    
    let clearedCount = 0
    const keys = await this.keys()
    
    for (const key of keys) {
      try {
        const fullKey = this.getFullKey(key)
        const stored = localStorage.getItem(fullKey)
        if (stored) {
          const wrapper = JSON.parse(stored)
          if (wrapper.tags && wrapper.tags.some((tag: string) => tags.includes(tag))) {
            localStorage.removeItem(fullKey)
            clearedCount++
          }
        }
      } catch {
        // 忽略错误
      }
    }
    
    return clearedCount
  }
  
  // 获取存储使用情况
  async getUsage(): Promise<{ used: number, available: number, percentage: number }> {
    if (!this.isAvailable()) {
      return { used: 0, available: 0, percentage: 0 }
    }
    
    let used = 0
    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith(this.keyPrefix)) {
          const value = localStorage.getItem(key)
          if (value) {
            used += key.length + value.length
          }
        }
      }
    } catch {
      // 忽略错误
    }
    
    const available = this.maxSize - used
    const percentage = this.maxSize > 0 ? (used / this.maxSize) * 100 : 0
    
    return { used, available, percentage }
  }
  
  // 私有方法
  private isAvailable(): boolean {
    try {
      const testKey = '__test__'
      localStorage.setItem(testKey, 'test')
      localStorage.removeItem(testKey)
      return true
    } catch {
      return false
    }
  }
  
  private getFullKey(key: string): string {
    return this.keyPrefix + key
  }
  
  private getCurrentVersion(): string {
    return '1.0' // 可以从package.json或其他地方获取
  }
  
  private isValidCacheItem(item: any): boolean {
    return item &&
           typeof item.data !== 'undefined' &&
           typeof item.timestamp === 'number' &&
           typeof item.ttl === 'number'
  }
  
  private async checkStorageSpace(requiredSize: number): Promise<boolean> {
    const usage = await this.getUsage()

    // 如果可用空间不足，或者使用量超过80%，返回false触发清理
    const usageRatio = usage.used / (usage.used + usage.available)
    return usage.available >= requiredSize && usageRatio < 0.8
  }
  
  private async cleanup(): Promise<void> {
    if (!this.isAvailable()) {
      return
    }
    
    let cleanedCount = 0
    const now = Date.now()
    
    try {
      const keysToRemove: string[] = []
      
      for (let i = 0; i < localStorage.length; i++) {
        const fullKey = localStorage.key(i)
        if (!fullKey || !fullKey.startsWith(this.keyPrefix)) continue
        
        const stored = localStorage.getItem(fullKey)
        if (stored) {
          try {
            const wrapper = JSON.parse(stored)
            if (CacheUtils.isExpired(wrapper.timestamp, wrapper.ttl)) {
              keysToRemove.push(fullKey)
            }
          } catch {
            // 清理无效项
            keysToRemove.push(fullKey)
          }
        }
      }
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key)
        cleanedCount++
      })
      
      this.cacheStats.lastCleanup = now
      
      if (cleanedCount > 0) {
        console.debug(`localStorage缓存清理完成，清理了 ${cleanedCount} 个项目`)
      }
    } catch (error) {
      console.error('localStorage清理失败:', error)
    }
  }
  
  private resetStats(): void {
    this.stats = {
      hitCount: 0,
      missCount: 0,
      evictionCount: 0,
      lastCleanup: Date.now()
    }
  }
}
