<template>
  <div 
    ref="dropZone"
    :class="[
      'drag-drop-zone',
      {
        'drag-over': isDragOver,
        'uploading': isUploading,
        'disabled': disabled
      }
    ]"
    @dragenter.prevent="handleDragEnter"
    @dragover.prevent="handleDragOver"
    @dragleave.prevent="handleDragLeave"
    @drop.prevent="handleDrop"
  >
    <!-- Slot pour le contenu normal -->
    <slot 
      :isDragOver="isDragOver" 
      :isUploading="isUploading"
      :uploadProgress="uploadProgress"
    />
    
    <!-- Overlay de drop -->
    <div 
      v-if="isDragOver && !disabled" 
      class="drop-overlay"
      role="status"
      aria-live="polite"
      :aria-label="dropMessage"
    >
      <div class="drop-content">
        <i class="fas fa-cloud-upload-alt drop-icon" aria-hidden="true"></i>
        <p class="drop-message">{{ dropMessage }}</p>
        <p v-if="allowedTypes.length > 0" class="drop-hint">
          Types acceptés: {{ allowedTypes.join(', ') }}
        </p>
      </div>
    </div>

    <!-- Overlay de progression d'upload -->
    <div 
      v-if="isUploading && showProgress" 
      class="upload-overlay"
      role="status"
      aria-live="polite"
      aria-label="Upload en cours"
    >
      <div class="upload-content">
        <i class="fas fa-spinner fa-spin upload-icon" aria-hidden="true"></i>
        <p class="upload-message">{{ uploadMessage }}</p>
        <div v-if="uploadProgress !== null" class="upload-progress">
          <div class="progress-bar">
            <div 
              class="progress-fill" 
              :style="{ width: `${uploadProgress}%` }"
              :aria-valuenow="uploadProgress"
              aria-valuemin="0"
              aria-valuemax="100"
              role="progressbar"
            ></div>
          </div>
          <span class="progress-text">{{ Math.round(uploadProgress) }}%</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

// Props
const props = defineProps({
  // Chemin de destination pour les uploads
  targetPath: {
    type: String,
    required: true
  },
  
  // Types de fichiers acceptés (extensions)
  allowedTypes: {
    type: Array,
    default: () => []
  },
  
  // Taille maximale des fichiers en bytes
  maxFileSize: {
    type: Number,
    default: 100 * 1024 * 1024 // 100MB par défaut
  },
  
  // Nombre maximum de fichiers simultanés
  maxFiles: {
    type: Number,
    default: 10
  },
  
  // Désactiver le drag & drop
  disabled: {
    type: Boolean,
    default: false
  },
  
  // Afficher la progression d'upload
  showProgress: {
    type: Boolean,
    default: true
  },
  
  // Message personnalisé pour le drop
  dropMessage: {
    type: String,
    default: 'Déposez vos fichiers ici'
  },
  
  // Message personnalisé pour l'upload
  uploadMessage: {
    type: String,
    default: 'Upload en cours...'
  },
  
  // Accepter les dossiers
  acceptFolders: {
    type: Boolean,
    default: true
  }
})

// Émissions
const emit = defineEmits([
  'files-dropped',
  'upload-started',
  'upload-progress',
  'upload-completed',
  'upload-error',
  'drag-enter',
  'drag-leave'
])

// État réactif
const isDragOver = ref(false)
const isUploading = ref(false)
const uploadProgress = ref(null)
const dragCounter = ref(0)

// Références
const dropZone = ref(null)

// Computed
const isValidDrop = computed(() => {
  return !props.disabled && !isUploading.value
})

// Méthodes de gestion du drag & drop
const handleDragEnter = (event) => {
  if (!isValidDrop.value) return
  
  event.preventDefault()
  dragCounter.value++
  
  if (dragCounter.value === 1) {
    isDragOver.value = true
    emit('drag-enter', event)
  }
}

const handleDragOver = (event) => {
  if (!isValidDrop.value) return
  
  event.preventDefault()
  // Indiquer que le drop est accepté
  event.dataTransfer.dropEffect = 'copy'
}

const handleDragLeave = (event) => {
  if (!isValidDrop.value) return
  
  event.preventDefault()
  dragCounter.value--
  
  if (dragCounter.value === 0) {
    isDragOver.value = false
    emit('drag-leave', event)
  }
}

const handleDrop = async (event) => {
  if (!isValidDrop.value) return
  
  event.preventDefault()
  isDragOver.value = false
  dragCounter.value = 0
  
  const items = Array.from(event.dataTransfer.items || [])
  const files = Array.from(event.dataTransfer.files || [])
  
  if (items.length === 0 && files.length === 0) {
    return
  }
  
  try {
    let allFiles = []
    
    // Traiter les items avec webkitGetAsEntry pour supporter les dossiers
    if (items.length > 0 && items[0].webkitGetAsEntry) {
      allFiles = await processDataTransferItems(items)
    } else {
      // Fallback pour les navigateurs qui ne supportent pas webkitGetAsEntry
      allFiles = files
    }
    
    // Filtrer et valider les fichiers
    const validFiles = await validateFiles(allFiles)
    
    if (validFiles.length === 0) {
      emit('upload-error', new Error('Aucun fichier valide trouvé'))
      return
    }
    
    // Émettre l'événement avec les fichiers
    emit('files-dropped', {
      files: validFiles,
      targetPath: props.targetPath
    })
    
  } catch (error) {
    console.error('Erreur lors du traitement du drop:', error)
    emit('upload-error', error)
  }
}

// Traitement des items DataTransfer pour supporter les dossiers
const processDataTransferItems = async (items) => {
  const files = []
  
  for (const item of items) {
    if (item.kind === 'file') {
      const entry = item.webkitGetAsEntry()
      if (entry) {
        await processEntry(entry, files)
      }
    }
  }
  
  return files
}

// Traitement récursif des entrées (fichiers et dossiers)
const processEntry = async (entry, files, path = '') => {
  if (entry.isFile) {
    // C'est un fichier
    const file = await new Promise((resolve, reject) => {
      entry.file(resolve, reject)
    })
    
    // Ajouter le chemin relatif au fichier
    file.relativePath = path + file.name
    files.push(file)
    
  } else if (entry.isDirectory && props.acceptFolders) {
    // C'est un dossier
    const reader = entry.createReader()
    const entries = await new Promise((resolve, reject) => {
      reader.readEntries(resolve, reject)
    })
    
    // Traiter récursivement les entrées du dossier
    for (const childEntry of entries) {
      await processEntry(childEntry, files, path + entry.name + '/')
    }
  }
}

// Validation des fichiers
const validateFiles = async (files) => {
  const validFiles = []
  
  for (const file of files) {
    // Vérifier la taille
    if (file.size > props.maxFileSize) {
      console.warn(`Fichier trop volumineux: ${file.name} (${file.size} bytes)`)
      continue
    }
    
    // Vérifier le type si spécifié
    if (props.allowedTypes.length > 0) {
      const extension = file.name.split('.').pop()?.toLowerCase()
      if (!props.allowedTypes.includes(extension)) {
        console.warn(`Type de fichier non autorisé: ${file.name}`)
        continue
      }
    }
    
    validFiles.push(file)
  }
  
  // Vérifier le nombre maximum de fichiers
  if (validFiles.length > props.maxFiles) {
    console.warn(`Trop de fichiers (${validFiles.length}), limité à ${props.maxFiles}`)
    return validFiles.slice(0, props.maxFiles)
  }
  
  return validFiles
}

// Méthodes publiques pour contrôler l'état
const startUpload = () => {
  isUploading.value = true
  uploadProgress.value = 0
  emit('upload-started')
}

const updateProgress = (progress) => {
  uploadProgress.value = progress
  emit('upload-progress', progress)
}

const completeUpload = () => {
  isUploading.value = false
  uploadProgress.value = null
  emit('upload-completed')
}

const errorUpload = (error) => {
  isUploading.value = false
  uploadProgress.value = null
  emit('upload-error', error)
}

// Gestion des événements clavier pour l'accessibilité
const handleKeydown = (event) => {
  // Permettre d'annuler le drag avec Escape
  if (event.key === 'Escape' && isDragOver.value) {
    isDragOver.value = false
    dragCounter.value = 0
  }
}

// Lifecycle
onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})

// Exposer les méthodes publiques
defineExpose({
  startUpload,
  updateProgress,
  completeUpload,
  errorUpload
})
</script>

<style scoped>
.drag-drop-zone {
  position: relative;
  transition: all 0.2s ease;
}

.drag-drop-zone.disabled {
  pointer-events: none;
  opacity: 0.6;
}

.drop-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(59, 130, 246, 0.1);
  border: 2px dashed #3b82f6;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  backdrop-filter: blur(2px);
}

.drop-content {
  text-align: center;
  padding: 2rem;
}

.drop-icon {
  font-size: 3rem;
  color: #3b82f6;
  margin-bottom: 1rem;
  animation: bounce 1s infinite;
}

.drop-message {
  font-size: 1.25rem;
  font-weight: 600;
  color: #3b82f6;
  margin-bottom: 0.5rem;
}

.drop-hint {
  font-size: 0.875rem;
  color: #6b7280;
}

.upload-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 20;
}

.upload-content {
  text-align: center;
  padding: 2rem;
  color: white;
}

.upload-icon {
  font-size: 2rem;
  margin-bottom: 1rem;
}

.upload-message {
  font-size: 1.125rem;
  font-weight: 500;
  margin-bottom: 1rem;
}

.upload-progress {
  width: 200px;
  margin: 0 auto;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-fill {
  height: 100%;
  background: #10b981;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 0.875rem;
  font-weight: 500;
}

@keyframes bounce {
  0%, 20%, 53%, 80%, 100% {
    transform: translate3d(0, 0, 0);
  }
  40%, 43% {
    transform: translate3d(0, -10px, 0);
  }
  70% {
    transform: translate3d(0, -5px, 0);
  }
  90% {
    transform: translate3d(0, -2px, 0);
  }
}

/* États de drag over pour différents éléments */
.drag-drop-zone.drag-over {
  background: rgba(59, 130, 246, 0.05);
}

/* Responsive */
@media (max-width: 768px) {
  .drop-content {
    padding: 1rem;
  }
  
  .drop-icon {
    font-size: 2rem;
  }
  
  .drop-message {
    font-size: 1rem;
  }
  
  .upload-content {
    padding: 1rem;
  }
}
</style>