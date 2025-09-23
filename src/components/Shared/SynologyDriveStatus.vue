<!-- components/Shared/SynologyDriveStatus.vue -->
<template>
  <div class="card bg-base-100 shadow-lg">
    <div class="card-body">
      <!-- Header -->
      <div class="flex items-center justify-between mb-4">
        <h3 class="card-title flex items-center">
          <i class="fas fa-sync-alt mr-2 text-primary"></i>
          Synology Drive Status
        </h3>
        <div class="flex gap-2">
          <button 
            class="btn btn-sm btn-outline"
            @click="refreshStatus"
            :disabled="loading"
          >
            <i class="fas fa-refresh mr-1" :class="{ 'animate-spin': loading }"></i>
            Refresh
          </button>
          <button 
            class="btn btn-sm btn-primary"
            @click="openDriveConfig"
          >
            <i class="fas fa-cog mr-1"></i>
            Configure
          </button>
        </div>
      </div>

      <!-- Status Overview -->
      <div v-if="status" class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <!-- Connection Status -->
        <div class="stat bg-base-200 rounded-lg p-4">
          <div class="stat-figure">
            <i class="fas text-2xl" 
               :class="status.connected ? 'fa-check-circle text-success' : 'fa-times-circle text-error'">
            </i>
          </div>
          <div class="stat-title">Connection</div>
          <div class="stat-value text-lg" 
               :class="status.connected ? 'text-success' : 'text-error'">
            {{ status.connected ? 'Connected' : 'Disconnected' }}
          </div>
          <div class="stat-desc">
            {{ status.connected ? 'NAS is accessible' : 'Check network connection' }}
          </div>
        </div>

        <!-- Sync Status -->
        <div class="stat bg-base-200 rounded-lg p-4">
          <div class="stat-figure">
            <i class="fas text-2xl"
               :class="getSyncStatusIcon()">
            </i>
          </div>
          <div class="stat-title">Sync Status</div>
          <div class="stat-value text-lg" :class="getSyncStatusColor()">
            {{ getSyncStatusText() }}
          </div>
          <div class="stat-desc">
            {{ status.sync_in_progress ? 'Synchronizing...' : 'Ready' }}
          </div>
        </div>

        <!-- Files Status -->
        <div class="stat bg-base-200 rounded-lg p-4">
          <div class="stat-figure">
            <i class="fas fa-files-o text-2xl text-info"></i>
          </div>
          <div class="stat-title">Files</div>
          <div class="stat-value text-lg">
            {{ status.synced_files }}/{{ status.total_files }}
          </div>
          <div class="stat-desc">
            {{ status.total_files - status.synced_files }} pending
          </div>
        </div>
      </div>

      <!-- Sync Progress -->
      <div v-if="status && status.sync_in_progress" class="mb-4">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm font-medium">Synchronization Progress</span>
          <span class="text-sm">{{ syncProgress }}%</span>
        </div>
        <progress 
          class="progress progress-primary w-full" 
          :value="syncProgress" 
          max="100"
        ></progress>
      </div>

      <!-- Bandwidth Usage -->
      <div v-if="status && (status.bandwidth_usage.upload_kbps > 0 || status.bandwidth_usage.download_kbps > 0)" 
           class="mb-4">
        <h4 class="font-semibold mb-2">Bandwidth Usage</h4>
        <div class="grid grid-cols-2 gap-4">
          <div class="flex items-center">
            <i class="fas fa-upload text-success mr-2"></i>
            <span class="text-sm">Upload: {{ formatBandwidth(status.bandwidth_usage.upload_kbps) }}</span>
          </div>
          <div class="flex items-center">
            <i class="fas fa-download text-info mr-2"></i>
            <span class="text-sm">Download: {{ formatBandwidth(status.bandwidth_usage.download_kbps) }}</span>
          </div>
        </div>
      </div>

      <!-- Last Sync -->
      <div v-if="status && status.last_sync" class="mb-4">
        <div class="flex items-center text-sm text-base-content/70">
          <i class="fas fa-clock mr-2"></i>
          <span>Last sync: {{ formatDate(status.last_sync) }}</span>
        </div>
      </div>

      <!-- Errors -->
      <div v-if="status && status.errors && status.errors.length > 0" class="mb-4">
        <div class="alert alert-warning">
          <i class="fas fa-exclamation-triangle"></i>
          <div>
            <h4 class="font-semibold">Sync Issues</h4>
            <ul class="list-disc list-inside text-sm mt-1">
              <li v-for="error in status.errors.slice(0, 3)" :key="error">{{ error }}</li>
            </ul>
            <button v-if="status.errors.length > 3" 
                    class="btn btn-xs btn-outline mt-2"
                    @click="showAllErrors = !showAllErrors">
              {{ showAllErrors ? 'Show Less' : `Show ${status.errors.length - 3} More` }}
            </button>
          </div>
        </div>
        
        <!-- All errors (expandable) -->
        <div v-if="showAllErrors && status.errors.length > 3" class="mt-2">
          <div class="bg-base-200 rounded p-3">
            <ul class="list-disc list-inside text-sm space-y-1">
              <li v-for="error in status.errors.slice(3)" :key="error">{{ error }}</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="card-actions justify-end">
        <button 
          class="btn btn-sm btn-outline"
          @click="triggerSync"
          :disabled="loading || (status && status.sync_in_progress)"
        >
          <i class="fas fa-sync mr-1"></i>
          Force Sync
        </button>
        <button 
          class="btn btn-sm btn-primary"
          @click="openDriveClient"
        >
          <i class="fas fa-external-link-alt mr-1"></i>
          Open Drive Client
        </button>
      </div>
    </div>

    <!-- Drive Configuration Modal -->
    <div v-if="showConfigModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-base-100 p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-xl font-bold">Synology Drive Configuration</h3>
          <button class="btn btn-sm btn-circle btn-ghost" @click="closeConfigModal">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div v-if="config" class="space-y-6">
          <!-- Server Information -->
          <div class="card bg-base-200">
            <div class="card-body">
              <h4 class="card-title text-lg">Server Information</h4>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="label">
                    <span class="label-text font-semibold">Server Address</span>
                  </label>
                  <input 
                    type="text" 
                    :value="config.server_address" 
                    class="input input-bordered w-full" 
                    readonly
                  />
                </div>
                <div>
                  <label class="label">
                    <span class="label-text font-semibold">Port</span>
                  </label>
                  <input 
                    type="text" 
                    :value="config.server_port || config.port || '5000'" 
                    class="input input-bordered w-full" 
                    readonly
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Connection URLs -->
          <div class="card bg-base-200">
            <div class="card-body">
              <h4 class="card-title text-lg">Quick Connect</h4>
              <div class="space-y-3">
                <div>
                  <label class="label">
                    <span class="label-text font-semibold">Drive Client URL</span>
                  </label>
                  <div class="flex gap-2">
                    <input 
                      type="text" 
                      :value="config.drive_client_url" 
                      class="input input-bordered flex-1" 
                      readonly
                    />
                    <button 
                      class="btn btn-outline"
                      @click="copyToClipboard(config.drive_client_url)"
                    >
                      <i class="fas fa-copy"></i>
                    </button>
                  </div>
                </div>
                <div>
                  <label class="label">
                    <span class="label-text font-semibold">Web Interface</span>
                  </label>
                  <div class="flex gap-2">
                    <input 
                      type="text" 
                      :value="config.web_interface_url" 
                      class="input input-bordered flex-1" 
                      readonly
                    />
                    <button 
                      class="btn btn-outline"
                      @click="openUrl(config.web_interface_url)"
                    >
                      <i class="fas fa-external-link-alt"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Setup Instructions -->
          <div v-if="config.setup_instructions" class="card bg-base-200">
            <div class="card-body">
              <h4 class="card-title text-lg">Setup Instructions</h4>
              <div class="tabs tabs-boxed">
                <button 
                  v-for="(instructions, platform) in config.setup_instructions" 
                  :key="platform"
                  class="tab"
                  :class="{ 'tab-active': selectedPlatform === platform }"
                  @click="selectedPlatform = platform"
                >
                  <i class="fas mr-2" :class="getPlatformIcon(platform)"></i>
                  {{ platform.charAt(0).toUpperCase() + platform.slice(1) }}
                </button>
              </div>
              <div class="mt-4">
                <ol class="list-decimal list-inside space-y-2">
                  <li v-for="(step, index) in config.setup_instructions[selectedPlatform]" 
                      :key="index" 
                      class="text-sm">
                    {{ step }}
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="text-center py-8">
          <div class="loading loading-spinner loading-lg"></div>
          <p class="mt-4">Loading configuration...</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useStore } from 'vuex'
import { nasAPI } from '@/services/nasAPI.js'

const store = useStore()

// State
const status = ref(null)
const config = ref(null)
const loading = ref(false)
const showConfigModal = ref(false)
const showAllErrors = ref(false)
const selectedPlatform = ref('windows')
const refreshInterval = ref(null)

// Computed
const syncProgress = computed(() => {
  if (!status.value || status.value.total_files === 0) return 0
  return Math.round((status.value.synced_files / status.value.total_files) * 100)
})

// Methods
const refreshStatus = async () => {
  loading.value = true
  try {
    console.log('Refreshing sync status...')
    const response = await nasAPI.getSyncStatus()
    console.log('Sync status response:', response)
    
    if (response.success) {
      status.value = response.status
    } else {
      throw new Error(response.error || 'Failed to get sync status')
    }
  } catch (error) {
    console.error('Error refreshing sync status:', error)
    
    // Don't show error for authentication issues - user might not be logged in yet
    if (error.status !== 401) {
      store.dispatch('showError', `Failed to refresh sync status: ${error.message}`)
    }
  } finally {
    loading.value = false
  }
}

const openDriveConfig = async () => {
  showConfigModal.value = true
  if (!config.value) {
    try {
      const response = await nasAPI.getConfig()
      if (response.success) {
        config.value = response.config
      } else {
        throw new Error(response.error || 'Failed to get configuration')
      }
    } catch (error) {
      console.error('Error loading config:', error)
      store.dispatch('showError', `Failed to load configuration: ${error.message}`)
    }
  }
}

const closeConfigModal = () => {
  showConfigModal.value = false
}

const triggerSync = async () => {
  try {
    const response = await nasAPI.triggerSync('/')
    if (response.success) {
      store.dispatch('showSuccess', response.message)
      // Refresh status after a short delay
      setTimeout(refreshStatus, 2000)
    } else {
      throw new Error(response.error || 'Failed to trigger sync')
    }
  } catch (error) {
    console.error('Error triggering sync:', error)
    store.dispatch('showError', `Failed to trigger sync: ${error.message}`)
  }
}

const openDriveClient = () => {
  if (config.value && config.value.drive_client_url) {
    window.open(config.value.drive_client_url, '_blank')
  } else {
    store.dispatch('showInfo', 'Please configure Synology Drive first')
    openDriveConfig()
  }
}

const getSyncStatusIcon = () => {
  if (!status.value) return 'fa-question-circle text-gray-400'
  if (status.value.sync_in_progress) return 'fa-sync-alt animate-spin text-primary'
  if (status.value.errors && status.value.errors.length > 0) return 'fa-exclamation-triangle text-warning'
  return 'fa-check-circle text-success'
}

const getSyncStatusColor = () => {
  if (!status.value) return 'text-gray-400'
  if (status.value.sync_in_progress) return 'text-primary'
  if (status.value.errors && status.value.errors.length > 0) return 'text-warning'
  return 'text-success'
}

const getSyncStatusText = () => {
  if (!status.value) return 'Unknown'
  if (status.value.sync_in_progress) return 'Syncing'
  if (status.value.errors && status.value.errors.length > 0) return 'Warning'
  return 'Healthy'
}

const formatBandwidth = (kbps) => {
  if (kbps < 1024) return `${kbps.toFixed(1)} KB/s`
  return `${(kbps / 1024).toFixed(1)} MB/s`
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleString()
}

const getPlatformIcon = (platform) => {
  const icons = {
    windows: 'fa-windows',
    mac: 'fa-apple',
    mobile: 'fa-mobile-alt'
  }
  return icons[platform] || 'fa-desktop'
}

const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
    store.dispatch('showSuccess', 'Copied to clipboard')
  } catch (error) {
    console.error('Failed to copy to clipboard:', error)
    store.dispatch('showError', 'Failed to copy to clipboard')
  }
}

const openUrl = (url) => {
  window.open(url, '_blank')
}

// Lifecycle
onMounted(() => {
  refreshStatus()
  // Auto-refresh every 30 seconds
  refreshInterval.value = setInterval(refreshStatus, 30000)
})

onUnmounted(() => {
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value)
  }
})
</script>

<style scoped>
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>