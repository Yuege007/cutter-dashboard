<template>
  <BaseCard
    :title="title"
    variant="warning"
    :mode="displayMode"
    :width="width"
    :height="height"
    :min-width="minWidth"
    :min-height="minHeight"
    :loading="initialLoading"
    :refreshing="refreshing"
    loading-text="加载库存预警..."
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
          <small>{{ emptyCount }} 缺货 · {{ lowCount }} 低库存</small>
        </section>

        <template v-else>
          <section class="alarm-summary">
            <article class="danger">
              <span>缺货</span>
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
          </section>

          <section v-if="displayMode === 'compact'" class="compact-panel">
            <Transition name="alarm-slide" mode="out-in">
              <article
                :key="compactPageKey"
                class="compact-slide"
                :class="activeCompactPage?.level"
              >
                <div class="slide-meta">
                  <span>{{ activeCompactPage?.label }}</span>
                  <b>{{ activeCompactPage?.tag }}</b>
                </div>
                <strong>{{ activeCompactPage?.title }}</strong>
                <p>{{ activeCompactPage?.description }}</p>
                <footer>
                  <span>{{ activeCompactPage?.detail }}</span>
                  <em>{{ activeCompactPage?.value }}</em>
                </footer>
              </article>
            </Transition>

            <div v-if="compactPages.length > 1" class="carousel-dots">
              <button
                v-for="(_, index) in compactPages"
                :key="index"
                :class="{ active: index === compactPageIndex }"
                @click="setCompactPage(index)"
              ></button>
            </div>
          </section>

          <section v-else class="full-panel">
            <div class="tabs">
              <button :class="{ active: activeTab === 'all' }" @click="setActiveTab('all')">全部</button>
              <button :class="{ active: activeTab === 'material' }" @click="setActiveTab('material')">耗材</button>
              <button :class="{ active: activeTab === 'slot' }" @click="setActiveTab('slot')">货道</button>
            </div>

            <div class="list-toolbar">
              <div>
                <strong>{{ tabTitle }}</strong>
                <span>{{ filteredWarnings.length }} 条 · 第 {{ currentPage + 1 }} / {{ pageCount }} 页 · 每页 {{ pageSize }} 条</span>
              </div>
              <div class="pager">
                <button :disabled="currentPage <= 0" aria-label="上一页" title="上一页" @click="goToPreviousPage">
                  ‹
                </button>
                <button :disabled="filteredWarnings.length === 0" aria-label="下一页" title="下一页" @click="goToNextPage">
                  ›
                </button>
              </div>
            </div>

            <div ref="warningListRef" class="warning-list">
              <Transition :name="pageTransitionName" mode="out-in">
                <div :key="`${activeTab}-${currentPage}-${pageSize}`" class="warning-page">
                  <article
                    v-for="(item, index) in pagedWarnings"
                    :key="warningKey(item, index)"
                    class="warning-row"
                    :class="item.level"
                  >
                    <div class="risk-dot"></div>
                    <div class="warning-main">
                      <div class="warning-title">
                        <strong>{{ item.productName || item.materialCode || '未命名刀具' }}</strong>
                        <b>{{ item.source === 'slot' ? '货道' : '耗材' }}</b>
                      </div>
                      <span>{{ item.brandName || '-' }} · {{ item.specification || '-' }}</span>
                      <small>
                        {{ item.source === 'slot' ? `${item.cuttingName || item.cuttingNo || '未知刀柜'} / ${item.itemNoAlias || '未知货道'}` : item.materialCode || '无物料编码' }}
                      </small>
                    </div>
                    <div class="warning-value">
                      <div>
                        <b>{{ item.inventory }}</b>
                        <span>/ {{ item.warnValue }}</span>
                      </div>
                      <em>{{ item.level === 'empty' ? '缺货' : '低库存' }}</em>
                    </div>
                  </article>
                </div>
              </Transition>

              <div v-if="filteredWarnings.length === 0" class="empty-state">
                当前暂无库存预警
              </div>
            </div>

            <div v-if="pageCount > 1" class="page-progress">
              <i :key="`alarm-progress-${activeTab}-${currentPage}`"></i>
            </div>
          </section>
        </template>
      </div>
    </template>
  </BaseCard>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
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

type AlarmTab = 'all' | 'material' | 'slot'
type PageDirection = 'forward' | 'backward'

interface CompactPage {
  type: 'top' | 'material' | 'slot' | 'stable'
  label: string
  tag: string
  title: string
  description: string
  detail: string
  value: string
  level: 'empty' | 'low' | 'stable'
}

const dataStore = useDataStore()
const activeTab = ref<AlarmTab>('all')
const currentPage = ref(0)
const pageDirection = ref<PageDirection>('forward')
const compactPageIndex = ref(0)
const manualRefreshing = ref(false)
const warningListRef = ref<HTMLElement | null>(null)
const warningListHeight = ref(0)
const pageTimer = ref<ReturnType<typeof setInterval> | null>(null)
const compactTimer = ref<ReturnType<typeof setInterval> | null>(null)
const resizeObserver = ref<ResizeObserver | null>(null)

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

const filteredWarnings = computed(() => {
  if (activeTab.value === 'all') return warnings.value
  return warnings.value.filter(item => item.source === activeTab.value)
})

const pageSize = computed(() => {
  if (displayMode.value !== 'full') return 1
  const availableHeight = warningListHeight.value || 240
  const rowHeight = 84
  const rowGap = 10
  return Math.max(1, Math.floor((availableHeight + rowGap) / (rowHeight + rowGap)))
})

const pageCount = computed(() => Math.max(1, Math.ceil(filteredWarnings.value.length / pageSize.value)))
const pagedWarnings = computed(() => {
  const start = currentPage.value * pageSize.value
  return filteredWarnings.value.slice(start, start + pageSize.value)
})
const pageTransitionName = computed(() => pageDirection.value === 'backward' ? 'page-slide-back' : 'page-slide')

const tabTitle = computed(() => {
  if (activeTab.value === 'material') return '耗材预警'
  if (activeTab.value === 'slot') return '货道预警'
  return '全部预警'
})

const topWarning = computed(() => warnings.value[0])
const topMaterialWarning = computed(() => materialWarnings.value[0])
const topSlotWarning = computed(() => slotWarnings.value[0])

const compactPages = computed<CompactPage[]>(() => {
  if (warnings.value.length === 0) {
    return [{
      type: 'stable',
      label: '当前状态',
      tag: '正常',
      title: '暂无库存预警',
      description: '所有已接入的耗材和货道暂未触发预警。',
      detail: '系统会继续按轮询周期刷新',
      value: '0',
      level: 'stable'
    }]
  }

  const pages: CompactPage[] = []
  if (topWarning.value) {
    pages.push(buildCompactPage(topWarning.value, 'top'))
  }
  if (topMaterialWarning.value) {
    pages.push(buildCompactPage(topMaterialWarning.value, 'material'))
  }
  if (topSlotWarning.value) {
    pages.push(buildCompactPage(topSlotWarning.value, 'slot'))
  }
  return pages
})

const activeCompactPage = computed(() => compactPages.value[compactPageIndex.value] || compactPages.value[0])
const compactPageKey = computed(() => `${activeCompactPage.value?.type}-${compactPageIndex.value}-${warnings.value.length}`)

const storeLoading = computed(() =>
  dataStore.isLoading('cutter-inventory-warnings') ||
  dataStore.isLoading('cutter-item-warnings')
)
const initialLoading = computed(() => storeLoading.value && warnings.value.length === 0)
const refreshing = computed(() => manualRefreshing.value || (storeLoading.value && warnings.value.length > 0))
const error = computed(() =>
  dataStore.getError('cutter-inventory-warnings') ||
  dataStore.getError('cutter-item-warnings') ||
  ''
)

const buildCompactPage = (item: CutterInventoryWarning, type: CompactPage['type']): CompactPage => {
  const isSlot = item.source === 'slot'
  const label = type === 'top' ? '最急预警' : isSlot ? '货道预警' : '耗材预警'
  const location = isSlot
    ? `${item.cuttingName || item.cuttingNo || '未知刀柜'} / ${item.itemNoAlias || '未知货道'}`
    : item.materialCode || '无物料编码'

  return {
    type,
    label,
    tag: item.level === 'empty' ? '缺货' : '低库存',
    title: item.productName || item.materialCode || '未命名刀具',
    description: `${item.brandName || '-'} · ${item.specification || '-'}`,
    detail: location,
    value: `${item.inventory}/${item.warnValue}`,
    level: item.level
  }
}

const measureWarningList = () => {
  if (!warningListRef.value) return
  warningListHeight.value = warningListRef.value.clientHeight
}

const resetPageTimer = () => {
  if (pageTimer.value) clearInterval(pageTimer.value)
  pageTimer.value = null
  if (displayMode.value !== 'full' || pageCount.value <= 1) return

  pageTimer.value = setInterval(() => {
    goToNextPage(false)
  }, 6000)
}

const resetCompactTimer = () => {
  if (compactTimer.value) clearInterval(compactTimer.value)
  compactTimer.value = null
  if (displayMode.value !== 'compact' || compactPages.value.length <= 1) return

  compactTimer.value = setInterval(() => {
    compactPageIndex.value = (compactPageIndex.value + 1) % compactPages.value.length
  }, 5000)
}

const setActiveTab = (tab: AlarmTab) => {
  pageDirection.value = 'forward'
  activeTab.value = tab
  currentPage.value = 0
  resetPageTimer()
}

const goToPreviousPage = () => {
  if (pageCount.value <= 1) return
  pageDirection.value = 'backward'
  currentPage.value = currentPage.value <= 0 ? pageCount.value - 1 : currentPage.value - 1
  resetPageTimer()
}

const goToNextPage = (restartTimer = true) => {
  if (pageCount.value <= 1) return
  pageDirection.value = 'forward'
  currentPage.value = (currentPage.value + 1) % pageCount.value
  if (restartTimer) resetPageTimer()
}

const setCompactPage = (index: number) => {
  compactPageIndex.value = index
  resetCompactTimer()
}

const handleRefresh = async () => {
  if (manualRefreshing.value) return
  manualRefreshing.value = true
  try {
    await Promise.all([
      pollingService.executeTask('cutter-inventory-warnings'),
      pollingService.executeTask('cutter-item-warnings')
    ])
  } finally {
    manualRefreshing.value = false
  }
}

const warningKey = (item: CutterInventoryWarning, index: number) =>
  `${item.source}-${item.id ?? 'no-id'}-${item.materialCode}-${item.cuttingNo}-${item.itemNoAlias}-${item.productName}-${currentPage.value}-${index}`

watch([displayMode, pageCount, pageSize, filteredWarnings], () => {
  currentPage.value = Math.min(currentPage.value, pageCount.value - 1)
  resetPageTimer()
}, { flush: 'post' })

watch([displayMode, compactPages], () => {
  compactPageIndex.value = Math.min(compactPageIndex.value, compactPages.value.length - 1)
  resetCompactTimer()
}, { flush: 'post' })

watch(() => [props.width, props.height], async () => {
  await nextTick()
  measureWarningList()
})

onMounted(async () => {
  await nextTick()
  measureWarningList()
  if (warningListRef.value) {
    resizeObserver.value = new ResizeObserver(measureWarningList)
    resizeObserver.value.observe(warningListRef.value)
  }
  resetPageTimer()
  resetCompactTimer()
})

onBeforeUnmount(() => {
  if (pageTimer.value) clearInterval(pageTimer.value)
  if (compactTimer.value) clearInterval(compactTimer.value)
  resizeObserver.value?.disconnect()
})
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
.warning-value span,
.list-toolbar span,
.slide-meta span,
.compact-slide p,
.compact-slide footer {
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
  gap: 6px;
  flex: none;
}

.mode-compact .alarm-summary article {
  padding: 7px 10px;
}

.mode-compact .alarm-summary strong {
  margin-top: 3px;
  font-size: 22px;
}

.alarm-summary article {
  padding: 9px 10px;
  border-radius: 8px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: rgba(148, 163, 184, 0.06);
  min-width: 0;
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

.compact-panel,
.full-panel {
  min-height: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.full-panel {
  gap: 8px;
}

.compact-panel {
  gap: 6px;
}

.compact-slide {
  flex: 1;
  min-height: 0;
  display: grid;
  align-content: center;
  gap: 6px;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: linear-gradient(135deg, rgba(248, 250, 252, 0.95), rgba(241, 245, 249, 0.72));
  overflow: hidden;
}

.compact-slide.empty {
  border-color: rgba(220, 38, 38, 0.22);
  background: linear-gradient(135deg, rgba(254, 226, 226, 0.8), rgba(248, 250, 252, 0.9));
}

.compact-slide.low {
  border-color: rgba(245, 158, 11, 0.24);
  background: linear-gradient(135deg, rgba(254, 243, 199, 0.72), rgba(248, 250, 252, 0.9));
}

.compact-slide.stable {
  border-color: rgba(22, 163, 74, 0.22);
  background: linear-gradient(135deg, rgba(220, 252, 231, 0.64), rgba(248, 250, 252, 0.9));
}

.slide-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.slide-meta b,
.warning-title b {
  flex: none;
  padding: 2px 7px;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.14);
  color: var(--color-text-secondary);
  font-size: 11px;
  font-weight: 700;
}

.compact-slide strong {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 18px;
}

.mode-compact .compact-slide strong {
  font-size: 16px;
}

.mode-compact .compact-slide p {
  display: none;
}

.mode-compact .compact-slide {
  grid-template-columns: minmax(0, 1fr) auto;
  grid-template-rows: auto minmax(0, 1fr);
  align-content: stretch;
  align-items: center;
  gap: 5px 10px;
  padding: 8px 12px;
}

.mode-compact .compact-slide .slide-meta {
  display: contents;
}

.mode-compact .compact-slide .slide-meta span {
  grid-column: 1;
  grid-row: 1;
}

.mode-compact .compact-slide .slide-meta b {
  grid-column: 2;
  grid-row: 1;
  justify-self: end;
}

.mode-compact .compact-slide strong {
  grid-column: 1;
  grid-row: 2;
  align-self: center;
}

.mode-compact .compact-slide footer {
  grid-column: 2;
  grid-row: 2;
  justify-self: end;
  align-self: center;
}

.mode-compact .compact-slide footer span {
  display: none;
}

.compact-slide p,
.compact-slide footer span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.compact-slide footer {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  align-items: end;
}

.compact-slide footer em {
  color: var(--color-text);
  font-size: 20px;
  font-style: normal;
  font-weight: 800;
}

.mode-compact .compact-slide footer em {
  font-size: 18px;
}

.carousel-dots {
  height: 8px;
  display: flex;
  justify-content: center;
  gap: 6px;
}

.carousel-dots button {
  width: 16px;
  height: 3px;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.28);
  transition: width 0.2s ease, background 0.2s ease;
}

.carousel-dots button.active {
  width: 26px;
  background: var(--color-warning);
}

.tabs {
  display: flex;
  gap: 6px;
  flex: none;
}

.tabs button {
  padding: 6px 12px;
  border-radius: 8px;
  color: var(--color-text-secondary);
  background: rgba(148, 163, 184, 0.08);
}

.tabs button.active {
  color: #fff;
  background: var(--color-primary);
}

.list-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 38px;
  flex: none;
}

.list-toolbar div:first-child {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.list-toolbar strong,
.list-toolbar span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pager {
  display: flex;
  gap: 5px;
  flex: none;
}

.pager button {
  width: 30px;
  height: 30px;
  display: grid;
  place-items: center;
  padding: 0;
  color: var(--color-text-secondary);
  background: transparent;
  font-size: 24px;
  line-height: 1;
  font-weight: 500;
  transition: color 0.18s ease, transform 0.18s ease;
}

.pager button:not(:disabled):hover {
  color: var(--color-primary);
  transform: translateY(-1px);
}

.pager button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.warning-list {
  min-height: 0;
  flex: 1;
  overflow: hidden;
  position: relative;
}

.warning-page {
  height: 100%;
  display: grid;
  align-content: start;
  gap: 10px;
}

.warning-row {
  display: grid;
  grid-template-columns: 5px minmax(0, 1fr) 64px;
  align-items: center;
  gap: 12px;
  height: 84px;
  padding: 10px 14px 10px 12px;
  border-radius: 8px;
  background: rgba(148, 163, 184, 0.07);
  border: 1px solid rgba(148, 163, 184, 0.14);
}

.risk-dot {
  width: 5px;
  height: 44px;
  border-radius: 999px;
  background: var(--color-warning);
  opacity: 0.9;
}

.warning-row.empty .risk-dot {
  background: var(--color-danger);
}

.warning-main {
  display: grid;
  gap: 3px;
  min-width: 0;
}

.warning-title {
  display: flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
}

.warning-title strong,
.warning-main span,
.warning-main small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.warning-title strong {
  min-width: 0;
  font-size: 14px;
  line-height: 1.25;
}

.warning-value {
  min-width: 0;
  height: 100%;
  text-align: center;
  display: grid;
  align-content: center;
  justify-items: center;
  gap: 6px;
  padding-left: 10px;
  border-left: 1px solid rgba(148, 163, 184, 0.16);
}

.warning-value div {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 2px;
  min-width: 0;
}

.warning-value b {
  color: var(--color-text);
  font-size: 23px;
  line-height: 1;
}

.warning-row.empty .warning-value b,
.compact-slide.empty footer em {
  color: var(--color-danger);
}

.compact-slide.low footer em {
  color: var(--color-warning);
}

.warning-value em {
  color: var(--color-text-secondary);
  font-size: 11px;
  font-style: normal;
  line-height: 1;
}

.page-progress {
  height: 8px;
  display: flex;
  align-items: center;
  flex: none;
}

.page-progress i {
  height: 3px;
  flex: 1;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.18);
  overflow: hidden;
  position: relative;
}

.page-progress i::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: var(--color-warning);
  transform-origin: left;
  animation: pageProgress 6s linear forwards;
}

.empty-state {
  height: 100%;
  display: grid;
  place-items: center;
  color: var(--color-text-secondary);
  font-size: 13px;
  border: 1px dashed rgba(148, 163, 184, 0.28);
  border-radius: 8px;
  background: rgba(148, 163, 184, 0.04);
}

.alarm-slide-enter-active,
.alarm-slide-leave-active {
  transition: opacity 0.22s ease, transform 0.22s ease;
}

.alarm-slide-enter-from,
.alarm-slide-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

.page-slide-enter-active,
.page-slide-leave-active,
.page-slide-back-enter-active,
.page-slide-back-leave-active {
  transition: opacity 0.24s ease, transform 0.24s ease;
}

.page-slide-enter-from {
  opacity: 0;
  transform: translateX(18px);
}

.page-slide-leave-to {
  opacity: 0;
  transform: translateX(-18px);
}

.page-slide-back-enter-from {
  opacity: 0;
  transform: translateX(-18px);
}

.page-slide-back-leave-to {
  opacity: 0;
  transform: translateX(18px);
}

@keyframes pageProgress {
  from {
    transform: scaleX(0);
  }
  to {
    transform: scaleX(1);
  }
}

@media (max-width: 520px) {
  .alarm-summary,
  .mode-compact .alarm-summary {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .list-toolbar {
    align-items: stretch;
    flex-direction: column;
  }

  .pager {
    justify-content: flex-end;
  }
}
</style>

