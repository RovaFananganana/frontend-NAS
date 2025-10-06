<!-- components/User/UserDashboard.vue -->
<template>
  <div class="p-6 space-y-6">
    <!-- Welcome Header -->
    <div class="hero bg-gradient-to-r from-primary to-secondary text-primary-content rounded-lg">
      <div class="hero-content text-center">
        <div class="max-w-md">
          <h1 class="text-3xl font-bold">
            Bienvenue {{ store.getters.username || 'Utilisateur' }}
          </h1>
          <p class="py-4">Accédez à vos fichiers, surveillez votre stockage et synchronisez avec Synology Drive</p>
          <button class="btn btn-accent" @click="navigateToFiles">
            <i class="fas fa-folder-open mr-2"></i>
            Parcourir les fichiers
          </button>
        </div>
      </div>
    </div>

    <!-- Quick Stats -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <!-- Storage Usage -->
      <div class="stat bg-base-100 shadow rounded-lg">
        <div class="stat-figure text-primary">
          <i class="fas fa-hdd text-3xl"></i>
        </div>
        <div class="stat-title">Storage Used</div>
        <div class="stat-value text-primary">{{ formatBytes(storageUsed) }}</div>
        <div class="stat-desc">
          {{ storageQuota > 0 ? `${Math.round((storageUsed / storageQuota) * 100)}% of quota` : 'No quota limit' }}
        </div>
      </div>

      <!-- File Count -->
      <div class="stat bg-base-100 shadow rounded-lg">
        <div class="stat-figure text-secondary">
          <i class="fas fa-file text-3xl"></i>
        </div>
        <div class="stat-title">My Files</div>
        <div class="stat-value text-secondary">{{ fileCount }}</div>
        <div class="stat-desc">Files in your folders</div>
      </div>

      <!-- Last Activity -->
      <div class="stat bg-base-100 shadow rounded-lg">
        <div class="stat-figure text-accent">
          <i class="fas fa-clock text-3xl"></i>
        </div>
        <div class="stat-title">Last Activity</div>
        <div class="stat-value text-accent text-lg">{{ formatDate(lastActivity) }}</div>
        <div class="stat-desc">Recent file access</div>
      </div>
    </div>

    <!-- Synology Drive Status -->
    <SynologyDriveStatus />

    <!-- Quick Actions -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- File Operations -->
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <h2 class="card-title">
            <i class="fas fa-tasks mr-2"></i>
            Quick Actions
          </h2>
          <div class="space-y-3">
            <button class="btn btn-outline w-full justify-start" @click="navigateToFiles">
              <i class="fas fa-folder-open mr-2"></i>
              Browse Files
            </button>
            <button class="btn btn-outline w-full justify-start" @click="showUploadModal = true">
              <i class="fas fa-upload mr-2"></i>
              Upload Files
            </button>
            <button class="btn btn-outline w-full justify-start" @click="navigateToStorage">
              <i class="fas fa-chart-pie mr-2"></i>
              Storage Info
            </button>
            <button class="btn btn-outline w-full justify-start" @click="navigateToActivity">
              <i class="fas fa-history mr-2"></i>
              Activity Log
            </button>
          </div>
        </div>
      </div>

      <!-- Recent Files -->
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <h2 class="card-title">
            <i class="fas fa-history mr-2"></i>
            Recent Files
          </h2>
          
          <div v-if="recentFiles.length === 0" class="text-center py-8 opacity-70">
            <i class="fas fa-file text-4xl mb-4"></i>
            <p>No recent files</p>
          </div>
          
          <div v-else class="space-y-3">
            <div 
              v-for="file in recentFiles.slice(0, 5)" 
              :key="file.path"
              class="flex items-center justify-between p-3 bg-base-200 rounded-lg hover:bg-base-300 cursor-pointer"
              @click="openFile(file)"
            >
              <div class="flex items-center">
                <i :class="getFileIcon(file.name)" class="mr-3 text-lg" :style="{ color: getFileColor(file.name) }"></i>
                <div>
                  <div class="font-medium truncate max-w-48">{{ file.name }}</div>
                  <div class="text-sm opacity-70">{{ formatBytes(file.size) }}</div>
                </div>
              </div>
              <div class="text-sm opacity-70">
                {{ formatDate(file.modified) }}
              </div>
            </div>
          </div>
          
          <div v-if="recentFiles.length > 5" class="text-center mt-4">
            <button class="btn btn-sm btn-outline" @click="navigateToActivity">
              View All Activity
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Upload Modal -->
    <div v-if="showUploadModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-base-100 p-6 rounded-lg shadow-xl w-full max-w-md">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-xl font-bold">Upload Files</h3>
          <button class="btn btn-sm btn-circle btn-ghost" @click="showUploadModal = false">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="space-y-4">
          <div class="form-control">
            <label class="label">
              <span class="label-text">Select files to upload</span>
            </label>
            <input 
              type="file" 
              multiple 
              class="file-input file-input-bordered w-full"
              @change="handleFileSelect"
            />
          </div>
          
          <div class="form-control">
            <label class="label">
              <span class="label-text">Upload to folder</span>
            </label>
            <input 
              type="text" 
              v-model="uploadPath"
              placeholder="/my-folder"
              class="input input-bordered w-full"
            />
          </div>
          
          <div class="flex justify-end gap-2">
            <button class="btn btn-outline" @click="showUploadModal = false">Cancel</button>
            <button 
              class="btn btn-primary" 
              @click="uploadFiles"
              :disabled="!selectedFiles.length || uploading"
            >
              <i class="fas fa-upload mr-2" :class="{ 'animate-spin': uploading }"></i>
              {{ uploading ? 'Uploading...' : 'Upload' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import { nasAPI } from '@/services/nasAPI.js'
import SynologyDriveStatus from '../Shared/SynologyDriveStatus.vue'

const store = useStore()
const emit = defineEmits(['navigate'])

// State
const storageUsed = ref(0)
const storageQuota = ref(0)
const fileCount = ref(0)
const lastActivity = ref(new Date())
const recentFiles = ref([])
const showUploadModal = ref(false)
const selectedFiles = ref([])
const uploadPath = ref('/')
const uploading = ref(false)

// Methods
const formatBytes = (bytes) => {
  return nasAPI.formatFileSize(bytes)
}

const formatDate = (date) => {
  if (!date) return 'Never'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date))
}

const getFileIcon = (filename) => {
  return nasAPI.getFileIcon(filename, false)
}

const getFileColor = (filename) => {
  return nasAPI.getFileColor(filename, false)
}

const navigateToFiles = () => {
  emit('navigate', 'files')
}

const navigateToStorage = () => {
  emit('navigate', 'storage')
}

const navigateToActivity = () => {
  emit('navigate', 'logs')
}

const openFile = (file) => {
  // Navigate to files view and select the file
  emit('navigate', 'files')
  // TODO: Implement file selection in SimpleFileExplorer
}

const handleFileSelect = (event) => {
  selectedFiles.value = Array.from(event.target.files)
}

const uploadFiles = async () => {
  if (!selectedFiles.value.length) return
  
  uploading.value = true
  
  try {
    for (const file of selectedFiles.value) {
      await nasAPI.uploadFile(file, uploadPath.value, false, (progress) => {
        // TODO: Show upload progress
        console.log(`Upload progress: ${progress}%`)
      })
    }
    
    store.dispatch('showSuccess', `Successfully uploaded ${selectedFiles.value.length} file(s)`)
    showUploadModal.value = false
    selectedFiles.value = []
    
    // Refresh dashboard data
    loadDashboardData()
    
  } catch (error) {
    console.error('Upload error:', error)
    store.dispatch('showError', `Upload failed: ${error.message}`)
  } finally {
    uploading.value = false
  }
}

const loadDashboardData = async () => {
  try {
    // Load user storage info from store and API
    const user = store.state.user
    if (user) {
      storageQuota.value = (user.quota_mb || 2048) * 1024 * 1024 // Convert MB to bytes
      
      // Try to get actual storage usage from API
      try {
        const storageInfo = await store.dispatch('fetchStorageInfo')
        if (storageInfo && storageInfo.includes('/')) {
          const [used, total] = storageInfo.split('/').map(s => s.trim().replace(' MB', ''))
          storageUsed.value = parseInt(used) * 1024 * 1024 // Convert MB to bytes
        }
      } catch (error) {
        console.warn('Could not fetch storage info:', error)
        // Fallback to estimated usage
        storageUsed.value = Math.floor(storageQuota.value * 0.15) // Estimate 15% usage
      }
    }
    
    // Load recent files from root directory and count them
    try {
      const response = await nasAPI.browse('/')
      if (response.success) {
        const allFiles = response.items.filter(item => !item.is_directory)
        fileCount.value = allFiles.length
        
        recentFiles.value = allFiles
          .sort((a, b) => {
            const dateA = new Date(a.modified_time || a.modified || 0)
            const dateB = new Date(b.modified_time || b.modified || 0)
            return dateB - dateA
          })
          .slice(0, 10)
          
        // Set last activity to the most recent file modification
        if (recentFiles.value.length > 0) {
          lastActivity.value = new Date(recentFiles.value[0].modified_time || recentFiles.value[0].modified)
        }
      }
    } catch (error) {
      console.error('Error loading recent files:', error)
      // Set defaults if API fails
      fileCount.value = 0
      recentFiles.value = []
      lastActivity.value = new Date()
    }
    
  } catch (error) {
    console.error('Error loading dashboard data:', error)
  }
}

// Lifecycle
onMounted(() => {
  loadDashboardData()
})
</script>

<style scoped>
.stat {
  @apply border border-base-300;
}

.card {
  @apply border border-base-300;
}

.hero {
  background: linear-gradient(135deg, oklch(var(--p)) 0%, oklch(var(--s)) 100%);
}
</style>