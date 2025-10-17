<template>
  <div class="toolbar">
    <!-- 左侧：侧边栏切换 + 标题和面包屑 -->
    <div class="toolbar-left">
      <!-- 侧边栏切换按钮 -->
      <button
        @click="toggleSidebar"
        class="sidebar-toggle-btn"
        :title="sidebarVisible ? '隐藏侧边栏' : '显示侧边栏'"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <div class="toolbar-title">
        <h1 class="title-text">{{ title }}</h1>
        <div v-if="breadcrumbs && breadcrumbs.length > 0" class="breadcrumbs">
          <span
            v-for="(item, index) in breadcrumbs"
            :key="index"
            class="breadcrumb-item"
            :class="{ 'breadcrumb-active': index === breadcrumbs.length - 1 }"
          >
            {{ item }}
            <svg v-if="index < breadcrumbs.length - 1" class="breadcrumb-separator w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
            </svg>
          </span>
        </div>
      </div>
    </div>

    <!-- 中间：搜索和快捷操作 -->
    <div class="toolbar-center">
      <div v-if="showSearch" class="toolbar-search">
        <div class="search-wrapper">
          <svg class="search-icon w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜索看板..."
            class="search-input"
            @input="onSearch"
          />
        </div>
      </div>
    </div>

    <!-- 右侧：操作按钮 -->
    <div class="toolbar-right">


      <!-- 布局控制 -->
      <div class="layout-controls">
        <button
          @click="toggleSidebar"
          class="toolbar-btn"
          :title="sidebarVisible ? '隐藏侧边栏' : '显示侧边栏'"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <button
          @click="toggleFullscreen"
          class="toolbar-btn"
          title="全屏"
        >
          <svg v-if="!isFullscreen" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
          <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- 主题切换 -->
      <div class="theme-controls">
        <button
          @click="toggleTheme"
          class="toolbar-btn"
          :title="`当前主题: ${currentTheme}`"
        >
          <svg v-if="currentTheme === 'light'" class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clip-rule="evenodd" />
          </svg>
          <svg v-else-if="currentTheme === 'dark'" class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
          </svg>
          <svg v-else class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>

      <!-- 用户菜单 -->
      <div class="user-menu">
        <div class="dropdown" ref="userDropdownRef">
          <button
            @click="toggleUserDropdown"
            class="user-btn"
            title="用户菜单"
          >
            <div class="user-avatar">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
              </svg>
            </div>
            <span class="user-name">{{ userDisplayName }}</span>
            <svg class="user-chevron w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          </button>

          <div v-if="userDropdownVisible" class="dropdown-menu user-dropdown-menu">
            <div class="user-info">
              <div class="user-info-name">{{ userDisplayName }}</div>
              <div class="user-info-company">{{ userCompany }}</div>
            </div>

            <div class="dropdown-divider"></div>

            <button @click="logout" class="dropdown-item dropdown-item-danger">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              退出登录
            </button>
          </div>
        </div>
      </div>

      <!-- 更多操作 -->
      <div class="more-actions">
        <div class="dropdown" ref="dropdownRef">
          <button
            @click="toggleDropdown"
            class="toolbar-btn dropdown-trigger"
            title="更多操作"
          >
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>

          <div v-if="dropdownVisible" class="dropdown-menu">
            <button @click="saveLayout" class="dropdown-item">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              保存布局
            </button>
            
            <button @click="loadLayout" class="dropdown-item">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
              加载布局
            </button>

            <button @click="exportDashboard" class="dropdown-item">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              导出看板
            </button>

            <button @click="importDashboard" class="dropdown-item">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              导入看板
            </button>

            <div class="dropdown-divider"></div>

            <button @click="clearAll" class="dropdown-item dropdown-item-danger">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              清空看板
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useThemeStore } from '@/stores/theme'
import { useAuthStore } from '@/stores/auth'

export interface ToolbarProps {
  title?: string
  breadcrumbs?: string[]
  showSearch?: boolean
  sidebarVisible?: boolean
}

const props = withDefaults(defineProps<ToolbarProps>(), {
  title: 'Vue 数字看板',
  showSearch: true,
  sidebarVisible: true
})

const emit = defineEmits<{
  search: [query: string]
  sidebarToggle: []
  fullscreenToggle: []
  saveLayout: []
  loadLayout: []
  exportDashboard: []
  importDashboard: []
  clearAll: []
  logout: []
}>()

// Router and Stores
const router = useRouter()
const authStore = useAuthStore()

const themeStore = useThemeStore()
const searchQuery = ref('')
const isFullscreen = ref(false)
const dropdownVisible = ref(false)
const dropdownRef = ref<HTMLElement>()
const userDropdownVisible = ref(false)
const userDropdownRef = ref<HTMLElement>()

const currentTheme = computed(() => themeStore.currentTheme)

// 用户相关计算属性
const userDisplayName = computed(() => authStore.getUserDisplayName)
const userCompany = computed(() => authStore.getUserCompany)

// 方法
const onSearch = () => {
  emit('search', searchQuery.value)
}

const toggleSidebar = () => {
  emit('sidebarToggle')
}

const toggleTheme = () => {
  themeStore.toggleTheme()
}

const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen()
    isFullscreen.value = true
  } else {
    document.exitFullscreen()
    isFullscreen.value = false
  }
  emit('fullscreenToggle')
}

const toggleDropdown = () => {
  dropdownVisible.value = !dropdownVisible.value
  // 关闭用户下拉菜单
  userDropdownVisible.value = false
}

const toggleUserDropdown = () => {
  userDropdownVisible.value = !userDropdownVisible.value
  // 关闭其他下拉菜单
  dropdownVisible.value = false
}

const logout = async () => {
  try {
    // 显示加载状态（可选）
    console.log('🔄 正在退出登录...')

    // 执行异步登出操作
    await authStore.logout()

    // 跳转到登录页
    router.push('/login')

    // 发出登出事件
    emit('logout')

    console.log('✅ 退出登录成功')
  } catch (error) {
    console.error('❌ 退出登录失败:', error)
    // 即使失败也要跳转到登录页
    router.push('/login')
    emit('logout')
  }
}

const saveLayout = () => {
  dropdownVisible.value = false
  emit('saveLayout')
}

const loadLayout = () => {
  dropdownVisible.value = false
  emit('loadLayout')
}

const exportDashboard = () => {
  dropdownVisible.value = false
  emit('exportDashboard')
}

const importDashboard = () => {
  dropdownVisible.value = false
  emit('importDashboard')
}

const clearAll = () => {
  dropdownVisible.value = false
  if (confirm('确定要清空所有卡片吗？此操作不可撤销。')) {
    emit('clearAll')
  }
}

// 点击外部关闭下拉菜单
const handleClickOutside = (event: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    dropdownVisible.value = false
  }
  if (userDropdownRef.value && !userDropdownRef.value.contains(event.target as Node)) {
    userDropdownVisible.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  
  // 监听全屏状态变化
  document.addEventListener('fullscreenchange', () => {
    isFullscreen.value = !!document.fullscreenElement
  })
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.toolbar {
  @apply flex items-center justify-between px-6 py-4 border-b;
  background-color: var(--color-surface);
  border-color: var(--color-surface);
  height: 64px;
}

.toolbar-left {
  @apply flex items-center space-x-4;
}

.sidebar-toggle-btn {
  @apply p-2 rounded-lg;
  color: var(--color-text-secondary);
  transition:
    transform 150ms cubic-bezier(0.4, 0.0, 0.2, 1),
    background-color 200ms ease,
    color 200ms ease;
}

.sidebar-toggle-btn:hover {
  background-color: var(--color-primary);
  color: white;
  transform: scale(1.05);
}

.sidebar-toggle-btn:active {
  transform: scale(0.95);
}

.toolbar-title {
  @apply flex flex-col;
}

.title-text {
  @apply text-xl font-semibold;
  color: var(--color-text);
}

.breadcrumbs {
  @apply flex items-center space-x-1 mt-1;
}

.breadcrumb-item {
  @apply flex items-center text-sm;
  color: var(--color-text-secondary);
}

.breadcrumb-active {
  color: var(--color-text);
  font-weight: 500;
}

.breadcrumb-separator {
  @apply mx-1;
}

.toolbar-center {
  @apply flex-1 flex justify-center max-w-md mx-8;
}

.toolbar-search {
  @apply w-full;
}

.search-wrapper {
  @apply relative;
}

.search-icon {
  @apply absolute left-3 top-1/2 transform -translate-y-1/2;
  color: var(--color-text-secondary);
}

.search-input {
  @apply w-full pl-10 pr-4 py-2 rounded-lg border;
  background-color: var(--color-background);
  border-color: var(--color-surface);
  color: var(--color-text);
}

.search-input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.toolbar-right {
  @apply flex items-center space-x-4;
}



.layout-controls,
.theme-controls,
.more-actions {
  @apply flex items-center space-x-2;
}

.toolbar-btn {
  @apply p-2 rounded-lg transition-colors;
  color: var(--color-text-secondary);
}

.toolbar-btn:hover {
  background-color: var(--color-primary);
  color: white;
}

.dropdown {
  @apply relative;
}

.dropdown-menu {
  @apply absolute right-0 top-full mt-2 w-48 py-2 rounded-lg shadow-lg border z-50;
  background-color: var(--color-surface);
  border-color: var(--color-surface);
}

.dropdown-item {
  @apply flex items-center space-x-3 w-full px-4 py-2 text-sm text-left transition-colors;
  color: var(--color-text);
}

.dropdown-item:hover {
  background-color: var(--color-background);
}

.dropdown-item-danger {
  color: var(--color-danger);
}

.dropdown-item-danger:hover {
  background-color: var(--color-danger);
  color: white;
}

.dropdown-divider {
  @apply my-2 border-t;
  border-color: var(--color-surface);
}

/* 用户菜单样式 */
.user-menu {
  @apply relative;
}

.user-btn {
  @apply flex items-center space-x-2 px-3 py-2 rounded-lg;
  @apply hover:bg-gray-100 dark:hover:bg-gray-700;
  @apply transition-colors duration-200;
  color: var(--color-text);
}

.user-avatar {
  @apply w-8 h-8 rounded-full bg-blue-500 text-white;
  @apply flex items-center justify-center;
}

.user-name {
  @apply text-sm font-medium max-w-24 truncate;
}

.user-chevron {
  @apply transition-transform duration-200;
}

.user-btn:hover .user-chevron {
  @apply transform rotate-180;
}

.user-dropdown-menu {
  @apply right-0 min-w-48;
}

.user-info {
  @apply px-4 py-3 border-b border-gray-200 dark:border-gray-600;
}

.user-info-name {
  @apply font-medium text-sm;
  color: var(--color-text);
}

.user-info-company {
  @apply text-xs mt-1;
  color: var(--color-text-secondary);
}
</style>
