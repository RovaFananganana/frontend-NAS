<template>
  <div v-if="isOpen" class="modal modal-open" @click.self="handleClose">
    <div class="modal-box max-w-7xl w-full h-[90vh] p-0 flex flex-col">
      <!-- Header -->
      <div class="flex items-center justify-between p-4 border-b border-base-300">
        <div class="flex items-center gap-3">
          <button @click="handleClose" class="btn btn-sm btn-circle btn-ghost">
            <i class="fas fa-times"></i>
          </button>
          <div>
            <h3 class="font-bold text-lg">{{ file?.name || 'Fichier' }}</h3>
            <p class="text-sm text-base-content/60">{{ formatFileSize(file?.size) }}</p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <!-- Mode Selector -->
          <div class="btn-group">
            <button 
              @click="setMode('view')" 
              :class="['btn btn-sm', currentMode === 'view' ? 'btn-active' : '']"
              title="Mode visualisation"
            >
              <i class="fas fa-eye"></i>
            </button>
            <button 
              v-if="canEdit"
              @click="setMode('edit')" 
              :class="['btn btn-sm', currentMode === 'edit' ? 'btn-active' : '']"
              title="Mode édition"
            >
              <i class="fas fa-edit"></i>
            </button>
          </div>

          <!-- Actions -->
          <button @click="handleDownload" class="btn btn-sm btn-ghost" title="Télécharger">
            <i class="fas fa-download"></i>
          </button>
          
          <button 
            v-if="currentMode === 'edit' && hasChanges"
            @click="handleSave" 
            class="btn btn-sm btn-primary"
            :disabled="saving"
          >
            <span v-if="saving" class="loading loading-spinner loading-xs"></span>
            <i v-else class="fas fa-save"></i>
            Enregistrer
          </button>
        </div>
      </div>

      <!-- Content Area -->
      <div class="flex-1 overflow-hidden bg-base-200">
        <!-- Loading State -->
        <div v-if="loading" class="flex items-center justify-center h-full">
          <div class="text-center">
            <div class="loading loading-spinner loading-lg"></div>
            <p class="mt-4 text-base-content/60">Chargement du contenu...</p>
          </div>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="flex items-center justify-center h-full">
          <div class="alert alert-error max-w-md">
            <i class="fas fa-exclamation-triangle"></i>
            <div>
              <h3 class="font-bold">Erreur de chargement</h3>
              <div class="text-sm">{{ error }}</div>
            </div>
          </div>
        </div>

        <!-- Content Display -->
        <div v-else-if="content" class="h-full">
          <!-- Text Content -->
          <div v-if="isTextContent" class="h-full">
            <!-- View Mode -->
            <div v-if="currentMode === 'view'" class="h-full overflow-auto">
              <pre class="p-4 text-sm font-mono whitespace-pre-wrap">{{ content.text }}</pre>
            </div>

            <!-- Edit Mode -->
            <textarea
              v-else
              v-model="editableContent"
              class="textarea w-full h-full resize-none font-mono text-sm p-4 rounded-none border-0 focus:outline-none"
              :readonly="currentMode === 'view'"
              @input="markAsChanged"
            ></textarea>
          </div>

          <!-- Image Content -->
          <div v-else-if="isImageContent" class="h-full flex items-center justify-center p-4">
            <img 
              :src="content.url" 
              :alt="file?.name"
              class="max-w-full max-h-full object-contain"
            />
          </div>

          <!-- PDF Content -->
          <div v-else-if="isPdfContent" class="h-full">
            <iframe 
              :src="content.url" 
              class="w-full h-full border-0"
              title="PDF Viewer"
            ></iframe>
          </div>

          <!-- Video Content -->
          <div v-else-if="isVideoContent" class="h-full flex items-center justify-center p-4 bg-black">
            <video 
              :src="content.url" 
              controls
              class="max-w-full max-h-full"
            >
              Votre navigateur ne supporte pas la lecture vidéo.
            </video>
          </div>

          <!-- Audio Content -->
          <div v-else-if="isAudioContent" class="h-full flex items-center justify-center p-4">
            <audio 
              :src="content.url" 
              controls
              class="w-full max-w-2xl"
            >
              Votre navigateur ne supporte pas la lecture audio.
            </audio>
          </div>

          <!-- Office Documents -->
          <div v-else-if="isOfficeContent" class="h-full flex items-center justify-center p-4">
            <div class="text-center max-w-md">
              <i class="fas fa-file-alt text-6xl text-primary mb-4"></i>
              <h3 class="font-bold text-lg mb-2">Document {{ content.officeType }}</h3>
              <p class="text-base-content/60 mb-4">
                Les fichiers Microsoft Office ne peuvent pas être visualisés directement dans le navigateur.
              </p>
              <div class="flex flex-col gap-2">
                <button @click="handleDownload" class="btn btn-primary">
                  <i class="fas fa-download mr-2"></i>
                  Télécharger le fichier
                </button>
                <a 
                  :href="`https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(getFileUrl())}`"
                  target="_blank"
                  class="btn btn-outline btn-sm"
                >
                  <i class="fas fa-external-link-alt mr-2"></i>
                  Ouvrir avec Office Online
                </a>
              </div>
              <p class="text-xs text-base-content/40 mt-4">
                Type: {{ content.type }}
              </p>
            </div>
          </div>

          <!-- Unknown Content Type -->
          <div v-else class="h-full flex items-center justify-center p-4">
            <div class="text-center">
              <i class="fas fa-file text-6xl text-base-content/20 mb-4"></i>
              <h3 class="font-bold text-lg mb-2">Type de contenu inconnu</h3>
              <p class="text-base-content/60 mb-4">
                Impossible de déterminer comment afficher ce contenu.
              </p>
              <p class="text-sm text-base-content/40">
                Type détecté: {{ content?.type || 'inconnu' }} | 
                Handler: {{ contentHandler || 'Aucun' }}
              </p>
              <button @click="handleDownload" class="btn btn-primary mt-4">
                <i class="fas fa-download mr-2"></i>
                Télécharger le fichier
              </button>
            </div>
          </div>
        </div>

        <!-- No Content -->
        <div v-else class="h-full flex items-center justify-center p-4">
          <div class="text-center text-base-content/60">
            <i class="fas fa-file text-6xl mb-4"></i>
            <p>Aucun contenu à afficher</p>
          </div>
        </div>
      </div>

      <!-- Footer with metadata -->
      <div v-if="content" class="p-3 border-t border-base-300 bg-base-100">
        <div class="flex items-center justify-between text-xs text-base-content/60">
          <div class="flex items-center gap-4">
            <span v-if="detectionMethod">
              <i class="fas fa-info-circle mr-1"></i>
              Méthode: {{ detectionMethod }}
            </span>
            <span v-if="content.type">
              <i class="fas fa-file-code mr-1"></i>
              Type: {{ content.type }}
            </span>
          </div>
          <div v-if="hasChanges" class="text-warning">
            <i class="fas fa-exclamation-circle mr-1"></i>
            Modifications non enregistrées
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { nasAPI } from '@/services/nasAPI.js'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  file: {
    type: Object,
    default: null
  },
  mode: {
    type: String,
    default: 'edit',
    validator: (value) => ['view', 'edit'].includes(value)
  }
})

const emit = defineEmits([
  'close',
  'save',
  'download',
  'mode-changed',
  'content-loaded',
  'error'
])

// State
const loading = ref(false)
const error = ref(null)
const content = ref(null)
const currentMode = ref(props.mode)
const editableContent = ref('')
const originalContent = ref('')
const hasChanges = ref(false)
const saving = ref(false)
const detectionMethod = ref(null)
const contentHandler = ref(null)

// Computed
const canEdit = computed(() => {
  if (!content.value) return false
  return isTextContent.value
})

const isTextContent = computed(() => {
  if (!content.value) return false
  const type = content.value.type
  return type?.startsWith('text/') || 
         type === 'application/json' ||
         type === 'application/xml'
})

const isImageContent = computed(() => {
  if (!content.value) return false
  return content.value.type?.startsWith('image/')
})

const isPdfContent = computed(() => {
  if (!content.value) return false
  return content.value.type === 'application/pdf'
})

const isVideoContent = computed(() => {
  if (!content.value) return false
  return content.value.type?.startsWith('video/')
})

const isAudioContent = computed(() => {
  if (!content.value) return false
  return content.value.type?.startsWith('audio/')
})

const isOfficeContent = computed(() => {
  if (!content.value) return false
  return content.value.isOfficeDocument === true
})

// Methods
const getOfficeType = (mimeType) => {
  if (mimeType.includes('word') || mimeType.includes('document')) return 'Word'
  if (mimeType.includes('excel') || mimeType.includes('sheet')) return 'Excel'
  if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'PowerPoint'
  if (mimeType.includes('access')) return 'Access'
  return 'Office'
}

const formatFileSize = (bytes) => {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

const loadContent = async () => {
  if (!props.file) {
    error.value = 'Aucun fichier spécifié'
    return
  }

  loading.value = true
  error.value = null
  content.value = null
  detectionMethod.value = null
  contentHandler.value = null

  try {
    console.log('🎬 Attempting NAS detection for file:', props.file.name)
    
    let result = null
    
    // Detect if this is a NAS file based on the file path
    const isNasFile = props.file?.path && !props.file.path.startsWith('http')
    
    if (isNasFile) {
      // Determine content type from file extension if not provided
      let contentType = props.file.mime_type || 'application/octet-stream'
      
      // Map common file extensions to proper MIME types
      const fileName = props.file.name.toLowerCase()
      const mimeTypeMap = {
        // Text files
        '.txt': 'text/plain',
        '.md': 'text/markdown',
        '.json': 'application/json',
        '.xml': 'text/xml',
        '.csv': 'text/csv',
        '.log': 'text/plain',
        '.ini': 'text/plain',
        '.conf': 'text/plain',
        '.yaml': 'text/plain',
        '.yml': 'text/plain',
        
        // Images
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.bmp': 'image/bmp',
        '.webp': 'image/webp',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon',
        
        // PDF
        '.pdf': 'application/pdf',
        
        // Video
        '.mp4': 'video/mp4',
        '.mov': 'video/quicktime',
        '.avi': 'video/x-msvideo',
        '.mkv': 'video/x-matroska',
        '.webm': 'video/webm',
        '.wmv': 'video/x-ms-wmv',
        '.flv': 'video/x-flv',
        
        // Audio
        '.mp3': 'audio/mpeg',
        '.wav': 'audio/wav',
        '.ogg': 'audio/ogg',
        '.m4a': 'audio/mp4',
        '.flac': 'audio/flac',
        '.aac': 'audio/aac',
        
        // Microsoft Office
        '.doc': 'application/msword',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.xls': 'application/vnd.ms-excel',
        '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        '.ppt': 'application/vnd.ms-powerpoint',
        '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        '.accdb': 'application/msaccess',
        '.mdb': 'application/msaccess',
        
        // OpenOffice/LibreOffice
        '.odt': 'application/vnd.oasis.opendocument.text',
        '.ods': 'application/vnd.oasis.opendocument.spreadsheet',
        '.odp': 'application/vnd.oasis.opendocument.presentation',
        
        // Archives
        '.zip': 'application/zip',
        '.rar': 'application/x-rar-compressed',
        '.7z': 'application/x-7z-compressed',
        '.tar': 'application/x-tar',
        '.gz': 'application/gzip'
      }
      
      for (const [ext, mimeType] of Object.entries(mimeTypeMap)) {
        if (fileName.endsWith(ext)) {
          contentType = mimeType
          break
        }
      }
      
      console.log('🎬 NAS file detected, content type:', contentType)
      
      // Create a result object similar to what the API would return
      result = {
        success: true,
        content_type: contentType,
        method: 'smb',
        size: props.file.size || 0,
        metadata: {
          filename: props.file.name,
          path: props.file.path
        }
      }
      
      detectionMethod.value = result.method
      console.log('🎬 Created NAS result:', result)
    }

    if (!result || !result.success) {
      throw new Error('Impossible de détecter le type de contenu')
    }

    // Determine the best handler for this content type
    const contentType = result.content_type
    console.log('🎬 FileViewerModal: Detected content type:', contentType)

    // Load content based on type
    if (contentType.startsWith('text/') || 
        contentType === 'application/json' ||
        contentType === 'application/xml') {
      
      contentHandler.value = 'text'
      console.log('🎬 Using text handler')
      
      // Load text content via NAS API
      const textResult = await nasAPI.getFileContent(props.file.path)
      
      if (!textResult.success) {
        throw new Error(textResult.error || 'Erreur de chargement du contenu')
      }

      content.value = {
        type: contentType,
        text: textResult.content || '',
        encoding: textResult.encoding || 'utf-8'
      }
      
      originalContent.value = content.value.text
      editableContent.value = content.value.text
      
    } else if (contentType.startsWith('image/') || 
               contentType === 'application/pdf' ||
               contentType.startsWith('video/') ||
               contentType.startsWith('audio/')) {
      
      contentHandler.value = contentType.split('/')[0]
      console.log('🎬 Using', contentHandler.value, 'handler')
      
      // For media files, create a blob URL
      const blob = await nasAPI.downloadFile(props.file.path)
      const url = URL.createObjectURL(blob)
      
      content.value = {
        type: contentType,
        url: url,
        blob: blob
      }
      
    } else if (contentType.startsWith('application/vnd.') || 
               contentType.startsWith('application/msword') ||
               contentType.startsWith('application/vnd.ms-') ||
               contentType === 'application/msaccess') {
      
      // Microsoft Office and other application files
      contentHandler.value = 'office'
      console.log('🎬 Using office handler for:', contentType)
      
      // For Office files, we'll show a preview option or download
      const blob = await nasAPI.downloadFile(props.file.path)
      const url = URL.createObjectURL(blob)
      
      content.value = {
        type: contentType,
        url: url,
        blob: blob,
        isOfficeDocument: true,
        officeType: getOfficeType(contentType)
      }
      
    } else {
      contentHandler.value = 'unknown'
      console.log('🎬 Unknown content type, no handler available')
      
      content.value = {
        type: contentType
      }
    }

    console.log('🎬 FileViewerModal: Content assigned:', contentHandler.value, content.value)
    emit('content-loaded', content.value)

  } catch (err) {
    console.error('🎬 FileViewerModal: Error loading content:', err)
    error.value = err.message || 'Erreur lors du chargement du contenu'
    emit('error', err)
  } finally {
    loading.value = false
  }
}

const handleClose = () => {
  if (hasChanges.value) {
    const confirm = window.confirm('Vous avez des modifications non enregistrées. Voulez-vous vraiment fermer ?')
    if (!confirm) return
  }
  
  // Clean up blob URLs
  if (content.value?.url) {
    URL.revokeObjectURL(content.value.url)
  }
  
  emit('close')
}

const handleDownload = () => {
  emit('download', props.file)
}

const setMode = (mode) => {
  if (mode === 'edit' && !canEdit.value) {
    return
  }
  
  currentMode.value = mode
  emit('mode-changed', mode)
}

const markAsChanged = () => {
  hasChanges.value = editableContent.value !== originalContent.value
}

const handleSave = async () => {
  if (!hasChanges.value) return
  
  saving.value = true
  
  try {
    // Call NAS API to save content
    const result = await nasAPI.updateFileContent(
      props.file.path, 
      editableContent.value
    )
    
    if (!result.success) {
      throw new Error(result.error || 'Erreur lors de la sauvegarde')
    }
    
    originalContent.value = editableContent.value
    hasChanges.value = false
    
    emit('save', {
      file: props.file,
      content: editableContent.value
    })
    
  } catch (err) {
    console.error('Error saving file:', err)
    error.value = err.message
    emit('error', err)
  } finally {
    saving.value = false
  }
}

const getFileUrl = () => {
  // Generate a public URL for the file (for Office Online viewer)
  // This would need to be a publicly accessible URL
  // For now, return the blob URL (won't work for Office Online)
  return content.value?.url || ''
}

// Watchers
watch(() => props.isOpen, (newVal) => {
  if (newVal && props.file) {
    loadContent()
  }
})

watch(() => props.file, (newVal) => {
  if (newVal && props.isOpen) {
    loadContent()
  }
})

watch(() => props.mode, (newVal) => {
  currentMode.value = newVal
})

// Keyboard shortcuts
const handleKeydown = (e) => {
  if (!props.isOpen) return
  
  // Escape to close
  if (e.key === 'Escape') {
    handleClose()
  }
  
  // Ctrl+S to save
  if (e.ctrlKey && e.key === 's') {
    e.preventDefault()
    if (currentMode.value === 'edit' && hasChanges.value) {
      handleSave()
    }
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
  if (props.isOpen && props.file) {
    loadContent()
  }
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  
  // Clean up blob URLs
  if (content.value?.url) {
    URL.revokeObjectURL(content.value.url)
  }
})
</script>

<style scoped>
.modal-box {
  background: var(--fallback-b1, oklch(var(--b1)));
}

textarea.textarea {
  background: var(--fallback-b1, oklch(var(--b1)));
  color: var(--fallback-bc, oklch(var(--bc)));
}

pre {
  background: var(--fallback-b1, oklch(var(--b1)));
  color: var(--fallback-bc, oklch(var(--bc)));
}
</style>