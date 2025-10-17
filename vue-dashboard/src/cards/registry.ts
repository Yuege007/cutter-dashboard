import { defineAsyncComponent, markRaw } from 'vue'
import type { CardConfig } from '@/types'

// 异步加载卡片组件（使用markRaw防止响应式化）
const InventoryAlarmCard = markRaw(defineAsyncComponent(() => import('@/components/cards/InventoryAlarmCard.vue')))
const MaterialOverviewCard = markRaw(defineAsyncComponent(() => import('@/components/cards/MaterialOverviewCard.vue')))
const CabinetStatusCard = markRaw(defineAsyncComponent(() => import('@/components/cards/CabinetStatusCard.vue')))
const InOutTrendCard = markRaw(defineAsyncComponent(() => import('@/components/cards/InOutTrendCard.vue')))
const UserRankingCard = markRaw(defineAsyncComponent(() => import('@/components/cards/UserRankingCard.vue')))
const MaterialReturnCard = markRaw(defineAsyncComponent(() => import('@/components/cards/MaterialReturnCard.vue')))

// 卡片配置
export const cardConfigs: CardConfig[] = [
  // 库存状态概览卡片
  {
    id: 'inventory-alarm-card',
    name: '库存预警',
    description: '监控库存预警状态，显示紧缺物料信息',
    icon: '⚠️',
    category: 'inventory',
    component: InventoryAlarmCard,
    defaultSize: { w: 3, h: 2 },
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

  // 物料库存总览卡片
  {
    id: 'material-overview-card',
    name: '物料库存总览',
    description: '展示物料库存的全局概览，包括种类、数量和价值统计',
    icon: '📦',
    category: 'inventory',
    component: MaterialOverviewCard,
    defaultSize: { w: 4, h: 3 },
    minSize: { w: 2, h: 2 },
    draggable: true,
    resizable: true,
    renderModes: {
      mini: MaterialOverviewCard,
      compact: MaterialOverviewCard,
      full: MaterialOverviewCard
    },
    defaultProps: {
      title: '物料库存总览',
      showRefresh: true,
      showSettings: true
    },
    configSchema: {
      title: { type: 'string', label: '标题', required: true },
      showRefresh: { type: 'boolean', label: '显示刷新按钮', default: true },
      showSettings: { type: 'boolean', label: '显示设置按钮', default: true }
    }
  },

  // 出入库趋势卡片
  {
    id: 'in-out-trend-card',
    name: '出入库趋势',
    description: '展示物料出入库的时间趋势和统计分析',
    icon: '📊',
    category: 'analytics',
    component: InOutTrendCard,
    defaultSize: { w: 4, h: 3 },
    minSize: { w: 2, h: 2 },
    draggable: true,
    resizable: true,
    renderModes: {
      mini: InOutTrendCard,
      compact: InOutTrendCard,
      full: InOutTrendCard
    },
    defaultProps: {
      title: '出入库趋势',
      showRefresh: true,
      showSettings: true
    },
    configSchema: {
      title: { type: 'string', label: '标题', required: true },
      showRefresh: { type: 'boolean', label: '显示刷新按钮', default: true },
      showSettings: { type: 'boolean', label: '显示设置按钮', default: true }
    }
  },

  // 智能柜状态监控卡片
  {
    id: 'cabinet-status-card',
    name: '智能柜状态监控',
    description: '监控智能柜设备运行状态，查看货道详情',
    icon: '🏪',
    category: 'device',
    component: CabinetStatusCard,
    defaultSize: { w: 4, h: 3 },
    minSize: { w: 2, h: 2 },
    draggable: true,
    resizable: true,
    renderModes: {
      mini: CabinetStatusCard,
      compact: CabinetStatusCard,
      full: CabinetStatusCard
    },
    defaultProps: {
      title: '智能柜监控',
      showRefresh: true,
      showSettings: true
    },
    configSchema: {
      title: { type: 'string', label: '标题', required: true },
      showRefresh: { type: 'boolean', label: '显示刷新按钮', default: true },
      showSettings: { type: 'boolean', label: '显示设置按钮', default: true }
    }
  },

  // 领用排行榜卡片
  {
    id: 'user-ranking-card',
    name: '领用排行榜',
    description: '展示用户领用行为分析，激励和展示人员的物料领用情况',
    icon: '🏆',
    category: 'analytics',
    component: UserRankingCard,
    defaultSize: { w: 4, h: 3 },
    minSize: { w: 2, h: 2 },
    draggable: true,
    resizable: true,
    renderModes: {
      mini: UserRankingCard,
      compact: UserRankingCard,
      full: UserRankingCard
    },
    defaultProps: {
      title: '领用排行榜',
      showRefresh: true,
      showSettings: true
    },
    configSchema: {
      title: { type: 'string', label: '标题', required: true },
      showRefresh: { type: 'boolean', label: '显示刷新按钮', default: true },
      showSettings: { type: 'boolean', label: '显示设置按钮', default: true }
    }
  },

  // 物料归还追踪卡片
  {
    id: 'material-return-card',
    name: '物料归还追踪',
    description: '追踪物料的归还情况，便于管理和追溯，提供归还记录的详细分析',
    icon: '↩️',
    category: 'tracking',
    component: MaterialReturnCard,
    defaultSize: { w: 4, h: 3 },
    minSize: { w: 2, h: 2 },
    draggable: true,
    resizable: true,
    renderModes: {
      mini: MaterialReturnCard,
      compact: MaterialReturnCard,
      full: MaterialReturnCard
    },
    defaultProps: {
      title: '物料归还追踪',
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

// 注册所有卡片的函数
export function registerAllCards(cardStore: any) {
  cardConfigs.forEach(config => {
    cardStore.registerCard(config)
  })
}
