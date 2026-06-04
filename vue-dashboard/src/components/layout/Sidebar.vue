<template>
  <div class="sidebar" :class="{
    'sidebar-visible': !collapsed,
    'sidebar-hidden': collapsed,
    'sidebar-dragging': props.isDragging && !collapsed
  }">
    <!-- 侧边栏头部 -->
    <div class="sidebar-header">
      <div class="sidebar-title">
        <h2 class="title-text">组件库</h2>
        <p class="title-subtitle">拖拽添加到看板</p>
      </div>
      <button
        @click="toggleCollapse"
        class="collapse-btn"
        title="关闭侧边栏"
      >
        <svg
          class="w-5 h-5 transition-transform duration-200"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>





    <!-- 卡片列表 -->
    <div class="sidebar-content">
      <div class="card-list">
        <!-- 分组显示 -->
        <div v-for="group in groupedCards" :key="group.category" class="card-group">
          <h3 class="group-title">{{ getCategoryLabel(group.category) }}</h3>
          <div class="group-cards">
            <div
              v-for="card in group.cards"
              :key="card.id"
              class="card-item"
              :draggable="true"
              @dragstart="onDragStart($event, card)"
              @dragend="onDragEnd"
              @click="addCardToGrid(card)"

            >
              <div class="card-item-content">
                <div class="card-icon">
                  <component :is="card.icon" v-if="typeof card.icon === 'object'" />
                  <span v-else>{{ card.icon }}</span>
                </div>
                <div class="card-info">
                  <h4 class="card-name">{{ card.name }}</h4>
                  <p class="card-description">{{ card.description }}</p>
                </div>
              </div>

              <!-- 预览按钮 -->
              <div class="card-actions">
                <button
                  @click.stop="previewCard(card)"
                  class="action-btn"
                  title="预览"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
              </div>

            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <EmptyState
          v-if="availableCards.length === 0"
          description="暂无可用组件"
          icon="📦"
          size="md"
        />
      </div>

    </div>

    <!-- 底部信息 -->
    <div class="sidebar-footer">
      <div class="stats">
        <span class="stat-item">{{ availableCards.length }} 个组件</span>
        <span class="stat-item">{{ activeCardsCount }} 个已添加</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useCardStore } from '@/stores/card'
import type { CardConfig } from '@/types'
import EmptyState from '@/components/common/EmptyState.vue'

export interface SidebarProps {
  defaultCollapsed?: boolean
  isDragging?: boolean
}

const props = withDefaults(defineProps<SidebarProps>(), {
  defaultCollapsed: false,
  isDragging: false
})

const emit = defineEmits<{
  cardAdd: [cardType: string, position?: { x: number; y: number }]
  cardPreview: [card: CardConfig]
  dragStart: [card: CardConfig]
  dragEnd: []
  close: []
}>()

const cardStore = useCardStore()
const collapsed = computed(() => props.defaultCollapsed)

// 计算属性
const availableCards = computed(() => cardStore.availableCards)
const activeCardsCount = computed(() => cardStore.cardCount)

const groupedCards = computed(() => {
  const groups = new Map<string, CardConfig[]>()

  availableCards.value.forEach(card => {
    const category = card.category
    if (!groups.has(category)) {
      groups.set(category, [])
    }
    groups.get(category)!.push(card)
  })

  return Array.from(groups.entries()).map(([category, cards]) => ({
    category,
    cards: cards.sort((a, b) => a.name.localeCompare(b.name))
  }))
})



// 方法
const toggleCollapse = () => {
  emit('close') // 通知父组件关闭侧边栏
}

const getCategoryLabel = (category: string) => {
  const categoryMap: Record<string, string> = {
    'all': '全部',
    'data': '数据',
    'chart': '图表',
    'text': '文本',
    'media': '媒体',
    'layout': '布局',
    'inventory': '库存',
    'device': '设备',
    'analytics': '分析',
    'tracking': '追踪'
  }
  return categoryMap[category] || category
}

const onDragStart = (event: DragEvent, card: CardConfig) => {
  if (event.dataTransfer) {
    event.dataTransfer.setData('application/json', JSON.stringify({
      type: 'card',
      cardId: card.id
    }))
    event.dataTransfer.setData('text/plain', card.name)
    event.dataTransfer.effectAllowed = 'copy'

    const target = event.currentTarget as HTMLElement | null
    if (target) {
      event.dataTransfer.setDragImage(target, 24, 24)
    }
  }
  emit('dragStart', card)
}

const onDragEnd = () => {
  emit('dragEnd')
}

const addCardToGrid = (card: CardConfig) => {
  emit('cardAdd', card.id)
}

const previewCard = (card: CardConfig) => {
  emit('cardPreview', card)
}



// ESC键关闭侧边栏
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && !collapsed.value) {
    emit('close')
  }
}

// 生命周期
onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.sidebar {
  @apply flex flex-col;
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  width: 320px;
  z-index: 40;
  background-color: rgba(255, 255, 255, 0.9);
  border-right: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 2px 0 20px rgba(0, 0, 0, 0.15);

  /* Apple标准缓动曲线 + 多重动画 */
  transition:
    transform 300ms cubic-bezier(0.4, 0.0, 0.2, 1),
    opacity 300ms cubic-bezier(0.4, 0.0, 0.2, 1),
    backdrop-filter 300ms cubic-bezier(0.4, 0.0, 0.2, 1);

  /* 性能优化 */
  will-change: transform, opacity, backdrop-filter;
}

/* 深色主题支持 - 使用主题系统 */
.theme-dark .sidebar,
.theme-tech .sidebar {
  background-color: var(--color-surface);
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 2px 0 20px rgba(0, 0, 0, 0.3);
}

/* 显示状态 */
.sidebar-visible {
  transform: translateX(0);
  opacity: 1;
  backdrop-filter: blur(10px);
}

/* 隐藏状态 - 完全消失 */
.sidebar-hidden {
  transform: translateX(-100%);
  opacity: 0;
  backdrop-filter: blur(0px);
  pointer-events: none; /* 隐藏时不响应鼠标事件 */
}

/* 拖拽状态 - 透明穿透 */
.sidebar-dragging {
  opacity: 0.3 !important;
  backdrop-filter: blur(5px) !important;
  transition:
    opacity 200ms cubic-bezier(0.4, 0.0, 0.2, 1),
    backdrop-filter 200ms cubic-bezier(0.4, 0.0, 0.2, 1) !important;
}

/* 拖拽状态下，让侧边栏背景区域穿透 */
.sidebar-dragging::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: -1;
}

/* 拖拽状态下，头部和底部区域穿透 */
.sidebar-dragging .sidebar-header,
.sidebar-dragging .sidebar-footer {
  pointer-events: none;
}

/* 拖拽状态下，卡片列表容器允许事件穿透，但卡片本身保持可拖拽 */
.sidebar-dragging .sidebar-content {
  pointer-events: none;
}

.sidebar-dragging .card-list {
  pointer-events: none;
}

.sidebar-dragging .card-group {
  pointer-events: none;
}

/* 只有卡片项本身保持可交互 */
.sidebar-dragging .card-item {
  pointer-events: auto;
}

.sidebar-header {
  @apply flex items-center justify-between p-4 border-b;
  border-color: var(--color-surface);
}

.sidebar-title {
  @apply flex-1;
}

.title-text {
  @apply text-lg font-semibold;
  color: var(--color-text);
}

.title-subtitle {
  @apply text-sm mt-1;
  color: var(--color-text-secondary);
}

.collapse-btn {
  @apply p-2 rounded-lg transition-colors;
  color: var(--color-text-secondary);
}

.collapse-btn:hover {
  background-color: var(--color-primary);
  color: white;
}



.sidebar-content {
  @apply flex-1 overflow-y-auto custom-scrollbar;
}

.card-list {
  @apply p-4 space-y-6;
}

.card-group {
  @apply space-y-3;
}

.group-title {
  @apply text-sm font-semibold uppercase tracking-wide;
  color: var(--color-text-secondary);
}

.group-cards {
  @apply space-y-2;
}

.card-item {
  @apply relative p-3 rounded-lg border cursor-pointer transition-all duration-200;
  background-color: var(--color-background);
  border-color: var(--color-surface);
}

.card-item:hover {
  border-color: var(--color-primary);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* 拖拽状态下的卡片样式 */
.sidebar-dragging .card-item {
  cursor: grab;
}

.sidebar-dragging .card-item:active {
  cursor: grabbing;
}

.card-item-content {
  @apply flex items-start space-x-3;
}

.card-icon {
  @apply flex flex-shrink-0 items-center justify-center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  color: var(--color-primary);
  background:
    linear-gradient(145deg, rgba(59, 130, 246, 0.18), rgba(16, 185, 129, 0.08));
  border: 1px solid rgba(148, 163, 184, 0.18);
}

.card-icon svg {
  width: 18px;
  height: 18px;
}

.card-info {
  @apply flex-1 min-w-0;
}

.card-name {
  @apply text-sm font-semibold;
  color: var(--color-text);
}

.card-description {
  @apply text-xs mt-1;
  color: var(--color-text-secondary);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-actions {
  @apply absolute top-2 right-2 flex space-x-1 opacity-0 transition-opacity;
}

.card-item:hover .card-actions {
  opacity: 1;
}

.action-btn {
  @apply p-1.5 rounded transition-colors;
  background-color: var(--color-surface);
  color: var(--color-text-secondary);
}

.action-btn:hover {
  background-color: var(--color-primary);
  color: white;
}





.sidebar-footer {
  @apply p-4 border-t;
  border-color: var(--color-surface);
}

.stats {
  @apply flex justify-between text-xs;
  color: var(--color-text-secondary);
}

/* 空状态样式已移至 EmptyState 组件 */
</style>
