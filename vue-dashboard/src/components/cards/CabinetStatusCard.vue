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
        <div class="status-summary">
          <div class="status-item online">
            <div class="status-count">{{ onlineCount }}</div>
            <div class="status-label">在线</div>
          </div>
          <div class="status-divider"></div>
          <div class="status-item offline">
            <div class="status-count">{{ offlineCount }}</div>
            <div class="status-label">离线</div>
          </div>
        </div>
      </div>
    </template>

    <!-- Compact 视图 (3x2 ~ 4x3) -->
    <template v-else-if="mode === 'compact'">
      <div class="compact-view">
        <div class="compact-header">
          <h3 class="compact-title">柜体状态列表</h3>
          <div class="compact-summary">
            <span class="online-count">在线: {{ onlineCount }}</span>
            <span class="offline-count">离线: {{ offlineCount }}</span>
          </div>
        </div>
        <div class="cabinet-list">
          <div
            v-for="cabinet in displayCabinets"
            :key="cabinet.id"
            class="cabinet-item"
          >
            <div class="status-indicator" :class="{ 'online': cabinet.isOnline === '1', 'offline': cabinet.isOnline !== '1' }">
              <div class="status-dot"></div>
            </div>
            <div class="cabinet-info">
              <div class="cabinet-name">{{ cabinet.cuttingName }}</div>
              <div class="cabinet-code">{{ cabinet.cuttingNo }}</div>
            </div>
            <div class="last-seen" v-if="(cabinet as any).lastHeartbeat">
              {{ formatLastSeen((cabinet as any).lastHeartbeat) }}
            </div>
          </div>
          <div v-if="cabinets.length === 0" class="empty-state">
            <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="9" cy="9" r="2"/>
              <path d="M21 15.5c-.3-2.5-2.8-4.5-5.5-4.5s-5.2 2-5.5 4.5"/>
            </svg>
            <span>暂无柜体数据</span>
          </div>
        </div>
      </div>
    </template>

    <!-- Full 视图 (≥4x3) -->
    <template v-else>
      <div class="full-view">
        <div class="full-header">
          <div class="cabinet-selector">
            <select v-model="selectedCabinetNo" @change="loadCabinetSlots" class="cabinet-select">
              <option value="">选择柜体</option>
              <option v-for="cabinet in cabinets" :key="cabinet.id" :value="cabinet.cuttingNo">
                {{ cabinet.cuttingName }} ({{ cabinet.cuttingNo }})
              </option>
            </select>
          </div>
        </div>
        
        <div class="slots-container" v-if="selectedCabinetNo">
          <VirtualGrid
            v-if="cabinetSlots.length > 0"
            :items="cabinetSlots"
            :item-width="120"
            :item-height="100"
            :container-height="400"
            :buffer-size="3"
            :gap="12"
            key-field="id"
            class="slots-virtual-grid"
          >
            <template #default="{ item: slot }">
              <div
                class="slot-item"
                :class="getSlotStatusClass(slot)"
                :title="getSlotTooltip(slot)"
              >
                <!-- 货道号 - 最显眼 -->
                <div class="slot-number">
                  {{ slot.itemNoAlias || slot.itmeNo }}
                </div>

                <!-- 内容区域 -->
                <div class="slot-body">
                  <!-- 有物料状态 -->
                  <div v-if="slot.boxInfoVo && slot.boxInfoVo.productName" class="material-content">
                    <!-- 物料名称 -->
                    <div class="material-name">{{ slot.boxInfoVo.productName }}</div>

                    <!-- 库存信息 -->
                    <div class="inventory-section">
                      <div class="inventory-text">{{ slot.surplus }}/{{ slot.inventory }}</div>
                      <div class="progress-container">
                        <div
                          class="progress-bar"
                          :class="getProgressBarClass(slot)"
                          :style="{ width: getProgressPercentage(slot) + '%' }"
                        ></div>
                      </div>
                    </div>
                  </div>

                  <!-- 空状态 -->
                  <div v-else class="empty-content">
                    <div class="empty-icon">📦</div>
                    <div class="empty-text">空</div>
                  </div>
                </div>
              </div>
            </template>
          </VirtualGrid>
          
          <div v-if="cabinetSlots.length === 0" class="empty-state">
            <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="9" cy="9" r="2"/>
              <path d="M21 15.5c-.3-2.5-2.8-4.5-5.5-4.5s-5.2 2-5.5 4.5"/>
            </svg>
            <span>该柜体暂无货道数据</span>
          </div>
        </div>
        
        <div v-else class="no-selection">
          <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <circle cx="9" cy="9" r="2"/>
            <path d="M21 15.5c-.3-2.5-2.8-4.5-5.5-4.5s-5.2 2-5.5 4.5"/>
          </svg>
          <span>请选择要查看的柜体</span>
        </div>
      </div>
    </template>
  </BaseCard>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import BaseCard from './BaseCard.vue'
import VirtualGrid from '@/components/common/VirtualGrid.vue'
import { api } from '@/services/api'
import { useDataStore } from '@/stores/data'
import type { BaseCardProps, BaseCardEmits } from '@/types/card'
import type { Cabinet } from '@/types'
import { useBaseCard } from '@/composables/useBaseCard'

// Props和Events使用统一接口
const props = defineProps<BaseCardProps>()
const emit = defineEmits<BaseCardEmits>()

// 使用统一的卡片Hook，明确类型
const {
  mode,
  isMini,
  isCompact,
  isFull,
  loading,
  error,
  data: cabinets,
  refresh,
  cardTitle
} = useBaseCard(props, emit, {
  fetcher: () => api.cabinet.getCabinets(1, 100).then(res => res.data?.rows || []),
  titles: {
    mini: '库存',
    compact: '柜体监控',
    full: '智能柜详情',
    default: '柜体状态'
  }
})

// 卡片特有的响应式数据
const cabinetSlots = ref<any[]>([])
const selectedCabinetNo = ref('')

const onlineCount = computed(() => {
  if (!cabinets.value || !Array.isArray(cabinets.value)) return 0
  return (cabinets.value as Cabinet[]).filter(cabinet => cabinet.isOnline === '1').length
})

const offlineCount = computed(() => {
  if (!cabinets.value || !Array.isArray(cabinets.value)) return 0
  return (cabinets.value as Cabinet[]).filter(cabinet => cabinet.isOnline !== '1').length
})

const displayCabinets = computed(() => {
  if (!cabinets.value || !Array.isArray(cabinets.value)) return []
  // Compact模式下优先显示在线柜体，然后是离线柜体，最多显示8个
  const cabinetList = cabinets.value as Cabinet[]
  const onlineCabinets = cabinetList.filter(c => c.isOnline === '1')
  const offlineCabinets = cabinetList.filter(c => c.isOnline !== '1')
  const sortedCabinets = [...onlineCabinets, ...offlineCabinets]
  return sortedCabinets.slice(0, 8)
})

const selectedCabinetName = computed(() => {
  if (!cabinets.value || !Array.isArray(cabinets.value)) return ''
  const cabinet = (cabinets.value as Cabinet[]).find(c => c.cuttingNo === selectedCabinetNo.value)
  return cabinet?.cuttingName || ''
})

// 订阅轮询数据：cabinet-status
const dataStore = useDataStore()
watch(
  () => dataStore.getData('cabinet-status'),
  (payload) => {
    const rows = (payload as any)?.rows || []
    // 同步到卡片数据
    cabinets.value = rows as Cabinet[]
  },
  { immediate: true }
)

// 监听柜体数据变化，自动选择第一个在线柜体
watch([cabinets, mode], ([newCabinets, newMode]) => {
  // 添加更多安全检查
  if (!newCabinets || !Array.isArray(newCabinets) || newCabinets.length === 0) return
  if (newMode !== 'full') return
  if (selectedCabinetNo.value) return // 已经有选中的柜体

  // 使用nextTick确保组件已完全渲染
  nextTick(() => {
    try {
      // 优先选择在线柜体，如果没有在线的就选择第一个
      const onlineCabinet = newCabinets.find(c => c && c.isOnline === '1')
      const targetCabinet = onlineCabinet || newCabinets[0]

      if (targetCabinet && targetCabinet.cuttingNo) {
        selectedCabinetNo.value = targetCabinet.cuttingNo
        loadCabinetSlots()
      }
    } catch (err) {
      console.error('Error in cabinet auto-selection:', err)
    }
  })
}, { flush: 'post' })

// 方法
const formatLastSeen = (timestamp: string) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / (1000 * 60))
  
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}小时前`
  const days = Math.floor(hours / 24)
  return `${days}天前`
}

// 计算库存百分比
const getProgressPercentage = (slot: any) => {
  if (!slot.inventory || slot.inventory === 0) return 0
  return Math.min(100, (slot.surplus / slot.inventory) * 100)
}

// 获取库存状态
const getSlotStatus = (slot: any) => {
  if (!slot.boxInfoVo?.productName || slot.surplus === 0) return 'empty'

  const percentage = getProgressPercentage(slot)
  if (percentage >= 90) return 'full'      // 满 (>=90%)
  if (percentage >= 30) return 'normal'    // 正常 (30-89%)
  return 'low'                             // 低库存 (<30%)
}

// 获取卡片状态类名
const getSlotStatusClass = (slot: any) => {
  const status = getSlotStatus(slot)
  return `slot-${status}`
}

// 获取进度条类名
const getProgressBarClass = (slot: any) => {
  const status = getSlotStatus(slot)
  return `progress-${status}`
}

const getSlotTooltip = (slot: any) => {
  if (slot.boxInfoVo && slot.boxInfoVo.productName) {
    const material = slot.boxInfoVo
    const percentage = getProgressPercentage(slot)
    return `${material.productName}\n规格: ${material.specification || '未知'}\n品牌: ${material.brandName || '未知'}\n库存: ${slot.surplus}/${slot.inventory} (${percentage.toFixed(1)}%)`
  }
  return `空货道\n容量: ${slot.inventory}`
}



const loadCabinetSlots = async () => {
  if (!selectedCabinetNo.value) {
    cabinetSlots.value = []
    return
  }

  try {
    const response = await api.cabinet.getCabinetSlots(selectedCabinetNo.value)

    if (response.code === 'OK' && response.data) {
      // 处理两种可能的数据结构
      let slots: any[] = []
      if (Array.isArray(response.data)) {
        // 直接是数组
        slots = response.data
      } else if (response.data.itemList && Array.isArray(response.data.itemList)) {
        // 嵌套在itemList中
        slots = response.data.itemList
      }

      cabinetSlots.value = slots
    } else {
      throw new Error(response.message || '获取货道信息失败')
    }
  } catch (err: any) {
    // 只在组件仍然挂载时才emit错误
    if (emit) {
      emit('error', err.message || '网络错误')
    }
    console.error('Failed to fetch cabinet slots:', err)
    cabinetSlots.value = []
  }
}

const handleRefresh = () => {
  refresh()
  if (selectedCabinetNo.value) {
    loadCabinetSlots()
  }
  emit('refresh')
}

const handleSettings = () => {
  emit('settings')
}
</script>

<style scoped>
/* Mini 视图样式 */
.mini-view {
  @apply h-full flex items-center justify-center;
  padding: 0.75rem;
  min-height: 0; /* 允许flex收缩 */
}

.status-summary {
  @apply flex items-center;
  gap: clamp(0.5rem, 3vw, 1rem); /* 响应式间距 */
}

.status-item {
  @apply text-center flex-shrink-0;
  min-width: 0; /* 允许内容收缩 */
}

.status-label {
  @apply mt-1 leading-tight;
  color: var(--color-text-secondary);
  /* 响应式字体大小 */
  font-size: clamp(0.625rem, 2.5vw, 0.75rem);
  /* 中文字体优化 */
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  letter-spacing: 0.02em;
  /* 防止换行 */
  white-space: nowrap;
}

.status-count {
  @apply font-semibold leading-tight;
  /* 响应式字体大小 */
  font-size: clamp(1.25rem, 4vw, 2rem);
  /* 中文数字字体优化 */
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  letter-spacing: -0.02em;
  /* 防止数字换行 */
  white-space: nowrap;
}

.status-item.online .status-count {
  @apply text-green-500;
}

.status-item.offline .status-count {
  @apply text-red-500;
}

.status-divider {
  @apply flex-shrink-0;
  background-color: var(--color-text-secondary);
  opacity: 0.3;
  width: 1px;
  height: clamp(2rem, 8vw, 3rem); /* 响应式分隔线高度 */
}

/* Compact 视图样式 */
.compact-view {
  @apply h-full flex flex-col;
  padding: 1rem;
}

.compact-header {
  @apply mb-4 flex justify-between items-center;
}

.compact-summary {
  @apply flex space-x-3 text-sm;
}

.online-count {
  @apply text-green-500 font-medium;
}

.offline-count {
  @apply text-red-500 font-medium;
}

.compact-title {
  @apply text-lg font-medium;
  color: var(--color-text);
}

.cabinet-list {
  @apply flex-1 space-y-3 overflow-y-auto custom-scrollbar;
}

.cabinet-item {
  @apply flex items-center space-x-3 p-2 rounded-lg transition-colors;
  opacity: 0.8;
}

.cabinet-item:hover {
  background-color: var(--color-surface);
  opacity: 1;
  transform: translateY(-1px);
}

.status-indicator {
  @apply flex items-center justify-center;
}

.status-dot {
  @apply w-3 h-3 rounded-full;
}

.status-indicator.online .status-dot {
  @apply bg-green-500;
}

.status-indicator.offline .status-dot {
  @apply bg-red-500;
}

.cabinet-info {
  @apply flex-1;
}

.cabinet-name {
  @apply font-medium text-sm;
  color: var(--color-text);
}

.cabinet-code {
  @apply text-xs mt-1;
  color: var(--color-text-secondary);
}

.last-seen {
  @apply text-xs;
  color: var(--color-text-secondary);
}

/* Full 视图样式 */
.full-view {
  @apply h-full flex flex-col;
  padding: 1rem;
}

.full-header {
  @apply flex items-center justify-between mb-4;
}

.cabinet-selector {
  @apply flex items-center;
}

.cabinet-select {
  @apply px-3 py-2 border rounded-lg text-sm;
  background-color: var(--color-surface);
  border-color: var(--color-text-secondary);
  color: var(--color-text);
  opacity: 0.8;
}

.cabinet-select:hover {
  opacity: 1;
  border-color: var(--color-primary);
}

.cabinet-select:focus {
  outline: none;
  border-color: var(--color-primary);
  opacity: 1;
}

.full-title {
  @apply text-lg font-medium;
  color: var(--color-text);
}

.slots-container {
  @apply flex-1;
  min-height: 0; /* 确保flex子项可以收缩 */
}

.slots-virtual-grid {
  @apply w-full h-full;
  min-height: 0; /* 确保能够收缩和扩展 */
}

/* 保留原有的网格样式作为备用 */
.slots-grid {
  @apply grid grid-cols-4 gap-3;
}

/* 货道卡片基础样式 */
.slot-item {
  width: 120px;
  height: 100px;
  padding: 8px;
  box-sizing: border-box;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  transition: all 0.2s ease;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

/* 状态颜色 - 保持固定颜色，只适配边框 */
.slot-empty {
  background-color: #f1f5f9;
  border: 2px solid #94a3b8;
  opacity: 0.6;
}

.slot-full {
  background-color: #dcfce7;
  border: 2px solid #16a34a;
  opacity: 0.9;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.2);
}

.slot-normal {
  background-color: #dbeafe;
  border: 2px solid #2563eb;
  opacity: 0.9;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2);
}

.slot-low {
  background-color: #fef3c7;
  border: 2px solid #d97706;
  opacity: 0.9;
  box-shadow: 0 2px 8px rgba(245, 158, 11, 0.2);
}

/* 深色模式下的边框和文字颜色适配 */
.theme-dark .slot-empty,
.theme-tech .slot-empty {
  border-color: #64748b;
}

.theme-dark .slot-full,
.theme-tech .slot-full {
  border-color: #10b981;
}

.theme-dark .slot-normal,
.theme-tech .slot-normal {
  border-color: #3b82f6;
}

.theme-dark .slot-low,
.theme-tech .slot-low {
  border-color: #f59e0b;
}

/* 深色模式下的文字颜色适配 - 确保在浅色背景上可见 */
.theme-dark .slot-number,
.theme-tech .slot-number {
  color: #1e293b;
}

.theme-dark .material-name,
.theme-tech .material-name {
  color: #1e293b;
}

.theme-dark .inventory-text,
.theme-tech .inventory-text {
  color: #64748b;
}

.theme-dark .empty-text,
.theme-tech .empty-text {
  color: #64748b;
}

/* 悬停效果 */
.slot-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.slot-item.empty {
  @apply border-dashed;
  border-color: var(--color-text-secondary);
  background-color: var(--color-surface);
  opacity: 0.5;
}

/* 货道号 - 最显眼 */
.slot-number {
  font-size: 14px;
  font-weight: 700;
  color: var(--color-text);
  text-align: center;
  margin-bottom: 4px;
  flex-shrink: 0;
  line-height: 1;
}

/* 卡片主体 */
.slot-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 0;
}

/* 物料内容区域 */
.material-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

/* 物料名称 - 次要显眼 */
.material-name {
  font-size: 11px;
  font-weight: 500;
  color: var(--color-text);
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
  line-height: 1.2;
}

/* 库存区域 */
.inventory-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  width: 100%;
}

/* 库存数字 - 最小 */
.inventory-text {
  font-size: 10px;
  font-weight: 600;
  color: var(--color-text-secondary);
  font-family: 'Courier New', monospace;
}

/* 进度条容器 */
.progress-container {
  width: 100%;
  height: 4px;
  background-color: var(--color-text-secondary);
  opacity: 0.2;
  border-radius: 2px;
  overflow: hidden;
}

/* 进度条 */
.progress-bar {
  height: 100%;
  border-radius: 2px;
  transition: all 0.3s ease;
}

.progress-full {
  background: linear-gradient(90deg, #22c55e, #16a34a);
}

.progress-normal {
  background: linear-gradient(90deg, #3b82f6, #2563eb);
}

.progress-low {
  background: linear-gradient(90deg, #f97316, #ea580c);
}

.inventory-info .current {
  @apply font-mono;
}

.inventory-info .separator {
  @apply mx-1;
}

.inventory-info .capacity {
  @apply font-mono;
}

/* 空状态和无选择状态样式 */
.empty-state,
.no-selection {
  @apply flex flex-col items-center justify-center py-8 text-center;
  color: var(--color-text-secondary);
}

.empty-icon {
  @apply w-12 h-12 mb-2 text-gray-400;
  stroke-width: 1.5;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .slots-grid {
    @apply grid-cols-2;
  }
}

@media (max-width: 480px) {
  .slots-grid {
    @apply grid-cols-1;
  }
}

/* 空状态内容 */
.empty-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  height: 100%;
}

.empty-icon {
  font-size: 20px;
  opacity: 0.6;
  filter: grayscale(100%);
}

.empty-text {
  font-size: 11px;
  font-weight: 500;
  color: #9ca3af;
}
</style>
