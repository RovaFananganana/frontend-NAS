<template>
  <div class="mosaic-view">
    <!-- En-tête avec tri -->
    <div class="flex items-center justify-between mb-4">
      <div class="text-sm text-base-content/70">
        {{ files.length }} {{ files.length === 1 ? 'élément' : 'éléments' }}
      </div>
      <div class="flex items-center gap-2">
        <select v-model="sortBy" class="select select-sm select-bordered">
          <option value="name">Nom</option>
          <option value="size">Taille</option>
          <option value="modified">Modifié</option>
          <option value="type">Type</option>
        </select>
        <button @click="toggleSortDirection" class="btn btn-sm btn-ghost">
          <i :class="sortDirection === 'asc' ? 'fas fa-sort-alpha-down' : 'fas fa-sort-alpha-up'"></i>
        </button>
      </div>
    </div>

    <!-- Grille mosaïque -->
    <div 
      class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4 min-h-64"
      @contextmenu="handleEmptySpaceContextMenu"
    >
      <div
        v-for="file in sortedFiles"
        :key="file.path"
        :class="[
          'mosaic-item group cursor-pointer rounded-lg border-2 transition-all duration-200',
          'hover:shadow-lg hover:scale-105',
          {
            'border-primary bg-primary/10': props.isSelected(file.path || file.name),
            'border-base-300 hover:border-primary/50': !props.isSelected(file.path || file.name)
          }
        ]"
        @click="handleItemClick(file, $event)"
        @dblclick="handleItemDoubleClick(file, $event)"
        @contextmenu="handleContextMenu(file, $event)"
        :title="file.name"
      >
        <!-- Icône du fichier -->
        <div class="p-4 text-center">
          <div class="text-4xl mb-2">
            <i v-if="file.is_directory" class="fas fa-folder text-blue-500"></i>
            <i v-else-if="isImageFile(file)" class="fas fa-image text-purple-500"></i>
            <i v-else-if="isVideoFile(file)" class="fas fa-video text-red-500"></i>
            <i v-else-if="isAudioFile(file)" class="fas fa-music text-green-500"></i>
            <i v-else-if="isPdfFile(file)" class="fas fa-file-pdf text-red-500"></i>
            <i v-else-if="isWordFile(file)" class="fas fa-file-word text-blue-600"></i>
            <i v-else-if="isExcelFile(file)" class="fas fa-file-excel text-green-600"></i>
            <i v-else-if="isPowerPointFile(file)" class="fas fa-file-powerpoint text-red-600"></i>
            <i v-else-if="isAccessFile(file)" class="fas fa-database text-red-600"></i>
            <i v-else-if="isDocumentFile(file)" class="fas fa-file-alt text-blue-600"></i>
            <i v-else-if="isArchiveFile(file)" class="fas fa-file-archive text-orange-500"></i>
            <i v-else-if="isCodeFile(file)" class="fas fa-file-code text-yellow-500"></i>
            <i v-else class="fas fa-file text-gray-500"></i>
          </div>
          
          <!-- Nom du fichier -->
          <div class="text-xs font-medium text-center break-words line-clamp-2">
            {{ file.name }}
          </div>
          
          <!-- Informations supplémentaires -->
          <div v-if="!file.is_directory" class="text-xs text-base-content/50 mt-1">
            {{ formatFileSize(file.size) }}
          </div>
        </div>

        <!-- Indicateur de sélection -->
        <div v-if="props.isSelected(file.path || file.name)" 
          class="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
          <i class="fas fa-check text-white text-xs"></i>
        </div>
        
        <!-- Indicateur favori -->
        <div v-if="props.isFavorite(file.path || file.name)" 
          class="absolute top-2 left-2 w-5 h-5 bg-warning rounded-full flex items-center justify-center"
          title="Favori">
          <i class="fas fa-star text-white text-xs"></i>
        </div>
      </div>
    </div>

    <!-- État vide -->
    <div v-if="files.length === 0" class="text-center py-12">
      <i class="fas fa-folder-open text-6xl text-base-content/30 mb-4"></i>
      <p class="text-base-content/70">Aucun fichier dans ce dossier</p>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

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
  },
  isSelected: {
    type: Function,
    default: () => false
  },
  isFavorite: {
    type: Function,
    default: () => false
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

// État local
const sortBy = ref('name')
const sortDirection = ref('asc')

// Computed
const sortedFiles = computed(() => {
  const sorted = [...props.files].sort((a, b) => {
    let aValue, bValue

    switch (sortBy.value) {
      case 'size':
        aValue = a.size || 0
        bValue = b.size || 0
        break
      case 'modified':
        aValue = new Date(a.modified_time || 0)
        bValue = new Date(b.modified_time || 0)
        break
      case 'type':
        aValue = a.is_directory ? 'folder' : (a.name.split('.').pop() || '')
        bValue = b.is_directory ? 'folder' : (b.name.split('.').pop() || '')
        break
      default: // name
        aValue = a.name.toLowerCase()
        bValue = b.name.toLowerCase()
    }

    if (aValue < bValue) return sortDirection.value === 'asc' ? -1 : 1
    if (aValue > bValue) return sortDirection.value === 'asc' ? 1 : -1
    return 0
  })

  // Toujours mettre les dossiers en premier
  return sorted.sort((a, b) => {
    if (a.is_directory && !b.is_directory) return -1
    if (!a.is_directory && b.is_directory) return 1
    return 0
  })
})

// Méthodes
const toggleSortDirection = () => {
  sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  
  emit('sort-changed', {
    column: sortBy.value,
    direction: sortDirection.value
  })
}



const getFileIndex = (file) => {
  return sortedFiles.value.findIndex(f => (f.path || f.name) === (file.path || file.name))
}

const handleItemClick = (file, event) => {
  const fileIndex = getFileIndex(file)
  
  emit('file-selected', {
    file,
    event,
    multiSelect: event.ctrlKey || event.metaKey,
    rangeSelect: event.shiftKey,
    currentIndex: fileIndex,
    files: sortedFiles.value
  })
}

const handleItemDoubleClick = (file, event) => {
  if (file.is_directory) {
    emit('path-selected', file.path)
  } else {
    emit('file-double-click', {
      file,
      event
    })
  }
}

const handleContextMenu = (file, event) => {
  event.preventDefault()
  emit('context-menu', event, file)
}

const handleEmptySpaceContextMenu = (event) => {
  // Only trigger if the click is on the grid container itself, not on a file item
  if (event.target === event.currentTarget) {
    event.preventDefault()
    emit('context-menu', event, null) // null indicates empty space
  }
}

// Utilitaires pour les types de fichiers
const isImageFile = (file) => {
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp']
  const ext = file.name.split('.').pop()?.toLowerCase()
  return imageExtensions.includes(ext)
}

const isVideoFile = (file) => {
  const videoExtensions = ['mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv', 'webm']
  const ext = file.name.split('.').pop()?.toLowerCase()
  return videoExtensions.includes(ext)
}

const isAudioFile = (file) => {
  const audioExtensions = ['mp3', 'wav', 'flac', 'aac', 'ogg', 'wma']
  const ext = file.name.split('.').pop()?.toLowerCase()
  return audioExtensions.includes(ext)
}

const isDocumentFile = (file) => {
  const docExtensions = ['txt', 'rtf', 'odt', 'md']
  const ext = file.name.split('.').pop()?.toLowerCase()
  return docExtensions.includes(ext)
}

// Fonctions spécifiques pour Microsoft Office
const isPdfFile = (file) => {
  const ext = file.name.split('.').pop()?.toLowerCase()
  return ext === 'pdf'
}

const isWordFile = (file) => {
  const wordExtensions = ['doc', 'docx']
  const ext = file.name.split('.').pop()?.toLowerCase()
  return wordExtensions.includes(ext)
}

const isExcelFile = (file) => {
  const excelExtensions = ['xls', 'xlsx', 'csv']
  const ext = file.name.split('.').pop()?.toLowerCase()
  return excelExtensions.includes(ext)
}

const isPowerPointFile = (file) => {
  const pptExtensions = ['ppt', 'pptx']
  const ext = file.name.split('.').pop()?.toLowerCase()
  return pptExtensions.includes(ext)
}

const isAccessFile = (file) => {
  const accessExtensions = ['mdb', 'accdb']
  const ext = file.name.split('.').pop()?.toLowerCase()
  return accessExtensions.includes(ext)
}

const isCodeFile = (file) => {
  const codeExtensions = ['js', 'ts', 'html', 'css', 'json', 'xml', 'py', 'php', 'java', 'cpp', 'c', 'vue', 'jsx', 'tsx']
  const ext = file.name.split('.').pop()?.toLowerCase()
  return codeExtensions.includes(ext)
}

const isArchiveFile = (file) => {
  const archiveExtensions = ['zip', 'rar', '7z', 'tar', 'gz', 'bz2']
  const ext = file.name.split('.').pop()?.toLowerCase()
  return archiveExtensions.includes(ext)
}

const formatFileSize = (bytes) => {
  if (!bytes) return ''
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
}
</script>

<style scoped>
.mosaic-item {
  position: relative;
  aspect-ratio: 1;
  min-height: 120px;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>