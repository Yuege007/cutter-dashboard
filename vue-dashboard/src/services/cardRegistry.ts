import { useCardStore } from '@/stores/card'
import type { CardConfig } from '@/types'

// 卡片类别
export enum CardCategory {
  INVENTORY = 'inventory',
  MONITORING = 'monitoring',
  ANALYTICS = 'analytics',
  MANAGEMENT = 'management'
}

// 卡片注册表
class CardRegistry {
  private categories = new Map<CardCategory, CardConfig[]>()

  // 注册卡片
  register(config: CardConfig, category: CardCategory = CardCategory.ANALYTICS) {
    const cardStore = useCardStore()
    
    // 验证配置
    this.validateConfig(config)
    
    // 添加类别信息
    config.category = category
    
    // 注册到 store
    cardStore.registerCard(config)
    
    // 添加到分类
    if (!this.categories.has(category)) {
      this.categories.set(category, [])
    }
    this.categories.get(category)!.push(config)
    
    console.log(`Card registered: ${config.id} in category ${category}`)
  }

  // 批量注册卡片
  registerBatch(configs: Array<{ config: CardConfig; category?: CardCategory }>) {
    configs.forEach(({ config, category }) => {
      this.register(config, category)
    })
  }

  // 注销卡片
  unregister(cardId: string) {
    const cardStore = useCardStore()
    cardStore.unregisterCard(cardId)
    
    // 从分类中移除
    for (const [category, cards] of this.categories) {
      const index = cards.findIndex(card => card.id === cardId)
      if (index >= 0) {
        cards.splice(index, 1)
        break
      }
    }
    
    console.log(`Card unregistered: ${cardId}`)
  }

  // 获取分类下的卡片
  getCardsByCategory(category: CardCategory): CardConfig[] {
    return this.categories.get(category) || []
  }

  // 获取所有分类
  getAllCategories(): Array<{ category: CardCategory; cards: CardConfig[] }> {
    return Array.from(this.categories.entries()).map(([category, cards]) => ({
      category,
      cards
    }))
  }

  // 搜索卡片
  searchCards(query: string): CardConfig[] {
    const cardStore = useCardStore()
    const allCards = cardStore.availableCards
    
    const lowerQuery = query.toLowerCase()
    return allCards.filter(card => 
      card.name.toLowerCase().includes(lowerQuery) ||
      card.description?.toLowerCase().includes(lowerQuery) ||
      card.id.toLowerCase().includes(lowerQuery)
    )
  }

  // 验证卡片配置
  private validateConfig(config: CardConfig) {
    if (!config.id) {
      throw new Error('Card config must have an id')
    }
    
    if (!config.name) {
      throw new Error('Card config must have a name')
    }
    
    if (!config.defaultSize || !config.defaultSize.w || !config.defaultSize.h) {
      throw new Error('Card config must have valid defaultSize')
    }
    
    if (!config.renderModes || !config.renderModes.mini || !config.renderModes.compact || !config.renderModes.full) {
      throw new Error('Card config must have all renderModes (mini, compact, full)')
    }
    
    // 检查是否已存在
    const cardStore = useCardStore()
    if (cardStore.getCardConfig(config.id)) {
      throw new Error(`Card with id ${config.id} already exists`)
    }
  }

  // 获取推荐卡片（基于使用频率等）
  getRecommendedCards(limit: number = 6): CardConfig[] {
    // 这里可以实现基于使用历史的推荐算法
    // 目前返回每个分类的第一个卡片
    const recommended: CardConfig[] = []
    
    for (const cards of this.categories.values()) {
      if (cards.length > 0 && recommended.length < limit) {
        recommended.push(cards[0])
      }
    }
    
    return recommended.slice(0, limit)
  }

  // 清空注册表
  clear() {
    this.categories.clear()
  }
}

// 创建全局注册表实例
export const cardRegistry = new CardRegistry()

// 预定义卡片配置
export const getDefaultCardConfigs = (): Array<{ config: CardConfig; category: CardCategory }> => {
  return [
    {
      config: {
        id: 'inventory-overview',
        name: '库存状态概览',
        description: '显示库存预警和物料状态',
        api: 'warn-materials',
        refreshInterval: 60,
        defaultSize: { w: 3, h: 2 },
        minSize: { w: 2, h: 2 },
        maxSize: { w: 6, h: 4 },
        renderModes: {
          mini: null as any,
          compact: null as any,
          full: null as any
        },
        icon: '📦',
        color: '#F0AB00'
      },
      category: CardCategory.INVENTORY
    },
    {
      config: {
        id: 'cabinet-monitoring',
        name: '智能柜状态监控',
        description: '监控工具柜在线状态和运行情况',
        api: 'cabinet-status',
        refreshInterval: 30,
        defaultSize: { w: 4, h: 3 },
        minSize: { w: 3, h: 2 },
        maxSize: { w: 8, h: 6 },
        renderModes: {
          mini: null as any,
          compact: null as any,
          full: null as any
        },
        icon: '🏭',
        color: '#3E8635'
      },
      category: CardCategory.MONITORING
    },
    {
      config: {
        id: 'pickup-trends',
        name: '出入库趋势',
        description: '显示物料出入库趋势和统计',
        api: 'today-pickups',
        refreshInterval: 45,
        defaultSize: { w: 4, h: 3 },
        minSize: { w: 3, h: 2 },
        maxSize: { w: 8, h: 6 },
        renderModes: {
          mini: null as any,
          compact: null as any,
          full: null as any
        },
        icon: '📈',
        color: '#0066CC'
      },
      category: CardCategory.ANALYTICS
    },
    {
      config: {
        id: 'pickup-ranking',
        name: '领用排行榜',
        description: '显示用户领用活跃度排行',
        api: 'today-pickups',
        refreshInterval: 60,
        defaultSize: { w: 3, h: 4 },
        minSize: { w: 2, h: 3 },
        maxSize: { w: 6, h: 8 },
        renderModes: {
          mini: null as any,
          compact: null as any,
          full: null as any
        },
        icon: '🏆',
        color: '#C9190B'
      },
      category: CardCategory.ANALYTICS
    },
    {
      config: {
        id: 'return-tracking',
        name: '物料归还追踪',
        description: '追踪物料归还情况',
        api: 'today-pickups',
        refreshInterval: 60,
        defaultSize: { w: 4, h: 3 },
        minSize: { w: 3, h: 2 },
        maxSize: { w: 8, h: 6 },
        renderModes: {
          mini: null as any,
          compact: null as any,
          full: null as any
        },
        icon: '🔄',
        color: '#009596'
      },
      category: CardCategory.INVENTORY
    },
    {
      config: {
        id: 'project-dashboard',
        name: '项目状态看板',
        description: '显示项目整体状态',
        api: 'project-status',
        refreshInterval: 120,
        defaultSize: { w: 3, h: 3 },
        minSize: { w: 2, h: 2 },
        maxSize: { w: 6, h: 6 },
        renderModes: {
          mini: null as any,
          compact: null as any,
          full: null as any
        },
        icon: '📋',
        color: '#6B46C1'
      },
      category: CardCategory.MANAGEMENT
    },
    {
      config: {
        id: 'material-inventory',
        name: '物料库存总览',
        description: '物料库存全局概览和统计',
        refreshInterval: 90,
        defaultSize: { w: 4, h: 3 },
        minSize: { w: 3, h: 2 },
        maxSize: { w: 8, h: 6 },
        renderModes: {
          mini: null as any,
          compact: null as any,
          full: null as any
        },
        icon: '📊',
        color: '#DC2626'
      },
      category: CardCategory.INVENTORY
    },
    {
      config: {
        id: 'user-statistics',
        name: '用户状态统计',
        description: '系统用户基本情况统计',
        api: 'user-status',
        refreshInterval: 300,
        defaultSize: { w: 3, h: 2 },
        minSize: { w: 2, h: 2 },
        maxSize: { w: 6, h: 4 },
        renderModes: {
          mini: null as any,
          compact: null as any,
          full: null as any
        },
        icon: '👥',
        color: '#059669'
      },
      category: CardCategory.MANAGEMENT
    }
  ]
}

// 初始化默认卡片
export const initializeDefaultCards = () => {
  const configs = getDefaultCardConfigs()
  cardRegistry.registerBatch(configs)
  console.log(`Initialized ${configs.length} default cards`)
}

export default cardRegistry
