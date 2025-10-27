<template>
  <div ref="dropZone" :class="[
    'drag-drop-zone',
    {
      'drag-over': isDragOver,
      'uploading': isUploading,
      'disabled': disabled
    }
  ]" @dragenter.prevent="handleDragEnter" @dragover.prevent="handleDragOver" @dragleave.prevent="handleDragLeave"
    @drop.prevent="handleDrop">
    <!-- Slot pour le contenu normal -->
    <slot :isDragOver="isDragOver" :isUploading="isUploading" :uploadProgress="uploadProgress" />

    <!-- Overlay de drop -->
    <div v-if="isDragOver && !disabled" class="drop-overlay" role="status" aria-live="polite" :aria-label="dropMessage">
      <div class="drop-content">
        <i class="fas fa-cloud-upload-alt drop-icon" aria-hidden="true"></i>
        <p class="drop-message">{{ dropMessage }}</p>
        <p v-if="allowedTypes.length > 0" class="drop-hint">
          Types acceptés: {{ allowedTypes.join(', ') }}
        </p>
      </div>
    </div>

    <!-- Overlay de progression d'upload -->
    <div v-if="isUploading && showProgress" class="upload-overlay" role="status" aria-live="polite"
      aria-label="Upload en cours">
      <div class="upload-content">
        <i class="fas fa-spinner fa-spin upload-icon" aria-hidden="true"></i>
        <p class="upload-message">{{ uploadMessage }}</p>
        <div v-if="uploadProgress !== null" class="upload-progress">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: `${uploadProgress}%` }" :aria-valuenow="uploadProgress"
              aria-valuemin="0" aria-valuemax="100" role="progressbar"></div>
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

  console.log(`🎯 DragDrop: Received ${items.length} items and ${files.length} files`)

  if (items.length === 0 && files.length === 0) {
    return
  }

  try {
    let allFiles = []

    // Traiter les items avec webkitGetAsEntry pour supporter les dossiers
    if (items.length > 0 && items[0].webkitGetAsEntry) {
      console.log(`📁 Using webkitGetAsEntry for ${items.length} items`)
      allFiles = await processDataTransferItems(items)

      // Si webkitGetAsEntry n'a pas donné tous les fichiers, utiliser le fallback
      if (allFiles.length < files.length) {
        console.log(`⚠️ webkitGetAsEntry only got ${allFiles.length}/${files.length} files, using fallback`)
        allFiles = files
      }
    } else {
      // Fallback pour les navigateurs qui ne supportent pas webkitGetAsEntry
      console.log(`📄 Using fallback for ${files.length} files`)
      allFiles = files
    }

    console.log(`📋 Total files after processing: ${allFiles.length}`)

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
  console.log(`🔄 Processing ${items.length} DataTransfer items`)
  const files = []
  let totalDirectories = 0
  let totalFiles = 0

  for (const item of items) {
    console.log(`📋 Item kind: ${item.kind}, type: ${item.type}`)

    // Essayer de traiter l'item même si kind n'est pas 'file'
    const entry = item.webkitGetAsEntry && item.webkitGetAsEntry()
    if (entry) {
      console.log(`📁 Processing entry: ${entry.name} (isFile: ${entry.isFile}, isDirectory: ${entry.isDirectory})`)
      if (entry.isDirectory) {
        totalDirectories++
      } else if (entry.isFile) {
        totalFiles++
      }
      await processEntry(entry, files)
    } else if (item.kind === 'file') {
      // Fallback : essayer de récupérer le fichier directement
      const file = item.getAsFile && item.getAsFile()
      if (file) {
        console.log(`📄 Direct file: ${file.name} (${file.size} bytes)`)
        totalFiles++
        files.push(file)
      }
    }
  }

  console.log(`📊 Processing summary: ${totalDirectories} directories, ${totalFiles} direct files, ${files.length} total files extracted`)
  return files
}

// Traitement récursif des entrées (fichiers et dossiers)
const processEntry = async (entry, files, path = '') => {
  try {
    if (entry.isFile) {
      // C'est un fichier
      console.log(`📄 Processing file: ${entry.name}`)

      const file = await new Promise((resolve, reject) => {
        entry.file(
          (file) => resolve(file),
          (error) => {
            console.error(`❌ Error reading file ${entry.name}:`, error)
            reject(error)
          }
        )
      })

      // Ajouter le chemin relatif au fichier
      file.relativePath = path + file.name
      files.push(file)
      console.log(`✅ File added: ${file.name} (${file.size} bytes) - relativePath: ${file.relativePath}`)

    } else if (entry.isDirectory && props.acceptFolders) {
      // C'est un dossier
      console.log(`📁 Processing directory: ${entry.name}`)
      const reader = entry.createReader()
      const allEntries = []

      // readEntries peut ne pas retourner toutes les entrées en une fois
      // Il faut l'appeler plusieurs fois jusqu'à ce qu'il retourne un tableau vide
      const readAllEntries = async () => {
        let entries
        do {
          entries = await new Promise((resolve, reject) => {
            reader.readEntries(resolve, reject)
          })
          allEntries.push(...entries)
          console.log(`📋 Read ${entries.length} entries from ${entry.name}, total: ${allEntries.length}`)
        } while (entries.length > 0)
      }

      await readAllEntries()
      console.log(`📊 Total entries in ${entry.name}: ${allEntries.length}`)

      // Traiter récursivement les entrées du dossier
      for (const childEntry of allEntries) {
        try {
          await processEntry(childEntry, files, path + entry.name + '/')
        } catch (error) {
          console.error(`❌ Error processing ${childEntry.name}:`, error)
        }
      }
    }
  } catch (error) {
    console.error(`❌ Error in processEntry for ${entry.name}:`, error)
    // Continue processing other entries even if one fails
  }
}

// Validation des fichiers
const validateFiles = async (files) => {
  console.log(`🔍 Validating ${files.length} files`)
  const validFiles = []

  for (const file of files) {
    console.log(`📄 Validating: ${file.name} (${file.size} bytes)`)
    // Vérifier la taille
    if (file.size > props.maxFileSize) {
      const fileSizeGB = (file.size / (1024 * 1024 * 1024)).toFixed(2)
      const maxSizeGB = (props.maxFileSize / (1024 * 1024 * 1024)).toFixed(0)

      console.warn(`Fichier trop volumineux: ${file.name} (${fileSizeGB}GB > ${maxSizeGB}GB)`)

      // Émettre une erreur spécifique pour les gros fichiers
      emit('upload-error', new Error(`Le fichier "${file.name}" (${fileSizeGB}GB) dépasse la limite de ${maxSizeGB}GB`))
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

    console.log(`✅ File valid: ${file.name}`)
    validFiles.push(file)
  }

  console.log(`📊 Validation result: ${validFiles.length}/${files.length} files valid`)

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

  0%,
  20%,
  53%,
  80%,
  100% {
    transform: translate3d(0, 0, 0);
  }

  40%,
  43% {
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