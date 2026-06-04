import { defineAsyncComponent, markRaw } from 'vue'
import type { CardConfig } from '@/types'
import CutterBorrowIcon from '@/components/icons/cutter/CutterBorrowIcon.vue'
import CutterCabinetIcon from '@/components/icons/cutter/CutterCabinetIcon.vue'
import CutterRankingIcon from '@/components/icons/cutter/CutterRankingIcon.vue'
import CutterReturnIcon from '@/components/icons/cutter/CutterReturnIcon.vue'
import CutterStockFlowIcon from '@/components/icons/cutter/CutterStockFlowIcon.vue'
import CutterToolIcon from '@/components/icons/cutter/CutterToolIcon.vue'
import CutterViolationIcon from '@/components/icons/cutter/CutterViolationIcon.vue'
import CutterWarningIcon from '@/components/icons/cutter/CutterWarningIcon.vue'

const MaterialOverviewCard = markRaw(defineAsyncComponent(() => import('@/components/cards/MaterialOverviewCard.vue')))
const InventoryAlarmCard = markRaw(defineAsyncComponent(() => import('@/components/cards/InventoryAlarmCard.vue')))
const CabinetStatusCard = markRaw(defineAsyncComponent(() => import('@/components/cards/CabinetStatusCard.vue')))
const InOutTrendCard = markRaw(defineAsyncComponent(() => import('@/components/cards/InOutTrendCard.vue')))
const UserRankingCard = markRaw(defineAsyncComponent(() => import('@/components/cards/UserRankingCard.vue')))
const MaterialReturnCard = markRaw(defineAsyncComponent(() => import('@/components/cards/MaterialReturnCard.vue')))
const StockChangeCard = markRaw(defineAsyncComponent(() => import('@/components/cards/StockChangeCard.vue')))
const ViolationRecordCard = markRaw(defineAsyncComponent(() => import('@/components/cards/ViolationRecordCard.vue')))

export const cardConfigs: CardConfig[] = [
  {
    id: 'material-overview-card',
    name: '刀具库存总览',
    description: '展示刀具种类、总库存、库存价值和库存预警概览',
    icon: markRaw(CutterToolIcon),
    category: 'inventory',
    component: MaterialOverviewCard,
    defaultSize: { w: 5, h: 3 },
    minSize: { w: 2, h: 2 },
    draggable: true,
    resizable: true,
    renderModes: {
      mini: MaterialOverviewCard,
      compact: MaterialOverviewCard,
      full: MaterialOverviewCard
    },
    defaultProps: {
      title: '刀具库存总览',
      showRefresh: true,
      showSettings: true
    },
    configSchema: {
      title: { type: 'string', label: '标题', required: true },
      showRefresh: { type: 'boolean', label: '显示刷新按钮', default: true },
      showSettings: { type: 'boolean', label: '显示设置按钮', default: true }
    }
  },
  {
    id: 'inventory-alarm-card',
    name: '库存预警',
    description: '聚合耗材库存预警和刀柜货道预警，突出断供与低库存',
    icon: markRaw(CutterWarningIcon),
    category: 'inventory',
    component: InventoryAlarmCard,
    defaultSize: { w: 4, h: 3 },
    minSize: { w: 2, h: 2 },
    draggable: true,
    resizable: true,
    renderModes: {
      mini: InventoryAlarmCard,
      compact: InventoryAlarmCard,
      full: InventoryAlarmCard
    },
    defaultProps: {
      title: '库存预警',
      showRefresh: true,
      showSettings: true
    },
    configSchema: {
      title: { type: 'string', label: '标题', required: true },
      showRefresh: { type: 'boolean', label: '显示刷新按钮', default: true },
      showSettings: { type: 'boolean', label: '显示设置按钮', default: true }
    }
  },
  {
    id: 'cabinet-status-card',
    name: '刀柜货道状态',
    description: '按刀柜展示货道库存、空货道和低库存货道状态',
    icon: markRaw(CutterCabinetIcon),
    category: 'device',
    component: CabinetStatusCard,
    defaultSize: { w: 5, h: 4 },
    minSize: { w: 2, h: 2 },
    draggable: true,
    resizable: true,
    renderModes: {
      mini: CabinetStatusCard,
      compact: CabinetStatusCard,
      full: CabinetStatusCard
    },
    defaultProps: {
      title: '刀柜货道状态',
      showRefresh: true,
      showSettings: true
    },
    configSchema: {
      title: { type: 'string', label: '标题', required: true },
      showRefresh: { type: 'boolean', label: '显示刷新按钮', default: true },
      showSettings: { type: 'boolean', label: '显示设置按钮', default: true }
    }
  },
  {
    id: 'in-out-trend-card',
    name: '领刀趋势',
    description: '按时间展示领刀数量、金额和最近领刀记录',
    icon: markRaw(CutterBorrowIcon),
    category: 'analytics',
    component: InOutTrendCard,
    defaultSize: { w: 5, h: 3 },
    minSize: { w: 3, h: 2 },
    draggable: true,
    resizable: true,
    renderModes: {
      mini: InOutTrendCard,
      compact: InOutTrendCard,
      full: InOutTrendCard
    },
    defaultProps: {
      title: '领刀趋势',
      showRefresh: true,
      showSettings: true
    },
    configSchema: {
      title: { type: 'string', label: '标题', required: true },
      showRefresh: { type: 'boolean', label: '显示刷新按钮', default: true },
      showSettings: { type: 'boolean', label: '显示设置按钮', default: true }
    }
  },
  {
    id: 'user-ranking-card',
    name: '领刀排行',
    description: '按人员统计近15天领刀数量和领刀金额排行',
    icon: markRaw(CutterRankingIcon),
    category: 'analytics',
    component: UserRankingCard,
    defaultSize: { w: 4, h: 3 },
    minSize: { w: 3, h: 2 },
    draggable: true,
    resizable: true,
    renderModes: {
      mini: UserRankingCard,
      compact: UserRankingCard,
      full: UserRankingCard
    },
    defaultProps: {
      title: '领刀排行',
      showRefresh: true,
      showSettings: true
    },
    configSchema: {
      title: { type: 'string', label: '标题', required: true },
      showRefresh: { type: 'boolean', label: '显示刷新按钮', default: true },
      showSettings: { type: 'boolean', label: '显示设置按钮', default: true }
    }
  },
  {
    id: 'material-return-card',
    name: '归还追踪',
    description: '按归还时间展示近7天归还数量、归还人员和明细记录',
    icon: markRaw(CutterReturnIcon),
    category: 'analytics',
    component: MaterialReturnCard,
    defaultSize: { w: 5, h: 3 },
    minSize: { w: 3, h: 2 },
    draggable: true,
    resizable: true,
    renderModes: {
      mini: MaterialReturnCard,
      compact: MaterialReturnCard,
      full: MaterialReturnCard
    },
    defaultProps: {
      title: '归还追踪',
      showRefresh: true,
      showSettings: true
    },
    configSchema: {
      title: { type: 'string', label: '标题', required: true },
      showRefresh: { type: 'boolean', label: '显示刷新按钮', default: true },
      showSettings: { type: 'boolean', label: '显示设置按钮', default: true }
    }
  },
  {
    id: 'stock-change-card',
    name: '库存变更记录',
    description: '展示刀柜货道库存变更、入库出库净变化和操作明细',
    icon: markRaw(CutterStockFlowIcon),
    category: 'analytics',
    component: StockChangeCard,
    defaultSize: { w: 5, h: 3 },
    minSize: { w: 3, h: 2 },
    draggable: true,
    resizable: true,
    renderModes: {
      mini: StockChangeCard,
      compact: StockChangeCard,
      full: StockChangeCard
    },
    defaultProps: {
      title: '库存变更记录',
      showRefresh: true,
      showSettings: true
    },
    configSchema: {
      title: { type: 'string', label: '标题', required: true },
      showRefresh: { type: 'boolean', label: '显示刷新按钮', default: true },
      showSettings: { type: 'boolean', label: '显示设置按钮', default: true }
    }
  },
  {
    id: 'violation-record-card',
    name: '异常违规记录',
    description: '展示近7天违规借刀记录、涉及人员和风险明细',
    icon: markRaw(CutterViolationIcon),
    category: 'analytics',
    component: ViolationRecordCard,
    defaultSize: { w: 5, h: 3 },
    minSize: { w: 3, h: 2 },
    draggable: true,
    resizable: true,
    renderModes: {
      mini: ViolationRecordCard,
      compact: ViolationRecordCard,
      full: ViolationRecordCard
    },
    defaultProps: {
      title: '异常违规记录',
      showRefresh: true,
      showSettings: true
    },
    configSchema: {
      title: { type: 'string', label: '标题', required: true },
      showRefresh: { type: 'boolean', label: '显示刷新按钮', default: true },
      showSettings: { type: 'boolean', label: '显示设置按钮', default: true }
    }
  }
]

export function registerAllCards(cardStore: any) {
  cardConfigs.forEach(config => {
    cardStore.registerCard(config)
  })
}
