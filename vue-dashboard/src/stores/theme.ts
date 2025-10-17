import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { ThemeType } from '@/types'

interface ThemeConfig {
  name: string
  displayName: string
  colors: {
    primary: string
    success: string
    warning: string
    danger: string
    background: string
    surface: string
    text: string
    textSecondary: string
  }
  cssClass: string
}

const themes: Record<ThemeType, ThemeConfig> = {
  light: {
    name: 'light',
    displayName: '浅色主题',
    colors: {
      primary: '#0066CC',
      success: '#3E8635',
      warning: '#F0AB00',
      danger: '#C9190B',
      background: '#f8fafc',
      surface: '#ffffff',
      text: '#1e293b',
      textSecondary: '#64748b'
    },
    cssClass: 'theme-light'
  },
  dark: {
    name: 'dark',
    displayName: '深色主题',
    colors: {
      primary: '#3b82f6',
      success: '#10b981',
      warning: '#f59e0b',
      danger: '#ef4444',
      background: '#0f172a',
      surface: '#1e293b',
      text: '#f1f5f9',
      textSecondary: '#94a3b8'
    },
    cssClass: 'theme-dark'
  },
  tech: {
    name: 'tech',
    displayName: '科技蓝',
    colors: {
      primary: '#00d4ff',
      success: '#00ff88',
      warning: '#ffaa00',
      danger: '#ff4757',
      background: '#0a0e1a',
      surface: '#1a1f2e',
      text: '#ffffff',
      textSecondary: '#8892b0'
    },
    cssClass: 'theme-tech'
  }
}

export const useThemeStore = defineStore('theme', () => {
  // 状态
  const currentTheme = ref<ThemeType>('dark')
  const isSystemTheme = ref(false)
  const customColors = ref<Partial<ThemeConfig['colors']>>({})

  // 计算属性
  const themeConfig = computed(() => {
    const base = themes[currentTheme.value]
    return {
      ...base,
      colors: {
        ...base.colors,
        ...customColors.value
      }
    }
  })

  const availableThemes = computed(() => {
    return Object.values(themes).map(theme => ({
      value: theme.name as ThemeType,
      label: theme.displayName,
      colors: theme.colors
    }))
  })

  const isDarkMode = computed(() => {
    return currentTheme.value === 'dark' || currentTheme.value === 'tech'
  })

  const cssVariables = computed(() => {
    const colors = themeConfig.value.colors
    return {
      '--color-primary': colors.primary,
      '--color-success': colors.success,
      '--color-warning': colors.warning,
      '--color-danger': colors.danger,
      '--color-background': colors.background,
      '--color-surface': colors.surface,
      '--color-text': colors.text,
      '--color-text-secondary': colors.textSecondary
    }
  })

  // 方法
  const setTheme = (theme: ThemeType) => {
    currentTheme.value = theme
    applyTheme()
    saveToLocalStorage()
  }

  const toggleTheme = () => {
    const themes: ThemeType[] = ['light', 'dark', 'tech']
    const currentIndex = themes.indexOf(currentTheme.value)
    const nextIndex = (currentIndex + 1) % themes.length
    setTheme(themes[nextIndex])
  }

  const setCustomColor = (colorKey: keyof ThemeConfig['colors'], color: string) => {
    customColors.value[colorKey] = color
    applyTheme()
    saveToLocalStorage()
  }

  const resetCustomColors = () => {
    customColors.value = {}
    applyTheme()
    saveToLocalStorage()
  }

  const applyTheme = () => {
    const root = document.documentElement
    const config = themeConfig.value
    
    // 移除所有主题类
    Object.values(themes).forEach(theme => {
      root.classList.remove(theme.cssClass)
    })
    
    // 添加当前主题类
    root.classList.add(config.cssClass)
    
    // 设置 CSS 变量
    Object.entries(cssVariables.value).forEach(([key, value]) => {
      root.style.setProperty(key, value)
    })
    
    // 设置 meta theme-color
    const metaThemeColor = document.querySelector('meta[name="theme-color"]')
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', config.colors.primary)
    }
  }

  const detectSystemTheme = (): ThemeType => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return 'light'
  }

  const enableSystemTheme = () => {
    isSystemTheme.value = true
    setTheme(detectSystemTheme())
    
    // 监听系统主题变化
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handleChange = (e: MediaQueryListEvent) => {
        if (isSystemTheme.value) {
          setTheme(e.matches ? 'dark' : 'light')
        }
      }
      mediaQuery.addEventListener('change', handleChange)
    }
  }

  const disableSystemTheme = () => {
    isSystemTheme.value = false
  }

  const saveToLocalStorage = () => {
    try {
      const themeData = {
        currentTheme: currentTheme.value,
        isSystemTheme: isSystemTheme.value,
        customColors: customColors.value
      }
      localStorage.setItem('dashboard-theme', JSON.stringify(themeData))
    } catch (error) {
      console.error('Failed to save theme to localStorage:', error)
    }
  }

  const loadFromLocalStorage = () => {
    try {
      const saved = localStorage.getItem('dashboard-theme')
      if (saved) {
        const themeData = JSON.parse(saved)
        currentTheme.value = themeData.currentTheme || 'dark'
        isSystemTheme.value = themeData.isSystemTheme || false
        customColors.value = themeData.customColors || {}
        
        if (isSystemTheme.value) {
          enableSystemTheme()
        } else {
          applyTheme()
        }
      } else {
        // 首次访问，使用系统主题
        enableSystemTheme()
      }
    } catch (error) {
      console.error('Failed to load theme from localStorage:', error)
      setTheme('dark') // 默认主题
    }
  }

  // 监听主题变化
  watch(currentTheme, () => {
    applyTheme()
  }, { immediate: true })

  return {
    // 状态
    currentTheme,
    isSystemTheme,
    customColors,
    
    // 计算属性
    themeConfig,
    availableThemes,
    isDarkMode,
    cssVariables,
    
    // 方法
    setTheme,
    toggleTheme,
    setCustomColor,
    resetCustomColors,
    applyTheme,
    detectSystemTheme,
    enableSystemTheme,
    disableSystemTheme,
    saveToLocalStorage,
    loadFromLocalStorage
  }
})
