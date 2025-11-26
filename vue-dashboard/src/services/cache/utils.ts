/**
 * 缓存系统工具函数
 */

import type { CacheKeyGenerator, CacheCompressor } from './types'

// 缓存键生成器实现
export class DefaultCacheKeyGenerator implements CacheKeyGenerator {
  generate(namespace: string, identifier: string, params?: Record<string, any>): string {
    let key = `${namespace}:${identifier}`
    
    if (params && Object.keys(params).length > 0) {
      // 对参数进行排序，确保相同参数生成相同的key
      const sortedParams = Object.keys(params)
        .sort()
        .map(k => `${k}=${this.serializeValue(params[k])}`)
        .join('&')
      
      key += `?${sortedParams}`
    }
    
    return key
  }
  
  parse(key: string): { namespace: string, identifier: string, params?: Record<string, any> } {
    const [baseKey, paramString] = key.split('?')
    const [namespace, identifier] = baseKey.split(':')
    
    let params: Record<string, any> | undefined
    
    if (paramString) {
      params = {}
      paramString.split('&').forEach(pair => {
        const [k, v] = pair.split('=')
        params![k] = this.deserializeValue(v)
      })
    }
    
    return { namespace, identifier, params }
  }
  
  private serializeValue(value: any): string {
    if (typeof value === 'string') return encodeURIComponent(value)
    return encodeURIComponent(JSON.stringify(value))
  }
  
  private deserializeValue(value: string): any {
    const decoded = decodeURIComponent(value)
    try {
      return JSON.parse(decoded)
    } catch {
      return decoded
    }
  }
}

// 支持Unicode的压缩器实现
export class SimpleCacheCompressor implements CacheCompressor {
  async compress(data: any): Promise<string> {
    try {
      const jsonString = JSON.stringify(data)

      // 使用TextEncoder处理Unicode字符，然后转换为Base64
      const encoder = new TextEncoder()
      const uint8Array = encoder.encode(jsonString)

      // 将Uint8Array转换为二进制字符串
      let binaryString = ''
      for (let i = 0; i < uint8Array.length; i++) {
        binaryString += String.fromCharCode(uint8Array[i])
      }

      // 使用btoa进行Base64编码
      const compressed = btoa(binaryString)

      return compressed
    } catch (error) {
      console.warn('压缩失败，返回原始数据:', error)
      return JSON.stringify(data)
    }
  }

  async decompress(compressed: string): Promise<any> {
    try {
      // 首先尝试Base64解码
      const binaryString = atob(compressed)

      // 将二进制字符串转换为Uint8Array
      const uint8Array = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        uint8Array[i] = binaryString.charCodeAt(i)
      }

      // 使用TextDecoder处理Unicode字符
      const decoder = new TextDecoder()
      const jsonString = decoder.decode(uint8Array)

      return JSON.parse(jsonString)
    } catch (error) {
      console.warn('解压失败，尝试直接解析:', error)
      try {
        // 尝试直接解析（可能是未压缩的数据）
        return JSON.parse(compressed)
      } catch {
        // 如果都失败了，返回原始字符串
        console.warn('数据解析完全失败，返回原始字符串')
        return compressed
      }
    }
  }

  getCompressionRatio(original: any, compressed: string): number {
    const originalSize = JSON.stringify(original).length
    const compressedSize = compressed.length
    return originalSize > 0 ? compressedSize / originalSize : 1
  }
}

// 缓存工具函数
export class CacheUtils {
  // 检查数据是否过期
  static isExpired(timestamp: number, ttl: number): boolean {
    return Date.now() - timestamp > ttl
  }
  
  // 计算数据大小 (字节)
  static calculateSize(data: any): number {
    try {
      return new Blob([JSON.stringify(data)]).size
    } catch {
      // 降级方案：估算字符串长度
      return JSON.stringify(data).length * 2 // UTF-16编码，每字符2字节
    }
  }
  
  // 生成ETag
  static generateETag(data: any): string {
    const content = JSON.stringify(data)
    let hash = 0
    
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // 转换为32位整数
    }
    
    return `"${Math.abs(hash).toString(36)}"`
  }
  
  // 检查浏览器存储可用性
  static checkStorageAvailability(): {
    localStorage: boolean
    sessionStorage: boolean
    indexedDB: boolean
  } {
    const result = {
      localStorage: false,
      sessionStorage: false,
      indexedDB: false
    }
    
    // 检查localStorage
    try {
      const testKey = '__cache_test__'
      localStorage.setItem(testKey, 'test')
      localStorage.removeItem(testKey)
      result.localStorage = true
    } catch {
      // localStorage不可用
    }
    
    // 检查sessionStorage
    try {
      const testKey = '__cache_test__'
      sessionStorage.setItem(testKey, 'test')
      sessionStorage.removeItem(testKey)
      result.sessionStorage = true
    } catch {
      // sessionStorage不可用
    }
    
    // 检查IndexedDB
    try {
      result.indexedDB = 'indexedDB' in window && indexedDB !== null
    } catch {
      // IndexedDB不可用
    }
    
    return result
  }
  

  
  // 清理过期数据
  static cleanupExpiredItems(items: Map<string, any>, getCurrentTime = Date.now): number {
    let cleanedCount = 0
    const now = getCurrentTime()
    
    for (const [key, item] of items.entries()) {
      if (item.timestamp && item.ttl && this.isExpired(item.timestamp, item.ttl)) {
        items.delete(key)
        cleanedCount++
      }
    }
    
    return cleanedCount
  }
  
  // LRU淘汰策略
  static evictLRU<T>(items: Map<string, T>, maxSize: number, getLastAccess: (item: T) => number): string[] {
    if (items.size <= maxSize) return []
    
    const evicted: string[] = []
    const sortedEntries = Array.from(items.entries())
      .sort(([, a], [, b]) => getLastAccess(a) - getLastAccess(b))
    
    const toEvict = items.size - maxSize
    for (let i = 0; i < toEvict; i++) {
      const [key] = sortedEntries[i]
      items.delete(key)
      evicted.push(key)
    }
    
    return evicted
  }
  
  // 格式化字节大小
  static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B'

    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // 获取存储使用情况的修正版本
  static async getStorageUsage(): Promise<{
    localStorage: { used: number, available: number }
    indexedDB: { used: number, available: number }
  }> {
    const result = {
      localStorage: { used: 0, available: 0 },
      indexedDB: { used: 0, available: 0 }
    }

    // localStorage使用情况
    try {
      let localStorageUsed = 0
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          localStorageUsed += localStorage[key].length + key.length
        }
      }

      result.localStorage.used = localStorageUsed
      result.localStorage.available = 5 * 1024 * 1024 - localStorageUsed // 假设5MB限制
    } catch {
      // 无法获取localStorage使用情况
    }

    // IndexedDB使用情况
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate()
        result.indexedDB.used = estimate.usage || 0
        result.indexedDB.available = (estimate.quota || 0) - (estimate.usage || 0)
      }
    } catch {
      // 无法获取IndexedDB使用情况
    }

    return result
  }
  
  // 格式化时间
  static formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
    if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`
    return `${(ms / 3600000).toFixed(1)}h`
  }
  
  // 深拷贝对象
  static deepClone<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') return obj
    if (obj instanceof Date) return new Date(obj.getTime()) as any
    if (obj instanceof Array) return obj.map(item => this.deepClone(item)) as any
    if (typeof obj === 'object') {
      const cloned: any = {}
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          cloned[key] = this.deepClone(obj[key])
        }
      }
      return cloned
    }
    return obj
  }
  
  // 节流函数
  static throttle<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let lastCall = 0
    return (...args: Parameters<T>) => {
      const now = Date.now()
      if (now - lastCall >= delay) {
        lastCall = now
        func(...args)
      }
    }
  }
  
  // 防抖函数
  static debounce<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let timeoutId: ReturnType<typeof setTimeout>
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => func(...args), delay)
    }
  }
}

// 缓存键常量
export const CACHE_KEYS = {
  // API响应
  API: {
    MATERIALS: 'api:materials',
    CABINETS: 'api:cabinets',
    USERS: 'api:users',
    PICKUPS: 'api:pickups',
    ALARMS: 'api:alarms'
  },
  
  // 用户配置
  USER: {
    PREFERENCES: 'user:preferences',
    LAYOUT: 'user:layout',
    THEME: 'user:theme',
    DEVICE_CONFIG: 'user:device_config'
  },
  
  // 应用状态
  APP: {
    SESSION: 'app:session',
    STATS: 'app:stats',
    SEARCH_RESULTS: 'app:search_results'
  },
  
  // 大数据集
  DATA: {
    HISTORY: 'data:history',
    CHARTS: 'data:charts',
    OFFLINE: 'data:offline',
    INDEX: 'data:index'
  }
} as const
