<template>
  <BaseCard
    :title="title"
    variant="warning"
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
      <div class="alarm-card" :class="`mode-${displayMode}`">
        <section v-if="displayMode === 'mini'" class="mini">
          <span>库存预警</span>
          <strong>{{ warnings.length }}</strong>
          <small>{{ emptyCount }} 断供 · {{ lowCount }} 低库存</small>
        </section>

        <template v-else>
          <div class="alarm-summary">
            <article class="danger">
              <span>断供</span>
              <strong>{{ emptyCount }}</strong>
            </article>
            <article class="warn">
              <span>低库存</span>
              <strong>{{ lowCount }}</strong>
            </article>
            <article>
              <span>耗材预警</span>
              <strong>{{ materialWarningCount }}</strong>
            </article>
            <article>
              <span>货道预警</span>
              <strong>{{ slotWarningCount }}</strong>
            </article>
          </div>

          <div v-if="displayMode === 'full'" class="tabs">
            <button :class="{ active: activeTab === 'all' }" @click="activeTab = 'all'">全部</button>
            <button :class="{ active: activeTab === 'material' }" @click="activeTab = 'material'">耗材</button>
            <button :class="{ active: activeTab === 'slot' }" @click="activeTab = 'slot'">货道</button>
          </div>

          <div class="warning-list custom-scrollbar">
            <article
              v-for="(item, index) in visibleWarnings"
              :key="warningKey(item, index)"
              class="warning-row"
              :class="item.level"
            >
              <div class="risk-dot"></div>
              <div class="warning-main">
                <strong>{{ item.productName || item.materialCode || '未命名刀具' }}</strong>
                <span>{{ item.brandName || '-' }} · {{ item.specification || '-' }}</span>
                <small v-if="displayMode === 'full'">
                  {{ item.source === 'slot' ? `${item.cuttingName || item.cuttingNo || '未知刀柜'} / ${item.itemNoAlias || '未知货道'}` : item.materialCode || '无物料编码' }}
                </small>
              </div>
              <div class="warning-value">
                <b>{{ item.inventory }}</b>
                <span>/ {{ item.warnValue }}</span>
              </div>
            </article>

            <div v-if="visibleWarnings.length === 0" class="empty-state">
              当前暂无库存预警
            </div>
          </div>
        </template>
      </div>
    </template>
  </BaseCard>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import BaseCard from './BaseCard.vue'
import { useDataStore } from '@/stores/data'
import { pollingService } from '@/services/polling'
import { detectCardMode } from '@/utils/cardSizeManager'
import type { CardMode } from '@/types'
import type { CutterInventoryWarning } from '@/types/cutter'

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
  title: '库存预警',
  width: 3,
  height: 2,
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
const activeTab = ref<'all' | 'material' | 'slot'>('all')
const displayMode = computed(() => props.forcedMode || detectCardMode(props.width, props.height))

const materialWarnings = computed<CutterInventoryWarning[]>(() => dataStore.getData('cutter-inventory-warnings') || [])
const slotWarnings = computed<CutterInventoryWarning[]>(() => dataStore.getData('cutter-item-warnings') || [])
const warnings = computed(() => {
  return [...materialWarnings.value, ...slotWarnings.value]
    .sort((a, b) => {
      if (a.level !== b.level) return a.level === 'empty' ? -1 : 1
      return b.shortage - a.shortage
    })
})

const emptyCount = computed(() => warnings.value.filter(item => item.level === 'empty').length)
const lowCount = computed(() => warnings.value.filter(item => item.level === 'low').length)
const materialWarningCount = computed(() => materialWarnings.value.length)
const slotWarningCount = computed(() => slotWarnings.value.length)

const visibleWarnings = computed(() => {
  const sourceFiltered = activeTab.value === 'all'
    ? warnings.value
    : warnings.value.filter(item => item.source === activeTab.value)

  return displayMode.value === 'compact' ? sourceFiltered.slice(0, 5) : sourceFiltered.slice(0, 12)
})

const loading = computed(() =>
  dataStore.isLoading('cutter-inventory-warnings') ||
  dataStore.isLoading('cutter-item-warnings')
)
const error = computed(() =>
  dataStore.getError('cutter-inventory-warnings') ||
  dataStore.getError('cutter-item-warnings') ||
  ''
)

const handleRefresh = async () => {
  await Promise.all([
    pollingService.executeTask('cutter-inventory-warnings'),
    pollingService.executeTask('cutter-item-warnings')
  ])
}

const warningKey = (item: CutterInventoryWarning, index: number) =>
  `${item.source}-${item.id ?? 'no-id'}-${item.materialCode}-${item.cuttingNo}-${item.itemNoAlias}-${item.productName}-${index}`
</script>

<style scoped>
.alarm-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
  color: var(--color-text);
}

.mini {
  height: 100%;
  display: grid;
  align-content: center;
  gap: 6px;
}

.mini span,
.mini small,
.alarm-summary span,
.warning-main span,
.warning-main small,
.warning-value span {
  color: var(--color-text-secondary);
  font-size: 12px;
}

.mini strong {
  font-size: 44px;
  line-height: 1;
  color: var(--color-warning);
}

.alarm-summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}

.mode-compact .alarm-summary {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.alarm-summary article {
  padding: 9px 10px;
  border-radius: 8px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: rgba(148, 163, 184, 0.06);
}

.alarm-summary strong {
  display: block;
  margin-top: 4px;
  font-size: 24px;
  line-height: 1;
}

.alarm-summary .danger strong {
  color: var(--color-danger);
}

.alarm-summary .warn strong {
  color: var(--color-warning);
}

.tabs {
  display: flex;
  gap: 6px;
}

.tabs button {
  padding: 5px 10px;
  border-radius: 999px;
  color: var(--color-text-secondary);
  background: rgba(148, 163, 184, 0.08);
}

.tabs button.active {
  color: #fff;
  background: var(--color-primary);
}

.warning-list {
  min-height: 0;
  flex: 1;
  overflow: auto;
  display: grid;
  align-content: start;
  gap: 8px;
}

.warning-row {
  display: grid;
  grid-template-columns: 8px minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  min-height: 48px;
  padding: 8px 10px;
  border-radius: 8px;
  background: rgba(148, 163, 184, 0.07);
  border: 1px solid rgba(148, 163, 184, 0.14);
}

.risk-dot {
  width: 8px;
  height: 28px;
  border-radius: 999px;
  background: var(--color-warning);
}

.warning-row.empty .risk-dot {
  background: var(--color-danger);
}

.warning-main {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.warning-main strong,
.warning-main span,
.warning-main small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.warning-main strong {
  font-size: 13px;
}

.warning-value {
  text-align: right;
}

.warning-value b {
  color: var(--color-text);
  font-size: 18px;
}

.warning-row.empty .warning-value b {
  color: var(--color-danger);
}

.empty-state {
  height: 100%;
  display: grid;
  place-items: center;
  color: var(--color-text-secondary);
  font-size: 13px;
}
</style>
