<template>
  <div 
    ref="gridContainer"
    class="grid-view"
    role="grid"
    :aria-label="`Grille des fichiers, ${files?.length || 0} éléments`"
    :aria-busy="loading"
    tabindex="0"
    @keydown="handleKeydown"
    @focus="handleFocus"
    @blur="handleBlur"
  >
    <!-- Selection controls -->
    <div v-if="selectedCount > 0" class="selection-bar bg-primary/10 border-b border-primary/20 px-4 py-2 flex items-center justify-between mb-4 rounded-lg">
      <div class="flex items-center gap-4">
        <span class="text-sm font-medium text-primary">
          {{ selectedCount }} élément{{ selectedCount > 1 ? 's' : '' }} sélectionné{{ selectedCount > 1 ? 's' : '' }}
        </span>
        <div class="flex items-center gap-2">
          <button 
            @click="selectAll"
            class="btn btn-xs btn-outline btn-primary"
            :disabled="selectedCount === files.length"
          >
            Tout sélectionner
          </button>
          <button 
            @click="clearSelection"
            class="btn btn-xs btn-ghost"
          >
            Désélectionner
          </button>
        </div>
      </div>
      <button 
        @click="clearSelection"
        class="btn btn-xs btn-circle btn-ghost"
        aria-label="Fermer la barre de sélection"
      >
        <i class="fas fa-times"></i>
      </button>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="flex justify-center py-12" role="status" aria-live="polite">
      <div class="loading loading-spinner loading-md"></div>
      <span class="sr-only">Chargement des fichiers...</span>
    </div>
    
    <!-- Error state -->
    <div v-else-if="error" class="text-error text-center py-12" role="alert" aria-live="assertive">
      <i class="fas fa-exclamation-triangle text-2xl mb-2"></i>
      <p class="text-lg font-medium">Erreur de chargement</p>
      <p class="text-sm">{{ error }}</p>
    </div>
    
    <!-- Empty state -->
    <div v-else-if="!files || files.length === 0" class="text-base-content/60 text-center py-12">
      <i class="fas fa-folder-open text-4xl mb-4 opacity-50"></i>
      <p class="text-lg font-medium">Aucun fichier dans ce dossier</p>
      <p class="text-sm">Ce dossier est vide ou vous n'avez pas les permissions pour voir son contenu.</p>
    </div>
    
    <!-- Grid content -->
    <div v-else class="grid-content">
      <div 
        class="file-grid"
        :class="{
          'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8': gridSize === 'small',
          'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6': gridSize === 'medium',
          'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5': gridSize === 'large'
        }"
      >
        <div
          v-for="(file, index) in sortedFiles"
          :key="file.path || file.name"
          :class="[
            'file-item cursor-pointer transition-all duration-200 rounded-lg border-2 border-transparent',
            'hover:border-primary/30 hover:bg-base-200/50 hover:shadow-md hover:scale-105',
            'focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary',
            {
              'bg-primary/10 border-primary shadow-md': isSelected(file.path || file.name),
              'ring-2 ring-primary': focusedIndex === index && isKeyboardNavigating,
              'transform scale-95': isPressed(index)
            }
          ]"
          :tabindex="focusedIndex === index ? 0 : -1"
          role="gridcell"
          :aria-selected="isSelected(file.path || file.name)"
          :aria-label="getFileAriaLabel(file)"
          @click="handleFileClick(file, $event, index)"
          @dblclick="handleFileDoubleClick(file, $event)"
          @contextmenu="handleContextMenu(file, $event)"
          @keydown="handleItemKeydown($event, file, index)"
          @mousedown="handleMouseDown(index)"
          @mouseup="handleMouseUp(index)"
          @mouseleave="handleMouseLeave(index)"
        >
          <!-- Selection checkbox -->
          <div class="absolute top-2 left-2 z-10">
            <label class="cursor-pointer" @click.stop>
              <input 
                type="checkbox"
                class="checkbox checkbox-sm bg-white/90 border-2"
                :class="{ 'opacity-100': isSelected(file.path || file.name) || isHovered(index), 'opacity-0': !isSelected(file.path || file.name) && !isHovered(index) }"
                :checked="isSelected(file.path || file.name)"
                @change="toggleFileSelection(file, $event)"
                :aria-label="`Sélectionner ${file.name}`"
              />
            </label>
          </div>

          <!-- File icon/thumbnail -->
          <div class="file-icon-container flex items-center justify-center mb-3">
            <div 
              class="file-icon-wrapper relative"
              :class="{
                'w-12 h-12': gridSize === 'small',
                'w-16 h-16': gridSize === 'medium',
                'w-20 h-20': gridSize === 'large'
              }"
            >
              <!-- Directory icon -->
              <i 
                v-if="file.is_directory"
                :class="[
                  'fas fa-folder text-blue-600',
                  {
                    'text-3xl': gridSize === 'small',
                    'text-4xl': gridSize === 'medium',
                    'text-5xl': gridSize === 'large'
                  }
                ]"
              ></i>
              
              <!-- File icon optimized for search results -->
              <i 
                v-else
                :class="[
                  getFileIcon(file),
                  getFileIconColor(file),
                  {
                    'text-3xl': gridSize === 'small',
                    'text-4xl': gridSize === 'medium',
                    'text-5xl': gridSize === 'large'
                  }
                ]"
              ></i>
              
              <!-- File type indicator -->
              <div 
                v-if="!file.is_directory && getFileExtension(file.name)"
                class="absolute -bottom-1 -right-1 bg-base-100 border border-base-300 rounded px-1 text-xs font-mono text-base-content/70"
              >
                {{ getFileExtension(file.name).toUpperCase() }}
              </div>
            </div>
          </div>
          
          <!-- File name -->
          <div class="file-name text-center px-2">
            <p 
              class="text-sm font-medium text-base-content line-clamp-2 break-words"
              :title="file.name"
            >
              {{ file.name }}
            </p>
          </div>
          
          <!-- File details (for medium and large sizes) -->
          <div v-if="gridSize !== 'small'" class="file-details text-center px-2 mt-2 text-xs text-base-content/60">
            <p v-if="!file.is_directory && file.size">{{ formatFileSize(file) }}</p>
            <p v-if="file.modified_time">{{ formatFileDate(file) }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Grid size controls -->
    <div class="grid-controls fixed bottom-4 right-4 bg-base-100 border border-base-300 rounded-lg shadow-lg p-2 flex items-center gap-2">
      <button
        v-for="size in gridSizes"
        :key="size.id"
        @click="setGridSize(size.id)"
        :class="[
          'btn btn-xs',
          {
            'btn-primary': gridSize === size.id,
            'btn-ghost': gridSize !== size.id
          }
        ]"
        :title="size.label"
        :aria-label="`Taille de grille ${size.label}`"
      >
        <i :class="size.icon"></i>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, nextTick } from 'vue'
import { useViewMode } from '@/composables/useViewMode.js'
import { formatBytes, formatDate } from '@/utils/fileUtils.js'

// Props
const props = defineProps({
  files: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: ''
  },
  currentPath: {
    type: String,
    default: '/'
  },
  focusedIndex: {
    type: Number,
    default: -1
  },
  userRole: {
    type: String,
    default: 'user'
  },
  fileOperationsState: {
    type: Object,
    default: () => ({
      hasOperation: false,
      isCopyOperation: false,
      isCutOperation: false,
      operationItems: [],
      isItemInOperation: () => false,
      getItemIndicatorClass: () => ''
    })
  }
})

// Émissions
const emit = defineEmits([
  'file-selected',
  'file-double-click',
  'path-selected',
  'sort-changed',
  'context-menu',
  'navigate-back',
  'show-actions'
])

// Composables
const {
  sortColumn,
  sortDirection,
  isSelected,
  sortFiles,
  selectedFiles,
  setSelectedFiles,
  addSelectedFile,
  removeSelectedFile,
  toggleSelectedFile,
  clearSelection,
  selectAll: selectAllFiles,
  getSelectedCount
} = useViewMode()

// Refs
const gridContainer = ref(null)

// Local state
const focusedIndex = ref(props.focusedIndex)
const isKeyboardNavigating = ref(false)
const lastSelectedIndex = ref(-1)
const gridSize = ref('medium')
const hoveredIndex = ref(-1)
const pressedIndex = ref(-1)

// Grid size options
const gridSizes = [
  { id: 'small', label: 'Petite', icon: 'fas fa-th' },
  { id: 'medium', label: 'Moyenne', icon: 'fas fa-th-large' },
  { id: 'large', label: 'Grande', icon: 'fas fa-square' }
]

// Computed properties
const sortedFiles = computed(() => {
  return sortFiles(props.files)
})

const selectedCount = computed(() => getSelectedCount())

// Utility functions optimized for performance
const getFileIcon = (file) => {
  // Utiliser les informations d'icône pré-calculées si disponibles (pour les résultats de recherche)
  if (file.icon_info && file.icon_info.icon) {
    return file.icon_info.icon
  }

  // Fallback pour les fichiers normaux
  if (file.is_directory) {
    return 'fas fa-folder'
  }

  const ext = getFileExtension(file.name)?.toLowerCase()
  const iconMap = {
    // Documents
    'pdf': 'fas fa-file-pdf',
    'doc': 'fas fa-file-word', 'docx': 'fas fa-file-word',
    'xls': 'fas fa-file-excel', 'xlsx': 'fas fa-file-excel',
    'ppt': 'fas fa-file-powerpoint', 'pptx': 'fas fa-file-powerpoint',
    
    // Images
    'jpg': 'fas fa-file-image', 'jpeg': 'fas fa-file-image', 'png': 'fas fa-file-image',
    'gif': 'fas fa-file-image', 'svg': 'fas fa-file-image', 'bmp': 'fas fa-file-image',
    'webp': 'fas fa-file-image',
    
    // Videos
    'mp4': 'fas fa-file-video', 'avi': 'fas fa-file-video', 'mov': 'fas fa-file-video',
    'wmv': 'fas fa-file-video', 'flv': 'fas fa-file-video', 'webm': 'fas fa-file-video',
    'mkv': 'fas fa-file-video',
    
    // Audio
    'mp3': 'fas fa-file-audio', 'wav': 'fas fa-file-audio', 'flac': 'fas fa-file-audio',
    'ogg': 'fas fa-file-audio', 'aac': 'fas fa-file-audio', 'm4a': 'fas fa-file-audio',
    
    // Archives
    'zip': 'fas fa-file-archive', 'rar': 'fas fa-file-archive', '7z': 'fas fa-file-archive',
    'tar': 'fas fa-file-archive', 'gz': 'fas fa-file-archive',
    
    // Code
    'js': 'fas fa-file-code', 'ts': 'fas fa-file-code', 'html': 'fas fa-file-code',
    'css': 'fas fa-file-code', 'json': 'fas fa-file-code', 'xml': 'fas fa-file-code',
    'py': 'fas fa-file-code', 'php': 'fas fa-file-code', 'java': 'fas fa-file-code',
    'cpp': 'fas fa-file-code', 'c': 'fas fa-file-code', 'vue': 'fas fa-file-code',
    'jsx': 'fas fa-file-code', 'tsx': 'fas fa-file-code',
    
    // Text
    'txt': 'fas fa-file-alt', 'md': 'fas fa-file-alt', 'readme': 'fas fa-file-alt'
  }

  return iconMap[ext] || 'fas fa-file'
}

// Fonction optimisée pour obtenir la couleur de l'icône
const getFileIconColor = (file) => {
  // Utiliser les informations de couleur pré-calculées si disponibles
  if (file.icon_info && file.icon_info.color) {
    return file.icon_info.color
  }

  // Fallback pour les fichiers normaux
  if (file.is_directory) {
    return 'text-blue-500'
  }

  return 'text-gray-500'
}

const formatFileSize = (file) => {
  if (file.is_directory) return ''
  return formatBytes(file.size || 0)
}

const formatFileDate = (file) => {
  return formatDate(file.modified_time)
}

const getFileExtension = (filename) => {
  if (!filename) return ''
  const parts = filename.split('.')
  return parts.length > 1 ? parts.pop() : ''
}

const getFileAriaLabel = (file) => {
  const type = file.is_directory ? 'Dossier' : 'Fichier'
  const size = file.is_directory ? '' : `, taille ${formatFileSize(file)}`
  const date = file.modified_time ? `, modifié le ${formatFileDate(file)}` : ''
  const selectedText = isSelected(file.path || file.name) ? ', sélectionné' : ''
  
  return `${type} ${file.name}${size}${date}${selectedText}`
}

const isHovered = (index) => hoveredIndex.value === index
const isPressed = (index) => pressedIndex.value === index

// Event handlers
const handleFileClick = (file, event, index) => {
  const filePath = file.path || file.name
  
  if (event.shiftKey && lastSelectedIndex.value >= 0) {
    // Range selection
    const startIndex = Math.min(lastSelectedIndex.value, index)
    const endIndex = Math.max(lastSelectedIndex.value, index)
    
    const rangeFiles = []
    for (let i = startIndex; i <= endIndex; i++) {
      if (sortedFiles.value[i]) {
        rangeFiles.push(sortedFiles.value[i].path || sortedFiles.value[i].name)
      }
    }
    
    const newSelection = [...new Set([...selectedFiles.value, ...rangeFiles])]
    setSelectedFiles(newSelection)
  } else if (event.ctrlKey || event.metaKey) {
    // Toggle selection
    toggleSelectedFile(filePath)
    lastSelectedIndex.value = index
  } else {
    // Single selection
    setSelectedFiles([filePath])
    lastSelectedIndex.value = index
  }
  
  focusedIndex.value = index
  
  emit('file-selected', {
    file,
    event,
    multiSelect: event.ctrlKey || event.metaKey,
    rangeSelect: event.shiftKey,
    currentIndex: index,
    files: sortedFiles.value
  })
}

const handleFileDoubleClick = (file, event) => {
  if (file.is_directory) {
    emit('path-selected', file.path)
  } else {
    emit('file-double-click', { file, event })
  }
}

const handleContextMenu = (file, event) => {
  event.preventDefault()
  
  const filePath = file.path || file.name
  if (!isSelected(filePath)) {
    setSelectedFiles([filePath])
  }
  
  emit('context-menu', event, file)
}

const toggleFileSelection = (file, event) => {
  event.stopPropagation()
  const filePath = file.path || file.name
  toggleSelectedFile(filePath)
}

const selectAll = () => {
  selectAllFiles(sortedFiles.value)
}

const setGridSize = (size) => {
  gridSize.value = size
  // Save preference to localStorage
  localStorage.setItem('grid-view-size', size)
}

// Mouse interaction handlers
const handleMouseDown = (index) => {
  pressedIndex.value = index
}

const handleMouseUp = (index) => {
  pressedIndex.value = -1
}

const handleMouseLeave = (index) => {
  pressedIndex.value = -1
  hoveredIndex.value = -1
}

// Keyboard navigation
const handleKeydown = (event) => {
  if (!sortedFiles.value.length) return
  
  isKeyboardNavigating.value = true
  
  const gridCols = getGridColumns()
  const totalItems = sortedFiles.value.length
  
  switch (event.key) {
    case 'ArrowRight':
      event.preventDefault()
      if (focusedIndex.value < totalItems - 1) {
        focusedIndex.value++
        focusItem(focusedIndex.value)
        
        if (!event.shiftKey) {
          const file = sortedFiles.value[focusedIndex.value]
          setSelectedFiles([file.path || file.name])
          lastSelectedIndex.value = focusedIndex.value
        }
      }
      break
      
    case 'ArrowLeft':
      event.preventDefault()
      if (focusedIndex.value > 0) {
        focusedIndex.value--
        focusItem(focusedIndex.value)
        
        if (!event.shiftKey) {
          const file = sortedFiles.value[focusedIndex.value]
          setSelectedFiles([file.path || file.name])
          lastSelectedIndex.value = focusedIndex.value
        }
      }
      break
      
    case 'ArrowDown':
      event.preventDefault()
      const nextRowIndex = focusedIndex.value + gridCols
      if (nextRowIndex < totalItems) {
        focusedIndex.value = nextRowIndex
        focusItem(focusedIndex.value)
        
        if (!event.shiftKey) {
          const file = sortedFiles.value[focusedIndex.value]
          setSelectedFiles([file.path || file.name])
          lastSelectedIndex.value = focusedIndex.value
        }
      }
      break
      
    case 'ArrowUp':
      event.preventDefault()
      const prevRowIndex = focusedIndex.value - gridCols
      if (prevRowIndex >= 0) {
        focusedIndex.value = prevRowIndex
        focusItem(focusedIndex.value)
        
        if (!event.shiftKey) {
          const file = sortedFiles.value[focusedIndex.value]
          setSelectedFiles([file.path || file.name])
          lastSelectedIndex.value = focusedIndex.value
        }
      }
      break
      
    case 'Enter':
      event.preventDefault()
      if (focusedIndex.value >= 0 && focusedIndex.value < totalItems) {
        const file = sortedFiles.value[focusedIndex.value]
        handleFileDoubleClick(file, event)
      }
      break
      
    case ' ':
      event.preventDefault()
      if (focusedIndex.value >= 0 && focusedIndex.value < totalItems) {
        const file = sortedFiles.value[focusedIndex.value]
        toggleSelectedFile(file.path || file.name)
      }
      break
      
    case 'a':
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault()
        selectAll()
      }
      break
      
    case 'Escape':
      event.preventDefault()
      clearSelection()
      break
      
    case 'Home':
      event.preventDefault()
      focusedIndex.value = 0
      focusItem(0)
      break
      
    case 'End':
      event.preventDefault()
      focusedIndex.value = totalItems - 1
      focusItem(focusedIndex.value)
      break
  }
}

const handleItemKeydown = (event, file, index) => {
  focusedIndex.value = index
  handleKeydown(event)
}

const handleFocus = () => {
  isKeyboardNavigating.value = true
  if (focusedIndex.value === -1 && sortedFiles.value.length > 0) {
    focusedIndex.value = 0
  }
}

const handleBlur = () => {
  setTimeout(() => {
    if (!gridContainer.value?.contains(document.activeElement)) {
      isKeyboardNavigating.value = false
    }
  }, 100)
}

const getGridColumns = () => {
  const container = gridContainer.value?.querySelector('.file-grid')
  if (!container) return 4
  
  const computedStyle = window.getComputedStyle(container)
  const gridTemplateColumns = computedStyle.gridTemplateColumns
  return gridTemplateColumns.split(' ').length
}

const focusItem = async (index) => {
  await nextTick()
  const item = gridContainer.value?.querySelector(`.file-item:nth-child(${index + 1})`)
  if (item) {
    item.focus()
  }
}

// Load grid size preference
const loadGridSizePreference = () => {
  const saved = localStorage.getItem('grid-view-size')
  if (saved && gridSizes.some(size => size.id === saved)) {
    gridSize.value = saved
  }
}

// Initialize
loadGridSizePreference()
</script>

<style scoped>
.grid-view {
  min-height: 200px;
  max-height: 600px;
  overflow-y: auto;
  padding: 1rem;
}

.selection-bar {
  animation: slideDown 0.2s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.grid-content {
  flex: 1;
}

.file-grid {
  display: grid;
  gap: 1rem;
  padding: 0.5rem;
}

.file-item {
  position: relative;
  padding: 1rem;
  background: hsl(var(--b1));
  border-radius: 0.75rem;
  min-height: 120px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.file-item:hover {
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.file-item:active {
  transform: translateY(0) scale(0.98);
}

.file-item:focus {
  outline: none;
  box-shadow: 0 0 0 3px hsl(var(--p) / 0.3);
}

.file-icon-container {
  flex-shrink: 0;
}

.file-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.file-name {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 2.5rem;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.file-details {
  flex-shrink: 0;
  opacity: 0.8;
}

/* Checkbox styling */
.checkbox {
  transition: opacity 0.2s ease;
  backdrop-filter: blur(4px);
}

/* Grid controls */
.grid-controls {
  backdrop-filter: blur(8px);
  z-index: 10;
}

/* Selection states */
.file-item[aria-selected="true"] {
  background: hsl(var(--p) / 0.1);
  border-color: hsl(var(--p));
  color: hsl(var(--p));
}

.file-item[aria-selected="true"] i {
  color: hsl(var(--p));
}

/* Loading spinner */
.loading-spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Responsive design */
@media (max-width: 768px) {
  .grid-view {
    padding: 0.5rem;
    max-height: calc(100vh - 200px);
  }
  
  .file-grid {
    gap: 0.75rem;
  }
  
  .file-item {
    padding: 0.75rem;
    min-height: 100px;
  }
  
  .grid-controls {
    bottom: 2rem;
    right: 1rem;
  }
}

@media (max-width: 480px) {
  .file-grid {
    gap: 0.5rem;
  }
  
  .file-item {
    padding: 0.5rem;
    min-height: 80px;
  }
  
  .file-name p {
    font-size: 0.75rem;
  }
  
  .file-details {
    font-size: 0.625rem;
  }
}

/* Accessibility improvements */
@media (prefers-reduced-motion: reduce) {
  .file-item {
    transition: none;
  }
  
  .file-item:hover {
    transform: none;
  }
  
  .checkbox {
    transition: none;
  }
  
  .selection-bar {
    animation: none;
  }
  
  .loading-spinner {
    animation: none;
  }
}

@media (prefers-contrast: high) {
  .file-item:focus {
    outline: 3px solid;
    outline-offset: 2px;
  }
  
  .file-item[aria-selected="true"] {
    border-width: 3px;
  }
}

/* Print styles */
@media print {
  .selection-bar,
  .checkbox,
  .grid-controls {
    display: none;
  }
  
  .file-grid {
    display: block;
    columns: 3;
    column-gap: 1rem;
  }
  
  .file-item {
    break-inside: avoid;
    margin-bottom: 1rem;
    border: 1px solid #000;
  }
}
</style>