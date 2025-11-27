<template>
  <BaseCard
    :card-id="cardId"
    :title="cardTitle"
    :mode="mode"
    :loading="!dataLoaded"
    :error="apiError"
    :mode-locked="props.modeLocked"
    :forced-mode="props.forcedMode"
    @refresh="handleRefresh"
    @settings="handleSettings"
  >
    <!-- Mini 视图 (1x1 或 2x1) -->
    <template v-if="mode === 'mini'">
      <div class="mini-view">
        <div v-if="apiError" class="error-state">
          <div class="error-icon">⚠️</div>
          <div class="error-message">连接失败</div>
        </div>
        <div v-else class="mini-metrics">
          <div class="mini-metric in">
            <div class="mini-value in-value">{{ todayInCount }}</div>
            <div class="mini-label">今日入库</div>
          </div>
          <div class="mini-divider"></div>
          <div class="mini-metric out">
            <div class="mini-value out-value">{{ todayOutCount }}</div>
            <div class="mini-label">今日出库</div>
          </div>
        </div>
      </div>
    </template>

    <!-- Compact 视图 (3x2 ~ 4x3) -->
    <template v-else-if="mode === 'compact'">
      <div class="compact-view">
        <div class="compact-header">
          <h3 class="compact-title">{{ compactTitle }}</h3>
          <div v-if="!apiError" class="week-summary">
            <span class="summary-item in">入库: {{ compactInTotal }}</span>
            <span class="summary-item out">出库: {{ compactOutTotal }}</span>
          </div>
        </div>
        <div class="chart-container">
          <div v-if="apiError" class="error-state">
            <div class="error-icon">⚠️</div>
            <div class="error-message">连接失败</div>
            <div class="error-detail">{{ apiError }}</div>
          </div>
          <v-chart
            v-else-if="compactTrendData.length > 0"
            class="trend-chart"
            :option="compactChartOption"
            autoresize
          />
          <EmptyState v-else description="暂无数据" icon="📈" size="sm" />
        </div>
      </div>
    </template>

    <!-- Full 视图 (4x3+) -->
    <template v-else-if="mode === 'full'">
      <div class="full-view">
        <div class="full-header">
          <h3 class="full-title">出入库详细分析</h3>
          <div class="time-selector">
            <select v-model="selectedTimeRange" @change="loadFullData" class="time-select">
              <option value="7">最近7天</option>
              <option value="15">最近15天</option>
              <option value="30">最近30天</option>
            </select>
          </div>
        </div>
        
        <div v-if="apiError" class="error-state full-error">
          <div class="error-icon">⚠️</div>
          <div class="error-message">连接失败</div>
          <div class="error-detail">{{ apiError }}</div>
          <button @click="handleRefresh" class="retry-button">重试</button>
        </div>

        <div v-else class="full-content">
          <div class="trend-section">
            <v-chart
              v-if="fullTrendData.length > 0"
              class="full-trend-chart"
              :option="fullChartOption"
              autoresize
            />
            <EmptyState v-else description="暂无趋势数据" icon="📊" size="md" />
          </div>

          <div class="ranking-section">
            <h4 class="ranking-title">{{ rankingTitle }}</h4>
            <div class="ranking-table">
              <table v-if="topMaterials.length > 0" class="top-materials-table">
                <thead>
                  <tr>
                    <th>排名</th>
                    <th>物料名称</th>
                    <th>规格</th>
                    <th>出库数量</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(material, index) in topMaterials" :key="material.id" class="material-row">
                    <td class="rank-cell">
                      <span class="rank-badge" :class="`rank-${index + 1}`">{{ index + 1 }}</span>
                    </td>
                    <td class="name-cell">{{ material.productName }}</td>
                    <td class="spec-cell">{{ material.specification }}</td>
                    <td class="count-cell">{{ material.inCount }}</td>
                  </tr>
                </tbody>
              </table>
              <EmptyState v-else description="暂无排行数据" icon="📋" size="sm" />
            </div>
          </div>
        </div>
      </div>
    </template>
  </BaseCard>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
} from 'echarts/components'
import VChart from 'vue-echarts'
import BaseCard from './BaseCard.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { useBaseCard } from '@/composables/useBaseCard'
import { useThemeStore } from '@/stores/theme'
import api from '@/services/api'
import cachedApi from '@/services/cachedApi'
import { useDataStore } from '@/stores/data'
import type { BaseCardProps, BaseCardEmits } from '@/types/card'

// 注册 ECharts 组件
use([
  CanvasRenderer,
  LineChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
])

// Props和Events使用统一接口
const props = defineProps<BaseCardProps>()
const emit = defineEmits<BaseCardEmits>()

// 使用通用卡片逻辑
const {
  mode,
  isMini,
  isCompact,
  isFull,
  cardTitle
} = useBaseCard(props, emit, {
  // InOutTrendCard 使用自定义数据加载逻辑，所以不提供 fetcher
  titles: {
    mini: '出入库',
    compact: '出入库趋势',
    full: '出入库分析',
    default: '出入库趋势'
  }
})

// 使用主题store
const themeStore = useThemeStore()

// 响应式数据
const todayInCount = ref(0)
const todayOutCount = ref(0)
const weekInTotal = ref(0)
const weekOutTotal = ref(0)
const weekTrendData = ref<any[]>([])
const fullTrendData = ref<any[]>([])
const topMaterials = ref<any[]>([])
const selectedTimeRange = ref('30')
const rankingTitle = computed(() => {
  const days = parseInt(selectedTimeRange.value)
  return `最近${days}天出库物料 Top 5`
})

// Compact 视图标题根据 Full 的选择动态变化
const compactTitle = computed(() => {
  const days = parseInt(selectedTimeRange.value)
  return `最近${days}天趋势`
})

// 数据加载状态
const dataLoaded = ref(false)
const apiError = ref<string | null>(null)

// Compact 视图趋势图配置（根据选择周期动态渲染）
const compactChartOption = computed(() => {
  // 使用响应式的主题状态
  const isDark = themeStore.isDarkMode
  
  const textColor = isDark ? '#ffffff' : '#666666'
  const successColor = isDark ? '#10b981' : '#10b981'
  const dangerColor = isDark ? '#ef4444' : '#ef4444'
  
  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        lineStyle: {
          color: isDark ? '#64748b' : '#94a3b8',
          width: 1,
          type: 'dashed'
        },
        crossStyle: {
          color: isDark ? '#64748b' : '#94a3b8',
          width: 1,
          type: 'dashed'
        }
      },
      backgroundColor: isDark ? '#1e293b' : '#ffffff',
      borderColor: isDark ? '#475569' : '#e2e8f0',
      textStyle: {
        color: isDark ? '#f1f5f9' : '#1e293b'
      }
    },
    legend: {
      data: ['入库', '出库'],
      top: 0,
      textStyle: {
        fontSize: 12,
        color: textColor
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: compactTrendData.value.map(item => item.date),
      axisLabel: {
        fontSize: 11,
        color: textColor
      },
      axisLine: {
        lineStyle: {
          color: textColor
        }
      }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        fontSize: 11,
        color: textColor
      },
      axisLine: {
        lineStyle: {
          color: textColor
        }
      },
      splitLine: {
        lineStyle: {
          color: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
        }
      }
    },
    series: [
      {
        name: '入库',
        type: 'line',
        data: compactTrendData.value.map(item => item.inCount),
        smooth: true,
        itemStyle: {
          color: successColor
        },
        lineStyle: {
          color: successColor
        }
      },
      {
        name: '出库',
        type: 'line',
        data: compactTrendData.value.map(item => item.outCount),
        smooth: true,
        itemStyle: {
          color: dangerColor
        },
        lineStyle: {
          color: dangerColor
        }
      }
    ]
  }
})

// 计算属性 - Full视图趋势图配置
const fullChartOption = computed(() => {
  // 使用响应式的主题状态
  const isDark = themeStore.isDarkMode
  
  const textColor = isDark ? '#ffffff' : '#666666'
  const successColor = isDark ? '#10b981' : '#10b981'
  const dangerColor = isDark ? '#ef4444' : '#ef4444'
  
  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        lineStyle: {
          color: isDark ? '#64748b' : '#94a3b8',
          width: 1,
          type: 'dashed'
        },
        crossStyle: {
          color: isDark ? '#64748b' : '#94a3b8',
          width: 1,
          type: 'dashed'
        }
      },
      backgroundColor: isDark ? '#1e293b' : '#ffffff',
      borderColor: isDark ? '#475569' : '#e2e8f0',
      textStyle: {
        color: isDark ? '#f1f5f9' : '#1e293b'
      }
    },
    legend: {
      data: ['入库', '出库'],
      top: 0,
      textStyle: {
        color: textColor
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '12%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: fullTrendData.value.map(item => item.date),
      axisLabel: {
        color: textColor
      },
      axisLine: {
        lineStyle: {
          color: textColor
        }
      }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        color: textColor
      },
      axisLine: {
        lineStyle: {
          color: textColor
        }
      },
      splitLine: {
        lineStyle: {
          color: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
        }
      }
    },
    series: [
      {
        name: '入库',
        type: 'line',
        data: fullTrendData.value.map(item => item.inCount),
        smooth: true,
        itemStyle: {
          color: successColor
        },
        lineStyle: {
          color: successColor
        }
      },
      {
        name: '出库',
        type: 'line',
        data: fullTrendData.value.map(item => item.outCount),
        smooth: true,
        itemStyle: {
          color: dangerColor
        },
        lineStyle: {
          color: dangerColor
        }
      }
    ]
  }
})

// 工具函数
const formatDate = (date: Date): string => {
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  return `${month}-${day}`
}

const formatDateForAPI = (date: Date): string => {
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  const seconds = date.getSeconds().toString().padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

const getDateRange = (days: number): { start: string, end: string } => {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  // 开始时间：days天前的00:00:00
  const start = new Date(today)
  start.setDate(start.getDate() - days + 1)
  start.setHours(0, 0, 0, 0)

  // 结束时间：今天的23:59:59
  const end = new Date(today)
  end.setHours(23, 59, 59, 999)

  return {
    start: formatDateForAPI(start),
    end: formatDateForAPI(end)
  }
}

// 数据加载方法
const loadTodayData = async () => {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  // 今天的开始时间：00:00:00
  const startOfDay = new Date(today)
  startOfDay.setHours(0, 0, 0, 0)

  // 今天的结束时间：23:59:59
  const endOfDay = new Date(today)
  endOfDay.setHours(23, 59, 59, 999)

  // 获取今日领用记录（出库）
  const pickupResponse = await api.pickup.getPickupsByBorrowTime(
    formatDateForAPI(startOfDay),
    formatDateForAPI(endOfDay),
    1,
    100
  )
  const pickupRecords = pickupResponse.data?.rows || []

  // 计算今日出库总数
  todayOutCount.value = pickupRecords.reduce((sum, record) => sum + (record.payNum || 0), 0)

  // 注意：入库数据需要从物料库存出入库API获取
  // 这里暂时设为0，等待真实的入库API集成
  todayInCount.value = 0
}

const loadWeekData = async () => {
  const { start, end } = getDateRange(7)

  // 获取7天的领用记录
  const pickupResponse = await api.pickup.getPickupsByBorrowTime(start, end, 1, 500)
  const pickupRecords = pickupResponse.data?.rows || []

  // 按日期聚合数据
  const dailyData = new Map<string, { inCount: number, outCount: number }>()

  // 初始化7天的数据
  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateKey = formatDate(date)
    dailyData.set(dateKey, { inCount: 0, outCount: 0 })
  }

  // 聚合出库数据
  pickupRecords.forEach(record => {
    if (record.payTime) {
      const recordDate = new Date(record.payTime)
      const dateKey = formatDate(recordDate)
      const existing = dailyData.get(dateKey)
      if (existing) {
        existing.outCount += record.payNum || 0
      }
    }
  })

  // 入库数据暂时为0，等待真实API集成
  // dailyData中的inCount保持为0

  // 转换为图表数据格式
  weekTrendData.value = Array.from(dailyData.entries()).map(([date, data]) => ({
    date,
    inCount: data.inCount,
    outCount: data.outCount
  }))

  // 计算周总计
  weekInTotal.value = weekTrendData.value.reduce((sum, item) => sum + item.inCount, 0)
  weekOutTotal.value = weekTrendData.value.reduce((sum, item) => sum + item.outCount, 0)
}

const loadFullData = async () => {
  const days = parseInt(selectedTimeRange.value)
  const { start, end } = getDateRange(days)

  // 获取指定天数的领用记录
  const pickupResponse = await api.pickup.getPickupsByBorrowTime(start, end, 1, 500)
  const pickupRecords = pickupResponse.data?.rows || []

  // 按日期聚合趋势数据
  const dailyData = new Map<string, { inCount: number, outCount: number }>()

  // 初始化日期数据
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateKey = formatDate(date)
    dailyData.set(dateKey, { inCount: 0, outCount: 0 })
  }

  // 聚合出库数据
  pickupRecords.forEach(record => {
    if (record.payTime) {
      const recordDate = new Date(record.payTime)
      const dateKey = formatDate(recordDate)
      const existing = dailyData.get(dateKey)
      if (existing) {
        existing.outCount += record.payNum || 0
      }
    }
  })

  // 入库数据暂时为0，等待真实API集成
  // dailyData中的inCount保持为0

  // 转换为图表数据
  fullTrendData.value = Array.from(dailyData.entries()).map(([date, data]) => ({
    date,
    inCount: data.inCount,
    outCount: data.outCount
  }))

  // 计算Top5出库物料（基于真实领用记录）
  const materialStats = new Map<string, { productName: string, specification: string, inCount: number }>()

  pickupRecords.forEach(record => {
    const key = `${record.productName}-${record.specification}`
    const existing = materialStats.get(key)

    if (existing) {
      existing.inCount += record.payNum || 0
    } else {
      materialStats.set(key, {
        productName: record.productName,
        specification: record.specification,
        inCount: record.payNum || 0
      })
    }
  })

  // 排序并取Top5
  topMaterials.value = Array.from(materialStats.values())
    .sort((a, b) => b.inCount - a.inCount)
    .slice(0, 5)
    .map((item, index) => ({
      id: index + 1,
      ...item
    }))
}

// 事件处理
const handleRefresh = async () => {
  try {
    // 设置加载状态
    apiError.value = null
    dataLoaded.value = false

    // 清除缓存并重新加载数据
    await cachedApi.cache.clearModuleCache('pickups')
    await Promise.all([
      loadTodayData(),
      loadWeekData(),
      loadFullData()
    ])

    dataLoaded.value = true
    console.log('🔄 出入库趋势已刷新 - 今日:', todayOutCount.value, '本周:', weekOutTotal.value)
    emit('refresh')
  } catch (err: any) {
    console.error('❌ 出入库趋势刷新失败:', err.message)
    const errorMessage = err.message || '连接失败'
    apiError.value = errorMessage
    dataLoaded.value = false
    emit('error', errorMessage)
  }
}

const handleSettings = () => {
  emit('settings')
}

// 组件挂载
onMounted(() => {
  handleRefresh()
})

// 订阅轮询数据：today-pickups，用于自动更新今日入/出库指标
const dataStore = useDataStore()
const recomputeTodayFromStore = (payload: any) => {
  const rows = payload?.rows || []
  // 今日入库暂置为0（暂无入库数据来源），使用出库记录计算
  const today = new Date()
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  let outTotal = 0

  rows.forEach((record: any) => {
    if (record.payTime) {
      const d = new Date(record.payTime)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      if (key === todayKey) {
        outTotal += record.payNum || 0
      }
    }
  })

  todayInCount.value = 0
  todayOutCount.value = outTotal
}

watch(
  () => dataStore.getData('today-pickups'),
  (payload) => {
    try {
      recomputeTodayFromStore(payload as any)
    } catch (e) {
      console.warn('更新今日出入库指标失败:', e)
    }
  },
  { immediate: true }
)

// 使用轮询数据重算7/15/30天趋势
const buildDailyMap = (days: number) => {
  const map = new Map<string, { inCount: number, outCount: number }>()
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const key = formatDate(date)
    map.set(key, { inCount: 0, outCount: 0 })
  }
  return map
}

const aggregateOutCounts = (rows: any[], map: Map<string, { inCount: number, outCount: number }>) => {
  rows.forEach(record => {
    if (record.payTime) {
      const d = new Date(record.payTime)
      const key = formatDate(d)
      const slot = map.get(key)
      if (slot) {
        slot.outCount += record.payNum || 0
      }
    }
  })
}

const recomputeWeekFromStore = (payload: any) => {
  const rows = payload?.rows || []
  const daily = buildDailyMap(7)
  aggregateOutCounts(rows, daily)
  weekTrendData.value = Array.from(daily.entries()).map(([date, data]) => ({ date, inCount: data.inCount, outCount: data.outCount }))
  weekInTotal.value = weekTrendData.value.reduce((sum, d) => sum + d.inCount, 0)
  weekOutTotal.value = weekTrendData.value.reduce((sum, d) => sum + d.outCount, 0)
}

const recomputeFullFromStore = (days: number, payload: any) => {
  const rows = payload?.rows || []
  const daily = buildDailyMap(days)
  aggregateOutCounts(rows, daily)
  fullTrendData.value = Array.from(daily.entries()).map(([date, data]) => ({ date, inCount: data.inCount, outCount: data.outCount }))

  // Top 5 物料统计（基于出库记录）
  const materialStats = new Map<string, { productName: string, specification: string, inCount: number }>()
  rows.forEach(record => {
    const key = `${record.productName}-${record.specification}`
    const existing = materialStats.get(key)
    if (existing) {
      existing.inCount += record.payNum || 0
    } else {
      materialStats.set(key, {
        productName: record.productName,
        specification: record.specification,
        inCount: record.payNum || 0
      })
    }
  })
  topMaterials.value = Array.from(materialStats.values())
    .sort((a, b) => b.inCount - a.inCount)
    .slice(0, 5)
    .map((item, index) => ({ id: index + 1, ...item }))
}

// Compact 视图数据选择与汇总（7/15/30天自适应）
const compactTrendData = computed(() => selectedTimeRange.value === '7' ? weekTrendData.value : fullTrendData.value)
const fullInTotal = computed(() => fullTrendData.value.reduce((sum, d) => sum + d.inCount, 0))
const fullOutTotal = computed(() => fullTrendData.value.reduce((sum, d) => sum + d.outCount, 0))
const compactInTotal = computed(() => selectedTimeRange.value === '7' ? weekInTotal.value : fullInTotal.value)
const compactOutTotal = computed(() => selectedTimeRange.value === '7' ? weekOutTotal.value : fullOutTotal.value)

// 订阅：7天（week-pickups）用于 Compact 以及 Full 选择“7”时更新
watch(
  () => dataStore.getData('week-pickups'),
  (payload) => {
    try {
      recomputeWeekFromStore(payload as any)
      if (selectedTimeRange.value === '7') {
        recomputeFullFromStore(7, payload as any)
      }
    } catch (e) {
      console.warn('更新7天趋势失败:', e)
    }
  },
  { immediate: true }
)

// 订阅：15天
watch(
  () => dataStore.getData('15days-pickups'),
  (payload) => {
    if (selectedTimeRange.value !== '15') return
    try {
      recomputeFullFromStore(15, payload as any)
    } catch (e) {
      console.warn('更新15天趋势失败:', e)
    }
  },
  { immediate: true }
)

// 订阅：30天
watch(
  () => dataStore.getData('30days-pickups'),
  (payload) => {
    if (selectedTimeRange.value !== '30') return
    try {
      recomputeFullFromStore(30, payload as any)
    } catch (e) {
      console.warn('更新30天趋势失败:', e)
    }
  },
  { immediate: true }
)
</script>

<style scoped>
/* Mini 视图样式 */
.mini-view {
  @apply h-full flex items-center justify-center;
  padding: 0.75rem;
}

.mini-metrics {
  @apply flex items-center w-full;
  gap: clamp(0.5rem, 3vw, 1rem);
}

.mini-metric {
  @apply flex-1 text-center;
}

.mini-value {
  @apply font-bold leading-tight;
  font-size: clamp(1.25rem, 6vw, 2rem);
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

.mini-value.in-value {
  @apply text-green-500;
}

.mini-value.out-value {
  @apply text-red-500;
}

.mini-label {
  @apply text-xs mt-1;
  color: var(--color-text-secondary);
  font-size: clamp(0.6rem, 2.5vw, 0.75rem);
}

.mini-divider {
  @apply flex-shrink-0;
  background-color: var(--color-text-secondary);
  opacity: 0.3;
  width: 1px;
  height: clamp(2rem, 8vw, 3rem);
}

/* Compact 视图样式 */
.compact-view {
  @apply h-full flex flex-col;
  padding: 1rem;
}

.compact-header {
  @apply flex justify-between items-center mb-3;
}

.compact-title {
  @apply text-lg font-semibold;
  color: var(--color-text);
}

.week-summary {
  @apply flex space-x-3 text-sm;
}

.summary-item.in {
  @apply text-green-500 font-medium;
}

.summary-item.out {
  @apply text-red-500 font-medium;
}

.chart-container {
  @apply flex-1 min-h-0;
}

.trend-chart {
  @apply w-full h-full;
}

/* Full 视图样式 */
.full-view {
  @apply h-full flex flex-col;
  padding: clamp(0.5rem, 2vw, 1rem);
  container-type: inline-size; /* 启用容器查询 */
}

.full-header {
  @apply flex justify-between items-center mb-3 flex-shrink-0;
  gap: 1rem;
}

.full-title {
  @apply font-semibold flex-shrink-0;
  color: var(--color-text);
  font-size: clamp(1rem, 3vw, 1.25rem);
}

.time-selector {
  @apply flex items-center;
}

.time-select {
  @apply px-3 py-1 border rounded-md text-sm;
  background-color: var(--color-surface);
  border-color: var(--color-text-secondary);
  color: var(--color-text);
  opacity: 0.8;
}

.time-select:hover {
  opacity: 1;
  border-color: var(--color-primary);
}

.time-select:focus {
  outline: none;
  border-color: var(--color-primary);
  opacity: 1;
}

.full-content {
  @apply flex-1 min-h-0;
  display: grid;
  gap: 1rem;
  grid-template-columns: 1fr;
}

/* 响应式网格布局 - 固定比例 */
@media (min-width: 768px) {
  .full-content {
    grid-template-columns: 40% 60%; /* 图表40%，表格60% */
  }
}

/* 容器查询 - 基于卡片实际宽度调整布局 */
@container (max-width: 500px) {
  .full-content {
    grid-template-columns: 1fr;
    grid-template-rows: 1fr auto;
  }

  .ranking-section {
    min-height: 150px;
  }

  .ranking-title {
    font-size: 0.875rem;
    margin-bottom: 0.5rem;
  }
}

@container (min-width: 501px) {
  .full-content {
    grid-template-columns: 40% 60%; /* 固定比例：图表40%，表格60% */
  }
}

.trend-section {
  @apply min-h-0;
  min-height: 200px; /* 确保图表有最小高度 */
}

.full-trend-chart {
  @apply w-full h-full;
  min-height: 200px;
}

.ranking-section {
  @apply flex flex-col;
  min-height: 200px;
}

.ranking-title {
  @apply text-base font-medium mb-2 flex-shrink-0;
  color: var(--color-text);
  font-size: clamp(0.875rem, 2vw, 1.125rem);
}

.ranking-table {
  @apply flex-1 overflow-auto custom-scrollbar;
  min-height: 0;
}

.top-materials-table {
  @apply w-full;
  font-size: clamp(0.75rem, 1.5vw, 0.875rem);
}

.top-materials-table th {
  @apply px-2 py-1.5 text-left font-medium border-b;
  border-color: var(--color-text-secondary);
  color: var(--color-text-secondary);
  font-size: clamp(0.7rem, 1.4vw, 0.8rem);
  opacity: 0.8;
}

.top-materials-table td {
  @apply px-2 py-1.5 border-b;
  border-color: var(--color-text-secondary);
  color: var(--color-text);
  font-size: clamp(0.75rem, 1.5vw, 0.875rem);
  opacity: 0.8;
}

.material-row:hover {
  background-color: var(--color-surface);
  filter: brightness(1.05);
}

.material-row:hover td {
  opacity: 1;
}

.rank-cell {
  @apply text-center;
}

.rank-badge {
  @apply inline-flex items-center justify-center rounded-full font-bold text-white;
  width: clamp(1.25rem, 3vw, 1.5rem);
  height: clamp(1.25rem, 3vw, 1.5rem);
  font-size: clamp(0.6rem, 1.2vw, 0.75rem);
}

.rank-badge.rank-1 {
  @apply bg-yellow-500;
}

.rank-badge.rank-2 {
  @apply bg-gray-400;
}

.rank-badge.rank-3 {
  @apply bg-orange-500;
}

.rank-badge.rank-4,
.rank-badge.rank-5 {
  @apply bg-blue-500;
}

.name-cell {
  @apply font-medium;
}

.spec-cell {
  color: var(--color-text-secondary);
  opacity: 0.8;
}

.count-cell {
  @apply font-mono font-medium text-green-600;
}

/* 通用样式 */
.no-data {
  @apply flex items-center justify-center h-full;
  color: var(--color-text-secondary);
  font-size: 0.875rem;
}

/* 错误状态样式 */
.error-state {
  @apply flex flex-col items-center justify-center h-full text-center;
  color: var(--color-text-secondary);
}

.error-icon {
  @apply text-2xl mb-2;
}

.error-message {
  @apply font-medium text-red-500 mb-1;
  font-size: 0.875rem;
}

.error-detail {
  @apply text-xs;
  color: var(--color-text-secondary);
  opacity: 0.8;
}

.full-error {
  @apply p-8;
}

.retry-button {
  @apply mt-4 px-4 py-2 bg-blue-500 text-white rounded-md text-sm;
  @apply hover:bg-blue-600 transition-colors;
}
</style>
