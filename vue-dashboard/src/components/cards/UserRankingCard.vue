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
        <template v-if="topUsers.length">
          <span class="rank-badge">1</span>
          <strong>{{ topUsers[0].userName }}</strong>
          <em>{{ topUsers[0].totalCount }} 件</em>
        </template>
        <span v-else class="empty-state">暂无排行</span>
      </div>
    </template>

    <template v-else-if="displayMode === 'compact'">
      <div class="compact-view">
        <div class="ranking-list">
          <div v-for="(user, index) in topUsers.slice(0, 5)" :key="user.key" class="rank-row">
            <span class="rank-badge" :class="`rank-${index + 1}`">{{ index + 1 }}</span>
            <div class="user-main">
              <strong>{{ user.userName }}</strong>
              <span>{{ user.departmentName || user.workNo || '未标部门' }}</span>
            </div>
            <div class="rank-meter">
              <i :style="{ width: `${getPercent(user.totalCount, maxCount)}%` }"></i>
            </div>
            <b>{{ user.totalCount }}</b>
          </div>
          <div v-if="!topUsers.length" class="empty-state">暂无领刀排行</div>
        </div>
      </div>
    </template>

    <template v-else>
      <div class="full-view">
        <section class="summary-row">
          <div>
            <span>领刀人员</span>
            <strong>{{ topUsers.length }}</strong>
          </div>
          <div>
            <span>领刀总数</span>
            <strong>{{ totalCount }}</strong>
          </div>
          <div>
            <span>人均领刀</span>
            <strong>{{ averageCount }}</strong>
          </div>
        </section>

        <div class="table-wrap">
          <table v-if="topUsers.length" class="ranking-table">
            <thead>
              <tr>
                <th>排名</th>
                <th>领刀人</th>
                <th>工号</th>
                <th>部门</th>
                <th>领刀数量</th>
                <th>领刀金额</th>
                <th>最近领刀</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(user, index) in topUsers" :key="user.key">
                <td><span class="rank-badge" :class="`rank-${index + 1}`">{{ index + 1 }}</span></td>
                <td class="strong-cell">{{ user.userName }}</td>
                <td>{{ user.workNo || '-' }}</td>
                <td>{{ user.departmentName || '-' }}</td>
                <td class="number-cell">{{ user.totalCount }}</td>
                <td class="number-cell">{{ formatMoney(user.totalAmount) }}</td>
                <td>{{ formatShortTime(user.lastPayTime) }}</td>
              </tr>
            </tbody>
          </table>
          <div v-else class="empty-state">暂无领刀排行</div>
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

interface UserRanking {
  key: string
  userName: string
  workNo: string
  departmentName: string
  totalCount: number
  totalAmount: number
  lastPayTime: string
}

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
  title: '领刀排行',
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
const records = computed(() => (storeRecords.value.length ? storeRecords.value : localRecords.value))
const hasData = computed(() => records.value.length > 0)
const initialLoading = computed(() => loading.value && !hasData.value)
const refreshing = computed(() => loading.value && hasData.value)
const topUsers = computed(() => buildUserRanking(records.value))
const maxCount = computed(() => Math.max(1, ...topUsers.value.map(user => user.totalCount)))
const totalCount = computed(() => topUsers.value.reduce((sum, user) => sum + user.totalCount, 0))
const averageCount = computed(() => topUsers.value.length ? (totalCount.value / topUsers.value.length).toFixed(1) : '0')

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
    error.value = err instanceof Error ? err.message : '领刀排行加载失败'
  } finally {
    loading.value = false
  }
}

function buildUserRanking(source: CutterBorrowRecord[]): UserRanking[] {
  const map = new Map<string, UserRanking>()

  source.forEach(record => {
    const key = record.userId || record.workNo || record.userName
    const current = map.get(key) || {
      key,
      userName: record.userName || '未知人员',
      workNo: record.workNo,
      departmentName: record.departmentName || record.workshopName,
      totalCount: 0,
      totalAmount: 0,
      lastPayTime: ''
    }

    current.totalCount += record.payNum
    current.totalAmount += record.amount
    if (!current.lastPayTime || parseDate(record.payTime) > parseDate(current.lastPayTime)) {
      current.lastPayTime = record.payTime
    }

    map.set(key, current)
  })

  return Array.from(map.values())
    .sort((a, b) => b.totalCount - a.totalCount)
    .slice(0, 20)
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

function parseDate(value: string) {
  return value ? new Date(value.replace(/-/g, '/')) : new Date(0)
}

function formatDateTime(date: Date) {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

function formatShortTime(value: string) {
  if (!value) return '-'
  const date = parseDate(value)
  return `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

function getPercent(value: number, max: number) {
  return Math.max(6, Math.round((value / max) * 100))
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
  gap: 7px;
  text-align: center;
}

.mini-view strong {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 18px;
  color: var(--color-text);
}

.mini-view em {
  font-style: normal;
  color: var(--color-primary);
  font-weight: 700;
}

.compact-view,
.full-view {
  height: 100%;
  min-height: 0;
}

.ranking-list {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.rank-row {
  display: grid;
  grid-template-columns: 26px minmax(80px, 1fr) minmax(70px, 1fr) 38px;
  align-items: center;
  gap: 8px;
  min-height: 34px;
}

.rank-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 7px;
  background: rgba(148, 163, 184, 0.16);
  color: var(--color-text);
  font-size: 12px;
  font-weight: 700;
}

.rank-1 {
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.14);
}

.rank-2 {
  color: #38bdf8;
  background: rgba(56, 189, 248, 0.14);
}

.rank-3 {
  color: #10b981;
  background: rgba(16, 185, 129, 0.14);
}

.user-main {
  min-width: 0;
}

.user-main strong,
.user-main span {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-main strong {
  color: var(--color-text);
  font-size: 13px;
}

.user-main span,
.summary-row span {
  color: var(--color-text-secondary);
  font-size: 12px;
}

.rank-meter {
  height: 7px;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.12);
  overflow: hidden;
}

.rank-meter i {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, rgba(59, 130, 246, 0.95), rgba(16, 185, 129, 0.8));
}

.rank-row b {
  text-align: right;
  color: var(--color-primary);
}

.summary-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin-bottom: 12px;
}

.summary-row > div {
  padding: 10px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 8px;
  background: rgba(148, 163, 184, 0.06);
}

.summary-row strong {
  display: block;
  margin-top: 4px;
  font-size: 22px;
  color: var(--color-text);
}

.table-wrap {
  height: calc(100% - 78px);
  overflow: auto;
}

.ranking-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.ranking-table th,
.ranking-table td {
  padding: 9px 8px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.12);
  text-align: left;
  white-space: nowrap;
}

.ranking-table th {
  color: var(--color-text-secondary);
  font-weight: 600;
}

.strong-cell {
  color: var(--color-text);
  font-weight: 600;
}

.number-cell {
  color: var(--color-primary);
  font-weight: 700;
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
