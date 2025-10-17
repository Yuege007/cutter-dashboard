<template>
  <div class="cache-debug-view">
    <div class="debug-header">
      <h1 class="debug-title">🔍 缓存系统调试</h1>
      <p class="debug-subtitle">实时监控和调试缓存系统性能</p>
    </div>
    
    <!-- 快速操作区 -->
    <div class="quick-actions">
      <div class="action-group">
        <h3>快速操作</h3>
        <div class="action-buttons">
          <button @click="testCachePerformance" class="btn btn-primary">
            🏃‍♂️ 性能测试
          </button>
          <button @click="warmupCache" class="btn btn-success">
            🔥 预热缓存
          </button>
          <button @click="clearAllCache" class="btn btn-warning">
            🧹 清理缓存
          </button>
          <button @click="exportCacheData" class="btn btn-info">
            📊 导出数据
          </button>
        </div>
      </div>
      
      <div class="action-group">
        <h3>系统诊断</h3>
        <div class="action-buttons">
          <button @click="runDiagnosis" class="btn btn-secondary">
            🔍 系统诊断
          </button>
          <button @click="checkHealth" class="btn btn-secondary">
            ❤️ 健康检查
          </button>
        </div>
      </div>
    </div>
    
    <!-- 缓存调试面板 -->
    <CacheDebugPanel />
    
    <!-- 操作结果显示 -->
    <div v-if="operationResult" class="operation-result">
      <div class="result-header">
        <h3>操作结果</h3>
        <button @click="operationResult = null" class="close-btn">×</button>
      </div>
      <pre class="result-content">{{ operationResult }}</pre>
    </div>
    
    <!-- 使用说明 -->
    <div class="usage-guide">
      <h3>🔧 开发者工具使用说明</h3>
      <div class="guide-content">
        <div class="guide-section">
          <h4>浏览器控制台命令</h4>
          <div class="code-examples">
            <div class="code-example">
              <code>window.__cacheSystem.stats()</code>
              <span class="code-desc">获取缓存统计信息</span>
            </div>
            <div class="code-example">
              <code>window.__cacheSystem.clear()</code>
              <span class="code-desc">清理所有缓存</span>
            </div>
            <div class="code-example">
              <code>window.__cacheSystem.get('key')</code>
              <span class="code-desc">获取指定缓存项</span>
            </div>
            <div class="code-example">
              <code>window.__cacheSystem.benchmark(1000)</code>
              <span class="code-desc">运行性能基准测试</span>
            </div>
            <div class="code-example">
              <code>window.__cacheSystem.invalidate(/pattern/)</code>
              <span class="code-desc">按模式清理缓存</span>
            </div>
          </div>
        </div>
        
        <div class="guide-section">
          <h4>缓存键命名规范</h4>
          <div class="naming-rules">
            <div class="rule">
              <strong>API缓存:</strong> <code>api:endpoint:params</code>
            </div>
            <div class="rule">
              <strong>用户配置:</strong> <code>user:userId:config:type</code>
            </div>
            <div class="rule">
              <strong>应用状态:</strong> <code>app:state:identifier</code>
            </div>
            <div class="rule">
              <strong>数据缓存:</strong> <code>data:type:identifier:version</code>
            </div>
          </div>
        </div>
        
        <div class="guide-section">
          <h4>性能优化建议</h4>
          <ul class="optimization-tips">
            <li>🎯 <strong>命中率 > 70%</strong> - 缓存策略良好</li>
            <li>⚡ <strong>响应时间 < 10ms</strong> - 性能优秀</li>
            <li>💾 <strong>内存使用 < 50MB</strong> - 内存控制良好</li>
            <li>🔄 <strong>淘汰率 < 10%</strong> - 容量配置合理</li>
            <li>📊 <strong>定期清理过期数据</strong> - 保持系统健康</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import CacheDebugPanel from '@/components/debug/CacheDebugPanel.vue'
import { getCacheManager } from '@/services/cache'
import { diagnoseCacheSystem, getCacheSystemHealth } from '@/services/cache/init'
import cachedApi from '@/services/cachedApi'

// 响应式数据
const operationResult = ref<string | null>(null)

// 方法
const testCachePerformance = async () => {
  try {
    operationResult.value = '🏃‍♂️ 正在运行性能测试...'
    
    const cacheSystem = (window as any).__cacheSystem
    if (cacheSystem && cacheSystem.benchmark) {
      const result = await cacheSystem.benchmark(1000)
      operationResult.value = `性能测试完成！\n\n${JSON.stringify(result, null, 2)}`
    } else {
      operationResult.value = '❌ 缓存系统未初始化或不支持性能测试'
    }
  } catch (error) {
    operationResult.value = `❌ 性能测试失败: ${error.message}`
  }
}

const warmupCache = async () => {
  try {
    operationResult.value = '🔥 正在预热缓存...'
    
    await cachedApi.cache.warmupCommonData()
    operationResult.value = '✅ 缓存预热完成！常用数据已加载到缓存中。'
  } catch (error) {
    operationResult.value = `❌ 缓存预热失败: ${error.message}`
  }
}

const clearAllCache = async () => {
  try {
    if (!confirm('确定要清理所有缓存吗？这将影响应用性能。')) {
      return
    }
    
    operationResult.value = '🧹 正在清理缓存...'
    
    const cacheManager = getCacheManager()
    await cacheManager.clear()
    
    operationResult.value = '✅ 所有缓存已清理完成！'
  } catch (error) {
    operationResult.value = `❌ 缓存清理失败: ${error.message}`
  }
}

const exportCacheData = async () => {
  try {
    operationResult.value = '📊 正在导出缓存数据...'
    
    const cacheSystem = (window as any).__cacheSystem
    if (cacheSystem && cacheSystem.export) {
      const data = await cacheSystem.export()
      
      // 创建下载链接
      const blob = new Blob([data], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `cache-export-${new Date().toISOString().slice(0, 19)}.json`
      a.click()
      URL.revokeObjectURL(url)
      
      operationResult.value = '✅ 缓存数据导出完成！文件已下载。'
    } else {
      operationResult.value = '❌ 缓存系统未初始化或不支持数据导出'
    }
  } catch (error) {
    operationResult.value = `❌ 数据导出失败: ${error.message}`
  }
}

const runDiagnosis = async () => {
  try {
    operationResult.value = '🔍 正在运行系统诊断...'
    
    const diagnosis = await diagnoseCacheSystem()
    operationResult.value = `系统诊断完成！\n\n${JSON.stringify(diagnosis, null, 2)}`
  } catch (error) {
    operationResult.value = `❌ 系统诊断失败: ${error.message}`
  }
}

const checkHealth = async () => {
  try {
    operationResult.value = '❤️ 正在检查系统健康状态...'
    
    const health = await getCacheSystemHealth()
    
    let healthReport = `系统健康状态: ${health.overall.toUpperCase()}\n\n`
    
    if (health.issues.length > 0) {
      healthReport += `发现的问题:\n${health.issues.map(issue => `• ${issue}`).join('\n')}\n\n`
    }
    
    if (health.recommendations.length > 0) {
      healthReport += `优化建议:\n${health.recommendations.map(rec => `• ${rec}`).join('\n')}\n\n`
    }
    
    healthReport += `详细统计:\n${JSON.stringify(health.stats, null, 2)}`
    
    operationResult.value = healthReport
  } catch (error) {
    operationResult.value = `❌ 健康检查失败: ${error.message}`
  }
}
</script>

<style scoped>
.cache-debug-view {
  @apply p-6 max-w-7xl mx-auto space-y-8;
}

.debug-header {
  @apply text-center mb-8;
}

.debug-title {
  @apply text-3xl font-bold text-gray-800 dark:text-gray-200 mb-2;
}

.debug-subtitle {
  @apply text-lg text-gray-600 dark:text-gray-400;
}

.quick-actions {
  @apply grid grid-cols-1 md:grid-cols-2 gap-6 mb-8;
}

.action-group h3 {
  @apply text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3;
}

.action-buttons {
  @apply flex flex-wrap gap-2;
}

.btn {
  @apply px-4 py-2 rounded-lg font-medium transition-colors text-sm;
}

.btn-primary { @apply bg-blue-500 text-white hover:bg-blue-600; }
.btn-success { @apply bg-green-500 text-white hover:bg-green-600; }
.btn-warning { @apply bg-yellow-500 text-white hover:bg-yellow-600; }
.btn-info { @apply bg-cyan-500 text-white hover:bg-cyan-600; }
.btn-secondary { @apply bg-gray-500 text-white hover:bg-gray-600; }

.operation-result {
  @apply bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-8;
}

.result-header {
  @apply flex justify-between items-center mb-3;
}

.result-header h3 {
  @apply text-lg font-semibold text-gray-800 dark:text-gray-200;
}

.close-btn {
  @apply text-gray-500 hover:text-gray-700 text-xl font-bold;
}

.result-content {
  @apply bg-white dark:bg-gray-900 p-4 rounded border text-sm font-mono overflow-auto custom-scrollbar max-h-96;
}

.usage-guide {
  @apply bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg;
}

.usage-guide h3 {
  @apply text-xl font-bold text-gray-800 dark:text-gray-200 mb-4;
}

.guide-content {
  @apply space-y-6;
}

.guide-section h4 {
  @apply text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3;
}

.code-examples {
  @apply space-y-2;
}

.code-example {
  @apply flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded;
}

.code-example code {
  @apply font-mono text-sm text-blue-600 dark:text-blue-400;
}

.code-desc {
  @apply text-sm text-gray-600 dark:text-gray-400;
}

.naming-rules {
  @apply space-y-2;
}

.rule {
  @apply p-3 bg-gray-50 dark:bg-gray-700 rounded;
}

.rule code {
  @apply font-mono text-sm text-green-600 dark:text-green-400;
}

.optimization-tips {
  @apply space-y-2 list-none;
}

.optimization-tips li {
  @apply p-2 bg-gray-50 dark:bg-gray-700 rounded;
}
</style>
