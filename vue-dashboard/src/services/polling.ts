import { useDataStore } from '@/stores/data'
import { useCardStore } from '@/stores/card'
import api from './api'

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
  private timers = new Map<string, NodeJS.Timeout>()
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

  // 清理所有任务
  clear() {
    this.stop()
    this.tasks.clear()
  }
}

// 创建全局轮询服务实例
export const pollingService = new PollingService()

// 预定义的轮询任务
export const setupDefaultPollingTasks = () => {
  // 工具柜状态轮询
  pollingService.addTask(
    'cabinet-status',
    () => api.cabinet.getCabinets(1, 100),
    30000 // 30秒
  )

  // 预警物料轮询
  pollingService.addTask(
    'warn-materials',
    () => api.material.getWarnMaterials(1, 100),
    60000 // 1分钟
  )

  // 今日领用记录轮询
  pollingService.addTask(
    'today-pickups',
    () => {
      const today = new Date()
      const startTime = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')} 00:00:00`
      const endTime = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')} 23:59:59`
      return api.pickup.getPickupsByBorrowTime(startTime, endTime, 1, 100)
    },
    45000 // 45秒
  )

  // 今日归还记录轮询
  pollingService.addTask(
    'today-returns',
    () => {
      const today = new Date()
      const startTime = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')} 00:00:00`
      const endTime = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')} 23:59:59`
      return api.pickup.getPickupsByReturnTime(startTime, endTime, 1, 100)
    },
    45000 // 45秒
  )

  // 最近7天领用记录轮询（Rolling 7 days）
  pollingService.addTask(
    'week-pickups',
    () => {
      const today = new Date()
      const start = new Date(today)
      start.setDate(today.getDate() - 6)
      start.setHours(0, 0, 0, 0)
      const end = new Date(today)
      end.setHours(23, 59, 59, 999)

      const startTime = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')} 00:00:00`
      const endTime = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')} 23:59:59`
      return api.pickup.getPickupsByBorrowTime(startTime, endTime, 1, 100)
    },
    120000 // 2分钟
  )

  // 最近15天领用记录轮询
  pollingService.addTask(
    '15days-pickups',
    () => {
      const today = new Date()
      const start = new Date(today)
      start.setDate(today.getDate() - 14)
      start.setHours(0, 0, 0, 0)
      const end = new Date(today)
      end.setHours(23, 59, 59, 999)

      const startTime = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')} 00:00:00`
      const endTime = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')} 23:59:59`
      return api.pickup.getPickupsByBorrowTime(startTime, endTime, 1, 500)
    },
    180000 // 3分钟
  )

  // 最近30天领用记录轮询
  pollingService.addTask(
    '30days-pickups',
    () => {
      const today = new Date()
      const start = new Date(today)
      start.setDate(today.getDate() - 29)
      start.setHours(0, 0, 0, 0)
      const end = new Date(today)
      end.setHours(23, 59, 59, 999)

      const startTime = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')} 00:00:00`
      const endTime = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')} 23:59:59`
      return api.pickup.getPickupsByBorrowTime(startTime, endTime, 1, 500)
    },
    300000 // 5分钟
  )

  // 本周归还记录轮询（周一到周日）
  pollingService.addTask(
    'week-returns',
    () => {
      const today = new Date()
      const dayOfWeek = today.getDay()
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
      const monday = new Date(today)
      monday.setDate(today.getDate() + mondayOffset)
      monday.setHours(0, 0, 0, 0)

      const sunday = new Date(monday)
      sunday.setDate(monday.getDate() + 6)
      sunday.setHours(23, 59, 59, 999)

      const startTime = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')} 00:00:00`
      const endTime = `${sunday.getFullYear()}-${String(sunday.getMonth() + 1).padStart(2, '0')}-${String(sunday.getDate()).padStart(2, '0')} 23:59:59`
      return api.pickup.getPickupsByReturnTime(startTime, endTime, 1, 100)
    },
    120000 // 2分钟
  )

  // 项目状态轮询
  pollingService.addTask(
    'project-status',
    () => api.project.getProjects(1, 100, { projectState: 0 }),
    120000 // 2分钟
  )

  // 用户状态轮询
  pollingService.addTask(
    'user-status',
    () => api.user.getUsers(1, 100),
    300000 // 5分钟
  )

  // 物料总览轮询（分页聚合）
  pollingService.addTask(
    'materials-overview',
    async () => {
      const pageSize = 100
      let page = 1
      const allRows: any[] = []

      while (true) {
        const resp = await api.material.getMaterials(page, pageSize)
        const rows = resp.data?.rows || []
        if (!rows.length) break
        allRows.push(...rows)
        if (rows.length < pageSize) break
        page++
        // 防止无限循环，最多抓取2000条
        if (page > 20) break
      }

      return { data: { rows: allRows, total: allRows.length } }
    },
    120000 // 2分钟
  )
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
