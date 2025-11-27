import { computed, toRef } from 'vue'
import { useCard } from './useCard'
import type { BaseCardProps, BaseCardEmits } from '@/types/card'

/**
 * 卡片标题配置
 */
export interface CardTitles {
  mini: string
  compact: string
  full: string
  default: string
}

/**
 * useBaseCard 配置选项
 */
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
  customHook?: (props: BaseCardProps, emit: BaseCardEmits) => any
}

/**
 * 统一的卡片Hook
 * 
 * 这个Hook封装了所有卡片的通用逻辑：
 * - 统一的useCard调用
 * - 自动的标题计算
 * - 标准化的错误处理
 * - 一致的事件发射
 * 
 * @param props - 卡片属性
 * @param emit - 事件发射器
 * @param config - 配置选项
 * @returns 增强的卡片Hook结果
 */
export function useBaseCard<T = any>(
  props: BaseCardProps,
  emit: any,
  config: UseBaseCardConfig<T>
) {
  // 如果提供了自定义Hook，使用自定义逻辑（逃生舱机制）
  if (config.customHook) {
    const customResult = config.customHook(props, emit)
    
    // 确保自定义Hook也返回cardTitle
    if (!customResult.cardTitle) {
      customResult.cardTitle = computed(() => {
        const modeKey = ((customResult.mode?.value ?? 'default') as keyof CardTitles)
        return config.titles[modeKey] || config.titles.default
      })
    }
    
    return customResult
  }

  // 构建useCard的选项
  const cardOptions = {
    onError: (err: Error) => {
      console.error('🔄 卡片数据获取失败:', err.message)
      emit('error', err.message)
    },
    onModeChange: (newMode: string) => {
      emit('modeChanged', newMode as any)
    },
    // 传递高级配置
    ...(config.refreshInterval && { refreshInterval: config.refreshInterval }),
    ...(config.cacheKey && { cacheKey: config.cacheKey }),
    ...(config.enableCache !== undefined && { enableCache: config.enableCache })
  }

  // 调用原始的useCard Hook
  const cardHook = useCard(
    toRef(props, 'width'),
    toRef(props, 'height'),
    config.fetcher,
    cardOptions
  )

  // 支持模式强制覆盖（模式锁定）
  const forcedMode = toRef(props, 'forcedMode')
  const effectiveMode = computed(() => forcedMode.value || cardHook.mode.value)

  // 统一的标题计算
  const cardTitle = computed(() => {
    const currentMode = (effectiveMode.value ?? 'default') as keyof CardTitles
    return config.titles[currentMode] || config.titles.default
  })

  // 返回增强的结果
  return {
    ...cardHook,
    // 使用生效模式覆盖原始模式
    mode: effectiveMode,
    isMini: computed(() => effectiveMode.value === 'mini'),
    isCompact: computed(() => effectiveMode.value === 'compact'),
    isFull: computed(() => effectiveMode.value === 'full'),
    cardTitle
  }
}

/**
 * 创建卡片标题配置的辅助函数
 * 
 * @param baseName - 基础名称
 * @param options - 可选的自定义标题
 * @returns 完整的标题配置
 */
export function createCardTitles(
  baseName: string,
  options: Partial<CardTitles> = {}
): CardTitles {
  return {
    mini: options.mini || baseName,
    compact: options.compact || `${baseName}概览`,
    full: options.full || `${baseName}详情`,
    default: options.default || baseName
  }
}

/**
 * 预定义的常用卡片标题
 */
export const CARD_TITLES = {
  INVENTORY_ALARM: createCardTitles('库存预警'),
  USER_RANKING: createCardTitles('用户排行'),
  IN_OUT_TREND: createCardTitles('出入库趋势'),
  CABINET_STATUS: createCardTitles('柜体状态'),
  MATERIAL_RETURN: createCardTitles('物料归还'),
  MATERIAL_OVERVIEW: createCardTitles('物料概览')
} as const
