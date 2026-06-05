<template>
  <BaseCard
    :title="title"
    variant="danger"
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
        <strong>{{ violationCount }}</strong>
        <span>违规记录</span>
        <b>{{ uniqueUserCount }} 人</b>
      </div>
    </template>

    <template v-else-if="displayMode === 'compact'">
      <div class="compact-view">
        <section class="summary-row">
          <div>
            <span>近7天违规</span>
            <strong class="danger">{{ violationCount }}</strong>
          </div>
          <div>
            <span>涉及人员</span>
            <strong>{{ uniqueUserCount }}</strong>
          </div>
          <div>
            <span>涉及刀具</span>
            <strong>{{ materialCount }}</strong>
          </div>
        </section>

        <div class="violation-list">
          <div v-for="record in recentViolations.slice(0, 5)" :key="record.id || `${record.payTime}-${record.materialCode}`" class="violation-row">
            <span class="risk-strip"></span>
            <div class="violation-main">
              <strong>{{ record.userName }}</strong>
              <span>{{ record.productName }} / {{ record.violationReason || '违规' }}</span>
            </div>
            <b>{{ record.payNum }}</b>
          </div>
          <div v-if="!recentViolations.length" class="empty-state">暂无违规记录</div>
        </div>
      </div>
    </template>

    <template v-else>
      <div class="full-view">
        <section class="summary-row">
          <div>
            <span>近7天违规</span>
            <strong class="danger">{{ violationCount }}</strong>
          </div>
          <div>
            <span>涉及人员</span>
            <strong>{{ uniqueUserCount }}</strong>
          </div>
          <div>
            <span>涉及刀具</span>
            <strong>{{ materialCount }}</strong>
          </div>
          <div>
            <span>违规数量</span>
            <strong>{{ violationItemCount }}</strong>
          </div>
        </section>

        <div class="full-content">
          <div class="table-wrap">
            <table v-if="recentViolations.length" class="violation-table">
              <thead>
                <tr>
                  <th>时间</th>
                  <th>人员</th>
                  <th>刀具</th>
                  <th>刀柜/货道</th>
                  <th>数量</th>
                  <th>原因</th>
                  <th>确认时间</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="record in recentViolations" :key="record.id || `${record.payTime}-${record.materialCode}`">
                  <td>{{ formatShortTime(record.payTime || record.confirmTime) }}</td>
                  <td class="strong-cell">{{ record.userName }}</td>
                  <td>{{ record.productName }}</td>
                  <td>{{ record.cuttingName || '-' }} / {{ record.itemNoAlias || '-' }}</td>
                  <td class="number-cell">{{ record.payNum }}</td>
                  <td class="reason-cell">{{ record.violationReason || '违规' }}</td>
                  <td>{{ formatShortTime(record.confirmTime) }}</td>
                </tr>
              </tbody>
            </table>
            <div v-else class="empty-state">暂无违规记录</div>
          </div>
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
  title: '异常违规记录',
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
const localRecords = ref<CutterBorrowRecord[]>([])
const loading = ref(false)
const error = ref('')

const displayMode = computed<CardMode>(() => props.forcedMode || detectCardMode(props.width, props.height))
const storeRecords = computed<CutterBorrowRecord[]>(() => dataStore.getData('cutter-violation-records') || [])
const records = computed(() => (storeRecords.value.length ? storeRecords.value : localRecords.value).slice().sort(sortByRiskTimeDesc))
const hasData = computed(() => records.value.length > 0)
const initialLoading = computed(() => loading.value && !hasData.value)
const refreshing = computed(() => loading.value && hasData.value)
const recentViolations = computed(() => records.value.slice(0, 40))
const violationCount = computed(() => records.value.length)
const uniqueUserCount = computed(() => new Set(records.value.map(record => record.userId || record.workNo || record.userName)).size)
const materialCount = computed(() => new Set(records.value.map(record => record.materialCode || record.productName)).size)
const violationItemCount = computed(() => records.value.reduce((sum, record) => sum + record.payNum, 0))

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
    const response = await cutterApi.violation.getViolationRecords({
      startTime: start,
      endTime: end,
      page: 1,
      rows: 100
    })
    localRecords.value = cutterAdapter.getRows(response.data).map(cutterAdapter.mapBorrowRecord)
  } catch (err) {
    error.value = err instanceof Error ? err.message : '异常违规记录加载失败'
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

function sortByRiskTimeDesc(a: CutterBorrowRecord, b: CutterBorrowRecord) {
  return parseDate(b.confirmTime || b.payTime).getTime() - parseDate(a.confirmTime || a.payTime).getTime()
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
  color: var(--color-danger);
}

.mini-view span,
.mini-view b,
.summary-row span,
.violation-row span {
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

.danger {
  color: var(--color-danger) !important;
}

.violation-list {
  flex: 1;
  min-height: 0;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.violation-row {
  display: grid;
  grid-template-columns: 8px minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 8px;
  background: rgba(239, 68, 68, 0.06);
}

.risk-strip {
  width: 8px;
  height: 24px;
  border-radius: 999px;
  background: var(--color-danger);
}

.violation-main {
  min-width: 0;
}

.violation-main strong,
.violation-main span {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.violation-main strong {
  color: var(--color-text);
  font-size: 13px;
}

.violation-row b,
.number-cell {
  color: var(--color-danger);
  font-weight: 700;
}

.full-content,
.table-wrap {
  flex: 1;
  min-height: 0;
  overflow: auto;
}

.violation-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.violation-table th,
.violation-table td {
  padding: 9px 8px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.12);
  text-align: left;
  white-space: nowrap;
}

.violation-table th {
  color: var(--color-text-secondary);
  font-weight: 600;
}

.strong-cell {
  color: var(--color-text);
  font-weight: 600;
}

.reason-cell {
  max-width: 160px;
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
