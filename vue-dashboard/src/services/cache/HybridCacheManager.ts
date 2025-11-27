/**
 * 混合缓存管理器
 * 统一管理四层缓存：Memory -> localStorage -> IndexedDB -> HTTP
 */

import type { 
  ICacheManager, 
  CacheOptions, 
  CacheLayer, 
  CacheStats, 
  CacheEvent,
  CacheStrategy,
  DataClassification
} from './types'
import { CacheLayer as CacheLayerEnum } from './types'
import { MemoryCache } from './MemoryCache'
import { LocalStorageCache } from './LocalStorageCache'
import { IndexedDBCache } from './IndexedDBCache'
import { HttpCache } from './HttpCache'
import { CacheUtils, DefaultCacheKeyGenerator } from './utils'
import { DEFAULT_CACHE_STRATEGY, DEFAULT_DATA_CLASSIFICATION } from './types'

export class HybridCacheManager implements ICacheManager {
  private memoryCache: MemoryCache
  private localStorageCache: LocalStorageCache
  private indexedDBCache: IndexedDBCache
  private httpCache: HttpCache
  
  private keyGenerator = new DefaultCacheKeyGenerator()
  private eventListeners = new Map<string, Array<(event: CacheEvent) => void>>()
  
  private strategy: CacheStrategy
  private dataClassification: DataClassification
  private enableHeavyIDB: boolean
  
  constructor(
    strategy: Partial<CacheStrategy> = {},
    dataClassification: Partial<DataClassification> = {}
  ) {
    this.strategy = { ...DEFAULT_CACHE_STRATEGY, ...strategy }
    this.dataClassification = { ...DEFAULT_DATA_CLASSIFICATION, ...dataClassification }
    // 是否启用重数据的 IndexedDB 持久化（默认关闭，设置 VITE_CACHE_HEAVY_USE_IDB=true 开启）
    this.enableHeavyIDB = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_CACHE_HEAVY_USE_IDB === 'true')
    
    // 初始化各层缓存
    this.memoryCache = new MemoryCache({
      maxSize: this.strategy.memory.maxSize,
      maxMemory: this.strategy.memory.maxMemory,
      cleanupInterval: this.strategy.memory.cleanupInterval
    })
    
    this.localStorageCache = new LocalStorageCache({
      keyPrefix: this.strategy.localStorage.keyPrefix,
      maxSize: this.strategy.localStorage.maxSize,
      enableCompression: this.strategy.localStorage.enableCompression,
      versionCheck: this.strategy.localStorage.versionCheck
    })
    
    this.indexedDBCache = new IndexedDBCache({
      dbName: this.strategy.indexedDB.dbName,
      version: this.strategy.indexedDB.version,
      maxSize: this.strategy.indexedDB.maxSize,
      enableIndex: this.strategy.indexedDB.enableIndex
    })
    
    this.httpCache = new HttpCache({
      defaultTTL: this.strategy.http.defaultTTL,
      enableETag: this.strategy.http.enableETag,
      enableGzip: this.strategy.http.enableGzip
    })
  }
  
  async get<T>(key: string, options: { layer?: CacheLayer } = {}): Promise<T | null> {
    const startTime = performance.now()
    
    try {
      // 如果指定了特定层级，直接查询该层
      if (options.layer) {
        const result = await this.getFromLayer<T>(key, options.layer)
        this.emitEvent(result !== null ? 'hit' : 'miss', options.layer, key, { duration: performance.now() - startTime })
        return result
      }
      
      // 多层级查询策略
      // 1. 首先检查内存缓存 (最快)
      let data = await this.memoryCache.get<T>(key)
      if (data !== null) {
        this.emitEvent('hit', CacheLayerEnum.MEMORY, key, { duration: performance.now() - startTime })
        return data
      }
      
      // 2. 检查localStorage (中等速度)
      data = await this.localStorageCache.get<T>(key)
      if (data !== null) {
        // 回填到内存缓存
        await this.memoryCache.set(key, data, { ttl: this.getDefaultTTL(key) })
        this.emitEvent('hit', CacheLayerEnum.LOCAL_STORAGE, key, { duration: performance.now() - startTime })
        return data
      }
      
      // 3. 检查IndexedDB (较慢但容量大)
      data = await this.indexedDBCache.get<T>(key)
      if (data !== null) {
        // 回填到上层缓存：重数据不回填 localStorage
        const ttl = this.getDefaultTTL(key)
        const promises: Promise<boolean>[] = []
        promises.push(this.memoryCache.set(key, data, { ttl }))
        if (this.shouldBackfillLocalStorage(key, data)) {
          promises.push(this.localStorageCache.set(key, data, { ttl }))
        }
        await Promise.allSettled(promises)
        this.emitEvent('hit', CacheLayerEnum.INDEXED_DB, key, { duration: performance.now() - startTime })
        return data
      }
      
      // 4. 检查HTTP缓存 (网络层)
      data = await this.httpCache.get<T>(key)
      if (data !== null) {
        // 回填到其他缓存层：重数据不回填 localStorage；IndexedDB 受开关控制
        const ttl = this.getDefaultTTL(key)
        const promises: Promise<boolean>[] = []
        promises.push(this.memoryCache.set(key, data, { ttl }))
        if (this.shouldBackfillLocalStorage(key, data)) {
          promises.push(this.localStorageCache.set(key, data, { ttl }))
        }
        if (this.shouldStoreInIndexedDB(key, data, { ttl })) {
          promises.push(this.indexedDBCache.set(key, data, { ttl }))
        }
        await Promise.allSettled(promises)
        this.emitEvent('hit', CacheLayerEnum.HTTP, key, { duration: performance.now() - startTime })
        return data
      }
      
      // 所有缓存层都未命中
      this.emitEvent('miss', CacheLayerEnum.MEMORY, key, { duration: performance.now() - startTime })
      return null
    } catch (error) {
      console.error('缓存获取失败:', (error as any)?.message || error)
      this.emitEvent('miss', CacheLayerEnum.MEMORY, key, { 
        duration: performance.now() - startTime, 
        error: (error as any)?.message || String(error) 
      })
      return null
    }
  }
  
  async set<T>(key: string, data: T, options: CacheOptions = {}): Promise<boolean> {
    const startTime = performance.now()
    
    try {
      const classification = this.classifyData(key)
      const enhancedOptions = { ...options, ...classification }
      
      // 根据数据分类决定存储策略
      const promises: Promise<boolean>[] = []
      
      // 内存缓存 - 热点数据优先
      if (this.shouldStoreInMemory(key, data, enhancedOptions)) {
        promises.push(this.memoryCache.set(key, data, enhancedOptions))
      }
      
      // localStorage - 用户配置和小数据 (限制大小)
      if (this.shouldStoreInLocalStorage(key, data, enhancedOptions)) {
        const dataSize = CacheUtils.calculateSize(data)
        // 只有小于1MB的数据才存储到localStorage
        if (dataSize < 1024 * 1024) {
          promises.push(this.localStorageCache.set(key, data, enhancedOptions))
        } else {
          console.debug(`数据过大(${CacheUtils.formatBytes(dataSize)})，跳过localStorage存储: ${key}`)
        }
      }
      
      // IndexedDB - 大数据集
      if (this.shouldStoreInIndexedDB(key, data, enhancedOptions)) {
        promises.push(this.indexedDBCache.set(key, data, enhancedOptions))
      }
      
      // HTTP缓存 - API响应
      if (this.shouldStoreInHttpCache(key, data, enhancedOptions)) {
        promises.push(this.httpCache.set(key, data, enhancedOptions))
      }
      
      const results = await Promise.allSettled(promises)
      const success = results.some(result => result.status === 'fulfilled' && result.value)
      
      if (success) {
        this.emitEvent('set', CacheLayerEnum.MEMORY, key, { 
          duration: performance.now() - startTime,
          size: CacheUtils.calculateSize(data)
        })
      }
      
      return success
    } catch (error) {
      console.error('缓存设置失败:', (error as any)?.message || error)
      return false
    }
  }
  
  async delete(key: string, options: { layer?: CacheLayer } = {}): Promise<boolean> {
    try {
      if (options.layer) {
        const result = await this.deleteFromLayer(key, options.layer)
        if (result) {
          this.emitEvent('delete', options.layer, key)
        }
        return result
      }
      
      // 从所有层删除
      const promises = [
        this.memoryCache.delete(key),
        this.localStorageCache.delete(key),
        this.indexedDBCache.delete(key),
        this.httpCache.delete(key)
      ]
      
      const results = await Promise.allSettled(promises)
      const success = results.some(result => result.status === 'fulfilled' && result.value)
      
      if (success) {
        this.emitEvent('delete', CacheLayerEnum.MEMORY, key)
      }
      
      return success
    } catch (error) {
      console.error('缓存删除失败:', (error as any)?.message || error)
      return false
    }
  }
  
  async clear(options: { layer?: CacheLayer, tags?: string[] } = {}): Promise<boolean> {
    try {
      if (options.layer) {
        const result = await this.clearLayer(options.layer, options.tags)
        if (result) {
          this.emitEvent('cleanup', options.layer, 'all')
        }
        return result
      }
      
      // 清空所有层
      const promises = [
        this.memoryCache.clear(),
        this.localStorageCache.clear(),
        this.indexedDBCache.clear(),
        this.httpCache.clear()
      ]
      
      const results = await Promise.allSettled(promises)
      const success = results.every(result => result.status === 'fulfilled' && result.value)
      
      if (success) {
        this.emitEvent('cleanup', CacheLayerEnum.MEMORY, 'all')
      }
      
      return success
    } catch (error) {
      console.error('缓存清空失败:', (error as any)?.message || error)
      return false
    }
  }
  
  async invalidate(pattern: string | RegExp): Promise<number> {
    let invalidatedCount = 0
    
    try {
      const allKeys = await this.getAllKeys()
      const keysToInvalidate = allKeys.filter(key => {
        if (typeof pattern === 'string') {
          return key.includes(pattern)
        }
        return pattern.test(key)
      })
      
      for (const key of keysToInvalidate) {
        const deleted = await this.delete(key)
        if (deleted) {
          invalidatedCount++
        }
      }
      
      this.emitEvent('evict', CacheLayerEnum.MEMORY, `pattern:${pattern}`, { count: invalidatedCount })
      
      return invalidatedCount
    } catch (error) {
      console.error('缓存失效失败:', (error as any)?.message || error)
      return 0
    }
  }
  
  async warmup(keys: string[]): Promise<void> {
    // 预热功能的实现将在后续添加
    console.debug(`缓存预热: ${keys.length} 个键`)
  }
  
  async getAllStats(): Promise<Record<CacheLayer, CacheStats>> {
    const [memoryStats, localStorageStats, indexedDBStats, httpStats] = await Promise.all([
      this.memoryCache.stats(),
      this.localStorageCache.stats(),
      this.indexedDBCache.stats(),
      this.httpCache.stats()
    ])
    
    return {
      memory: memoryStats,
      localStorage: localStorageStats,
      indexedDB: indexedDBStats,
      http: httpStats
    }
  }
  
  on(event: string, callback: (event: CacheEvent) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, [])
    }
    this.eventListeners.get(event)!.push(callback)
  }
  
  off(event: string, callback: (event: CacheEvent) => void): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      const index = listeners.indexOf(callback)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }
  
  // 私有方法
  private async getFromLayer<T>(key: string, layer: CacheLayer): Promise<T | null> {
    switch (layer) {
      case 'memory':
        return this.memoryCache.get<T>(key)
      case 'localStorage':
        return this.localStorageCache.get<T>(key)
      case 'indexedDB':
        return this.indexedDBCache.get<T>(key)
      case 'http':
        return this.httpCache.get<T>(key)
      default:
        return null
    }
  }
  
  private async deleteFromLayer(key: string, layer: CacheLayer): Promise<boolean> {
    switch (layer) {
      case 'memory':
        return this.memoryCache.delete(key)
      case 'localStorage':
        return this.localStorageCache.delete(key)
      case 'indexedDB':
        return this.indexedDBCache.delete(key)
      case 'http':
        return this.httpCache.delete(key)
      default:
        return false
    }
  }
  
  private async clearLayer(layer: CacheLayer, tags?: string[]): Promise<boolean> {
    if (tags && tags.length > 0) {
      // 按标签清理
      if (layer === 'localStorage' && 'clearByTags' in this.localStorageCache) {
        await (this.localStorageCache as any).clearByTags(tags)
      }
      if (layer === 'indexedDB' && 'clearByTags' in this.indexedDBCache) {
        await (this.indexedDBCache as any).clearByTags(tags)
      }
      return true
    }
    
    switch (layer) {
      case 'memory':
        return this.memoryCache.clear()
      case 'localStorage':
        return this.localStorageCache.clear()
      case 'indexedDB':
        return this.indexedDBCache.clear()
      case 'http':
        return this.httpCache.clear()
      default:
        return false
    }
  }
  
  private async getAllKeys(): Promise<string[]> {
    const [memoryKeys, localStorageKeys, indexedDBKeys, httpKeys] = await Promise.all([
      this.memoryCache.keys(),
      this.localStorageCache.keys(),
      this.indexedDBCache.keys(),
      this.httpCache.keys()
    ])
    
    return [...new Set([...memoryKeys, ...localStorageKeys, ...indexedDBKeys, ...httpKeys])]
  }
  
  private classifyData(key: string): Partial<CacheOptions> {
    // 根据键模式分类数据
    for (const [category, config] of Object.entries(this.dataClassification)) {
      if (config.patterns.some((pattern: string) => key.includes(pattern))) {
        return {
          ttl: config.ttl,
          persistent: 'persistent' in config ? config.persistent : undefined,
          tags: [category]
        }
      }
    }
    
    return {}
  }
  
  private getDefaultTTL(key: string): number {
    const classification = this.classifyData(key)
    return classification.ttl || 300000 // 默认5分钟
  }
  
  private shouldStoreInMemory(key: string, data: any, options: CacheOptions): boolean {
    return this.dataClassification.hotData.patterns.some(pattern => key.includes(pattern))
  }
  
  private shouldStoreInLocalStorage(key: string, data: any, options: CacheOptions): boolean {
    // API响应或大数据集的键一律不存入 localStorage
    if (this.isHeavyDataKey(key)) {
      return false
    }
    // 检查数据大小，超过500KB的数据不存储到localStorage
    const dataSize = CacheUtils.calculateSize(data)
    if (dataSize > 512 * 1024) { // 512KB
      return false
    }

    return this.dataClassification.userConfig.patterns.some(pattern => key.includes(pattern)) ||
           options.persistent === true
  }
  
  private shouldStoreInIndexedDB(key: string, data: any, options: CacheOptions): boolean {
    const size = CacheUtils.calculateSize(data)
    if (!this.enableHeavyIDB) {
      return false
    }
    return this.dataClassification.largeDataset.patterns.some(pattern => key.includes(pattern)) ||
           size > this.dataClassification.largeDataset.sizeThreshold
  }
  
  private shouldStoreInHttpCache(key: string, data: any, options: CacheOptions): boolean {
    return this.dataClassification.apiResponse.patterns.some(pattern => key.includes(pattern))
  }
  
  private emitEvent(type: CacheEvent['type'], layer: CacheLayer, key: string, metadata?: any): void {
    const event: CacheEvent = {
      type,
      layer,
      key,
      timestamp: Date.now(),
      metadata
    }
    
    const listeners = this.eventListeners.get(type) || []
    listeners.forEach(callback => {
      try {
        callback(event)
      } catch (error) {
        console.error('缓存事件处理失败:', error)
      }
    })
  }

  // 判断是否为重数据键（API响应或大数据集）
  private isHeavyDataKey(key: string): boolean {
    const api = this.dataClassification.apiResponse.patterns.some(pattern => key.includes(pattern))
    const large = this.dataClassification.largeDataset.patterns.some(pattern => key.includes(pattern))
    return api || large
  }

  // 回填 localStorage 的判定：仅轻数据才回填
  private shouldBackfillLocalStorage(key: string, data: any): boolean {
    if (this.isHeavyDataKey(key)) {
      return false
    }
    const size = CacheUtils.calculateSize(data)
    // 限制 1MB 上限，且符合 userConfig 模式才回填
    if (size >= 1024 * 1024) {
      return false
    }
    return this.dataClassification.userConfig.patterns.some(pattern => key.includes(pattern))
  }
}
