<template>
  <div class="dashboard" :class="{ 'dashboard-fullscreen': isFullscreen }">
    <!-- 工具栏 -->
    <Toolbar
      v-model:title="dashboardTitle"
      :show-search="false"
      :sidebar-visible="sidebarVisible"
      @sidebar-toggle="toggleSidebar"
      @fullscreen-toggle="handleFullscreenToggle"
      @save-layout="handleSaveLayout"
      @load-layout="handleLoadLayout"
      @export-dashboard="handleExportDashboard"
      @import-dashboard="handleImportDashboard"
      @clear-all="handleClearAll"
    />

    <!-- 侧边栏 - 浮动覆盖层 -->
    <Sidebar
      :default-collapsed="!sidebarVisible"
      :is-dragging="isDragging"
      @card-add="handleCardAdd"
      @card-preview="handleCardPreview"
      @drag-start="handleDragStart"
      @drag-end="handleDragEnd"
      @close="toggleSidebar"
    />

    <div class="dashboard-body">
      <!-- 主内容区域 - 全屏布局 -->
      <div
        class="dashboard-main custom-scrollbar"
        :class="{ 'dragging': isDragging }"
        @drop="handleDrop"
        @dragover="handleDragOver"
        @dragenter="handleDragEnter"
        @dragleave="handleDragLeave"
      >
        <GridLayout
          ref="gridLayoutRef"
          :col-num="gridConfig.colNum"
          :row-height="gridConfig.rowHeight"
          :is-draggable="gridConfig.isDraggable"
          :is-resizable="gridConfig.isResizable"
          :margin="gridConfig.margin"
          :responsive="gridConfig.responsive"
          :show-item-toolbar="gridConfig.showItemToolbar"
          :drag-placeholder="dragPlaceholder"
          @layout-updated="handleLayoutUpdated"
          @item-added="handleItemAdded"
          @item-removed="handleItemRemoved"
          @item-configured="handleItemConfigured"
          @breakpoint-changed="handleBreakpointChanged"
        />

        <!-- 拖拽占位符 -->
        <div
          v-if="isDragging && dragPlaceholder"
          class="drag-placeholder"
          :style="getPlaceholderStyle()"
        >
          <div class="placeholder-content">
            <div class="placeholder-icon">{{ dragCard?.icon }}</div>
            <div class="placeholder-text">{{ dragCard?.name }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 卡片预览模态框 -->
    <div v-if="previewCard" class="preview-modal" @click="closePreview">
      <div class="preview-content" @click.stop>
        <div class="preview-header">
          <h3 class="preview-title">{{ previewCard.name }}</h3>
          <button @click="closePreview" class="preview-close">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div class="preview-body custom-scrollbar">
          <component
            :is="previewCard.component"
            v-bind="previewCard.defaultProps"
          />
        </div>
        <div class="preview-footer">
          <button @click="addPreviewCard" class="preview-add-btn">
            添加到看板
          </button>
        </div>
      </div>
    </div>

    <!-- 配置模态框 -->
    <div v-if="configCard" class="config-modal" @click="closeConfig">
      <div class="config-content" @click.stop>
        <div class="config-header">
          <h3 class="config-title">配置 {{ configCard.config.name }}</h3>
          <button @click="closeConfig" class="config-close">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div class="config-body custom-scrollbar">
          <!-- 这里可以添加动态配置表单 -->
          <p class="text-center text-gray-500">配置功能开发中...</p>
        </div>
        <div class="config-footer">
          <button @click="closeConfig" class="config-cancel-btn">
            取消
          </button>
          <button @click="saveConfig" class="config-save-btn">
            保存
          </button>
        </div>
      </div>
    </div>



    <!-- 通知消息 -->
    <div v-if="notification" class="notification" :class="`notification-${notification.type}`">
      <div class="notification-content">
        <svg v-if="notification.type === 'success'" class="notification-icon w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
        </svg>
        <svg v-else-if="notification.type === 'error'" class="notification-icon w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
        </svg>
        <span class="notification-message">{{ notification.message }}</span>
      </div>
      <button @click="closeNotification" class="notification-close">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- 底部横幅 -->
    <BottomBanner />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useCardStore } from '@/stores/card'
import { useThemeStore } from '@/stores/theme'
import { useAuthStore } from '@/stores/auth'
import { layoutPersistence } from '@/services/layoutPersistence'
import Toolbar from '@/components/layout/Toolbar.vue'
import Sidebar from '@/components/layout/Sidebar.vue'
import GridLayout from '@/components/layout/GridLayout.vue'
import BottomBanner from '@/components/layout/BottomBanner.vue'
import type { CardConfig, CardInstance, LayoutItem } from '@/types'

// Router and Stores
const router = useRouter()
const cardStore = useCardStore()
const themeStore = useThemeStore()
const authStore = useAuthStore()

// 响应式数据
const defaultDashboardTitle = import.meta.env.VITE_APP_TITLE || '数字看板系统'
const dashboardTitle = ref(defaultDashboardTitle)
const sidebarVisible = ref(false) // 默认隐藏侧边栏
const sidebarCollapsed = ref(false)
const isFullscreen = ref(false)

// 模态框状态
const previewCard = ref<CardConfig | null>(null)
const configCard = ref<CardInstance | null>(null)

// 拖拽状态
const isDragging = ref(false)
const dragCard = ref<CardConfig | null>(null)
const mousePosition = ref({ x: 0, y: 0 })
const dragPlaceholder = ref<{ x: number, y: number, w: number, h: number } | null>(null)

// 通知状态
const notification = ref<{
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
} | null>(null)

// 网格配置
const gridConfig = reactive({
  colNum: 14, // 调整为14列，增加列宽约10px
  rowHeight: 90, // 进一步增加行高
  isDraggable: true,
  isResizable: true,
  margin: [10, 10] as [number, number],
  responsive: true,
  showItemToolbar: true
})

// 引用
const gridLayoutRef = ref<InstanceType<typeof GridLayout>>()

// 计算属性
const activeCardsCount = computed(() => cardStore.cardCount)

// 事件处理

const toggleSidebar = () => {
  sidebarVisible.value = !sidebarVisible.value
}

const handleFullscreenToggle = () => {
  isFullscreen.value = !isFullscreen.value
}

const handleCardAdd = (cardType: string, position?: { x: number; y: number }) => {
  try {
    const instanceId = cardStore.addCard(cardType, position)
    if (instanceId) {
      // 获取卡片配置信息用于显示通知
      const cardConfig = cardStore.getCardConfig(cardType)
      const cardName = cardConfig?.name || '未知卡片'
      showNotification('success', `已添加 ${cardName} 到看板`)
    }
  } catch (error) {
    showNotification('error', '添加卡片失败')
    console.error('Failed to add card:', error)
  }
}

const handleCardPreview = (card: CardConfig) => {
  previewCard.value = card
}

const handleDragStart = (card: CardConfig) => {
  isDragging.value = true
  dragCard.value = card

  // 监听全局鼠标移动事件
  document.addEventListener('dragover', updateMousePosition)
}

const handleDragEnd = () => {
  isDragging.value = false
  dragCard.value = null
  dragPlaceholder.value = null

  // 移除全局事件监听
  document.removeEventListener('dragover', updateMousePosition)
}

// 更新鼠标位置
const updateMousePosition = (event: DragEvent) => {
  mousePosition.value = {
    x: event.clientX,
    y: event.clientY
  }
}

const handleDrop = (event: DragEvent) => {
  event.preventDefault()

  try {
    const data = event.dataTransfer?.getData('application/json')
    if (data) {
      const { type, cardId } = JSON.parse(data)
      if (type === 'card' && dragPlaceholder.value) {
        // 使用占位符位置
        const position = {
          x: dragPlaceholder.value.x,
          y: dragPlaceholder.value.y
        }

        handleCardAdd(cardId, position)
      }
    }
  } catch (error) {
    console.error('Drop error:', error)
  }

  handleDragEnd()
}

const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
  event.dataTransfer!.dropEffect = 'copy'



  if (isDragging.value && dragCard.value) {
    updateDragPlaceholder(event)
  }
}

const handleDragEnter = (event: DragEvent) => {
  event.preventDefault()
}

const handleDragLeave = (event: DragEvent) => {
  // 检查是否真的离开了拖拽区域
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  const isOutside = event.clientX < rect.left ||
                   event.clientX > rect.right ||
                   event.clientY < rect.top ||
                   event.clientY > rect.bottom

  if (isOutside) {
    dragPlaceholder.value = null
  }
}

// 更新拖拽占位符位置
const updateDragPlaceholder = (event: DragEvent) => {
  if (!dragCard.value) return

  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  const relativeX = event.clientX - rect.left
  const relativeY = event.clientY - rect.top

  // 计算网格位置
  const colWidth = rect.width / gridConfig.colNum
  const x = Math.floor(relativeX / colWidth)
  const y = Math.floor(relativeY / gridConfig.rowHeight)

  // 确保位置在有效范围内
  const validX = Math.max(0, Math.min(x, gridConfig.colNum - dragCard.value.defaultSize.w))
  const validY = Math.max(0, y)

  dragPlaceholder.value = {
    x: validX,
    y: validY,
    w: dragCard.value.defaultSize.w,
    h: dragCard.value.defaultSize.h
  }
}

// 获取占位符样式
const getPlaceholderStyle = () => {
  if (!dragPlaceholder.value) return {}

  const colWidth = 100 / gridConfig.colNum
  const left = dragPlaceholder.value.x * colWidth
  const width = dragPlaceholder.value.w * colWidth
  const top = dragPlaceholder.value.y * (gridConfig.rowHeight + gridConfig.margin[1])
  const height = dragPlaceholder.value.h * gridConfig.rowHeight + (dragPlaceholder.value.h - 1) * gridConfig.margin[1]

  return {
    position: 'absolute',
    left: `${left}%`,
    top: `${top}px`,
    width: `${width}%`,
    height: `${height}px`,
    zIndex: 1000,
    pointerEvents: 'none'
  }
}

const handleLayoutUpdated = async (layout: LayoutItem[]) => {
  // 布局更新时自动保存到用户配置
  if (authStore.user) {
    try {
      // 🔧 优化：只保存当前实际存在的卡片布局
      const currentLayout = cardStore.activeCardsList.map(card => ({
        i: card.id,
        x: card.position?.x || 0,
        y: card.position?.y || 0,
        w: card.size?.w || card.config.defaultSize.w,
        h: card.size?.h || card.config.defaultSize.h,
        minW: card.config.minSize?.w || 1,
        minH: card.config.minSize?.h || 1,
        maxW: card.config.maxSize?.w,
        maxH: card.config.maxSize?.h,
        static: card.locked || false,
        isDraggable: card.config.resizable !== false,
        isResizable: card.config.resizable !== false
      }))

      await layoutPersistence.saveUserLayout(
        authStore.user.id,
        authStore.user.userName || authStore.user.name,
        currentLayout
      )
    } catch (error) {
      console.error('自动保存布局失败:', error)
    }
  }
}

const handleItemAdded = (item: LayoutItem) => {
  // 处理新增项目（移除调试日志）
}

const handleItemRemoved = async (itemId: string) => {
  console.log('Item removed:', itemId)
  showNotification('info', '卡片已删除')

  // 🔧 卡片删除后自动保存布局
  if (authStore.user) {
    try {
      // 获取删除后的当前布局
      const currentLayout = cardStore.activeCardsList.map(card => ({
        i: card.id,
        x: card.position?.x || 0,
        y: card.position?.y || 0,
        w: card.size?.w || card.config.defaultSize.w,
        h: card.size?.h || card.config.defaultSize.h,
        minW: card.config.minSize?.w || 1,
        minH: card.config.minSize?.h || 1,
        maxW: card.config.maxSize?.w,
        maxH: card.config.maxSize?.h,
        static: card.locked || false,
        isDraggable: card.config.resizable !== false,
        isResizable: card.config.resizable !== false
      }))

      await layoutPersistence.saveUserLayout(
        authStore.user.id,
        authStore.user.userName || authStore.user.name,
        currentLayout
        // 默认silent=true，不显示日志
      )
    } catch (error) {
      console.error('删除卡片后保存布局失败:', error)
    }
  }
}

const handleItemConfigured = (itemId: string) => {
  const card = cardStore.getCard(itemId)
  if (card) {
    configCard.value = card
  }
}

const handleBreakpointChanged = (newBreakpoint: string, layout: LayoutItem[]) => {
  console.log('Breakpoint changed:', newBreakpoint, layout)
}

// 布局操作
const handleSaveLayout = async () => {
  if (!authStore.user) {
    showNotification('error', '用户未登录，无法保存布局')
    return
  }

  try {
    // 从cardStore获取当前布局并转换为LayoutItem格式
    const currentLayout = cardStore.activeCardsList.map(card => ({
      i: card.id,
      x: card.position?.x || 0,
      y: card.position?.y || 0,
      w: card.size?.w || card.config.defaultSize.w,
      h: card.size?.h || card.config.defaultSize.h,
      minW: card.config.minSize?.w || 1,
      minH: card.config.minSize?.h || 1,
      maxW: card.config.maxSize?.w,
      maxH: card.config.maxSize?.h,
      static: card.locked || false,
      isDraggable: card.config.resizable !== false,
      isResizable: card.config.resizable !== false
    }))

    await layoutPersistence.saveUserLayout(
      authStore.user.id,
      authStore.user.userName || authStore.user.name,
      currentLayout,
      false // 手动保存，显示日志
    )
    showNotification('success', '布局已保存')
  } catch (error) {
    showNotification('error', '保存布局失败')
    console.error('Save layout error:', error)
  }
}

const handleLoadLayout = async () => {
  if (!authStore.user) {
    showNotification('error', '用户未登录，无法加载布局')
    return
  }

  try {
    const savedLayout = await layoutPersistence.restoreUserLayout(
      authStore.user.id,
      authStore.user.userName || authStore.user.name
    )

    if (savedLayout && savedLayout.length > 0) {
      // 清空当前卡片
      cardStore.clearAllCards()

      // 根据保存的布局重新添加卡片
      for (const layoutItem of savedLayout) {
        try {
          // 🔧 修复：正确提取卡片配置ID
          const cardConfigId = layoutItem.i.replace(/-\d+$/, '')

          const instanceId = cardStore.addCard(cardConfigId, {
            x: layoutItem.x,
            y: layoutItem.y
          })

          // 更新卡片大小
          if (instanceId) {
            cardStore.updateCardSize(instanceId, {
              w: layoutItem.w,
              h: layoutItem.h
            })
          }
        } catch (error) {
          console.warn(`⚠️ 跳过无效卡片: ${layoutItem.i}`, error)
        }
      }

      showNotification('success', '布局已加载')
    } else {
      showNotification('warning', '没有找到保存的布局')
    }
  } catch (error) {
    showNotification('error', '加载布局失败')
    console.error('Load layout error:', error)
  }
}

const handleExportDashboard = () => {
  try {
    const data = {
      layout: cardStore.exportLayout(),
      theme: themeStore.currentTheme,
      config: gridConfig,
      timestamp: new Date().toISOString()
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `dashboard-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    
    showNotification('success', '看板已导出')
  } catch (error) {
    showNotification('error', '导出失败')
    console.error('Export error:', error)
  }
}

const handleImportDashboard = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.onchange = (event) => {
    const file = (event.target as HTMLInputElement).files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string)
          if (data.layout) {
            cardStore.importLayout(data.layout)
          }
          if (data.theme) {
            themeStore.setTheme(data.theme)
          }
          showNotification('success', '看板已导入')
        } catch (error) {
          showNotification('error', '导入失败：文件格式错误')
          console.error('Import error:', error)
        }
      }
      reader.readAsText(file)
    }
  }
  input.click()
}

const handleClearAll = async () => {
  cardStore.clearAll()

  // 同时清理用户的布局配置
  if (authStore.user) {
    try {
      await layoutPersistence.clearUserLayout(authStore.user.id)
      console.log('🧹 用户布局配置已清理')
    } catch (error) {
      console.error('清理用户布局配置失败:', error)
    }
  }

  showNotification('info', '看板已清空')
}

// 模态框操作
const closePreview = () => {
  previewCard.value = null
}

const addPreviewCard = () => {
  if (previewCard.value) {
    handleCardAdd(previewCard.value.id)
    closePreview()
  }
}

const closeConfig = () => {
  configCard.value = null
}

const saveConfig = () => {
  // 保存配置逻辑
  closeConfig()
  showNotification('success', '配置已保存')
}

// 通知操作
const showNotification = (type: 'success' | 'error' | 'warning' | 'info', message: string) => {
  notification.value = { type, message }
  setTimeout(() => {
    notification.value = null
  }, 3000)
}

const closeNotification = () => {
  notification.value = null
}

// 生命周期
onMounted(async () => {
  console.log('Dashboard mounted')

  // 初始化标题（本地优先，环境变量次之）
  const savedTitle = localStorage.getItem('dashboard:title')
  if (savedTitle && savedTitle.length > 0) {
    dashboardTitle.value = savedTitle
  }

  // 检查认证状态
  if (!(await authStore.restoreFromStorage())) {
    router.push('/login')
    return
  }

  // 初始化主题
  themeStore.loadFromLocalStorage()

  // 🆕 自动恢复用户布局
  if (authStore.user) {
    try {
      const savedLayout = await layoutPersistence.restoreUserLayout(
        authStore.user.id,
        authStore.user.userName || authStore.user.name
      )

      if (savedLayout && savedLayout.length > 0) {
        // 清空当前卡片
        cardStore.clearAllCards()

        // 根据保存的布局重新添加卡片
        let restoredCount = 0
        for (const layoutItem of savedLayout) {
          try {
            // 🔧 修复：正确提取卡片配置ID
            // 从 "inventory-alarm-card-1703000000000" 提取 "inventory-alarm-card"
            const cardConfigId = layoutItem.i.replace(/-\d+$/, '')

            const instanceId = cardStore.addCard(cardConfigId, {
              x: layoutItem.x,
              y: layoutItem.y
            })

            if (instanceId) {
              cardStore.updateCardSize(instanceId, {
                w: layoutItem.w,
                h: layoutItem.h
              })
              restoredCount++
            }
          } catch (error) {
            console.warn(`⚠️ 跳过无效卡片: ${layoutItem.i}`)
            // 继续处理其他卡片，不中断整个恢复过程
          }
        }

        if (restoredCount > 0) {
          console.log(`📂 已恢复 ${restoredCount} 个卡片`)
        }
      }
    } catch (error) {
      console.error('❌ 恢复用户布局失败:', error)
    }
  }
})

onUnmounted(() => {
  console.log('Dashboard unmounted')
})

// 持久化自定义标题
watch(dashboardTitle, (newTitle) => {
  try {
    localStorage.setItem('dashboard:title', newTitle || '')
  } catch (e) {
    console.warn('标题持久化失败', e)
  }
})

// 🆕 监听用户变化，自动恢复对应的布局
watch(
  () => authStore.user?.id,
  async (newUserId, oldUserId) => {
    if (newUserId && newUserId !== oldUserId) {
      console.log(`🔄 用户切换: ${oldUserId} → ${newUserId}`)

      try {
        const savedLayout = await layoutPersistence.restoreUserLayout(
          newUserId,
          authStore.user?.userName || authStore.user?.name
        )

        if (savedLayout && savedLayout.length > 0) {
          // 清空当前卡片
          cardStore.clearAllCards()

          // 根据保存的布局重新添加卡片
          let restoredCount = 0
          for (const layoutItem of savedLayout) {
            try {
              // 🔧 修复：正确提取卡片配置ID
              const cardConfigId = layoutItem.i.replace(/-\d+$/, '')

              const instanceId = cardStore.addCard(cardConfigId, {
                x: layoutItem.x,
                y: layoutItem.y
              })

              if (instanceId) {
                cardStore.updateCardSize(instanceId, {
                  w: layoutItem.w,
                  h: layoutItem.h
                })
                restoredCount++
              }
            } catch (error) {
              console.warn(`⚠️ 跳过无效卡片: ${layoutItem.i}`)
            }
          }

          if (restoredCount > 0) {
            console.log(`🔄 用户切换 - 已恢复 ${restoredCount} 个卡片`)
          }
        }
      } catch (error) {
        console.error('❌ 自动恢复用户布局失败:', error)
      }
    }
  },
  { immediate: false }
)
</script>

<style scoped>
.dashboard {
  @apply flex flex-col h-screen;
  background-color: var(--color-background);
}

.dashboard-fullscreen {
  @apply fixed inset-0 z-50;
}

.dashboard-body {
  @apply flex-1 overflow-hidden;
  /* 移除flex布局，让主内容区域占满全屏 */
  /* 为底部横幅留出空间 */
  padding-bottom: 48px;
}

.dashboard-main {
  @apply w-full h-full p-4 overflow-auto;
  background-color: var(--color-background);
  /* 主内容区域占满整个dashboard-body */
  position: relative;
  z-index: 1; /* 确保在侧边栏下方，但能接收穿透的事件 */
}

/* 拖拽状态下，确保主画布能接收事件 */
.dashboard-main.dragging {
  pointer-events: auto;
}

/* 模态框样式 */
.preview-modal,
.config-modal {
  @apply fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50;
}

.preview-content,
.config-content {
  @apply bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden;
  background-color: var(--color-surface);
}

.preview-header,
.config-header {
  @apply flex items-center justify-between p-6 border-b;
  border-color: var(--color-surface);
}

.preview-title,
.config-title {
  @apply text-xl font-semibold;
  color: var(--color-text);
}

.preview-close,
.config-close {
  @apply p-2 rounded-lg transition-colors;
  color: var(--color-text-secondary);
}

.preview-close:hover,
.config-close:hover {
  background-color: var(--color-danger);
  color: white;
}

.preview-body,
.config-body {
  @apply p-6 overflow-auto;
  max-height: 60vh;
}

.preview-footer,
.config-footer {
  @apply flex justify-end space-x-3 p-6 border-t;
  border-color: var(--color-surface);
}

.preview-add-btn,
.config-save-btn {
  @apply px-4 py-2 rounded-lg font-medium transition-colors;
  background-color: var(--color-primary);
  color: white;
}

.config-cancel-btn {
  @apply px-4 py-2 rounded-lg font-medium transition-colors;
  color: var(--color-text-secondary);
}

.config-cancel-btn:hover {
  background-color: var(--color-surface);
}



/* 通知样式 */
.notification {
  @apply fixed top-4 right-4 flex items-center space-x-3 px-4 py-3 rounded-lg shadow-lg z-50 transition-all duration-300;
}

.notification-success {
  background-color: var(--color-success);
  color: white;
}

.notification-error {
  background-color: var(--color-danger);
  color: white;
}

.notification-warning {
  background-color: var(--color-warning);
  color: white;
}

.notification-info {
  background-color: var(--color-primary);
  color: white;
}

.notification-content {
  @apply flex items-center space-x-2;
}

.notification-icon {
  @apply flex-shrink-0;
}

.notification-message {
  @apply font-medium;
}

.notification-close {
  @apply p-1 rounded transition-colors;
}

.notification-close:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

/* 拖拽占位符样式 */
.drag-placeholder {
  @apply border-2 border-dashed rounded-lg transition-all duration-200;
  border-color: var(--color-primary);
  background-color: rgba(var(--color-primary-rgb), 0.1);
  backdrop-filter: blur(4px);
}

.placeholder-content {
  @apply flex flex-col items-center justify-center h-full text-center p-4;
}

.placeholder-icon {
  @apply text-2xl mb-2 opacity-70;
  color: var(--color-primary);
}

.placeholder-text {
  @apply text-sm font-medium opacity-70;
  color: var(--color-primary);
}

/* 拖拽时的主内容区域样式 */
.dashboard-main.dragging {
  @apply relative;
}

.dashboard-main.dragging::before {
  content: '';
  @apply absolute inset-0 bg-blue-50 bg-opacity-50 pointer-events-none z-10;
  border: 2px dashed var(--color-primary);
  border-radius: 8px;
}


</style>
