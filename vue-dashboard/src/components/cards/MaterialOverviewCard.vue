<template>
  <BaseCard
    :card-id="cardId"
    :title="cardTitle"
    :mode="mode"
    :loading="loading"
    :error="error"
    :mode-locked="props.modeLocked"
    :forced-mode="props.forcedMode"
    @refresh="handleRefresh"
    @settings="handleSettings"
  >
    <!-- Mini 视图 (1x1 ~ 2x2) -->
    <template v-if="mode === 'mini'">
      <div class="mini-view">
        <div class="mini-value" :class="currentMetric.colorClass">
          {{ currentMetric.displayValue }}
        </div>
        <div class="mini-label">{{ currentMetric.label }}</div>
        <button
          @click="switchMetric"
          class="switch-button"
          :title="`切换指标 (当前: ${currentMetric.label})`"
        >
          <svg class="switch-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
          </svg>
        </button>
      </div>
    </template>

    <!-- Compact 视图 (3x2 ~ 4x3) -->
    <template v-else-if="mode === 'compact'">
      <div class="compact-view">
        <div class="main-metric">
          <div class="main-value text-red-500">{{ formatCurrency(totalValue) }}</div>
          <div class="main-label">总库存价值</div>
        </div>
        <div class="sub-metrics">
          <div class="sub-metric">
            <div class="sub-value text-blue-500">{{ materialCount }}</div>
            <div class="sub-label">物料种类</div>
          </div>
          <div class="sub-metric">
            <div class="sub-value text-green-500">{{ formatNumber(totalQuantity) }}</div>
            <div class="sub-label">总库存量</div>
          </div>
        </div>
      </div>
    </template>

    <!-- Full 视图 (≥4x4) -->
    <template v-else>
      <div class="full-view">
        <div class="metrics-header">
          <div class="metric-card">
            <div class="metric-value text-blue-500">{{ materialCount }}</div>
            <div class="metric-label">物料种类</div>
          </div>
          <div class="metric-card">
            <div class="metric-value text-green-500">{{ formatNumber(totalQuantity) }}</div>
            <div class="metric-label">总库存量</div>
          </div>
          <div class="metric-card">
            <div class="metric-value text-red-500">{{ formatCurrency(totalValue) }}</div>
            <div class="metric-label">库存价值</div>
          </div>
        </div>
        
        <div class="table-container">
          <table class="material-table">
            <thead>
              <tr>
                <th>物料名称</th>
                <th>库存</th>
                <th>单价</th>
                <th>价值</th>
                <th>类别</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="material in paginatedMaterials"
                :key="material.id"
                class="table-row"
              >
                <td class="material-name-cell">
                  <div class="material-info">
                    <span class="name">{{ material.productName }}</span>
                    <span class="spec">{{ material.specification }}</span>
                  </div>
                </td>
                <td class="inventory-cell">{{ material.inventory }}</td>
                <td class="price-cell">{{ formatCurrency(material.price) }}</td>
                <td class="value-cell">{{ formatCurrency(material.totalValue) }}</td>
                <td class="type-cell">{{ material.cutterType }}</td>
              </tr>
            </tbody>
          </table>
          
          <div v-if="materials.length === 0" class="empty-state">
            <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="9" cy="9" r="2"/>
              <path d="M21 15.5c-.3-2.5-2.8-4.5-5.5-4.5s-5.2 2-5.5 4.5"/>
            </svg>
            <span>暂无物料数据</span>
          </div>
          
          <!-- 分页控制 -->
          <div v-if="totalPages > 1" class="pagination">
            <button 
              @click="prevPage" 
              :disabled="currentPage === 1"
              class="page-btn"
            >
              上一页
            </button>
            <span class="page-info">
              {{ currentPage }} / {{ totalPages }}
            </span>
            <button 
              @click="nextPage" 
              :disabled="currentPage === totalPages"
              class="page-btn"
            >
              下一页
            </button>
          </div>
        </div>
      </div>
    </template>
  </BaseCard>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import BaseCard from './BaseCard.vue'
import cachedApi from '@/services/cachedApi'
import type { BaseCardProps, BaseCardEmits } from '@/types/card'
import { useBaseCard } from '@/composables/useBaseCard'
import { useDataStore } from '@/stores/data'

// Props和Events使用统一接口
const props = defineProps<BaseCardProps>()
const emit = defineEmits<BaseCardEmits>()

// 数据获取函数
const fetchMaterials = async () => {
  let allMaterials: any[] = []
  let page = 1
  let hasMore = true

  while (hasMore) {
    const response = await cachedApi.material.getMaterials(page, 100, {})
    if (response.code === 'OK' && response.data) {
      const pageData = response.data.rows || []
      allMaterials = [...allMaterials, ...pageData]
      hasMore = pageData.length === 100 && page < (response.data.pageCount || 1)
      page++
    } else {
      hasMore = false
      if (page === 1) {
        throw new Error(response.message || '获取物料数据失败')
      }
    }
  }

  return allMaterials
}

// 使用统一的卡片Hook
const {
  mode,
  isMini,
  isCompact,
  isFull,
  loading,
  error,
  data: materials,
  refresh,
  cardTitle
} = useBaseCard(props, emit, {
  fetcher: fetchMaterials,
  titles: {
    mini: '库存',
    compact: '库存总览',
    full: '物料库存详情',
    default: '库存状态'
  }
})

// 卡片特有的响应式数据
const currentMetricIndex = ref(0)
const currentPage = ref(1)
const pageSize = 10

// Mini视图的指标定义
const metrics = [
  {
    key: 'value',
    label: '总价值',
    shortLabel: '价值',
    colorClass: 'text-red-500',
    getValue: () => formatCurrencyMini(totalValue.value),
    getFullValue: () => formatCurrency(totalValue.value)
  },
  {
    key: 'count',
    label: '物料种类',
    shortLabel: '种类',
    colorClass: 'text-blue-500',
    getValue: () => materialCount.value.toString(),
    getFullValue: () => materialCount.value.toString()
  },
  {
    key: 'quantity',
    label: '总库存量',
    shortLabel: '库存',
    colorClass: 'text-green-500',
    getValue: () => formatNumber(totalQuantity.value),
    getFullValue: () => formatNumber(totalQuantity.value)
  }
]

// 计算属性
const materialCount = computed(() => materials.value?.length || 0)

const totalQuantity = computed(() => {
  if (!materials.value) return 0
  return materials.value.reduce((sum, material) => sum + (material.inventory || 0), 0)
})

const totalValue = computed(() => {
  if (!materials.value) return 0
  return materials.value.reduce((sum, material) => {
    return sum + ((material.inventory || 0) * (material.price || 0))
  }, 0)
})

const currentMetric = computed(() => {
  const metric = metrics[currentMetricIndex.value]
  return {
    ...metric,
    displayValue: metric.getValue()
  }
})

const materialsWithValue = computed(() => {
  if (!materials.value) return []
  return materials.value.map(material => ({
    ...material,
    totalValue: (material.inventory || 0) * (material.price || 0)
  })).sort((a, b) => b.totalValue - a.totalValue)
})

const totalPages = computed(() => Math.ceil(materialsWithValue.value.length / pageSize))

const paginatedMaterials = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  const end = start + pageSize
  return materialsWithValue.value.slice(start, end)
})

// 订阅轮询数据：materials-overview，自动更新总览数据
const dataStore = useDataStore()
watch(
  () => dataStore.getData('materials-overview'),
  (payload) => {
    const rows = (payload as any)?.rows || []
    materials.value = rows
  },
  { immediate: true }
)

// 方法
const formatCurrency = (value: number) => {
  if (value >= 10000) {
    return `¥${(value / 10000).toFixed(1)}万`
  }
  return `¥${value.toFixed(2)}`
}

// Mini视图专用的货币格式化函数
const formatCurrencyMini = (value: number) => {
  if (value >= 100000000) {
    return `¥${(value / 100000000).toFixed(1)}亿`
  }
  if (value >= 10000) {
    return `¥${(value / 10000).toFixed(1)}万`
  }
  if (value >= 1000) {
    return `¥${(value / 1000).toFixed(1)}千`
  }
  return `¥${value.toFixed(0)}`
}

const formatNumber = (value: number) => {
  if (value >= 10000) {
    return `${(value / 10000).toFixed(1)}万`
  }
  return value.toLocaleString()
}

const switchMetric = () => {
  currentMetricIndex.value = (currentMetricIndex.value + 1) % metrics.length
}

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
  }
}

const handleRefresh = async () => {
  try {
    currentPage.value = 1

    // 清理缓存并刷新数据
    await cachedApi.cache.clearModuleCache('materials')
    await refresh()

    console.log('🔄 物料总览数据已刷新')
    emit('refresh')
  } catch (error) {
    console.error('❌ 物料总览刷新失败:', error.message)
  }
}

const handleSettings = () => {
  emit('settings')
}

// 移除鼠标悬停逻辑，切换按钮始终显示
</script>

<style scoped>
/* Mini 视图样式 */
.mini-view {
  @apply h-full flex flex-col items-center justify-center text-center relative;
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
  @apply font-semibold leading-tight transition-colors;
  font-size: clamp(1.5rem, 8vw, 2.5rem);
  font-family: 'PingFang SC', 'Microsoft YaHei', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  letter-spacing: -0.01em;
  white-space: nowrap;
  font-feature-settings: 'tnum' 1; /* 使用等宽数字 */
  font-variant-numeric: tabular-nums; /* 表格数字，确保对齐 */
}

.switch-button {
  @apply absolute bottom-1 left-1 p-1 rounded opacity-0 transition-all;
  @apply hover:bg-gray-100 dark:hover:bg-gray-700 hover:scale-110;
  color: var(--color-text-secondary);
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(4px);
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mini-view:hover .switch-button {
  @apply opacity-100;
}

.switch-icon {
  @apply w-3 h-3;
  stroke-width: 2;
}

/* Compact 视图样式 */
.compact-view {
  @apply h-full flex flex-col justify-center;
  padding: 1rem;
}

.main-metric {
  @apply text-center mb-6;
}

.main-value {
  @apply text-3xl font-semibold mb-1;
}

.main-label {
  @apply text-sm;
  color: var(--color-text-secondary);
}

.sub-metrics {
  @apply flex justify-around;
}

.sub-metric {
  @apply text-center;
}

.sub-value {
  @apply text-2xl font-medium mb-1;
}

.sub-label {
  @apply text-xs;
  color: var(--color-text-secondary);
}

/* Full 视图样式 */
.full-view {
  @apply h-full flex flex-col;
  padding: 1rem;
}

.metrics-header {
  @apply flex justify-around mb-6 pb-4 border-b border-gray-200 dark:border-gray-700;
}

.metric-card {
  @apply text-center;
}

.metric-card .metric-value {
  @apply text-3xl font-semibold mb-1;
}

.metric-card .metric-label {
  @apply text-sm;
  color: var(--color-text-secondary);
}

.table-container {
  @apply flex-1 overflow-auto custom-scrollbar;
}

.material-table {
  @apply w-full text-sm flex-1;
  table-layout: fixed; /* 固定表格布局 */
}

/* 列宽比例分配 */
.material-table th:nth-child(1) { width: 30%; } /* 物料名称 */
.material-table th:nth-child(2) { width: 17.5%; } /* 库存 */
.material-table th:nth-child(3) { width: 17.5%; } /* 单价 */
.material-table th:nth-child(4) { width: 17.5%; } /* 价值 */
.material-table th:nth-child(5) { width: 17.5%; } /* 类别 */

.material-table th {
  @apply px-3 py-2 text-left font-medium border-b border-gray-200 dark:border-gray-700;
  color: var(--color-text-secondary);
}

.material-table td {
  @apply px-3 py-3 border-b border-gray-100 dark:border-gray-800;
}

.table-row:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

/* 深色模式下的悬停样式 */
.theme-dark .table-row:hover,
.theme-tech .table-row:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.material-name-cell .material-info {
  @apply flex flex-col;
}

.material-name-cell .name {
  @apply font-medium;
  color: var(--color-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.material-name-cell .spec {
  @apply text-xs mt-1;
  color: var(--color-text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.inventory-cell, .price-cell, .value-cell {
  @apply text-left font-mono;
  color: var(--color-text);
}

.type-cell {
  @apply text-left;
  color: var(--color-text-secondary);
}

/* 分页样式 */
.pagination {
  @apply flex items-center justify-center space-x-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700;
}

.page-btn {
  @apply px-3 py-1 border border-gray-300 dark:border-gray-600 rounded;
  @apply hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed;
  color: var(--color-text);
}

.page-info {
  @apply text-sm;
  color: var(--color-text-secondary);
}

/* 空状态样式 */
.empty-state {
  @apply flex flex-col items-center justify-center py-8 text-center;
  color: var(--color-text-secondary);
}

.empty-icon {
  @apply w-12 h-12 mb-2 text-gray-400;
  stroke-width: 1.5;
}

/* 响应式设计 */
@media (max-width: 640px) {
  .metrics-header {
    @apply flex-col space-y-4;
  }
  
  .material-table {
    @apply text-xs;
  }
  
  .material-table th,
  .material-table td {
    @apply px-2 py-2;
  }
}
</style>
