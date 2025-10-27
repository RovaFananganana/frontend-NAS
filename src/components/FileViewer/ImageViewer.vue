<template>
  <div class="image-viewer h-full flex flex-col bg-base-100">
    <!-- Image Controls Bar -->
    <div class="flex items-center justify-between p-3 border-b border-base-300 bg-base-50">
      <div class="flex items-center space-x-2">
        <!-- Zoom Controls -->
        <div class="flex items-center space-x-1">
          <button
            @click="zoomOut"
            :disabled="zoomLevel <= minZoom"
            class="btn btn-sm btn-ghost"
            title="Zoom arrière"
          >
            <i class="fas fa-search-minus"></i>
          </button>
          
          <span class="text-sm font-mono min-w-[60px] text-center">
            {{ Math.round(zoomLevel * 100) }}%
          </span>
          
          <button
            @click="zoomIn"
            :disabled="zoomLevel >= maxZoom"
            class="btn btn-sm btn-ghost"
            title="Zoom avant"
          >
            <i class="fas fa-search-plus"></i>
          </button>
          
          <button
            @click="resetZoom"
            class="btn btn-sm btn-ghost"
            title="Taille réelle"
          >
            <i class="fas fa-expand-arrows-alt"></i>
          </button>
          
          <button
            @click="fitToWindow"
            class="btn btn-sm btn-ghost"
            title="Ajuster à la fenêtre"
          >
            <i class="fas fa-compress-arrows-alt"></i>
          </button>
        </div>
      </div>

      <!-- Image Info -->
      <div class="flex items-center space-x-4 text-sm text-base-content/70">
        <span v-if="metadata.width && metadata.height">
          {{ metadata.width }} × {{ metadata.height }}
        </span>
        <span v-if="metadata.format">
          {{ metadata.format }}
        </span>
        <span v-if="metadata.size">
          {{ formatFileSize(metadata.size) }}
        </span>
      </div>

      <!-- Action Buttons -->
      <div class="flex items-center space-x-2">
        <button
          v-if="editable"
          @click="$emit('edit')"
          class="btn btn-sm btn-primary"
          title="Éditer l'image"
        >
          <i class="fas fa-edit mr-1"></i>
          Éditer
        </button>
        
        <button
          @click="downloadImage"
          class="btn btn-sm btn-ghost"
          title="Télécharger l'image"
        >
          <i class="fas fa-download"></i>
        </button>
      </div>
    </div>

    <!-- Image Container -->
    <div 
      ref="imageContainer"
      class="flex-1 overflow-hidden relative bg-gray-100 dark:bg-gray-800"
      @wheel.prevent="handleWheel"
      @mousedown="startPan"
      @mousemove="handlePan"
      @mouseup="endPan"
      @mouseleave="endPan"
      @dblclick="handleDoubleClick"
    >
      <!-- Loading State -->
      <div
        v-if="isLoading"
        class="absolute inset-0 flex items-center justify-center"
      >
        <div class="text-center">
          <div class="loading loading-spinner loading-lg mb-2"></div>
          <p class="text-base-content/70">Chargement de l'image...</p>
        </div>
      </div>

      <!-- Error State -->
      <div
        v-else-if="error"
        class="absolute inset-0 flex items-center justify-center"
      >
        <div class="text-center">
          <i class="fas fa-exclamation-triangle text-4xl text-error mb-2"></i>
          <p class="text-error">{{ error }}</p>
        </div>
      </div>

      <!-- Image Display -->
      <div
        v-else
        class="absolute inset-0 flex items-center justify-center"
        :style="{ cursor: isPanning ? 'grabbing' : (canPan ? 'grab' : 'default') }"
      >
        <img
          ref="imageElement"
          :src="imageUrl"
          :alt="filename"
          class="max-w-none transition-transform duration-200 ease-out select-none"
          :style="imageStyle"
          @load="handleImageLoad"
          @error="handleImageError"
          @dragstart.prevent
        />
      </div>

      <!-- Zoom Indicator -->
      <div
        v-if="showZoomIndicator"
        class="absolute top-4 left-4 bg-black/70 text-white px-2 py-1 rounded text-sm"
      >
        {{ Math.round(zoomLevel * 100) }}%
      </div>
    </div>

    <!-- Metadata Panel (collapsible) -->
    <div
      v-if="showMetadata && hasMetadata"
      class="border-t border-base-300 bg-base-50"
    >
      <div class="p-3">
        <div class="flex items-center justify-between mb-2">
          <h4 class="font-semibold text-sm">Métadonnées de l'image</h4>
          <button
            @click="showMetadata = false"
            class="btn btn-xs btn-ghost"
          >
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          <div v-if="metadata.width && metadata.height">
            <span class="font-medium">Dimensions:</span>
            <span class="ml-1">{{ metadata.width }} × {{ metadata.height }}</span>
          </div>
          
          <div v-if="metadata.format">
            <span class="font-medium">Format:</span>
            <span class="ml-1">{{ metadata.format }}</span>
          </div>
          
          <div v-if="metadata.size">
            <span class="font-medium">Taille:</span>
            <span class="ml-1">{{ formatFileSize(metadata.size) }}</span>
          </div>
          
          <div v-if="metadata.aspectRatio">
            <span class="font-medium">Ratio:</span>
            <span class="ml-1">{{ metadata.aspectRatio.toFixed(2) }}</span>
          </div>
          
          <div v-if="metadata.lastModified">
            <span class="font-medium">Modifié:</span>
            <span class="ml-1">{{ formatDate(metadata.lastModified) }}</span>
          </div>
          
          <div v-if="metadata.hasEXIF">
            <span class="font-medium">EXIF:</span>
            <span class="ml-1 text-success">Présent</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom Toolbar -->
    <div class="flex items-center justify-between p-2 border-t border-base-300 bg-base-50 text-xs text-base-content/70">
      <div class="flex items-center space-x-4">
        <span>{{ filename }}</span>
        <button
          v-if="hasMetadata"
          @click="showMetadata = !showMetadata"
          class="btn btn-xs btn-ghost"
        >
          <i class="fas fa-info-circle mr-1"></i>
          Métadonnées
        </button>
      </div>
      
      <div class="flex items-center space-x-2">
        <span>Molette: zoom • Double-clic: ajuster • Glisser: déplacer</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'

// Props
const props = defineProps({
  imageUrl: {
    type: String,
    required: true
  },
  filename: {
    type: String,
    default: 'Image'
  },
  metadata: {
    type: Object,
    default: () => ({})
  },
  editable: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['edit', 'download', 'error'])

// Refs
const imageContainer = ref(null)
const imageElement = ref(null)

// State
const isLoading = ref(true)
const error = ref(null)
const zoomLevel = ref(1)
const panX = ref(0)
const panY = ref(0)
const isPanning = ref(false)
const lastPanPoint = ref({ x: 0, y: 0 })
const showZoomIndicator = ref(false)
const showMetadata = ref(false)
const imageNaturalWidth = ref(0)
const imageNaturalHeight = ref(0)

// Constants
const minZoom = 0.1
const maxZoom = 5
const zoomStep = 0.2

// Computed
const hasMetadata = computed(() => {
  return Object.keys(props.metadata).length > 0 && 
         (props.metadata.width || props.metadata.height || props.metadata.format)
})

const canPan = computed(() => {
  return zoomLevel.value > 1 || 
         (imageNaturalWidth.value > 0 && imageNaturalHeight.value > 0)
})

const imageStyle = computed(() => {
  return {
    transform: `scale(${zoomLevel.value}) translate(${panX.value}px, ${panY.value}px)`,
    transformOrigin: 'center center'
  }
})

// Methods
const zoomIn = () => {
  if (zoomLevel.value < maxZoom) {
    zoomLevel.value = Math.min(maxZoom, zoomLevel.value + zoomStep)
    showZoomIndicatorTemporarily()
  }
}

const zoomOut = () => {
  if (zoomLevel.value > minZoom) {
    zoomLevel.value = Math.max(minZoom, zoomLevel.value - zoomStep)
    showZoomIndicatorTemporarily()
  }
}

const resetZoom = () => {
  zoomLevel.value = 1
  panX.value = 0
  panY.value = 0
  showZoomIndicatorTemporarily()
}

const fitToWindow = () => {
  if (!imageContainer.value || !imageNaturalWidth.value || !imageNaturalHeight.value) {
    return
  }

  const containerRect = imageContainer.value.getBoundingClientRect()
  const containerWidth = containerRect.width - 40 // padding
  const containerHeight = containerRect.height - 40 // padding
  
  const scaleX = containerWidth / imageNaturalWidth.value
  const scaleY = containerHeight / imageNaturalHeight.value
  const scale = Math.min(scaleX, scaleY, 1) // Don't zoom in beyond 100%
  
  zoomLevel.value = scale
  panX.value = 0
  panY.value = 0
  showZoomIndicatorTemporarily()
}

const handleWheel = (event) => {
  const delta = event.deltaY > 0 ? -zoomStep : zoomStep
  const newZoom = Math.max(minZoom, Math.min(maxZoom, zoomLevel.value + delta))
  
  if (newZoom !== zoomLevel.value) {
    zoomLevel.value = newZoom
    showZoomIndicatorTemporarily()
  }
}

const startPan = (event) => {
  if (!canPan.value) return
  
  isPanning.value = true
  lastPanPoint.value = { x: event.clientX, y: event.clientY }
  event.preventDefault()
}

const handlePan = (event) => {
  if (!isPanning.value || !canPan.value) return
  
  const deltaX = event.clientX - lastPanPoint.value.x
  const deltaY = event.clientY - lastPanPoint.value.y
  
  panX.value += deltaX / zoomLevel.value
  panY.value += deltaY / zoomLevel.value
  
  lastPanPoint.value = { x: event.clientX, y: event.clientY }
}

const endPan = () => {
  isPanning.value = false
}

const handleDoubleClick = () => {
  if (zoomLevel.value === 1) {
    fitToWindow()
  } else {
    resetZoom()
  }
}

const showZoomIndicatorTemporarily = () => {
  showZoomIndicator.value = true
  setTimeout(() => {
    showZoomIndicator.value = false
  }, 1000)
}

const handleImageLoad = () => {
  isLoading.value = false
  error.value = null
  
  if (imageElement.value) {
    imageNaturalWidth.value = imageElement.value.naturalWidth
    imageNaturalHeight.value = imageElement.value.naturalHeight
    
    // Auto-fit large images
    nextTick(() => {
      if (imageContainer.value) {
        const containerRect = imageContainer.value.getBoundingClientRect()
        if (imageNaturalWidth.value > containerRect.width || 
            imageNaturalHeight.value > containerRect.height) {
          fitToWindow()
        }
      }
    })
  }
}

const handleImageError = () => {
  isLoading.value = false
  error.value = 'Impossible de charger l\'image'
  emit('error', new Error('Failed to load image'))
}

const downloadImage = () => {
  emit('download')
}

const formatFileSize = (bytes) => {
  if (!bytes) return '0 B'
  
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
}

const formatDate = (date) => {
  if (!date) return ''
  
  const d = new Date(date)
  return d.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

// Keyboard shortcuts
const handleKeydown = (event) => {
  switch (event.key) {
    case '+':
    case '=':
      if (event.ctrlKey) {
        event.preventDefault()
        zoomIn()
      }
      break
    case '-':
      if (event.ctrlKey) {
        event.preventDefault()
        zoomOut()
      }
      break
    case '0':
      if (event.ctrlKey) {
        event.preventDefault()
        resetZoom()
      }
      break
    case 'f':
      if (event.ctrlKey) {
        event.preventDefault()
        fitToWindow()
      }
      break
  }
}

// Watchers
watch(() => props.imageUrl, () => {
  isLoading.value = true
  error.value = null
  resetZoom()
})

// Lifecycle
onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.image-viewer {
  user-select: none;
}

/* Prevent image dragging */
img {
  pointer-events: none;
  user-select: none;
  -webkit-user-drag: none;
  -khtml-user-drag: none;
  -moz-user-drag: none;
  -o-user-drag: none;
}

/* Custom scrollbar for metadata panel */
.overflow-auto::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.overflow-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-auto::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}

.overflow-auto::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}
</style>