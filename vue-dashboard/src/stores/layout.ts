import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { LayoutItem } from '@/types'

export const useLayoutStore = defineStore('layout', () => {
  // 状态
  const layouts = ref<LayoutItem[]>([])
  const cols = ref(14) // 调整为14列，增加列宽约10px
  const rowHeight = ref(90) // 进一步增加行高
  const margin = ref([10, 10])
  const isDraggable = ref(true)
  const isResizable = ref(true)
  const autoSize = ref(true)
  const verticalCompact = ref(true)
  const preventCollision = ref(false)

  // 计算属性
  const layoutMap = computed(() => {
    const map = new Map<string, LayoutItem>()
    layouts.value.forEach(item => {
      map.set(item.i, item)
    })
    return map
  })

  const usedPositions = computed(() => {
    return layouts.value.map(item => ({
      x: item.x,
      y: item.y,
      w: item.w,
      h: item.h
    }))
  })

  // 方法
  const addLayout = (layout: LayoutItem) => {
    const existingIndex = layouts.value.findIndex(item => item.i === layout.i)
    if (existingIndex >= 0) {
      layouts.value[existingIndex] = layout
    } else {
      layouts.value.push(layout)
    }
  }

  const removeLayout = (id: string) => {
    const index = layouts.value.findIndex(item => item.i === id)
    if (index >= 0) {
      layouts.value.splice(index, 1)
    }
  }

  const updateLayout = (id: string, updates: Partial<LayoutItem>) => {
    const layout = layoutMap.value.get(id)
    if (layout) {
      Object.assign(layout, updates)
    }
  }

  const getLayout = (id: string): LayoutItem | undefined => {
    return layoutMap.value.get(id)
  }

  const findNextPosition = (w: number, h: number): { x: number; y: number } => {
    // 简单的位置查找算法
    for (let y = 0; y < 100; y++) {
      for (let x = 0; x <= cols.value - w; x++) {
        const isCollision = layouts.value.some(item => {
          return !(
            x >= item.x + item.w ||
            x + w <= item.x ||
            y >= item.y + item.h ||
            y + h <= item.y
          )
        })
        
        if (!isCollision) {
          return { x, y }
        }
      }
    }
    
    // 如果找不到位置，放在最底部
    const maxY = Math.max(...layouts.value.map(item => item.y + item.h), 0)
    return { x: 0, y: maxY }
  }

  const updateLayouts = (newLayouts: LayoutItem[]) => {
    layouts.value = newLayouts
  }

  const clearLayouts = () => {
    layouts.value = []
  }

  const saveToLocalStorage = () => {
    try {
      localStorage.setItem('dashboard-layouts', JSON.stringify(layouts.value))
    } catch (error) {
      console.error('❌ 布局数据保存失败:', error.message)
    }
  }

  const loadFromLocalStorage = () => {
    try {
      const saved = localStorage.getItem('dashboard-layouts')
      if (saved) {
        layouts.value = JSON.parse(saved)
      }
    } catch (error) {
      console.error('❌ 布局数据加载失败:', error.message)
    }
  }

  return {
    // 状态
    layouts,
    cols,
    rowHeight,
    margin,
    isDraggable,
    isResizable,
    autoSize,
    verticalCompact,
    preventCollision,
    
    // 计算属性
    layoutMap,
    usedPositions,
    
    // 方法
    addLayout,
    removeLayout,
    updateLayout,
    getLayout,
    findNextPosition,
    updateLayouts,
    clearLayouts,
    saveToLocalStorage,
    loadFromLocalStorage
  }
})
