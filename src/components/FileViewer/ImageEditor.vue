<template>
  <div class="image-editor h-full flex flex-col bg-base-100">
    <!-- Editor Toolbar -->
    <div class="flex items-center justify-between p-3 border-b border-base-300 bg-base-50">
      <div class="flex items-center space-x-4">
        <!-- Tool Selection -->
        <div class="flex items-center space-x-1">
          <button
            v-for="tool in tools"
            :key="tool.id"
            @click="selectTool(tool.id)"
            :class="[
              'btn btn-sm',
              selectedTool === tool.id ? 'btn-primary' : 'btn-ghost'
            ]"
            :title="tool.name"
          >
            <i :class="tool.icon"></i>
          </button>
        </div>

        <div class="divider divider-horizontal"></div>

        <!-- Transform Controls -->
        <div class="flex items-center space-x-1">
          <button
            @click="rotateLeft"
            class="btn btn-sm btn-ghost"
            title="Rotation -90°"
          >
            <i class="fas fa-undo"></i>
          </button>
          
          <button
            @click="rotateRight"
            class="btn btn-sm btn-ghost"
            title="Rotation +90°"
          >
            <i class="fas fa-redo"></i>
          </button>
          
          <button
            @click="flipHorizontal"
            class="btn btn-sm btn-ghost"
            title="Miroir horizontal"
          >
            <i class="fas fa-arrows-alt-h"></i>
          </button>
          
          <button
            @click="flipVertical"
            class="btn btn-sm btn-ghost"
            title="Miroir vertical"
          >
            <i class="fas fa-arrows-alt-v"></i>
          </button>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex items-center space-x-2">
        <button
          @click="resetChanges"
          :disabled="!hasChanges"
          class="btn btn-sm btn-ghost"
          title="Annuler les modifications"
        >
          <i class="fas fa-times mr-1"></i>
          Annuler
        </button>
        
        <button
          @click="exportImage"
          class="btn btn-sm btn-secondary"
          title="Exporter l'image"
        >
          <i class="fas fa-download mr-1"></i>
          Exporter
        </button>
        
        <button
          @click="saveChanges"
          :disabled="!hasChanges || isSaving"
          class="btn btn-sm btn-primary"
          title="Sauvegarder les modifications"
        >
          <span v-if="isSaving" class="loading loading-spinner loading-xs mr-1"></span>
          <i v-else class="fas fa-save mr-1"></i>
          Sauvegarder
        </button>
      </div>
    </div>

    <!-- Editor Content -->
    <div class="flex flex-1 min-h-0">
      <!-- Canvas Area -->
      <div class="flex-1 relative overflow-hidden bg-gray-100 dark:bg-gray-800">
        <!-- Loading State -->
        <div
          v-if="isLoading"
          class="absolute inset-0 flex items-center justify-center"
        >
          <div class="text-center">
            <div class="loading loading-spinner loading-lg mb-2"></div>
            <p class="text-base-content/70">Chargement de l'éditeur...</p>
          </div>
        </div>

        <!-- Canvas Container -->
        <div
          v-else
          ref="canvasContainer"
          class="absolute inset-0 flex items-center justify-center p-4"
          @wheel.prevent="handleWheel"
        >
          <canvas
            ref="canvas"
            class="max-w-full max-h-full border border-base-300 shadow-lg bg-white"
            @mousedown="handleCanvasMouseDown"
            @mousemove="handleCanvasMouseMove"
            @mouseup="handleCanvasMouseUp"
            @mouseleave="handleCanvasMouseUp"
          ></canvas>
        </div>

        <!-- Crop Overlay -->
        <div
          v-if="selectedTool === 'crop' && cropArea"
          class="absolute border-2 border-primary bg-primary/20"
          :style="cropOverlayStyle"
        >
          <!-- Crop Handles -->
          <div
            v-for="handle in cropHandles"
            :key="handle"
            :class="[
              'absolute w-3 h-3 bg-primary border border-white',
              getCropHandleClass(handle)
            ]"
            @mousedown.stop="startCropResize(handle, $event)"
          ></div>
        </div>
      </div>

      <!-- Adjustment Panel -->
      <div class="w-80 border-l border-base-300 bg-base-50 p-4 overflow-y-auto">
        <h3 class="font-semibold mb-4">Ajustements</h3>

        <!-- Brightness -->
        <div class="mb-4">
          <label class="block text-sm font-medium mb-2">
            Luminosité: {{ adjustments.brightness }}
          </label>
          <input
            v-model.number="adjustments.brightness"
            type="range"
            min="-100"
            max="100"
            step="1"
            class="range range-primary range-sm"
            @input="applyAdjustments"
          />
        </div>

        <!-- Contrast -->
        <div class="mb-4">
          <label class="block text-sm font-medium mb-2">
            Contraste: {{ adjustments.contrast.toFixed(1) }}
          </label>
          <input
            v-model.number="adjustments.contrast"
            type="range"
            min="0"
            max="3"
            step="0.1"
            class="range range-primary range-sm"
            @input="applyAdjustments"
          />
        </div>

        <!-- Saturation -->
        <div class="mb-4">
          <label class="block text-sm font-medium mb-2">
            Saturation: {{ adjustments.saturation.toFixed(1) }}
          </label>
          <input
            v-model.number="adjustments.saturation"
            type="range"
            min="0"
            max="3"
            step="0.1"
            class="range range-primary range-sm"
            @input="applyAdjustments"
          />
        </div>

        <div class="divider"></div>

        <!-- Resize Section -->
        <div class="mb-4">
          <h4 class="font-medium mb-2">Redimensionner</h4>
          
          <div class="grid grid-cols-2 gap-2 mb-2">
            <div>
              <label class="block text-xs mb-1">Largeur</label>
              <input
                v-model.number="resizeWidth"
                type="number"
                min="1"
                class="input input-sm input-bordered w-full"
                @input="updateResizeHeight"
              />
            </div>
            <div>
              <label class="block text-xs mb-1">Hauteur</label>
              <input
                v-model.number="resizeHeight"
                type="number"
                min="1"
                class="input input-sm input-bordered w-full"
                @input="updateResizeWidth"
              />
            </div>
          </div>
          
          <div class="flex items-center mb-2">
            <input
              v-model="maintainAspectRatio"
              type="checkbox"
              class="checkbox checkbox-sm checkbox-primary mr-2"
            />
            <label class="text-sm">Conserver les proportions</label>
          </div>
          
          <button
            @click="applyResize"
            :disabled="!resizeWidth || !resizeHeight"
            class="btn btn-sm btn-outline w-full"
          >
            Appliquer
          </button>
        </div>

        <div class="divider"></div>

        <!-- Export Options -->
        <div class="mb-4">
          <h4 class="font-medium mb-2">Export</h4>
          
          <div class="mb-2">
            <label class="block text-xs mb-1">Format</label>
            <select
              v-model="exportFormat"
              class="select select-sm select-bordered w-full"
            >
              <option value="png">PNG</option>
              <option value="jpeg">JPEG</option>
              <option value="webp">WebP</option>
            </select>
          </div>
          
          <div v-if="exportFormat === 'jpeg'" class="mb-2">
            <label class="block text-xs mb-1">
              Qualité: {{ Math.round(exportQuality * 100) }}%
            </label>
            <input
              v-model.number="exportQuality"
              type="range"
              min="0.1"
              max="1"
              step="0.1"
              class="range range-primary range-sm"
            />
          </div>
        </div>

        <!-- Reset Button -->
        <button
          @click="resetAdjustments"
          :disabled="!hasAdjustments"
          class="btn btn-sm btn-ghost w-full"
        >
          <i class="fas fa-undo mr-1"></i>
          Réinitialiser
        </button>
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
  }
})

// Emits
const emit = defineEmits(['save', 'export', 'cancel', 'error'])

// Refs
const canvas = ref(null)
const canvasContainer = ref(null)

// State
const isLoading = ref(true)
const isSaving = ref(false)
const selectedTool = ref('select')
const hasChanges = ref(false)

// Image data
const originalImage = ref(null)
const currentImageData = ref(null)
const canvasContext = ref(null)

// Adjustments
const adjustments = ref({
  brightness: 0,
  contrast: 1,
  saturation: 1
})

// Transform state
const rotation = ref(0)
const flipH = ref(false)
const flipV = ref(false)

// Crop state
const cropArea = ref(null)
const cropHandles = ['nw', 'ne', 'sw', 'se', 'n', 'e', 's', 'w']
const isCropping = ref(false)
const cropStartPoint = ref(null)

// Resize state
const resizeWidth = ref(0)
const resizeHeight = ref(0)
const maintainAspectRatio = ref(true)
const originalAspectRatio = ref(1)

// Export settings
const exportFormat = ref('png')
const exportQuality = ref(0.9)

// Tools configuration
const tools = [
  { id: 'select', name: 'Sélection', icon: 'fas fa-mouse-pointer' },
  { id: 'crop', name: 'Recadrer', icon: 'fas fa-crop' },
  { id: 'brush', name: 'Pinceau', icon: 'fas fa-paint-brush' }
]

// Computed
const hasAdjustments = computed(() => {
  return adjustments.value.brightness !== 0 ||
         adjustments.value.contrast !== 1 ||
         adjustments.value.saturation !== 1
})

const cropOverlayStyle = computed(() => {
  if (!cropArea.value) return {}
  
  return {
    left: `${cropArea.value.x}px`,
    top: `${cropArea.value.y}px`,
    width: `${cropArea.value.width}px`,
    height: `${cropArea.value.height}px`
  }
})

// Methods
const loadImage = async () => {
  try {
    isLoading.value = true
    
    const img = new Image()
    img.crossOrigin = 'anonymous'
    
    await new Promise((resolve, reject) => {
      img.onload = resolve
      img.onerror = reject
      img.src = props.imageUrl
    })
    
    originalImage.value = img
    
    // Setup canvas
    await nextTick()
    if (canvas.value) {
      canvas.value.width = img.width
      canvas.value.height = img.height
      canvasContext.value = canvas.value.getContext('2d')
      
      // Draw original image
      canvasContext.value.drawImage(img, 0, 0)
      currentImageData.value = canvasContext.value.getImageData(0, 0, img.width, img.height)
      
      // Initialize resize dimensions
      resizeWidth.value = img.width
      resizeHeight.value = img.height
      originalAspectRatio.value = img.width / img.height
    }
    
    isLoading.value = false
  } catch (error) {
    console.error('Error loading image:', error)
    emit('error', error)
    isLoading.value = false
  }
}

const selectTool = (toolId) => {
  selectedTool.value = toolId
  
  // Reset crop area when switching tools
  if (toolId !== 'crop') {
    cropArea.value = null
  }
}

const rotateLeft = () => {
  rotation.value = (rotation.value - 90) % 360
  applyTransforms()
}

const rotateRight = () => {
  rotation.value = (rotation.value + 90) % 360
  applyTransforms()
}

const flipHorizontal = () => {
  flipH.value = !flipH.value
  applyTransforms()
}

const flipVertical = () => {
  flipV.value = !flipV.value
  applyTransforms()
}

const applyTransforms = () => {
  if (!originalImage.value || !canvasContext.value) return
  
  const ctx = canvasContext.value
  const img = originalImage.value
  
  // Clear canvas
  ctx.clearRect(0, 0, canvas.value.width, canvas.value.height)
  
  // Save context state
  ctx.save()
  
  // Apply transformations
  ctx.translate(canvas.value.width / 2, canvas.value.height / 2)
  
  if (rotation.value !== 0) {
    ctx.rotate((rotation.value * Math.PI) / 180)
  }
  
  const scaleX = flipH.value ? -1 : 1
  const scaleY = flipV.value ? -1 : 1
  ctx.scale(scaleX, scaleY)
  
  // Draw image
  ctx.drawImage(img, -img.width / 2, -img.height / 2)
  
  // Restore context state
  ctx.restore()
  
  // Apply adjustments
  applyAdjustments()
  hasChanges.value = true
}

const applyAdjustments = () => {
  if (!originalImage.value || !canvasContext.value) return
  
  // Get current image data
  const imageData = canvasContext.value.getImageData(0, 0, canvas.value.width, canvas.value.height)
  const data = imageData.data
  
  // Apply brightness, contrast, saturation
  for (let i = 0; i < data.length; i += 4) {
    let r = data[i]
    let g = data[i + 1]
    let b = data[i + 2]
    
    // Apply brightness
    r += adjustments.value.brightness
    g += adjustments.value.brightness
    b += adjustments.value.brightness
    
    // Apply contrast
    r = ((r - 128) * adjustments.value.contrast) + 128
    g = ((g - 128) * adjustments.value.contrast) + 128
    b = ((b - 128) * adjustments.value.contrast) + 128
    
    // Apply saturation
    if (adjustments.value.saturation !== 1) {
      const gray = 0.299 * r + 0.587 * g + 0.114 * b
      r = gray + adjustments.value.saturation * (r - gray)
      g = gray + adjustments.value.saturation * (g - gray)
      b = gray + adjustments.value.saturation * (b - gray)
    }
    
    // Clamp values
    data[i] = Math.max(0, Math.min(255, r))
    data[i + 1] = Math.max(0, Math.min(255, g))
    data[i + 2] = Math.max(0, Math.min(255, b))
  }
  
  canvasContext.value.putImageData(imageData, 0, 0)
  hasChanges.value = true
}

const resetAdjustments = () => {
  adjustments.value = {
    brightness: 0,
    contrast: 1,
    saturation: 1
  }
  
  // Redraw with transforms only
  applyTransforms()
}

const updateResizeHeight = () => {
  if (maintainAspectRatio.value && resizeWidth.value) {
    resizeHeight.value = Math.round(resizeWidth.value / originalAspectRatio.value)
  }
}

const updateResizeWidth = () => {
  if (maintainAspectRatio.value && resizeHeight.value) {
    resizeWidth.value = Math.round(resizeHeight.value * originalAspectRatio.value)
  }
}

const applyResize = () => {
  if (!canvas.value || !resizeWidth.value || !resizeHeight.value) return
  
  // Create temporary canvas with current content
  const tempCanvas = document.createElement('canvas')
  const tempCtx = tempCanvas.getContext('2d')
  tempCanvas.width = canvas.value.width
  tempCanvas.height = canvas.value.height
  tempCtx.drawImage(canvas.value, 0, 0)
  
  // Resize main canvas
  canvas.value.width = resizeWidth.value
  canvas.value.height = resizeHeight.value
  
  // Draw resized image
  canvasContext.value.drawImage(tempCanvas, 0, 0, resizeWidth.value, resizeHeight.value)
  
  hasChanges.value = true
}

const handleCanvasMouseDown = (event) => {
  if (selectedTool.value === 'crop') {
    startCrop(event)
  }
}

const handleCanvasMouseMove = (event) => {
  if (selectedTool.value === 'crop' && isCropping.value) {
    updateCrop(event)
  }
}

const handleCanvasMouseUp = () => {
  if (selectedTool.value === 'crop') {
    endCrop()
  }
}

const startCrop = (event) => {
  const rect = canvas.value.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top
  
  cropStartPoint.value = { x, y }
  cropArea.value = { x, y, width: 0, height: 0 }
  isCropping.value = true
}

const updateCrop = (event) => {
  if (!cropStartPoint.value || !isCropping.value) return
  
  const rect = canvas.value.getBoundingClientRect()
  const currentX = event.clientX - rect.left
  const currentY = event.clientY - rect.top
  
  cropArea.value = {
    x: Math.min(cropStartPoint.value.x, currentX),
    y: Math.min(cropStartPoint.value.y, currentY),
    width: Math.abs(currentX - cropStartPoint.value.x),
    height: Math.abs(currentY - cropStartPoint.value.y)
  }
}

const endCrop = () => {
  isCropping.value = false
  
  if (cropArea.value && cropArea.value.width > 10 && cropArea.value.height > 10) {
    // Apply crop
    applyCrop()
  }
}

const applyCrop = () => {
  if (!cropArea.value || !canvas.value) return
  
  // Get cropped image data
  const imageData = canvasContext.value.getImageData(
    cropArea.value.x,
    cropArea.value.y,
    cropArea.value.width,
    cropArea.value.height
  )
  
  // Resize canvas to crop dimensions
  canvas.value.width = cropArea.value.width
  canvas.value.height = cropArea.value.height
  
  // Draw cropped image
  canvasContext.value.putImageData(imageData, 0, 0)
  
  // Update resize dimensions
  resizeWidth.value = cropArea.value.width
  resizeHeight.value = cropArea.value.height
  
  // Clear crop area
  cropArea.value = null
  hasChanges.value = true
}

const getCropHandleClass = (handle) => {
  const classes = {
    'nw': '-top-1.5 -left-1.5 cursor-nw-resize',
    'ne': '-top-1.5 -right-1.5 cursor-ne-resize',
    'sw': '-bottom-1.5 -left-1.5 cursor-sw-resize',
    'se': '-bottom-1.5 -right-1.5 cursor-se-resize',
    'n': '-top-1.5 left-1/2 -translate-x-1/2 cursor-n-resize',
    'e': 'top-1/2 -right-1.5 -translate-y-1/2 cursor-e-resize',
    's': '-bottom-1.5 left-1/2 -translate-x-1/2 cursor-s-resize',
    'w': 'top-1/2 -left-1.5 -translate-y-1/2 cursor-w-resize'
  }
  return classes[handle] || ''
}

const exportImage = async () => {
  if (!canvas.value) return
  
  try {
    const blob = await new Promise(resolve => {
      canvas.value.toBlob(resolve, `image/${exportFormat.value}`, exportQuality.value)
    })
    
    emit('export', {
      blob,
      format: exportFormat.value,
      filename: `${props.filename.split('.')[0]}_edited.${exportFormat.value}`
    })
  } catch (error) {
    console.error('Error exporting image:', error)
    emit('error', error)
  }
}

const saveChanges = async () => {
  if (!hasChanges.value) return
  
  try {
    isSaving.value = true
    
    const blob = await new Promise(resolve => {
      canvas.value.toBlob(resolve, 'image/png', 1.0)
    })
    
    emit('save', {
      blob,
      filename: props.filename
    })
    
    hasChanges.value = false
  } catch (error) {
    console.error('Error saving image:', error)
    emit('error', error)
  } finally {
    isSaving.value = false
  }
}

const resetChanges = () => {
  if (!originalImage.value) return
  
  // Reset all adjustments and transforms
  adjustments.value = {
    brightness: 0,
    contrast: 1,
    saturation: 1
  }
  rotation.value = 0
  flipH.value = false
  flipV.value = false
  cropArea.value = null
  
  // Restore original image
  canvas.value.width = originalImage.value.width
  canvas.value.height = originalImage.value.height
  canvasContext.value.drawImage(originalImage.value, 0, 0)
  
  // Reset resize dimensions
  resizeWidth.value = originalImage.value.width
  resizeHeight.value = originalImage.value.height
  
  hasChanges.value = false
}

const handleWheel = (event) => {
  // Zoom functionality could be added here
  event.preventDefault()
}

// Watchers
watch(() => props.imageUrl, () => {
  loadImage()
})

// Lifecycle
onMounted(() => {
  loadImage()
})
</script>

<style scoped>
.image-editor {
  user-select: none;
}

canvas {
  cursor: crosshair;
}

canvas:hover {
  cursor: crosshair;
}

/* Range slider styling */
.range {
  height: 0.5rem;
}

/* Custom scrollbar */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}
</style>