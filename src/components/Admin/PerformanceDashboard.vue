<template>
  <div class="performance-dashboard p-6">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-2xl font-bold flex items-center">
        <i class="fas fa-tachometer-alt mr-3 text-primary"></i>
        Performance Dashboard
      </h2>
      <div class="flex gap-2">
        <button 
          class="btn btn-sm btn-outline"
          @click="toggleAutoRefresh"
          :class="{ 'btn-active': autoRefresh }"
        >
          <i class="fas fa-sync-alt mr-2" :class="{ 'animate-spin': autoRefresh }"></i>
          Auto-refresh
        </button>
        <button 
          class="btn btn-sm btn-primary"
          @click="refreshMetrics"
          :disabled="loading"
        >
          <i class="fas fa-refresh mr-2"></i>
          Refresh
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading && !metrics" class="flex justify-center items-center py-12">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="alert alert-error mb-6">
      <i class="fas fa-exclamation-triangle"></i>
      <span>{{ error }}</span>
    </div>

    <!-- Metrics Grid -->
    <div v-else class="space-y-6">
      <!-- Key Performance Indicators -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Cache Hit Rate -->
        <div class="stat bg-base-100 shadow rounded-lg">
          <div class="stat-figure text-primary">
            <i class="fas fa-memory text-2xl"></i>
          </div>
          <div class="stat-title">Cache Hit Rate</div>
          <div class="stat-value text-primary">{{ cacheHitRate }}%</div>
          <div class="stat-desc" :class="cacheHitRateColor">
            {{ cacheHitRateStatus }}
          </div>
        </div>

        <!-- Average Query Time -->
        <div class="stat bg-base-100 shadow rounded-lg">
          <div class="stat-figure text-secondary">
            <i class="fas fa-clock text-2xl"></i>
          </div>
          <div class="stat-title">Avg Query Time</div>
          <div class="stat-value text-secondary">{{ avgQueryTime }}ms</div>
          <div class="stat-desc" :class="queryTimeColor">
            {{ queryTimeStatus }}
          </div>
        </div>

        <!-- Active Connections -->
        <div class="stat bg-base-100 shadow rounded-lg">
          <div class="stat-figure text-accent">
            <i class="fas fa-plug text-2xl"></i>
          </div>
          <div class="stat-title">DB Connections</div>
          <div class="stat-value text-accent">{{ activeConnections }}</div>
          <div class="stat-desc">Active connections</div>
        </div>

        <!-- Slow Queries -->
        <div class="stat bg-base-100 shadow rounded-lg">
          <div class="stat-figure" :class="slowQueriesColor">
            <i class="fas fa-exclamation-triangle text-2xl"></i>
          </div>
          <div class="stat-title">Slow Queries</div>
          <div class="stat-value" :class="slowQueriesColor">{{ slowQueriesCount }}</div>
          <div class="stat-desc">Last hour</div>
        </div>
      </div>

      <!-- Performance Charts -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Response Time Chart -->
        <div class="card bg-base-100 shadow-xl">
          <div class="card-body">
            <h3 class="card-title">
              <i class="fas fa-chart-line mr-2"></i>
              Response Time Trend
            </h3>
            <div class="h-64 flex items-center justify-center">
              <canvas ref="responseTimeChart" class="w-full h-full"></canvas>
            </div>
          </div>
        </div>

        <!-- Cache Performance -->
        <div class="card bg-base-100 shadow-xl">
          <div class="card-body">
            <h3 class="card-title">
              <i class="fas fa-chart-pie mr-2"></i>
              Cache Performance
            </h3>
            <div class="h-64 flex items-center justify-center">
              <canvas ref="cacheChart" class="w-full h-full"></canvas>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottlenecks Table -->
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <h3 class="card-title mb-4">
            <i class="fas fa-exclamation-circle mr-2"></i>
            Performance Bottlenecks
          </h3>
          
          <div v-if="bottlenecks.length === 0" class="text-center py-8 opacity-70">
            <i class="fas fa-check-circle text-4xl mb-4 text-success"></i>
            <p>No performance bottlenecks detected</p>
          </div>
          
          <div v-else class="overflow-x-auto">
            <table class="table table-zebra w-full">
              <thead>
                <tr>
                  <th>Severity</th>
                  <th>Type</th>
                  <th>Description</th>
                  <th>Impact</th>
                  <th>Recommendation</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="bottleneck in bottlenecks" :key="bottleneck.id">
                  <td>
                    <div class="badge" :class="getSeverityClass(bottleneck.severity)">
                      {{ bottleneck.severity }}
                    </div>
                  </td>
                  <td>{{ bottleneck.type }}</td>
                  <td>{{ bottleneck.description }}</td>
                  <td class="text-sm opacity-70">{{ bottleneck.estimated_impact }}</td>
                  <td class="text-sm">{{ bottleneck.recommendation }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Database Health -->
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <h3 class="card-title mb-4">
            <i class="fas fa-heartbeat mr-2"></i>
            Database Health
          </h3>
          
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="text-center">
              <div class="text-3xl mb-2" :class="getHealthColor(dbHealth.overall)">
                <i :class="getHealthIcon(dbHealth.overall)"></i>
              </div>
              <div class="font-semibold">Overall Health</div>
              <div class="text-sm opacity-70">{{ dbHealth.overall }}</div>
            </div>
            
            <div class="text-center">
              <div class="text-2xl font-bold text-info">{{ dbHealth.uptime }}</div>
              <div class="font-semibold">Uptime</div>
              <div class="text-sm opacity-70">Database uptime</div>
            </div>
            
            <div class="text-center">
              <div class="text-2xl font-bold text-success">{{ dbHealth.indexCoverage }}%</div>
              <div class="font-semibold">Index Coverage</div>
              <div class="text-sm opacity-70">Required indexes present</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useStore } from 'vuex'
import Chart from 'chart.js/auto'

const store = useStore()

// Reactive data
const metrics = ref(null)
const loading = ref(false)
const error = ref('')
const autoRefresh = ref(false)
const refreshInterval = ref(null)

// Chart refs
const responseTimeChart = ref(null)
const cacheChart = ref(null)
let responseTimeChartInstance = null
let cacheChartInstance = null

// Computed properties
const cacheHitRate = computed(() => {
  return metrics.value?.cache_statistics?.permission_cache?.hit_rate?.toFixed(1) || '0.0'
})

const cacheHitRateStatus = computed(() => {
  const rate = parseFloat(cacheHitRate.value)
  if (rate >= 90) return 'Excellent'
  if (rate >= 80) return 'Good'
  if (rate >= 70) return 'Fair'
  return 'Poor'
})

const cacheHitRateColor = computed(() => {
  const rate = parseFloat(cacheHitRate.value)
  if (rate >= 90) return 'text-success'
  if (rate >= 80) return 'text-info'
  if (rate >= 70) return 'text-warning'
  return 'text-error'
})

const avgQueryTime = computed(() => {
  const operations = metrics.value?.operation_statistics || {}
  const times = Object.values(operations).map(op => op.avg_duration_ms).filter(t => t > 0)
  if (times.length === 0) return '0.0'
  const avg = times.reduce((sum, time) => sum + time, 0) / times.length
  return avg.toFixed(1)
})

const queryTimeStatus = computed(() => {
  const time = parseFloat(avgQueryTime.value)
  if (time <= 50) return 'Excellent'
  if (time <= 100) return 'Good'
  if (time <= 200) return 'Fair'
  return 'Poor'
})

const queryTimeColor = computed(() => {
  const time = parseFloat(avgQueryTime.value)
  if (time <= 50) return 'text-success'
  if (time <= 100) return 'text-info'
  if (time <= 200) return 'text-warning'
  return 'text-error'
})

const activeConnections = computed(() => {
  return metrics.value?.database_info?.connection_pool_size || 'N/A'
})

const slowQueriesCount = computed(() => {
  return metrics.value?.slow_operations?.length || 0
})

const slowQueriesColor = computed(() => {
  const count = slowQueriesCount.value
  if (count === 0) return 'text-success'
  if (count <= 5) return 'text-warning'
  return 'text-error'
})

const bottlenecks = computed(() => {
  return metrics.value?.bottlenecks || []
})

const dbHealth = computed(() => {
  const health = metrics.value?.database_health || {}
  return {
    overall: health.overall_status || 'unknown',
    uptime: health.uptime || 'N/A',
    indexCoverage: health.index_coverage || 0
  }
})

// Methods
const refreshMetrics = async () => {
  loading.value = true
  error.value = ''
  
  try {
    // Call the backend performance analysis endpoint
    const response = await fetch('/api/admin/performance-metrics', {
      headers: {
        'Authorization': `Bearer ${store.state.token || localStorage.getItem('auth_token')}`
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const data = await response.json()
    metrics.value = data
    
    // Update charts
    await nextTick()
    updateCharts()
    
  } catch (err) {
    console.error('Error loading performance metrics:', err)
    error.value = 'Failed to load performance metrics'
    store.dispatch('showError', 'Failed to load performance metrics')
  } finally {
    loading.value = false
  }
}

const toggleAutoRefresh = () => {
  autoRefresh.value = !autoRefresh.value
  
  if (autoRefresh.value) {
    refreshInterval.value = setInterval(refreshMetrics, 30000) // 30 seconds
    store.dispatch('showInfo', 'Auto-refresh enabled (30s interval)')
  } else {
    if (refreshInterval.value) {
      clearInterval(refreshInterval.value)
      refreshInterval.value = null
    }
    store.dispatch('showInfo', 'Auto-refresh disabled')
  }
}

const getSeverityClass = (severity) => {
  const classes = {
    'critical': 'badge-error',
    'high': 'badge-warning',
    'medium': 'badge-info',
    'low': 'badge-success'
  }
  return classes[severity] || 'badge-ghost'
}

const getHealthColor = (status) => {
  const colors = {
    'healthy': 'text-success',
    'warning': 'text-warning',
    'critical': 'text-error',
    'unknown': 'text-base-content'
  }
  return colors[status] || 'text-base-content'
}

const getHealthIcon = (status) => {
  const icons = {
    'healthy': 'fas fa-heart',
    'warning': 'fas fa-exclamation-triangle',
    'critical': 'fas fa-times-circle',
    'unknown': 'fas fa-question-circle'
  }
  return icons[status] || 'fas fa-question-circle'
}

const updateCharts = () => {
  updateResponseTimeChart()
  updateCacheChart()
}

const updateResponseTimeChart = () => {
  if (!responseTimeChart.value || !metrics.value) return
  
  const ctx = responseTimeChart.value.getContext('2d')
  
  if (responseTimeChartInstance) {
    responseTimeChartInstance.destroy()
  }
  
  // Generate sample data - in real implementation, this would come from metrics
  const labels = Array.from({ length: 24 }, (_, i) => `${i}:00`)
  const data = Array.from({ length: 24 }, () => Math.random() * 200 + 50)
  
  responseTimeChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Response Time (ms)',
        data,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Response Time (ms)'
          }
        },
        x: {
          title: {
            display: true,
            text: 'Time (24h)'
          }
        }
      }
    }
  })
}

const updateCacheChart = () => {
  if (!cacheChart.value || !metrics.value) return
  
  const ctx = cacheChart.value.getContext('2d')
  
  if (cacheChartInstance) {
    cacheChartInstance.destroy()
  }
  
  const cacheStats = metrics.value.cache_statistics?.permission_cache || {}
  const hits = cacheStats.hits || 0
  const misses = cacheStats.misses || 0
  
  cacheChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Cache Hits', 'Cache Misses'],
      datasets: [{
        data: [hits, misses],
        backgroundColor: [
          'rgb(34, 197, 94)',
          'rgb(239, 68, 68)'
        ]
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom'
        }
      }
    }
  })
}

// Lifecycle
onMounted(() => {
  refreshMetrics()
})

onUnmounted(() => {
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value)
  }
  if (responseTimeChartInstance) {
    responseTimeChartInstance.destroy()
  }
  if (cacheChartInstance) {
    cacheChartInstance.destroy()
  }
})
</script>

<style scoped>
.performance-dashboard {
  min-height: 100vh;
}

.stat {
  @apply border border-base-300;
}

.card {
  @apply border border-base-300;
}

/* Animation for metrics */
.stat-value {
  animation: countUp 1s ease-out;
}

@keyframes countUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Loading animation for auto-refresh */
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>