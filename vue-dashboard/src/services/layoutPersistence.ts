import { getCacheManager } from '@/services/cache'
import type { LayoutItem } from '@/types'

/**
 * 用户布局配置接口
 */
export interface UserLayoutConfig {
  userId: number
  userName: string
  layouts: LayoutItem[]
  lastSaved: string
  version: string
}

/**
 * 布局持久化服务
 * 负责保存和恢复用户的布局配置
 */
export class LayoutPersistenceService {
  private cacheManager = getCacheManager()
  private readonly CACHE_TTL = 30 * 24 * 60 * 60 * 1000 // 30天
  private readonly VERSION = '1.0'

  /**
   * 生成用户布局缓存键
   */
  private getUserLayoutKey(userId: number): string {
    return `user_layout_${userId}`
  }

  /**
   * 保存用户布局配置
   */
  async saveUserLayout(userId: number, userName: string, layouts: LayoutItem[], silent: boolean = true): Promise<void> {
    try {
      const layoutConfig: UserLayoutConfig = {
        userId,
        userName,
        layouts: layouts.map(item => ({
          i: item.i,
          x: item.x,
          y: item.y,
          w: item.w,
          h: item.h,
          minW: item.minW,
          minH: item.minH,
          maxW: item.maxW,
          maxH: item.maxH,
          static: item.static,
          isDraggable: item.isDraggable,
          isResizable: item.isResizable
        })),
        lastSaved: new Date().toISOString(),
        version: this.VERSION
      }

      const cacheKey = this.getUserLayoutKey(userId)
      await this.cacheManager.set(cacheKey, layoutConfig, {
        ttl: this.CACHE_TTL,
        persistent: true // 保存到localStorage
      })

      if (!silent) {
        console.log(`💾 布局已保存 - ${userName}(${layouts.length}个卡片)`)
      }
    } catch (error) {
      console.error('❌ 保存用户布局失败:', error)
      throw error
    }
  }

  /**
   * 恢复用户布局配置
   */
  async restoreUserLayout(userId: number, userName?: string): Promise<LayoutItem[] | null> {
    try {
      const cacheKey = this.getUserLayoutKey(userId)
      const savedLayout = await this.cacheManager.get<UserLayoutConfig>(cacheKey)

      if (!savedLayout) {
        return null
      }

      // 验证数据完整性
      if (!this.validateLayoutConfig(savedLayout, userId)) {
        console.warn(`⚠️ 布局数据无效，已清理 - ${userName || userId}`)
        await this.clearUserLayout(userId)
        return null
      }

      console.log(`📂 布局已恢复 - ${savedLayout.userName}(${savedLayout.layouts.length}个卡片)`)

      return savedLayout.layouts
    } catch (error) {
      console.error('❌ 恢复用户布局失败:', error)
      return null
    }
  }

  /**
   * 清理用户布局配置
   */
  async clearUserLayout(userId: number): Promise<void> {
    try {
      const cacheKey = this.getUserLayoutKey(userId)
      await this.cacheManager.delete(cacheKey)
      console.log(`🧹 用户 ${userId} 的布局配置已清理`)
    } catch (error) {
      console.error('❌ 清理用户布局失败:', error)
    }
  }

  /**
   * 验证布局配置数据
   */
  private validateLayoutConfig(config: any, expectedUserId: number): config is UserLayoutConfig {
    if (!config || typeof config !== 'object') {
      return false
    }

    // 验证用户ID匹配
    if (config.userId !== expectedUserId) {
      return false
    }

    // 验证必要字段
    if (!Array.isArray(config.layouts)) {
      return false
    }

    // 验证布局项格式
    return config.layouts.every((item: any) => 
      typeof item.i === 'string' &&
      typeof item.x === 'number' &&
      typeof item.y === 'number' &&
      typeof item.w === 'number' &&
      typeof item.h === 'number'
    )
  }

  /**
   * 获取所有用户的布局统计信息（调试用）
   */
  async getLayoutStats(): Promise<Record<string, any>> {
    try {
      const stats = await this.cacheManager.getAllStats()
      const layoutKeys = Object.keys(stats.localStorage?.items || {})
        .filter(key => key.includes('user_layout_'))
      
      const layoutStats: Record<string, any> = {}
      for (const key of layoutKeys) {
        const userId = key.split('_').pop()
        const config = await this.cacheManager.get(key.replace('dashboard_cache_', ''))
        if (config) {
          layoutStats[userId || 'unknown'] = {
            userName: config.userName,
            layoutCount: config.layouts?.length || 0,
            lastSaved: config.lastSaved
          }
        }
      }

      return layoutStats
    } catch (error) {
      console.error('❌ 获取布局统计失败:', error)
      return {}
    }
  }
}

// 创建单例实例
export const layoutPersistence = new LayoutPersistenceService()

// 添加到全局调试工具
if (typeof window !== 'undefined') {
  ;(window as any).__layoutPersistence = {
    service: layoutPersistence,

    // 快捷调试方法
    async stats() {
      return await layoutPersistence.getLayoutStats()
    },

    async save(userId: number, userName: string, layouts: any[]) {
      return await layoutPersistence.saveUserLayout(userId, userName, layouts)
    },

    async restore(userId: number, userName?: string) {
      return await layoutPersistence.restoreUserLayout(userId, userName)
    },

    async clear(userId: number) {
      return await layoutPersistence.clearUserLayout(userId)
    },

    // 查看当前用户的布局
    async current() {
      const authStore = (await import('@/stores/auth')).useAuthStore()
      const user = authStore.user
      if (user) {
        return await layoutPersistence.restoreUserLayout(user.id, user.userName)
      } else {
        console.warn('用户未登录')
        return null
      }
    }
  }

  console.log('🔧 布局持久化调试工具已加载')
  console.log('使用 window.__layoutPersistence 访问调试功能')
}
