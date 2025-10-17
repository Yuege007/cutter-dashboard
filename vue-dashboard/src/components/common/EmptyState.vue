<template>
  <div class="empty-state" :class="[sizeClass, customClass]">
    <!-- 图标区域 -->
    <div class="empty-icon" :class="iconSizeClass">
      <!-- 自定义图标组件 -->
      <component :is="iconComponent" v-if="iconComponent" />
      <!-- SVG图标 -->
      <svg v-else-if="svgIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <component :is="svgIcon" />
      </svg>
      <!-- Emoji图标 -->
      <span v-else-if="icon" class="empty-emoji">{{ icon }}</span>
      <!-- 默认图标 -->
      <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <circle cx="12" cy="12" r="10"/>
        <path d="8 14s1.5 2 4 2 4-2 4-2"/>
        <line x1="9" y1="9" x2="9.01" y2="9"/>
        <line x1="15" y1="9" x2="15.01" y2="9"/>
      </svg>
    </div>

    <!-- 标题 -->
    <h3 v-if="title" class="empty-title">{{ title }}</h3>

    <!-- 描述文字 -->
    <p class="empty-description">{{ description }}</p>

    <!-- 操作按钮 -->
    <div v-if="actions.length > 0" class="empty-actions">
      <button 
        v-for="action in actions"
        :key="action.key"
        :class="['empty-action-btn', action.type || 'default']"
        :disabled="action.disabled"
        @click="handleActionClick(action)"
      >
        <span v-if="action.icon" class="action-icon">{{ action.icon }}</span>
        {{ action.label }}
      </button>
    </div>

    <!-- 自定义插槽 -->
    <div v-if="$slots.default" class="empty-custom">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { EmptyAction, EmptyStateProps } from '@/types'

const props = withDefaults(defineProps<EmptyStateProps>(), {
  size: 'md',
  actions: () => []
})

const emit = defineEmits<{
  action: [action: EmptyAction]
}>()

// 计算尺寸相关的CSS类
const sizeClass = computed(() => `empty-state-${props.size}`)
const iconSizeClass = computed(() => `empty-icon-${props.size}`)

// 处理操作按钮点击
const handleActionClick = (action: EmptyAction) => {
  if (!action.disabled) {
    action.handler()
    emit('action', action)
  }
}
</script>

<style scoped>
/* 基础空状态样式 */
.empty-state {
  @apply flex flex-col items-center justify-center text-center;
  color: var(--color-text-secondary);
}

/* 尺寸变体 */
.empty-state-sm {
  @apply py-4 px-4;
}

.empty-state-md {
  @apply py-8 px-6;
}

.empty-state-lg {
  @apply py-12 px-8;
}

/* 图标样式 */
.empty-icon {
  @apply mb-3 flex-shrink-0 flex items-center justify-center;
  opacity: 0.6;
  color: var(--color-text-secondary);
}

.empty-icon-sm {
  @apply w-8 h-8;
}

.empty-icon-md {
  @apply w-12 h-12;
}

.empty-icon-lg {
  @apply w-16 h-16;
}

.empty-emoji {
  @apply text-2xl;
}

.empty-icon svg {
  @apply w-full h-full;
  stroke-width: 1.5;
}

/* 标题样式 */
.empty-title {
  @apply text-lg font-medium mb-2;
  color: var(--color-text-primary);
}

/* 描述样式 */
.empty-description {
  @apply text-sm leading-relaxed mb-4 max-w-xs;
  color: var(--color-text-secondary);
}

/* 操作按钮样式 */
.empty-actions {
  @apply flex flex-wrap gap-2 justify-center;
}

.empty-action-btn {
  @apply px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200;
  @apply flex items-center gap-1;
}

.empty-action-btn.default {
  @apply bg-gray-100 text-gray-700 hover:bg-gray-200;
}

.empty-action-btn.primary {
  background: var(--color-primary);
  color: white;
}

.empty-action-btn.primary:hover {
  background: var(--color-primary-hover);
}

.empty-action-btn.secondary {
  @apply border border-gray-300 text-gray-700 hover:bg-gray-50;
}

.empty-action-btn.danger {
  @apply bg-red-100 text-red-700 hover:bg-red-200;
}

.empty-action-btn:disabled {
  @apply opacity-50 cursor-not-allowed;
}

.action-icon {
  @apply text-base;
}

/* 自定义内容 */
.empty-custom {
  @apply mt-4;
}

/* 深色主题适配 */
[data-theme="dark"] .empty-action-btn.default {
  @apply bg-gray-700 text-gray-300 hover:bg-gray-600;
}

[data-theme="dark"] .empty-action-btn.secondary {
  @apply border-gray-600 text-gray-300 hover:bg-gray-700;
}
</style>
