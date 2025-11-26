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
    <!-- Mini 视图 (1x1 ~ 2x2) - 简洁数字布局 -->
    <template v-if="mode === 'mini'">
      <div class="mini-view">
        <div class="return-summary-simple">
          <div class="return-count-simple">{{ todayReturnCount }}</div>
          <div class="return-label-simple">今日归还</div>
        </div>
      </div>
    </template>

    <!-- Compact 视图 (3x2 ~ 4x3) -->
    <template v-else-if="mode === 'compact'">
      <div class="compact-view">
        <div class="compact-header">
          <h3 class="compact-title">{{ compactTitle }}</h3>
          <div class="time-info">{{ formatTimeRange() }}</div>
        </div>
        <div class="return-list">
          <div 
            v-for="record in recentReturns" 
            :key="record.id"
            class="return-item"
          >
            <div class="item-icon">
              <div class="material-avatar">{{ record.productName.charAt(0) }}</div>
            </div>
            <div class="item-content">
              <div class="material-name">{{ record.productName }}</div>
              <div class="return-info">
                <span class="return-user">{{ record.rUserName }}</span>
                <span class="return-time">{{ formatTime(record.rLastTime) }}</span>
              </div>
            </div>
            <div class="item-count">{{ record.payNum }}件</div>
          </div>
          
          <div v-if="recentReturns.length === 0" class="empty-list">
            <span>暂无归还记录</span>
          </div>
        </div>
      </div>
    </template>

    <!-- Full 视图 (4x3+) -->
    <template v-else>
      <div class="full-view">
        <div class="full-header">
          <h3 class="full-title">归还记录详情</h3>
          <div class="controls">
            <select v-model="selectedTimeRange" @change="handleTimeRangeChange" class="time-selector">
              <option value="today">今日</option>
              <option value="week">本周</option>
            </select>
          </div>
        </div>
        
        <div class="full-content">
          <!-- 统计概览 -->
          <div class="stats-overview">
            <div class="stat-item">
              <div class="stat-value">{{ totalReturns }}</div>
              <div class="stat-label">总归还数</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ uniqueUsers }}</div>
              <div class="stat-label">归还人数</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ totalItems }}</div>
              <div class="stat-label">归还件数</div>
            </div>
          </div>

          <!-- 详细表格 -->
          <div class="table-container">
            <table class="return-table">
              <thead>
                <tr>
                  <th>物料名称</th>
                  <th>领用人</th>
                  <th>归还人</th>
                  <th>数量</th>
                  <th>领用时间</th>
                  <th>归还时间</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="record in returnRecords" :key="record.id" class="table-row">
                  <td class="material-cell">
                    <div class="material-info">
                      <div class="material-avatar-small">{{ record.productName.charAt(0) }}</div>
                      <div class="material-details">
                        <span class="material-name">{{ record.productName }}</span>
                        <span class="material-code">{{ record.materialCode }}</span>
                      </div>
                    </div>
                  </td>
                  <td class="user-cell">
                    <div class="user-info">
                      <span class="user-name">{{ record.payUserName }}</span>
                      <span class="user-workno">{{ record.payWorkeNo }}</span>
                    </div>
                  </td>
                  <td class="user-cell">
                    <div class="user-info">
                      <span class="user-name">{{ record.rUserName }}</span>
                      <span class="user-workno">{{ record.rWorkeNo }}</span>
                    </div>
                  </td>
                  <td class="count-cell">
                    <span class="count-value">{{ record.payNum }}</span>
                    <span class="count-unit">件</span>
                  </td>
                  <td class="time-cell">{{ formatDateTime(record.payTime) }}</td>
                  <td class="time-cell">{{ formatDateTime(record.rLastTime) }}</td>
                </tr>
              </tbody>
            </table>
            
            <div v-if="returnRecords.length === 0" class="empty-table">
              <span>暂无归还记录</span>
            </div>
          </div>
        </div>
      </div>
    </template>
  </BaseCard>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import BaseCard from './BaseCard.vue'
import { api } from '@/services/api'
import { useDataStore } from '@/stores/data'
import type { BaseCardProps, BaseCardEmits } from '@/types/card'
import type { PickupRecord } from '@/types'
import { useBaseCard } from '@/composables/useBaseCard'

// Props和Events使用统一接口
const props = defineProps<BaseCardProps>()
const emit = defineEmits<BaseCardEmits>()

// 时间范围类型
type TimeRangeType = 'today' | 'week'

// 响应式数据
const selectedTimeRange = ref<TimeRangeType>('today')
const returnRecords = ref<PickupRecord[]>([])

// 工具函数 - 提前定义
const getTimeRange = (type: TimeRangeType) => {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  switch (type) {
    case 'today': {
      // 今日
      const endOfDay = new Date(today)
      endOfDay.setHours(23, 59, 59, 999)

      return {
        start: formatDateTime(today),
        end: formatDateTime(endOfDay)
      }
    }
    case 'week': {
      // 本周（周一到周日）
      const dayOfWeek = today.getDay()
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
      const monday = new Date(today)
      monday.setDate(today.getDate() + mondayOffset)

      const sunday = new Date(monday)
      sunday.setDate(monday.getDate() + 6)
      sunday.setHours(23, 59, 59, 999)

      return {
        start: formatDateTime(monday),
        end: formatDateTime(sunday)
      }
    }
    default:
      // 默认返回今日
      return getTimeRange('today')
  }
}

const formatDateTime = (date: Date | string | null | undefined): string => {
  if (!date) return '-'

  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date

    // 检查日期是否有效
    if (isNaN(dateObj.getTime())) return '-'

    const year = dateObj.getFullYear()
    const month = String(dateObj.getMonth() + 1).padStart(2, '0')
    const day = String(dateObj.getDate()).padStart(2, '0')
    const hours = String(dateObj.getHours()).padStart(2, '0')
    const minutes = String(dateObj.getMinutes()).padStart(2, '0')
    const seconds = String(dateObj.getSeconds()).padStart(2, '0')

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
  } catch (error) {
    console.warn('formatDateTime error:', error, 'date:', date)
    return '-'
  }
}

// 数据获取函数
const fetchReturnData = async () => {
  const timeRange = getTimeRange(selectedTimeRange.value)

  const response = await api.pickup.getPickupsByReturnTime(
    timeRange.start,
    timeRange.end,
    1,
    100 // 获取更多数据用于统计
  )

  const records = response.data?.rows || []

  // 只保留已归还的记录 (isReturn === 2，根据实际API数据)
  returnRecords.value = records.filter(record =>
    record.isReturn === 2 && record.rLastTime
  ).sort((a, b) =>
    new Date(b.rLastTime).getTime() - new Date(a.rLastTime).getTime()
  )

  return returnRecords.value
}

// 使用统一的卡片Hook
const {
  mode,
  isMini,
  isCompact,
  isFull,
  loading,
  error,
  refresh,
  cardTitle
} = useBaseCard(props, emit, {
  fetcher: fetchReturnData,
  titles: {
    mini: '今日归还',
    compact: '归还记录',
    full: '归还记录详情',
    default: '归还追踪'
  }
})

const todayReturnCount = computed(() => {
  const today = new Date().toDateString()
  return returnRecords.value.filter(record => {
    const returnDate = new Date(record.rLastTime).toDateString()
    return returnDate === today
  }).reduce((sum, record) => sum + record.payNum, 0)
})

const recentReturns = computed(() => {
  return returnRecords.value.slice(0, 5)
})

const totalReturns = computed(() => returnRecords.value.length)

const uniqueUsers = computed(() => {
  const users = new Set(returnRecords.value.map(record => record.rUserName))
  return users.size
})

// 订阅轮询数据：today-returns，自动更新归还记录
const dataStore = useDataStore()
watch(
  () => dataStore.getData('today-returns'),
  (payload) => {
    // 仅当选择“今日”时才应用轮询数据更新，避免覆盖“本周”等非今日视图
    if (selectedTimeRange.value !== 'today') return
    const rows = (payload as any)?.rows || []
    const filtered = rows
      .filter((record: any) => record.isReturn === 2 && record.rLastTime)
      .sort((a: any, b: any) => new Date(b.rLastTime).getTime() - new Date(a.rLastTime).getTime())
    returnRecords.value = filtered
  },
  { immediate: true }
)

// 订阅轮询数据：week-returns，选择“本周”时自动更新归还记录
watch(
  () => dataStore.getData('week-returns'),
  (payload) => {
    if (selectedTimeRange.value !== 'week') return
    const rows = (payload as any)?.rows || []
    const filtered = rows
      .filter((record: any) => record.isReturn === 2 && record.rLastTime)
      .sort((a: any, b: any) => new Date(b.rLastTime).getTime() - new Date(a.rLastTime).getTime())
    returnRecords.value = filtered
  },
  { immediate: true }
)

const totalItems = computed(() => {
  return returnRecords.value.reduce((sum, record) => sum + record.payNum, 0)
})

// Compact 标题动态映射 Full 的选择（今日/本周）
const compactTitle = computed(() => {
  return selectedTimeRange.value === 'today'
    ? '今日归还记录'
    : '本周归还记录'
})

const formatTime = (timeStr: string | null | undefined): string => {
  if (!timeStr) return '-'

  try {
    const date = new Date(timeStr)

    // 检查日期是否有效
    if (isNaN(date.getTime())) return '-'

    const month = date.getMonth() + 1
    const day = date.getDate()
    const hours = date.getHours()
    const minutes = date.getMinutes()

    return `${month}/${day} ${hours}:${String(minutes).padStart(2, '0')}`
  } catch (error) {
    console.warn('formatTime error:', error, 'timeStr:', timeStr)
    return '-'
  }
}

const formatTimeRange = (): string => {
  switch (selectedTimeRange.value) {
    case 'today':
      return '今日'
    case 'week':
      return '本周'
    default:
      return '最近'
  }
}

// 事件处理
const handleRefresh = async () => {
  await refresh()
}

const handleSettings = () => {
  emit('settings')
}

const handleTimeRangeChange = async () => {
  await refresh()
}
</script>

<style scoped>
/* Mini 视图样式 - 简洁数字布局 */
.mini-view {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem;
}

.return-summary-simple {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  width: 100%;
  height: 100%;
  justify-content: center;
  gap: clamp(0.375rem, 1.5vw, 0.75rem);
}

.return-count-simple {
  font-size: clamp(2rem, 8vw, 3.5rem);
  font-weight: 800;
  color: #34C759;
  line-height: 0.85;
  letter-spacing: -0.02em;
}

.return-label-simple {
  font-size: clamp(0.75rem, 3vw, 1rem);
  color: var(--color-text-secondary);
  font-weight: 500;
  white-space: nowrap;
  line-height: 1.2;
}

/* Compact 视图样式 */
.compact-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 0.75rem;
}

.compact-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.compact-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
}

.time-info {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
}

.return-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

/* 使用全局滚动条样式 */
.return-list {
  @apply custom-scrollbar;
}

.return-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem;
  background-color: var(--color-surface);
  border-radius: 8px;
  transition: all 0.2s ease;
}

.return-item:hover {
  background-color: rgba(59, 130, 246, 0.1);
  opacity: 1;
  transform: translateY(-1px);
}

.return-item:hover .material-name,
.return-item:hover .return-info,
.return-item:hover .item-count {
  opacity: 1;
}

.item-icon {
  flex-shrink: 0;
}

.material-avatar {
  width: 2rem;
  height: 2rem;
  background: linear-gradient(135deg, #007AFF, #5AC8FA);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 0.875rem;
}

.item-content {
  flex: 1;
  min-width: 0;
}

.material-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text);
  margin-bottom: 0.125rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.return-info {
  display: flex;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: var(--color-text-secondary);
}

.return-user {
  font-weight: 500;
}

.item-count {
  font-size: 0.875rem;
  font-weight: 600;
  color: #34C759;
  flex-shrink: 0;
}

.empty-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--color-text-secondary);
  gap: 0.5rem;
}



/* Full 视图样式 */
.full-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 1rem;
}

.full-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.full-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
}

.controls {
  display: flex;
  gap: 0.5rem;
}

.time-selector {
  padding: 0.375rem 0.75rem;
  border-radius: 8px;
  font-size: 0.875rem;
  background-color: var(--color-surface);
  color: var(--color-text);
  border: 1px solid var(--color-text-secondary);
  cursor: pointer;
  transition: border-color 0.2s ease;
}

.time-selector:hover {
  border-color: var(--color-success);
}

.time-selector:focus {
  outline: none;
  border-color: var(--color-success);
  box-shadow: 0 0 0 3px rgba(52, 199, 89, 0.1);
}

.full-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

/* 统计概览 */
/* 统计概览 */
.stats-overview {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1rem;
  padding: 1rem;
  border-radius: 12px;
}

/* 浅色模式：保持原有的浅灰色背景 */
.theme-light .stats-overview {
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
}

/* 深色模式：使用深色背景 */
.theme-dark .stats-overview,
.theme-tech .stats-overview {
  background-color: var(--color-surface);
  border: 1px solid rgba(148, 163, 184, 0.3);
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #34C759;
  margin-bottom: 0.25rem;
}

.stat-label {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  font-weight: 500;
}

/* 表格样式 */
.table-container {
  flex: 1;
  overflow: auto;
  border-radius: 12px;
}

/* 浅色模式：保持原有的白色背景 */
.theme-light .table-container {
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
}

/* 深色模式：使用深色背景 */
.theme-dark .table-container,
.theme-tech .table-container {
  background-color: var(--color-surface);
  border: 1px solid rgba(148, 163, 184, 0.3);
}

/* 使用全局滚动条样式 */
.table-container {
  @apply custom-scrollbar;
}

.return-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.return-table thead {
  position: sticky;
  top: 0;
  z-index: 1;
}

/* 浅色模式：浅灰色表头 */
.theme-light .return-table thead {
  background-color: #f9fafb;
}

/* 深色模式：深色表头 */
.theme-dark .return-table thead,
.theme-tech .return-table thead {
  background-color: var(--color-surface);
}

.return-table th {
  padding: 0.75rem 1rem;
  text-align: left;
  font-weight: 600;
  color: var(--color-text);
  white-space: nowrap;
}

/* 浅色模式：浅色边框 */
.theme-light .return-table th {
  border-bottom: 1px solid #e5e7eb;
}

/* 深色模式：深色边框 */
.theme-dark .return-table th,
.theme-tech .return-table th {
  border-bottom: 1px solid rgba(148, 163, 184, 0.3);
}

.return-table td {
  padding: 0.75rem 1rem;
  vertical-align: middle;
  color: var(--color-text);
}

/* 浅色模式：浅色边框 */
.theme-light .return-table td {
  border-bottom: 1px solid #f3f4f6;
}

/* 深色模式：深色边框 */
.theme-dark .return-table td,
.theme-tech .return-table td {
  border-bottom: 1px solid rgba(148, 163, 184, 0.2);
}

/* 浅色模式：浅色悬停效果 */
.theme-light .table-row:hover {
  background-color: #f9fafb;
}

/* 深色模式：深色悬停效果 */
.theme-dark .table-row:hover,
.theme-tech .table-row:hover {
  background-color: rgba(148, 163, 184, 0.1);
}

.material-cell {
  min-width: 200px;
}

.material-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.material-avatar-small {
  width: 1.5rem;
  height: 1.5rem;
  background: linear-gradient(135deg, #007AFF, #5AC8FA);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 0.75rem;
  flex-shrink: 0;
}

.material-details {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.material-name {
  font-weight: 500;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.material-code {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
}

.user-cell {
  min-width: 120px;
}

.user-info {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-weight: 500;
  color: var(--color-text);
}

.user-workno {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
}

.count-cell {
  text-align: right;
  min-width: 80px;
}

.count-value {
  font-weight: 600;
  color: #34C759;
}

.count-unit {
  color: var(--color-text-secondary);
  margin-left: 0.25rem;
}

.time-cell {
  color: var(--color-text-secondary);
  font-size: 0.8125rem;
  min-width: 140px;
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
}

.empty-table {
  padding: 3rem 1rem;
  text-align: center;
  color: #86868b;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}



/* 响应式设计 */
@media (max-width: 768px) {
  .stats-overview {
    grid-template-columns: 1fr;
    gap: 0.5rem;
    padding: 0.75rem;
  }

  .return-table {
    font-size: 0.8125rem;
  }

  .return-table th,
  .return-table td {
    padding: 0.5rem 0.75rem;
  }

  .material-code,
  .user-workno,
  .time-cell {
    display: none;
  }
}

/* 小尺寸卡片优化 - 简洁布局 */
@container (max-width: 200px) {
  .mini-view {
    padding: 0.5rem;
  }

  .return-summary-simple {
    gap: 0.25rem;
  }

  .return-count-simple {
    font-size: 1.5rem;
  }

  .return-label-simple {
    font-size: 0.6875rem;
  }
}

@container (max-height: 120px) {
  .mini-view {
    padding: 0.375rem;
  }

  .return-summary-simple {
    gap: 0.1875rem;
  }

  .return-count-simple {
    font-size: 1.375rem;
  }

  .return-label-simple {
    font-size: 0.625rem;
  }
}

/* 极小尺寸优化 */
@container (max-width: 150px) and (max-height: 100px) {
  .mini-view {
    padding: 0.25rem;
  }

  .return-summary-simple {
    gap: 0.125rem;
  }

  .return-count-simple {
    font-size: 1.125rem;
  }

  .return-label-simple {
    font-size: 0.5625rem;
  }
}

/* 移除了@media (prefers-color-scheme: dark)样式，统一使用CSS变量 */
</style>
