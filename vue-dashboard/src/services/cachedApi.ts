/**
 * 带缓存功能的API服务
 * 在原有API基础上添加智能缓存功能
 */

import { getCacheManager, CacheKeys, cached } from './cache'
import * as originalApi from './api'
import type {
  ApiResponse,
  PaginatedResponse,
  Material,
  Cabinet,
  CabinetSlot,
  PickupRecord,
  User,
  Project
} from '@/types'

// 获取缓存管理器
const cacheManager = getCacheManager()

/**
 * 缓存配置
 */
const CACHE_CONFIG = {
  // 短期缓存 (1分钟) - 实时性要求高的数据
  SHORT: 60 * 1000,
  
  // 中期缓存 (5分钟) - 一般业务数据
  MEDIUM: 5 * 60 * 1000,
  
  // 长期缓存 (30分钟) - 相对稳定的数据
  LONG: 30 * 60 * 1000,
  
  // 超长期缓存 (2小时) - 很少变化的配置数据
  EXTRA_LONG: 2 * 60 * 60 * 1000
}

/**
 * 创建带缓存的API方法
 */
function createCachedApiMethod<T extends (...args: any[]) => Promise<any>>(
  originalMethod: T,
  cacheKeyGenerator: (...args: Parameters<T>) => string,
  ttl: number = CACHE_CONFIG.MEDIUM,
  options: {
    skipCache?: boolean
    invalidatePattern?: string | RegExp
  } = {}
): T {
  return (async (...args: Parameters<T>) => {
    const cacheKey = cacheKeyGenerator(...args)
    
    // 如果跳过缓存，直接调用原方法
    if (options.skipCache) {
      const result = await originalMethod(...args)
      // 更新缓存
      await cacheManager.set(cacheKey, result, { ttl })
      return result
    }
    
    // 尝试从缓存获取
    const cached = await cacheManager.get(cacheKey)
    if (cached !== null) {
      return cached
    }
    
    // 缓存未命中，调用原方法
    const result = await originalMethod(...args)
    
    // 存储到缓存
    await cacheManager.set(cacheKey, result, { ttl })
    
    return result
  }) as T
}

/**
 * 登录相关 - 不缓存敏感操作
 */
export const authApi = {
  login: originalApi.authApi.login // 登录不缓存
}

/**
 * 物料相关 - 中期缓存
 */
export const materialApi = {
  // 查询物料信息 - 5分钟缓存
  getMaterials: createCachedApiMethod(
    originalApi.materialApi.getMaterials,
    (page, rows, filters) => CacheKeys.api('materials', { page, rows, filters }),
    CACHE_CONFIG.MEDIUM
  ),
  
  // 查询预警物料 - 1分钟缓存 (需要实时性)
  getWarnMaterials: createCachedApiMethod(
    originalApi.materialApi.getWarnMaterials,
    (page, rows) => CacheKeys.api('materials/warn', { page, rows }),
    CACHE_CONFIG.SHORT
  ),
  
  // 新增物料 - 不缓存，但会清理相关缓存
  addMaterial: async (material: Partial<Material>) => {
    const result = await originalApi.materialApi.addMaterial(material)
    // 清理物料相关缓存
    await cacheManager.invalidate(/materials/)
    return result
  },
  
  // 物料库存出入库 - 不缓存，但会清理相关缓存
  updateInventory: async (data: any) => {
    const result = await originalApi.materialApi.updateInventory(data)
    // 清理库存相关缓存
    await cacheManager.invalidate(/materials|cabinets/)
    return result
  }
}

/**
 * 柜体相关 - 短期缓存 (状态变化较快)
 */
export const cabinetApi = {
  // 查询工具柜列表 - 1分钟缓存
  getCabinets: createCachedApiMethod(
    originalApi.cabinetApi.getCabinets,
    (page, rows) => CacheKeys.api('cabinets', { page, rows }),
    CACHE_CONFIG.SHORT
  ),
  
  // 查询柜体货道详情 - 1分钟缓存
  getCabinetSlots: createCachedApiMethod(
    originalApi.cabinetApi.getCabinetSlots,
    (cuttingNo) => CacheKeys.api('cabinets/slots', { cuttingNo }),
    CACHE_CONFIG.SHORT
  ),
  
  // 货道库存入库 - 不缓存，清理相关缓存
  updateSlotInventory: async (data: any) => {
    const result = await originalApi.cabinetApi.updateSlotInventory(data)
    // 清理柜体相关缓存
    await cacheManager.invalidate(/cabinets/)
    return result
  }
}

/**
 * 领用记录相关 - 短期缓存
 */
export const pickupApi = {
  // 根据领用时间查询 - 1分钟缓存
  getPickupsByBorrowTime: createCachedApiMethod(
    originalApi.pickupApi.getPickupsByBorrowTime,
    (startTime, endTime, page, rows) => 
      CacheKeys.api('pickups/borrow', { startTime, endTime, page, rows }),
    CACHE_CONFIG.SHORT
  ),
  
  // 根据归还时间查询 - 1分钟缓存
  getPickupsByReturnTime: createCachedApiMethod(
    originalApi.pickupApi.getPickupsByReturnTime,
    (startTime, endTime, page, rows) => 
      CacheKeys.api('pickups/return', { startTime, endTime, page, rows }),
    CACHE_CONFIG.SHORT
  )
}

/**
 * 用户相关 - 长期缓存 (用户信息相对稳定)
 */
export const userApi = {
  // 查询用户列表 - 30分钟缓存
  getUsers: createCachedApiMethod(
    originalApi.userApi.getUsers,
    (page, rows) => CacheKeys.api('users', { page, rows }),
    CACHE_CONFIG.LONG
  )
}

/**
 * 项目相关 - 中期缓存
 */
export const projectApi = {
  // 查询项目列表 - 5分钟缓存
  getProjects: createCachedApiMethod(
    originalApi.projectApi.getProjects,
    (page, rows, filters) => CacheKeys.api('projects', { page, rows, filters }),
    CACHE_CONFIG.MEDIUM
  ),
  
  // 新增项目 - 不缓存，清理相关缓存
  addProject: async (project: Partial<Project>) => {
    const result = await originalApi.projectApi.addProject(project)
    // 清理项目相关缓存
    await cacheManager.invalidate(/projects/)
    return result
  },
  
  // 更新项目 - 不缓存，清理相关缓存
  updateProject: async (id: number, project: Partial<Project>) => {
    const result = await originalApi.projectApi.updateProject(id, project)
    // 清理项目相关缓存
    await cacheManager.invalidate(/projects/)
    return result
  }
}

/**
 * 缓存管理工具
 */
export const cacheUtils = {
  // 手动刷新特定API缓存
  async refreshCache(apiPattern: string | RegExp) {
    const invalidated = await cacheManager.invalidate(apiPattern)
    console.log(`刷新缓存完成，清理了 ${invalidated} 个缓存项`)
    return invalidated
  },
  
  // 预热常用数据缓存
  async warmupCommonData() {
    console.log('开始预热常用数据缓存...')
    
    try {
      // 并行预热多个常用接口
      await Promise.allSettled([
        materialApi.getMaterials(1, 20), // 物料列表
        materialApi.getWarnMaterials(1, 10), // 预警物料
        cabinetApi.getCabinets(1, 50), // 柜体列表
        userApi.getUsers(1, 50), // 用户列表
      ])
      
      console.log('✅ 常用数据缓存预热完成')
    } catch (error) {
      console.error('❌ 缓存预热失败:', error)
    }
  },
  
  // 获取缓存统计信息
  async getCacheStats() {
    return await cacheManager.getAllStats()
  },
  
  // 清理所有API缓存
  async clearAllCache() {
    await cacheManager.clear()
    console.log('所有API缓存已清理')
  },
  
  // 清理特定模块缓存
  async clearModuleCache(module: 'materials' | 'cabinets' | 'pickups' | 'users' | 'projects') {
    const invalidated = await cacheManager.invalidate(new RegExp(module))
    console.log(`${module} 模块缓存已清理，清理了 ${invalidated} 个缓存项`)
    return invalidated
  }
}

/**
 * 智能缓存刷新策略
 */
export const smartCacheRefresh = {
  // 根据用户操作智能刷新相关缓存
  async onUserAction(action: 'add' | 'update' | 'delete', module: string, data?: any) {
    switch (action) {
      case 'add':
      case 'update':
      case 'delete':
        // 清理相关模块缓存
        await cacheUtils.clearModuleCache(module as any)
        
        // 如果是库存相关操作，同时清理相关缓存
        if (module === 'materials' || module === 'cabinets') {
          await Promise.all([
            cacheUtils.clearModuleCache('materials'),
            cacheUtils.clearModuleCache('cabinets')
          ])
        }
        break
    }
  },
  
  // 定时刷新策略
  startPeriodicRefresh() {
    // 每5分钟刷新一次实时性要求高的数据
    setInterval(async () => {
      await Promise.all([
        cacheUtils.clearModuleCache('cabinets'), // 柜体状态
        materialApi.getWarnMaterials(1, 10) // 重新获取预警物料
      ])
    }, 5 * 60 * 1000)
    
    console.log('✅ 定时缓存刷新策略已启动')
  }
}

// 导出原始API作为备用
export const originalApis = originalApi

// 默认导出缓存版本的API
export default {
  auth: authApi,
  material: materialApi,
  cabinet: cabinetApi,
  pickup: pickupApi,
  user: userApi,
  project: projectApi,
  cache: cacheUtils,
  smartRefresh: smartCacheRefresh
}
