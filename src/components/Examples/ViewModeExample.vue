<template>
  <div class="view-mode-example p-4">
    <h2 class="text-2xl font-bold mb-4">Exemple d'utilisation du ViewMode</h2>
    
    <!-- Sélecteur de mode -->
    <div class="mb-6">
      <h3 class="text-lg font-semibold mb-2">Sélecteur de Mode</h3>
      <div class="btn-group">
        <button 
          v-for="mode in availableModes"
          :key="mode.id"
          :class="[
            'btn btn-sm',
            currentMode === mode.id ? 'btn-primary' : 'btn-outline'
          ]"
          @click="setCurrentMode(mode.id)"
        >
          <i :class="mode.icon" class="mr-2"></i>
          {{ mode.label }}
        </button>
      </div>
      <div class="mt-2 text-sm text-gray-600">
        Mode actuel: {{ currentViewMode.label }}
      </div>
    </div>

    <!-- Contrôles de tri -->
    <div class="mb-6">
      <h3 class="text-lg font-semibold mb-2">Contrôles de Tri</h3>
      <div class="flex gap-2 mb-2">
        <button 
          v-for="column in sortableColumns"
          :key="column.key"
          :class="[
            'btn btn-sm',
            sortColumn === column.key ? 'btn-active' : 'btn-ghost'
          ]"
          @click="setSortColumn(column.key)"
        >
          {{ column.label }}
          <i 
            v-if="sortColumn === column.key"
            :class="sortDirection === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down'"
            class="ml-1"
          ></i>
        </button>
      </div>
      <div class="text-sm text-gray-600">
        Tri: {{ sortColumn }} ({{ sortDirection === 'asc' ? 'Croissant' : 'Décroissant' }})
      </div>
    </div>

    <!-- Liste des fichiers avec sélection -->
    <div class="mb-6">
      <h3 class="text-lg font-semibold mb-2">
        Fichiers ({{ getSelectedCount() }} sélectionné{{ getSelectedCount() > 1 ? 's' : '' }})
      </h3>
      
      <div class="mb-2">
        <button class="btn btn-sm btn-outline mr-2" @click="selectAll(sampleFiles)">
          Tout sélectionner
        </button>
        <button class="btn btn-sm btn-outline" @click="clearSelection()">
          Tout désélectionner
        </button>
      </div>

      <div class="space-y-1">
        <div 
          v-for="file in sortedFiles"
          :key="file.path"
          :class="[
            'p-3 rounded cursor-pointer transition-colors',
            isSelected(file.path) 
              ? 'bg-primary text-primary-content' 
              : 'bg-base-200 hover:bg-base-300'
          ]"
          @click="toggleSelectedFile(file.path)"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <i :class="getFileIcon(file)" class="mr-3"></i>
              <div>
                <div class="font-medium">{{ file.name }}</div>
                <div class="text-sm opacity-70">
                  {{ formatFileSize(file.size) }} • {{ formatDate(file.modified_time) }}
                </div>
              </div>
            </div>
            <div class="text-sm">
              {{ file.is_directory ? 'Dossier' : file.file_type || 'Fichier' }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Visibilité des colonnes (pour mode liste) -->
    <div v-if="isDetailedListMode" class="mb-6">
      <h3 class="text-lg font-semibold mb-2">Visibilité des Colonnes</h3>
      <div class="space-y-2">
        <label 
          v-for="column in allColumns"
          :key="column.key"
          class="flex items-center cursor-pointer"
        >
          <input 
            type="checkbox" 
            :checked="columnVisibility[column.key]"
            @change="setColumnVisibility(column.key, $event.target.checked)"
            class="checkbox checkbox-sm mr-2"
          >
          <span>{{ column.label }}</span>
        </label>
      </div>
      <div class="mt-2 text-sm text-gray-600">
        Colonnes visibles: {{ visibleColumns.map(c => c.label).join(', ') }}
      </div>
    </div>

    <!-- Informations de debug -->
    <div class="mt-8 p-4 bg-base-300 rounded">
      <h3 class="text-lg font-semibold mb-2">Informations de Debug</h3>
      <pre class="text-sm">{{ debugInfo }}</pre>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useViewMode } from '../../composables/useViewMode.js'

// Utilisation du composable
const {
  currentMode,
  sortColumn,
  sortDirection,
  selectedFiles,
  columnVisibility,
  currentViewMode,
  availableModes,
  visibleColumns,
  isDetailedListMode,
  setCurrentMode,
  setSortColumn,
  toggleSelectedFile,
  selectAll,
  clearSelection,
  isSelected,
  getSelectedCount,
  setColumnVisibility,
  sortFiles
} = useViewMode()

// Données d'exemple
const sampleFiles = [
  {
    name: 'Documents',
    path: '/documents',
    size: 0,
    is_directory: true,
    modified_time: '2023-12-01T10:00:00Z',
    file_type: 'folder'
  },
  {
    name: 'photo-vacances.jpg',
    path: '/photo-vacances.jpg',
    size: 2048000,
    is_directory: false,
    modified_time: '2023-12-02T14:30:00Z',
    file_type: 'image'
  },
  {
    name: 'rapport-annuel.pdf',
    path: '/rapport-annuel.pdf',
    size: 1024000,
    is_directory: false,
    modified_time: '2023-12-03T09:15:00Z',
    file_type: 'pdf'
  },
  {
    name: 'archive-backup.zip',
    path: '/archive-backup.zip',
    size: 5120000,
    is_directory: false,
    modified_time: '2023-11-30T16:45:00Z',
    file_type: 'archive'
  },
  {
    name: 'presentation.pptx',
    path: '/presentation.pptx',
    size: 3072000,
    is_directory: false,
    modified_time: '2023-12-04T11:20:00Z',
    file_type: 'presentation'
  }
]

// Colonnes disponibles
const allColumns = [
  { key: 'name', label: 'Nom', sortable: true },
  { key: 'size', label: 'Taille', sortable: true },
  { key: 'type', label: 'Type', sortable: true },
  { key: 'modified', label: 'Modifié', sortable: true }
]

const sortableColumns = computed(() => allColumns.filter(col => col.sortable))

// Fichiers triés
const sortedFiles = computed(() => sortFiles(sampleFiles))

// Utilitaires d'affichage
const getFileIcon = (file) => {
  if (file.is_directory) return 'fas fa-folder text-yellow-500'
  
  switch (file.file_type) {
    case 'image': return 'fas fa-image text-green-500'
    case 'pdf': return 'fas fa-file-pdf text-red-500'
    case 'archive': return 'fas fa-file-archive text-purple-500'
    case 'presentation': return 'fas fa-file-powerpoint text-orange-500'
    default: return 'fas fa-file text-gray-500'
  }
}

const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '-'
  
  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unitIndex = 0
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  
  const date = new Date(dateString)
  return date.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Informations de debug
const debugInfo = computed(() => ({
  currentMode: currentMode.value,
  sortColumn: sortColumn.value,
  sortDirection: sortDirection.value,
  selectedCount: getSelectedCount(),
  selectedFiles: selectedFiles.value,
  columnVisibility: columnVisibility.value,
  visibleColumnsCount: visibleColumns.value.length
}))
</script>

<style scoped>
.view-mode-example {
  max-width: 800px;
  margin: 0 auto;
}

pre {
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style>