<template>
  <div ref="listContainer"
    class="detailed-list-view bg-base-100 shadow-sm border border-base-300 rounded-lg overflow-hidden" role="grid"
    :aria-label="`Liste des fichiers, ${files?.length || 0} éléments`" :aria-busy="loading">
    <!-- Loading state -->
    <div v-if="loading" class="flex justify-center py-8">
      <div class="loading loading-spinner loading-md"></div>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="text-error text-center py-8">
      <i class="fas fa-exclamation-triangle mb-2"></i>
      <p>{{ error }}</p>
    </div>

    <!-- Empty state -->
    <div v-else-if="!files || files.length === 0" class="text-base-content/60 text-center py-8">
      <i class="fas fa-folder-open text-4xl mb-4 opacity-50"></i>
      <p>Aucun fichier dans ce dossier</p>
    </div>

    <!-- ✅ TABLEAU UNIFIÉ - En-têtes et données dans le même tableau -->
    <div v-else class="overflow-hidden">
      <div class="overflow-y-auto" style="max-height: calc(100vh - 300px);" @contextmenu="handleEmptySpaceContextMenu">
        <table class="table w-full table-fixed">
          <!-- Header avec sticky pour rester visible au scroll -->
          <thead class="bg-base-200 border-b border-base-300 sticky top-0 z-10">
            <tr class="border-none" role="row">
              <th v-for="column in displayedColumns" :key="column.key" @click="handleSort(column.key)"
                @keydown.enter="handleSort(column.key)" @keydown.space.prevent="handleSort(column.key)"
                :style="{ width: column.width }" :class="[
                  'column-header cursor-pointer hover:bg-base-300/50 transition-colors duration-200',
                  'font-semibold text-base-content/80 px-3 py-2',
                  {
                    'bg-primary/10 text-primary': sortColumn === column.key,
                    'hover:bg-primary/5': sortColumn !== column.key
                  }
                ]" role="columnheader" :aria-sort="getSortAriaValue(column.key)"
                :aria-label="`Trier par ${column.label}${sortColumn === column.key ? (sortDirection === 'asc' ? ', tri croissant actuel' : ', tri décroissant actuel') : ''}`"
                tabindex="0">
                <div class="flex items-center gap-2">
                  <span class="truncate">{{ column.label }}</span>
                  <i v-if="sortColumn === column.key" :class="[
                    sortDirection === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down',
                    'text-primary text-xs'
                  ]"></i>
                  <i v-else
                    class="fas fa-sort text-base-content/30 text-xs opacity-0 group-hover:opacity-60 transition-opacity"></i>
                </div>
              </th>
            </tr>
          </thead>

          <!-- Body dans le même tableau -->
          <tbody>
            <FileListItem v-for="(file, index) in sortedFiles" :key="file.path || file.name" :file="file"
              :selected="props.isSelected(file.path || file.name)" :focused="focusedIndex === index"
              :visible-columns="displayedColumns" :is-favorite="props.isFavorite(file.path || file.name)"
              @click="handleFileClick" @double-click="handleFileDoubleClick" @context-menu="handleContextMenu" />
          </tbody>
        </table>
      </div>
    </div>

    <!-- Aide contextuelle pour les raccourcis -->
    <div v-if="!loading && !error && files && files.length > 0"
      class="absolute bottom-2 right-2 opacity-60 hover:opacity-100 transition-opacity">
      <button @click="showShortcutsHelp = true" class="btn btn-xs btn-circle btn-ghost tooltip tooltip-left"
        data-tip="Raccourcis clavier (F1)">
        <i class="fas fa-keyboard text-xs"></i>
      </button>
    </div>
  </div>

  <!-- Composant d'aide pour les raccourcis -->
  <KeyboardShortcutsHelp :show="showShortcutsHelp" @close="showShortcutsHelp = false" />
</template>

<script setup>
import { computed, watch, ref } from 'vue'
import { useViewMode } from '@/composables/useViewMode.js'

import FileListItem from './FileListItem.vue'
import KeyboardShortcutsHelp from './KeyboardShortcutsHelp.vue'

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
  'show-actions',
  'swipe-left',
  'swipe-right'
])

// Composables
const {
  sortColumn,
  sortDirection,
  visibleColumns,
  setSortColumn,
  sortFiles,
  addShortcut
} = useViewMode()

// Référence pour le conteneur
const listContainer = ref(null)

// Fonction simple pour déterminer si une colonne doit être affichée
const shouldShowColumn = (columnKey) => {
  return visibleColumns.value.some(col => col.key === columnKey)
}

// Ajouter le raccourci pour l'aide
addShortcut('F1', () => {
  showShortcutsHelp.value = !showShortcutsHelp.value
})
addShortcut('?', () => {
  showShortcutsHelp.value = !showShortcutsHelp.value
})
addShortcut('Escape', () => {
  if (showShortcutsHelp.value) {
    showShortcutsHelp.value = false
  }
})

// Computed pour les fichiers triés
const sortedFiles = computed(() => {
  return sortFiles(props.files)
})

// Computed pour les colonnes affichées avec largeurs
const displayedColumns = computed(() => {
  const allColumns = [
    {
      key: 'name',
      label: 'Nom',
      required: true,
      width: '40%'
    },
    {
      key: 'size',
      label: 'Taille',
      required: true,
      width: '15%'
    },
    {
      key: 'type',
      label: 'Type',
      required: true,
      width: '15%'
    },
    {
      key: 'date',
      label: 'Date de modification',
      required: true,
      width: '30%'
    }
  ]

  return allColumns.filter(column => {
    if (column.required) return true
    return shouldShowColumn(column.key)
  })
})

// État pour l'aide
const showShortcutsHelp = ref(false)

// Obtient la valeur ARIA pour le tri
const getSortAriaValue = (columnKey) => {
  if (sortColumn.value !== columnKey) return 'none'
  return sortDirection.value === 'asc' ? 'ascending' : 'descending'
}

// Gestion du tri
const handleSort = (column) => {
  const oldColumn = sortColumn.value
  const oldDirection = sortDirection.value

  setSortColumn(column)

  // Annoncer le changement de tri aux lecteurs d'écran
  const columnLabel = displayedColumns.value.find(col => col.key === column)?.label || column
  const directionText = sortDirection.value === 'asc' ? 'croissant' : 'décroissant'

  // Émettre l'événement de changement de tri
  emit('sort-changed', {
    column: sortColumn.value,
    direction: sortDirection.value,
    oldColumn,
    oldDirection,
    announcement: `Tri par ${columnLabel} en ordre ${directionText}`
  })
}

// Gestion des clics sur les fichiers
const handleFileClick = (file, event) => {
  const fileIndex = sortedFiles.value.findIndex(f => (f.path || f.name) === (file.path || file.name))

  emit('file-selected', {
    file,
    event,
    multiSelect: event.ctrlKey || event.metaKey,
    rangeSelect: event.shiftKey,
    currentIndex: fileIndex,
    files: sortedFiles.value
  })
}

const handleFileDoubleClick = (file, event) => {
  if (file.is_directory) {
    // Navigation vers le dossier
    emit('path-selected', file.path)
  } else {
    // Ouverture du fichier
    emit('file-double-click', {
      file,
      event
    })
  }
}

const handleContextMenu = (file, event) => {
  emit('context-menu', event, file)
}

const handleEmptySpaceContextMenu = (event) => {
  // More comprehensive check for empty space
  const isEmptySpace = event.target === event.currentTarget ||
    event.target.tagName === 'TABLE' ||
    event.target.tagName === 'TBODY' ||
    event.target.classList.contains('overflow-y-auto') ||
    event.target.closest('.file-list-item') === null

  if (isEmptySpace) {
    event.preventDefault()
    event.stopPropagation()
    emit('context-menu', event, null) // null indicates empty space
  }
}
</script>

<style scoped>
.detailed-list-view {
  min-height: 200px;
  position: relative;
}

/* Tableau avec largeurs fixes */
.table-fixed {
  table-layout: fixed;
}

/* En-têtes sticky */
.table thead {
  position: sticky;
  top: 0;
  z-index: 10;
}

/* En-têtes de colonnes */
.table th {
  transition: background-color 0.2s ease;
}

.table th:hover {
  background-color: hsl(var(--b3) / 0.5);
}

/* Amélioration de l'accessibilité */
.table th[role="columnheader"]:focus {
  outline: 2px solid hsl(var(--p));
  outline-offset: -2px;
}

/* Scrollbar personnalisée */
.overflow-y-auto {
  scrollbar-width: thin;
  scrollbar-color: hsl(var(--bc) / 0.2) transparent;
}

.overflow-y-auto::-webkit-scrollbar {
  width: 8px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background-color: hsl(var(--bc) / 0.2);
  border-radius: 4px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background-color: hsl(var(--bc) / 0.3);
}

/* Responsive */
@media (max-width: 768px) {
  .detailed-list-view {
    border-radius: 0;
    border-left: none;
    border-right: none;
  }
}
</style>