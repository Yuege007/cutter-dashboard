/**
 * IndexedDB缓存实现
 * 特点：大容量存储、异步操作、索引支持、结构化查询
 */

import type { ICache, CacheItem, CacheOptions, CacheStats, CacheLayer } from './types'
import { CacheUtils } from './utils'

interface IndexedDBCacheItem extends CacheItem {
  key: string
  tags?: string[]
}

export class IndexedDBCache implements ICache {
  private db: IDBDatabase | null = null
  private readonly dbName: string
  private readonly version: number
  private readonly storeName = 'cache'
  private readonly maxSize: number
  private readonly enableIndex: boolean
  
  private cacheStats = {
    hitCount: 0,
    missCount: 0,
    evictionCount: 0,
    lastCleanup: Date.now()
  }
  
  private initPromise: Promise<void> | null = null
  
  constructor(options: {
    dbName?: string
    version?: number
    maxSize?: number // 字节
    enableIndex?: boolean
  } = {}) {
    this.dbName = options.dbName || 'DashboardCacheDB'
    this.version = options.version || 1
    this.maxSize = options.maxSize || 100 * 1024 * 1024 // 100MB
    this.enableIndex = options.enableIndex ?? true
  }
  
  private async init(): Promise<void> {
    if (this.initPromise) {
      return this.initPromise
    }
    
    this.initPromise = new Promise((resolve, reject) => {
      if (!('indexedDB' in window)) {
        reject(new Error('IndexedDB不支持'))
        return
      }
      
      const request = indexedDB.open(this.dbName, this.version)
      
      request.onerror = () => {
        reject(new Error(`IndexedDB打开失败: ${request.error?.message}`))
      }
      
      request.onsuccess = () => {
        this.db = request.result
        
        // 设置错误处理
        this.db.onerror = (event) => {
          console.error('IndexedDB错误:', event)
        }
        
        resolve()
      }
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        
        // 创建对象存储
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'key' })
          
          if (this.enableIndex) {
            // 创建索引
            store.createIndex('timestamp', 'timestamp', { unique: false })
            store.createIndex('ttl', 'ttl', { unique: false })
            store.createIndex('tags', 'tags', { unique: false, multiEntry: true })
            store.createIndex('size', 'size', { unique: false })
            store.createIndex('lastAccess', 'lastAccess', { unique: false })
          }
        }
      }
    })
    
    return this.initPromise
  }
  
  async get<T>(key: string): Promise<T | null> {
    try {
      await this.init()
      
      if (!this.db) {
        this.cacheStats.missCount++
        return null
      }

      const transaction = this.db.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      const request = store.get(key)

      const result = await this.promisifyRequest<IndexedDBCacheItem>(request)

      if (!result) {
        this.cacheStats.missCount++
        return null
      }

      // 检查是否过期
      if (CacheUtils.isExpired(result.timestamp, result.ttl)) {
        await this.delete(key)
        this.cacheStats.missCount++
        return null
      }

      // 更新访问信息
      result.lastAccess = Date.now()
      result.accessCount = (result.accessCount || 0) + 1

      // 异步更新访问信息（不等待完成）
      this.updateAccessInfo(key, result.lastAccess, result.accessCount)

      this.cacheStats.hitCount++
      return result.data as T
    } catch (error) {
      console.error('IndexedDB读取失败:', error)
      this.cacheStats.missCount++
      return null
    }
  }
  
  async set<T>(key: string, data: T, options: CacheOptions = {}): Promise<boolean> {
    try {
      await this.init()
      
      if (!this.db) {
        return false
      }
      
      const now = Date.now()
      const ttl = options.ttl || 24 * 60 * 60 * 1000 // 默认1天
      const size = CacheUtils.calculateSize(data)
      
      // 检查数据大小
      if (size > this.maxSize) {
        console.warn(`数据过大，无法存储到IndexedDB: ${key} (${CacheUtils.formatBytes(size)})`)
        return false
      }
      
      const cacheItem: IndexedDBCacheItem = {
        key,
        data,
        timestamp: now,
        ttl,
        version: options.version,
        size,
        accessCount: 0,
        lastAccess: now,
        tags: options.tags || []
      }
      
      const transaction = this.db.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const request = store.put(cacheItem)
      
      await this.promisifyRequest(request)
      
      // 检查存储空间并清理
      await this.checkAndCleanup()
      
      return true
    } catch (error) {
      console.error('IndexedDB写入失败:', error)
      return false
    }
  }
  
  async delete(key: string): Promise<boolean> {
    try {
      await this.init()
      
      if (!this.db) {
        return false
      }
      
      const transaction = this.db.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const request = store.delete(key)
      
      await this.promisifyRequest(request)
      return true
    } catch (error) {
      console.error('IndexedDB删除失败:', error)
      return false
    }
  }
  
  async clear(): Promise<boolean> {
    try {
      await this.init()
      
      if (!this.db) {
        return false
      }
      
      const transaction = this.db.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const request = store.clear()
      
      await this.promisifyRequest(request)
      this.resetCacheStats()
      return true
    } catch (error) {
      console.error('IndexedDB清空失败:', error)
      return false
    }
  }
  
  async has(key: string): Promise<boolean> {
    try {
      await this.init()
      
      if (!this.db) {
        return false
      }
      
      const transaction = this.db.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      const request = store.get(key)
      
      const result = await this.promisifyRequest<IndexedDBCacheItem>(request)
      
      if (!result) return false
      
      // 检查是否过期
      if (CacheUtils.isExpired(result.timestamp, result.ttl)) {
        await this.delete(key)
        return false
      }
      
      return true
    } catch {
      return false
    }
  }
  
  async keys(): Promise<string[]> {
    try {
      await this.init()
      
      if (!this.db) {
        return []
      }
      
      const transaction = this.db.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      const request = store.getAllKeys()
      
      const keys = await this.promisifyRequest<IDBValidKey[]>(request)
      return keys.filter(key => typeof key === 'string') as string[]
    } catch (error) {
      console.error('获取IndexedDB键列表失败:', error)
      return []
    }
  }
  
  async size(): Promise<number> {
    try {
      await this.init()
      
      if (!this.db) {
        return 0
      }
      
      const transaction = this.db.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      const request = store.count()
      
      return await this.promisifyRequest<number>(request)
    } catch (error) {
      console.error('获取IndexedDB大小失败:', error)
      return 0
    }
  }
  
  async stats(): Promise<CacheStats> {
    try {
      const totalItems = await this.size()
      let totalSize = 0
      
      if (this.db) {
        const transaction = this.db.transaction([this.storeName], 'readonly')
        const store = transaction.objectStore(this.storeName)
        const request = store.getAll()
        
        const items = await this.promisifyRequest<IndexedDBCacheItem[]>(request)
        totalSize = items.reduce((sum, item) => sum + (item.size || 0), 0)
      }
      
      const hitRate = this.cacheStats.hitCount + this.cacheStats.missCount > 0
        ? this.cacheStats.hitCount / (this.cacheStats.hitCount + this.cacheStats.missCount)
        : 0

      return {
        layer: 'indexedDB' as CacheLayer,
        totalItems,
        totalSize,
        hitCount: this.cacheStats.hitCount,
        missCount: this.cacheStats.missCount,
        hitRate,
        evictionCount: this.cacheStats.evictionCount,
        lastCleanup: this.cacheStats.lastCleanup
      }
    } catch (error) {
      console.error('获取IndexedDB统计失败:', error)
      return {
        layer: 'indexedDB' as CacheLayer,
        totalItems: 0,
        totalSize: 0,
        hitCount: this.cacheStats.hitCount,
        missCount: this.cacheStats.missCount,
        hitRate: 0,
        evictionCount: this.cacheStats.evictionCount,
        lastCleanup: this.cacheStats.lastCleanup
      }
    }
  }
  
  // 按标签查询
  async getByTags(tags: string[]): Promise<Array<{ key: string, data: any }>> {
    try {
      await this.init()
      
      if (!this.db || !this.enableIndex) {
        return []
      }
      
      const transaction = this.db.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      const index = store.index('tags')
      
      const results: Array<{ key: string, data: any }> = []
      
      for (const tag of tags) {
        const request = index.getAll(tag)
        const items = await this.promisifyRequest<IndexedDBCacheItem[]>(request)
        
        for (const item of items) {
          if (!CacheUtils.isExpired(item.timestamp, item.ttl)) {
            results.push({ key: item.key, data: item.data })
          }
        }
      }
      
      return results
    } catch (error) {
      console.error('按标签查询失败:', error)
      return []
    }
  }
  
  // 按标签清理
  async clearByTags(tags: string[]): Promise<number> {
    try {
      const items = await this.getByTags(tags)
      let clearedCount = 0
      
      for (const item of items) {
        if (await this.delete(item.key)) {
          clearedCount++
        }
      }
      
      return clearedCount
    } catch (error) {
      console.error('按标签清理失败:', error)
      return 0
    }
  }
  
  // 私有方法
  private promisifyRequest<T = any>(request: IDBRequest): Promise<T> {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }
  
  private async updateAccessInfo(key: string, lastAccess: number, accessCount: number): Promise<void> {
    try {
      if (!this.db) return
      
      const transaction = this.db.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const getRequest = store.get(key)
      
      const item = await this.promisifyRequest<IndexedDBCacheItem>(getRequest)
      if (item) {
        item.lastAccess = lastAccess
        item.accessCount = accessCount
        
        const putRequest = store.put(item)
        await this.promisifyRequest(putRequest)
      }
    } catch (error) {
      // 忽略访问信息更新失败
      console.debug('更新访问信息失败:', error)
    }
  }
  
  private async checkAndCleanup(): Promise<void> {
    try {
      // 获取当前存储使用情况
      const currentSize = await this.getCurrentStorageSize()

      // 如果存储使用量超过阈值，执行清理
      if (currentSize > this.maxSize * 0.9) {
        await this.cleanup()
      }
    } catch (error) {
      console.error('检查和清理失败:', error)
    }
  }

  // 获取当前存储大小的辅助方法
  private async getCurrentStorageSize(): Promise<number> {
    try {
      if (!this.db) return 0

      const transaction = this.db.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      const request = store.getAll()

      const items = await this.promisifyRequest<IndexedDBCacheItem[]>(request)
      return items.reduce((sum, item) => sum + (item.size || 0), 0)
    } catch (error) {
      console.error('获取存储大小失败:', error)
      return 0
    }
  }
  
  private async cleanup(): Promise<void> {
    try {
      await this.init()
      
      if (!this.db) return
      
      const transaction = this.db.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const request = store.getAll()
      
      const items = await this.promisifyRequest<IndexedDBCacheItem[]>(request)
      const now = Date.now()
      let cleanedCount = 0
      
      // 清理过期项
      for (const item of items) {
        if (CacheUtils.isExpired(item.timestamp, item.ttl)) {
          await store.delete(item.key)
          cleanedCount++
        }
      }
      
      // 如果还是超出限制，按LRU清理
      const remainingItems = items.filter(item => !CacheUtils.isExpired(item.timestamp, item.ttl))
      const currentSize = remainingItems.reduce((sum, item) => sum + (item.size || 0), 0)
      
      if (currentSize > this.maxSize * 0.8) {
        const sortedItems = remainingItems.sort((a, b) => (a.lastAccess || 0) - (b.lastAccess || 0))
        let sizeToRemove = currentSize - this.maxSize * 0.7
        
        for (const item of sortedItems) {
          if (sizeToRemove <= 0) break
          
          await store.delete(item.key)
          sizeToRemove -= item.size || 0
          cleanedCount++
          this.cacheStats.evictionCount++
        }
      }

      this.cacheStats.lastCleanup = now
      
      if (cleanedCount > 0) {
        console.debug(`IndexedDB缓存清理完成，清理了 ${cleanedCount} 个项目`)
      }
    } catch (error) {
      console.error('IndexedDB清理失败:', error)
    }
  }
  
  private resetCacheStats(): void {
    this.cacheStats = {
      hitCount: 0,
      missCount: 0,
      evictionCount: 0,
      lastCleanup: Date.now()
    }
  }

  // 销毁数据库连接
  destroy(): void {
    if (this.db) {
      this.db.close()
      this.db = null
    }
    this.initPromise = null
    this.resetCacheStats()
  }
}
