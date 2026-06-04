<template>
  <BaseCard
    :title="title"
    variant="success"
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
    :is-dragging="isDragging"
    :mode-locked="modeLocked"
    @refresh="handleRefresh"
    @settings="$emit('settings')"
    @delete="$emit('delete')"
    @lock="value => $emit('lock', value)"
    @mode-lock="(locked, mode) => $emit('modeLock', locked, mode)"
  >
    <template #default>
      <div class="cabinet-card" :class="`mode-${displayMode}`">
        <section v-if="displayMode === 'mini'" class="mini-panel">
          <span class="mini-label">货道风险</span>
          <strong>{{ warningSlotCount }}</strong>
          <small>{{ emptySlotCount }} 空货道 · {{ cabinets.length }} 台刀柜</small>
        </section>

        <template v-else>
          <section class="health-strip">
            <div class="health-metric">
              <span>刀柜</span>
              <strong>{{ cabinets.length }}</strong>
            </div>
            <div class="health-metric ok">
              <span>正常</span>
              <strong>{{ normalSlotCount }}</strong>
            </div>
            <div class="health-metric warn">
              <span>预警</span>
              <strong>{{ warningSlotCount }}</strong>
            </div>
            <div class="health-metric danger">
              <span>空货道</span>
              <strong>{{ emptySlotCount }}</strong>
            </div>
          </section>

          <div class="health-bar" aria-hidden="true">
            <span class="bar-ok" :style="{ flexGrow: Math.max(normalSlotCount, 0) }"></span>
            <span class="bar-warn" :style="{ flexGrow: Math.max(warningSlotCount, 0) }"></span>
            <span class="bar-empty" :style="{ flexGrow: Math.max(emptySlotCount, 0) }"></span>
            <span v-if="totalSlotCount === 0" class="bar-empty-state"></span>
          </div>

          <section v-if="displayMode === 'compact'" class="compact-panel">
            <div class="risk-list">
              <article
                v-for="cabinet in cabinetRiskTop.slice(0, 3)"
                :key="cabinet.cuttingNo"
                class="risk-row"
                :class="cabinet.level"
              >
                <i></i>
                <div>
                  <strong>{{ cabinet.name }}</strong>
                  <span>{{ cabinet.total }} 货道 · {{ cabinet.warning }} 预警 · {{ cabinet.empty }} 空</span>
                </div>
                <b>{{ cabinet.riskScore }}</b>
              </article>
            </div>

            <div class="priority-line" :class="{ stable: prioritySlots.length === 0 }">
              <span>{{ prioritySlots.length > 0 ? '优先处理' : '当前状态' }}</span>
              <strong>{{ priorityText }}</strong>
            </div>
          </section>

          <section v-else class="full-panel">
            <div class="full-tabs">
              <button :class="{ active: fullView === 'risk' }" @click="fullView = 'risk'">
                风险视图
              </button>
              <button :class="{ active: fullView === 'cabinet' }" @click="fullView = 'cabinet'">
                单柜货道
              </button>
            </div>

            <div v-if="isDragging" class="drag-snapshot">
              <strong>{{ selectedCabinetSummary?.name || '刀柜状态' }}</strong>
              <span>{{ totalSlotCount }} 个货道 · {{ warningSlotCount }} 个预警 · {{ emptySlotCount }} 个空货道</span>
            </div>

            <div v-else-if="fullView === 'risk'" class="risk-view">
              <section class="priority-board">
                <div class="section-title">
                  <strong>优先处理货道</strong>
                  <span>按断供、低库存和缺口排序</span>
                </div>

                <div class="priority-grid">
                  <article
                    v-for="slot in prioritySlots.slice(0, 8)"
                    :key="getSlotKey(slot)"
                    class="priority-card"
                    :class="getSlotLevel(slot)"
                    @click="openCabinet(slot.cuttingNo)"
                  >
                    <div class="priority-head">
                      <strong>{{ slot.itemNoAlias || slot.itemNo || '-' }}</strong>
                      <span>{{ getSlotLevelLabel(slot) }}</span>
                    </div>
                    <p>{{ slot.productName || '未绑定刀具' }}</p>
                    <footer>
                      <span>{{ slot.cuttingName || slot.cuttingNo || '未知刀柜' }}</span>
                      <b>{{ getInventory(slot) }}/{{ slot.warnValue || slot.bindNum || '-' }}</b>
                    </footer>
                  </article>
                </div>

                <div v-if="prioritySlots.length === 0" class="empty-state">
                  当前没有需要优先处理的货道
                </div>
              </section>

              <section class="cabinet-risk-board">
                <div class="section-title">
                  <strong>柜体风险分布</strong>
                  <span>点击柜体查看单柜货道</span>
                </div>

                <div class="cabinet-risk-list custom-scrollbar">
                  <button
                    v-for="cabinet in cabinetRiskTop"
                    :key="cabinet.cuttingNo"
                    class="cabinet-risk-row"
                    :class="cabinet.level"
                    @click="openCabinet(cabinet.cuttingNo)"
                  >
                    <i></i>
                    <div class="cabinet-risk-main">
                      <strong>{{ cabinet.name }}</strong>
                      <span>{{ cabinet.total }} 货道 · {{ cabinet.warning }} 预警 · {{ cabinet.empty }} 空</span>
                      <div class="cabinet-risk-bar">
                        <em class="ok" :style="{ width: `${cabinet.okRatio}%` }"></em>
                        <em class="warn" :style="{ width: `${cabinet.warnRatio}%` }"></em>
                        <em class="empty" :style="{ width: `${cabinet.emptyRatio}%` }"></em>
                      </div>
                    </div>
                    <b>{{ cabinet.riskScore }}</b>
                  </button>
                </div>
              </section>
            </div>

            <div v-else class="cabinet-view">
              <aside class="cabinet-selector custom-scrollbar">
                <button
                  v-for="cabinet in cabinetSummaries"
                  :key="cabinet.cuttingNo"
                  :class="{ active: selectedCabinetNo === cabinet.cuttingNo }"
                  @click="selectCabinet(cabinet.cuttingNo)"
                >
                  <i :class="cabinet.level"></i>
                  <div>
                    <b>{{ cabinet.name }}</b>
                    <span>{{ cabinet.total }} 货道 · {{ cabinet.warning }} 预警</span>
                  </div>
                </button>
              </aside>

              <section class="single-cabinet">
                <div class="cabinet-toolbar">
                  <div>
                    <strong>{{ selectedCabinetSummary?.name || selectedCabinetNo || '未选择刀柜' }}</strong>
                    <span>{{ selectedSlots.length }} 货道 · 第 {{ currentSlotPage + 1 }} / {{ slotPageCount }} 页</span>
                  </div>
                  <div class="pager">
                    <button :disabled="currentSlotPage <= 0" @click="currentSlotPage -= 1">上一页</button>
                    <button :disabled="currentSlotPage >= slotPageCount - 1" @click="currentSlotPage += 1">下一页</button>
                  </div>
                </div>

                <div class="slot-grid custom-scrollbar">
                  <article
                    v-for="slot in pagedSelectedSlots"
                    :key="getSlotKey(slot)"
                    class="slot"
                    :class="getSlotLevel(slot)"
                    :title="`${slot.itemNoAlias || slot.itemNo}: ${slot.productName || '未绑定刀具'}`"
                  >
                    <span>{{ slot.itemNoAlias || slot.itemNo || '-' }}</span>
                    <b>{{ getInventory(slot) }}</b>
                    <small>{{ slot.productName || '未绑定' }}</small>
                  </article>

                  <div v-if="selectedSlots.length === 0" class="empty-state">
                    暂无货道库存数据
                  </div>
                </div>
              </section>
            </div>
          </section>
        </template>
      </div>
    </template>
  </BaseCard>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import BaseCard from './BaseCard.vue'
import { useDataStore } from '@/stores/data'
import { pollingService } from '@/services/polling'
import { detectCardMode } from '@/utils/cardSizeManager'
import type { CardMode } from '@/types'
import type { CutterCabinet, CutterCargoSlot } from '@/types/cutter'

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
  isDragging?: boolean
}>(), {
  title: '刀柜货道状态',
  width: 4,
  height: 3,
  minWidth: 2,
  minHeight: 2,
  showRefresh: true,
  showSettings: true,
  locked: false,
  isDragging: false
})

defineEmits<{
  refresh: []
  settings: []
  delete: []
  lock: [locked: boolean]
  modeLock: [locked: boolean, mode: CardMode]
}>()

type FullView = 'risk' | 'cabinet'
type RiskLevel = 'normal' | 'warning' | 'empty'

interface CabinetSummary {
  cuttingNo: string
  name: string
  total: number
  normal: number
  warning: number
  empty: number
  riskScore: number
  level: RiskLevel
  okRatio: number
  warnRatio: number
  emptyRatio: number
}

const dataStore = useDataStore()
const selectedCabinetNo = ref('')
const fullView = ref<FullView>('risk')
const currentSlotPage = ref(0)
const slotPageSize = 42

const displayMode = computed(() => props.forcedMode || detectCardMode(props.width, props.height))

const cabinets = computed<CutterCabinet[]>(() => dataStore.getData('cutter-cabinets') || [])
const slots = computed<CutterCargoSlot[]>(() => dataStore.getData('cutter-cargo-inventory') || [])

const slotsByCabinet = computed(() => {
  const grouped = new Map<string, CutterCargoSlot[]>()

  for (const slot of slots.value) {
    const cabinetNo = slot.cuttingNo || (cabinets.value.length <= 1 ? cabinets.value[0]?.cuttingNo || '' : '')
    const list = grouped.get(cabinetNo) || []
    list.push(slot)
    grouped.set(cabinetNo, list)
  }

  grouped.forEach(list => {
    list.sort((a, b) =>
      (a.itemNoAlias || a.itemNo).localeCompare(b.itemNoAlias || b.itemNo, 'zh-CN', { numeric: true })
    )
  })

  return grouped
})

const cabinetSummaries = computed<CabinetSummary[]>(() => {
  const knownCabinets = cabinets.value.length
    ? cabinets.value
    : Array.from(slotsByCabinet.value.keys()).map(cuttingNo => ({ cuttingNo, cuttingName: cuttingNo }))

  return knownCabinets.map(cabinet => {
    const cabinetSlots = slotsByCabinet.value.get(cabinet.cuttingNo) || []
    const empty = cabinetSlots.filter(slot => getSlotLevel(slot) === 'empty').length
    const warning = cabinetSlots.filter(slot => getSlotLevel(slot) === 'warning').length
    const normal = cabinetSlots.filter(slot => getSlotLevel(slot) === 'normal').length
    const total = cabinetSlots.length
    const riskScore = empty * 3 + warning * 2
    const level: RiskLevel = empty > 0 ? 'empty' : warning > 0 ? 'warning' : 'normal'
    const denominator = Math.max(total, 1)

    return {
      cuttingNo: cabinet.cuttingNo,
      name: cabinet.cuttingName || cabinet.cuttingNo,
      total,
      normal,
      warning,
      empty,
      riskScore,
      level,
      okRatio: Math.round((normal / denominator) * 100),
      warnRatio: Math.round((warning / denominator) * 100),
      emptyRatio: Math.round((empty / denominator) * 100)
    }
  })
})

const cabinetRiskTop = computed(() =>
  [...cabinetSummaries.value].sort((a, b) => b.riskScore - a.riskScore || b.total - a.total)
)

watch(cabinets, (items) => {
  if (!selectedCabinetNo.value && items.length > 0) {
    selectedCabinetNo.value = items[0].cuttingNo
  }
}, { immediate: true })

watch(selectedCabinetNo, () => {
  currentSlotPage.value = 0
})

const warningSlots = computed(() =>
  slots.value.filter(item => getSlotLevel(item) === 'warning')
)

const prioritySlots = computed(() =>
  [...slots.value]
    .filter(item => getSlotLevel(item) === 'empty' || getSlotLevel(item) === 'warning')
    .sort((a, b) => getSlotPriority(b) - getSlotPriority(a))
)

const totalSlotCount = computed(() => slots.value.length)
const emptySlotCount = computed(() => slots.value.filter(item => getSlotLevel(item) === 'empty').length)
const warningSlotCount = computed(() => warningSlots.value.length)
const normalSlotCount = computed(() =>
  slots.value.filter(item => getSlotLevel(item) === 'normal').length
)

const selectedCabinetSummary = computed(() =>
  cabinetSummaries.value.find(item => item.cuttingNo === selectedCabinetNo.value)
)

const selectedSlots = computed(() => slotsByCabinet.value.get(selectedCabinetNo.value) || [])
const slotPageCount = computed(() => Math.max(1, Math.ceil(selectedSlots.value.length / slotPageSize)))
const pagedSelectedSlots = computed(() => {
  const start = currentSlotPage.value * slotPageSize
  return selectedSlots.value.slice(start, start + slotPageSize)
})

const priorityText = computed(() => {
  if (prioritySlots.value.length === 0) return '当前货道状态稳定'
  return prioritySlots.value
    .slice(0, 3)
    .map(slot => slot.itemNoAlias || slot.itemNo || slot.cuttingName || '未知货道')
    .join('、')
})

const loading = computed(() =>
  dataStore.isLoading('cutter-cabinets') ||
  dataStore.isLoading('cutter-cargo-inventory')
)
const error = computed(() =>
  dataStore.getError('cutter-cabinets') ||
  dataStore.getError('cutter-cargo-inventory') ||
  ''
)

function getInventory(slot: CutterCargoSlot) {
  return Number(slot.inventory ?? slot.surplus ?? 0)
}

function getSlotLevel(slot: CutterCargoSlot): 'normal' | 'warning' | 'empty' | 'disabled' {
  const inventory = getInventory(slot)
  if (slot.disabled) return 'disabled'
  if (slot.empty || inventory <= 0) return 'empty'
  if (inventory <= slot.warnValue) return 'warning'
  return 'normal'
}

function getSlotPriority(slot: CutterCargoSlot) {
  const level = getSlotLevel(slot)
  const shortage = Math.max(0, Number(slot.warnValue || 0) - getInventory(slot))
  if (level === 'empty') return 10000 + shortage
  if (level === 'warning') return 5000 + shortage
  return shortage
}

function getSlotLevelLabel(slot: CutterCargoSlot) {
  const level = getSlotLevel(slot)
  if (level === 'empty') return '断供'
  if (level === 'warning') return '低库存'
  if (level === 'disabled') return '停用'
  return '正常'
}

function getSlotKey(slot: CutterCargoSlot) {
  return `${slot.cuttingNo}-${slot.itemNoAlias}-${slot.itemNo}-${slot.materialCode}`
}

function selectCabinet(cuttingNo: string) {
  selectedCabinetNo.value = cuttingNo
}

function openCabinet(cuttingNo: string) {
  if (cuttingNo) selectedCabinetNo.value = cuttingNo
  fullView.value = 'cabinet'
}

const handleRefresh = async () => {
  await Promise.all([
    pollingService.executeTask('cutter-cabinets'),
    pollingService.executeTask('cutter-cargo-inventory')
  ])
}
</script>

<style scoped>
.cabinet-card {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  color: var(--color-text);
}

.mini-panel {
  height: 100%;
  display: grid;
  align-content: center;
  gap: 6px;
}

.mini-label,
.mini-panel small,
.health-metric span,
.section-title span,
.risk-row span,
.priority-line span,
.priority-card p,
.priority-card footer span,
.cabinet-risk-row span,
.cabinet-selector span,
.cabinet-toolbar span,
.slot small {
  color: var(--color-text-secondary);
  font-size: 12px;
}

.mini-panel strong {
  font-size: 44px;
  line-height: 1;
  color: var(--color-warning);
}

.health-strip {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}

.mode-compact .health-strip {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.health-metric {
  min-width: 0;
  padding: 8px 9px;
  border-radius: 8px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: rgba(148, 163, 184, 0.06);
}

.health-metric strong {
  display: block;
  margin-top: 4px;
  font-size: 22px;
  line-height: 1;
}

.mode-compact .health-metric {
  padding: 7px;
}

.mode-compact .health-metric strong {
  font-size: 19px;
}

.health-metric.ok strong {
  color: var(--color-success);
}

.health-metric.warn strong {
  color: var(--color-warning);
}

.health-metric.danger strong {
  color: var(--color-danger);
}

.health-bar {
  height: 7px;
  display: flex;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.16);
}

.health-bar span {
  min-width: 4px;
}

.bar-ok {
  background: var(--color-success);
}

.bar-warn {
  background: var(--color-warning);
}

.bar-empty {
  background: var(--color-danger);
}

.bar-empty-state {
  flex: 1;
  background: rgba(148, 163, 184, 0.28);
}

.compact-panel {
  min-height: 0;
  flex: 1;
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto;
  gap: 8px;
}

.risk-list {
  min-height: 0;
  display: grid;
  align-content: start;
  gap: 7px;
  overflow: hidden;
}

.risk-row,
.cabinet-risk-row {
  min-width: 0;
  display: grid;
  grid-template-columns: 9px minmax(0, 1fr) auto;
  gap: 9px;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid rgba(148, 163, 184, 0.14);
}

.risk-row i,
.cabinet-risk-row i,
.cabinet-selector i {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: var(--color-success);
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.12);
}

.risk-row.warning i,
.cabinet-risk-row.warning i,
.cabinet-selector i.warning {
  background: var(--color-warning);
  box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.14);
}

.risk-row.empty i,
.cabinet-risk-row.empty i,
.cabinet-selector i.empty {
  background: var(--color-danger);
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.14);
}

.risk-row div,
.cabinet-risk-main {
  min-width: 0;
  display: grid;
  gap: 3px;
}

.risk-row strong,
.risk-row span,
.cabinet-risk-row strong,
.cabinet-risk-row span,
.cabinet-selector b,
.cabinet-selector span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.risk-row b,
.cabinet-risk-row b {
  font-size: 18px;
  color: var(--color-warning);
}

.priority-line {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 8px;
  align-items: center;
  padding: 8px 10px;
  border-radius: 8px;
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.2);
}

.priority-line.stable {
  background: rgba(16, 185, 129, 0.1);
  border-color: rgba(16, 185, 129, 0.2);
}

.priority-line strong {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--color-text);
  font-size: 13px;
}

.full-panel {
  min-height: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.full-tabs {
  display: inline-flex;
  align-self: flex-start;
  padding: 3px;
  border-radius: 8px;
  background: rgba(148, 163, 184, 0.1);
  border: 1px solid rgba(148, 163, 184, 0.14);
}

.full-tabs button {
  padding: 5px 10px;
  border-radius: 6px;
  color: var(--color-text-secondary);
  font-size: 12px;
}

.full-tabs button.active {
  color: var(--color-text);
  background: var(--color-surface);
  box-shadow: 0 1px 4px rgba(15, 23, 42, 0.08);
}

.risk-view {
  min-height: 0;
  flex: 1;
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(210px, 0.85fr);
  gap: 10px;
}

.priority-board,
.cabinet-risk-board,
.single-cabinet {
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.section-title {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

.section-title strong {
  font-size: 13px;
}

.priority-grid {
  min-height: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  overflow: hidden;
}

.priority-card {
  min-width: 0;
  display: grid;
  gap: 6px;
  padding: 9px;
  border-radius: 8px;
  border: 1px solid rgba(245, 158, 11, 0.24);
  background: rgba(245, 158, 11, 0.09);
  cursor: pointer;
}

.priority-card.empty {
  border-color: rgba(239, 68, 68, 0.28);
  background: rgba(239, 68, 68, 0.1);
}

.priority-head,
.priority-card footer {
  min-width: 0;
  display: flex;
  justify-content: space-between;
  gap: 8px;
  align-items: center;
}

.priority-head strong,
.priority-card p,
.priority-card footer span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.priority-head span {
  flex: 0 0 auto;
  padding: 2px 6px;
  border-radius: 999px;
  font-size: 11px;
  color: var(--color-warning);
  background: rgba(245, 158, 11, 0.14);
}

.priority-card.empty .priority-head span {
  color: var(--color-danger);
  background: rgba(239, 68, 68, 0.14);
}

.priority-card footer b {
  color: var(--color-warning);
}

.priority-card.empty footer b {
  color: var(--color-danger);
}

.cabinet-risk-list {
  min-height: 0;
  overflow: auto;
  display: grid;
  align-content: start;
  gap: 4px;
}

.cabinet-risk-row {
  width: 100%;
  text-align: left;
  border: 1px solid rgba(148, 163, 184, 0.14);
  border-radius: 8px;
  padding: 8px;
  background: rgba(148, 163, 184, 0.06);
}

.cabinet-risk-row:hover {
  border-color: var(--color-primary);
}

.cabinet-risk-bar {
  height: 5px;
  display: flex;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.14);
}

.cabinet-risk-bar em.ok {
  background: var(--color-success);
}

.cabinet-risk-bar em.warn {
  background: var(--color-warning);
}

.cabinet-risk-bar em.empty {
  background: var(--color-danger);
}

.cabinet-view {
  min-height: 0;
  flex: 1;
  display: grid;
  grid-template-columns: 170px minmax(0, 1fr);
  gap: 10px;
}

.cabinet-selector {
  min-height: 0;
  overflow: auto;
  display: grid;
  align-content: start;
  gap: 7px;
}

.cabinet-selector button {
  min-width: 0;
  display: grid;
  grid-template-columns: 10px minmax(0, 1fr);
  gap: 8px;
  align-items: center;
  padding: 8px;
  border-radius: 8px;
  text-align: left;
  background: rgba(148, 163, 184, 0.08);
  border: 1px solid rgba(148, 163, 184, 0.14);
}

.cabinet-selector button.active {
  border-color: var(--color-primary);
  background: rgba(59, 130, 246, 0.14);
}

.single-cabinet {
  min-width: 0;
}

.cabinet-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.cabinet-toolbar > div:first-child {
  min-width: 0;
  display: grid;
  gap: 2px;
}

.cabinet-toolbar strong,
.cabinet-toolbar span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pager {
  flex: 0 0 auto;
  display: flex;
  gap: 6px;
}

.pager button {
  padding: 5px 8px;
  border-radius: 6px;
  font-size: 12px;
  background: rgba(148, 163, 184, 0.12);
  color: var(--color-text);
}

.pager button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.slot-grid {
  min-height: 0;
  overflow: auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(78px, 1fr));
  gap: 8px;
  align-content: start;
}

.slot {
  min-height: 68px;
  display: grid;
  gap: 3px;
  padding: 8px;
  border-radius: 8px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  background: rgba(16, 185, 129, 0.1);
}

.slot span,
.slot small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.slot b {
  font-size: 19px;
  color: var(--color-success);
}

.slot.warning {
  background: rgba(245, 158, 11, 0.12);
  border-color: rgba(245, 158, 11, 0.32);
}

.slot.warning b {
  color: var(--color-warning);
}

.slot.empty {
  background: rgba(239, 68, 68, 0.12);
  border-color: rgba(239, 68, 68, 0.32);
}

.slot.empty b {
  color: var(--color-danger);
}

.slot.disabled {
  opacity: 0.45;
  background: rgba(148, 163, 184, 0.08);
}

.drag-snapshot,
.empty-state {
  min-height: 0;
  display: grid;
  place-content: center;
  gap: 8px;
  padding: 16px;
  border-radius: 8px;
  border: 1px dashed rgba(148, 163, 184, 0.4);
  background: rgba(148, 163, 184, 0.08);
  color: var(--color-text-secondary);
  text-align: center;
  font-size: 13px;
}

@media (max-width: 900px) {
  .risk-view,
  .cabinet-view {
    grid-template-columns: 1fr;
  }

  .cabinet-selector {
    max-height: 120px;
  }
}
</style>
