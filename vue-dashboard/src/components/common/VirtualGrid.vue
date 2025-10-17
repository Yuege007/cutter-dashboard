<template>
  <div
    ref="containerRef"
    class="virtual-grid-container custom-scrollbar"
    :style="{
      height: '100%',
      minHeight: minOptimalHeight + 'px'
    }"
    @scroll="handleScroll"
  >
    <!-- 占位容器，撑开总高度 -->
    <div 
      class="virtual-spacer" 
      :style="{ height: totalHeight + 'px', position: 'relative' }"
    >
      <!-- 可见项目容器 -->
      <div class="virtual-items">
        <div
          v-for="item in visibleItems"
          :key="getItemKey(item)"
          class="virtual-item"
          :style="{
            position: 'absolute',
            top: (item?.top || 0) + 'px',
            left: (item?.left || 0) + 'px',
            width: props.itemWidth + 'px',
            height: props.itemHeight + 'px'
          }"
        >
          <slot :item="item?.data" :index="item?.index || 0" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'

interface VirtualGridProps {
  items: any[]
  itemWidth: number
  itemHeight: number
  containerHeight: number
  bufferSize?: number
  keyField?: string
  gap?: number  // 间距大小
}

const props = withDefaults(defineProps<VirtualGridProps>(), {
  bufferSize: 3,
  keyField: 'id',
  gap: 0
})

interface VirtualItem {
  index: number
  row: number
  col: number
  top: number
  left: number
  data: any
}

const containerRef = ref<HTMLElement>()
const scrollTop = ref(0)
const containerWidth = ref(800)
const actualContainerHeight = ref(0)
const columnsCount = computed(() => {
  if (!containerWidth.value || containerWidth.value <= 0) return 1
  const availableWidth = containerWidth.value - props.gap
  const itemWidthWithGap = props.itemWidth + props.gap
  if (itemWidthWithGap <= 0) return 1
  return Math.max(1, Math.floor(availableWidth / itemWidthWithGap))
})

const totalRows = computed(() => {
  return Math.ceil(props.items.length / columnsCount.value)
})

// 计算居中偏移
const centerOffset = computed(() => {
  if (!containerWidth.value || columnsCount.value <= 0) return 0
  const totalContentWidth = columnsCount.value * (props.itemWidth + props.gap) + props.gap
  const remainingSpace = containerWidth.value - totalContentWidth
  return Math.max(0, remainingSpace / 2)
})

const totalHeight = computed(() => {
  const rowsWithGap = totalRows.value * props.itemHeight + (totalRows.value - 1) * props.gap
  return Math.max(0, rowsWithGap)
})

// 最小智能高度计算（避免半行显示）
const minOptimalHeight = computed(() => {
  if (!props.containerHeight || props.containerHeight <= 0) return 100
  const itemHeightWithGap = props.itemHeight + props.gap
  if (itemHeightWithGap <= 0) return 100

  const maxCompleteRows = Math.floor(props.containerHeight / itemHeightWithGap)
  const optimalContainerHeight = Math.max(1, maxCompleteRows) * itemHeightWithGap + props.gap

  // 如果内容高度小于最优高度，使用内容高度
  const contentHeight = totalHeight.value + props.gap
  return Math.max(100, Math.min(optimalContainerHeight, contentHeight))
})

// 动态容器高度（响应实际容器拉伸）
const dynamicHeight = computed(() => {
  const minHeight = minOptimalHeight.value
  const actualHeight = actualContainerHeight.value || 0
  return Math.max(minHeight, actualHeight)
})

const visibleRange = computed(() => {
  if (!props.items || props.items.length === 0) {
    return { start: 0, end: 0 }
  }

  const itemHeightWithGap = props.itemHeight + props.gap
  if (itemHeightWithGap <= 0) {
    return { start: 0, end: 0 }
  }

  const startRow = Math.floor(scrollTop.value / itemHeightWithGap) - props.bufferSize
  const endRow = Math.ceil((scrollTop.value + dynamicHeight.value) / itemHeightWithGap) + props.bufferSize

  return {
    start: Math.max(0, startRow),
    end: Math.min(totalRows.value - 1, Math.max(0, endRow))
  }
})

const visibleItems = computed(() => {
  if (!props.items || props.items.length === 0) {
    return []
  }

  const items: VirtualItem[] = []
  const { start, end } = visibleRange.value
  const cols = columnsCount.value

  if (cols <= 0 || start < 0 || end < start) {
    return []
  }

  for (let row = start; row <= end; row++) {
    for (let col = 0; col < cols; col++) {
      const index = row * cols + col

      // 检查是否超出数据范围
      if (index >= props.items.length) break

      // 确保数据存在
      if (!props.items[index]) continue

      const item: VirtualItem = {
        index,
        row,
        col,
        top: row * (props.itemHeight + props.gap) + props.gap,
        left: col * (props.itemWidth + props.gap) + props.gap + centerOffset.value,
        data: props.items[index]
      }

      items.push(item)
    }
  }

  return items
})

// 获取项目的key
const getItemKey = (item: VirtualItem) => {
  if (!item || !item.data) return `item-${item?.index || 0}`
  return item.data[props.keyField] || `item-${item.index}`
}

// 滚动处理
const handleScroll = (event: Event) => {
  const target = event.target as HTMLElement
  scrollTop.value = target.scrollTop
}

// 更新容器尺寸
const updateContainerSize = () => {
  if (containerRef.value && containerRef.value.clientWidth > 0) {
    containerWidth.value = containerRef.value.clientWidth || 800
    actualContainerHeight.value = containerRef.value.clientHeight || 0
  }
}

// ResizeObserver
let resizeObserver: ResizeObserver | null = null

// 生命周期
onMounted(() => {
  nextTick(() => {
    updateContainerSize()

    // 监听容器尺寸变化
    if (containerRef.value) {
      resizeObserver = new ResizeObserver(() => {
        updateContainerSize()
      })
      resizeObserver.observe(containerRef.value)
    }
  })
})

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
  }
})

// 监听数据变化，重置滚动位置
watch(() => props.items.length, () => {
  scrollTop.value = 0
  if (containerRef.value) {
    containerRef.value.scrollTop = 0
  }
})



// 暴露方法
defineExpose({
  scrollTo: (top: number) => {
    if (containerRef.value) {
      containerRef.value.scrollTo({ top, behavior: 'smooth' })
    }
  },
  scrollToIndex: (index: number) => {
    const row = Math.floor(index / columnsCount.value)
    const top = row * (props.itemHeight + props.gap) + props.gap
    if (containerRef.value) {
      containerRef.value.scrollTo({ top, behavior: 'smooth' })
    }
  }
})
</script>

<style scoped>
.virtual-grid-container {
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;
}

.virtual-spacer {
  width: 100%;
}

.virtual-items {
  position: relative;
  width: 100%;
  height: 100%;
}

.virtual-item {
  box-sizing: border-box;
}

/* 滚动条样式现在使用全局 custom-scrollbar 类 */
</style>
