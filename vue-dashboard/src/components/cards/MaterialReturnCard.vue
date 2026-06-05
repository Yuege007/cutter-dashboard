<template>
  <BaseCard
    :title="title"
    variant="success"
    :mode="displayMode"
    :width="width"
    :height="height"
    :min-width="minWidth"
    :min-height="minHeight"
    :loading="initialLoading"
    :refreshing="refreshing"
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
        <strong>{{ todayReturnCount }}</strong>
        <span>今日归还</span>
      </div>
    </template>

    <template v-else-if="displayMode === 'compact'">
      <div class="compact-view">
        <section class="summary-row">
          <div>
            <span>近7天归还</span>
            <strong>{{ weekReturnCount }}</strong>
          </div>
          <div>
            <span>归还人员</span>
            <strong>{{ returnUserCount }}</strong>
          </div>
          <div>
            <span>归还金额</span>
            <strong>{{ formatMoney(weekReturnAmount) }}</strong>
          </div>
        </section>

        <div class="return-list">
          <div v-for="record in recentReturns.slice(0, 5)" :key="record.id || `${record.returnTime}-${record.materialCode}`" class="return-row">
            <div class="return-main">
              <strong>{{ record.productName }}</strong>
              <span>{{ record.returnUserName || record.userName }} / {{ formatShortTime(record.returnTime) }}</span>
            </div>
            <b>{{ record.payNum }}</b>
          </div>
          <div v-if="!recentReturns.length" class="empty-state">暂无归还记录</div>
        </div>
      </div>
    </template>

    <template v-else>
      <div class="full-view">
        <section class="summary-row">
          <div>
            <span>近7天归还</span>
            <strong>{{ weekReturnCount }}</strong>
          </div>
          <div>
            <span>归还人员</span>
            <strong>{{ returnUserCount }}</strong>
          </div>
          <div>
            <span>涉及刀具</span>
            <strong>{{ materialCount }}</strong>
          </div>
          <div>
            <span>归还金额</span>
            <strong>{{ formatMoney(weekReturnAmount) }}</strong>
          </div>
        </section>

        <div class="table-wrap">
          <table v-if="recentReturns.length" class="return-table">
            <thead>
              <tr>
                <th>刀具</th>
                <th>品牌/规格</th>
                <th>领刀人</th>
                <th>归还人</th>
                <th>数量</th>
                <th>领刀时间</th>
                <th>归还时间</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="record in recentReturns" :key="record.id || `${record.returnTime}-${record.materialCode}`">
                <td class="strong-cell">{{ record.productName }}</td>
                <td>{{ record.brandName || '-' }} / {{ record.specification || '-' }}</td>
                <td>{{ record.userName || '-' }}</td>
                <td>{{ record.returnUserName || record.userName || '-' }}</td>
                <td class="number-cell">{{ record.payNum }}</td>
                <td>{{ formatShortTime(record.payTime) }}</td>
                <td>{{ formatShortTime(record.returnTime) }}</td>
              </tr>
            </tbody>
          </table>
          <div v-else class="empty-state">暂无归还记录</div>
        </div>
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
  title: '归还追踪',
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
const storeRecords = computed<CutterBorrowRecord[]>(() => dataStore.getData('cutter-return-records') || [])
const records = computed(() => (storeRecords.value.length ? storeRecords.value : localRecords.value).filter(record => record.returnTime).sort(sortByReturnTimeDesc))
const hasData = computed(() => records.value.length > 0)
const initialLoading = computed(() => loading.value && !hasData.value)
const refreshing = computed(() => loading.value && hasData.value)
const recentReturns = computed(() => records.value.slice(0, 30))
const todayReturnCount = computed(() => sumCount(records.value.filter(record => isSameDay(record.returnTime, new Date()))))
const weekReturnCount = computed(() => sumCount(records.value))
const weekReturnAmount = computed(() => records.value.reduce((sum, record) => sum + record.amount, 0))
const returnUserCount = computed(() => new Set(records.value.map(record => record.returnUserId || record.returnUserName || record.userName)).size)
const materialCount = computed(() => new Set(records.value.map(record => record.materialCode || record.productName)).size)

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
    const { start, end } = getRecentRange(7)
    const response = await cutterApi.borrow.getReturnRecords({
      startTime: start,
      endTime: end,
      page: 1,
      rows: 100
    })
    localRecords.value = cutterAdapter.getRows(response.data).map(cutterAdapter.mapBorrowRecord)
  } catch (err) {
    error.value = err instanceof Error ? err.message : '归还记录加载失败'
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

function sortByReturnTimeDesc(a: CutterBorrowRecord, b: CutterBorrowRecord) {
  return parseDate(b.returnTime).getTime() - parseDate(a.returnTime).getTime()
}

function isSameDay(value: string, date: Date) {
  return formatDate(parseDate(value)) === formatDate(date)
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

function formatShortTime(value: string) {
  if (!value) return '-'
  const date = parseDate(value)
  if (date.getTime() <= 0) return '-'
  return `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

function sumCount(source: CutterBorrowRecord[]) {
  return source.reduce((sum, record) => sum + record.payNum, 0)
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
  color: var(--color-success);
}

.mini-view span,
.summary-row span,
.return-row span {
  color: var(--color-text-secondary);
  font-size: 12px;
}

.compact-view,
.full-view {
  height: 100%;
  min-height: 0;
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

.return-list {
  flex: 1;
  min-height: 0;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.return-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 8px;
  background: rgba(148, 163, 184, 0.06);
}

.return-main {
  min-width: 0;
}

.return-main strong,
.return-main span {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.return-main strong {
  color: var(--color-text);
  font-size: 13px;
}

.return-row b,
.number-cell {
  color: var(--color-success);
  font-weight: 700;
}

.table-wrap {
  flex: 1;
  min-height: 0;
  overflow: auto;
}

.return-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.return-table th,
.return-table td {
  padding: 9px 8px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.12);
  text-align: left;
  white-space: nowrap;
}

.return-table th {
  color: var(--color-text-secondary);
  font-weight: 600;
}

.strong-cell {
  color: var(--color-text);
  font-weight: 600;
}

.empty-state {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-secondary);
  font-size: 13px;
}
</style>
