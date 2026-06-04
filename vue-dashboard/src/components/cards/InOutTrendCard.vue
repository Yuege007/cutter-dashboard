<template>
  <BaseCard
    :title="title"
    variant="primary"
    :mode="displayMode"
    :width="width"
    :height="height"
    :min-width="minWidth"
    :min-height="minHeight"
    :loading="loading"
    :has-error="!!error"
    :error-message="error"
    :show-settings="showSettings"
    :show-refresh="showRefresh"
    :locked="locked"
    :mode-locked="modeLocked"
    @refresh="handleRefresh"
    @settings="$emit('settings')"
    @delete="$emit('delete')"
    @lock="value => $emit('lock', value)"
    @mode-lock="(locked, mode) => $emit('modeLock', locked, mode)"
  >
    <template v-if="displayMode === 'mini'">
      <div class="mini-view">
        <strong>{{ todayCount }}</strong>
        <span>今日领刀</span>
      </div>
    </template>

    <template v-else-if="displayMode === 'compact'">
      <div class="compact-view">
        <section class="summary-row">
          <div>
            <span>近7天领刀</span>
            <strong>{{ weekCount }}</strong>
          </div>
          <div>
            <span>领刀金额</span>
            <strong>{{ formatMoney(weekAmount) }}</strong>
          </div>
          <div>
            <span>涉及刀具</span>
            <strong>{{ weekMaterialCount }}</strong>
          </div>
        </section>

        <section class="bar-chart" aria-label="近7天领刀趋势">
          <div v-for="day in weekTrend" :key="day.date" class="bar-item">
            <div class="bar-track">
              <div class="bar-fill" :style="{ height: `${getBarHeight(day.count, weekMaxCount)}%` }"></div>
            </div>
            <span>{{ day.label }}</span>
          </div>
        </section>
      </div>
    </template>

    <template v-else>
      <div class="full-view">
        <section class="summary-row">
          <div>
            <span>近15天领刀</span>
            <strong>{{ totalCount }}</strong>
          </div>
          <div>
            <span>领刀金额</span>
            <strong>{{ formatMoney(totalAmount) }}</strong>
          </div>
          <div>
            <span>领刀人员</span>
            <strong>{{ userCount }}</strong>
          </div>
          <div>
            <span>未归还</span>
            <strong class="warning">{{ pendingReturnCount }}</strong>
          </div>
        </section>

        <section class="full-content">
          <div class="trend-panel">
            <div class="panel-title">近15天趋势</div>
            <div class="wide-chart">
              <div v-for="day in fullTrend" :key="day.date" class="bar-item">
                <div class="bar-track">
                  <div class="bar-fill" :style="{ height: `${getBarHeight(day.count, fullMaxCount)}%` }"></div>
                </div>
                <span>{{ day.shortLabel }}</span>
              </div>
            </div>
          </div>

          <div class="recent-panel">
            <div class="panel-title">最近领刀记录</div>
            <div v-if="recentRecords.length" class="record-list">
              <div v-for="record in recentRecords" :key="record.id || `${record.payTime}-${record.materialCode}`" class="record-row">
                <div>
                  <strong>{{ record.productName }}</strong>
                  <span>{{ record.brandName || '未标品牌' }} / {{ record.specification || '未标规格' }}</span>
                </div>
                <div class="record-meta">
                  <span>{{ record.userName }}</span>
                  <b>{{ record.payNum }}</b>
                </div>
              </div>
            </div>
            <div v-else class="empty-state">暂无领刀记录</div>
          </div>
        </section>
      </div>
    </template>
  </BaseCard>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import BaseCard from './BaseCard.vue'
import cutterApi from '@/services/cutterApi'
import cutterAdapter from '@/adapters/cutterAdapter'
import { useDataStore } from '@/stores/data'
import { detectCardMode } from '@/utils/cardSizeManager'
import type { CardMode } from '@/types'
import type { CutterBorrowRecord } from '@/types/cutter'

const props = withDefaults(defineProps<{
  cardId?: string
  title?: string
  showRefresh?: boolean
  showSettings?: boolean
  locked?: boolean
  modeLocked?: boolean
  forcedMode?: CardMode
  width?: number
  height?: number
  minWidth?: number
  minHeight?: number
}>(), {
  title: '领刀趋势',
  showRefresh: true,
  showSettings: true,
  locked: false,
  modeLocked: false,
  width: 4,
  height: 3,
  minWidth: 2,
  minHeight: 2
})

defineEmits<{
  settings: []
  delete: []
  lock: [locked: boolean]
  modeLock: [locked: boolean, mode: CardMode]
}>()

const dataStore = useDataStore()
const localRecords = ref<CutterBorrowRecord[]>([])
const loading = ref(false)
const error = ref('')

const displayMode = computed<CardMode>(() => props.forcedMode || detectCardMode(props.width, props.height))
const storeRecords = computed<CutterBorrowRecord[]>(() => dataStore.getData('cutter-borrow-records') || [])
const records = computed(() => (storeRecords.value.length ? storeRecords.value : localRecords.value).slice().sort(sortByPayTimeDesc))

const todayCount = computed(() => sumCount(records.value.filter(record => isSameDay(record.payTime, new Date()))))
const weekRecords = computed(() => filterRecentDays(records.value, 7))
const fullRecords = computed(() => filterRecentDays(records.value, 15))
const weekTrend = computed(() => buildTrend(weekRecords.value, 7))
const fullTrend = computed(() => buildTrend(fullRecords.value, 15))
const weekCount = computed(() => sumCount(weekRecords.value))
const weekAmount = computed(() => sumAmount(weekRecords.value))
const weekMaterialCount = computed(() => new Set(weekRecords.value.map(record => record.materialCode || record.productName)).size)
const totalCount = computed(() => sumCount(fullRecords.value))
const totalAmount = computed(() => sumAmount(fullRecords.value))
const userCount = computed(() => new Set(fullRecords.value.map(record => record.userId || record.userName)).size)
const pendingReturnCount = computed(() => fullRecords.value.filter(record => !record.returned).length)
const recentRecords = computed(() => records.value.slice(0, 8))
const weekMaxCount = computed(() => Math.max(1, ...weekTrend.value.map(day => day.count)))
const fullMaxCount = computed(() => Math.max(1, ...fullTrend.value.map(day => day.count)))

watch(storeRecords, value => {
  if (value.length) {
    error.value = ''
  }
})

onMounted(() => {
  if (!storeRecords.value.length) {
    loadData()
  }
})

async function handleRefresh() {
  await loadData()
}

async function loadData() {
  loading.value = true
  error.value = ''
  try {
    const { start, end } = getRecentRange(15)
    const response = await cutterApi.borrow.getBorrowRecords({
      startTime: start,
      endTime: end,
      page: 1,
      rows: 100
    })
    localRecords.value = cutterAdapter.getRows(response.data).map(cutterAdapter.mapBorrowRecord)
  } catch (err) {
    error.value = err instanceof Error ? err.message : '领刀趋势加载失败'
  } finally {
    loading.value = false
  }
}

function getRecentRange(days: number) {
  const endDate = new Date()
  const startDate = new Date(endDate)
  startDate.setDate(startDate.getDate() - (days - 1))
  startDate.setHours(0, 0, 0, 0)
  return {
    start: formatDateTime(startDate),
    end: formatDateTime(endDate)
  }
}

function buildTrend(source: CutterBorrowRecord[], days: number) {
  const result = []
  const today = new Date()
  for (let offset = days - 1; offset >= 0; offset--) {
    const date = new Date(today)
    date.setDate(today.getDate() - offset)
    const dateKey = formatDate(date)
    const dayRecords = source.filter(record => formatDate(parseDate(record.payTime)) === dateKey)
    result.push({
      date: dateKey,
      label: `${date.getMonth() + 1}/${date.getDate()}`,
      shortLabel: String(date.getDate()),
      count: sumCount(dayRecords)
    })
  }
  return result
}

function filterRecentDays(source: CutterBorrowRecord[], days: number) {
  const start = new Date()
  start.setDate(start.getDate() - (days - 1))
  start.setHours(0, 0, 0, 0)
  return source.filter(record => parseDate(record.payTime) >= start)
}

function isSameDay(value: string, date: Date) {
  return formatDate(parseDate(value)) === formatDate(date)
}

function sortByPayTimeDesc(a: CutterBorrowRecord, b: CutterBorrowRecord) {
  return parseDate(b.payTime).getTime() - parseDate(a.payTime).getTime()
}

function parseDate(value: string) {
  return value ? new Date(value.replace(/-/g, '/')) : new Date(0)
}

function formatDate(date: Date) {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function formatDateTime(date: Date) {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${formatDate(date)} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

function sumCount(source: CutterBorrowRecord[]) {
  return source.reduce((sum, record) => sum + record.payNum, 0)
}

function sumAmount(source: CutterBorrowRecord[]) {
  return source.reduce((sum, record) => sum + record.amount, 0)
}

function getBarHeight(value: number, max: number) {
  if (value <= 0) return 6
  return Math.max(12, Math.round((value / max) * 100))
}

function formatMoney(value: number) {
  if (value >= 10000) return `${(value / 10000).toFixed(1)}万`
  return value.toFixed(0)
}
</script>

<style scoped>
.mini-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.mini-view strong {
  font-size: 34px;
  line-height: 1;
  color: var(--color-primary);
}

.mini-view span,
.summary-row span,
.record-row span {
  color: var(--color-text-secondary);
  font-size: 12px;
}

.compact-view,
.full-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.summary-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.full-view .summary-row {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.summary-row > div {
  min-width: 0;
  padding: 10px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 8px;
  background: rgba(148, 163, 184, 0.06);
}

.summary-row strong {
  display: block;
  margin-top: 4px;
  font-size: 22px;
  line-height: 1.1;
  color: var(--color-text);
}

.summary-row strong.warning {
  color: var(--color-warning);
}

.bar-chart,
.wide-chart {
  flex: 1;
  min-height: 0;
  display: grid;
  align-items: end;
  gap: 6px;
}

.bar-chart {
  grid-template-columns: repeat(7, minmax(0, 1fr));
}

.wide-chart {
  height: 100%;
  grid-template-columns: repeat(15, minmax(0, 1fr));
}

.bar-item {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

.bar-track {
  width: 100%;
  flex: 1;
  min-height: 44px;
  display: flex;
  align-items: end;
  border-radius: 6px;
  background: rgba(148, 163, 184, 0.08);
  overflow: hidden;
}

.bar-fill {
  width: 100%;
  border-radius: 6px 6px 0 0;
  background: linear-gradient(180deg, rgba(59, 130, 246, 0.95), rgba(16, 185, 129, 0.75));
}

.bar-item span {
  font-size: 11px;
  color: var(--color-text-secondary);
}

.full-content {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(240px, 0.8fr);
  gap: 12px;
}

.trend-panel,
.recent-panel {
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.panel-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text);
}

.record-list {
  flex: 1;
  min-height: 0;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.record-row {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 8px;
  background: rgba(148, 163, 184, 0.06);
}

.record-row > div {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.record-row strong,
.record-row span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.record-meta {
  align-items: flex-end;
  flex-shrink: 0;
}

.record-meta b {
  color: var(--color-primary);
}

.empty-state {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-secondary);
  font-size: 13px;
}

@media (max-width: 900px) {
  .full-content {
    grid-template-columns: 1fr;
  }
}
</style>
