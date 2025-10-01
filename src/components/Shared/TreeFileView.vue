<template>
  <div class="tree-file-view">
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

    <!-- Vue arbre des fichiers -->
    <div class="tree-structure">
      <div
        v-for="file in sortedFiles"
        :key="file.path"
        :class="[
          'tree-item flex items-center py-2 px-3 rounded-lg cursor-pointer transition-all duration-200',
          'hover:bg-base-200',
          {
            'bg-primary/10 border-l-4 border-primary': selectedFiles.includes(file.path),
            'hover:bg-base-100': !selectedFiles.includes(file.path)
          }
        ]"
        @click="handleItemClick(file, $event)"
        @dblclick="handleItemDoubleClick(file)"
        :title="file.name"
      >
        <!-- Indentation et icône -->
        <div class="flex items-center flex-1">
          <!-- Icône de type -->
          <div class="w-8 flex justify-center mr-3">
            <i v-if="file.is_directory" class="fas fa-folder text-yellow-500"></i>
            <i v-else-if="isImageFile(file)" class="fas fa-image text-blue-500"></i>
            <i v-else-if="isVideoFile(file)" class="fas fa-video text-red-500"></i>
            <i v-else-if="isAudioFile(file)" class="fas fa-music text-purple-500"></i>
            <i v-else-if="isDocumentFile(file)" class="fas fa-file-alt text-green-500"></i>
            <i v-else-if="isArchiveFile(file)" class="fas fa-file-archive text-orange-500"></i>
            <i v-else class="fas fa-file text-gray-500"></i>
          </div>
          
          <!-- Nom du fichier -->
          <div class="flex-1 min-w-0">
            <div class="font-medium truncate">{{ file.name }}</div>
            <div v-if="!file.is_directory && file.size" class="text-xs text-base-content/50">
              {{ formatFileSize(file.size) }}
            </div>
          </div>
        </div>

        <!-- Informations supplémentaires -->
        <div class="flex items-center gap-4 text-sm text-base-content/60">
          <!-- Date de modification -->
          <div v-if="file.modified_time" class="hidden sm:block">
            {{ formatDate(file.modified_time) }}
          </div>
          
          <!-- Type de fichier -->
          <div v-if="!file.is_directory" class="hidden md:block">
            {{ getFileExtension(file.name).toUpperCase() }}
          </div>
          
          <!-- Taille -->
          <div v-if="!file.is_directory && file.size" class="hidden lg:block w-20 text-right">
            {{ formatFileSize(file.size) }}
          </div>
        </div>

        <!-- Indicateur de sélection -->
        <div v-if="selectedFiles.includes(file.path)" 
          class="ml-3 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
          <i class="fas fa-check text-white text-xs"></i>
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
  selectedFiles: {
    type: Array,
    default: () => []
  },
  currentPath: {
    type: String,
    default: '/'
  }
})

// Émissions
const emit = defineEmits([
  'file-click',
  'file-double-click',
  'path-selected',
  'file-selected'
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
}

const handleItemClick = (file, event) => {
  emit('file-click', file, event)
  if (file.is_directory) {
    emit('path-selected', file.path)
  } else {
    emit('file-selected', file)
  }
}

const handleItemDoubleClick = (file) => {
  emit('file-double-click', file)
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
  const docExtensions = ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt']
  const ext = file.name.split('.').pop()?.toLowerCase()
  return docExtensions.includes(ext)
}

const isArchiveFile = (file) => {
  const archiveExtensions = ['zip', 'rar', '7z', 'tar', 'gz', 'bz2']
  const ext = file.name.split('.').pop()?.toLowerCase()
  return archiveExtensions.includes(ext)
}

const getFileExtension = (filename) => {
  return filename.split('.').pop() || ''
}

const formatFileSize = (bytes) => {
  if (!bytes) return ''
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}
</script>

<style scoped>
.tree-item {
  border-left: 4px solid transparent;
}

.tree-item:hover {
  border-left-color: theme('colors.primary');
}
</style>