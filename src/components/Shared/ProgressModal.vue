<template>
  <div v-if="show" class="modal modal-open">
    <div class="modal-box max-w-md">
      <!-- Header -->
      <div class="flex items-center justify-between mb-4">
        <h3 class="font-bold text-lg flex items-center gap-2">
          <i :class="iconClass" class="text-primary"></i>
          {{ title }}
        </h3>
        <div class="flex items-center gap-2">
          <button 
            v-if="canMinimize && !isMinimized"
            @click="minimize"
            class="btn btn-ghost btn-sm"
            title="Réduire"
          >
            <i class="fas fa-minus"></i>
          </button>
          <button 
            v-if="canCancel && !isCompleted"
            @click="cancel"
            class="btn btn-ghost btn-sm"
            title="Annuler"
          >
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>

      <!-- Progress Section -->
      <div v-if="!isMinimized" class="space-y-4">
        <!-- Current operation -->
        <div v-if="currentOperation" class="text-sm text-base-content/70">
          {{ currentOperation }}
        </div>

        <!-- Progress bar -->
        <div class="space-y-2">
          <div class="flex justify-between text-sm">
            <span>{{ progressText }}</span>
            <span>{{ Math.round(progress) }}%</span>
          </div>
          <progress 
            class="progress progress-primary w-full" 
            :value="progress" 
            max="100"
          ></progress>
        </div>

        <!-- Speed and time info -->
        <div v-if="showDetails" class="flex justify-between text-xs text-base-content/60">
          <span v-if="speed">{{ formatBytes(speed) }}/s</span>
          <span v-if="timeRemaining">{{ formatTime(timeRemaining) }} restant</span>
        </div>

        <!-- File details -->
        <div v-if="fileInfo" class="bg-base-200 p-3 rounded-lg text-sm">
          <div class="flex items-center gap-2 mb-2">
            <i class="fas fa-file text-primary"></i>
            <span class="font-medium truncate">{{ fileInfo.name }}</span>
          </div>
          <div class="flex justify-between text-xs text-base-content/60">
            <span>{{ formatBytes(fileInfo.transferred) }} / {{ formatBytes(fileInfo.total) }}</span>
            <span>{{ fileInfo.type }}</span>
          </div>
        </div>

        <!-- Error message -->
        <div v-if="error" class="alert alert-error">
          <i class="fas fa-exclamation-triangle"></i>
          <span>{{ error }}</span>
        </div>

        <!-- Success message -->
        <div v-if="isCompleted && !error" class="alert alert-success">
          <i class="fas fa-check-circle"></i>
          <span>{{ successMessage || 'Opération terminée avec succès !' }}</span>
        </div>

        <!-- Actions -->
        <div class="modal-action">
          <button 
            v-if="error && canRetry"
            @click="retry"
            class="btn btn-primary"
          >
            <i class="fas fa-redo mr-2"></i>
            Réessayer
          </button>
          <button 
            v-if="isCompleted || error"
            @click="close"
            class="btn btn-ghost"
          >
            Fermer
          </button>
          <button 
            v-if="!isCompleted && !error && canCancel"
            @click="cancel"
            class="btn btn-error"
          >
            Annuler
          </button>
        </div>
      </div>

      <!-- Minimized view -->
      <div v-else class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <progress 
            class="progress progress-primary w-20" 
            :value="progress" 
            max="100"
          ></progress>
          <span class="text-sm">{{ Math.round(progress) }}%</span>
        </div>
        <button 
          @click="maximize"
          class="btn btn-ghost btn-sm"
          title="Agrandir"
        >
          <i class="fas fa-chevron-up"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { formatBytes } from '@/utils/fileUtils.js'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: 'Opération en cours'
  },
  iconClass: {
    type: String,
    default: 'fas fa-spinner fa-spin'
  },
  progress: {
    type: Number,
    default: 0
  },
  progressText: {
    type: String,
    default: ''
  },
  currentOperation: {
    type: String,
    default: ''
  },
  speed: {
    type: Number,
    default: 0
  },
  timeRemaining: {
    type: Number,
    default: 0
  },
  fileInfo: {
    type: Object,
    default: null
  },
  error: {
    type: String,
    default: ''
  },
  successMessage: {
    type: String,
    default: ''
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  canCancel: {
    type: Boolean,
    default: true
  },
  canRetry: {
    type: Boolean,
    default: true
  },
  canMinimize: {
    type: Boolean,
    default: true
  },
  showDetails: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['close', 'cancel', 'retry', 'minimize', 'maximize'])

const isMinimized = ref(false)

const minimize = () => {
  isMinimized.value = true
  emit('minimize')
}

const maximize = () => {
  isMinimized.value = false
  emit('maximize')
}

const close = () => {
  emit('close')
}

const cancel = () => {
  emit('cancel')
}

const retry = () => {
  emit('retry')
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
</script>