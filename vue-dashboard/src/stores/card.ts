import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { CardConfig, CardInstance, CardMode, CardState } from '@/types'
import { useLayoutStore } from './layout'
import { getCacheManager } from '@/services/cache'

export const useCardStore = defineStore('card', () => {
  // 状态
  const registeredCards = ref<Map<string, CardConfig>>(new Map())
  const activeCards = ref<Map<string, CardInstance>>(new Map())
  const cardData = ref<Map<string, any>>(new Map())
  let saveTimer: ReturnType<typeof setTimeout> | undefined

  // 计算属性
  const availableCards = computed(() => {
    return Array.from(registeredCards.value.values())
  })

  const activeCardsList = computed(() => {
    return Array.from(activeCards.value.values())
  })

  const cardCount = computed(() => {
    return activeCards.value.size
  })

  // 方法
  const registerCard = (config: CardConfig) => {
    registeredCards.value.set(config.id, config)
  }

  const unregisterCard = (cardId: string) => {
    registeredCards.value.delete(cardId)
  }

  const getCardConfig = (cardId: string): CardConfig | undefined => {
    return registeredCards.value.get(cardId)
  }

  const addCard = (cardId: string, position?: { x: number; y: number }): string => {
    const config = getCardConfig(cardId)
    if (!config) {
      throw new Error(`Card config not found for id: ${cardId}`)
    }

    const layoutStore = useLayoutStore()
    const instanceId = `${cardId}-${Date.now()}`

    // 确定位置
    const pos = position || layoutStore.findNextPosition(
      config.defaultSize.w,
      config.defaultSize.h
    )

    // 创建卡片实例
    const cardInstance: CardInstance = {
      id: instanceId,
      cardId,
      config,
      position: { x: pos.x, y: pos.y },
      size: { w: config.defaultSize.w, h: config.defaultSize.h },
      state: { status: 'loading' },
      lastUpdated: new Date(),
      lockedMode: undefined
    }

    // 添加到状态
    activeCards.value.set(instanceId, cardInstance)
    saveToLocalStorage()

    return instanceId
  }

  const removeCard = (instanceId: string) => {
    const instance = activeCards.value.get(instanceId)
    activeCards.value.delete(instanceId)
    cardData.value.delete(instanceId)
    saveToLocalStorage()
    // 清理该卡片相关缓存：按前缀和标识进行失效
    try {
      const cacheManager = getCacheManager()
      if (instance) {
        const cardId = instance.cardId
        const pattern = new RegExp(`(card:${cardId}:)|(${instanceId})|(${cardId})`)
        cacheManager.invalidate(pattern).catch(err => console.warn('缓存清理失败:', err))
      } else {
        // 无实例时按 instanceId 兜底
        const fallback = new RegExp(`${instanceId}`)
        cacheManager.invalidate(fallback).catch(err => console.warn('缓存清理失败:', err))
      }
    } catch (e) {
      console.warn('缓存管理器不可用，跳过卡片数据清理')
    }
  }

  const getCard = (instanceId: string): CardInstance | undefined => {
    return activeCards.value.get(instanceId)
  }

  const updateCardState = (instanceId: string, state: CardState, error?: string) => {
    const card = activeCards.value.get(instanceId)
    if (card) {
      card.state = { status: state }
      card.lastUpdated = new Date()
      if (error) {
        card.error = error
      } else {
        delete card.error
      }
    }
  }

  const updateCardData = (instanceId: string, data: any) => {
    cardData.value.set(instanceId, data)
    updateCardState(instanceId, 'loaded')
  }

  const getCardData = (instanceId: string) => {
    return cardData.value.get(instanceId)
  }

  const getCardMode = (instanceId: string): CardMode => {
    const card = getCard(instanceId)
    if (!card) return 'mini'

    if (!card.size) return 'mini'
    const { w, h } = card.size
    
    // 根据卡片尺寸判断显示模式
    if (w <= 2 && h <= 2) {
      return 'mini'
    } else if (w <= 4 && h <= 3) {
      return 'compact'
    } else {
      return 'full'
    }
  }

  const updateCardPosition = (cardId: string, position: { x: number; y: number }) => {
    const card = activeCards.value.get(cardId)
    if (card) {
      if (card.position?.x === position.x && card.position?.y === position.y) return
      card.position = position
      scheduleSaveToLocalStorage()
    }
  }

  const updateCardSize = (cardId: string, size: { w: number; h: number }) => {
    const card = activeCards.value.get(cardId)
    if (card) {
      if (card.size?.w === size.w && card.size?.h === size.h) return
      card.size = size
      scheduleSaveToLocalStorage()
    }
  }

  const exportLayout = () => {
    return {
      cards: Array.from(activeCards.value.values()).map(card => ({
        id: card.id,
        cardId: card.cardId,
        position: card.position,
        size: card.size,
        props: card.props,
        state: card.state,
        lockedMode: card.lockedMode
      })),
      timestamp: new Date().toISOString()
    }
  }

  const importLayout = (layout: any) => {
    if (layout.cards) {
      activeCards.value.clear()
      cardData.value.clear()

      layout.cards.forEach((cardData: any) => {
        const config = getCardConfig(cardData.cardId)
        if (config) {
          const card: CardInstance = {
            id: cardData.id,
            cardId: cardData.cardId,
            config,
            position: cardData.position || { x: 0, y: 0 },
            size: cardData.size || config.defaultSize,
            props: cardData.props || {},
            state: { status: 'loading' },
            locked: false,
            lockedMode: cardData.lockedMode
          }
          activeCards.value.set(card.id, card)
        }
      })
      saveToLocalStorage()
    }
  }

  const clearAll = () => {
    activeCards.value.clear()
    cardData.value.clear()
    saveToLocalStorage()
  }

  const clearAllCards = () => {
    clearAll()
  }

  const saveToLocalStorage = () => {
    if (saveTimer) {
      clearTimeout(saveTimer)
      saveTimer = undefined
    }

    try {
      const cardsData = Array.from(activeCards.value.values()).map(card => ({
        cardId: card.cardId,
        position: card.position,
        size: card.size,
        props: card.props,
        state: card.state,
        lockedMode: card.lockedMode
      }))
      localStorage.setItem('dashboard-cards', JSON.stringify(cardsData))
    } catch (error) {
      console.error('❌ 卡片数据保存失败:', (error as any)?.message || error)
    }
  }

  const scheduleSaveToLocalStorage = () => {
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(() => {
      saveToLocalStorage()
    }, 250)
  }

  const loadFromLocalStorage = () => {
    try {
      const saved = localStorage.getItem('dashboard-cards')
      if (saved) {
        const cardsData = JSON.parse(saved)

        cardsData.forEach((item: any) => {
          const config = getCardConfig(item.cardId)
          if (config) {
            const instanceId = `${item.cardId}-${Date.now()}-${Math.random()}`

            const cardInstance: CardInstance = {
              id: instanceId,
              cardId: item.cardId,
              config,
              position: item.position || { x: 0, y: 0 },
              size: item.size || config.defaultSize,
              state: { status: 'loading' },
              lastUpdated: new Date(),
              lockedMode: item.lockedMode
            }

            activeCards.value.set(instanceId, cardInstance)
          }
        })
      }
    } catch (error) {
      console.error('Failed to load cards from localStorage:', error)
    }
  }

  return {
    // 状态
    registeredCards,
    activeCards,
    cardData,
    
    // 计算属性
    availableCards,
    activeCardsList,
    cardCount,
    
    // 方法
    registerCard,
    unregisterCard,
    getCardConfig,
    addCard,
    removeCard,
    getCard,
    updateCardState,
    updateCardData,
    getCardData,
    getCardMode,
    updateCardPosition,
    updateCardSize,
    exportLayout,
    importLayout,
    clearAll,
    clearAllCards,
    saveToLocalStorage,
    loadFromLocalStorage
  }
})
