/**
 * 卡片尺寸模式管理工具
 * 提供卡片尺寸模式检测、尺寸验证等功能
 */

import type { CardMode } from '@/types'

/**
 * 尺寸错误信息接口
 */
export interface SizeError {
  hasError: boolean
  message?: string
  suggestedSize?: { w: number, h: number }
}

/**
 * 根据卡片尺寸检测显示模式
 * @param w 卡片宽度（网格单位）
 * @param h 卡片高度（网格单位）
 * @returns 卡片显示模式
 */
export function detectCardMode(w: number, h: number): CardMode {
  // 计算卡片面积
  const area = w * h

  // 根据面积和尺寸判断模式（适应14列网格）
  if (w <= 3 && h <= 2) {
    return 'mini'
  } else if (w <= 5 && h <= 3) {
    return 'compact'
  } else {
    return 'full'
  }
}

/**
 * 验证卡片尺寸是否符合最小要求
 * @param w 当前宽度
 * @param h 当前高度
 * @param minW 最小宽度
 * @param minH 最小高度
 * @param cardType 卡片类型名称（用于错误提示）
 * @returns 尺寸错误信息
 */
export function validateCardSize(
  w: number, 
  h: number, 
  minW: number = 1, 
  minH: number = 1,
  cardType: string = '当前'
): SizeError {
  if (w < minW || h < minH) {
    return {
      hasError: true,
      message: `${cardType}卡片最小尺寸为 ${minW}×${minH}`,
      suggestedSize: { w: minW, h: minH }
    }
  }
  
  return { hasError: false }
}

/**
 * 获取卡片模式的中文名称
 * @param mode 卡片模式
 * @returns 模式的中文名称
 */
export function getCardModeName(mode: CardMode): string {
  switch (mode) {
    case 'mini':
      return '迷你模式'
    case 'compact':
      return '紧凑模式'
    case 'full':
      return '完整模式'
    default:
      return '未知模式'
  }
}

/**
 * 获取卡片模式的推荐尺寸
 * @param mode 卡片模式
 * @returns 推荐尺寸 {w, h}
 */
export function getRecommendedSize(mode: CardMode): { w: number, h: number } {
  switch (mode) {
    case 'mini':
      return { w: 2, h: 1 } // 14列网格下的推荐尺寸
    case 'compact':
      return { w: 4, h: 2 } // 14列网格下的推荐尺寸
    case 'full':
      return { w: 7, h: 4 } // 14列网格下的推荐尺寸
    default:
      return { w: 3, h: 2 }
  }
}

/**
 * 获取卡片模式的最小尺寸
 * @param mode 卡片模式
 * @returns 最小尺寸 {w, h}
 */
export function getMinSizeForMode(mode: CardMode): { w: number, h: number } {
  switch (mode) {
    case 'mini':
      return { w: 1, h: 1 }
    case 'compact':
      return { w: 2, h: 2 }
    case 'full':
      return { w: 4, h: 3 } // 14列网格下的最小尺寸
    default:
      return { w: 1, h: 1 }
  }
}
