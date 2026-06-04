<template>
  <div class="login-container">
    <!-- 登录卡片 -->
    <div class="login-card">
      <!-- Logo和标题 -->
      <div class="login-header">
        <div class="logo">
          <svg class="logo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <circle cx="9" cy="9" r="2"/>
            <path d="M21 15.5c-.3-2.5-2.8-4.5-5.5-4.5s-5.2 2-5.5 4.5"/>
          </svg>
        </div>
        <h1 class="login-title">刀具柜看板</h1>
        <p class="login-subtitle">刀具库存与货道状态管理</p>
      </div>

      <!-- 登录表单 -->
      <form @submit.prevent="handleLogin" class="login-form">
        <!-- 手机号输入 -->
        <div class="form-group">
          <input
            id="mobile"
            v-model="loginForm.mobile"
            type="tel"
            class="form-input"
            placeholder="手机号"
            :disabled="loading"
            required
          />
        </div>

        <!-- 密码输入 -->
        <div class="form-group">
          <div class="input-wrapper">
            <input
              id="password"
              v-model="loginForm.password"
              :type="showPassword ? 'text' : 'password'"
              class="form-input"
              placeholder="密码"
              :disabled="loading"
              required
            />
            <button
              type="button"
              @click="togglePassword"
              class="password-toggle"
              :disabled="loading"
            >
              <svg v-if="showPassword" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
              <svg v-else class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- 授权码输入 -->
        <div class="form-group">
          <input
            id="tokenCode"
            v-model="loginForm.tokenCode"
            type="text"
            class="form-input"
            placeholder="授权码"
            :disabled="loading"
            required
          />
        </div>

        <!-- 错误提示 -->
        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>

        <!-- 登录按钮 -->
        <button
          type="submit"
          class="login-button"
          :disabled="loading || !isFormValid"
        >
          <div v-if="loading" class="loading-spinner"></div>
          <span v-if="!loading">登录</span>
          <span v-else>登录中...</span>
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { authApi } from '@/services/authApi'
import { useAuthStore } from '@/stores/auth'
import { startDefaultPollingTasks } from '@/services/polling'

// Router and Store
const router = useRouter()
const authStore = useAuthStore()

// 响应式数据
const loading = ref(false)
const showPassword = ref(false)
const errorMessage = ref('')

// 登录表单数据
const loginForm = ref({
  mobile: '',
  password: '',
  tokenCode: 'fhgdfhdsgsgfs3333' // 默认授权码
})

// API基础地址
const apiBaseUrl = computed(() => 
  import.meta.env.VITE_API_BASE_URL || 'https://apict.jijiayun.com'
)

// 表单验证
const isFormValid = computed(() => {
  return loginForm.value.mobile.trim() !== '' &&
         loginForm.value.password.trim() !== '' &&
         loginForm.value.tokenCode.trim() !== ''
})

// 切换密码显示
const togglePassword = () => {
  showPassword.value = !showPassword.value
}

// 处理登录
const handleLogin = async () => {
  if (!isFormValid.value || loading.value) return

  loading.value = true
  errorMessage.value = ''

  try {
    const response = await authApi.login(
      loginForm.value.mobile,
      loginForm.value.password,
      loginForm.value.tokenCode
    )

    const responseData = response.data || {}
    const authToken = responseData.token || responseData.user?.token
    const apiBaseUrl = responseData.ct_url || responseData.serverUrl || responseData.user?.ct_url || responseData.user?.serverUrl
    const userInfo = {
      ...(responseData.user || responseData),
      ...(apiBaseUrl ? { ct_url: apiBaseUrl } : {})
    }

    if (response.code === 'OK' && authToken) {
      // 使用认证store保存登录状态
      authStore.login(authToken, userInfo)

      // 登录成功后再启动刀具柜轮询，避免卡片保留登录前的未授权错误
      startDefaultPollingTasks()

      // 跳转到主页面
      router.push('/dashboard')
    } else {
      errorMessage.value = response.message || '登录失败，请检查账号密码'
    }
  } catch (error: any) {
    console.error('Login error:', error)
    errorMessage.value = error.message || '网络错误，请稍后重试'
  } finally {
    loading.value = false
  }
}

// 组件挂载时检查是否已登录
onMounted(async () => {
  if (await authStore.restoreFromStorage()) {
    router.push('/dashboard')
  }
})
</script>

<style scoped>
.login-container {
  @apply min-h-screen flex items-center justify-center p-6;
  background: #f5f5f7;
}

.login-card {
  @apply w-full max-w-sm;
  background: white;
  border-radius: 20px;
  padding: 3rem 2rem 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.login-header {
  @apply text-center mb-10;
}

.logo {
  @apply inline-flex items-center justify-center w-14 h-14 mb-6;
  background: #007AFF;
  border-radius: 14px;
}

.logo-icon {
  @apply w-7 h-7 text-white;
  stroke-width: 1.5;
}

.login-title {
  @apply text-3xl font-semibold text-gray-900 mb-2;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.login-subtitle {
  @apply text-gray-500 text-sm;
}

.login-form {
  @apply space-y-4;
}

.form-group {
  @apply relative;
}

.input-wrapper {
  @apply relative;
}

.form-input {
  @apply w-full px-4 py-4 border border-gray-200 rounded-xl;
  @apply focus:ring-2 focus:ring-blue-500 focus:border-blue-500;
  @apply transition-all duration-200;
  @apply disabled:bg-gray-50 disabled:text-gray-500;
  background: #f9f9f9;
  font-size: 16px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.form-input:focus {
  background: white;
  outline: none;
}

.form-input::placeholder {
  color: #8e8e93;
}

.password-toggle {
  @apply absolute right-4 top-1/2 transform -translate-y-1/2;
  @apply text-gray-400 hover:text-gray-600 transition-colors;
  @apply disabled:opacity-50;
}

.error-message {
  @apply text-red-500 text-sm text-center;
  @apply bg-red-50 border border-red-200 rounded-lg p-3 mb-4;
}

.login-button {
  @apply w-full flex items-center justify-center space-x-2;
  @apply bg-blue-500 text-white font-medium py-4 px-4 rounded-xl;
  @apply hover:bg-blue-600 active:bg-blue-700;
  @apply focus:ring-2 focus:ring-blue-500 focus:ring-offset-2;
  @apply disabled:opacity-50 disabled:cursor-not-allowed;
  @apply transition-all duration-150;
  @apply transform active:scale-[0.98];
  font-size: 16px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  margin-top: 1.5rem;
}

.loading-spinner {
  @apply w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin;
}

/* 响应式设计 */
@media (max-width: 640px) {
  .login-container {
    @apply p-4;
  }

  .login-card {
    padding: 2rem 1.5rem 1.5rem;
  }

  .login-title {
    @apply text-2xl;
  }
}

/* 深色模式支持 - 使用主题系统 */
.theme-dark .login-container,
.theme-tech .login-container {
  background: var(--color-background);
}

.theme-dark .login-card,
.theme-tech .login-card {
  background: var(--color-surface);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.theme-dark .login-title,
.theme-tech .login-title {
  color: var(--color-text);
}

.theme-dark .login-subtitle,
.theme-tech .login-subtitle {
  color: var(--color-text-secondary);
}

.theme-dark .form-input,
.theme-tech .form-input {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
  color: var(--color-text);
}

.theme-dark .form-input:focus,
.theme-tech .form-input:focus {
  background: rgba(255, 255, 255, 0.15);
  border-color: var(--color-primary);
}

.theme-dark .form-input::placeholder,
.theme-tech .form-input::placeholder {
  color: var(--color-text-secondary);
}
</style>
