<template>
  <div 
    v-if="showPanel" 
    class="upload-progress-panel"
    :class="{ 'minimized': isMinimized }"
    role="region"
    aria-label="Panneau de progression des uploads"
  >
    <!-- Header -->
    <div class="panel-header">
      <div class="header-content">
        <div class="header-info">
          <i class="fas fa-cloud-upload-alt header-icon" aria-hidden="true"></i>
          <div class="header-text">
            <h3 class="header-title">
              Uploads en cours
              <span v-if="stats.totalFiles > 0" class="file-count">
                ({{ stats.completedFiles + stats.failedFiles }}/{{ stats.totalFiles }})
              </span>
            </h3>
            <div v-if="!isMinimized && stats.totalFiles > 0" class="header-subtitle">
              {{ formatBytes(stats.uploadedBytes) }} / {{ formatBytes(stats.totalBytes) }}
              <span v-if="uploadSpeed > 0" class="upload-speed">
                • {{ formatBytes(uploadSpeed) }}/s
              </span>
              <span v-if="estimatedTimeRemaining" class="time-remaining">
                • {{ formatTime(estimatedTimeRemaining) }} restant
              </span>
            </div>
          </div>
        </div>
        
        <div class="header-actions">
          <!-- Overall progress -->
          <div v-if="!isMinimized && stats.totalFiles > 0" class="overall-progress">
            <div class="progress-bar">
              <div 
                class="progress-fill" 
                :style="{ width: `${overallProgress}%` }"
                :aria-valuenow="overallProgress"
                aria-valuemin="0"
                aria-valuemax="100"
                role="progressbar"
                :aria-label="`Progression globale: ${Math.round(overallProgress)}%`"
              ></div>
            </div>
            <span class="progress-text">{{ Math.round(overallProgress) }}%</span>
          </div>
          
          <!-- Control buttons -->
          <div class="control-buttons">
            <button 
              v-if="isProcessing && !isPaused"
              @click="pauseUploads"
              class="btn btn-sm btn-ghost"
              title="Mettre en pause"
              aria-label="Mettre en pause les uploads"
            >
              <i class="fas fa-pause" aria-hidden="true"></i>
            </button>
            
            <button 
              v-if="isPaused"
              @click="resumeUploads"
              class="btn btn-sm btn-ghost"
              title="Reprendre"
              aria-label="Reprendre les uploads"
            >
              <i class="fas fa-play" aria-hidden="true"></i>
            </button>
            
            <button 
              @click="toggleMinimize"
              class="btn btn-sm btn-ghost"
              :title="isMinimized ? 'Agrandir' : 'Réduire'"
              :aria-label="isMinimized ? 'Agrandir le panneau' : 'Réduire le panneau'"
            >
              <i :class="isMinimized ? 'fas fa-chevron-up' : 'fas fa-chevron-down'" aria-hidden="true"></i>
            </button>
            
            <button 
              v-if="!isProcessing"
              @click="closePanel"
              class="btn btn-sm btn-ghost"
              title="Fermer"
              aria-label="Fermer le panneau"
            >
              <i class="fas fa-times" aria-hidden="true"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Upload list -->
    <div v-if="!isMinimized" class="upload-list">
      <!-- Active uploads -->
      <div v-if="activeUploads.length > 0" class="upload-section">
        <h4 class="section-title">
          <i class="fas fa-spinner fa-spin mr-2" aria-hidden="true"></i>
          En cours ({{ activeUploads.length }})
        </h4>
        <div class="upload-items">
          <UploadItem 
            v-for="upload in activeUploads" 
            :key="upload.id"
            :upload="upload"
            @cancel="cancelUpload"
          />
        </div>
      </div>

      <!-- Queued uploads -->
      <div v-if="queuedUploads.length > 0" class="upload-section">
        <h4 class="section-title">
          <i class="fas fa-clock mr-2" aria-hidden="true"></i>
          En attente ({{ queuedUploads.length }})
        </h4>
        <div class="upload-items">
          <UploadItem 
            v-for="upload in queuedUploads.slice(0, 5)" 
            :key="upload.id"
            :upload="upload"
            @cancel="cancelUpload"
          />
          <div v-if="queuedUploads.length > 5" class="more-items">
            et {{ queuedUploads.length - 5 }} autres...
          </div>
        </div>
      </div>

      <!-- Failed uploads -->
      <div v-if="failedUploads.length > 0" class="upload-section">
        <h4 class="section-title">
          <i class="fas fa-exclamation-triangle mr-2 text-error" aria-hidden="true"></i>
          Échecs ({{ failedUploads.length }})
        </h4>
        <div class="upload-items">
          <UploadItem 
            v-for="upload in failedUploads" 
            :key="upload.id"
            :upload="upload"
            @retry="retryUpload"
            @cancel="removeFailedUpload"
          />
        </div>
      </div>

      <!-- Completed uploads (recent) -->
      <div v-if="recentCompletedUploads.length > 0" class="upload-section">
        <h4 class="section-title">
          <i class="fas fa-check-circle mr-2 text-success" aria-hidden="true"></i>
          Terminés récemment ({{ recentCompletedUploads.length }})
        </h4>
        <div class="upload-items">
          <UploadItem 
            v-for="upload in recentCompletedUploads" 
            :key="upload.id"
            :upload="upload"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { uploadService } from '@/services/uploadService.js'
import { formatBytes } from '@/utils/fileUtils.js'
import UploadItem from './UploadItem.vue'

// Props
const props = defineProps({
  autoShow: {
    type: Boolean,
    default: true
  },
  autoHide: {
    type: Boolean,
    default: true
  },
  maxRecentItems: {
    type: Number,
    default: 5
  }
})

// Émissions
const emit = defineEmits(['close', 'minimize', 'maximize'])

// État local
const isMinimized = ref(false)
const showPanel = ref(false)

// Computed properties from upload service
const stats = computed(() => uploadService.stats)
const overallProgress = computed(() => uploadService.overallProgress)
const uploadSpeed = computed(() => uploadService.uploadSpeed)
const estimatedTimeRemaining = computed(() => uploadService.estimatedTimeRemaining)
const isProcessing = computed(() => uploadService.isProcessing.value)
const isPaused = computed(() => uploadService.isPaused.value)

const activeUploads = computed(() => uploadService.activeUploads.value)
const queuedUploads = computed(() => uploadService.queue.value)
const failedUploads = computed(() => uploadService.failedUploads.value)
const completedUploads = computed(() => uploadService.completedUploads.value)

// Recent completed uploads (last 5 minutes)
const recentCompletedUploads = computed(() => {
  const fiveMinutesAgo = Date.now() - (5 * 60 * 1000)
  return completedUploads.value
    .filter(upload => upload.endTime && upload.endTime > fiveMinutesAgo)
    .slice(-props.maxRecentItems)
})

// Show panel when there are uploads
watch([activeUploads, queuedUploads], ([active, queued]) => {
  if (props.autoShow && (active.length > 0 || queued.length > 0)) {
    showPanel.value = true
  }
}, { immediate: true })

// Auto-hide when all uploads are done
watch([activeUploads, queuedUploads, failedUploads], ([active, queued, failed]) => {
  if (props.autoHide && active.length === 0 && queued.length === 0 && failed.length === 0) {
    // Hide after a delay to show completion
    setTimeout(() => {
      if (activeUploads.value.length === 0 && queuedUploads.value.length === 0) {
        showPanel.value = false
      }
    }, 3000)
  }
})

// Methods
const toggleMinimize = () => {
  isMinimized.value = !isMinimized.value
  emit(isMinimized.value ? 'minimize' : 'maximize')
}

const closePanel = () => {
  showPanel.value = false
  emit('close')
}

const pauseUploads = () => {
  uploadService.pause()
}

const resumeUploads = () => {
  uploadService.resume()
}

const cancelUpload = (uploadId) => {
  uploadService.cancel(uploadId)
}

const retryUpload = (uploadId) => {
  uploadService.retry(uploadId)
}

const removeFailedUpload = (uploadId) => {
  const index = uploadService.failedUploads.value.findIndex(item => item.id === uploadId)
  if (index !== -1) {
    uploadService.failedUploads.value.splice(index, 1)
  }
}

const formatTime = (milliseconds) => {
  if (!milliseconds || milliseconds <= 0) return ''
  
  const seconds = Math.floor(milliseconds / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`
  } else {
    return `${seconds}s`
  }
}

// Public methods
const show = () => {
  showPanel.value = true
}

const hide = () => {
  showPanel.value = false
}

const minimize = () => {
  isMinimized.value = true
}

const maximize = () => {
  isMinimized.value = false
}

// Expose public methods
defineExpose({
  show,
  hide,
  minimize,
  maximize
})
</script>

<style scoped>
.upload-progress-panel {
  position: fixed;
  bottom: 1rem;
  right: 1rem;
  width: 400px;
  max-height: 500px;
  background: hsl(var(--b1));
  border: 1px solid hsl(var(--b3));
  border-radius: 0.5rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  transition: all 0.3s ease;
}

.upload-progress-panel.minimized {
  max-height: 80px;
}

.panel-header {
  padding: 1rem;
  border-bottom: 1px solid hsl(var(--b3));
  background: hsl(var(--b2));
  border-radius: 0.5rem 0.5rem 0 0;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.header-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
  min-width: 0;
}

.header-icon {
  font-size: 1.25rem;
  color: hsl(var(--p));
}

.header-text {
  flex: 1;
  min-width: 0;
}

.header-title {
  font-size: 0.875rem;
  font-weight: 600;
  margin: 0;
  color: hsl(var(--bc));
}

.file-count {
  font-weight: 400;
  color: hsl(var(--bc) / 0.7);
}

.header-subtitle {
  font-size: 0.75rem;
  color: hsl(var(--bc) / 0.6);
  margin-top: 0.25rem;
}

.upload-speed,
.time-remaining {
  color: hsl(var(--p));
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.overall-progress {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 80px;
}

.progress-bar {
  width: 60px;
  height: 6px;
  background: hsl(var(--b3));
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: hsl(var(--p));
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 0.75rem;
  font-weight: 500;
  color: hsl(var(--bc));
  min-width: 35px;
  text-align: right;
}

.control-buttons {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.upload-list {
  max-height: 400px;
  overflow-y: auto;
}

.upload-section {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid hsl(var(--b3));
}

.upload-section:last-child {
  border-bottom: none;
}

.section-title {
  font-size: 0.75rem;
  font-weight: 600;
  color: hsl(var(--bc) / 0.8);
  margin: 0 0 0.5rem 0;
  display: flex;
  align-items: center;
}

.upload-items {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.more-items {
  font-size: 0.75rem;
  color: hsl(var(--bc) / 0.6);
  text-align: center;
  padding: 0.5rem;
  font-style: italic;
}

/* Responsive */
@media (max-width: 768px) {
  .upload-progress-panel {
    width: calc(100vw - 2rem);
    right: 1rem;
    left: 1rem;
  }
  
  .header-content {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }
  
  .header-actions {
    justify-content: space-between;
  }
}

/* Scrollbar styling */
.upload-list::-webkit-scrollbar {
  width: 6px;
}

.upload-list::-webkit-scrollbar-track {
  background: hsl(var(--b2));
}

.upload-list::-webkit-scrollbar-thumb {
  background: hsl(var(--b3));
  border-radius: 3px;
}

.upload-list::-webkit-scrollbar-thumb:hover {
  background: hsl(var(--bc) / 0.3);
}
</style>