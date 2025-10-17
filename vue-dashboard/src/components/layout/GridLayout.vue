<template>
  <div class="grid-layout-container" :style="{ minHeight: `${dynamicHeight}px` }">
    <GridLayout
      v-model:layout="layoutData"
      :col-num="colNum"
      :row-height="rowHeight"
      :is-draggable="isDraggable"
      :is-resizable="isResizable"
      :is-mirrored="false"
      :vertical-compact="false"
      :prevent-collision="false"
      :max-rows="100"
      :margin="margin"
      :use-css-transforms="true"
      :responsive="responsive"
      :breakpoints="breakpoints"
      :cols="cols"
      :style="{ minHeight: `${dynamicHeight}px` }"
      @layout-created="onLayoutCreated"
      @layout-before-mount="onLayoutBeforeMount"
      @layout-mounted="onLayoutMounted"
      @layout-ready="onLayoutReady"
      @layout-updated="onLayoutUpdated"
      @breakpoint-changed="onBreakpointChanged"
    >
      <GridItem
        v-for="item in layoutData"
        :key="item.i"
        :x="item.x"
        :y="item.y"
        :w="item.w"
        :h="item.h"
        :i="item.i"
        :min-w="item.minW"
        :min-h="item.minH"
        :is-draggable="item.isDraggable !== false"
        :is-resizable="true"
        :static="item.static || false"
        drag-allow-from=".drag-zone"
        drag-ignore-from=".resize-handle"
        @resize="onItemResize"
        @move="onItemMove"
        @resized="onItemResized"
        @moved="onItemMoved"
      >
        <!-- 直接渲染BaseCard，移除中间容器 -->
        <component
          :is="getCardComponent(item.i)"
          v-bind="getCardProps(item.i)"
          :class="{ 'grid-item-dragging': item.isDragging }"
          @refresh="() => refreshCard(item.i)"
          @settings="() => configureItem(item.i)"
          @delete="() => removeItem(item.i)"
          @lock="(locked) => handleCardLockRequest(item.i, locked)"
        />
      </GridItem>
    </GridLayout>

    <!-- 空状态 -->
    <EmptyState
      v-if="layoutData.length === 0"
      title="看板为空"
      description="从左侧拖拽卡片到这里开始构建您的数字看板"
      :icon-component="DashboardIcon"
      size="lg"
      custom-class="absolute inset-0"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick, markRaw } from 'vue'
import { GridLayout, GridItem } from 'vue-grid-layout-v3'
import { useCardStore } from '@/stores/card'
import EmptyState from '@/components/common/EmptyState.vue'
import DashboardIcon from '@/components/icons/DashboardIcon.vue'
import type { LayoutItem } from '@/types'

export interface GridLayoutProps {
  colNum?: number
  rowHeight?: number
  isDraggable?: boolean
  isResizable?: boolean
  margin?: [number, number]
  responsive?: boolean
  showItemToolbar?: boolean
  breakpoints?: Record<string, number>
  cols?: Record<string, number>
}

const props = withDefaults(defineProps<GridLayoutProps>(), {
  colNum: 14, // 调整为14列，增加列宽约10px
  rowHeight: 90, // 进一步增加行高
  isDraggable: true,
  isResizable: true,
  margin: () => [10, 10],
  responsive: true,
  showItemToolbar: false, // 不再显示GridLayout的工具栏
  breakpoints: () => ({ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }),
  cols: () => ({ lg: 14, md: 10, sm: 7, xs: 5, xxs: 3 }) // 调整响应式列数
})

const emit = defineEmits<{
  layoutUpdated: [layout: LayoutItem[]]
  itemAdded: [item: LayoutItem]
  itemRemoved: [itemId: string]
  itemConfigured: [itemId: string]
  breakpointChanged: [newBreakpoint: string, layout: LayoutItem[]]
}>()

const cardStore = useCardStore()
const layoutData = ref<LayoutItem[]>([])

// 动态高度相关的响应式变量
const windowHeight = ref(window.innerHeight)
const headerHeight = ref(64) // 工具栏高度
const footerHeight = ref(0)  // 底部区域高度
const isDragging = ref(false) // 拖拽状态

// 监听窗口大小变化
const updateWindowHeight = () => {
  windowHeight.value = window.innerHeight
}

onMounted(() => {
  window.addEventListener('resize', updateWindowHeight)
  // 动态计算头部高度
  nextTick(() => {
    const toolbarEl = document.querySelector('.toolbar') as HTMLElement
    if (toolbarEl) {
      headerHeight.value = toolbarEl.offsetHeight
    }
  })
})

onUnmounted(() => {
  window.removeEventListener('resize', updateWindowHeight)
})

// 从 cardStore 同步布局数据
watch(
  () => cardStore.activeCardsList,
  (newCards) => {
    layoutData.value = newCards.map(card => ({
      i: card.id,
      x: card.position?.x || 0,
      y: card.position?.y || 0,
      w: card.size?.w || card.config.defaultSize.w,
      h: card.size?.h || card.config.defaultSize.h,
      minW: card.config.minSize?.w || 1,
      minH: card.config.minSize?.h || 1,
      // 移除最大尺寸限制，允许无限制调整大小
      // maxW: card.config.maxSize?.w || 12,
      // maxH: card.config.maxSize?.h || 12,
      isDraggable: card.config.resizable !== false,
      isResizable: card.config.resizable !== false,
      static: card.locked || false
    }))
  },
  { immediate: true, deep: true }
)

// 计算可用视口高度
const viewportHeight = computed(() => {
  return windowHeight.value - headerHeight.value - footerHeight.value
})

// 计算内容高度（基于卡片位置）
const contentHeight = computed(() => {
  if (layoutData.value.length === 0) return 0

  // 找出最底部的卡片位置
  const maxY = Math.max(...layoutData.value.map(item => item.y + item.h))
  // 计算内容高度 (行数 * (行高 + 垂直边距))
  return maxY * (props.rowHeight + props.margin[1])
})

// 计算额外空间（根据内容和拖拽状态动态调整）
const dynamicExtraSpace = computed(() => {
  const rowSize = props.rowHeight + props.margin[1]

  if (layoutData.value.length === 0) {
    // 空状态：只在拖拽时提供额外空间
    return isDragging.value ? 3 * rowSize : 0
  }

  // 有内容状态：提供适量缓冲空间
  const baseExtra = 2 * rowSize // 正常时2行缓冲
  return isDragging.value ? baseExtra * 2 : baseExtra // 拖拽时4行缓冲
})

// 最终的动态高度
const dynamicHeight = computed(() => {
  const availableHeight = viewportHeight.value - headerHeight.value - footerHeight.value - 50 // 减去50px边距

  if (layoutData.value.length === 0) {
    // 空状态：刚好填满可视区域，无滚动条
    return Math.max(availableHeight, 400) // 最小400px保证基本可用性
  }

  // 有内容状态：基于内容高度 + 缓冲空间
  const calculatedHeight = contentHeight.value + dynamicExtraSpace.value

  // 确保至少有基本的拖拽空间（5行）
  const minGridHeight = 5 * (props.rowHeight + props.margin[1])

  return Math.max(availableHeight, calculatedHeight, minGridHeight)
})

// 监听拖拽状态变化
watch(isDragging, (newVal) => {
  // 拖拽状态变化处理（移除调试日志）
})

// 获取卡片组件
const getCardComponent = (itemId: string) => {
  const card = cardStore.getCard(itemId)
  const component = card?.config.component || null
  // 使用markRaw防止组件被响应式化
  return component ? markRaw(component) : null
}

// 获取卡片属性
const getCardProps = (itemId: string) => {
  const card = cardStore.getCard(itemId)
  if (!card) return {}

  // 获取当前布局项的尺寸信息
  const layoutItem = layoutData.value.find(item => item.i === itemId)

  return {
    ...card.config.defaultProps,
    ...card.props,
    // 传递尺寸信息给卡片组件
    width: layoutItem?.w || card.config.defaultSize.w,
    height: layoutItem?.h || card.config.defaultSize.h,
    minWidth: card.config.minSize?.w || 1,
    minHeight: card.config.minSize?.h || 1,
    // 传递锁定状态
    locked: layoutItem?.static || false,
    // 传递拖拽状态
    isDragging: isDragging.value,
    cardId: itemId
  }
}

// 获取卡片标题
const getCardTitle = (itemId: string) => {
  const card = cardStore.getCard(itemId)
  return card?.config.name || '未知卡片'
}

// 布局事件处理
const onLayoutCreated = (newLayout: LayoutItem[]) => {
  // 布局创建处理
}

const onLayoutBeforeMount = (newLayout: LayoutItem[]) => {
  // 布局挂载前处理
}

const onLayoutMounted = (newLayout: LayoutItem[]) => {
  // 布局挂载后处理
}

const onLayoutReady = (newLayout: LayoutItem[]) => {
  // 布局就绪处理
}

const onLayoutUpdated = (newLayout: LayoutItem[]) => {
  // 更新 cardStore 中的位置信息
  newLayout.forEach(item => {
    cardStore.updateCardPosition(item.i, {
      x: item.x,
      y: item.y
    })
    cardStore.updateCardSize(item.i, {
      w: item.w,
      h: item.h
    })
  })

  emit('layoutUpdated', newLayout)
}

const onBreakpointChanged = (newBreakpoint: string, newLayout: LayoutItem[]) => {
  emit('breakpointChanged', newBreakpoint, newLayout)
}

// 项目事件处理
const onItemResize = (i: string, h: number, w: number, hPx: number, wPx: number) => {
  // 项目调整大小处理
}

const onItemMove = (i: string, x: number, y: number) => {
  // 设置拖拽状态，增加额外空间
  isDragging.value = true
}

const onItemResized = (i: string, h: number, w: number, _hPx: number, _wPx: number) => {
  cardStore.updateCardSize(i, { w, h })
  // 调整大小后重新计算高度
  nextTick(() => {
    // 高度会自动重新计算
  })
}

const onItemMoved = (i: string, x: number, y: number) => {
  cardStore.updateCardPosition(i, { x, y })

  // 延迟恢复工具栏交互，防止意外点击
  setTimeout(() => {
    isDragging.value = false
  }, 150) // 150ms延迟

  // 移动后重新计算高度
  nextTick(() => {
    // 高度会自动重新计算
  })
}

// 工具栏操作
const toggleItemLock = (itemId: string) => {
  const item = layoutData.value.find(item => item.i === itemId)
  if (item) {
    item.static = !item.static
    // 更新卡片的锁定状态
    const card = cardStore.getCard(itemId)
    if (card) {
      card.locked = item.static
    }
  }
}

// 处理来自BaseCard的锁定请求
const handleCardLockRequest = (itemId: string, locked: boolean) => {
  const item = layoutData.value.find(item => item.i === itemId)
  if (item) {
    item.static = locked
    // 更新卡片的锁定状态
    const card = cardStore.getCard(itemId)
    if (card) {
      card.locked = locked
    }
  }
}

// 移除了自定义调整大小处理，使用vue-grid-layout原生onItemResized



const configureItem = (itemId: string) => {
  emit('itemConfigured', itemId)
}

const removeItem = (itemId: string) => {
  cardStore.removeCard(itemId)
  emit('itemRemoved', itemId)
}

const refreshCard = (itemId: string) => {
  // 获取卡片实例
  const cardInstance = cardStore.getCard(itemId)
  if (!cardInstance) {
    console.warn('⚠️ 未找到卡片实例:', itemId)
    return
  }

  // 更新卡片状态和时间戳
  cardStore.updateCardState(itemId, 'loading')
  cardInstance.lastUpdated = new Date()
}

// 添加新项目的方法
const addItem = (cardType: string, position?: { x: number; y: number }) => {
  const instanceId = cardStore.addCard(cardType, position)
  if (instanceId) {
    const newCard = cardStore.getCard(instanceId)
    if (newCard) {
      const newItem: LayoutItem = {
        i: newCard.id,
        x: position?.x || 0,
        y: position?.y || 0,
        w: newCard.config.defaultSize.w,
        h: newCard.config.defaultSize.h,
        minW: newCard.config.minSize?.w || 1,
        minH: newCard.config.minSize?.h || 1,
        maxW: newCard.config.maxSize?.w || 12,
        maxH: newCard.config.maxSize?.h || 12
      }
      emit('itemAdded', newItem)
    }
  }
}

// 暴露方法给父组件
defineExpose({
  addItem,
  removeItem,
  configureItem
})
</script>

<style scoped>
.grid-layout-container {
  @apply relative w-full h-full;
  transition: min-height 0.3s ease; /* 平滑高度过渡 */
}

/* 拖拽状态样式 */
.grid-item-dragging {
  z-index: 1000;
}

/* 空状态样式已移至 EmptyState 组件 */

/* Vue Grid Layout 样式覆盖 */
:deep(.vue-grid-layout) {
  background-color: transparent;
}

:deep(.vue-grid-item) {
  transition: all 0.2s ease;
}

:deep(.vue-grid-item.vue-grid-placeholder) {
  background-color: var(--color-primary);
  opacity: 0.3;
  border-radius: 8px;
}

/* 自定义原生调整大小手柄样式 */
:deep(.vue-grid-item > .vue-resizable-handle) {
  /* 移除默认样式 */
  background: none !important;
  border: none !important;
  width: 16px !important;
  height: 16px !important;
  bottom: 2px !important;
  right: 2px !important;
  opacity: 0.6;
  transition: all 0.2s ease;
}

/* 添加简洁的直角符号 */
:deep(.vue-grid-item > .vue-resizable-handle::after) {
  content: '⌟';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 14px;
  color: #86868b;
  line-height: 1;
}

/* hover效果 */
:deep(.vue-grid-item:hover > .vue-resizable-handle) {
  opacity: 1;
}

:deep(.vue-grid-item:hover > .vue-resizable-handle::after) {
  color: #007aff;
  transform: translate(-50%, -50%) scale(1.1);
}

/* 深色主题支持 - 使用主题系统 */
.theme-dark :deep(.vue-grid-item > .vue-resizable-handle::after),
.theme-tech :deep(.vue-grid-item > .vue-resizable-handle::after) {
  color: var(--color-text-secondary);
}

.theme-dark :deep(.vue-grid-item:hover > .vue-resizable-handle::after),
.theme-tech :deep(.vue-grid-item:hover > .vue-resizable-handle::after) {
  color: var(--color-primary);
}

/* 锁定状态下隐藏调整手柄 */
:deep(.vue-grid-item.static > .vue-resizable-handle) {
  display: none !important;
}

:deep(.vue-grid-item > .vue-resizable-handle) {
  background-color: var(--color-primary);
  opacity: 0.6;
}

:deep(.vue-grid-item > .vue-resizable-handle:hover) {
  opacity: 1;
}
</style>
