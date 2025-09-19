<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-base-100 p-6 rounded-lg shadow-xl w-[600px] max-w-[90vw]">
      <h3 class="font-bold text-lg mb-4">Télécharger des fichiers</h3>
      
      <div class="mb-4">
        <label class="label">
          <span class="label-text">Destination</span>
        </label>
        <div class="input input-bordered bg-base-200 text-base-content/70">
          {{ currentPath || 'Racine' }}
        </div>
      </div>
      
      <!-- File Drop Zone -->
      <div 
        class="border-2 border-dashed border-base-300 rounded-lg p-8 text-center mb-4 transition-colors"
        :class="{ 
          'border-primary bg-primary/10': dragOver,
          'hover:border-primary hover:bg-primary/5': !dragOver
        }"
        @dragover.prevent="dragOver = true"
        @dragleave.prevent="dragOver = false"
        @drop.prevent="onDrop"
      >
        <div v-if="files.length === 0">
          <i class="fas fa-cloud-upload-alt text-4xl text-base-content/50 mb-4"></i>
          <p class="text-lg mb-2">Glissez-déposez vos fichiers ici</p>
          <p class="text-sm text-base-content/70 mb-4">ou</p>
          <button class="btn btn-primary" @click="$refs.fileInput.click()">
            <i class="fas fa-folder-open mr-2"></i>
            Parcourir les fichiers
          </button>
        </div>
        
        <div v-else>
          <i class="fas fa-files text-4xl text-primary mb-4"></i>
          <p class="text-lg mb-2">{{ files.length }} fichier(s) sélectionné(s)</p>
          <button class="btn btn-outline btn-sm" @click="clearFiles">
            <i class="fas fa-times mr-2"></i>
            Effacer la sélection
          </button>
        </div>
      </div>
      
      <!-- File List -->
      <div v-if="files.length > 0" class="mb-4 max-h-64 overflow-y-auto">
        <div class="text-sm font-semibold mb-2">Fichiers à télécharger :</div>
        <div class="space-y-2">
          <div 
            v-for="(file, index) in files" 
            :key="index"
            class="flex items-center gap-3 p-2 bg-base-200 rounded"
          >
            <i :class="getFileIcon(file.name)" :style="{ color: getFileColor(file.name) }"></i>
            <div class="flex-1">
              <div class="font-medium">{{ file.name }}</div>
              <div class="text-xs text-base-content/70">{{ formatBytes(file.size) }}</div>
            </div>
            <div v-if="uploadProgress[index] !== undefined" class="w-24">
              <div class="text-xs text-center mb-1">{{ uploadProgress[index] }}%</div>
              <progress 
                class="progress progress-primary w-full h-2" 
                :value="uploadProgress[index]" 
                max="100"
              ></progress>
            </div>
            <button 
              v-if="!uploading"
              class="btn btn-xs btn-ghost text-error"
              @click="removeFile(index)"
            >
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>
        
        <div class="mt-4 text-sm text-base-content/70">
          Total : {{ formatBytes(totalSize) }}
        </div>
      </div>
      
      <!-- Upload Options -->
      <div v-if="files.length > 0" class="mb-4">
        <div class="form-control">
          <label class="cursor-pointer label justify-start gap-3">
            <input 
              v-model="overwriteExisting" 
              type="checkbox" 
              class="checkbox checkbox-sm"
            />
            <span class="label-text">Remplacer les fichiers existants</span>
          </label>
        </div>
      </div>
      
      <!-- Error Messages -->
      <div v-if="errors.length > 0" class="alert alert-error mb-4">
        <i class="fas fa-exclamation-triangle"></i>
        <div>
          <div class="font-semibold">Erreurs de téléchargement :</div>
          <ul class="list-disc list-inside text-sm mt-1">
            <li v-for="error in errors" :key="error">{{ error }}</li>
          </ul>
        </div>
      </div>
      
      <!-- Success Message -->
      <div v-if="uploadComplete && errors.length === 0" class="alert alert-success mb-4">
        <i class="fas fa-check-circle"></i>
        <span>Tous les fichiers ont été téléchargés avec succès !</span>
      </div>
      
      <div class="flex justify-end gap-2">
        <button 
          type="button" 
          class="btn btn-outline" 
          @click="$emit('close')"
          :disabled="uploading"
        >
          {{ uploading ? 'Téléchargement...' : 'Annuler' }}
        </button>
        <button 
          class="btn btn-primary"
          :disabled="files.length === 0 || uploading"
          @click="uploadFiles"
        >
          <span v-if="uploading" class="loading loading-spinner loading-sm mr-2"></span>
          <i v-else class="fas fa-upload mr-2"></i>
          {{ uploading ? 'Téléchargement...' : `Télécharger (${files.length})` }}
        </button>
      </div>
      
      <!-- Hidden file input -->
      <input 
        ref="fileInput"
        type="file" 
        multiple 
        class="hidden"
        @change="onFileSelect"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  currentPath: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['close', 'uploaded'])

const files = ref([])
const uploading = ref(false)
const uploadProgress = ref({})
const dragOver = ref(false)
const overwriteExisting = ref(false)
const errors = ref([])
const uploadComplete = ref(false)

const totalSize = computed(() => {
  return files.value.reduce((total, file) => total + file.size, 0)
})

const onFileSelect = (event) => {
  const selectedFiles = Array.from(event.target.files)
  addFiles(selectedFiles)
  event.target.value = '' // Reset input
}

const onDrop = (event) => {
  dragOver.value = false
  const droppedFiles = Array.from(event.dataTransfer.files)
  addFiles(droppedFiles)
}

const addFiles = (newFiles) => {
  // Filter out duplicates and validate files
  const validFiles = newFiles.filter(file => {
    // Check file size (e.g., max 100MB)
    if (file.size > 100 * 1024 * 1024) {
      errors.value.push(`${file.name} : Fichier trop volumineux (max 100MB)`)
      return false
    }
    
    // Check if file already exists in selection
    if (files.value.some(f => f.name === file.name && f.size === file.size)) {
      return false
    }
    
    return true
  })
  
  files.value.push(...validFiles)
}

const removeFile = (index) => {
  files.value.splice(index, 1)
  delete uploadProgress.value[index]
}

const clearFiles = () => {
  files.value = []
  uploadProgress.value = {}
  errors.value = []
  uploadComplete.value = false
}

const uploadFiles = async () => {
  if (files.value.length === 0) return
  
  uploading.value = true
  errors.value = []
  uploadComplete.value = false
  
  try {
    const uploadPromises = files.value.map((file, index) => uploadFile(file, index))
    await Promise.all(uploadPromises)
    
    if (errors.value.length === 0) {
      uploadComplete.value = true
      setTimeout(() => {
        emit('uploaded')
        emit('close')
      }, 1500)
    }
  } catch (err) {
    console.error('Upload error:', err)
    errors.value.push('Erreur générale lors du téléchargement')
  } finally {
    uploading.value = false
  }
}

const uploadFile = async (file, index) => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('path', props.currentPath || '/')
  formData.append('overwrite', overwriteExisting.value)
  
  try {
    // Simulate progress for now (real progress tracking would need server-sent events or websockets)
    uploadProgress.value[index] = 0
    const progressInterval = setInterval(() => {
      if (uploadProgress.value[index] < 90) {
        uploadProgress.value[index] += 10
      }
    }, 100)
    
    const response = await fetch('/nas/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: formData
    })
    
    clearInterval(progressInterval)
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `Erreur lors du téléchargement de ${file.name}`)
    }
    
    const result = await response.json()
    if (!result.success) {
      throw new Error(result.error || `Erreur lors du téléchargement de ${file.name}`)
    }
    
    uploadProgress.value[index] = 100
  } catch (err) {
    console.error(`Error uploading ${file.name}:`, err)
    errors.value.push(`${file.name} : ${err.message}`)
  }
}

// Utility functions
const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const getFileIcon = (filename) => {
  const ext = filename?.split('.').pop()?.toLowerCase() || ''
  const iconMap = {
    'pdf': 'fas fa-file-pdf',
    'doc': 'fas fa-file-word',
    'docx': 'fas fa-file-word',
    'xls': 'fas fa-file-excel',
    'xlsx': 'fas fa-file-excel',
    'jpg': 'fas fa-file-image',
    'jpeg': 'fas fa-file-image',
    'png': 'fas fa-file-image',
    'gif': 'fas fa-file-image',
    'mp4': 'fas fa-file-video',
    'avi': 'fas fa-file-video',
    'mp3': 'fas fa-file-audio',
    'wav': 'fas fa-file-audio',
    'zip': 'fas fa-file-archive',
    'rar': 'fas fa-file-archive',
    'txt': 'fas fa-file-alt',
    'js': 'fas fa-file-code',
    'html': 'fas fa-file-code',
    'css': 'fas fa-file-code'
  }
  return iconMap[ext] || 'fas fa-file'
}

const getFileColor = (filename) => {
  const ext = filename?.split('.').pop()?.toLowerCase() || ''
  const colorMap = {
    'pdf': '#dc2626',
    'doc': '#2563eb',
    'docx': '#2563eb',
    'xls': '#059669',
    'xlsx': '#059669',
    'jpg': '#7c3aed',
    'jpeg': '#7c3aed',
    'png': '#7c3aed',
    'gif': '#7c3aed',
    'mp4': '#dc2626',
    'avi': '#dc2626',
    'mp3': '#059669',
    'wav': '#059669',
    'zip': '#6b7280',
    'rar': '#6b7280',
    'txt': '#374151',
    'js': '#f59e0b',
    'html': '#f59e0b',
    'css': '#f59e0b'
  }
  return colorMap[ext] || '#6b7280'
}
</script>