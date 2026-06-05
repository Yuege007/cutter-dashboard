<template>
  <BaseCard
    :title="title"
    variant="primary"
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
        <strong>{{ todayChangeCount }}</strong>
        <span>今日变更</span>
        <b :class="netChangeClass">{{ signedNumber(todayNetChange) }}</b>
      </div>
    </template>

    <template v-else-if="displayMode === 'compact'">
      <div class="compact-view">
        <section class="summary-row">
          <div>
            <span>近7天变更</span>
            <strong>{{ weekChangeCount }}</strong>
          </div>
          <div>
            <span>入库量</span>
            <strong class="in">{{ inTotal }}</strong>
          </div>
          <div>
            <span>出库量</span>
            <strong class="out">{{ outTotal }}</strong>
          </div>
        </section>

        <div class="change-list">
          <div v-for="record in recentChanges.slice(0, 5)" :key="record.id || `${record.createTime}-${record.materialCode}`" class="change-row">
            <span class="direction-dot" :class="record.direction"></span>
            <div class="change-main">
              <strong>{{ record.productName }}</strong>
              <span>{{ record.cuttingName || '未标刀柜' }} / {{ record.itemNoAlias || '未标货道' }}</span>
            </div>
            <b :class="record.direction">{{ signedNumber(record.changeCount) }}</b>
          </div>
          <div v-if="!recentChanges.length" class="empty-state">暂无库存变更</div>
        </div>
      </div>
    </template>

    <template v-else>
      <div class="full-view">
        <section class="summary-row">
          <div>
            <span>近7天变更</span>
            <strong>{{ weekChangeCount }}</strong>
          </div>
          <div>
            <span>净变化</span>
            <strong :class="netChangeClass">{{ signedNumber(netChange) }}</strong>
          </div>
          <div>
            <span>入库量</span>
            <strong class="in">{{ inTotal }}</strong>
          </div>
          <div>
            <span>出库量</span>
            <strong class="out">{{ outTotal }}</strong>
          </div>
        </section>

        <div class="table-wrap">
          <table v-if="recentChanges.length" class="change-table">
            <thead>
              <tr>
                <th>时间</th>
                <th>刀具</th>
                <th>刀柜/货道</th>
                <th>变更</th>
                <th>库存</th>
                <th>操作人</th>
                <th>备注</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="record in recentChanges" :key="record.id || `${record.createTime}-${record.materialCode}`">
                <td>{{ formatShortTime(record.createTime) }}</td>
                <td class="strong-cell">{{ record.productName }}</td>
                <td>{{ record.cuttingName || '-' }} / {{ record.itemNoAlias || '-' }}</td>
                <td class="number-cell" :class="record.direction">{{ signedNumber(record.changeCount) }}</td>
                <td>{{ record.oldInventory }} -> {{ record.newInventory }}</td>
                <td>{{ record.createBy || record.createByWorkNo || '-' }}</td>
                <td class="remark-cell">{{ record.remark || record.details || '-' }}</td>
              </tr>
            </tbody>
          </table>
          <div v-else class="empty-state">暂无库存变更</div>
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
import type { CutterStockChangeRecord } from '@/types/cutter'

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
  title: '库存变更记录',
  showRefresh: true,
  showSettings: true,
  locked: false,
  modeLocked: false,
  width: 5,
  height: 3,
  minWidth: 3,
  minHeight: 2
})

defineEmits<{
  settings: []
  delete: []
  lock: [locked: boolean]
  modeLock: [locked: boolean, mode: CardMode]
}>()

const dataStore = useDataStore()
const localRecords = ref<CutterStockChangeRecord[]>([])
const loading = ref(false)
const error = ref('')

const displayMode = computed<CardMode>(() => props.forcedMode || detectCardMode(props.width, props.height))
const storeRecords = computed<CutterStockChangeRecord[]>(() => dataStore.getData('cutter-stock-changes') || [])
const records = computed(() => (storeRecords.value.length ? storeRecords.value : localRecords.value).slice().sort(sortByCreateTimeDesc))
const hasData = computed(() => records.value.length > 0)
const initialLoading = computed(() => loading.value && !hasData.value)
const refreshing = computed(() => loading.value && hasData.value)
const recentChanges = computed(() => records.value.slice(0, 40))
const todayRecords = computed(() => records.value.filter(record => isSameDay(record.createTime, new Date())))
const todayChangeCount = computed(() => todayRecords.value.length)
const todayNetChange = computed(() => sumChange(todayRecords.value))
const weekChangeCount = computed(() => records.value.length)
const netChange = computed(() => sumChange(records.value))
const inTotal = computed(() => records.value.filter(record => record.changeCount > 0).reduce((sum, record) => sum + record.changeCount, 0))
const outTotal = computed(() => Math.abs(records.value.filter(record => record.changeCount < 0).reduce((sum, record) => sum + record.changeCount, 0)))
const netChangeClass = computed(() => netChange.value > 0 ? 'in' : netChange.value < 0 ? 'out' : 'flat')

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
    const response = await cutterApi.stock.getStockChanges({
      startTime: start,
      endTime: end,
      page: 1,
      rows: 100
    })
    localRecords.value = cutterAdapter.getRows(response.data).map(cutterAdapter.mapStockChangeRecord)
  } catch (err) {
    error.value = err instanceof Error ? err.message : '库存变更记录加载失败'
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

function sortByCreateTimeDesc(a: CutterStockChangeRecord, b: CutterStockChangeRecord) {
  return parseDate(b.createTime).getTime() - parseDate(a.createTime).getTime()
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

function sumChange(source: CutterStockChangeRecord[]) {
  return source.reduce((sum, record) => sum + record.changeCount, 0)
}

function signedNumber(value: number) {
  if (value > 0) return `+${value}`
  return String(value)
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
.change-row span {
  color: var(--color-text-secondary);
  font-size: 12px;
}

.mini-view b {
  font-size: 13px;
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

.in {
  color: var(--color-success) !important;
}

.out {
  color: var(--color-danger) !important;
}

.flat {
  color: var(--color-text-secondary) !important;
}

.change-list {
  flex: 1;
  min-height: 0;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.change-row {
  display: grid;
  grid-template-columns: 8px minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 8px;
  background: rgba(148, 163, 184, 0.06);
}

.direction-dot {
  width: 8px;
  height: 24px;
  border-radius: 999px;
  background: var(--color-text-secondary);
}

.direction-dot.in {
  background: var(--color-success);
}

.direction-dot.out {
  background: var(--color-danger);
}

.change-main {
  min-width: 0;
}

.change-main strong,
.change-main span {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.change-main strong {
  color: var(--color-text);
  font-size: 13px;
}

.change-row b,
.number-cell {
  font-weight: 700;
}

.table-wrap {
  flex: 1;
  min-height: 0;
  overflow: auto;
}

.change-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.change-table th,
.change-table td {
  padding: 9px 8px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.12);
  text-align: left;
  white-space: nowrap;
}

.change-table th {
  color: var(--color-text-secondary);
  font-weight: 600;
}

.strong-cell {
  color: var(--color-text);
  font-weight: 600;
}

.remark-cell {
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
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
