<template>
  <BaseCard
    :card-id="cardId"
    :title="cardTitle"
    :mode="mode"
    :loading="loading"
    :error="error"
    @refresh="handleRefresh"
    @settings="handleSettings"
  >
    <!-- Mini 视图 (1x1 ~ 2x2) -->
    <template v-if="mode === 'mini'">
      <div class="mini-view">
        <div class="mini-value" :class="{ 'has-alarm': alarmCount > 0 }">
          {{ alarmCount }}
        </div>
        <div class="mini-label">预警物料</div>
      </div>
    </template>

    <!-- Compact 视图 (3x2 ~ 4x3) -->
    <template v-else-if="mode === 'compact'">
      <div class="compact-view">
        <div class="compact-header">
          <h3 class="compact-title">Top 5 紧缺物料</h3>
        </div>
        <div class="material-list">
          <div
            v-for="material in topAlarmMaterials"
            :key="material.id"
            class="material-item"
          >
            <div class="material-info">
              <span class="material-name">{{ material.productName }}</span>
              <span class="material-ratio">({{ material.inventory }}/{{ material.inventoryWarn }})</span>
            </div>
            <div class="progress-bar">
              <div 
                class="progress-fill"
                :class="getProgressClass(material.progressPercent)"
                :style="{ width: `${Math.max(material.progressPercent, 5)}%` }"
              ></div>
            </div>
          </div>
          <EmptyState
            v-if="topAlarmMaterials.length === 0"
            description="暂无预警物料"
            :icon-component="CheckCircleIcon"
            size="sm"
          />
        </div>
      </div>
    </template>

    <!-- Full 视图 (≥4x3) -->
    <template v-else>
      <div class="full-view">
        <div class="full-header">
          <h3 class="full-title">预警物料清单</h3>
          <div class="header-actions">
            <select v-model="selectedFilter" class="filter-select" @change="applyFilter">
              <option value="all">全部类别</option>
              <option v-for="type in materialTypes" :key="type" :value="type">
                {{ type }}
              </option>
            </select>
          </div>
        </div>
        <div class="table-container">
          <table class="alarm-data-table">
            <thead>
              <tr class="table-header-row">
                <th class="header-material">物料名称</th>
                <th class="header-inventory">当前库存</th>
                <th class="header-warn">预警库存</th>
                <th class="header-diff">差值</th>
                <th class="header-type">类别</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="material in filteredAlarmMaterials"
                :key="material.id"
                class="data-row"
              >
                <td class="cell-material">
                  <div class="material-content">
                    <div class="material-name">{{ material.productName }}</div>
                    <div class="material-spec">{{ material.specification }}</div>
                  </div>
                </td>
                <td class="cell-inventory">{{ material.inventory }}</td>
                <td class="cell-warn">{{ material.inventoryWarn }}</td>
                <td class="cell-diff" :class="{ 'negative': material.diff < 0 }">
                  {{ material.diff }}
                </td>
                <td class="cell-type">{{ material.cutterType }}</td>
              </tr>
            </tbody>
          </table>
          <EmptyState
            v-if="filteredAlarmMaterials.length === 0"
            :description="selectedFilter === 'all' ? '暂无预警物料' : '该类别暂无预警物料'"
            :icon-component="CheckCircleIcon"
            size="md"
          />
        </div>
      </div>
    </template>
  </BaseCard>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import BaseCard from './BaseCard.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import CheckCircleIcon from '@/components/icons/CheckCircleIcon.vue'
import cachedApi from '@/services/cachedApi'
import type { BaseCardProps, BaseCardEmits } from '@/types/card'
import { useBaseCard, CARD_TITLES } from '@/composables/useBaseCard'
import { useDataStore } from '@/stores/data'

// Props和Events使用统一接口
const props = defineProps<BaseCardProps>()
const emit = defineEmits<BaseCardEmits>()

// 使用统一的卡片Hook
const {
  mode,
  isMini,
  isCompact,
  isFull,
  loading,
  error,
  data: alarmMaterials,
  refresh,
  cardTitle
} = useBaseCard(props, emit, {
  fetcher: () => cachedApi.material.getWarnMaterials(1, 100).then(res => res.data?.rows || []),
  titles: {
    mini: '库存',
    compact: '紧缺物料',
    full: '预警物料清单',
    default: '库存状态'
  }
})

// 卡片特有的响应式数据
const selectedFilter = ref('all')

const alarmCount = computed(() => alarmMaterials.value?.length || 0)

const topAlarmMaterials = computed(() => {
  if (!alarmMaterials.value) return []
  return alarmMaterials.value
    .map(material => ({
      ...material,
      diff: material.inventory - material.inventoryWarn,
      progressPercent: Math.min((material.inventory / material.inventoryWarn) * 100, 100)
    }))
    .sort((a, b) => a.progressPercent - b.progressPercent)
    .slice(0, 5)
})

const materialTypes = computed(() => {
  if (!alarmMaterials.value) return []
  const types = new Set(alarmMaterials.value.map(m => m.cutterType))
  return Array.from(types).filter(Boolean)
})

const filteredAlarmMaterials = computed(() => {
  if (!alarmMaterials.value) return []
  let filtered = alarmMaterials.value.map(material => ({
    ...material,
    diff: material.inventory - material.inventoryWarn
  }))

  if (selectedFilter.value !== 'all') {
    filtered = filtered.filter(m => m.cutterType === selectedFilter.value)
  }

  return filtered.sort((a, b) => a.diff - b.diff)
})

// 方法
const getProgressClass = (percent: number) => {
  if (percent <= 30) return 'danger'
  if (percent <= 60) return 'warning'
  return 'normal'
}

const handleRefresh = async () => {
  try {
    // 清除缓存并刷新数据
    await cachedApi.cache.clearModuleCache('materials')
    const result = await refresh()

    console.log('🔄 库存预警数据已刷新:', result?.length || 0, '条记录')
    emit('refresh')
  } catch (error) {
    console.error('❌ 库存预警刷新失败:', error.message)
    emit('error', error.message)
  }
}

const handleSettings = () => {
  emit('settings')
}

const applyFilter = () => {
  // 过滤逻辑已在计算属性中实现
}

// 订阅全局轮询数据：warn-materials
const dataStore = useDataStore()
watch(
  () => dataStore.getData('warn-materials'),
  (payload) => {
    const rows = payload?.rows || []
    alarmMaterials.value = rows
  },
  { immediate: true }
)
</script>

<style scoped>
/* Mini 视图样式 */
.mini-view {
  @apply h-full flex flex-col items-center justify-center text-center;
  padding: 0.75rem;
  min-height: 0;
}

.mini-label {
  @apply text-xs leading-tight mt-2;
  color: var(--color-text-secondary);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
  letter-spacing: 0.02em;
  white-space: nowrap;
}

.mini-value {
  @apply font-semibold leading-tight;
  color: var(--color-text);
  font-size: clamp(1.75rem, 8vw, 2.5rem);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
  letter-spacing: -0.02em;
  white-space: nowrap;
}

.mini-value.has-alarm {
  @apply text-orange-500;
}

/* Compact 视图样式 */
.compact-view {
  @apply h-full flex flex-col;
  padding: 1rem;
}

.compact-header {
  @apply mb-4;
}

.compact-title {
  @apply text-lg font-medium;
  color: var(--color-text);
}

.material-list {
  @apply flex-1 space-y-3 overflow-y-auto custom-scrollbar;
}

.material-item {
  @apply space-y-2;
}

.material-info {
  @apply flex justify-between items-center;
}

.material-name {
  @apply font-medium text-sm;
  color: var(--color-text);
}

.material-ratio {
  @apply text-xs;
  color: var(--color-text-secondary);
}

.progress-bar {
  @apply w-full h-2 rounded-full overflow-hidden;
  background-color: var(--color-text-secondary);
  opacity: 0.2;
}

.progress-fill {
  @apply h-full transition-all duration-300 rounded-full;
}

.progress-fill.danger {
  @apply bg-red-600;
}

.progress-fill.warning {
  @apply bg-red-500;
}

.progress-fill.normal {
  @apply bg-red-400;
}

/* Full 视图样式 */
.full-view {
  @apply h-full flex flex-col;
  padding: 1rem;
}

.full-header {
  @apply flex justify-between items-center mb-4;
}

.full-title {
  @apply text-xl font-medium;
  color: var(--color-text);
}

.header-actions {
  @apply flex items-center space-x-2;
}

.filter-select {
  @apply px-3 py-1 border rounded-lg text-sm;
  background-color: var(--color-surface);
  border-color: var(--color-text-secondary);
  color: var(--color-text);
  opacity: 0.8;
}

.filter-select:hover {
  opacity: 1;
  border-color: var(--color-primary);
}

.filter-select:focus {
  outline: none;
  border-color: var(--color-primary);
  opacity: 1;
}

.table-container {
  @apply flex-1 overflow-auto custom-scrollbar;
}

/* 重写的表格样式 - 避免CSS冲突 */
.alarm-data-table {
  width: 100%;
  font-size: 0.875rem;
  border-collapse: collapse;
  table-layout: fixed; /* 固定表格布局 */
}

/* 列宽比例分配 */
.alarm-data-table th:nth-child(1) { width: 30%; } /* 物料名称 */
.alarm-data-table th:nth-child(2) { width: 17.5%; } /* 当前库存 */
.alarm-data-table th:nth-child(3) { width: 17.5%; } /* 预警库存 */
.alarm-data-table th:nth-child(4) { width: 17.5%; } /* 差值 */
.alarm-data-table th:nth-child(5) { width: 17.5%; } /* 类别 */

/* 表头样式 */
.table-header-row th {
  padding: 0.5rem 0.75rem;
  text-align: left;
  font-weight: 500;
  border-bottom: 1px solid var(--color-border);
  color: var(--color-text-secondary);
}

/* 数据行样式 */
.data-row {
  transition: background-color 0.2s ease;
}

.data-row:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

/* 深色模式下的悬停样式 - 使背景变得更亮 */
.theme-dark .data-row:hover {
  background-color: #334155; /* 比 #1e293b 更亮的深色 */
}

.theme-tech .data-row:hover {
  background-color: #2a3441; /* 比 #1a1f2e 更亮的深色 */
}

.data-row td {
  padding: 0.75rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  text-align: left;
  vertical-align: top;
}

/* 物料名称列 */
.cell-material {
  text-align: left !important;
}

.material-content {
  display: flex;
  flex-direction: column;
  text-align: left;
}

.material-name {
  font-weight: 500;
  color: var(--color-text);
  text-align: left;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.material-spec {
  font-size: 0.75rem;
  margin-top: 0.25rem;
  color: var(--color-text-secondary);
  text-align: left;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 数据列 */
.cell-inventory,
.cell-warn {
  font-family: 'Courier New', monospace;
  color: var(--color-text);
  text-align: left;
}

.cell-diff {
  font-family: 'Courier New', monospace;
  font-weight: 500;
  color: var(--color-text);
  text-align: left;
}

.cell-diff.negative {
  color: #ef4444;
}

.cell-type {
  color: var(--color-text-secondary);
  text-align: left;
}

/* 空状态样式已移至 EmptyState 组件 */

/* 响应式设计 */
@media (max-width: 640px) {
  .alarm-table {
    @apply text-xs;
  }
  
  .alarm-table th,
  .alarm-table td {
    @apply px-2 py-2;
  }
}
</style>
