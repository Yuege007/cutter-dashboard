/**
 * 卡片系统统一类型定义
 */

// 卡片显示模式
export type CardMode = 'mini' | 'compact' | 'full'

// 卡片基础Props接口
export interface BaseCardProps {
  /** 卡片唯一标识 */
  cardId: string
  /** 卡片宽度（网格单位） */
  width: number
  /** 卡片高度（网格单位） */
  height: number
}

// 卡片基础事件接口
export interface BaseCardEmits {
  /** 刷新卡片数据 */
  refresh: []
  /** 打开卡片设置 */
  settings: []
  /** 卡片发生错误 */
  error: [message: string]
  /** 数据加载完成 */
  dataLoaded: [data: any]
  /** 显示模式变化 */
  modeChanged: [mode: CardMode]
}

// 卡片状态接口
export interface CardState {
  /** 是否正在加载 */
  loading: boolean
  /** 错误信息 */
  error: string
  /** 卡片数据 */
  data?: any
  /** 最后更新时间 */
  lastUpdated?: Date
  /** 重试次数 */
  retryCount?: number
}

// 卡片尺寸配置
export interface CardSize {
  w: number
  h: number
}

// 卡片类别
export type CardCategory = 'inventory' | 'device' | 'analytics' | 'system' | 'custom'

// 卡片配置接口（为后续统一做准备）
export interface CardConfig {
  id: string
  name: string
  description: string
  icon: string
  category: CardCategory
  defaultSize: CardSize
  minSize: CardSize
  draggable?: boolean
  resizable?: boolean
}

// 数据获取函数类型
export type DataFetcher<T = any> = () => Promise<T>

// 卡片数据源配置（为后续统一做准备）
export interface CardDataSource {
  fetcher: DataFetcher
  refreshInterval?: number
  retryCount?: number
  cache?: boolean
}
