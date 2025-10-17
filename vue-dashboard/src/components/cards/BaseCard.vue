<template>
  <div
    class="apple-card"
    :class="[
      `card-${variant}`,
      `card-mode-${mode}`,
      { 'card-loading': loading },
      { 'card-error': hasError },
      { 'card-interactive': interactive },
      { 'card-locked': isLocked }
    ]"
    @click="handleClick"
  >
    <!-- 拖拽区域：包含卡片的主要内容 -->
    <div class="drag-zone">
    <!-- 卡片头部：标题 + 工具栏 -->
    <div class="card-header">
      <!-- 左侧：图标 + 标题 -->
      <div class="card-title-section">
        <div class="card-icon" v-if="icon">
          <component :is="icon" v-if="typeof icon === 'object'" />
          <span v-else>{{ icon }}</span>
        </div>
        <h3 class="card-title">{{ title }}</h3>
      </div>

      <!-- 右侧：工具栏 (hover时显示) -->
      <div class="card-toolbar" :class="{ 'toolbar-disabled': isDragging }">
        <slot name="actions" />

        <!-- 刷新按钮 -->
        <button
          v-if="shouldShowRefresh"
          @click.stop="handleRefresh"
          class="toolbar-btn"
          :disabled="loading"
          title="刷新数据"
        >
          <svg class="toolbar-icon" :class="{ 'animate-spin': loading }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>

        <!-- 设置按钮 -->
        <button
          v-if="shouldShowSettings"
          @click.stop="isDragging ? $event.preventDefault() : handleSettings()"
          class="toolbar-btn"
          :disabled="isDragging"
          title="卡片配置"
        >
          <svg class="toolbar-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>

        <!-- 锁定按钮 -->
        <button
          v-if="shouldShowLock"
          @click.stop="isDragging ? $event.preventDefault() : handleLock()"
          class="toolbar-btn"
          :class="{ 'toolbar-btn-active': isLocked }"
          :disabled="isDragging"
          :title="isLocked ? '解锁卡片' : '锁定卡片'"
        >
          <svg class="toolbar-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path v-if="isLocked" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
          </svg>
        </button>

        <!-- 删除按钮 -->
        <button
          v-if="shouldShowDelete"
          @click.stop="isDragging ? $event.preventDefault() : handleDelete()"
          class="toolbar-btn toolbar-btn-danger"
          :disabled="isDragging"
          title="删除卡片"
        >
          <svg class="toolbar-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>

    <!-- 卡片内容区域 -->
    <!-- 卡片内容区域 -->
    <div class="card-content">
      <!-- 尺寸错误状态 -->
      <div v-if="sizeError.hasError" class="card-state-overlay">
        <div class="state-icon state-warning">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <p class="state-message">{{ sizeError.message }}</p>
        <p class="state-hint">请拖拽调整卡片大小</p>
      </div>

      <!-- 加载状态 -->
      <div v-else-if="loading" class="card-state-overlay">
        <div class="state-icon state-loading">
          <div class="loading-spinner"></div>
        </div>
        <p class="state-message">{{ loadingText || '加载中...' }}</p>
      </div>

      <!-- 错误状态 -->
      <div v-else-if="hasError" class="card-state-overlay">
        <div class="state-icon state-error">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p class="state-message">{{ errorMessage || '加载失败' }}</p>
        <button
          v-if="showRetry"
          @click="handleRetry"
          class="state-retry-btn"
        >
          重试
        </button>
      </div>

      <!-- 正常内容 -->
      <div v-else class="card-body">
        <slot :mode="currentMode" :data="$attrs.data" />
      </div>
    </div>
    </div> <!-- 结束拖拽区域 -->

    <!-- 使用原生调整大小，移除自定义手柄 -->
  </div>
</template>

<script setup lang="ts">
import { computed, inject, ref, watch } from 'vue'
import type { CardMode } from '@/types'
import { detectCardMode, validateCardSize } from '@/utils/cardSizeManager'

export interface BaseCardProps {
  title?: string
  icon?: string | object
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger'
  mode?: CardMode
  loading?: boolean
  loadingText?: string
  hasError?: boolean
  errorMessage?: string
  showRefresh?: boolean
  showSettings?: boolean
  showLock?: boolean
  showDelete?: boolean
  showRetry?: boolean
  interactive?: boolean
  locked?: boolean
  isDragging?: boolean

  // 尺寸相关属性
  width?: number
  height?: number
  minWidth?: number
  minHeight?: number

  // 卡片实例ID，用于获取模式
  cardId?: string
}

const props = withDefaults(defineProps<BaseCardProps>(), {
  variant: 'default',
  mode: 'compact',
  loading: false,
  loadingText: '加载中...',
  hasError: false,
  errorMessage: '加载失败',
  showRefresh: true,
  showSettings: true,
  showLock: true,
  showDelete: true,
  showRetry: true,
  interactive: false,
  locked: false,
  isDragging: false
})

const emit = defineEmits<{
  click: [event: MouseEvent]
  refresh: []
  settings: []
  retry: []
  delete: []
  lock: [locked: boolean]
}>()

// 内部状态
const isLocked = ref(props.locked)

// 监听props.locked的变化
watch(() => props.locked, (newLocked) => {
  isLocked.value = newLocked
})

// 尺寸模式检测
const currentMode = computed((): CardMode => {
  if (props.mode) return props.mode
  const w = props.width || 2
  const h = props.height || 2
  return detectCardMode(w, h)
})

// 根据模式决定显示哪些按钮
const shouldShowRefresh = computed(() => props.showRefresh && currentMode.value !== 'mini')
const shouldShowSettings = computed(() => props.showSettings && currentMode.value !== 'mini')
const shouldShowLock = computed(() => props.showLock && currentMode.value !== 'mini')
const shouldShowDelete = computed(() => props.showDelete) // 删除按钮在所有模式下都显示

// 尺寸错误检测
const sizeError = computed(() => {
  const w = props.width || 2
  const h = props.height || 2
  const minW = props.minWidth || 1
  const minH = props.minHeight || 1

  return validateCardSize(w, h, minW, minH, props.title || '当前')
})

// 事件处理
const handleClick = (event: MouseEvent) => {
  if (props.interactive) {
    emit('click', event)
  }
}

const handleRefresh = () => {
  emit('refresh')
}

const handleSettings = () => {
  emit('settings')
}

const handleLock = () => {
  isLocked.value = !isLocked.value
  emit('lock', isLocked.value)
}

const handleDelete = () => {
  emit('delete')
}

const handleRetry = () => {
  emit('retry')
}

// 移除了自定义调整大小逻辑，使用vue-grid-layout原生功能
</script>

<style scoped>
/* Apple风格卡片基础样式 */
.apple-card {
  @apply relative w-full h-full flex flex-col;
  background-color: var(--color-surface);
  backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.1),
    0 1px 2px rgba(0, 0, 0, 0.06);
  transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display',
               'PingFang SC', 'Hiragino Sans GB', sans-serif;
  overflow: hidden;
  color: var(--color-text);
}

.apple-card:hover {
  transform: translateY(-2px);
  box-shadow:
    0 10px 25px rgba(0, 0, 0, 0.15),
    0 4px 10px rgba(0, 0, 0, 0.1);
}

/* 浅色主题特定样式 */
.theme-light .apple-card {
  background: rgba(255, 255, 255, 0.8);
  border-color: rgba(0, 0, 0, 0.1);
  color: var(--color-text);
}

.theme-light .apple-card:hover {
  box-shadow:
    0 10px 25px rgba(0, 0, 0, 0.15),
    0 4px 10px rgba(0, 0, 0, 0.1);
}

.apple-card:hover .card-toolbar {
  opacity: 1;
  transform: translateY(0);
}

/* 拖拽时禁用工具栏 */
.card-toolbar.toolbar-disabled {
  pointer-events: none;
  opacity: 0.3 !important;
  transform: translateY(0) !important;
}

.card-toolbar.toolbar-disabled .toolbar-btn {
  cursor: not-allowed;
  opacity: 0.5;
}

/* 拖拽区域样式 */
.drag-zone {
  @apply w-full h-full flex flex-col;
  cursor: move;
  /* 为调整大小区域让出空间，但保持左右对称 */
  padding: 0 20px 20px 20px; /* 上右下左：0 20px 20px 20px */
  box-sizing: border-box;
}

/* 卡片变体样式 */
.card-primary {
  background: rgba(0, 122, 255, 0.1);
  border-color: rgba(0, 122, 255, 0.2);
}

.card-success {
  background: rgba(48, 209, 88, 0.1);
  border-color: rgba(48, 209, 88, 0.2);
}

.card-warning {
  background: rgba(255, 159, 10, 0.1);
  border-color: rgba(255, 159, 10, 0.2);
}

.card-danger {
  background: rgba(255, 69, 58, 0.1);
  border-color: rgba(255, 69, 58, 0.2);
}

/* 卡片状态 */
.card-loading {
  opacity: 0.8;
  pointer-events: none;
}

.card-error {
  border-color: rgba(255, 69, 58, 0.3);
}

.card-interactive {
  cursor: pointer;
}

.card-interactive:active {
  transform: translateY(-1px) scale(0.98);
}

.card-locked {
  opacity: 0.9;
}

/* 卡片头部样式 */
.card-header {
  @apply flex items-center justify-between pt-4 pb-2 flex-shrink-0;
  min-height: 44px;
  /* 现在drag-zone已经有20px的左右内边距，所以这里不需要额外的内边距 */
  padding-left: 0;
  padding-right: 0;
}

.card-title-section {
  @apply flex items-center space-x-2 flex-1 min-w-0;
}

.card-icon {
  @apply flex items-center justify-center w-5 h-5 flex-shrink-0;
  font-size: 20px;
  color: #007aff;
}

.card-title {
  @apply text-base font-semibold truncate;
  color: #1d1d1f;
  font-weight: 600;
  line-height: 1.2;
}

/* 工具栏样式 */
.card-toolbar {
  @apply flex items-center space-x-1 flex-shrink-0;
  opacity: 0;
  transform: translateY(-4px);
  transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
}

.toolbar-btn {
  @apply flex items-center justify-center w-6 h-6 rounded transition-all duration-200;
  background: transparent;
  border: none;
  cursor: pointer;
  color: #86868b;
}

.toolbar-btn:hover {
  color: #007aff;
  background: rgba(0, 122, 255, 0.1);
  transform: scale(1.1);
}

.toolbar-btn:active {
  transform: scale(0.95);
}

.toolbar-btn-active {
  color: #007aff;
  background: rgba(0, 122, 255, 0.15);
}

.toolbar-btn-danger:hover {
  color: #ff453a;
  background: rgba(255, 69, 58, 0.1);
}

.toolbar-icon {
  width: 16px;
  height: 16px;
  stroke-width: 1.5;
}

/* 卡片内容区域 */
.card-content {
  @apply flex-1 relative min-h-0;
  padding: 0 ;
}

.card-body {
  @apply w-full h-full;
}

/* 状态覆盖层 */
.card-state-overlay {
  @apply absolute inset-0 flex flex-col items-center justify-center p-4 text-center;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  margin: 8px;
}

.state-icon {
  @apply flex items-center justify-center w-12 h-12 rounded-full mb-3;
}

.state-warning {
  background: rgba(255, 159, 10, 0.1);
  color: #ff9f0a;
}

.state-error {
  background: rgba(255, 69, 58, 0.1);
  color: #ff453a;
}

.state-loading {
  background: rgba(0, 122, 255, 0.1);
  color: #007aff;
}

.state-message {
  @apply text-sm font-medium mb-1;
  color: #1d1d1f;
}

.state-hint {
  @apply text-xs;
  color: #86868b;
}

.state-retry-btn {
  @apply mt-3 px-4 py-2 bg-blue-500 text-white text-sm rounded-lg transition-colors;
}

.state-retry-btn:hover {
  @apply bg-blue-600;
}

/* 加载动画 */
.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(0, 122, 255, 0.2);
  border-top: 2px solid #007aff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
/* 深色主题支持 - 使用主题系统 */
.theme-dark .apple-card,
.theme-tech .apple-card {
  background: var(--color-surface);
  border-color: rgba(255, 255, 255, 0.1);
  color: var(--color-text);
}

.theme-dark .apple-card:hover,
.theme-tech .apple-card:hover {
  box-shadow:
    0 10px 25px rgba(0, 0, 0, 0.3),
    0 4px 10px rgba(0, 0, 0, 0.2);
}

.theme-dark .card-title,
.theme-tech .card-title {
  color: var(--color-text);
}

.theme-dark .card-icon,
.theme-tech .card-icon {
  color: var(--color-primary);
}

.theme-dark .toolbar-btn,
.theme-tech .toolbar-btn {
  color: var(--color-text-secondary);
}

.theme-dark .toolbar-btn:hover,
.theme-tech .toolbar-btn:hover {
  color: var(--color-primary);
  background: rgba(59, 130, 246, 0.15);
}

.theme-dark .toolbar-btn-danger:hover,
.theme-tech .toolbar-btn-danger:hover {
  color: var(--color-danger);
  background: rgba(239, 68, 68, 0.15);
}

.theme-dark .card-state-overlay,
.theme-tech .card-state-overlay {
  background: var(--color-surface);
  opacity: 0.95;
}

.theme-dark .state-message,
.theme-tech .state-message {
  color: var(--color-text);
}

.theme-dark .state-hint,
.theme-tech .state-hint {
  color: var(--color-text-secondary);
}

.theme-dark .state-warning,
.theme-tech .state-warning {
  background: rgba(245, 158, 11, 0.15);
  color: var(--color-warning);
}

.theme-dark .state-error,
.theme-tech .state-error {
  background: rgba(239, 68, 68, 0.15);
  color: var(--color-danger);
}

.theme-dark .state-loading,
.theme-tech .state-loading {
  background: rgba(59, 130, 246, 0.15);
  color: var(--color-primary);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .card-header {
    @apply px-3 pt-3 pb-2;
  }

  .card-content {
    padding: 0;
  }

  .card-title {
    @apply text-sm;
  }

  .toolbar-btn {
    @apply w-8 h-8;
  }

  .toolbar-icon {
    width: 14px;
    height: 14px;
  }
}

/* 移除了自定义调整大小样式，使用vue-grid-layout原生样式 */
</style>
