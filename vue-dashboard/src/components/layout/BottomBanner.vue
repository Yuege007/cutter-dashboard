<template>
  <div class="bottom-banner">
    <!-- 面板背景遮罩 - 独立层级 -->
    <Transition name="fade">
      <div
        v-if="showManagement"
        class="panel-backdrop"
        @click="closeManagement"
      ></div>
    </Transition>

    <!-- 管理面板 - 从横幅向上展开 -->
    <div class="management-panel" :class="{ 'panel-expanded': showManagement }">
      <!-- 面板内容 -->
      <div class="panel-content">
        <!-- 面板头部 -->
        <div class="panel-header">
          <h3 class="panel-title">消息管理</h3>
          <button @click="closeManagement" class="close-btn">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- 添加消息区域 -->
        <div class="add-message-section">
          <div class="input-group">
            <input
              v-model="newMessage"
              @keyup.enter="addMessage"
              type="text"
              placeholder="输入新的消息内容..."
              class="message-input"
              maxlength="200"
            />
            <button
              @click="addMessage"
              :disabled="!newMessage.trim()"
              class="add-btn"
            >
              添加
            </button>
          </div>
          <div class="input-hint">
            {{ newMessage.length }}/200 字符
          </div>
        </div>

        <!-- 消息列表 -->
        <div class="message-list">
          <div class="list-header">
            <span class="list-title">消息列表 ({{ messages.length }})</span>
            <button
              v-if="messages.length > 0"
              @click="clearAllMessages"
              class="clear-all-btn"
            >
              清空全部
            </button>
          </div>

          <div class="list-content">
            <div
              v-for="message in messages"
              :key="message.id"
              class="message-list-item"
            >
              <div class="message-content">
                <span class="message-text">{{ message.content }}</span>
                <span class="message-time">{{ formatTime(message.createdAt) }}</span>
              </div>
              <button
                @click="deleteMessage(message.id)"
                class="delete-btn"
                title="删除消息"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>

            <!-- 空状态 -->
            <div v-if="messages.length === 0" class="empty-state">
              <svg class="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p class="empty-text">暂无消息</p>
              <p class="empty-hint">添加一些消息来开始滚动显示</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 主横幅区域 -->
    <div class="banner-main" :class="{ 'banner-paused': isPaused }">
      <!-- 播放控制按钮 -->
      <button 
        @click="togglePlay" 
        class="control-btn"
        :title="isPaused ? '播放' : '暂停'"
      >
        <svg v-if="isPaused" class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" />
        </svg>
        <svg v-else class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
        </svg>
      </button>

      <!-- 分割线 -->
      <div class="divider"></div>

      <!-- 滚动内容区域 -->
      <div 
        class="scroll-container"
        @mouseenter="handleMouseEnter"
        @mouseleave="handleMouseLeave"
      >
        <div 
          class="scroll-content"
          :class="{ 'scroll-paused': isPaused || isHovered }"
          :style="scrollStyle"
          ref="scrollContentRef"
        >
          <span 
            v-for="(message, index) in displayMessages" 
            :key="`${message.id}-${index}`"
            class="message-item"
          >
            {{ message.content }}
          </span>
        </div>
      </div>

      <!-- 分割线 -->
      <div class="divider"></div>

      <!-- 管理按钮 -->
      <button 
        @click="toggleManagement" 
        class="control-btn"
        :class="{ 'active': showManagement }"
        title="管理消息"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
        </svg>
      </button>
    </div>



    <!-- 背景遮罩 - 独立于面板，点击关闭 -->
    <Transition name="fade">
      <div v-if="showManagement" class="panel-backdrop" @click="closeManagement"></div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'

// 消息接口定义
interface Message {
  id: string
  content: string
  createdAt: Date
  type?: 'system' | 'business' | 'user' | 'welcome'
}

// 响应式数据
const isPaused = ref(false)
const isHovered = ref(false)
const showManagement = ref(false)
const newMessage = ref('')
const scrollContentRef = ref<HTMLElement>()
const scrollPosition = ref(0)
const animationId = ref<number>()

// 消息数据
const messages = ref<Message[]>([
  {
    id: '1',
    content: '🎉 欢迎使用Vue数字看板系统！这是一个现代化的数据展示平台。',
    createdAt: new Date(),
    type: 'welcome'
  },
  {
    id: '2', 
    content: '📊 系统运行正常，所有服务状态良好。当前在线用户：156人。',
    createdAt: new Date(),
    type: 'system'
  },
  {
    id: '3',
    content: '⚠️ 库存预警：螺丝刀库存不足，当前库存：2个，建议及时补充。',
    createdAt: new Date(),
    type: 'business'
  },
  {
    id: '4',
    content: '📈 今日出入库统计：入库128件，出库56件，净增加72件物料。',
    createdAt: new Date(),
    type: 'business'
  },
  {
    id: '5',
    content: '🔧 系统将于今晚23:00-01:00进行维护升级，期间可能影响部分功能使用。',
    createdAt: new Date(),
    type: 'system'
  }
])

// 计算属性
const displayMessages = computed(() => {
  if (messages.value.length === 0) {
    return [{ id: 'empty', content: '暂无消息显示', createdAt: new Date() }]
  }
  // 为了无缝循环，复制消息数组
  return [...messages.value, ...messages.value]
})

const scrollStyle = computed(() => {
  return {
    transform: `translateX(-${scrollPosition.value}px)`,
    transition: isPaused.value || isHovered.value ? 'transform 0.3s ease' : 'none'
  }
})

// 方法
const togglePlay = () => {
  isPaused.value = !isPaused.value
  if (!isPaused.value) {
    startScrolling()
  } else {
    stopScrolling()
  }
}

const handleMouseEnter = () => {
  isHovered.value = true
}

const handleMouseLeave = () => {
  isHovered.value = false
}

const toggleManagement = () => {
  showManagement.value = !showManagement.value
}

const closeManagement = () => {
  showManagement.value = false
}

const addMessage = () => {
  const content = newMessage.value.trim()
  if (!content) return

  const message: Message = {
    id: Date.now().toString(),
    content,
    createdAt: new Date(),
    type: 'user'
  }

  messages.value.push(message)
  newMessage.value = ''
  saveToLocalStorage()
}

const deleteMessage = (id: string) => {
  const index = messages.value.findIndex(msg => msg.id === id)
  if (index > -1) {
    messages.value.splice(index, 1)
    saveToLocalStorage()
  }
}

const clearAllMessages = () => {
  if (confirm('确定要清空所有消息吗？')) {
    messages.value = []
    saveToLocalStorage()
  }
}

const formatTime = (date: Date) => {
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 滚动动画
const startScrolling = () => {
  if (animationId.value) {
    cancelAnimationFrame(animationId.value)
  }

  const scroll = () => {
    if (isPaused.value || isHovered.value) {
      animationId.value = requestAnimationFrame(scroll)
      return
    }

    scrollPosition.value += 1

    // 检查是否需要重置位置（无缝循环）
    if (scrollContentRef.value) {
      const contentWidth = scrollContentRef.value.scrollWidth / 2 // 因为内容重复了一次
      if (scrollPosition.value >= contentWidth) {
        scrollPosition.value = 0
      }
    }

    animationId.value = requestAnimationFrame(scroll)
  }

  animationId.value = requestAnimationFrame(scroll)
}

const stopScrolling = () => {
  if (animationId.value) {
    cancelAnimationFrame(animationId.value)
    animationId.value = undefined
  }
}

// 本地存储
const saveToLocalStorage = () => {
  const data = {
    messages: messages.value,
    isPaused: isPaused.value
  }
  localStorage.setItem('bottom-banner-data', JSON.stringify(data))
}

const loadFromLocalStorage = () => {
  try {
    const saved = localStorage.getItem('bottom-banner-data')
    if (saved) {
      const data = JSON.parse(saved)
      if (data.messages && Array.isArray(data.messages)) {
        messages.value = data.messages.map(msg => ({
          ...msg,
          createdAt: new Date(msg.createdAt)
        }))
      }
      if (typeof data.isPaused === 'boolean') {
        isPaused.value = data.isPaused
      }
    }
  } catch (error) {
    console.error('Failed to load banner data from localStorage:', error)
  }
}

// 生命周期
onMounted(() => {
  loadFromLocalStorage()
  nextTick(() => {
    if (!isPaused.value) {
      startScrolling()
    }
  })
})

onUnmounted(() => {
  stopScrolling()
  saveToLocalStorage()
})

// 监听消息变化，保存到本地存储
watch(messages, saveToLocalStorage, { deep: true })
watch(isPaused, saveToLocalStorage)
</script>

<style scoped>
/* 主横幅样式 */
.bottom-banner {
  @apply fixed bottom-0 left-0 right-0 z-30;
}

.banner-main {
  @apply flex items-center h-12 px-4;
  background: linear-gradient(135deg, #0066CC 0%, #004499 100%);
  color: white;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
}

.banner-paused {
  @apply opacity-90;
}

/* 控制按钮样式 */
.control-btn {
  @apply flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(4px);
}

.control-btn:hover {
  @apply scale-105;
  background: rgba(255, 255, 255, 0.2);
}

.control-btn:active {
  @apply scale-95;
}

.control-btn.active {
  background: rgba(255, 255, 255, 0.25);
}

/* 分割线样式 */
.divider {
  @apply w-px h-6 mx-3;
  background: rgba(255, 255, 255, 0.3);
}

/* 滚动容器样式 */
.scroll-container {
  @apply flex-1 overflow-hidden relative;
  height: 100%;
}

.scroll-content {
  @apply flex items-center h-full whitespace-nowrap;
  will-change: transform;
}

.scroll-paused {
  @apply transition-transform duration-300 ease-out;
}

.message-item {
  @apply inline-block px-8 text-sm font-medium;
  min-width: max-content;
}

.message-item:not(:last-child)::after {
  content: '•';
  @apply ml-8 opacity-60;
}

/* 面板背景遮罩 - 独立层级 */
.panel-backdrop {
  @apply fixed inset-0;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(4px);
  z-index: 35; /* 在面板下方，但在其他内容上方 */
}

/* 管理面板样式 - 从横幅向上展开 */
.management-panel {
  @apply fixed left-0 right-0;
  bottom: 0;
  z-index: 40; /* 在背景遮罩上方 */
  transition: transform 0.4s cubic-bezier(0.4, 0.0, 0.2, 1);
  transform: translateY(100%);
  pointer-events: none;
  padding: 0 16px 48px 16px; /* 统一的内边距，底部为横幅留空间 */
}

.management-panel.panel-expanded {
  transform: translateY(0);
  pointer-events: auto;
}

.panel-content {
  @apply rounded-t-xl flex flex-col;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  max-height: 60vh;
  min-height: 400px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-bottom: none;
  overflow: hidden;
  box-shadow:
    0 -10px 25px -5px rgba(0, 0, 0, 0.1),
    0 -4px 6px -2px rgba(0, 0, 0, 0.05);
  /* 自定义阴影，向上投射 */
}

/* 面板头部 */
.panel-header {
  @apply flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0;
}

.panel-title {
  @apply text-lg font-semibold text-gray-800;
}

.close-btn {
  @apply p-2 rounded-lg transition-colors text-gray-500 hover:text-gray-700 hover:bg-gray-100;
}

/* 添加消息区域 */
.add-message-section {
  @apply p-4 border-b border-gray-200 flex-shrink-0;
}

.input-group {
  @apply flex space-x-3;
}

.message-input {
  @apply flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent;
  background: rgba(255, 255, 255, 0.9);
}

.add-btn {
  @apply px-6 py-2 bg-blue-600 text-white rounded-lg font-medium transition-colors;
}

.add-btn:hover:not(:disabled) {
  @apply bg-blue-700;
}

.add-btn:disabled {
  @apply bg-gray-400 cursor-not-allowed;
}

.input-hint {
  @apply text-xs text-gray-500 mt-2;
}

/* 消息列表 */
.message-list {
  @apply flex flex-col flex-1 min-h-0;
}

.list-header {
  @apply flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0;
}

.list-title {
  @apply font-medium text-gray-800;
}

.clear-all-btn {
  @apply px-3 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors;
}

.list-content {
  @apply flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3;
  min-height: 0;
}

/* 消息列表项 */
.message-list-item {
  @apply flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors;
  min-height: 60px;
}

.message-content {
  @apply flex-1 min-w-0 overflow-hidden;
}

.message-text {
  @apply block text-sm text-gray-800 leading-relaxed;
  word-wrap: break-word;
  overflow-wrap: break-word;
  hyphens: auto;
  max-height: 3.6em; /* 约3行文字 */
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}

.message-time {
  @apply block text-xs text-gray-500 mt-1 flex-shrink-0;
}

.delete-btn {
  @apply p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0;
  margin-top: -4px; /* 微调对齐 */
}

/* 空状态 */
.empty-state {
  @apply flex flex-col items-center justify-center py-8 text-center;
}

.empty-icon {
  @apply w-12 h-12 text-gray-400 mb-3;
}

.empty-text {
  @apply text-gray-600 font-medium mb-1;
}

.empty-hint {
  @apply text-sm text-gray-500;
}

/* 动画效果 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 背景遮罩淡入淡出动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .management-panel {
    padding: 0 8px 48px 8px; /* 移动端减少内边距 */
  }

  .panel-content {
    max-height: 70vh;
    min-height: 350px;
  }

  .message-input {
    @apply text-sm;
  }

  .add-btn {
    @apply px-4 text-sm;
  }

  .message-item {
    @apply px-4 text-xs;
  }

  .message-item:not(:last-child)::after {
    @apply ml-4;
  }

  .message-list-item {
    @apply p-2;
    min-height: 50px;
  }

  .message-text {
    @apply text-xs;
    max-height: 2.8em; /* 移动端显示更少行数 */
    -webkit-line-clamp: 2;
  }

  .panel-header {
    @apply p-3;
  }

  .add-message-section {
    @apply p-3;
  }

  .list-header {
    @apply p-3;
  }

  .list-content {
    @apply p-3 space-y-2;
  }
}

/* 深色主题支持 - 使用主题系统 */
.theme-dark .panel-content,
.theme-tech .panel-content {
  background: var(--color-surface);
  border-color: rgba(255, 255, 255, 0.1);
  box-shadow:
    0 -10px 25px -5px rgba(0, 0, 0, 0.3),
    0 -4px 6px -2px rgba(0, 0, 0, 0.2);
}

.theme-dark .panel-title,
.theme-tech .panel-title {
  color: var(--color-text);
}

.theme-dark .message-input,
.theme-tech .message-input {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
  color: var(--color-text);
}

.theme-dark .message-list-item,
.theme-tech .message-list-item {
  background: rgba(255, 255, 255, 0.05);
}

.theme-dark .message-list-item:hover,
.theme-tech .message-list-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.theme-dark .message-text,
.theme-tech .message-text {
  color: var(--color-text);
}

.theme-dark .message-time,
.theme-tech .message-time {
  color: var(--color-text-secondary);
}

.theme-dark .delete-btn,
.theme-tech .delete-btn {
  color: var(--color-text-secondary);
}

.theme-dark .delete-btn:hover,
.theme-tech .delete-btn:hover {
  color: var(--color-danger);
  background: rgba(239, 68, 68, 0.15);
}

.theme-dark .list-title,
.theme-tech .list-title {
  color: var(--color-text);
}

.theme-dark .empty-text,
.theme-tech .empty-text {
  color: var(--color-text);
}

.theme-dark .empty-hint,
.theme-tech .empty-hint {
  color: var(--color-text-secondary);
}
</style>
