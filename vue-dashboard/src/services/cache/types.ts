/**
 * 缓存系统类型定义
 * 四层缓存架构：Memory -> localStorage -> IndexedDB -> HTTP
 */

// 缓存项接口
export interface CacheItem<T = any> {
  data: T
  timestamp: number
  ttl: number // 生存时间 (毫秒)
  version?: string
  size?: number // 数据大小 (字节)
  accessCount?: number // 访问次数
  lastAccess?: number // 最后访问时间
}

// 缓存配置选项
export interface CacheOptions {
  ttl?: number // 生存时间，默认5分钟
  persistent?: boolean // 是否持久化到localStorage/IndexedDB
  priority?: CachePriority // 缓存优先级
  compress?: boolean // 是否压缩存储
  version?: string // 数据版本
  tags?: string[] // 缓存标签，用于批量清理
}

// 缓存优先级
export enum CachePriority {
  LOW = 1,
  NORMAL = 2,
  HIGH = 3,
  CRITICAL = 4
}

// 缓存层级
export enum CacheLayer {
  MEMORY = 'memory',
  LOCAL_STORAGE = 'localStorage',
  INDEXED_DB = 'indexedDB',
  HTTP = 'http'
}

// 缓存统计信息
export interface CacheStats {
  layer: CacheLayer
  totalItems: number
  totalSize: number // 字节
  hitCount: number
  missCount: number
  hitRate: number // 命中率
  evictionCount: number // 淘汰次数
  lastCleanup: number
}

// 缓存事件
export interface CacheEvent {
  type: 'hit' | 'miss' | 'set' | 'delete' | 'evict' | 'cleanup'
  layer: CacheLayer
  key: string
  timestamp: number
  metadata?: any
}

// 缓存策略配置
export interface CacheStrategy {
  // 内存缓存配置
  memory: {
    maxSize: number // 最大条目数
    maxMemory: number // 最大内存使用 (字节)
    evictionPolicy: 'lru' | 'lfu' | 'fifo' // 淘汰策略
    cleanupInterval: number // 清理间隔 (毫秒)
  }
  
  // localStorage配置
  localStorage: {
    maxSize: number // 最大存储大小 (字节)
    keyPrefix: string // 键前缀
    enableCompression: boolean // 启用压缩
    versionCheck: boolean // 版本检查
  }
  
  // IndexedDB配置
  indexedDB: {
    dbName: string
    version: number
    maxSize: number // 最大存储大小 (字节)
    enableIndex: boolean // 启用索引
    autoCleanup: boolean // 自动清理
  }
  
  // HTTP缓存配置
  http: {
    defaultTTL: number // 默认缓存时间
    enableETag: boolean // 启用ETag
    enableGzip: boolean // 启用Gzip压缩
  }
}

// 缓存接口
export interface ICache {
  get<T>(key: string): Promise<T | null>
  set<T>(key: string, data: T, options?: CacheOptions): Promise<boolean>
  delete(key: string): Promise<boolean>
  clear(): Promise<boolean>
  has(key: string): Promise<boolean>
  keys(): Promise<string[]>
  size(): Promise<number>
  stats(): Promise<CacheStats>
}

// 缓存管理器接口
export interface ICacheManager {
  get<T>(key: string, options?: { layer?: CacheLayer }): Promise<T | null>
  set<T>(key: string, data: T, options?: CacheOptions): Promise<boolean>
  delete(key: string, options?: { layer?: CacheLayer }): Promise<boolean>
  clear(options?: { layer?: CacheLayer, tags?: string[] }): Promise<boolean>
  invalidate(pattern: string | RegExp): Promise<number>
  warmup(keys: string[]): Promise<void>
  getAllStats(): Promise<Record<CacheLayer, CacheStats>>
  on(event: string, callback: (event: CacheEvent) => void): void
  off(event: string, callback: (event: CacheEvent) => void): void
}

// 数据分类策略
export interface DataClassification {
  // 热点数据 - 内存缓存
  hotData: {
    patterns: string[]
    ttl: number
    maxSize: number
  }
  
  // 用户配置 - localStorage
  userConfig: {
    patterns: string[]
    ttl: number
    persistent: true
  }
  
  // 大数据集 - IndexedDB
  largeDataset: {
    patterns: string[]
    ttl: number
    sizeThreshold: number // 大小阈值 (字节)
  }
  
  // API响应 - HTTP缓存
  apiResponse: {
    patterns: string[]
    ttl: number
    enableETag: boolean
  }
}

// 缓存键生成器
export interface CacheKeyGenerator {
  generate(namespace: string, identifier: string, params?: Record<string, any>): string
  parse(key: string): { namespace: string, identifier: string, params?: Record<string, any> }
}

// 缓存压缩接口
export interface CacheCompressor {
  compress(data: any): Promise<string>
  decompress(compressed: string): Promise<any>
  getCompressionRatio(original: any, compressed: string): number
}

// 缓存监控接口
export interface CacheMonitor {
  startMonitoring(): void
  stopMonitoring(): void
  getMetrics(): Promise<CacheMetrics>
  exportStats(): Promise<string>
}

// 缓存指标
export interface CacheMetrics {
  performance: {
    averageGetTime: number
    averageSetTime: number
    totalOperations: number
    errorRate: number
  }
  
  storage: {
    memoryUsage: number
    localStorageUsage: number
    indexedDBUsage: number
    totalUsage: number
  }
  
  efficiency: {
    overallHitRate: number
    layerHitRates: Record<CacheLayer, number>
    evictionRate: number
    compressionRatio: number
  }
}

// 默认配置
export const DEFAULT_CACHE_STRATEGY: CacheStrategy = {
  memory: {
    maxSize: 1000,
    maxMemory: 50 * 1024 * 1024, // 50MB
    evictionPolicy: 'lru',
    cleanupInterval: 60000 // 1分钟
  },
  
  localStorage: {
    maxSize: 5 * 1024 * 1024, // 5MB
    keyPrefix: 'dashboard_cache_',
    enableCompression: true,
    versionCheck: true
  },
  
  indexedDB: {
    dbName: 'DashboardCacheDB',
    version: 1,
    maxSize: 100 * 1024 * 1024, // 100MB
    enableIndex: true,
    autoCleanup: true
  },
  
  http: {
    defaultTTL: 300000, // 5分钟
    enableETag: true,
    enableGzip: true
  }
}

// 数据分类默认配置
export const DEFAULT_DATA_CLASSIFICATION: DataClassification = {
  hotData: {
    patterns: [
      'api_response_*',
      'user_session_*',
      'dashboard_stats_*',
      'search_results_*'
    ],
    ttl: 300000, // 5分钟
    maxSize: 100
  },
  
  userConfig: {
    patterns: [
      'user_preferences',
      'dashboard_layout',
      'card_configs',
      'device_config'
    ],
    ttl: 7 * 24 * 60 * 60 * 1000, // 7天
    persistent: true
  },
  
  largeDataset: {
    patterns: [
      'history_data_*',
      'chart_data_*',
      'offline_package_*',
      'search_index_*',
      'api:materials',  // 物料数据优先存储到IndexedDB
      'api:cabinets'    // 柜体数据也存储到IndexedDB
    ],
    ttl: 24 * 60 * 60 * 1000, // 1天
    sizeThreshold: 512 * 1024 // 512KB (降低阈值，更早触发IndexedDB存储)
  },
  
  apiResponse: {
    patterns: [
      '/api/materials',
      '/api/cabinets',
      '/api/users',
      '/api/pickups'
    ],
    ttl: 300000, // 5分钟
    enableETag: true
  }
}
