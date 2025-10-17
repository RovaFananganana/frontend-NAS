<template>
  <div v-if="isVisible" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold">Copie en cours</h3>
        <button 
          v-if="canClose" 
          @click="close" 
          class="text-gray-400 hover:text-gray-600"
        >
          <i class="fas fa-times"></i>
        </button>
      </div>
      
      <div class="space-y-4">
        <!-- Progression globale -->
        <div v-if="progress">
          <div class="flex justify-between text-sm text-gray-600 mb-1">
            <span>Progression globale</span>
            <span>{{ progress.overallProgress || 0 }}%</span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-2">
            <div 
              class="bg-blue-600 h-2 rounded-full transition-all duration-300"
              :style="{ width: `${progress.overallProgress || 0}%` }"
            ></div>
          </div>
        </div>
        
        <!-- Élément actuel -->
        <div v-if="progress && progress.currentPath">
          <div class="text-sm text-gray-600 mb-2">
            Élément {{ progress.currentItem || 1 }} sur {{ progress.totalItems || 1 }}
          </div>
          <div class="text-sm font-medium truncate" :title="progress.currentPath">
            {{ getFileName(progress.currentPath) }}
          </div>
          
          <!-- Progression de l'élément actuel -->
          <div v-if="progress.currentItemProgress && progress.currentItemProgress.progress !== undefined">
            <div class="flex justify-between text-xs text-gray-500 mt-1 mb-1">
              <span>{{ progress.currentItemProgress.status || 'En cours' }}</span>
              <span>{{ progress.currentItemProgress.progress || 0 }}%</span>
            </div>
            <div class="w-full bg-gray-100 rounded-full h-1">
              <div 
                class="bg-green-500 h-1 rounded-full transition-all duration-300"
                :style="{ width: `${progress.currentItemProgress.progress || 0}%` }"
              ></div>
            </div>
          </div>
        </div>
        
        <!-- Statut -->
        <div v-if="progress && progress.status" class="text-sm">
          <span 
            class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
            :class="getStatusClass(progress.status)"
          >
            <i :class="getStatusIcon(progress.status)" class="mr-1"></i>
            {{ getStatusText(progress.status) }}
          </span>
        </div>
        
        <!-- Erreurs -->
        <div v-if="errors && errors.length > 0" class="mt-4">
          <div class="text-sm font-medium text-red-600 mb-2">
            Erreurs ({{ errors.length }})
          </div>
          <div class="max-h-32 overflow-y-auto space-y-1">
            <div 
              v-for="(error, index) in errors" 
              :key="index"
              class="text-xs text-red-600 bg-red-50 p-2 rounded"
            >
              {{ error }}
            </div>
          </div>
        </div>
        
        <!-- Actions -->
        <div class="flex justify-end space-x-2 mt-6">
          <button 
            v-if="canClose" 
            @click="close"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  isVisible: {
    type: Boolean,
    default: false
  },
  progress: {
    type: Object,
    default: null
  },
  errors: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['close'])

const canClose = computed(() => {
  return !props.progress || 
         props.progress.status === 'completed' || 
         props.progress.status === 'failed'
})

const close = () => {
  emit('close')
}

const getFileName = (path) => {
  if (!path) return ''
  return path.split('/').pop() || path
}

const getStatusClass = (status) => {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800'
    case 'failed':
      return 'bg-red-100 text-red-800'
    case 'processing':
    default:
      return 'bg-blue-100 text-blue-800'
  }
}

const getStatusIcon = (status) => {
  switch (status) {
    case 'completed':
      return 'fas fa-check'
    case 'failed':
      return 'fas fa-exclamation-triangle'
    case 'processing':
    default:
      return 'fas fa-spinner fa-spin'
  }
}

const getStatusText = (status) => {
  switch (status) {
    case 'completed':
      return 'Terminé'
    case 'failed':
      return 'Échec'
    case 'processing':
    default:
      return 'En cours'
  }
}
</script>