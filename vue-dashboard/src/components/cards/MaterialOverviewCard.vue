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
    <template #default>
      <div
        class="material-overview"
        :class="[`mode-${displayMode}`, { 'compact-tight': isCompactTight }]"
      >
        <section v-if="displayMode === 'mini'" class="mini-panel">
          <span>总库存</span>
          <strong :title="formatNumber(overview.totalInventory)">
            {{ formatCompactNumber(overview.totalInventory) }}
          </strong>
          <small>
            {{ formatCompactNumber(overview.materialCount) }} 种刀具 · {{ formatCompactNumber(overview.warningCount) }} 项预警
          </small>
        </section>

        <template v-else>
          <section class="overview-kpis">
            <article>
              <span>刀具种类</span>
              <strong :title="formatNumber(overview.materialCount)">
                {{ formatCompactNumber(overview.materialCount) }}
              </strong>
            </article>
            <article>
              <span>总库存</span>
              <strong :title="formatNumber(overview.totalInventory)">
                {{ formatCompactNumber(overview.totalInventory) }}
              </strong>
            </article>
            <article>
              <span>库存价值</span>
              <strong :title="formatMoney(overview.totalValue)">
                {{ formatCompactMoney(overview.totalValue) }}
              </strong>
            </article>
            <article class="warning">
              <span>预警数量</span>
              <strong :title="formatNumber(overview.warningCount)">
                {{ formatCompactNumber(overview.warningCount) }}
              </strong>
            </article>
          </section>

          <section v-if="displayMode === 'compact'" class="compact-panel">
            <Transition name="overview-slide" mode="out-in">
              <article :key="compactPageKey" class="compact-slide" :class="activeCompactPage?.tone">
                <div class="slide-head">
                  <span>{{ activeCompactPage?.label }}</span>
                  <b>{{ activeCompactPage?.tag }}</b>
                </div>
                <strong :title="activeCompactPage?.title">{{ activeCompactPage?.title }}</strong>
                <p>{{ activeCompactPage?.description }}</p>
                <footer>
                  <span>{{ activeCompactPage?.detail }}</span>
                  <em :title="activeCompactPage?.fullValue">{{ activeCompactPage?.value }}</em>
                </footer>
              </article>
            </Transition>

            <div v-if="compactPages.length > 1" class="carousel-dots">
              <button
                v-for="(_, index) in compactPages"
                :key="index"
                :class="{ active: index === compactPageIndex }"
                :aria-label="`切换到第 ${index + 1} 页`"
                @click="setCompactPage(index)"
              ></button>
            </div>
          </section>

          <section v-else class="full-panel">
                <div class="full-grid">
              <section class="chart-panel">
                <div class="panel-head">
                  <strong>分类库存占比</strong>
                </div>

                <div class="chart-focus">
                  <div>
                    <span>最大库存类别</span>
                    <strong :title="topCategory?.name">{{ topCategory?.name || '暂无分类' }}</strong>
                  </div>
                  <b>{{ topCategory?.percent || 0 }}%</b>
                </div>

                <div ref="chartBarsRef" class="bar-list chart-bars">
                  <article v-for="item in displayedCategoryStats" :key="item.name" class="bar-row">
                    <div>
                      <strong :title="item.name">{{ item.name }}</strong>
                      <span>{{ item.percent }}%</span>
                    </div>
                    <div class="bar-track">
                      <i :style="{ width: `${item.percent}%` }"></i>
                    </div>
                    <b :title="formatNumber(item.inventory)">{{ formatCompactNumber(item.inventory) }}</b>
                  </article>
                </div>
              </section>

              <section class="insight-panel">
                <div class="tabs">
                  <button :class="{ active: activeTab === 'category' }" @click="setActiveTab('category')">分类</button>
                  <button :class="{ active: activeTab === 'value' }" @click="setActiveTab('value')">价值</button>
                  <button :class="{ active: activeTab === 'quantity' }" @click="setActiveTab('quantity')">数量</button>
                  <button :class="{ active: activeTab === 'health' }" @click="setActiveTab('health')">健康</button>
                </div>

                <div ref="insightBodyRef" class="insight-body">
                  <Transition name="page-slide" mode="out-in">
                    <div :key="activeTab" class="tab-body">
                      <section v-if="activeTab === 'category'" class="distribution-panel">
                        <div class="panel-head">
                          <strong>主要库存类别</strong>
                        </div>
                        <article v-for="item in displayedCategoryStats" :key="`rank-${item.name}`" class="rank-row category-rank">
                          <b>{{ item.percent }}%</b>
                          <div>
                            <strong :title="item.name">{{ item.name }}</strong>
                            <span>库存数量 {{ formatNumber(item.inventory) }}</span>
                          </div>
                          <em :title="formatNumber(item.inventory)">{{ formatCompactNumber(item.inventory) }}</em>
                        </article>
                      </section>

                      <section v-else-if="activeTab === 'value'" class="ranking-panel">
                        <div class="panel-head">
                          <strong>库存价值排行</strong>
                        </div>
                        <article v-for="(item, index) in displayedValueRanking" :key="rankingKey(item, index, 'value')" class="rank-row">
                          <b>{{ index + 1 }}</b>
                          <div>
                            <strong :title="item.productName || item.materialCode">{{ item.productName || '未命名刀具' }}</strong>
                            <span>{{ item.brandName || '-' }} · {{ item.specification || '-' }}</span>
                          </div>
                          <em :title="formatMoney(item.inventoryValue)">{{ formatCompactMoney(item.inventoryValue) }}</em>
                        </article>
                      </section>

                      <section v-else-if="activeTab === 'quantity'" class="ranking-panel">
                        <div class="panel-head">
                          <strong>库存数量排行</strong>
                        </div>
                        <article v-for="(item, index) in displayedInventoryRanking" :key="rankingKey(item, index, 'quantity')" class="rank-row">
                          <b>{{ index + 1 }}</b>
                          <div>
                            <strong :title="item.productName || item.materialCode">{{ item.productName || '未命名刀具' }}</strong>
                            <span>{{ item.cutterType || '未分类' }} · {{ item.materialCode || '无编码' }}</span>
                          </div>
                          <em :title="formatNumber(item.inventory)">{{ formatCompactNumber(item.inventory) }}</em>
                        </article>
                      </section>

                      <section v-else class="health-panel">
                        <div class="panel-head">
                          <strong>库存健康摘要</strong>
                        </div>
                        <div class="health-grid">
                          <article class="normal">
                            <span>正常物料</span>
                            <strong>{{ formatCompactNumber(healthStats.normal) }}</strong>
                          </article>
                          <article class="low">
                            <span>低库存</span>
                            <strong>{{ formatCompactNumber(healthStats.low) }}</strong>
                          </article>
                          <article class="empty">
                            <span>缺货</span>
                            <strong>{{ formatCompactNumber(healthStats.empty) }}</strong>
                          </article>
                        </div>
                        <div class="health-note">
                          <strong>{{ healthSummary.title }}</strong>
                        </div>
                      </section>
                    </div>
                  </Transition>
                </div>

                <div class="page-progress">
                  <i :key="`overview-progress-${activeTab}`"></i>
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
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
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

type OverviewTab = 'category' | 'value' | 'quantity' | 'health'
type CompactTone = 'category' | 'value' | 'quantity' | 'health'

interface CompactPage {
  type: CompactTone
  label: string
  tag: string
  title: string
  description: string
  detail: string
  value: string
  fullValue: string
  tone: CompactTone
}

const dataStore = useDataStore()
const displayMode = computed(() => props.forcedMode || detectCardMode(props.width, props.height))
const isCompactTight = computed(() => displayMode.value === 'compact' && props.height <= 3)
const activeTab = ref<OverviewTab>('category')
const compactPageIndex = ref(0)
const compactTimer = ref<ReturnType<typeof setInterval> | null>(null)
const fullTimer = ref<ReturnType<typeof setInterval> | null>(null)
const insightBodyRef = ref<HTMLElement | null>(null)
const chartBarsRef = ref<HTMLElement | null>(null)
const insightBodyHeight = ref(0)
const chartBarsHeight = ref(0)
const resizeObserver = ref<ResizeObserver | null>(null)

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

const hasData = computed(() =>
  materials.value.length > 0 ||
  warnings.value.length > 0 ||
  overview.value.materialCount > 0 ||
  overview.value.totalInventory > 0
)
const storeLoading = computed(() =>
  dataStore.isLoading('cutter-inventory-overview') ||
  dataStore.isLoading('cutter-materials')
)
const initialLoading = computed(() => storeLoading.value && !hasData.value)
const refreshing = computed(() => storeLoading.value && hasData.value)
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
    .slice(0, 8)
})

const topCategory = computed(() => categoryStats.value[0])
const displayedCategoryStats = computed(() => categoryStats.value.slice(0, categoryLimit.value))

const valueRanking = computed(() =>
  [...materials.value]
    .sort((a, b) => b.inventoryValue - a.inventoryValue)
)

const inventoryRanking = computed(() =>
  [...materials.value]
    .sort((a, b) => b.inventory - a.inventory)
)

const rankingLimit = computed(() => {
  const availableHeight = insightBodyHeight.value || 260
  const headerHeight = 28
  const rowHeight = 54
  const rowGap = 7
  return Math.max(3, Math.min(8, Math.floor((availableHeight - headerHeight + rowGap) / (rowHeight + rowGap))))
})
const categoryLimit = computed(() => {
  const availableHeight = chartBarsHeight.value || 220
  const rowHeight = 42
  const rowGap = 7
  return Math.max(3, Math.min(8, Math.floor((availableHeight + rowGap) / (rowHeight + rowGap))))
})
const displayedValueRanking = computed(() => valueRanking.value.slice(0, rankingLimit.value))
const displayedInventoryRanking = computed(() => inventoryRanking.value.slice(0, rankingLimit.value))

const healthStats = computed(() => {
  const empty = overview.value.emptyCount || warnings.value.filter(item => item.level === 'empty').length
  const low = overview.value.lowCount || warnings.value.filter(item => item.level === 'low').length
  const total = Math.max(overview.value.materialCount || materials.value.length, empty + low)
  return {
    total,
    empty,
    low,
    normal: Math.max(0, total - empty - low)
  }
})

const healthSummary = computed(() => {
  if (healthStats.value.empty > 0) {
    return {
      title: '缺货物料需要补齐'
    }
  }
  if (healthStats.value.low > 0) {
    return {
      title: '部分物料接近下限'
    }
  }
  return {
    title: '库存结构稳定'
  }
})

const compactPages = computed<CompactPage[]>(() => {
  const topCategory = categoryStats.value[0]
  const topValue = valueRanking.value[0]
  const topInventory = inventoryRanking.value[0]
  const pages: CompactPage[] = []

  if (topCategory) {
    pages.push({
      type: 'category',
      label: '主要库存类别',
      tag: `${topCategory.percent}%`,
      title: topCategory.name,
      description: `占当前库存规模最高的刀具类别。`,
      detail: '库存数量',
      value: formatCompactNumber(topCategory.inventory),
      fullValue: formatNumber(topCategory.inventory),
      tone: 'category'
    })
  }

  if (topValue) {
    pages.push({
      type: 'value',
      label: '价值最高物料',
      tag: topValue.cutterType || '物料',
      title: topValue.productName || topValue.materialCode || '未命名刀具',
      description: `${topValue.brandName || '-'} · ${topValue.specification || '-'}`,
      detail: '库存价值',
      value: formatCompactMoney(topValue.inventoryValue),
      fullValue: formatMoney(topValue.inventoryValue),
      tone: 'value'
    })
  }

  if (topInventory) {
    pages.push({
      type: 'quantity',
      label: '数量最高物料',
      tag: topInventory.cutterType || '物料',
      title: topInventory.productName || topInventory.materialCode || '未命名刀具',
      description: `${topInventory.brandName || '-'} · ${topInventory.specification || '-'}`,
      detail: '库存数量',
      value: formatCompactNumber(topInventory.inventory),
      fullValue: formatNumber(topInventory.inventory),
      tone: 'quantity'
    })
  }

  pages.push({
    type: 'health',
    label: '库存健康',
    tag: overview.value.warningCount > 0 ? '有预警' : '稳定',
    title: healthSummary.value.title,
    description: healthSummary.value.description,
    detail: '预警数量',
    value: formatCompactNumber(overview.value.warningCount),
    fullValue: formatNumber(overview.value.warningCount),
    tone: 'health'
  })

  return pages
})

const activeCompactPage = computed(() => compactPages.value[compactPageIndex.value] || compactPages.value[0])
const compactPageKey = computed(() => `${activeCompactPage.value?.type}-${compactPageIndex.value}-${overview.value.totalInventory}`)

const handleRefresh = async () => {
  await Promise.all([
    pollingService.executeTask('cutter-inventory-overview'),
    pollingService.executeTask('cutter-materials')
  ])
}

const setActiveTab = (tab: OverviewTab) => {
  activeTab.value = tab
  resetFullTimer()
}

const setCompactPage = (index: number) => {
  compactPageIndex.value = index
  resetCompactTimer()
}

const resetCompactTimer = () => {
  if (compactTimer.value) clearInterval(compactTimer.value)
  compactTimer.value = null
  if (displayMode.value !== 'compact' || compactPages.value.length <= 1) return

  compactTimer.value = setInterval(() => {
    compactPageIndex.value = (compactPageIndex.value + 1) % compactPages.value.length
  }, 5200)
}

const resetFullTimer = () => {
  if (fullTimer.value) clearInterval(fullTimer.value)
  fullTimer.value = null
  if (displayMode.value !== 'full') return

  const tabs: OverviewTab[] = ['category', 'value', 'quantity', 'health']
  fullTimer.value = setInterval(() => {
    const currentIndex = tabs.indexOf(activeTab.value)
    activeTab.value = tabs[(currentIndex + 1) % tabs.length]
  }, 6500)
}

const measureInsightBody = () => {
  if (!insightBodyRef.value) return
  insightBodyHeight.value = insightBodyRef.value.clientHeight
}

const measureChartBars = () => {
  if (!chartBarsRef.value) return
  chartBarsHeight.value = chartBarsRef.value.clientHeight
}

const measurePanels = () => {
  measureInsightBody()
  measureChartBars()
}

const rankingKey = (item: CutterMaterial, index: number, type: string) =>
  `${type}-${item.id ?? 'no-id'}-${item.materialCode}-${item.productName}-${index}`

const formatNumber = (value: number) => new Intl.NumberFormat('zh-CN').format(value || 0)
const formatCompactNumber = (value: number) => {
  const number = Number(value || 0)
  const abs = Math.abs(number)
  if (abs >= 100000000) return `${trimDecimal(number / 100000000)}亿`
  if (abs >= 10000) return `${trimDecimal(number / 10000)}万`
  return new Intl.NumberFormat('zh-CN').format(number)
}
const formatMoney = (value: number) => {
  if (!value) return '¥0'
  return `¥${Math.round(value).toLocaleString('zh-CN')}`
}
const formatCompactMoney = (value: number) => {
  const number = Number(value || 0)
  const abs = Math.abs(number)
  if (abs >= 100000000) return `¥${trimDecimal(number / 100000000)}亿`
  if (abs >= 10000) return `¥${trimDecimal(number / 10000)}万`
  return `¥${Math.round(number).toLocaleString('zh-CN')}`
}
const trimDecimal = (value: number) => {
  const fixed = Math.abs(value) >= 100 ? value.toFixed(0) : value.toFixed(1)
  return fixed.replace(/\.0$/, '')
}

watch([displayMode, compactPages], () => {
  compactPageIndex.value = Math.min(compactPageIndex.value, compactPages.value.length - 1)
  resetCompactTimer()
  resetFullTimer()
}, { flush: 'post' })

watch(() => [props.width, props.height], async () => {
  await nextTick()
  measurePanels()
})

onMounted(async () => {
  await nextTick()
  measurePanels()
  resizeObserver.value = new ResizeObserver(measurePanels)
  if (insightBodyRef.value) resizeObserver.value.observe(insightBodyRef.value)
  if (chartBarsRef.value) resizeObserver.value.observe(chartBarsRef.value)
  resetCompactTimer()
  resetFullTimer()
})

onBeforeUnmount(() => {
  if (compactTimer.value) clearInterval(compactTimer.value)
  if (fullTimer.value) clearInterval(fullTimer.value)
  resizeObserver.value?.disconnect()
})
</script>

<style scoped>
.material-overview {
  height: 100%;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  color: var(--color-text);
}

.mini-panel {
  height: 100%;
  min-width: 0;
  display: grid;
  align-content: center;
  gap: 6px;
  padding: 4px 2px;
}

.mini-panel span,
.mini-panel small,
.overview-kpis span,
.panel-head span,
.slide-head span,
.compact-slide p,
.compact-slide footer,
.rank-row span,
.bar-row span,
.health-grid span,
.health-note span {
  min-width: 0;
  overflow: hidden;
  color: var(--color-text-secondary);
  font-size: 12px;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mini-panel strong {
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
  color: var(--color-primary);
  font-size: clamp(28px, 18cqw, 44px);
  line-height: 1;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.overview-kpis {
  flex: none;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}

.mode-compact .overview-kpis {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
}

.compact-tight {
  gap: 7px;
}

.overview-kpis article {
  min-width: 0;
  padding: 9px 10px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 8px;
  background: rgba(248, 250, 252, 0.72);
}

.mode-compact .overview-kpis article {
  padding: 7px 10px;
}

.compact-tight .overview-kpis article {
  padding: 6px 10px;
}

.overview-kpis strong {
  display: block;
  min-width: 0;
  max-width: 100%;
  margin-top: 5px;
  overflow: hidden;
  color: var(--color-text);
  font-size: clamp(18px, 6cqw, 24px);
  line-height: 1.05;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mode-compact .overview-kpis strong {
  margin-top: 3px;
  font-size: clamp(18px, 8cqw, 23px);
}

.compact-tight .overview-kpis strong {
  margin-top: 2px;
  font-size: clamp(18px, 7cqw, 22px);
}

.overview-kpis .warning strong {
  color: var(--color-warning);
}

.compact-panel,
.full-panel {
  min-height: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.compact-panel {
  gap: 6px;
}

.compact-slide {
  flex: 1;
  min-height: 0;
  display: grid;
  align-content: center;
  gap: 7px;
  overflow: hidden;
  padding: 10px 12px;
  border: 1px solid rgba(37, 99, 235, 0.16);
  border-radius: 8px;
  background: linear-gradient(135deg, rgba(239, 246, 255, 0.86), rgba(248, 250, 252, 0.96));
}

.compact-slide.value {
  border-color: rgba(22, 163, 74, 0.18);
  background: linear-gradient(135deg, rgba(220, 252, 231, 0.55), rgba(248, 250, 252, 0.96));
}

.compact-slide.quantity {
  border-color: rgba(14, 165, 233, 0.18);
  background: linear-gradient(135deg, rgba(224, 242, 254, 0.58), rgba(248, 250, 252, 0.96));
}

.compact-slide.health {
  border-color: rgba(245, 158, 11, 0.2);
  background: linear-gradient(135deg, rgba(254, 243, 199, 0.48), rgba(248, 250, 252, 0.96));
}

.slide-head {
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.slide-head b {
  flex: none;
  max-width: 42%;
  overflow: hidden;
  padding: 2px 7px;
  border-radius: 999px;
  background: rgba(37, 99, 235, 0.1);
  color: var(--color-primary);
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.compact-slide strong {
  min-width: 0;
  overflow: hidden;
  font-size: 17px;
  line-height: 1.25;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.compact-slide p {
  white-space: nowrap;
}

.compact-slide footer {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 8px;
}

.compact-slide footer em {
  flex: none;
  max-width: 55%;
  overflow: hidden;
  color: var(--color-text);
  font-size: 20px;
  font-style: normal;
  font-weight: 800;
  line-height: 1;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mode-compact .compact-slide {
  grid-template-columns: minmax(0, 1fr) auto;
  grid-template-rows: auto minmax(0, 1fr);
  align-content: stretch;
  align-items: center;
  gap: 5px 10px;
  padding: 8px 12px;
}

.compact-tight .compact-slide {
  grid-template-columns: minmax(0, 1fr) minmax(58px, auto);
  grid-template-rows: minmax(0, 1fr);
  gap: 8px;
  padding: 8px 10px;
}

.mode-compact .compact-slide .slide-head {
  display: contents;
}

.compact-tight .compact-slide .slide-head {
  display: block;
  min-width: 0;
}

.mode-compact .compact-slide .slide-head span {
  grid-column: 1;
  grid-row: 1;
}

.compact-tight .compact-slide .slide-head span {
  display: block;
}

.mode-compact .compact-slide .slide-head b {
  grid-column: 2;
  grid-row: 1;
  justify-self: end;
}

.compact-tight .compact-slide .slide-head b {
  display: none;
}

.mode-compact .compact-slide strong {
  grid-column: 1;
  grid-row: 2;
  align-self: center;
  font-size: 16px;
}

.compact-tight .compact-slide strong {
  grid-column: 1;
  grid-row: 1;
  align-self: end;
  font-size: 16px;
}

.mode-compact .compact-slide p,
.mode-compact .compact-slide footer span {
  display: none;
}

.compact-tight .compact-slide p,
.compact-tight .compact-slide footer span {
  display: none;
}

.mode-compact .compact-slide footer {
  grid-column: 2;
  grid-row: 2;
  align-self: center;
  justify-self: end;
}

.compact-tight .compact-slide footer {
  grid-column: 2;
  grid-row: 1;
  align-self: end;
  justify-self: end;
}

.mode-compact .compact-slide footer em {
  max-width: 96px;
  font-size: 18px;
}

.compact-tight .compact-slide footer em {
  max-width: 82px;
  font-size: 18px;
}

.carousel-dots {
  height: 8px;
  display: flex;
  flex: none;
  justify-content: center;
  gap: 6px;
}

.compact-tight .carousel-dots {
  height: 5px;
}

.carousel-dots button {
  width: 16px;
  height: 3px;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.28);
  transition: width 0.2s ease, background 0.2s ease;
}

.compact-tight .carousel-dots button {
  width: 14px;
  height: 3px;
}

.carousel-dots button.active {
  width: 26px;
  background: var(--color-primary);
}

.compact-tight .carousel-dots button.active {
  width: 24px;
}

.full-panel {
  gap: 8px;
}

.full-grid {
  min-height: 0;
  flex: 1;
  display: grid;
  grid-template-columns: minmax(260px, 1.08fr) minmax(260px, 0.92fr);
  gap: 12px;
}

.chart-panel,
.insight-panel {
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow: hidden;
}

.chart-panel {
  padding: 12px;
  border: 1px solid rgba(148, 163, 184, 0.15);
  border-radius: 8px;
  background:
    linear-gradient(135deg, rgba(239, 246, 255, 0.72), rgba(248, 250, 252, 0.92)),
    radial-gradient(circle at 92% 10%, rgba(37, 99, 235, 0.12), transparent 32%);
}

.chart-focus {
  min-width: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: end;
  gap: 12px;
  padding-bottom: 4px;
}

.chart-focus div {
  min-width: 0;
  display: grid;
  gap: 3px;
}

.chart-focus span {
  color: var(--color-text-secondary);
  font-size: 12px;
}

.chart-focus strong {
  min-width: 0;
  overflow: hidden;
  font-size: 20px;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chart-focus b {
  color: var(--color-primary);
  font-size: clamp(28px, 9cqw, 42px);
  line-height: 0.95;
}

.tabs {
  display: flex;
  gap: 6px;
  flex: none;
  min-width: 0;
  overflow: hidden;
}

.tabs button {
  min-width: 0;
  padding: 6px 12px;
  border-radius: 8px;
  color: var(--color-text-secondary);
  background: rgba(148, 163, 184, 0.08);
  font-weight: 650;
  transition: color 0.18s ease, background 0.18s ease;
}

.tabs button.active {
  color: #fff;
  background: var(--color-primary);
}

.insight-body {
  min-height: 0;
  flex: 1;
  overflow: hidden;
}

.tab-body {
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.distribution-panel,
.ranking-panel,
.health-panel {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 7px;
  overflow: hidden;
}

.panel-head {
  flex: none;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.panel-head strong,
.panel-head span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.panel-head strong {
  font-size: 14px;
}

.bar-list {
  min-height: 0;
  display: grid;
  align-content: start;
  gap: 7px;
  overflow: hidden;
}

.chart-bars {
  flex: 1;
  align-content: stretch;
}

.bar-row {
  min-width: 0;
  display: grid;
  grid-template-columns: minmax(88px, 0.9fr) minmax(72px, 1fr) minmax(48px, auto);
  align-items: center;
  gap: 7px;
  padding: 5px 0;
}

.chart-bars .bar-row {
  grid-template-columns: minmax(88px, 0.82fr) minmax(80px, 1fr) minmax(46px, auto);
  min-height: 42px;
  padding: 0;
}

.bar-row div:first-child {
  min-width: 0;
  display: grid;
  gap: 2px;
}

.bar-row strong,
.rank-row strong {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bar-row b {
  max-width: 72px;
  overflow: hidden;
  text-align: right;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bar-track {
  height: 8px;
  min-width: 0;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.18);
}

.bar-track i {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--color-primary), var(--color-success));
}

.rank-row {
  min-width: 0;
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr) minmax(52px, auto);
  align-items: center;
  gap: 8px;
  min-height: 54px;
  padding: 7px 10px;
  border: 1px solid rgba(148, 163, 184, 0.14);
  border-radius: 8px;
  background: rgba(248, 250, 252, 0.72);
}

.category-rank {
  grid-template-columns: 46px minmax(0, 1fr) minmax(52px, auto);
}

.rank-row b {
  width: 26px;
  height: 26px;
  display: grid;
  place-items: center;
  border-radius: 999px;
  color: var(--color-primary);
  background: rgba(37, 99, 235, 0.1);
  font-size: 12px;
}

.category-rank b {
  width: 42px;
  color: var(--color-primary);
}

.rank-row div {
  min-width: 0;
  display: grid;
  gap: 3px;
}

.rank-row span {
  line-height: 1.25;
}

.rank-row em {
  max-width: 82px;
  overflow: hidden;
  color: var(--color-text);
  font-style: normal;
  font-weight: 800;
  text-align: right;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.health-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  flex: none;
}

.health-grid article {
  min-width: 0;
  padding: 10px;
  border-radius: 8px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  background: rgba(248, 250, 252, 0.78);
}

.health-grid strong {
  display: block;
  min-width: 0;
  margin-top: 5px;
  overflow: hidden;
  font-size: 24px;
  line-height: 1;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.health-grid .normal strong {
  color: var(--color-success);
}

.health-grid .low strong {
  color: var(--color-warning);
}

.health-grid .empty strong {
  color: var(--color-danger);
}

.health-note {
  min-height: 0;
  flex: 1;
  display: grid;
  align-content: center;
  gap: 6px;
  overflow: hidden;
  padding: 14px;
  border: 1px solid rgba(148, 163, 184, 0.14);
  border-radius: 8px;
  background: linear-gradient(135deg, rgba(248, 250, 252, 0.9), rgba(239, 246, 255, 0.58));
}

.health-note strong,
.health-note span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.page-progress {
  height: 5px;
  display: flex;
  align-items: center;
  flex: none;
}

.page-progress i {
  height: 3px;
  flex: 1;
  overflow: hidden;
  position: relative;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.18);
}

.page-progress i::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: var(--color-primary);
  transform-origin: left;
  animation: overviewProgress 6.5s linear forwards;
}

.overview-slide-enter-active,
.overview-slide-leave-active,
.page-slide-enter-active,
.page-slide-leave-active {
  transition: opacity 0.24s ease, transform 0.24s ease;
}

.overview-slide-enter-from,
.overview-slide-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

.page-slide-enter-from {
  opacity: 0;
  transform: translateX(16px);
}

.page-slide-leave-to {
  opacity: 0;
  transform: translateX(-16px);
}

@keyframes overviewProgress {
  from {
    transform: scaleX(0);
  }
  to {
    transform: scaleX(1);
  }
}

@media (max-width: 520px) {
  .overview-kpis,
  .mode-compact .overview-kpis {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .tabs button {
    flex: 1;
    padding-inline: 8px;
  }

  .bar-row {
    grid-template-columns: minmax(70px, 0.8fr) minmax(54px, 1fr) auto;
  }

  .health-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .full-grid {
    grid-template-columns: 1fr;
  }
}
</style>
