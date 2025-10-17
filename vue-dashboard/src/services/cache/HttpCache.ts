/**
 * HTTP缓存策略实现
 * 特点：浏览器原生缓存、ETag支持、条件请求、网络层优化
 */

import type { ICache, CacheOptions, CacheStats, CacheLayer } from './types'
import { CacheUtils } from './utils'

interface HttpCacheConfig {
  defaultTTL: number
  enableETag: boolean
  enableGzip: boolean
  cacheControl: {
    [pattern: string]: string
  }
}

interface CachedResponse {
  data: any
  headers: Record<string, string>
  timestamp: number
  ttl: number
  etag?: string
  url: string
}

export class HttpCache implements ICache {
  private responseCache = new Map<string, CachedResponse>()
  private config: HttpCacheConfig
  
  private cacheStats = {
    hitCount: 0,
    missCount: 0,
    evictionCount: 0,
    lastCleanup: Date.now()
  }
  
  constructor(config: Partial<HttpCacheConfig> = {}) {
    this.config = {
      defaultTTL: 300000, // 5分钟
      enableETag: true,
      enableGzip: true,
      cacheControl: {
        '/api/materials': 'max-age=300', // 5分钟
        '/api/cabinets': 'max-age=60',   // 1分钟
        '/api/users': 'max-age=1800',    // 30分钟
        '/api/config': 'max-age=3600',   // 1小时
        '/assets/': 'max-age=86400',     // 1天
        ...config.cacheControl
      },
      ...config
    }
    
    // 启动清理定时器
    this.startCleanupTimer()
  }
  
  async get<T>(key: string): Promise<T | null> {
    const cached = this.responseCache.get(key)
    
    if (!cached) {
      this.cacheStats.missCount++
      return null
    }

    // 检查是否过期
    if (CacheUtils.isExpired(cached.timestamp, cached.ttl)) {
      this.responseCache.delete(key)
      this.cacheStats.missCount++
      return null
    }

    this.cacheStats.hitCount++
    return cached.data as T
  }
  
  async set<T>(key: string, data: T, options: CacheOptions = {}): Promise<boolean> {
    try {
      const ttl = options.ttl || this.config.defaultTTL
      
      const cached: CachedResponse = {
        data,
        headers: {},
        timestamp: Date.now(),
        ttl,
        url: key
      }
      
      this.responseCache.set(key, cached)
      return true
    } catch (error) {
      console.error('HTTP缓存设置失败:', error)
      return false
    }
  }
  
  async delete(key: string): Promise<boolean> {
    return this.responseCache.delete(key)
  }
  
  async clear(): Promise<boolean> {
    this.responseCache.clear()
    this.resetStats()
    return true
  }
  
  async has(key: string): Promise<boolean> {
    const cached = this.responseCache.get(key)
    if (!cached) return false
    
    if (CacheUtils.isExpired(cached.timestamp, cached.ttl)) {
      this.responseCache.delete(key)
      return false
    }
    
    return true
  }
  
  async keys(): Promise<string[]> {
    const validKeys: string[] = []
    
    for (const [key, cached] of this.responseCache.entries()) {
      if (!CacheUtils.isExpired(cached.timestamp, cached.ttl)) {
        validKeys.push(key)
      } else {
        this.responseCache.delete(key)
      }
    }
    
    return validKeys
  }
  
  async size(): Promise<number> {
    await this.cleanup()
    return this.responseCache.size
  }
  
  async stats(): Promise<CacheStats> {
    const totalSize = Array.from(this.responseCache.values())
      .reduce((sum, cached) => sum + CacheUtils.calculateSize(cached.data), 0)
    
    const hitRate = this.cacheStats.hitCount + this.cacheStats.missCount > 0
      ? this.cacheStats.hitCount / (this.cacheStats.hitCount + this.cacheStats.missCount)
      : 0

    return {
      layer: 'http' as CacheLayer,
      totalItems: this.responseCache.size,
      totalSize,
      hitCount: this.cacheStats.hitCount,
      missCount: this.cacheStats.missCount,
      hitRate,
      evictionCount: this.cacheStats.evictionCount,
      lastCleanup: this.cacheStats.lastCleanup
    }
  }
  
  // 增强的fetch方法，支持HTTP缓存
  async fetch(url: string, options: RequestInit = {}): Promise<Response> {
    const cacheKey = this.generateCacheKey(url, options)
    
    // 检查内存缓存
    const cached = this.responseCache.get(cacheKey)
    if (cached && !CacheUtils.isExpired(cached.timestamp, cached.ttl)) {
      // 如果有ETag，发送条件请求
      if (this.config.enableETag && cached.etag) {
        const conditionalOptions = {
          ...options,
          headers: {
            ...options.headers,
            'If-None-Match': cached.etag
          }
        }
        
        try {
          const response = await fetch(url, conditionalOptions)
          
          if (response.status === 304) {
            // 304 Not Modified，使用缓存
            this.cacheStats.hitCount++
            return this.createResponseFromCache(cached)
          }

          // 内容已更新，缓存新响应
          return await this.cacheResponse(url, response, cacheKey)
        } catch (error) {
          // 网络错误，使用缓存
          console.warn('网络请求失败，使用缓存:', error)
          this.cacheStats.hitCount++
          return this.createResponseFromCache(cached)
        }
      } else {
        // 直接使用缓存
        this.cacheStats.hitCount++
        return this.createResponseFromCache(cached)
      }
    }
    
    // 发送网络请求
    try {
      const enhancedOptions = this.enhanceRequestOptions(url, options)
      const response = await fetch(url, enhancedOptions)
      
      if (response.ok) {
        return await this.cacheResponse(url, response, cacheKey)
      }
      
      this.cacheStats.missCount++
      return response
    } catch (error) {
      this.cacheStats.missCount++
      throw error
    }
  }
  
  // 生成缓存键
  private generateCacheKey(url: string, options: RequestInit): string {
    const method = options.method || 'GET'
    const body = options.body ? JSON.stringify(options.body) : ''
    const headers = JSON.stringify(options.headers || {})
    
    return `${method}:${url}:${CacheUtils.generateETag({ body, headers })}`
  }
  
  // 增强请求选项
  private enhanceRequestOptions(url: string, options: RequestInit): RequestInit {
    const enhanced = { ...options }
    
    // 设置缓存控制头
    const cacheControl = this.getCacheControlForUrl(url)
    if (cacheControl) {
      enhanced.headers = {
        ...enhanced.headers,
        'Cache-Control': cacheControl
      }
    }
    
    // 启用Gzip压缩
    if (this.config.enableGzip) {
      enhanced.headers = {
        ...enhanced.headers,
        'Accept-Encoding': 'gzip, deflate, br'
      }
    }
    
    return enhanced
  }
  
  // 获取URL对应的缓存控制策略
  private getCacheControlForUrl(url: string): string | null {
    for (const [pattern, control] of Object.entries(this.config.cacheControl)) {
      if (url.includes(pattern)) {
        return control
      }
    }
    return null
  }
  
  // 缓存响应
  private async cacheResponse(url: string, response: Response, cacheKey: string): Promise<Response> {
    try {
      // 克隆响应以便缓存
      const responseClone = response.clone()
      const data = await responseClone.json()
      
      // 提取缓存相关头
      const etag = response.headers.get('ETag')
      const cacheControl = response.headers.get('Cache-Control')
      
      // 计算TTL
      let ttl = this.config.defaultTTL
      if (cacheControl) {
        const maxAgeMatch = cacheControl.match(/max-age=(\d+)/)
        if (maxAgeMatch) {
          ttl = parseInt(maxAgeMatch[1]) * 1000 // 转换为毫秒
        }
      }
      
      // 存储到缓存
      const cached: CachedResponse = {
        data,
        headers: this.extractHeaders(response),
        timestamp: Date.now(),
        ttl,
        etag: etag || undefined,
        url
      }
      
      this.responseCache.set(cacheKey, cached)
      this.cacheStats.missCount++

      return response
    } catch (error) {
      console.error('缓存响应失败:', error)
      this.cacheStats.missCount++
      return response
    }
  }
  
  // 从缓存创建响应
  private createResponseFromCache(cached: CachedResponse): Response {
    const responseInit: ResponseInit = {
      status: 200,
      statusText: 'OK',
      headers: cached.headers
    }
    
    return new Response(JSON.stringify(cached.data), responseInit)
  }
  
  // 提取响应头
  private extractHeaders(response: Response): Record<string, string> {
    const headers: Record<string, string> = {}
    
    response.headers.forEach((value, key) => {
      headers[key] = value
    })
    
    return headers
  }
  
  // 清理过期缓存
  private async cleanup(): Promise<void> {
    let cleanedCount = 0
    
    for (const [key, cached] of this.responseCache.entries()) {
      if (CacheUtils.isExpired(cached.timestamp, cached.ttl)) {
        this.responseCache.delete(key)
        cleanedCount++
      }
    }
    
    this.cacheStats.lastCleanup = Date.now()
    
    if (cleanedCount > 0) {
      console.debug(`HTTP缓存清理完成，清理了 ${cleanedCount} 个项目`)
    }
  }
  
  // 启动清理定时器
  private startCleanupTimer(): void {
    setInterval(() => {
      this.cleanup()
    }, 60000) // 每分钟清理一次
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
  
  // 预加载资源
  async preload(urls: string[], options: RequestInit = {}): Promise<void> {
    const promises = urls.map(url => 
      this.fetch(url, { ...options, priority: 'low' } as any)
        .catch(error => console.warn(`预加载失败: ${url}`, error))
    )
    
    await Promise.allSettled(promises)
    console.debug(`预加载完成，处理了 ${urls.length} 个URL`)
  }
  
  // 获取缓存配置
  getConfig(): HttpCacheConfig {
    return { ...this.config }
  }
  
  // 更新缓存配置
  updateConfig(newConfig: Partial<HttpCacheConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }
  
  // 添加缓存规则
  addCacheRule(pattern: string, cacheControl: string): void {
    this.config.cacheControl[pattern] = cacheControl
  }
  
  // 移除缓存规则
  removeCacheRule(pattern: string): void {
    delete this.config.cacheControl[pattern]
  }
}
