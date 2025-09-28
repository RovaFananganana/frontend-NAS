<template>
  <div class="navigation-performance-debug bg-base-200 p-4 rounded-lg">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold">Navigation Performance Metrics</h3>
      <div class="flex gap-2">
        <button @click="refreshMetrics" class="btn btn-xs btn-primary">
          <i class="fas fa-redo mr-1"></i>
          Refresh
        </button>
        <button @click="resetMetrics" class="btn btn-xs btn-warning">
          <i class="fas fa-trash mr-1"></i>
          Reset
        </button>
        <button @click="clearCache" class="btn btn-xs btn-error">
          <i class="fas fa-broom mr-1"></i>
          Clear Cache
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <!-- Cache Performance -->
      <div class="stat bg-base-100 rounded-lg p-3">
        <div class="stat-title text-xs">Cache Performance</div>
        <div class="stat-value text-lg" :class="getCacheHitRateColor()">
          {{ metrics.cacheHitRate }}
        </div>
        <div class="stat-desc text-xs">
          {{ metrics.cacheHits }} hits / {{ metrics.cacheMisses }} misses
        </div>
      </div>

      <!-- Cache Size -->
      <div class="stat bg-base-100 rounded-lg p-3">
        <div class="stat-title text-xs">Cache Size</div>
        <div class="stat-value text-lg">{{ metrics.cacheSize }}</div>
        <div class="stat-desc text-xs">Cached validations</div>
      </div>

      <!-- Prevented Navigations -->
      <div class="stat bg-base-100 rounded-lg p-3">
        <div class="stat-title text-xs">Prevented Redundant</div>
        <div class="stat-value text-lg text-success">{{ metrics.preventedRedundantNavigations }}</div>
        <div class="stat-desc text-xs">Redundant navigations prevented</div>
      </div>

      <!-- Debounced Operations -->
      <div class="stat bg-base-100 rounded-lg p-3">
        <div class="stat-title text-xs">Debounced Operations</div>
        <div class="stat-value text-lg text-info">{{ metrics.debouncedOperations }}</div>
        <div class="stat-desc text-xs">Operations debounced</div>
      </div>

      <!-- Active Debouncers -->
      <div class="stat bg-base-100 rounded-lg p-3">
        <div class="stat-title text-xs">Active Debouncers</div>
        <div class="stat-value text-lg" :class="getActiveDebouncersColor()">
          {{ metrics.activeDebouncers }}
        </div>
        <div class="stat-desc text-xs">Currently pending</div>
      </div>

      <!-- Navigation Status -->
      <div class="stat bg-base-100 rounded-lg p-3">
        <div class="stat-title text-xs">Navigation Status</div>
        <div class="stat-value text-lg" :class="getNavigationStatusColor()">
          {{ metrics.navigationInProgress ? 'In Progress' : 'Idle' }}
        </div>
        <div class="stat-desc text-xs">Current state</div>
      </div>
    </div>

    <!-- Performance Tips -->
    <div class="mt-4 p-3 bg-info/10 rounded-lg">
      <h4 class="font-semibold text-sm mb-2">
        <i class="fas fa-lightbulb mr-1"></i>
        Performance Tips
      </h4>
      <ul class="text-xs space-y-1">
        <li v-if="parseFloat(metrics.cacheHitRate) < 50" class="text-warning">
          • Low cache hit rate ({{ metrics.cacheHitRate }}) - Consider increasing cache TTL
        </li>
        <li v-if="metrics.preventedRedundantNavigations > 10" class="text-success">
          • Good redundancy prevention ({{ metrics.preventedRedundantNavigations }} prevented)
        </li>
        <li v-if="metrics.activeDebouncers > 5" class="text-warning">
          • High number of active debouncers ({{ metrics.activeDebouncers }}) - Check for excessive rapid operations
        </li>
        <li v-if="metrics.cacheSize > 80" class="text-info">
          • Cache is getting full ({{ metrics.cacheSize }}/100) - Automatic cleanup will occur soon
        </li>
      </ul>
    </div>

    <!-- Last Updated -->
    <div class="text-xs text-base-content/60 mt-2 text-center">
      Last updated: {{ lastUpdated }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import navigationPerformance from '@/utils/navigationPerformance.js'

// Reactive data
const metrics = ref({
  cacheHitRate: '0%',
  cacheHits: 0,
  cacheMisses: 0,
  cacheSize: 0,
  preventedRedundantNavigations: 0,
  debouncedOperations: 0,
  activeDebouncers: 0,
  navigationInProgress: false
})

const lastUpdated = ref('')
let updateInterval = null

// Methods
const refreshMetrics = () => {
  metrics.value = navigationPerformance.getMetrics()
  lastUpdated.value = new Date().toLocaleTimeString()
}

const resetMetrics = () => {
  navigationPerformance.resetMetrics()
  refreshMetrics()
}

const clearCache = () => {
  navigationPerformance.clearCache()
  refreshMetrics()
}

const getCacheHitRateColor = () => {
  const rate = parseFloat(metrics.value.cacheHitRate)
  if (rate >= 80) return 'text-success'
  if (rate >= 60) return 'text-warning'
  return 'text-error'
}

const getActiveDebouncersColor = () => {
  const count = metrics.value.activeDebouncers
  if (count === 0) return 'text-success'
  if (count <= 3) return 'text-info'
  return 'text-warning'
}

const getNavigationStatusColor = () => {
  return metrics.value.navigationInProgress ? 'text-warning' : 'text-success'
}

// Lifecycle
onMounted(() => {
  refreshMetrics()
  
  // Auto-refresh every 2 seconds
  updateInterval = setInterval(refreshMetrics, 2000)
})

onUnmounted(() => {
  if (updateInterval) {
    clearInterval(updateInterval)
  }
})
</script>

<style scoped>
.navigation-performance-debug {
  font-family: 'Courier New', monospace;
}

.stat {
  min-height: auto;
}

.stat-value {
  font-size: 1.25rem;
  line-height: 1.5;
}

.stat-title {
  font-weight: 600;
  opacity: 0.8;
}

.stat-desc {
  opacity: 0.7;
}
</style>