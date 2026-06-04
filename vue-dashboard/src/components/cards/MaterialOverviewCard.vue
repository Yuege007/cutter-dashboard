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
    <template #default>
      <div class="cutter-overview" :class="`mode-${displayMode}`">
        <section v-if="displayMode === 'mini'" class="mini-panel">
          <span class="eyebrow">刀具总库存</span>
          <strong>{{ formatNumber(overview.totalInventory) }}</strong>
          <small>{{ overview.materialCount }} 种刀具 · {{ overview.warningCount }} 项预警</small>
        </section>

        <template v-else>
          <div class="kpi-grid">
            <article>
              <span>刀具种类</span>
              <strong>{{ formatNumber(overview.materialCount) }}</strong>
            </article>
            <article>
              <span>总库存</span>
              <strong>{{ formatNumber(overview.totalInventory) }}</strong>
            </article>
            <article>
              <span>库存价值</span>
              <strong>{{ formatMoney(overview.totalValue) }}</strong>
            </article>
            <article class="warning">
              <span>预警数量</span>
              <strong>{{ formatNumber(overview.warningCount) }}</strong>
            </article>
          </div>

          <div class="split" v-if="displayMode === 'full'">
            <section class="panel">
              <div class="panel-head">
                <h4>类别库存分布</h4>
                <span>{{ categoryStats.length }} 类</span>
              </div>
              <div class="bar-list">
                <div v-for="item in categoryStats" :key="item.name" class="bar-row">
                  <span class="bar-name">{{ item.name }}</span>
                  <div class="bar-track">
                    <i :style="{ width: `${item.percent}%` }"></i>
                  </div>
                  <b>{{ item.inventory }}</b>
                </div>
              </div>
            </section>

            <section class="panel">
              <div class="panel-head">
                <h4>库存价值排行</h4>
                <span>Top {{ valueRanking.length }}</span>
              </div>
              <table class="rank-table">
                <thead>
                  <tr>
                    <th>型号</th>
                    <th>规格</th>
                    <th>库存</th>
                    <th>价值</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in valueRanking" :key="`${item.materialCode}-${item.productName}`">
                    <td>{{ item.productName || '未命名刀具' }}</td>
                    <td>{{ item.specification || '-' }}</td>
                    <td>{{ item.inventory }}</td>
                    <td>{{ formatMoney(item.inventoryValue) }}</td>
                  </tr>
                </tbody>
              </table>
            </section>
          </div>

          <section v-else class="compact-list">
            <div v-for="item in categoryStats.slice(0, 4)" :key="item.name" class="compact-row">
              <span>{{ item.name }}</span>
              <b>{{ item.inventory }}</b>
            </div>
          </section>
        </template>
      </div>
    </template>
  </BaseCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import BaseCard from './BaseCard.vue'
import { useDataStore } from '@/stores/data'
import { pollingService } from '@/services/polling'
import { detectCardMode } from '@/utils/cardSizeManager'
import type { CardMode } from '@/types'
import type { CutterInventoryOverview, CutterInventoryWarning, CutterMaterial } from '@/types/cutter'

const props = withDefaults(defineProps<{
  title?: string
  width?: number
  height?: number
  minWidth?: number
  minHeight?: number
  forcedMode?: CardMode
  modeLocked?: boolean
  showRefresh?: boolean
  showSettings?: boolean
  locked?: boolean
}>(), {
  title: '刀具库存总览',
  width: 4,
  height: 3,
  minWidth: 2,
  minHeight: 2,
  showRefresh: true,
  showSettings: true,
  locked: false
})

defineEmits<{
  refresh: []
  settings: []
  delete: []
  lock: [locked: boolean]
  modeLock: [locked: boolean, mode: CardMode]
}>()

const dataStore = useDataStore()
const displayMode = computed(() => props.forcedMode || detectCardMode(props.width, props.height))

const materials = computed<CutterMaterial[]>(() => dataStore.getData('cutter-materials') || [])
const warnings = computed<CutterInventoryWarning[]>(() => dataStore.getData('cutter-inventory-warnings') || [])
const overview = computed<CutterInventoryOverview>(() => {
  return dataStore.getData('cutter-inventory-overview') || {
    materialCount: materials.value.length,
    totalInventory: materials.value.reduce((sum, item) => sum + item.inventory, 0),
    totalValue: materials.value.reduce((sum, item) => sum + item.inventoryValue, 0),
    warningCount: warnings.value.length,
    emptyCount: warnings.value.filter(item => item.level === 'empty').length,
    lowCount: warnings.value.filter(item => item.level === 'low').length
  }
})

const loading = computed(() =>
  dataStore.isLoading('cutter-inventory-overview') ||
  dataStore.isLoading('cutter-materials')
)
const error = computed(() =>
  dataStore.getError('cutter-inventory-overview') ||
  dataStore.getError('cutter-materials') ||
  ''
)

const categoryStats = computed(() => {
  const total = Math.max(1, overview.value.totalInventory)
  const grouped = new Map<string, number>()
  materials.value.forEach(item => {
    const name = item.cutterType || '未分类'
    grouped.set(name, (grouped.get(name) || 0) + item.inventory)
  })

  return Array.from(grouped.entries())
    .map(([name, inventory]) => ({ name, inventory, percent: Math.round((inventory / total) * 100) }))
    .sort((a, b) => b.inventory - a.inventory)
    .slice(0, 6)
})

const valueRanking = computed(() =>
  [...materials.value]
    .sort((a, b) => b.inventoryValue - a.inventoryValue)
    .slice(0, 6)
)

const handleRefresh = async () => {
  await Promise.all([
    pollingService.executeTask('cutter-inventory-overview'),
    pollingService.executeTask('cutter-materials')
  ])
}

const formatNumber = (value: number) => new Intl.NumberFormat('zh-CN').format(value || 0)
const formatMoney = (value: number) => {
  if (!value) return '¥0'
  if (value >= 10000) return `¥${(value / 10000).toFixed(1)}万`
  return `¥${Math.round(value).toLocaleString('zh-CN')}`
}
</script>

<style scoped>
.cutter-overview {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
  color: var(--color-text);
}

.mini-panel {
  height: 100%;
  display: grid;
  align-content: center;
  gap: 6px;
  padding: 4px 2px;
}

.eyebrow,
.kpi-grid span,
.panel-head span,
.mini-panel small {
  color: var(--color-text-secondary);
  font-size: 12px;
}

.mini-panel strong {
  font-size: 42px;
  line-height: 1;
  color: var(--color-primary);
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}

.mode-compact .kpi-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.kpi-grid article {
  min-width: 0;
  padding: 10px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 8px;
  background: linear-gradient(145deg, rgba(59, 130, 246, 0.12), rgba(15, 23, 42, 0.02));
}

.kpi-grid strong {
  display: block;
  margin-top: 5px;
  font-size: 23px;
  line-height: 1.1;
  color: var(--color-text);
}

.kpi-grid .warning strong {
  color: var(--color-warning);
}

.split {
  min-height: 0;
  flex: 1;
  display: grid;
  grid-template-columns: 0.9fr 1.1fr;
  gap: 12px;
}

.panel {
  min-height: 0;
  overflow: hidden;
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.panel-head h4 {
  font-size: 14px;
  font-weight: 650;
}

.bar-list,
.compact-list {
  display: grid;
  gap: 8px;
}

.bar-row,
.compact-row {
  display: grid;
  grid-template-columns: minmax(64px, 0.8fr) 1fr auto;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.bar-name,
.compact-row span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bar-track {
  height: 8px;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.18);
  overflow: hidden;
}

.bar-track i {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--color-primary), var(--color-success));
}

.rank-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.rank-table th,
.rank-table td {
  padding: 7px 6px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.16);
  text-align: left;
  white-space: nowrap;
}

.rank-table th {
  color: var(--color-text-secondary);
  font-weight: 500;
}

.rank-table td:first-child {
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.compact-row {
  grid-template-columns: 1fr auto;
  padding: 8px 0;
  border-bottom: 1px solid rgba(148, 163, 184, 0.14);
}
</style>
