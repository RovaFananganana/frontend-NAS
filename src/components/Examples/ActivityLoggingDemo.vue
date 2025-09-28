<template>
  <div class="activity-logging-demo">
    <div class="demo-header">
      <h2>Activity Logging Demo</h2>
      <p>This component demonstrates how to use the activity logging system.</p>
    </div>

    <div class="demo-sections">
      <!-- Manual Logging Section -->
      <div class="demo-section">
        <h3>Manual Activity Logging</h3>
        <div class="demo-buttons">
          <button @click="logCustomActivity" class="demo-btn">
            Log Custom Activity
          </button>
          <button @click="logFileOperation" class="demo-btn">
            Log File Operation
          </button>
          <button @click="logNavigation" class="demo-btn">
            Log Navigation
          </button>
          <button @click="logError" class="demo-btn error">
            Log Error
          </button>
        </div>
      </div>

      <!-- Directive Usage Section -->
      <div class="demo-section">
        <h3>Using v-activity Directive</h3>
        <div class="demo-buttons">
          <button 
            v-activity:click="{ action: 'button_click', context: 'demo' }"
            class="demo-btn"
          >
            Auto-logged Button
          </button>
          <button 
            v-activity:mouseenter="{ action: 'hover', context: 'demo' }"
            class="demo-btn"
          >
            Hover Logged Button
          </button>
        </div>
      </div>

      <!-- File Operations Section -->
      <div class="demo-section">
        <h3>File Operations with Auto-logging</h3>
        <div class="demo-buttons">
          <button @click="simulateFileDownload" class="demo-btn">
            Simulate Download
          </button>
          <button @click="simulateFileUpload" class="demo-btn">
            Simulate Upload
          </button>
          <button @click="simulateFolderCreate" class="demo-btn">
            Simulate Folder Create
          </button>
        </div>
      </div>

      <!-- Activity Stats Section -->
      <div class="demo-section">
        <h3>Activity Statistics</h3>
        <div class="stats-container">
          <div v-if="loading" class="loading">Loading stats...</div>
          <div v-else-if="stats" class="stats-grid">
            <div class="stat-item">
              <span class="stat-label">Today</span>
              <span class="stat-value">{{ stats.today || 0 }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">This Week</span>
              <span class="stat-value">{{ stats.week || 0 }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Total</span>
              <span class="stat-value">{{ stats.total || 0 }}</span>
            </div>
          </div>
          <button @click="refreshStats" class="demo-btn">
            Refresh Stats
          </button>
        </div>
      </div>

      <!-- Cache Management Section -->
      <div class="demo-section">
        <h3>Cache Management</h3>
        <div class="cache-controls">
          <button @click="showCacheStats" class="demo-btn">
            Show Cache Stats
          </button>
          <button @click="clearCache" class="demo-btn">
            Clear Cache
          </button>
          <div v-if="cacheStats" class="cache-info">
            <p>Cache Size: {{ cacheStats.size }}</p>
            <p>Cached Keys: {{ cacheStats.keys?.length || 0 }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Activity Log Display -->
    <div class="demo-section">
      <h3>Recent Activities</h3>
      <div class="activity-log">
        <div v-if="loadingActivities" class="loading">Loading activities...</div>
        <div v-else-if="activities.length === 0" class="no-activities">
          No activities found
        </div>
        <div v-else class="activity-list">
          <div 
            v-for="activity in activities" 
            :key="activity.id"
            class="activity-item"
            :class="{ 'activity-error': !activity.success }"
          >
            <div class="activity-icon">
              <i :class="getActivityIcon(activity.action)"></i>
            </div>
            <div class="activity-content">
              <div class="activity-action">{{ activity.action }}</div>
              <div class="activity-resource" v-if="activity.resource">
                {{ activity.resource }}
              </div>
              <div class="activity-time">
                {{ formatTime(activity.created_at) }}
              </div>
            </div>
            <div class="activity-status">
              <i :class="activity.success ? 'fas fa-check text-green-500' : 'fas fa-times text-red-500'"></i>
            </div>
          </div>
        </div>
        <button @click="loadActivities" class="demo-btn">
          Refresh Activities
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useActivity } from '@/plugins/activityPlugin.js'

// Activity integration service
const activity = useActivity()

// Reactive data
const stats = ref(null)
const loading = ref(false)
const activities = ref([])
const loadingActivities = ref(false)
const cacheStats = ref(null)

// Methods
const logCustomActivity = async () => {
  try {
    await activity.logActivity('demo_action', 'demo_resource', {
      demo: true,
      timestamp: new Date().toISOString(),
      user_action: 'manual_log'
    })
    console.log('Custom activity logged successfully')
  } catch (error) {
    console.error('Failed to log custom activity:', error)
  }
}

const logFileOperation = async () => {
  try {
    await activity.logFileOperation('download', '/demo/test-file.txt', {
      file_size: 1024,
      demo: true
    })
    console.log('File operation logged successfully')
  } catch (error) {
    console.error('Failed to log file operation:', error)
  }
}

const logNavigation = async () => {
  try {
    await activity.logNavigation('/demo/navigation', {
      demo: true,
      navigation_type: 'manual'
    })
    console.log('Navigation logged successfully')
  } catch (error) {
    console.error('Failed to log navigation:', error)
  }
}

const logError = async () => {
  try {
    const demoError = new Error('This is a demo error')
    await activity.logError(demoError, 'demo_context', {
      demo: true,
      error_type: 'intentional'
    })
    console.log('Error logged successfully')
  } catch (error) {
    console.error('Failed to log error:', error)
  }
}

const simulateFileDownload = async () => {
  try {
    // Simulate a file download with activity logging
    await activity.logFileOperation('download', '/demo/downloaded-file.pdf', {
      file_size: 2048,
      simulation: true
    })
    console.log('File download simulated and logged')
  } catch (error) {
    console.error('Failed to simulate file download:', error)
  }
}

const simulateFileUpload = async () => {
  try {
    // Simulate a file upload with activity logging
    await activity.logFileOperation('upload', '/demo/uploaded-file.jpg', {
      file_size: 4096,
      simulation: true
    })
    console.log('File upload simulated and logged')
  } catch (error) {
    console.error('Failed to simulate file upload:', error)
  }
}

const simulateFolderCreate = async () => {
  try {
    // Simulate folder creation with activity logging
    await activity.logFileOperation('create_folder', '/demo/new-folder', {
      simulation: true
    })
    console.log('Folder creation simulated and logged')
  } catch (error) {
    console.error('Failed to simulate folder creation:', error)
  }
}

const refreshStats = async () => {
  try {
    loading.value = true
    const response = await activity.getActivityStats(true) // Bypass cache
    stats.value = response.stats || {}
  } catch (error) {
    console.error('Failed to load activity stats:', error)
  } finally {
    loading.value = false
  }
}

const loadActivities = async () => {
  try {
    loadingActivities.value = true
    const response = await activity.getActivities({ limit: 10 }, true) // Bypass cache
    activities.value = response.activities || []
  } catch (error) {
    console.error('Failed to load activities:', error)
  } finally {
    loadingActivities.value = false
  }
}

const showCacheStats = () => {
  try {
    cacheStats.value = activity.getCacheStats()
    console.log('Cache stats:', cacheStats.value)
  } catch (error) {
    console.error('Failed to get cache stats:', error)
  }
}

const clearCache = () => {
  try {
    activity.clearCache()
    cacheStats.value = null
    console.log('Cache cleared successfully')
  } catch (error) {
    console.error('Failed to clear cache:', error)
  }
}

const getActivityIcon = (action) => {
  const iconMap = {
    'login': 'fas fa-sign-in-alt',
    'logout': 'fas fa-sign-out-alt',
    'navigation': 'fas fa-compass',
    'file_download': 'fas fa-download',
    'file_upload': 'fas fa-upload',
    'file_delete': 'fas fa-trash',
    'folder_create': 'fas fa-folder-plus',
    'demo_action': 'fas fa-flask',
    'error': 'fas fa-exclamation-triangle'
  }
  return iconMap[action] || 'fas fa-circle'
}

const formatTime = (timestamp) => {
  if (!timestamp) return 'Unknown'
  return new Date(timestamp).toLocaleString()
}

// Lifecycle
onMounted(async () => {
  await Promise.all([
    refreshStats(),
    loadActivities()
  ])
})
</script>

<style scoped>
.activity-logging-demo {
  @apply max-w-6xl mx-auto p-6 space-y-8;
}

.demo-header {
  @apply text-center mb-8;
}

.demo-header h2 {
  @apply text-3xl font-bold text-gray-800 mb-2;
}

.demo-header p {
  @apply text-gray-600 text-lg;
}

.demo-sections {
  @apply space-y-8;
}

.demo-section {
  @apply bg-white rounded-lg shadow-md p-6;
}

.demo-section h3 {
  @apply text-xl font-semibold text-gray-800 mb-4;
}

.demo-buttons {
  @apply flex flex-wrap gap-3;
}

.demo-btn {
  @apply px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
         transition-colors duration-200 font-medium;
}

.demo-btn.error {
  @apply bg-red-600 hover:bg-red-700;
}

.stats-container {
  @apply space-y-4;
}

.loading {
  @apply text-gray-500 italic;
}

.stats-grid {
  @apply grid grid-cols-3 gap-4 mb-4;
}

.stat-item {
  @apply bg-gray-50 rounded-lg p-4 text-center;
}

.stat-label {
  @apply block text-sm text-gray-600 mb-1;
}

.stat-value {
  @apply block text-2xl font-bold text-blue-600;
}

.cache-controls {
  @apply space-y-4;
}

.cache-info {
  @apply bg-gray-50 rounded-lg p-4 text-sm;
}

.cache-info p {
  @apply mb-1 last:mb-0;
}

.activity-log {
  @apply space-y-4;
}

.no-activities {
  @apply text-gray-500 italic text-center py-8;
}

.activity-list {
  @apply space-y-2 mb-4;
}

.activity-item {
  @apply flex items-center gap-4 p-3 bg-gray-50 rounded-lg;
}

.activity-item.activity-error {
  @apply bg-red-50 border border-red-200;
}

.activity-icon {
  @apply w-8 h-8 flex items-center justify-center bg-blue-100 text-blue-600 rounded-full;
}

.activity-error .activity-icon {
  @apply bg-red-100 text-red-600;
}

.activity-content {
  @apply flex-1;
}

.activity-action {
  @apply font-medium text-gray-800;
}

.activity-resource {
  @apply text-sm text-gray-600;
}

.activity-time {
  @apply text-xs text-gray-500;
}

.activity-status {
  @apply w-6 h-6 flex items-center justify-center;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .demo-buttons {
    @apply flex-col;
  }
  
  .stats-grid {
    @apply grid-cols-1;
  }
  
  .activity-item {
    @apply flex-col items-start gap-2;
  }
}
</style>