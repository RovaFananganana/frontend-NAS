<template>
  <div class="modal modal-open">
    <div class="modal-box max-w-2xl">
      <h3 class="font-bold text-lg mb-4">
        <i class="fas fa-upload mr-2"></i>
        Téléverser des fichiers
      </h3>

      <!-- Zone de drop -->
      <div 
        ref="dropZone"
        :class="[
          'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
          isDragOver ? 'border-primary bg-primary/10' : 'border-base-300'
        ]"
        @dragover.prevent="handleDragOver"
        @dragleave.prevent="handleDragLeave"
        @drop.prevent="handleDrop"
      >
        <i class="fas fa-cloud-upload-alt text-4xl text-base-content/50 mb-4"></i>
        <p class="text-lg font-medium mb-2">
          Glissez-déposez vos fichiers ici
        </p>
        <p class="text-sm text-base-content/70 mb-4">
          ou cliquez pour sélectionner des fichiers
        </p>
        <input
          ref="fileInput"
          type="file"
          multiple
          class="hidden"
          @change="handleFileSelect"
        >
        <button 
          @click="$refs.fileInput.click()"
          class="btn btn-primary"
        >
          <i class="fas fa-folder-open mr-2"></i>
          Sélectionner des fichiers
        </button>
      </div>

      <!-- Liste des fichiers sélectionnés -->
      <div v-if="selectedFiles.length > 0" class="mt-6">
        <h4 class="font-semibold mb-3">
          Fichiers sélectionnés ({{ selectedFiles.length }})
        </h4>
        <div class="space-y-2 max-h-60 overflow-y-auto">
          <div 
            v-for="(file, index) in selectedFiles" 
            :key="index"
            class="flex items-center justify-between p-3 bg-base-100 rounded-lg"
          >
            <div class="flex items-center gap-3">
              <i class="fas fa-file text-base-content/70"></i>
              <div>
                <div class="font-medium">{{ file.name }}</div>
                <div class="text-sm text-base-content/70">
                  {{ formatFileSize(file.size) }}
                </div>
              </div>
            </div>
            <button 
              @click="removeFile(index)"
              class="btn btn-sm btn-ghost text-error"
            >
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- Progression d'upload -->
      <div v-if="uploading" class="mt-6">
        <div class="flex items-center justify-between mb-2">
          <span class="font-medium">Upload en cours...</span>
          <span class="text-sm">{{ Math.round(uploadProgress) }}%</span>
        </div>
        <progress 
          class="progress progress-primary w-full" 
          :value="uploadProgress" 
          max="100"
        ></progress>
        <div class="text-sm text-base-content/70 mt-1">
          {{ currentUploadFile }}
        </div>
      </div>

      <!-- Actions -->
      <div class="modal-action">
        <button 
          @click="$emit('close')" 
          class="btn btn-ghost"
          :disabled="uploading"
        >
          Annuler
        </button>
        <button 
          @click="startUpload"
          class="btn btn-primary"
          :disabled="selectedFiles.length === 0 || uploading"
        >
          <i class="fas fa-upload mr-2"></i>
          Téléverser {{ selectedFiles.length }} fichier(s)
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { nasAPI } from '@/services/nasAPI.js'
import { formatBytes } from '@/utils/fileUtils.js'

// Props
const props = defineProps({
  currentPath: {
    type: String,
    required: true
  }
})

// Émissions
const emit = defineEmits(['close', 'uploaded'])

// État
const selectedFiles = ref([])
const uploading = ref(false)
const uploadProgress = ref(0)
const currentUploadFile = ref('')
const isDragOver = ref(false)

// Références
const dropZone = ref(null)
const fileInput = ref(null)

// Méthodes
const formatFileSize = (bytes) => formatBytes(bytes)

const handleFileSelect = (event) => {
  const files = Array.from(event.target.files)
  selectedFiles.value = [...selectedFiles.value, ...files]
}

const removeFile = (index) => {
  selectedFiles.value.splice(index, 1)
}

const handleDragOver = (event) => {
  event.preventDefault()
  isDragOver.value = true
}

const handleDragLeave = (event) => {
  event.preventDefault()
  isDragOver.value = false
}

const handleDrop = (event) => {
  event.preventDefault()
  isDragOver.value = false
  
  const files = Array.from(event.dataTransfer.files)
  selectedFiles.value = [...selectedFiles.value, ...files]
}

const startUpload = async () => {
  if (selectedFiles.value.length === 0) return
  
  uploading.value = true
  uploadProgress.value = 0
  
  try {
    for (let i = 0; i < selectedFiles.value.length; i++) {
      const file = selectedFiles.value[i]
      currentUploadFile.value = file.name
      
      await nasAPI.uploadFile(file, props.currentPath, false, (progress) => {
        const fileProgress = (i / selectedFiles.value.length) * 100 + (progress / selectedFiles.value.length)
        uploadProgress.value = fileProgress
      })
    }
    
    emit('uploaded', {
      count: selectedFiles.value.length,
      path: props.currentPath
    })
    
    emit('close')
  } catch (error) {
    console.error('Erreur lors de l\'upload:', error)
    // Émettre l'erreur pour que le parent puisse l'afficher
    emit('error', error)
  } finally {
    uploading.value = false
    uploadProgress.value = 0
    currentUploadFile.value = ''
  }
}

// Gestion des événements clavier
const handleKeydown = (event) => {
  if (event.key === 'Escape' && !uploading.value) {
    emit('close')
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.modal-box {
  max-height: 90vh;
  overflow-y: auto;
}

.progress {
  height: 8px;
}
</style>