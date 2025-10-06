<!-- components/User/widgets/RecentFiles.vue -->
<template>
  <div class="recent-files-widget">
    <div class="widget-header">
      <h3 class="widget-title">
        <i class="fas fa-clock mr-2"></i>
        Fichiers récents
      </h3>
      <div class="widget-actions">
        <button 
          v-if="files.length > 0"
          @click="$emit('view-all')"
          class="btn btn-sm btn-ghost"
        >
          Voir tout
        </button>
      </div>
    </div>
    
    <div class="widget-content">
      <div v-if="loading" class="loading-state">
        <div class="flex items-center justify-center py-8">
          <span class="loading loading-spinner loading-md"></span>
          <span class="ml-2">Chargement...</span>
        </div>
      </div>
      
      <div v-else-if="files.length === 0" class="empty-state">
        <div class="text-center py-8 opacity-70">
          <i class="fas fa-file text-4xl mb-4"></i>
          <p>Aucun fichier récent</p>
          <p class="text-sm mt-2">Vos fichiers récemment consultés apparaîtront ici</p>
        </div>
      </div>
      
      <div v-else class="files-list">
        <!-- Desktop/Tablet View -->
        <div class="hidden md:block">
          <div class="files-table">
            <div class="table-header">
              <div class="col-name">Nom</div>
              <div class="col-size">Taille</div>
              <div class="col-modified">Modifié</div>
              <div class="col-actions">Actions</div>
            </div>
            
            <div class="table-body">
              <div 
                v-for="file in displayedFiles" 
                :key="file.path"
                class="file-row"
                @click="selectFile(file)"
              >
                <div class="col-name">
                  <div class="file-info">
                    <i 
                      :class="getFileIcon(file.name)" 
                      class="file-icon"
                      :style="{ color: getFileColor(file.name) }"
                    ></i>
                    <div class="file-details">
                      <div class="file-name">{{ file.name }}</div>
                      <div class="file-path">{{ getRelativePath(file.path) }}</div>
                    </div>
                  </div>
                </div>
                
                <div class="col-size">
                  <span class="file-size">{{ formatBytes(file.size) }}</span>
                </div>
                
                <div class="col-modified">
                  <span class="file-date">{{ formatDate(file.modified) }}</span>
                </div>
                
                <div class="col-actions">
                  <div class="file-actions">
                    <button 
                      @click.stop="downloadFile(file)"
                      class="btn btn-xs btn-ghost"
                      title="Télécharger"
                    >
                      <i class="fas fa-download"></i>
                    </button>
                    <button 
                      @click.stop="openFileLocation(file)"
                      class="btn btn-xs btn-ghost"
                      title="Ouvrir l'emplacement"
                    >
                      <i class="fas fa-folder-open"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Mobile View -->
        <div class="md:hidden">
          <div class="files-cards">
            <div 
              v-for="file in displayedFiles" 
              :key="file.path"
              class="file-card"
              @click="selectFile(file)"
            >
              <div class="file-card-header">
                <i 
                  :class="getFileIcon(file.name)" 
                  class="file-icon"
                  :style="{ color: getFileColor(file.name) }"
                ></i>
                <div class="file-card-actions">
                  <button 
                    @click.stop="downloadFile(file)"
                    class="btn btn-xs btn-ghost"
                  >
                    <i class="fas fa-download"></i>
                  </button>
                </div>
              </div>
              
              <div class="file-card-content">
                <div class="file-name">{{ file.name }}</div>
                <div class="file-meta">
                  <span class="file-size">{{ formatBytes(file.size) }}</span>
                  <span class="file-date">{{ formatDate(file.modified) }}</span>
                </div>
                <div class="file-path">{{ getRelativePath(file.path) }}</div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Show More Button -->
        <div v-if="files.length > displayLimit" class="show-more">
          <button 
            @click="showMore"
            class="btn btn-sm btn-outline w-full"
          >
            Afficher {{ Math.min(5, files.length - displayLimit) }} fichier(s) de plus
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  files: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['file-selected', 'view-all'])

// State
const displayLimit = ref(5)

// Computed
const displayedFiles = computed(() => {
  return props.files.slice(0, displayLimit.value)
})

// Methods
const getFileIcon = (filename) => {
  const ext = filename.split('.').pop()?.toLowerCase()
  
  const iconMap = {
    // Documents
    'pdf': 'fas fa-file-pdf',
    'doc': 'fas fa-file-word',
    'docx': 'fas fa-file-word',
    'xls': 'fas fa-file-excel',
    'xlsx': 'fas fa-file-excel',
    'ppt': 'fas fa-file-powerpoint',
    'pptx': 'fas fa-file-powerpoint',
    'txt': 'fas fa-file-alt',
    
    // Images
    'jpg': 'fas fa-file-image',
    'jpeg': 'fas fa-file-image',
    'png': 'fas fa-file-image',
    'gif': 'fas fa-file-image',
    'svg': 'fas fa-file-image',
    'webp': 'fas fa-file-image',
    
    // Videos
    'mp4': 'fas fa-file-video',
    'avi': 'fas fa-file-video',
    'mkv': 'fas fa-file-video',
    'mov': 'fas fa-file-video',
    'wmv': 'fas fa-file-video',
    
    // Audio
    'mp3': 'fas fa-file-audio',
    'wav': 'fas fa-file-audio',
    'flac': 'fas fa-file-audio',
    'aac': 'fas fa-file-audio',
    
    // Archives
    'zip': 'fas fa-file-archive',
    'rar': 'fas fa-file-archive',
    '7z': 'fas fa-file-archive',
    'tar': 'fas fa-file-archive',
    
    // Code
    'js': 'fas fa-file-code',
    'html': 'fas fa-file-code',
    'css': 'fas fa-file-code',
    'php': 'fas fa-file-code',
    'py': 'fas fa-file-code',
    'java': 'fas fa-file-code',
    'cpp': 'fas fa-file-code',
    'c': 'fas fa-file-code'
  }
  
  return iconMap[ext] || 'fas fa-file'
}

const getFileColor = (filename) => {
  const ext = filename.split('.').pop()?.toLowerCase()
  
  const colorMap = {
    // Documents
    'pdf': '#dc2626',
    'doc': '#2563eb',
    'docx': '#2563eb',
    'xls': '#059669',
    'xlsx': '#059669',
    'ppt': '#ea580c',
    'pptx': '#ea580c',
    
    // Images
    'jpg': '#7c3aed',
    'jpeg': '#7c3aed',
    'png': '#7c3aed',
    'gif': '#7c3aed',
    'svg': '#7c3aed',
    
    // Videos
    'mp4': '#dc2626',
    'avi': '#dc2626',
    'mkv': '#dc2626',
    
    // Audio
    'mp3': '#059669',
    'wav': '#059669',
    'flac': '#059669',
    
    // Archives
    'zip': '#ca8a04',
    'rar': '#ca8a04',
    '7z': '#ca8a04',
    
    // Code
    'js': '#eab308',
    'html': '#ea580c',
    'css': '#2563eb',
    'php': '#7c3aed',
    'py': '#059669'
  }
  
  return colorMap[ext] || '#6b7280'
}

const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  
  const date = new Date(dateString)
  const now = new Date()
  const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24))
  
  if (diffInDays === 0) return 'Aujourd\'hui'
  if (diffInDays === 1) return 'Hier'
  if (diffInDays < 7) return `Il y a ${diffInDays} jours`
  
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  })
}

const getRelativePath = (fullPath) => {
  if (!fullPath) return ''
  
  const parts = fullPath.split('/')
  if (parts.length <= 2) return '/'
  
  return '/' + parts.slice(1, -1).join('/')
}

const selectFile = (file) => {
  emit('file-selected', file)
}

const downloadFile = async (file) => {
  try {
    const { nasAPI, NASAPIError } = await import('@/services/nasAPI.js')
    const { useStore } = await import('vuex')
    const store = useStore()
    
    store.dispatch('showInfo', `Téléchargement de ${file.name} en cours...`)
    
    const blob = await nasAPI.downloadFile(file.path)
    
    // Create download link
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = file.name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    
    store.dispatch('showSuccess', `Téléchargement de ${file.name} terminé`)
  } catch (err) {
    console.error('Error downloading file:', err)
    const { useStore } = await import('vuex')
    const store = useStore()
    
    if (err.status === 403) {
      store.dispatch('showError', 'Permission refusée pour télécharger ce fichier')
    } else if (err.status === 404) {
      store.dispatch('showError', 'Fichier introuvable')
    } else {
      store.dispatch('showError', `Erreur lors du téléchargement: ${err.message}`)
    }
  }
}

const openFileLocation = (file) => {
  // TODO: Navigate to file location in explorer
  console.log('Open location:', file.path)
}

const showMore = () => {
  displayLimit.value += 5
}
</script>

<style scoped>
.recent-files-widget {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.widget-header {
  @apply flex items-center justify-between mb-4;
}

.widget-title {
  @apply text-lg font-semibold text-base-content flex items-center;
}

.widget-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

/* Table View */
.files-table {
  @apply w-full;
}

.table-header {
  @apply grid grid-cols-12 gap-4 p-3 bg-base-200 rounded-t-lg border-b border-base-300 text-sm font-medium text-base-content/70;
}

.col-name { @apply col-span-5; }
.col-size { @apply col-span-2; }
.col-modified { @apply col-span-3; }
.col-actions { @apply col-span-2; }

.table-body {
  @apply space-y-1;
}

.file-row {
  @apply grid grid-cols-12 gap-4 p-3 hover:bg-base-200 rounded-lg cursor-pointer transition-colors;
}

.file-info {
  @apply flex items-center gap-3;
}

.file-icon {
  @apply text-lg flex-shrink-0;
}

.file-details {
  @apply min-w-0 flex-1;
}

.file-name {
  @apply font-medium text-base-content truncate;
}

.file-path {
  @apply text-xs text-base-content/50 truncate;
}

.file-size,
.file-date {
  @apply text-sm text-base-content/70;
}

.file-actions {
  @apply flex items-center gap-1;
}

/* Card View (Mobile) */
.files-cards {
  @apply space-y-3;
}

.file-card {
  @apply p-4 bg-base-200 rounded-lg hover:bg-base-300 cursor-pointer transition-colors;
}

.file-card-header {
  @apply flex items-center justify-between mb-2;
}

.file-card-content {
  @apply space-y-1;
}

.file-card .file-name {
  @apply font-medium text-base-content;
}

.file-meta {
  @apply flex items-center gap-3 text-sm text-base-content/70;
}

.file-card .file-path {
  @apply text-xs text-base-content/50;
}

/* States */
.loading-state,
.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.show-more {
  @apply mt-4 pt-4 border-t border-base-300;
}
</style>