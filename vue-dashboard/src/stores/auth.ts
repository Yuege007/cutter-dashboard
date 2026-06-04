import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { http } from '@/services/http'

// 用户信息接口
export interface UserInfo {
  id: number
  userId: string
  userName: string
  name: string
  sex: number
  tel: string
  mobileNo: string
  remark: string
  createTime: string
  company: string
  logogram_company: string
  factoryMapConfigList: Array<{
    factoryPid: number
    factoryName: string
    id: number
    workShopName: string
  }>
  ct_url?: string
  serverUrl?: string
}

export const useAuthStore = defineStore('auth', () => {
  // 状态
  const token = ref<string | null>(null)
  const user = ref<UserInfo | null>(null)
  const isLoggedIn = computed(() => !!token.value)

  // 登录
  const login = (authToken: string, userInfo: UserInfo) => {
    token.value = authToken
    user.value = userInfo
    const apiBaseUrl = userInfo.ct_url || userInfo.serverUrl
    
    // 保存到localStorage
    localStorage.setItem('auth_token', authToken)
    localStorage.setItem('user_info', JSON.stringify(userInfo))
    if (apiBaseUrl) {
      localStorage.setItem('api_base_url', apiBaseUrl)
    } else {
      localStorage.removeItem('api_base_url')
    }
    
    // 设置HTTP客户端token
    http.setToken(authToken)
    if (apiBaseUrl) {
      http.setBaseURL(apiBaseUrl)
    }
  }

  // 登出
  const logout = async () => {
    // 获取当前用户信息（在清理前保存）
    const currentUser = user.value

    // 清理认证状态
    token.value = null
    user.value = null

    // 清除localStorage
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user_info')
    localStorage.removeItem('api_base_url')

    // 清除HTTP客户端token
    http.clearToken()

    // 🆕 清理用户相关缓存数据
    await clearUserCache(currentUser)
  }

  /**
   * 清理用户相关的缓存数据
   * 防止新用户看到旧用户的数据
   */
  const clearUserCache = async (currentUser: UserInfo | null) => {
    try {
      console.log('🧹 开始清理用户缓存数据...')

      // 动态导入缓存管理器，避免循环依赖
      const { getCacheManager } = await import('@/services/cache')
      const cacheManager = getCacheManager()

      // 清理策略：
      // 1. 清理所有API缓存（可能包含用户特定数据）
      const apiCacheCleared = await cacheManager.invalidate(/^api:/)
      console.log(`清理API缓存: ${apiCacheCleared} 项`)

      // 2. 清理用户配置相关缓存
      const userConfigCleared = await cacheManager.invalidate(/user_|dashboard_layout|card_configs/)
      console.log(`清理用户配置缓存: ${userConfigCleared} 项`)

      // 3. 清理内存缓存（最彻底的清理）
      await cacheManager.clear({ layer: 'memory' })
      console.log('清理内存缓存: 完成')

      // 4. 清理可能包含用户数据的特定缓存模式
      const patterns = [
        /materials/,    // 物料数据
        /pickups/,      // 领用记录
        /cabinets/,     // 柜体数据
        /users/,        // 用户数据
        /projects/      // 项目数据
      ]

      let totalCleared = 0
      for (const pattern of patterns) {
        const cleared = await cacheManager.invalidate(pattern)
        totalCleared += cleared
      }
      console.log(`清理业务数据缓存: ${totalCleared} 项`)

      // 🆕 注意：保留用户布局配置，不清理 user_layout_ 相关缓存
      // 这样用户重新登录时可以恢复之前的布局设置

      console.log('✅ 用户缓存清理完成，数据安全已保障')

      // 如果有用户信息，记录清理日志
      if (currentUser) {
        console.log(`用户 ${currentUser.name || currentUser.userName} 的缓存已清理`)
      }

    } catch (error) {
      console.error('❌ 清理用户缓存失败:', error)
      // 即使清理失败也不影响登出流程
      // 但我们应该记录这个错误以便调试
    }
  }

  // 从localStorage恢复状态
  const restoreFromStorage = async () => {
    const savedToken = localStorage.getItem('auth_token')
    const savedUser = localStorage.getItem('user_info')
    const savedApiBaseUrl = localStorage.getItem('api_base_url')

    if (savedToken && savedUser) {
      try {
        token.value = savedToken
        user.value = JSON.parse(savedUser)
        http.setToken(savedToken)
        if (savedApiBaseUrl) {
          http.setBaseURL(savedApiBaseUrl)
        }
        return true
      } catch (error) {
        console.error('Failed to restore auth state:', error)
        await logout()
        return false
      }
    }
    return false
  }

  // 检查token是否有效
  const validateToken = async (): Promise<boolean> => {
    if (!token.value) return false

    try {
      // 这里可以调用一个验证token的API
      // 暂时返回true，实际项目中应该调用后端验证接口
      return true
    } catch (error) {
      console.error('Token validation failed:', error)
      await logout()
      return false
    }
  }

  // 获取用户显示名称
  const getUserDisplayName = computed(() => {
    if (!user.value) return ''
    return user.value.name || user.value.userName || user.value.mobileNo
  })

  // 获取用户公司信息
  const getUserCompany = computed(() => {
    if (!user.value) return ''
    return user.value.logogram_company || user.value.company
  })

  return {
    // 状态
    token,
    user,
    isLoggedIn,
    
    // 计算属性
    getUserDisplayName,
    getUserCompany,
    
    // 方法
    login,
    logout,
    restoreFromStorage,
    validateToken
  }
})
