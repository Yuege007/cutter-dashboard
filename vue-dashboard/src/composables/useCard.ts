import { ref, reactive, toRefs, computed, watch, type Ref } from 'vue'
import type { CardState, CardMode, DataFetcher } from '@/types/card'
import { detectCardMode } from '@/utils/cardSizeManager'

/**
 * 卡片基础状态管理Hook
 */
export function useCardState() {
  const state = reactive<CardState>({
    loading: false,
    error: '',
    data: null,
    lastUpdated: undefined,
    retryCount: 0
  })

  const setLoading = (loading: boolean) => {
    state.loading = loading
  }

  const setError = (error: string | Error) => {
    state.error = typeof error === 'string' ? error : error.message
    console.error('Card error:', error)
  }

  const clearError = () => {
    state.error = ''
  }

  const setData = (data: any) => {
    state.data = data
    state.lastUpdated = new Date()
    clearError()
  }

  const incrementRetry = () => {
    state.retryCount++
  }

  const resetRetry = () => {
    state.retryCount = 0
  }

  return {
    ...toRefs(state),
    setLoading,
    setError,
    clearError,
    setData,
    incrementRetry,
    resetRetry
  }
}

/**
 * 卡片模式检测Hook
 */
export function useCardMode(width: Ref<number>, height: Ref<number>) {
  const mode = computed<CardMode>(() => detectCardMode(width.value, height.value))
  
  const isMini = computed(() => mode.value === 'mini')
  const isCompact = computed(() => mode.value === 'compact')
  const isFull = computed(() => mode.value === 'full')

  return {
    mode,
    isMini,
    isCompact,
    isFull
  }
}

/**
 * 卡片数据获取Hook
 */
export function useCardData<T = any>(fetcher: DataFetcher<T>, options?: {
  immediate?: boolean
  retryCount?: number
  onError?: (error: Error) => void
}) {
  const { immediate = true, retryCount = 3, onError } = options || {}
  
  const {
    loading,
    error,
    data,
    setLoading,
    setError,
    setData,
    incrementRetry,
    resetRetry
  } = useCardState()

  const fetchData = async (): Promise<T | null> => {
    setLoading(true)
    
    try {
      const result = await fetcher()
      setData(result)
      resetRetry()
      return result
    } catch (err: any) {
      const errorMessage = err.message || '数据获取失败'
      setError(errorMessage)
      incrementRetry()
      
      if (onError) {
        onError(err)
      }
      
      return null
    } finally {
      setLoading(false)
    }
  }

  const refresh = async (): Promise<T | null> => {
    return fetchData()
  }

  const retry = async (): Promise<T | null> => {
    if (retryCount && retryCount > 0) {
      return fetchData()
    }
    return null
  }

  // 立即执行
  if (immediate) {
    fetchData()
  }

  return {
    loading,
    error,
    data: data as Ref<T | null>,
    fetchData,
    refresh,
    retry
  }
}

/**
 * 完整的卡片Hook（组合所有功能）
 */
export function useCard<T = any>(
  width: Ref<number>,
  height: Ref<number>,
  fetcher?: DataFetcher<T>,
  options?: {
    immediate?: boolean
    retryCount?: number
    onError?: (error: Error) => void
    onModeChange?: (mode: CardMode) => void
  }
) {
  // 模式检测
  const { mode, isMini, isCompact, isFull } = useCardMode(width, height)
  
  // 数据管理
  const dataHook = fetcher 
    ? useCardData(fetcher, options)
    : useCardState()

  // 监听模式变化
  if (options?.onModeChange) {
    watch(mode, (newMode) => {
      options.onModeChange!(newMode)
    })
  }

  return {
    // 模式相关
    mode,
    isMini,
    isCompact,
    isFull,
    
    // 数据相关
    ...dataHook
  }
}
