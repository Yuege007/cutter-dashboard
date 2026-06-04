import { useDataStore } from '@/stores/data'
import { useCardStore } from '@/stores/card'
import cutterApi from './cutterApi'
import cutterAdapter from '@/adapters/cutterAdapter'

const formatDateTime = (date: Date) => {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

// 轮询任务接口
interface PollingTask {
  id: string
  apiCall: () => Promise<any>
  interval: number
  enabled: boolean
  lastRun?: Date
  nextRun?: Date
  errorCount: number
  maxRetries: number
}

class PollingService {
  private tasks = new Map<string, PollingTask>()
  private timers = new Map<string, ReturnType<typeof setInterval>>()
  private isRunning = false

  // 添加轮询任务
  addTask(
    id: string,
    apiCall: () => Promise<any>,
    interval: number = 30000,
    maxRetries: number = 3
  ) {
    const task: PollingTask = {
      id,
      apiCall,
      interval,
      enabled: true,
      errorCount: 0,
      maxRetries
    }

    this.tasks.set(id, task)
    
    if (this.isRunning) {
      this.startTask(id)
    }
  }

  // 移除轮询任务
  removeTask(id: string) {
    this.stopTask(id)
    this.tasks.delete(id)
  }

  // 启用/禁用任务
  toggleTask(id: string, enabled: boolean) {
    const task = this.tasks.get(id)
    if (task) {
      task.enabled = enabled
      if (enabled && this.isRunning) {
        this.startTask(id)
      } else {
        this.stopTask(id)
      }
    }
  }

  // 更新任务间隔
  updateInterval(id: string, interval: number) {
    const task = this.tasks.get(id)
    if (task) {
      task.interval = interval
      if (task.enabled && this.isRunning) {
        this.stopTask(id)
        this.startTask(id)
      }
    }
  }

  // 手动执行任务
  async executeTask(id: string): Promise<boolean> {
    const task = this.tasks.get(id)
    if (!task) return false

    const dataStore = useDataStore()
    
    try {
      dataStore.setLoading(id, true)
      const result = await task.apiCall()
      
      dataStore.setData(id, result.data)
      task.errorCount = 0
      task.lastRun = new Date()
      
      return true
    } catch (error) {
      task.errorCount++
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      dataStore.setError(id, errorMessage)
      
      console.error(`Polling task ${id} failed:`, error)
      
      // 如果错误次数超过最大重试次数，禁用任务
      if (task.errorCount >= task.maxRetries) {
        console.warn(`Polling task ${id} disabled due to too many errors`)
        this.toggleTask(id, false)
      }
      
      return false
    } finally {
      dataStore.setLoading(id, false)
    }
  }

  // 启动单个任务
  private startTask(id: string) {
    const task = this.tasks.get(id)
    if (!task || !task.enabled) return

    // 清除现有定时器
    this.stopTask(id)

    // 立即执行一次
    this.executeTask(id)

    // 设置定时器
    const timer = setInterval(() => {
      if (task.enabled) {
        this.executeTask(id)
      }
    }, task.interval)

    this.timers.set(id, timer)
    task.nextRun = new Date(Date.now() + task.interval)
  }

  // 停止单个任务
  private stopTask(id: string) {
    const timer = this.timers.get(id)
    if (timer) {
      clearInterval(timer)
      this.timers.delete(id)
    }
  }

  // 启动所有轮询
  start() {
    if (this.isRunning) return

    this.isRunning = true
    
    for (const [id, task] of this.tasks) {
      if (task.enabled) {
        this.startTask(id)
      }
    }
    
    console.log('Polling service started')
  }

  // 停止所有轮询
  stop() {
    if (!this.isRunning) return

    this.isRunning = false
    
    for (const id of this.timers.keys()) {
      this.stopTask(id)
    }
    
    console.log('Polling service stopped')
  }

  // 获取任务状态
  getTaskStatus(id: string) {
    const task = this.tasks.get(id)
    if (!task) return null

    return {
      id: task.id,
      enabled: task.enabled,
      interval: task.interval,
      lastRun: task.lastRun,
      nextRun: task.nextRun,
      errorCount: task.errorCount,
      maxRetries: task.maxRetries,
      isRunning: this.timers.has(id)
    }
  }

  // 获取所有任务状态
  getAllTaskStatus() {
    return Array.from(this.tasks.keys()).map(id => this.getTaskStatus(id))
  }

  // 重置任务错误计数
  resetErrorCount(id: string) {
    const task = this.tasks.get(id)
    if (task) {
      task.errorCount = 0
    }
  }

  // 登录态恢复后重新启用任务，避免登录前未授权错误导致任务被禁用
  prepareTasksForStart(ids: string[]) {
    ids.forEach(id => {
      const task = this.tasks.get(id)
      if (task) {
        task.enabled = true
        task.errorCount = 0
      }
    })
  }

  // 清理所有任务
  clear() {
    this.stop()
    this.tasks.clear()
  }
}

// 创建全局轮询服务实例
export const pollingService = new PollingService()

export const cutterPollingTaskIds = [
  'cutter-cabinets',
  'cutter-materials',
  'cutter-inventory-warnings',
  'cutter-item-warnings',
  'cutter-cargo-inventory',
  'cutter-inventory-overview',
  'cutter-borrow-records',
  'cutter-return-records',
  'cutter-stock-changes',
  'cutter-violation-records'
]

let defaultPollingTasksReady = false

// 预定义的轮询任务
export const setupDefaultPollingTasks = () => {
  if (defaultPollingTasksReady) return
  defaultPollingTasksReady = true

  // 刀具柜柜体列表轮询
  pollingService.addTask(
    'cutter-cabinets',
    async () => {
      const response = await cutterApi.cabinet.getCabinets()
      return {
        ...response,
        data: cutterAdapter.getRows(response.data).map(cutterAdapter.mapCutterCabinet)
      }
    },
    1800000 // 30分钟
  )

  // 刀具库存轮询
  pollingService.addTask(
    'cutter-materials',
    async () => {
      const response = await cutterApi.material.getMaterials()
      return {
        ...response,
        data: cutterAdapter.getRows(response.data).map(cutterAdapter.mapCutterMaterial)
      }
    },
    120000 // 2分钟
  )

  // 耗材库存预警轮询
  pollingService.addTask(
    'cutter-inventory-warnings',
    async () => {
      const response = await cutterApi.material.getInventoryWarnings({ page: 1, rows: 100 })
      return {
        ...response,
        data: cutterAdapter.getRows(response.data).map(cutterAdapter.mapMaterialWarning)
      }
    },
    60000 // 1分钟
  )

  // 货道库存预警轮询
  pollingService.addTask(
    'cutter-item-warnings',
    async () => {
      const response = await cutterApi.getAllItemWarnings()
      return {
        ...response,
        data: cutterAdapter.getRows(response.data).map(cutterAdapter.mapItemWarning)
      }
    },
    60000 // 1分钟
  )

  // 货道库存轮询
  pollingService.addTask(
    'cutter-cargo-inventory',
    async () => {
      const response = await cutterApi.getAllCargoInventories()
      return {
        ...response,
        data: cutterAdapter.getRows(response.data).map(cutterAdapter.mapCutterCargoSlot)
      }
    },
    1800000 // 30分钟
  )

  // 库存总览聚合轮询
  pollingService.addTask(
    'cutter-inventory-overview',
    async () => {
      const [materialsResponse, warningsResponse] = await Promise.all([
        cutterApi.material.getMaterials(),
        cutterApi.material.getInventoryWarnings({ page: 1, rows: 100 })
      ])
      const materials = cutterAdapter.getRows(materialsResponse.data).map(cutterAdapter.mapCutterMaterial)
      const warnings = cutterAdapter.getRows(warningsResponse.data).map(cutterAdapter.mapMaterialWarning)

      return {
        ...materialsResponse,
        data: cutterAdapter.buildInventoryOverview(materials, warnings)
      }
    },
    120000 // 2分钟
  )

  pollingService.addTask(
    'cutter-borrow-records',
    async () => {
      const endDate = new Date()
      const startDate = new Date(endDate)
      startDate.setDate(startDate.getDate() - 14)
      startDate.setHours(0, 0, 0, 0)

      const response = await cutterApi.borrow.getBorrowRecords({
        startTime: formatDateTime(startDate),
        endTime: formatDateTime(endDate),
        page: 1,
        rows: 100
      })

      return {
        ...response,
        data: cutterAdapter.getRows(response.data).map(cutterAdapter.mapBorrowRecord)
      }
    },
    120000
  )

  pollingService.addTask(
    'cutter-return-records',
    async () => {
      const endDate = new Date()
      const startDate = new Date(endDate)
      startDate.setDate(startDate.getDate() - 6)
      startDate.setHours(0, 0, 0, 0)

      const response = await cutterApi.borrow.getReturnRecords({
        startTime: formatDateTime(startDate),
        endTime: formatDateTime(endDate),
        page: 1,
        rows: 100
      })

      return {
        ...response,
        data: cutterAdapter.getRows(response.data).map(cutterAdapter.mapBorrowRecord)
      }
    },
    120000
  )

  pollingService.addTask(
    'cutter-stock-changes',
    async () => {
      const endDate = new Date()
      const startDate = new Date(endDate)
      startDate.setDate(startDate.getDate() - 6)
      startDate.setHours(0, 0, 0, 0)

      const response = await cutterApi.stock.getStockChanges({
        startTime: formatDateTime(startDate),
        endTime: formatDateTime(endDate),
        page: 1,
        rows: 100
      })

      return {
        ...response,
        data: cutterAdapter.getRows(response.data).map(cutterAdapter.mapStockChangeRecord)
      }
    },
    120000
  )

  pollingService.addTask(
    'cutter-violation-records',
    async () => {
      const endDate = new Date()
      const startDate = new Date(endDate)
      startDate.setDate(startDate.getDate() - 6)
      startDate.setHours(0, 0, 0, 0)

      const response = await cutterApi.violation.getViolationRecords({
        startTime: formatDateTime(startDate),
        endTime: formatDateTime(endDate),
        page: 1,
        rows: 100
      })

      return {
        ...response,
        data: cutterAdapter.getRows(response.data).map(cutterAdapter.mapBorrowRecord)
      }
    },
    120000
  )
}

export const startDefaultPollingTasks = () => {
  setupDefaultPollingTasks()

  const dataStore = useDataStore()
  cutterPollingTaskIds.forEach(id => {
    dataStore.clearError(id)
    dataStore.setLoading(id, false)
  })

  pollingService.prepareTasksForStart(cutterPollingTaskIds)
  pollingService.start()
}

// 根据卡片需求动态添加轮询任务
export const setupCardPollingTasks = () => {
  const cardStore = useCardStore()
  
  // 监听活跃卡片变化，动态添加/移除轮询任务
  cardStore.$subscribe((mutation, state) => {
    // 这里可以根据活跃卡片的类型动态调整轮询任务
    // 例如：如果有库存卡片，增加库存数据轮询频率
  })
}

export default pollingService
