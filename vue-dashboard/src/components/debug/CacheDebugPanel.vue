<template>
  <div class="cache-debug-panel">
    <!-- 头部控制区 -->
    <div class="debug-header">
      <h3 class="debug-title">🔍 缓存调试面板</h3>
      <div class="debug-controls">
        <button 
          @click="toggleMonitoring" 
          :class="['btn', isMonitoring ? 'btn-danger' : 'btn-success']"
        >
          {{ isMonitoring ? '停止监控' : '开始监控' }}
        </button>
        <button @click="refreshStats" class="btn btn-primary">刷新统计</button>
        <button @click="clearCache" class="btn btn-warning">清理缓存</button>
        <button @click="exportData" class="btn btn-info">导出数据</button>
      </div>
    </div>

    <!-- 实时统计 -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">总命中率</div>
        <div class="stat-value" :class="getHitRateClass(overallHitRate)">
          {{ (overallHitRate * 100).toFixed(1) }}%
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-label">总缓存项</div>
        <div class="stat-value">{{ totalItems }}</div>
      </div>
      
      <div class="stat-card">
        <div class="stat-label">总大小</div>
        <div class="stat-value">{{ formatBytes(totalSize) }}</div>
      </div>
      
      <div class="stat-card">
        <div class="stat-label">平均响应时间</div>
        <div class="stat-value">{{ averageResponseTime.toFixed(1) }}ms</div>
      </div>
    </div>

    <!-- 分层统计 -->
    <div class="layer-stats">
      <h4>分层缓存统计</h4>
      <div class="layer-grid">
        <div 
          v-for="(stat, layer) in layerStats" 
          :key="layer"
          class="layer-card"
        >
          <div class="layer-header">
            <span class="layer-name">{{ getLayerDisplayName(layer) }}</span>
            <span class="layer-status" :class="getLayerStatusClass(stat.hitRate)">
              {{ stat.hitRate > 0.7 ? '良好' : stat.hitRate > 0.4 ? '一般' : '较差' }}
            </span>
          </div>
          
          <div class="layer-metrics">
            <div class="metric">
              <span class="metric-label">命中率:</span>
              <span class="metric-value">{{ (stat.hitRate * 100).toFixed(1) }}%</span>
            </div>
            <div class="metric">
              <span class="metric-label">项目数:</span>
              <span class="metric-value">{{ stat.totalItems }}</span>
            </div>
            <div class="metric">
              <span class="metric-label">大小:</span>
              <span class="metric-value">{{ formatBytes(stat.totalSize) }}</span>
            </div>
            <div class="metric">
              <span class="metric-label">命中:</span>
              <span class="metric-value text-green">{{ stat.hitCount }}</span>
            </div>
            <div class="metric">
              <span class="metric-label">未命中:</span>
              <span class="metric-value text-red">{{ stat.missCount }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 热点键统计 -->
    <div class="hot-keys">
      <h4>热点键 Top 10</h4>
      <div class="hot-keys-list">
        <div 
          v-for="(keyData, index) in topKeys" 
          :key="keyData.key"
          class="hot-key-item"
        >
          <div class="key-rank">{{ index + 1 }}</div>
          <div class="key-info">
            <div class="key-name">{{ keyData.key }}</div>
            <div class="key-stats">
              命中: {{ keyData.hits }} | 未命中: {{ keyData.misses }} | 
              命中率: {{ (keyData.hitRate * 100).toFixed(1) }}%
            </div>
          </div>
          <div class="key-total">{{ keyData.total }}</div>
        </div>
      </div>
    </div>

    <!-- 实时事件流 -->
    <div class="event-stream">
      <h4>实时事件流</h4>
      <div class="event-controls">
        <label>
          <input v-model="autoScroll" type="checkbox"> 自动滚动
        </label>
        <button @click="clearEvents" class="btn btn-sm">清理事件</button>
      </div>
      
      <div ref="eventContainer" class="event-container">
        <div 
          v-for="event in recentEvents" 
          :key="event.timestamp"
          class="event-item"
          :class="getEventClass(event.type)"
        >
          <span class="event-time">{{ formatTime(event.timestamp) }}</span>
          <span class="event-type">{{ event.type.toUpperCase() }}</span>
          <span class="event-layer">{{ event.layer }}</span>
          <span class="event-key">{{ event.key }}</span>
          <span v-if="event.metadata?.duration" class="event-duration">
            {{ event.metadata.duration.toFixed(1) }}ms
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { getCacheMonitor } from '@/services/cache/CacheMonitor'
import { getCacheStatistics } from '@/services/cache'
import type { CacheStats, CacheLayer, CacheEvent } from '@/services/cache/types'

// 响应式数据
const isMonitoring = ref(false)
const layerStats = ref<Record<CacheLayer, CacheStats>>({} as any)
const topKeys = ref<any[]>([])
const recentEvents = ref<CacheEvent[]>([])
const autoScroll = ref(true)

// 计算属性
const overallHitRate = ref(0)
const totalItems = ref(0)
const totalSize = ref(0)
const averageResponseTime = ref(0)

// 引用
const eventContainer = ref<HTMLElement>()

// 监控实例
const monitor = getCacheMonitor()

// 定时器
let refreshTimer: ReturnType<typeof setInterval> | null = null

// 方法
const toggleMonitoring = () => {
  if (isMonitoring.value) {
    monitor.stopMonitoring()
    isMonitoring.value = false
  } else {
    monitor.startMonitoring()
    isMonitoring.value = true
  }
}

const refreshStats = async () => {
  try {
    // 获取缓存统计
    const stats = await getCacheStatistics()
    layerStats.value = stats.layers
    totalItems.value = stats.summary.totalItems
    totalSize.value = stats.summary.totalSize
    overallHitRate.value = stats.summary.overallHitRate

    // 获取监控数据
    const realTimeStats = monitor.getRealTimeStats()
    topKeys.value = monitor.getTopKeys(10)
    recentEvents.value = realTimeStats.recentEvents

    // 计算平均响应时间
    const metrics = await monitor.getMetrics()
    averageResponseTime.value = metrics.performance.averageGetTime
  } catch (error) {
    console.error('刷新统计失败:', error)
  }
}

const clearCache = async () => {
  if (confirm('确定要清理所有缓存吗？')) {
    const { getCacheManager } = await import('@/services/cache')
    const cacheManager = getCacheManager()
    await cacheManager.clear()
    await refreshStats()
    alert('缓存已清理')
  }
}

const exportData = async () => {
  try {
    const data = await monitor.exportStats()
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cache-stats-${new Date().toISOString().slice(0, 19)}.json`
    a.click()
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('导出数据失败:', error)
  }
}

const clearEvents = () => {
  monitor.clearMonitoringData()
  recentEvents.value = []
}

// 工具函数
const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatTime = (timestamp: number): string => {
  return new Date(timestamp).toLocaleTimeString()
}

const getLayerDisplayName = (layer: string): string => {
  const names: Record<string, string> = {
    memory: '内存缓存',
    localStorage: '本地存储',
    indexedDB: 'IndexedDB',
    http: 'HTTP缓存'
  }
  return names[layer] || layer
}

const getHitRateClass = (rate: number): string => {
  if (rate > 0.8) return 'text-green'
  if (rate > 0.6) return 'text-yellow'
  return 'text-red'
}

const getLayerStatusClass = (rate: number): string => {
  if (rate > 0.7) return 'status-good'
  if (rate > 0.4) return 'status-ok'
  return 'status-poor'
}

const getEventClass = (type: string): string => {
  const classes: Record<string, string> = {
    hit: 'event-hit',
    miss: 'event-miss',
    set: 'event-set',
    delete: 'event-delete',
    evict: 'event-evict',
    cleanup: 'event-cleanup'
  }
  return classes[type] || ''
}

// 监听自动滚动
watch(recentEvents, () => {
  if (autoScroll.value) {
    nextTick(() => {
      if (eventContainer.value) {
        eventContainer.value.scrollTop = eventContainer.value.scrollHeight
      }
    })
  }
}, { deep: true })

// 生命周期
onMounted(() => {
  refreshStats()
  
  // 每2秒刷新一次统计
  refreshTimer = setInterval(refreshStats, 2000)
  
  // 检查监控状态
  isMonitoring.value = true // 假设默认开启
})

onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
  }
})
</script>

<style scoped>
.cache-debug-panel {
  @apply p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

.debug-header {
  @apply flex justify-between items-center mb-6 pb-4 border-b border-gray-200 dark:border-gray-700;
}

.debug-title {
  @apply text-xl font-bold text-gray-800 dark:text-gray-200;
}

.debug-controls {
  @apply flex gap-2;
}

.btn {
  @apply px-3 py-1 rounded text-sm font-medium transition-colors;
}

.btn-success { @apply bg-green-500 text-white hover:bg-green-600; }
.btn-danger { @apply bg-red-500 text-white hover:bg-red-600; }
.btn-primary { @apply bg-blue-500 text-white hover:bg-blue-600; }
.btn-warning { @apply bg-yellow-500 text-white hover:bg-yellow-600; }
.btn-info { @apply bg-cyan-500 text-white hover:bg-cyan-600; }
.btn-sm { @apply px-2 py-1 text-xs; }

.stats-grid {
  @apply grid grid-cols-4 gap-4 mb-6;
}

.stat-card {
  @apply bg-gray-50 dark:bg-gray-700 p-4 rounded-lg text-center;
}

.stat-label {
  @apply text-sm text-gray-600 dark:text-gray-400 mb-1;
}

.stat-value {
  @apply text-2xl font-bold text-gray-800 dark:text-gray-200;
}

.layer-stats {
  @apply mb-6;
}

.layer-grid {
  @apply grid grid-cols-2 gap-4;
}

.layer-card {
  @apply bg-gray-50 dark:bg-gray-700 p-4 rounded-lg;
}

.layer-header {
  @apply flex justify-between items-center mb-3;
}

.layer-name {
  @apply font-semibold text-gray-800 dark:text-gray-200;
}

.layer-status {
  @apply px-2 py-1 rounded text-xs font-medium;
}

.status-good { @apply bg-green-100 text-green-800; }
.status-ok { @apply bg-yellow-100 text-yellow-800; }
.status-poor { @apply bg-red-100 text-red-800; }

.layer-metrics {
  @apply grid grid-cols-2 gap-2 text-sm;
}

.metric {
  @apply flex justify-between;
}

.metric-label {
  @apply text-gray-600 dark:text-gray-400;
}

.metric-value {
  @apply font-medium text-gray-800 dark:text-gray-200;
}

.hot-keys {
  @apply mb-6;
}

.hot-keys-list {
  @apply space-y-2;
}

.hot-key-item {
  @apply flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded;
}

.key-rank {
  @apply w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold;
}

.key-info {
  @apply flex-1;
}

.key-name {
  @apply font-medium text-gray-800 dark:text-gray-200 truncate;
}

.key-stats {
  @apply text-xs text-gray-600 dark:text-gray-400;
}

.key-total {
  @apply font-bold text-gray-800 dark:text-gray-200;
}

.event-stream {
  @apply mb-6;
}

.event-controls {
  @apply flex justify-between items-center mb-3;
}

.event-container {
  @apply h-64 overflow-y-auto custom-scrollbar bg-gray-50 dark:bg-gray-700 rounded p-3 space-y-1;
}

.event-item {
  @apply flex gap-2 text-xs font-mono p-1 rounded;
}

.event-hit { @apply bg-green-100 text-green-800; }
.event-miss { @apply bg-red-100 text-red-800; }
.event-set { @apply bg-blue-100 text-blue-800; }
.event-delete { @apply bg-yellow-100 text-yellow-800; }
.event-evict { @apply bg-purple-100 text-purple-800; }
.event-cleanup { @apply bg-gray-100 text-gray-800; }

.text-green { @apply text-green-600; }
.text-yellow { @apply text-yellow-600; }
.text-red { @apply text-red-600; }

h4 {
  @apply text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3;
}
</style>
