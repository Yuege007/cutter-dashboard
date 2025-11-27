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
    <!-- Mini 视图 (1x1 ~ 2x2) - 轮播排行榜 -->
    <template v-if="mode === 'mini'">
      <div class="mini-view">
        <div v-if="topThreeUsers.length > 0" class="mini-ranking-carousel">
          <!-- 排名奖牌 -->
          <div class="rank-medal" :class="getMedalClass(currentRankIndex)">
            <div class="medal-icon">{{ getMedalIcon(currentRankIndex) }}</div>
          </div>

          <!-- 用户信息轮播区域 -->
          <div class="carousel-container">
            <Transition
              :name="carouselTransition"
              mode="out-in"
            >
              <div
                :key="currentRankIndex"
                class="user-slide"
              >
                <div class="user-avatar-mini">
                  <div class="avatar-bg" :class="getAvatarClass(currentRankIndex)">
                    <span class="avatar-text">{{ getCurrentUser().name.charAt(0) }}</span>
                  </div>
                </div>
                <div class="user-info-mini">
                  <div class="user-name-mini">{{ getCurrentUser().name }}</div>
                  <div class="user-count-mini">{{ getCurrentUser().totalCount }} 件</div>
                </div>
              </div>
            </Transition>
          </div>

          <!-- 导航圆点 -->
          <div class="carousel-dots">
            <div
              v-for="(user, index) in topThreeUsers"
              :key="index"
              class="dot"
              :class="{ 'dot-active': index === currentRankIndex }"
              @click="setCurrentRank(index)"
            ></div>
          </div>
        </div>

        <EmptyState
          v-else
          description="暂无排行"
          icon="🏆"
          size="sm"
        />
      </div>
    </template>

    <!-- Compact 视图 (3x2 ~ 4x3) -->
    <template v-else-if="mode === 'compact'">
      <div class="compact-view">
        <div class="compact-header">
          <h3 class="compact-title">{{ compactTitle }}</h3>
          <div class="time-range">{{ formatTimeRange(timeRange) }}</div>
        </div>
        <div class="chart-container" ref="chartContainer">
          <v-chart
            v-if="chartData.length > 0"
            :option="chartOption"
            :autoresize="true"
            class="ranking-chart"
          />
          <EmptyState
            v-else
            description="暂无排行数据"
            icon="📊"
            size="md"
          />
        </div>
      </div>
    </template>

    <!-- Full 视图 (4x3+) -->
    <template v-else>
      <div class="full-view">
        <div class="full-header">
          <h3 class="full-title">领用记录详情</h3>
          <div class="controls">
            <select v-model="selectedTimeRange" @change="handleTimeRangeChange" class="time-selector">
              <option value="today">今日</option>
              <option value="week">最近7天</option>
            </select>
          </div>
        </div>
        
        <div class="full-content">
          <!-- 统计概览 -->
          <div class="stats-overview">
            <div class="stat-item">
              <div class="stat-value">{{ totalRecords }}</div>
              <div class="stat-label">总记录数</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ totalUsers }}</div>
              <div class="stat-label">参与用户</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ totalItems }}</div>
              <div class="stat-label">领用总数</div>
            </div>
          </div>

          <!-- 详细表格 -->
          <div class="table-container">
            <table class="pickup-table">
              <thead>
                <tr>
                  <th>排名</th>
                  <th>领用人</th>
                  <th>工号</th>
                  <th class="count-header">领用数量</th>
                  <th>最近领用</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(user, index) in userRankings" :key="user.workeNo" class="table-row">
                  <td class="rank-cell">
                    <div class="rank-badge" :class="getRankClass(index)">
                      {{ index + 1 }}
                    </div>
                  </td>
                  <td class="user-cell">
                    <div class="user-info">
                      <span class="user-name">{{ user.name }}</span>
                    </div>
                  </td>
                  <td class="workno-cell">{{ user.workeNo }}</td>
                  <td class="count-cell">
                    <span class="count-value">{{ user.totalCount }}</span>
                    <span class="count-unit">件</span>
                  </td>
                  <td class="time-cell">{{ formatTime(user.lastPickupTime) }}</td>
                </tr>
              </tbody>
            </table>
            
            <EmptyState
              v-if="userRankings.length === 0"
              description="暂无领用记录"
              icon="😊"
              size="md"
            />
          </div>
        </div>
      </div>
    </template>
  </BaseCard>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, toRef, watch, Transition } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent
} from 'echarts/components'
import VChart from 'vue-echarts'
import BaseCard from './BaseCard.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { api } from '@/services/api'
import type { BaseCardProps, BaseCardEmits } from '@/types/card'
import type { PickupRecord, User } from '@/types'
import { useBaseCard } from '@/composables/useBaseCard'
import { useDataStore } from '@/stores/data'

// 注册 ECharts 组件
use([
  CanvasRenderer,
  BarChart,
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent
])

// Props和Events使用统一接口
const props = defineProps<BaseCardProps>()
const emit = defineEmits<BaseCardEmits>()

// 时间范围类型
type TimeRangeType = 'today' | 'week'

// 用户排行数据接口
interface UserRanking {
  name: string
  workeNo: string
  totalCount: number
  lastPickupTime: string
  records: PickupRecord[]
}

// 响应式数据
const selectedTimeRange = ref<TimeRangeType>('week')
const chartContainer = ref<HTMLElement>()
const userRankings = ref<UserRanking[]>([])
const allUsers = ref<User[]>([])

// Mini视图轮播相关
const currentRankIndex = ref(0)
const carouselTimer = ref<ReturnType<typeof setInterval> | null>(null)
const carouselTransition = ref('slide-fade')

// 工具函数 - 提前定义
const getTimeRange = (type: TimeRangeType) => {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  switch (type) {
    case 'today': {
      // 今日（00:00:00 - 23:59:59）
      const startDate = new Date(today)
      startDate.setHours(0, 0, 0, 0)

      const endDate = new Date(today)
      endDate.setHours(23, 59, 59, 999)

      return {
        start: formatDateTime(startDate),
        end: formatDateTime(endDate)
      }
    }
    case 'week': {
      // 最近7天（API限制不能超过7天）
      const startDate = new Date(today)
      startDate.setDate(today.getDate() - 6) // 往前6天，加上今天共7天

      const endDate = new Date(today)
      endDate.setHours(23, 59, 59, 999)

      return {
        start: formatDateTime(startDate),
        end: formatDateTime(endDate)
      }
    }
    default:
      // 默认返回最近7天
      return getTimeRange('week')
  }
}

const formatDateTime = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

// 数据获取函数
const fetchRankingData = async () => {
  const timeRange = getTimeRange(selectedTimeRange.value)


  // 并行获取领用记录和用户信息
  const [pickupResponse, userResponse] = await Promise.all([
    api.pickup.getPickupsByBorrowTime(
      timeRange.start,
      timeRange.end,
      1,
      100 // 获取更多数据用于统计
    ),
    api.user.getUsers(1, 100)
  ])

  const pickupRecords = pickupResponse.data?.rows || []
  allUsers.value = userResponse.data?.rows || []



  // 按用户聚合数据
  const userMap = new Map<string, UserRanking>()

  pickupRecords.forEach(record => {
    const key = record.payWorkeNo || record.payUserName

    if (!userMap.has(key)) {
      userMap.set(key, {
        name: record.payUserName,
        workeNo: record.payWorkeNo,
        totalCount: 0,
        lastPickupTime: record.payTime,
        records: []
      })
    }

    const userRanking = userMap.get(key)!
    userRanking.totalCount += record.payNum
    userRanking.records.push(record)

    // 更新最近领用时间
    if (new Date(record.payTime) > new Date(userRanking.lastPickupTime)) {
      userRanking.lastPickupTime = record.payTime
    }
  })

  // 转换为数组并排序
  userRankings.value = Array.from(userMap.values())
    .sort((a, b) => b.totalCount - a.totalCount)
    .slice(0, 20) // 限制显示前20名



  return userRankings.value
}

// 基于轮询数据的聚合更新（today-pickups + user-status）
const dataStore = useDataStore()
const recomputeRankingsFromStore = (pickupKey: 'today-pickups' | 'week-pickups' = 'today-pickups') => {
  try {
    const pickupsData = dataStore.getData(pickupKey)
    const usersData = dataStore.getData('user-status')

    const pickupRecords: PickupRecord[] = pickupsData?.rows || []
    allUsers.value = usersData?.rows || []

    const userMap = new Map<string, UserRanking>()
    pickupRecords.forEach(record => {
      const key = record.payWorkeNo || record.payUserName
      if (!userMap.has(key)) {
        userMap.set(key, {
          name: record.payUserName,
          workeNo: record.payWorkeNo,
          totalCount: 0,
          lastPickupTime: record.payTime,
          records: []
        })
      }
      const userRanking = userMap.get(key)!
      userRanking.totalCount += record.payNum || 0
      userRanking.records.push(record)
      if (new Date(record.payTime) > new Date(userRanking.lastPickupTime)) {
        userRanking.lastPickupTime = record.payTime
      }
    })

    userRankings.value = Array.from(userMap.values())
      .sort((a, b) => b.totalCount - a.totalCount)
      .slice(0, 20)
  } catch (error) {
    console.error('自动更新排行榜失败:', error)
  }
}

// 订阅全局轮询数据更新
watch(
  () => [dataStore.getData('today-pickups'), dataStore.getData('user-status')],
  () => {
    // 仅在选择“今日”时，使用轮询数据自动更新排行榜
    if (selectedTimeRange.value === 'today') {
      recomputeRankingsFromStore('today-pickups')
    }
  },
  { immediate: true }
)

// 订阅最近7天数据，选择“最近7天”时自动更新排行榜
watch(
  () => [dataStore.getData('week-pickups'), dataStore.getData('user-status')],
  () => {
    if (selectedTimeRange.value === 'week') {
      recomputeRankingsFromStore('week-pickups')
    }
  },
  { immediate: true }
)

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
  fetcher: fetchRankingData,
  titles: {
    mini: '领用之星',
    compact: '领用排行榜',
    full: '领用记录详情',
    default: '领用排行榜'
  }
})

const timeRange = computed(() => getTimeRange(selectedTimeRange.value))

// Compact 标题动态映射 Full 的选择（今日/最近7天）
const compactTitle = computed(() => {
  return selectedTimeRange.value === 'today'
    ? '今日领用 Top 5'
    : '最近7天领用 Top 5'
})

const topUser = computed(() => userRankings.value[0] || null)

const topThreeUsers = computed(() => userRankings.value.slice(0, 3))

const chartData = computed(() => {
  return userRankings.value.slice(0, 5).map(user => ({
    name: user.name,
    value: user.totalCount
  }))
})

const totalRecords = computed(() => {
  return userRankings.value.reduce((sum, user) => sum + user.records.length, 0)
})

const totalUsers = computed(() => userRankings.value.length)

const totalItems = computed(() => {
  return userRankings.value.reduce((sum, user) => sum + user.totalCount, 0)
})

// ECharts 配置 - 支持深色模式
const chartOption = computed(() => {
  // 获取当前主题的颜色
  const isDark = document.documentElement.classList.contains('theme-dark') || 
                 document.documentElement.classList.contains('theme-tech')
  
  const textColor = isDark ? '#94a3b8' : '#666'
  const labelColor = isDark ? '#f1f5f9' : '#333'
  const primaryColor = isDark ? '#3b82f6' : '#007AFF'
  
  return {
    grid: {
      left: '15%',
      right: '10%',
      top: '10%',
      bottom: '15%'
    },
    xAxis: {
      type: 'value',
      axisLabel: {
        fontSize: 10,
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
    yAxis: {
      type: 'category',
      data: chartData.value.map(item => item.name).reverse(),
      axisLabel: {
        fontSize: 10,
        color: textColor,
        width: 60,
        overflow: 'truncate'
      },
      axisLine: {
        lineStyle: {
          color: textColor
        }
      }
    },
    series: [{
      type: 'bar',
      data: chartData.value.map(item => item.value).reverse(),
      itemStyle: {
        color: primaryColor,
        borderRadius: [0, 4, 4, 0]
      },
      label: {
        show: true,
        position: 'right',
        fontSize: 10,
        color: labelColor
      }
    }],
    tooltip: {
      trigger: 'axis',
      backgroundColor: isDark ? '#1e293b' : '#ffffff',
      borderColor: isDark ? '#475569' : '#e2e8f0',
      textStyle: {
        color: isDark ? '#f1f5f9' : '#1e293b'
      },
      formatter: (params: any) => {
        const data = params[0]
        return `${data.name}<br/>领用数量: ${data.value} 件`
      }
    }
  }
})



const formatTimeRange = (range: { start: string; end: string }): string => {
  const startDate = new Date(range.start)
  const endDate = new Date(range.end)

  const formatDate = (date: Date) => {
    const month = date.getMonth() + 1
    const day = date.getDate()
    return `${month}/${day}`
  }

  return `${formatDate(startDate)} - ${formatDate(endDate)}`
}

const formatTime = (timeStr: string): string => {
  const date = new Date(timeStr)
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hours = date.getHours()
  const minutes = date.getMinutes()

  return `${month}/${day} ${hours}:${String(minutes).padStart(2, '0')}`
}

const getRankClass = (index: number): string => {
  if (index === 0) return 'rank-gold'
  if (index === 1) return 'rank-silver'
  if (index === 2) return 'rank-bronze'
  return 'rank-normal'
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

// Mini视图轮播相关方法
const getCurrentUser = () => {
  return topThreeUsers.value[currentRankIndex.value] || { name: '', totalCount: 0 }
}

const getMedalIcon = (index: number): string => {
  const medals = ['🥇', '🥈', '🥉']
  return medals[index] || '🏆'
}

const getMedalClass = (index: number): string => {
  const classes = ['medal-gold', 'medal-silver', 'medal-bronze']
  return classes[index] || 'medal-default'
}

const getAvatarClass = (index: number): string => {
  const classes = ['avatar-gold', 'avatar-silver', 'avatar-bronze']
  return classes[index] || 'avatar-default'
}

const setCurrentRank = (index: number) => {
  if (index >= 0 && index < topThreeUsers.value.length) {
    currentRankIndex.value = index
    resetCarouselTimer()
  }
}

const nextRank = () => {
  if (topThreeUsers.value.length > 0) {
    currentRankIndex.value = (currentRankIndex.value + 1) % topThreeUsers.value.length
  }
}

const startCarousel = () => {
  if (topThreeUsers.value.length > 1) {
    carouselTimer.value = setInterval(nextRank, 3000)
  }
}

const stopCarousel = () => {
  if (carouselTimer.value) {
    clearInterval(carouselTimer.value)
    carouselTimer.value = null
  }
}

const resetCarouselTimer = () => {
  stopCarousel()
  startCarousel()
}



// 监听模式变化，重新获取数据
watch(mode, () => {
  if (mode.value === 'full') {
    refresh()
  }
})

// 监听用户数据变化，重置轮播
watch(topThreeUsers, (newUsers) => {
  if (newUsers.length > 0) {
    currentRankIndex.value = 0
    if (mode.value === 'mini') {
      resetCarouselTimer()
    }
  }
}, { immediate: true })

// 监听模式变化，控制轮播
watch(mode, (newMode) => {
  if (newMode === 'mini') {
    startCarousel()
  } else {
    stopCarousel()
  }
})

// 组件挂载时启动轮播
onMounted(() => {
  if (mode.value === 'mini') {
    startCarousel()
  }
})

// 组件卸载时清理定时器
onUnmounted(() => {
  stopCarousel()
})
</script>

<style scoped>
/* Mini 视图样式 - 轮播排行榜 */
.mini-view {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  position: relative;
  overflow: hidden;
}

.mini-ranking-carousel {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  min-height: 0;
}

/* 排名奖牌 */
.rank-medal {
  position: absolute;
  top: 0.25rem;
  left: 0.25rem;
  z-index: 10;
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

.medal-gold {
  background: linear-gradient(135deg, #FFD700, #FFA500);
}

.medal-silver {
  background: linear-gradient(135deg, #C0C0C0, #A0A0A0);
}

.medal-bronze {
  background: linear-gradient(135deg, #CD7F32, #B8860B);
}

.medal-icon {
  font-size: 0.75rem;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
}

/* 轮播容器 */
.carousel-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: visible; /* 改为 visible，避免动画被裁剪 */
  min-height: 0;
  padding: 0.25rem 0;
  width: 100%;
}

.user-slide {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  width: 100%;
  height: 100%;
  justify-content: center;
}

/* 用户头像 */
.user-avatar-mini {
  margin-bottom: 0.375rem;
  flex-shrink: 0;
}

.avatar-bg {
  width: clamp(2rem, 6vw, 2.5rem);
  height: clamp(2rem, 6vw, 2.5rem);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15);
  position: relative;
  overflow: hidden;
}

.avatar-gold {
  background: linear-gradient(135deg, #FFD700, #FFA500);
}

.avatar-silver {
  background: linear-gradient(135deg, #C0C0C0, #A0A0A0);
}

.avatar-bronze {
  background: linear-gradient(135deg, #CD7F32, #B8860B);
}

.avatar-text {
  font-size: clamp(0.875rem, 2.5vw, 1.125rem);
  font-weight: 700;
  color: white;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

/* 用户信息 */
.user-info-mini {
  width: 100%;
  flex-shrink: 0;
}

.user-name-mini {
  font-size: clamp(0.75rem, 2.5vw, 0.875rem);
  font-weight: 600;
  color: #1d1d1f;
  margin-bottom: 0.125rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.2;
}

.user-count-mini {
  font-size: clamp(0.625rem, 2vw, 0.75rem);
  color: #86868b;
  font-weight: 500;
  line-height: 1.2;
}

/* 导航圆点 */
.carousel-dots {
  display: flex;
  justify-content: center;
  gap: 0.25rem;
  margin-top: 0.375rem;
  flex-shrink: 0;
  padding: 0.125rem 0;
}

.dot {
  width: 0.3125rem;
  height: 0.3125rem;
  border-radius: 50%;
  background: #d1d1d6;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
  flex-shrink: 0;
}

.dot:hover {
  background: #86868b;
  transform: scale(1.2);
}

.dot-active {
  background: #007AFF;
  transform: scale(1.3);
}

/* 空状态样式已移至 EmptyState 组件 */

/* 轮播动画 */
.slide-fade-enter-active {
  transition: all 0.5s cubic-bezier(0.4, 0.0, 0.2, 1);
}

.slide-fade-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
}

.slide-fade-enter-from {
  opacity: 0;
  transform: scale(0.8) translateY(10px);
}

.slide-fade-leave-to {
  opacity: 0;
  transform: scale(1.1) translateY(-10px);
}

/* 确保轮播内容在动画过程中保持可见 */
.user-slide {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: all 0.5s cubic-bezier(0.4, 0.0, 0.2, 1);
}

.slide-fade-enter-to,
.slide-fade-leave-from {
  opacity: 1;
  transform: scale(1) translateY(0);
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
  color: #1d1d1f;
  margin: 0;
}

.time-range {
  font-size: 0.75rem;
  color: #86868b;
}

.chart-container {
  flex: 1;
  min-height: 0;
  position: relative;
}

.ranking-chart {
  width: 100%;
  height: 100%;
}

/* empty-chart 和 empty-icon 样式已移至 EmptyState 组件 */

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
  color: #1d1d1f;
  margin: 0;
}

.controls {
  display: flex;
  gap: 0.5rem;
}

.time-selector {
  padding: 0.375rem 0.75rem;
  border: 1px solid #d1d1d6;
  border-radius: 8px;
  font-size: 0.875rem;
  background: white;
  color: #1d1d1f;
  cursor: pointer;
  transition: border-color 0.2s ease;
}

.time-selector:hover {
  border-color: #007AFF;
}

.time-selector:focus {
  outline: none;
  border-color: #007AFF;
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
}

.full-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

/* 统计概览 */
.stats-overview {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1rem;
  padding: 1rem;
  background: #f5f5f7;
  border-radius: 12px;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #007AFF;
  margin-bottom: 0.25rem;
}

.stat-label {
  font-size: 0.75rem;
  color: #86868b;
  font-weight: 500;
}

/* 表格样式 */
.table-container {
  flex: 1;
  overflow: auto;
  border: 1px solid #e5e5e7;
  border-radius: 12px;
  background: white;
}

/* 使用全局滚动条样式 */
.table-container {
  @apply custom-scrollbar;
}

.pickup-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.pickup-table thead {
  background: #f5f5f7;
  position: sticky;
  top: 0;
  z-index: 1;
}

.pickup-table th {
  padding: 0.75rem 1rem;
  text-align: left;
  font-weight: 600;
  color: #1d1d1f;
  border-bottom: 1px solid #e5e5e7;
  white-space: nowrap;
}

.pickup-table td {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #f0f0f0;
  vertical-align: middle;
}

.table-row:hover {
  background: #f9f9f9;
}

.rank-cell {
  width: 60px;
  text-align: center;
}

.rank-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  font-size: 0.75rem;
  font-weight: 700;
  color: white;
}

.rank-gold {
  background: linear-gradient(135deg, #FFD700, #FFA500);
}

.rank-silver {
  background: linear-gradient(135deg, #C0C0C0, #A0A0A0);
}

.rank-bronze {
  background: linear-gradient(135deg, #CD7F32, #B8860B);
}

.rank-normal {
  background: #86868b;
}

.user-cell {
  min-width: 100px;
}

.user-name {
  font-weight: 500;
  color: #1d1d1f;
}

.workno-cell {
  color: #86868b;
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
  min-width: 80px;
}

.count-cell {
  text-align: center;
  min-width: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
}

.count-value {
  font-weight: 600;
  color: #007AFF;
}

.count-unit {
  color: #86868b;
  margin-left: 0.25rem;
}

.count-header {
  text-align: center;
}

.time-cell {
  color: #86868b;
  font-size: 0.8125rem;
  min-width: 100px;
}

/* empty-table 样式已移至 EmptyState 组件 */

/* 响应式设计 */
@media (max-width: 768px) {
  .stats-overview {
    grid-template-columns: 1fr;
    gap: 0.5rem;
    padding: 0.75rem;
  }

  .pickup-table {
    font-size: 0.8125rem;
  }

  .pickup-table th,
  .pickup-table td {
    padding: 0.5rem 0.75rem;
  }

  .workno-cell,
  .time-cell {
    display: none;
  }
}

/* 小尺寸卡片优化 */
@container (max-width: 200px) {
  .mini-view {
    padding: 0.375rem;
  }

  .rank-medal {
    width: 1rem;
    height: 1rem;
    top: 0.125rem;
    left: 0.125rem;
  }

  .medal-icon {
    font-size: 0.625rem;
  }

  .avatar-bg {
    width: 1.75rem;
    height: 1.75rem;
  }

  .avatar-text {
    font-size: 0.75rem;
  }

  .user-name-mini {
    font-size: 0.6875rem;
  }

  .user-count-mini {
    font-size: 0.5625rem;
  }

  .carousel-dots {
    gap: 0.1875rem;
    margin-top: 0.25rem;
  }

  .dot {
    width: 0.25rem;
    height: 0.25rem;
  }
}

@container (max-height: 120px) {
  .user-avatar-mini {
    margin-bottom: 0.25rem;
  }

  .carousel-dots {
    margin-top: 0.25rem;
  }

  .carousel-container {
    padding: 0.125rem 0;
  }
}

/* 深色模式适配 - 使用主题系统 */
.theme-dark .user-name-mini,
.theme-dark .user-name,
.theme-dark .compact-title,
.theme-dark .full-title,
.theme-tech .user-name-mini,
.theme-tech .user-name,
.theme-tech .compact-title,
.theme-tech .full-title {
  color: var(--color-text);
}

.theme-dark .user-count-mini,
.theme-dark .user-count,
.theme-dark .time-range,
.theme-dark .empty-text,
.theme-dark .empty-chart,
.theme-dark .stat-label,
.theme-dark .workno-cell,
.theme-dark .time-cell,
.theme-dark .empty-table,
.theme-tech .user-count-mini,
.theme-tech .user-count,
.theme-tech .time-range,
.theme-tech .empty-text,
.theme-tech .empty-chart,
.theme-tech .stat-label,
.theme-tech .workno-cell,
.theme-tech .time-cell,
.theme-tech .empty-table {
  color: var(--color-text-secondary);
}

.theme-dark .dot,
.theme-tech .dot {
  background: rgba(255, 255, 255, 0.2);
}

.theme-dark .dot:hover,
.theme-tech .dot:hover {
  background: var(--color-text-secondary);
}

.theme-dark .stats-overview,
.theme-tech .stats-overview {
  background: var(--color-surface);
}

.theme-dark .pickup-table,
.theme-tech .pickup-table {
  background: var(--color-surface);
  color: var(--color-text);
}

.theme-dark .pickup-table thead,
.theme-tech .pickup-table thead {
  background: var(--color-surface);
}

.theme-dark .pickup-table th,
.theme-tech .pickup-table th {
  color: var(--color-text);
  border-bottom-color: rgba(255, 255, 255, 0.1);
}

.theme-dark .pickup-table td,
.theme-tech .pickup-table td {
  border-bottom-color: rgba(255, 255, 255, 0.1);
}

.theme-dark .table-row:hover,
.theme-tech .table-row:hover {
  background: rgba(255, 255, 255, 0.05);
}

.theme-dark .table-container,
.theme-tech .table-container {
  border-color: rgba(255, 255, 255, 0.1);
  background: var(--color-surface);
}

.theme-dark .time-selector,
.theme-tech .time-selector {
  background: var(--color-surface);
  border-color: rgba(255, 255, 255, 0.2);
  color: var(--color-text);
}

.theme-dark .time-selector:hover,
.theme-tech .time-selector:hover {
  border-color: var(--color-primary);
}
</style>
