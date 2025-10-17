import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { CardConfig, CardInstance, CardMode, CardState } from '@/types'
import { useLayoutStore } from './layout'

export const useCardStore = defineStore('card', () => {
  // 状态
  const registeredCards = ref<Map<string, CardConfig>>(new Map())
  const activeCards = ref<Map<string, CardInstance>>(new Map())
  const cardData = ref<Map<string, any>>(new Map())

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
      state: 'loading',
      lastUpdated: new Date()
    }

    // 添加到状态
    activeCards.value.set(instanceId, cardInstance)
    saveToLocalStorage()

    return instanceId
  }

  const removeCard = (instanceId: string) => {
    activeCards.value.delete(instanceId)
    cardData.value.delete(instanceId)
    saveToLocalStorage()
  }

  const getCard = (instanceId: string): CardInstance | undefined => {
    return activeCards.value.get(instanceId)
  }

  const updateCardState = (instanceId: string, state: CardState, error?: string) => {
    const card = activeCards.value.get(instanceId)
    if (card) {
      card.state = state
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

    const { w, h } = card.layout
    
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
      card.position = position
      saveToLocalStorage()
    }
  }

  const updateCardSize = (cardId: string, size: { w: number; h: number }) => {
    const card = activeCards.value.get(cardId)
    if (card) {
      card.size = size
      saveToLocalStorage()
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
        state: card.state
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
            state: cardData.state || { loading: false, error: null, lastUpdated: new Date() },
            locked: false
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
    try {
      const cardsData = Array.from(activeCards.value.values()).map(card => ({
        cardId: card.cardId,
        position: card.position,
        size: card.size,
        props: card.props,
        state: card.state
      }))
      localStorage.setItem('dashboard-cards', JSON.stringify(cardsData))
    } catch (error) {
      console.error('❌ 卡片数据保存失败:', error.message)
    }
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
              state: 'loading',
              lastUpdated: new Date()
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
