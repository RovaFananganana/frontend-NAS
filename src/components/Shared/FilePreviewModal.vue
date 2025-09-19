<!-- src/components/Shared/FilePreviewModal.vue -->
<template>
  <div class="modal modal-open">
    <div class="modal-box max-w-4xl">
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-bold text-lg">
          <i :class="getItemIcon(item)" class="mr-2" :style="{ color: getItemColor(item) }"></i>
          {{ item?.name }}
        </h3>
        <button class="btn btn-sm btn-circle btn-ghost" @click="$emit('close')">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div class="mb-4 text-sm bg-base-200 p-3 rounded-lg">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <span class="font-medium">Chemin:</span>
            <div class="font-mono text-xs break-all">{{ item?.path }}</div>
          </div>
          <div>
            <span class="font-medium">Taille:</span>
            <div>{{ formatBytes(item?.size) }}</div>
          </div>
          <div>
            <span class="font-medium">Type MIME:</span>
            <div class="font-mono text-xs">{{ item?.mime_type || 'Non défini' }}</div>
          </div>
          <div>
            <span class="font-medium">Modifié:</span>
            <div>{{ formatDate(item?.modified_at) }}</div>
          </div>
        </div>
      </div>

      <div class="preview-container">
        <!-- Loading state -->
        <div v-if="loading" class="flex justify-center items-center h-64">
          <div class="text-center">
            <div class="loading loading-spinner loading-lg mb-2"></div>
            <p>Chargement de la prévisualisation...</p>
          </div>
        </div>

        <!-- Error state -->
        <div v-else-if="error" class="flex justify-center items-center h-64">
          <div class="text-center">
            <i class="fas fa-exclamation-triangle text-4xl text-error mb-2"></i>
            <p class="text-error">{{ error }}</p>
          </div>
        </div>

        <!-- Image preview -->
        <div v-else-if="isImage" class="text-center">
          <img 
            :src="previewUrl" 
            :alt="item?.name" 
            class="max-w-full max-h-96 mx-auto rounded-lg shadow-lg"
            @load="onImageLoad"
            @error="onImageError"
          />
        </div>

        <!-- Video preview -->
        <div v-else-if="isVideo" class="text-center">
          <video 
            :src="previewUrl" 
            controls 
            class="max-w-full max-h-96 mx-auto rounded-lg shadow-lg"
            @loadedmetadata="onVideoLoad"
            @error="onVideoError"
          >
            Votre navigateur ne supporte pas la lecture vidéo.
          </video>
        </div>

        <!-- Audio preview -->
        <div v-else-if="isAudio" class="text-center">
          <div class="bg-base-300 p-8 rounded-lg">
            <i class="fas fa-music text-6xl text-primary mb-4"></i>
            <audio 
              :src="previewUrl" 
              controls 
              class="w-full max-w-md mx-auto"
              @loadedmetadata="onAudioLoad"
              @error="onAudioError"
            >
              Votre navigateur ne supporte pas la lecture audio.
            </audio>
          </div>
        </div>

        <!-- Text preview -->
        <div v-else-if="isText && textContent" class="bg-base-300 p-4 rounded-lg">
          <pre class="text-sm whitespace-pre-wrap max-h-96 overflow-auto">{{ textContent }}</pre>
        </div>

        <!-- PDF preview -->
        <div v-else-if="isPDF" class="text-center">
          <div class="bg-base-300 p-8 rounded-lg">
            <i class="fas fa-file-pdf text-6xl text-red-500 mb-4"></i>
            <p class="mb-4">Prévisualisation PDF non disponible</p>
            <button class="btn btn-primary" @click="downloadFile">
              <i class="fas fa-download mr-2"></i>
              Télécharger pour ouvrir
            </button>
          </div>
        </div>

        <!-- Unsupported file type -->
        <div v-else class="text-center">
          <div class="bg-base-300 p-8 rounded-lg">
            <i :class="getItemIcon(item)" class="text-6xl mb-4" :style="{ color: getItemColor(item) }"></i>
            <p class="mb-4">Prévisualisation non disponible pour ce type de fichier</p>
            <div class="space-x-2">
              <button class="btn btn-primary" @click="downloadFile">
                <i class="fas fa-download mr-2"></i>
                Télécharger
              </button>
              <button v-if="canOpenExternally" class="btn btn-outline" @click="openExternally">
                <i class="fas fa-external-link-alt mr-2"></i>
                Ouvrir
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-action">
        <button class="btn btn-outline" @click="downloadFile">
          <i class="fas fa-download mr-2"></i>
          Télécharger
        </button>
        <button class="btn" @click="$emit('close')">
          Fermer
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useSynologyAPI } from '@/services/useSynologyAPI'

const props = defineProps({
  item: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close'])

const loading = ref(false)
const error = ref('')
const previewUrl = ref('')
const textContent = ref('')

const fileExtension = computed(() => {
  return props.item?.name?.split('.').pop()?.toLowerCase() || ''
})

const isImage = computed(() => {
  return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(fileExtension.value)
})

const isVideo = computed(() => {
  return ['mp4', 'avi', 'mov', 'mkv', 'webm', 'ogg'].includes(fileExtension.value)
})

const isAudio = computed(() => {
  return ['mp3', 'wav', 'ogg', 'flac', 'aac'].includes(fileExtension.value)
})

const isText = computed(() => {
  return ['txt', 'md', 'js', 'ts', 'html', 'css', 'json', 'xml', 'yml', 'yaml', 'py', 'java', 'cpp', 'c'].includes(fileExtension.value)
})

const isPDF = computed(() => {
  return fileExtension.value === 'pdf'
})

const canOpenExternally = computed(() => {
  // Define file types that can be opened externally
  return ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(fileExtension.value)
})

const loadPreview = async () => {
  if (!props.item) return

  loading.value = true
  error.value = ''

  try {
    if (isImage.value || isVideo.value || isAudio.value) {
      // For media files, get a blob URL
      const result = await useSynologyAPI.downloadFile(props.item.path)
      previewUrl.value = result.url
    } else if (isText.value && props.item.size < 100000) { // Limit text preview to 100KB
      // For text files, get the content as text
      try {
        const preview = await useSynologyAPI.getFilePreview(props.item.path, { type: 'text' })
        textContent.value = preview.content || 'Contenu non disponible'
      } catch (err) {
        // Fallback to download and read as text
        const result = await useSynologyAPI.downloadFile(props.item.path)
        const text = await result.blob.text()
        textContent.value = text.substring(0, 10000) // Limit to first 10KB for display
        if (text.length > 10000) {
          textContent.value += '\n\n... (contenu tronqué)'
        }
      }
    }
  } catch (err) {
    console.error('Error loading preview:', err)
    error.value = err.message || 'Erreur lors du chargement de la prévisualisation'
  } finally {
    loading.value = false
  }
}

const downloadFile = async () => {
  try {
    const result = await useSynologyAPI.downloadFile(props.item.path)
    
    // Create download link
    const link = document.createElement('a')
    link.href = result.url
    link.download = result.filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    // Clean up blob URL
    setTimeout(() => {
      window.URL.revokeObjectURL(result.url)
    }, 1000)

  } catch (error) {
    console.error('Download error:', error)
    // Parent component should handle error display
  }
}

const openExternally = async () => {
  try {
    const result = await useSynologyAPI.downloadFile(props.item.path)
    window.open(result.url, '_blank')
  } catch (error) {
    console.error('Open externally error:', error)
  }
}

const onImageLoad = () => {
  loading.value = false
}

const onImageError = () => {
  error.value = 'Erreur lors du chargement de l\'image'
  loading.value = false
}

const onVideoLoad = () => {
  loading.value = false
}

const onVideoError = () => {
  error.value = 'Erreur lors du chargement de la vidéo'
  loading.value = false
}

const onAudioLoad = () => {
  loading.value = false
}

const onAudioError = () => {
  error.value = 'Erreur lors du chargement de l\'audio'
  loading.value = false
}

// Utility functions
const formatBytes = (bytes) => {
  if (!bytes || bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatDate = (date) => {
  if (!date) return '—'
  return new Date(date).toLocaleString('fr-FR')
}

const getItemIcon = (item) => {
  if (item?.type === 'directory') {
    return 'fas fa-folder'
  }
  
  const ext = item?.name?.split('.').pop()?.toLowerCase() || ''
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
    'mp3': 'fas fa-file-audio',
    'txt': 'fas fa-file-alt'
  }
  return iconMap[ext] || 'fas fa-file'
}

const getItemColor = (item) => {
  if (item?.type === 'directory') {
    return '#3b82f6'
  }
  
  const ext = item?.name?.split('.').pop()?.toLowerCase() || ''
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
    'mp3': '#059669',
    'txt': '#374151'
  }
  
  return colorMap[ext] || '#6b7280'
}

// Cleanup on unmount
onUnmounted(() => {
  if (previewUrl.value) {
    window.URL.revokeObjectURL(previewUrl.value)
  }
})

onMounted(() => {
  loadPreview()
})
</script>

<style scoped>
.preview-container {
  min-height: 200px;
}

pre {
  font-family: 'Fira Code', 'Monaco', 'Consolas', monospace;
  font-size: 12px;
  line-height: 1.4;
}

img, video {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

audio {
  filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1));
}
</style>