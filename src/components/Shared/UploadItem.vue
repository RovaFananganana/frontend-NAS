<template>
  <div 
    class="upload-item"
    :class="[
      `status-${upload.status}`,
      { 'has-error': upload.error }
    ]"
  >
    <div class="item-content">
      <!-- File info -->
      <div class="file-info">
        <div class="file-icon">
          <i :class="getFileIcon(upload.fileName)" aria-hidden="true"></i>
        </div>
        
        <div class="file-details">
          <div class="file-name" :title="upload.fileName">
            {{ upload.fileName }}
          </div>
          <div class="file-meta">
            <span class="file-size">{{ formatBytes(upload.fileSize) }}</span>
            <span v-if="upload.relativePath && upload.relativePath !== upload.fileName" class="file-path">
              • {{ getRelativeDirectory(upload.relativePath) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Status and progress -->
      <div class="status-info">
        <!-- Progress bar for uploading files -->
        <div v-if="upload.status === 'uploading'" class="progress-container">
          <div class="progress-bar">
            <div 
              class="progress-fill" 
              :style="{ width: `${upload.progress}%` }"
              :aria-valuenow="upload.progress"
              aria-valuemin="0"
              aria-valuemax="100"
              role="progressbar"
              :aria-label="`Progression: ${Math.round(upload.progress)}%`"
            ></div>
          </div>
          <div class="progress-details">
            <span class="progress-text">{{ Math.round(upload.progress) }}%</span>
            <span v-if="upload.uploadSpeed > 0" class="upload-speed">
              {{ formatBytes(upload.uploadSpeed) }}/s
            </span>
          </div>
        </div>

        <!-- Status indicator -->
        <div class="status-indicator">
          <i 
            :class="getStatusIcon(upload.status)" 
            :title="getStatusText(upload.status)"
            aria-hidden="true"
          ></i>
          <span class="status-text">{{ getStatusText(upload.status) }}</span>
        </div>

        <!-- Error message -->
        <div v-if="upload.error" class="error-message">
          <i class="fas fa-exclamation-triangle mr-1" aria-hidden="true"></i>
          {{ upload.error }}
          <span v-if="upload.retryCount > 0" class="retry-count">
            (tentative {{ upload.retryCount }}/{{ upload.maxRetries }})
          </span>
        </div>

        <!-- Time info -->
        <div v-if="showTimeInfo" class="time-info">
          <span v-if="upload.estimatedTime" class="estimated-time">
            {{ formatTime(upload.estimatedTime) }} restant
          </span>
          <span v-if="upload.endTime" class="completion-time">
            Terminé {{ formatRelativeTime(upload.endTime) }}
          </span>
        </div>
      </div>

      <!-- Actions -->
      <div class="item-actions">
        <button 
          v-if="upload.status === 'pending' || upload.status === 'uploading'"
          @click="$emit('cancel', upload.id)"
          class="btn btn-xs btn-ghost text-error"
          title="Annuler"
          :aria-label="`Annuler l'upload de ${upload.fileName}`"
        >
          <i class="fas fa-times" aria-hidden="true"></i>
        </button>
        
        <button 
          v-if="upload.status === 'error'"
          @click="$emit('retry', upload.id)"
          class="btn btn-xs btn-ghost text-warning"
          title="Réessayer"
          :aria-label="`Réessayer l'upload de ${upload.fileName}`"
        >
          <i class="fas fa-redo" aria-hidden="true"></i>
        </button>
        
        <button 
          v-if="upload.status === 'error' || upload.status === 'cancelled'"
          @click="$emit('cancel', upload.id)"
          class="btn btn-xs btn-ghost text-error"
          title="Supprimer"
          :aria-label="`Supprimer ${upload.fileName} de la liste`"
        >
          <i class="fas fa-trash" aria-hidden="true"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { formatBytes } from '@/utils/fileUtils.js'
import { nasAPI } from '@/services/nasAPI.js'

// Props
const props = defineProps({
  upload: {
    type: Object,
    required: true
  }
})

// Émissions
const emit = defineEmits(['cancel', 'retry'])

// Computed
const showTimeInfo = computed(() => {
  return props.upload.status === 'uploading' || 
         props.upload.status === 'completed' || 
         props.upload.status === 'error'
})

// Methods
const getFileIcon = (fileName) => {
  return nasAPI.getFileIcon(fileName, false)
}

const getRelativeDirectory = (relativePath) => {
  const lastSlashIndex = relativePath.lastIndexOf('/')
  if (lastSlashIndex === -1) return ''
  
  const dirPath = relativePath.substring(0, lastSlashIndex)
  return dirPath || '/'
}

const getStatusIcon = (status) => {
  const iconMap = {
    'pending': 'fas fa-clock text-base-content/50',
    'uploading': 'fas fa-spinner fa-spin text-primary',
    'completed': 'fas fa-check-circle text-success',
    'error': 'fas fa-exclamation-triangle text-error',
    'cancelled': 'fas fa-ban text-base-content/50'
  }
  return iconMap[status] || 'fas fa-question-circle text-base-content/50'
}

const getStatusText = (status) => {
  const textMap = {
    'pending': 'En attente',
    'uploading': 'Upload en cours',
    'completed': 'Terminé',
    'error': 'Erreur',
    'cancelled': 'Annulé'
  }
  return textMap[status] || 'Inconnu'
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

const formatRelativeTime = (timestamp) => {
  if (!timestamp) return ''
  
  const now = Date.now()
  const diff = now - timestamp
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  
  if (hours > 0) {
    return `il y a ${hours}h`
  } else if (minutes > 0) {
    return `il y a ${minutes}m`
  } else {
    return `il y a ${seconds}s`
  }
}
</script>

<style scoped>
.upload-item {
  background: hsl(var(--b1));
  border: 1px solid hsl(var(--b3));
  border-radius: 0.375rem;
  transition: all 0.2s ease;
}

.upload-item:hover {
  background: hsl(var(--b2));
}

.upload-item.status-uploading {
  border-color: hsl(var(--p));
  background: hsl(var(--p) / 0.05);
}

.upload-item.status-completed {
  border-color: hsl(var(--su));
  background: hsl(var(--su) / 0.05);
}

.upload-item.status-error {
  border-color: hsl(var(--er));
  background: hsl(var(--er) / 0.05);
}

.upload-item.status-cancelled {
  opacity: 0.6;
}

.item-content {
  padding: 0.75rem;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  min-width: 0;
}

.file-icon {
  font-size: 1.125rem;
  color: hsl(var(--bc) / 0.7);
  flex-shrink: 0;
}

.file-details {
  flex: 1;
  min-width: 0;
}

.file-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: hsl(var(--bc));
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-meta {
  font-size: 0.75rem;
  color: hsl(var(--bc) / 0.6);
  margin-top: 0.125rem;
}

.file-path {
  font-style: italic;
}

.status-info {
  flex: 1;
  min-width: 0;
}

.progress-container {
  margin-bottom: 0.5rem;
}

.progress-bar {
  width: 100%;
  height: 4px;
  background: hsl(var(--b3));
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 0.25rem;
}

.progress-fill {
  height: 100%;
  background: hsl(var(--p));
  transition: width 0.3s ease;
}

.progress-details {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.75rem;
}

.progress-text {
  font-weight: 500;
  color: hsl(var(--bc));
}

.upload-speed {
  color: hsl(var(--p));
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.75rem;
  margin-bottom: 0.25rem;
}

.status-text {
  font-weight: 500;
}

.error-message {
  font-size: 0.75rem;
  color: hsl(var(--er));
  margin-bottom: 0.25rem;
  display: flex;
  align-items: flex-start;
  gap: 0.25rem;
}

.retry-count {
  font-style: italic;
  opacity: 0.8;
}

.time-info {
  font-size: 0.75rem;
  color: hsl(var(--bc) / 0.6);
}

.estimated-time {
  color: hsl(var(--p));
}

.completion-time {
  color: hsl(var(--su));
}

.item-actions {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex-shrink: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .item-content {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .file-info {
    width: 100%;
  }
  
  .status-info {
    width: 100%;
  }
  
  .item-actions {
    flex-direction: row;
    justify-content: flex-end;
  }
}
</style>