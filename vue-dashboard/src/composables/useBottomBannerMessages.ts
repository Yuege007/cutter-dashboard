import { computed, ref, watch, type Ref } from 'vue'
import { useDataStore } from '@/stores/data'
import type {
  CutterBorrowRecord,
  CutterInventoryOverview,
  CutterInventoryWarning,
  CutterStockChangeRecord
} from '@/types/cutter'

export interface BannerMessage {
  id: string
  content: string
  createdAt: Date
  type?: 'business' | 'user' | 'welcome'
}

type PresetKey =
  | 'inventorySummary'
  | 'materialWarnings'
  | 'slotWarnings'
  | 'cabinetDistribution'
  | 'todayBorrow'
  | 'todayReturn'
  | 'topBorrowUser'
  | 'hotBorrowMaterial'
  | 'stockChangeSummary'
  | 'violationSummary'

export interface MessagePreset {
  key: PresetKey
  label: string
  group: '库存' | '货道' | '领还' | '异常'
}

type PresetSettings = Record<PresetKey, boolean>

const SETTINGS_STORAGE_KEY = 'bottom-banner-auto-message-settings'

export const messagePresets: MessagePreset[] = [
  { key: 'inventorySummary', label: '刀具库存汇总', group: '库存' },
  { key: 'materialWarnings', label: '刀具库存预警', group: '库存' },
  { key: 'slotWarnings', label: '货道库存预警', group: '货道' },
  { key: 'cabinetDistribution', label: '预警柜体分布', group: '货道' },
  { key: 'todayBorrow', label: '今日领刀动态', group: '领还' },
  { key: 'todayReturn', label: '今日归还动态', group: '领还' },
  { key: 'topBorrowUser', label: '领刀人员排行', group: '领还' },
  { key: 'hotBorrowMaterial', label: '热门领用刀具', group: '领还' },
  { key: 'stockChangeSummary', label: '库存变更动态', group: '异常' },
  { key: 'violationSummary', label: '违规记录提醒', group: '异常' }
]

const defaultSettings: PresetSettings = {
  inventorySummary: true,
  materialWarnings: true,
  slotWarnings: true,
  cabinetDistribution: false,
  todayBorrow: true,
  todayReturn: true,
  topBorrowUser: true,
  hotBorrowMaterial: false,
  stockChangeSummary: true,
  violationSummary: true
}

const safeNumber = (value: unknown) => {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : 0
}

const getRows = <T>(payload: T[] | { rows?: T[], data?: T[], recordList?: T[] } | undefined): T[] => {
  if (!payload) return []
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload.rows)) return payload.rows
  if (Array.isArray(payload.data)) return payload.data
  if (Array.isArray(payload.recordList)) return payload.recordList
  return []
}

const formatNumber = (value: number) => {
  const abs = Math.abs(value)
  if (abs >= 100000000) return `${(value / 100000000).toFixed(1)}亿`
  if (abs >= 10000) return `${(value / 10000).toFixed(1)}万`
  return `${Math.round(value)}`
}

const formatMoney = (value: number) => {
  if (value >= 10000) return `${(value / 10000).toFixed(1)}万元`
  return `${Math.round(value)}元`
}

const topNames = (items: string[], limit = 3) => {
  const names = items.filter(Boolean).slice(0, limit)
  return names.length ? names.join('、') : ''
}

const createMessage = (id: string, content: string): BannerMessage => ({
  id: `auto-${id}`,
  content,
  createdAt: new Date(),
  type: 'business'
})

const loadSettings = (): PresetSettings => {
  try {
    const saved = localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (!saved) return { ...defaultSettings }
    return { ...defaultSettings, ...JSON.parse(saved) }
  } catch {
    return { ...defaultSettings }
  }
}

const getMaterialName = (record: CutterBorrowRecord | CutterInventoryWarning | CutterStockChangeRecord) =>
  record.productName || record.brandName || record.materialCode || '未命名刀具'

const getBorrowCount = (record: CutterBorrowRecord) => Math.max(1, safeNumber(record.payNum || 1))

const isToday = (value?: string) => {
  if (!value) return false
  const date = new Date(value.replace(/-/g, '/'))
  if (Number.isNaN(date.getTime())) return false

  const now = new Date()
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  )
}

export const useBottomBannerMessages = (manualMessages: Ref<BannerMessage[]>) => {
  const dataStore = useDataStore()
  const settings = ref<PresetSettings>(loadSettings())

  const presetsByGroup = computed(() =>
    messagePresets.reduce<Record<MessagePreset['group'], MessagePreset[]>>((groups, preset) => {
      if (!groups[preset.group]) groups[preset.group] = []
      groups[preset.group].push(preset)
      return groups
    }, {} as Record<MessagePreset['group'], MessagePreset[]>)
  )

  const autoMessages = computed(() => {
    const result: BannerMessage[] = []
    const overview = dataStore.getData('cutter-inventory-overview') as CutterInventoryOverview | undefined
    const materialWarnings = getRows<CutterInventoryWarning>(dataStore.getData('cutter-inventory-warnings'))
    const slotWarnings = getRows<CutterInventoryWarning>(dataStore.getData('cutter-item-warnings'))
    const borrowRows = getRows<CutterBorrowRecord>(dataStore.getData('cutter-borrow-records'))
    const returnRows = getRows<CutterBorrowRecord>(dataStore.getData('cutter-return-records'))
    const stockChanges = getRows<CutterStockChangeRecord>(dataStore.getData('cutter-stock-changes'))
    const violationRows = getRows<CutterBorrowRecord>(dataStore.getData('cutter-violation-records'))

    const todayBorrows = borrowRows.filter(record => isToday(record.payTime))
    const todayReturns = returnRows.filter(record => isToday(record.returnTime || record.payTime))
    const todayBorrowTotal = todayBorrows.reduce((sum, record) => sum + getBorrowCount(record), 0)
    const todayReturnTotal = todayReturns.reduce((sum, record) => sum + getBorrowCount(record), 0)

    if (settings.value.inventorySummary && overview) {
      result.push(createMessage(
        'inventory-summary',
        `当前刀具 ${formatNumber(overview.materialCount)} 种，总库存 ${formatNumber(overview.totalInventory)}，库存价值约 ${formatMoney(overview.totalValue)}，预警 ${formatNumber(overview.warningCount)} 项`
      ))
    }

    if (settings.value.materialWarnings && materialWarnings.length > 0) {
      const emptyCount = materialWarnings.filter(item => item.level === 'empty' || item.inventory <= 0).length
      const names = topNames(materialWarnings.map(getMaterialName))
      result.push(createMessage(
        'material-warnings',
        `刀具库存预警 ${formatNumber(materialWarnings.length)} 项，其中断供 ${formatNumber(emptyCount)} 项；优先关注：${names}`
      ))
    }

    if (settings.value.slotWarnings && slotWarnings.length > 0) {
      const emptyCount = slotWarnings.filter(item => item.level === 'empty' || item.inventory <= 0).length
      const names = topNames(slotWarnings.map(item => item.itemNoAlias || item.cuttingName || item.materialCode))
      result.push(createMessage(
        'slot-warnings',
        `货道预警 ${formatNumber(slotWarnings.length)} 条，其中空货道 ${formatNumber(emptyCount)} 条；优先处理：${names}`
      ))
    }

    if (settings.value.cabinetDistribution && slotWarnings.length > 0) {
      const cabinetMap = new Map<string, number>()
      slotWarnings.forEach(item => {
        const name = item.cuttingName || item.cuttingNo || '未知柜体'
        cabinetMap.set(name, (cabinetMap.get(name) || 0) + 1)
      })
      const cabinetNames = Array.from(cabinetMap.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([name]) => name)
      result.push(createMessage(
        'cabinet-distribution',
        `预警较多柜体：${topNames(cabinetNames)}`
      ))
    }

    if (settings.value.todayBorrow && todayBorrows.length > 0) {
      result.push(createMessage(
        'today-borrow',
        `今日领刀 ${formatNumber(todayBorrows.length)} 笔，共 ${formatNumber(todayBorrowTotal)} 件`
      ))
    }

    if (settings.value.todayReturn && todayReturns.length > 0) {
      result.push(createMessage(
        'today-return',
        `今日归还 ${formatNumber(todayReturns.length)} 笔，共 ${formatNumber(todayReturnTotal)} 件`
      ))
    }

    if ((settings.value.topBorrowUser || settings.value.hotBorrowMaterial) && borrowRows.length > 0) {
      const userMap = new Map<string, number>()
      const materialMap = new Map<string, number>()

      borrowRows.forEach(record => {
        const count = getBorrowCount(record)
        userMap.set(record.userName || '未知人员', (userMap.get(record.userName || '未知人员') || 0) + count)
        materialMap.set(getMaterialName(record), (materialMap.get(getMaterialName(record)) || 0) + count)
      })

      const topUser = Array.from(userMap.entries()).sort((a, b) => b[1] - a[1])[0]
      const hotMaterial = Array.from(materialMap.entries()).sort((a, b) => b[1] - a[1])[0]

      if (settings.value.topBorrowUser && topUser) {
        result.push(createMessage(
          'top-borrow-user',
          `近期领刀最多：${topUser[0]}，累计 ${formatNumber(topUser[1])} 件`
        ))
      }

      if (settings.value.hotBorrowMaterial && hotMaterial) {
        result.push(createMessage(
          'hot-borrow-material',
          `近期热门刀具：${hotMaterial[0]}，被领用 ${formatNumber(hotMaterial[1])} 件`
        ))
      }
    }

    if (settings.value.stockChangeSummary && stockChanges.length > 0) {
      const inCount = stockChanges.filter(item => item.direction === 'in').length
      const outCount = stockChanges.filter(item => item.direction === 'out').length
      const latest = stockChanges[0]
      result.push(createMessage(
        'stock-change-summary',
        `近期库存变更 ${formatNumber(stockChanges.length)} 笔，入库 ${formatNumber(inCount)} 笔、出库 ${formatNumber(outCount)} 笔；最新：${getMaterialName(latest)} ${latest.changeCount > 0 ? '+' : ''}${formatNumber(latest.changeCount)}`
      ))
    }

    if (settings.value.violationSummary && violationRows.length > 0) {
      const names = topNames(violationRows.map(record => record.userName || record.returnUserName || '未知人员'))
      result.push(createMessage(
        'violation-summary',
        `当前违规记录 ${formatNumber(violationRows.length)} 条，涉及人员：${names}`
      ))
    }

    return result
  })

  const sourceMessages = computed(() => [
    ...autoMessages.value,
    ...manualMessages.value
  ])

  const displayMessages = computed(() => {
    if (sourceMessages.value.length === 0) {
      return [createMessage('empty', '暂无消息显示')]
    }
    return [...sourceMessages.value, ...sourceMessages.value]
  })

  watch(settings, (value) => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(value))
  }, { deep: true })

  return {
    settings,
    presetsByGroup,
    autoMessages,
    sourceMessages,
    displayMessages
  }
}
