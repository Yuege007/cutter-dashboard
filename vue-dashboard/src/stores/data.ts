import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ApiResponse } from '@/types'

export const useDataStore = defineStore('data', () => {
  // 状态
  const apiCache = ref<Map<string, any>>(new Map())
  const apiErrors = ref<Map<string, string>>(new Map())
  const apiLoading = ref<Map<string, boolean>>(new Map())
  const lastFetchTime = ref<Map<string, Date>>(new Map())
  const refreshIntervals = ref<Map<string, number>>(new Map())

  // 全局刷新间隔（秒）
  const globalRefreshInterval = ref(30)
  const isAutoRefreshEnabled = ref(true)

  // 计算属性
  const loadingApis = computed(() => {
    return Array.from(apiLoading.value.entries())
      .filter(([, loading]) => loading)
      .map(([api]) => api)
  })

  const errorApis = computed(() => {
    return Array.from(apiErrors.value.entries())
      .filter(([, error]) => error)
      .map(([api, error]) => ({ api, error }))
  })

  const cacheSize = computed(() => {
    return apiCache.value.size
  })

  // 方法
  const setLoading = (api: string, loading: boolean) => {
    if (loading) {
      apiLoading.value.set(api, true)
    } else {
      apiLoading.value.delete(api)
    }
  }

  const setError = (api: string, error: string) => {
    apiErrors.value.set(api, error)
  }

  const clearError = (api: string) => {
    apiErrors.value.delete(api)
  }

  const setData = (api: string, data: any) => {
    apiCache.value.set(api, data)
    lastFetchTime.value.set(api, new Date())
    clearError(api)
  }

  const getData = (api: string) => {
    return apiCache.value.get(api)
  }

  const hasData = (api: string): boolean => {
    return apiCache.value.has(api)
  }

  const isLoading = (api: string): boolean => {
    return apiLoading.value.get(api) || false
  }

  const getError = (api: string): string | undefined => {
    return apiErrors.value.get(api)
  }

  const getLastFetchTime = (api: string): Date | undefined => {
    return lastFetchTime.value.get(api)
  }

  const isDataStale = (api: string, maxAge: number = globalRefreshInterval.value): boolean => {
    const lastFetch = getLastFetchTime(api)
    if (!lastFetch) return true
    
    const now = new Date()
    const ageInSeconds = (now.getTime() - lastFetch.getTime()) / 1000
    return ageInSeconds > maxAge
  }

  const shouldRefresh = (api: string): boolean => {
    if (!isAutoRefreshEnabled.value) return false
    if (isLoading(api)) return false
    
    const customInterval = refreshIntervals.value.get(api)
    const interval = customInterval || globalRefreshInterval.value
    
    return isDataStale(api, interval)
  }

  const setRefreshInterval = (api: string, interval: number) => {
    refreshIntervals.value.set(api, interval)
  }

  const removeRefreshInterval = (api: string) => {
    refreshIntervals.value.delete(api)
  }

  const clearCache = (api?: string) => {
    if (api) {
      apiCache.value.delete(api)
      lastFetchTime.value.delete(api)
      clearError(api)
    } else {
      apiCache.value.clear()
      lastFetchTime.value.clear()
      apiErrors.value.clear()
    }
  }

  const clearAllLoading = () => {
    apiLoading.value.clear()
  }

  const clearAllErrors = () => {
    apiErrors.value.clear()
  }

  const getStats = () => {
    return {
      totalApis: apiCache.value.size,
      loadingCount: loadingApis.value.length,
      errorCount: errorApis.value.length,
      cacheSize: cacheSize.value,
      autoRefreshEnabled: isAutoRefreshEnabled.value,
      globalRefreshInterval: globalRefreshInterval.value
    }
  }

  // 批量操作
  const batchSetData = (dataMap: Map<string, any>) => {
    const now = new Date()
    dataMap.forEach((data, api) => {
      apiCache.value.set(api, data)
      lastFetchTime.value.set(api, now)
      clearError(api)
    })
  }

  const batchClearCache = (apis: string[]) => {
    apis.forEach(api => {
      clearCache(api)
    })
  }

  // 调试方法
  const debugInfo = computed(() => {
    return {
      cache: Object.fromEntries(apiCache.value),
      errors: Object.fromEntries(apiErrors.value),
      loading: Object.fromEntries(apiLoading.value),
      lastFetch: Object.fromEntries(
        Array.from(lastFetchTime.value.entries()).map(([api, time]) => [
          api,
          time.toISOString()
        ])
      ),
      intervals: Object.fromEntries(refreshIntervals.value)
    }
  })

  return {
    // 状态
    apiCache,
    apiErrors,
    apiLoading,
    lastFetchTime,
    refreshIntervals,
    globalRefreshInterval,
    isAutoRefreshEnabled,
    
    // 计算属性
    loadingApis,
    errorApis,
    cacheSize,
    debugInfo,
    
    // 方法
    setLoading,
    setError,
    clearError,
    setData,
    getData,
    hasData,
    isLoading,
    getError,
    getLastFetchTime,
    isDataStale,
    shouldRefresh,
    setRefreshInterval,
    removeRefreshInterval,
    clearCache,
    clearAllLoading,
    clearAllErrors,
    getStats,
    batchSetData,
    batchClearCache
  }
})
