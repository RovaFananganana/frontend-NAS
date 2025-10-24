<!-- components/Shared/UploadProgressModal.vue -->
<template>
  <div v-if="show" class="modal modal-open">
    <div class="modal-box max-w-2xl">
      <h3 class="font-bold text-lg mb-4">
        <i class="fas fa-cloud-upload-alt mr-2"></i>
        Upload en cours
      </h3>

      <!-- Upload global progress -->
      <div class="mb-6">
        <div class="flex justify-between items-center mb-2">
          <span class="text-sm font-medium">Progression globale</span>
          <span class="text-sm text-base-content/70">{{ completedFiles }}/{{ totalFiles }} fichiers</span>
        </div>
        <div class="w-full bg-base-200 rounded-full h-2">
          <div 
            class="bg-primary h-2 rounded-full transition-all duration-300" 
            :style="{ width: globalProgress + '%' }"
          ></div>
        </div>
        <div class="text-xs text-base-content/50 mt-1">{{ globalProgress.toFixed(1) }}%</div>
      </div>

      <!-- Individual file progress -->
      <div class="space-y-3 max-h-64 overflow-y-auto">
        <div 
          v-for="upload in uploads" 
          :key="upload.id"
          class="border border-base-200 rounded-lg p-3"
          :class="{
            'bg-success/10 border-success/30': upload.status === 'completed',
            'bg-error/10 border-error/30': upload.status === 'error',
            'bg-base-100': upload.status === 'uploading' || upload.status === 'pending'
          }"
        >
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-2 flex-1 min-w-0">
              <i class="fas" :class="{
                'fa-file text-base-content/70': upload.status === 'pending',
                'fa-spinner fa-spin text-primary': upload.status === 'uploading',
                'fa-check-circle text-success': upload.status === 'completed',
                'fa-exclamation-circle text-error': upload.status === 'error'
              }"></i>
              <div class="flex-1 min-w-0">
                <div class="font-medium text-sm truncate" :title="upload.fileName">
                  {{ upload.fileName }}
                </div>
                <div class="text-xs text-base-content/50">
                  {{ formatBytes(upload.fileSize) }}
                  <span v-if="upload.status === 'uploading' && upload.speed > 0">
                    • {{ formatBytes(upload.speed) }}/s
                  </span>
                  <span v-if="upload.status === 'uploading' && upload.estimatedTime > 0">
                    • {{ formatTime(upload.estimatedTime) }} restant
                  </span>
                </div>
              </div>
            </div>
            <div class="text-right">
              <div class="text-sm font-medium">
                {{ upload.progress.toFixed(1) }}%
              </div>
              <button 
                v-if="upload.status === 'error'" 
                @click="retryUpload(upload.id)"
                class="btn btn-xs btn-outline btn-error mt-1"
              >
                <i class="fas fa-redo mr-1"></i>
                Réessayer
              </button>
            </div>
          </div>
          
          <!-- Progress bar -->
          <div class="w-full bg-base-200 rounded-full h-1.5">
            <div 
              class="h-1.5 rounded-full transition-all duration-300"
              :class="{
                'bg-primary': upload.status === 'uploading',
                'bg-success': upload.status === 'completed',
                'bg-error': upload.status === 'error'
              }"
              :style="{ width: upload.progress + '%' }"
            ></div>
          </div>
          
          <!-- Error message -->
          <div v-if="upload.status === 'error' && upload.error" class="mt-2">
            <div class="text-xs text-error bg-error/10 p-2 rounded">
              {{ upload.error }}
            </div>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="modal-action">
        <button 
          v-if="allCompleted"
          @click="close" 
          class="btn btn-primary"
        >
          <i class="fas fa-check mr-2"></i>
          Terminé
        </button>
        <button 
          v-else
          @click="cancelAllUploads" 
          class="btn btn-outline"
        >
          <i class="fas fa-times mr-2"></i>
          Annuler tout
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  uploads: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['close', 'retry-upload', 'cancel-all'])

// Computed properties
const totalFiles = computed(() => props.uploads.length)

const completedFiles = computed(() => 
  props.uploads.filter(upload => upload.status === 'completed').length
)

const globalProgress = computed(() => {
  if (totalFiles.value === 0) return 0
  
  const totalProgress = props.uploads.reduce((sum, upload) => sum + upload.progress, 0)
  return totalProgress / totalFiles.value
})

const allCompleted = computed(() => 
  props.uploads.length > 0 && props.uploads.every(upload => 
    upload.status === 'completed' || upload.status === 'error'
  )
)

// Methods
const formatBytes = (bytes) => {
  if (!bytes || bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatTime = (seconds) => {
  if (!seconds || seconds <= 0) return '0s'
  
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`
  } else {
    return `${secs}s`
  }
}

const retryUpload = (uploadId) => {
  emit('retry-upload', uploadId)
}

const cancelAllUploads = () => {
  emit('cancel-all')
}

const close = () => {
  emit('close')
}
</script>

<style scoped>
/* Custom scrollbar for upload list */
.max-h-64::-webkit-scrollbar {
  width: 6px;
}

.max-h-64::-webkit-scrollbar-track {
  background: hsl(var(--b2));
  border-radius: 3px;
}

.max-h-64::-webkit-scrollbar-thumb {
  background: hsl(var(--bc) / 0.3);
  border-radius: 3px;
}

.max-h-64::-webkit-scrollbar-thumb:hover {
  background: hsl(var(--bc) / 0.5);
}
</style>