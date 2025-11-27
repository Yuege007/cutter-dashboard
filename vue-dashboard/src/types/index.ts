import type { Component } from 'vue'

// 卡片显示模式
export type CardMode = 'mini' | 'compact' | 'full'

// 主题类型
export type ThemeType = 'light' | 'dark' | 'tech'

// 卡片状态
export type CardState = 'loading' | 'loaded' | 'error' | 'empty'

// 卡片状态信息接口
export interface CardStateInfo {
  status: CardState
  locked?: boolean
  visible?: boolean
  [key: string]: any
}

// 卡片渲染模式组件
export interface CardRenderModes {
  mini: Component
  compact: Component
  full: Component
}

// 卡片配置接口
export interface CardConfig {
  id: string
  name: string
  description?: string
  category?: string
  api?: string
  refreshInterval?: number // 刷新间隔（秒）
  component?: Component // Vue 组件
  defaultSize: {
    w: number
    h: number
  }
  minSize?: {
    w: number
    h: number
  }
  maxSize?: {
    w: number
    h: number
  }
  defaultProps?: Record<string, any> // 默认属性
  resizable?: boolean // 是否可调整大小
  draggable?: boolean // 是否可拖拽
  renderModes: CardRenderModes
  icon?: string
  color?: string
  configSchema?: Record<string, any> // 配置表单架构
}

// 布局项接口
export interface LayoutItem {
  i: string
  x: number
  y: number
  w: number
  h: number
  minW?: number
  minH?: number
  maxW?: number
  maxH?: number
  static?: boolean
  isDraggable?: boolean
  isResizable?: boolean
  isDragging?: boolean
  // 记录卡片的模式锁定（用于持久化）
  lockedMode?: CardMode
}

// 卡片实例接口
export interface CardInstance {
  id: string
  cardId: string
  config: CardConfig
  position?: { x: number; y: number }
  size?: { w: number; h: number }
  props?: Record<string, any>
  state?: CardStateInfo
  locked?: boolean
  lockedMode?: CardMode
  data?: any
  error?: string
  lastUpdated?: Date
}

// API 响应接口
export interface ApiResponse<T = any> {
  status: number
  code: string
  message: string
  data: T
  duration: number
  errorCode: string | null
  success: boolean
}

// 分页响应接口
export interface PaginatedResponse<T = any> {
  total: number
  pageCount: number
  numPerPage: number
  currentPage: number
  rows: T[]
}

// 业务数据类型定义

// 物料信息
export interface Material {
  id: number
  price: number
  inventory: number
  cutterType: string
  inventoryWarn: number
  company: string
  materialCode: string
  brandId: number
  productName: string
  imgId: number
  specification: string
  brandName: string
  imgUrl: string
  consumableType: string
  singleWeight: number
  tools?: CabinetTool[]
}

// 工具柜信息
export interface Cabinet {
  id: number
  cuttingNo: string
  cuttingName: string
  cuttingAlias?: string
  company: string
  factoryName: string
  workshopName: string
  isOnline: string // "1" 或 "2"
  isSale?: string
  factoryConfigId?: string
  ctType?: string
}

// 货道信息
export interface CabinetSlot {
  id: number
  inventory: number
  surplus: number
  itmeNo: string
  itmeNoAsc?: string
  disItemNo: number
  bindNum: number
  itemNoAlias: string
  itemNoPrefix: string
  company: string
  bcType: number
  packWeight: number
  boxInfoVo?: SlotMaterial  // 修正字段名和类型（单个对象而非数组）
}

// 货道物料信息
export interface SlotMaterial {
  price: number
  cutterType: string
  specification: string
  brandName: string
  productName: string
  consumableType: string
  singleWeight: number
}

// 工具柜工具信息
export interface CabinetTool {
  surplus: number
  itemNoAlias: string
  cuttingName: string
  cuttingNo: string
}

// 领用记录
export interface PickupRecord {
  id: number
  cuttingNo: string
  cuttingName: string
  company: string
  factoryName: string
  workshopName: string
  productName: string
  specification: string
  brandName: string
  price: number
  materialCode: string
  imgUrl: string
  consumableType: string
  payNum: number
  packNum: number
  cutterType: string
  payUserName: string
  payTime: string
  payWorkeNo: string
  isReturn: number
  itemNo: string
  itemNoAlias: string
  itemNoPrefix: string
  rUserName: string
  rLastTime: string
  remark: string
  deviceNo: string
  serialNum: string
  rWorkeNo: string
  dWorkshopName: string
  dFactoryName: string
  managerRepairState: string
  exReport1: string
  exReport2: string
  exState: string
  exUserName: string
  exDate: string
  bcType: number
  singleWeight: number
  packWeight: number
  totalWeight: number
}

// 用户信息
export interface User {
  id: number
  name: string
  mobileNo: string
  workeNo: string
  ic_no: string
  userState: number // 1: 在职, 2: 离职
}

// 项目信息
export interface Project {
  id: number
  company: string
  projectName: string
  projectNo: string
  projectState: number // 1: 启用, 2: 失效
}

// EmptyState 组件相关类型
export interface EmptyAction {
  key: string
  label: string
  icon?: string
  type?: 'default' | 'primary' | 'secondary' | 'danger'
  disabled?: boolean
  handler: () => void
}

export interface EmptyStateProps {
  // 图标相关
  icon?: string                    // Emoji图标
  iconComponent?: any              // 自定义图标组件
  svgIcon?: any                   // SVG图标组件

  // 文字内容
  title?: string                  // 标题
  description: string             // 描述文字

  // 尺寸和样式
  size?: 'sm' | 'md' | 'lg'      // 尺寸
  customClass?: string            // 自定义CSS类

  // 操作按钮
  actions?: EmptyAction[]         // 操作按钮数组
}

// useBaseCard 相关类型
export interface CardTitles {
  mini: string
  compact: string
  full: string
  default: string
}

export interface UseBaseCardConfig<T> {
  // 数据获取函数
  fetcher?: () => Promise<T>

  // 卡片标题配置
  titles: CardTitles

  // 可选的高级配置
  refreshInterval?: number  // 自动刷新间隔（毫秒）
  cacheKey?: string        // 缓存键名
  enableCache?: boolean    // 是否启用缓存

  // 自定义Hook（逃生舱机制）
  customHook?: (props: any, emit: any) => any
}
