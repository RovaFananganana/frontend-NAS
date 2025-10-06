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
    <div class="tree-structure min-h-64" @contextmenu="handleEmptySpaceContextMenu">
      <TreeNode
        v-for="file in sortedFiles"
        :key="file.path"
        :file="file"
        :selected="props.isSelected(file.path || file.name)"
        :focused="focusedIndex === getFileIndex(file)"
        :level="0"
        :is-selected="props.isSelected"
        :is-favorite="props.isFavorite"
        @click="handleItemClick"
        @double-click="handleItemDoubleClick"
        @context-menu="handleContextMenu"
      />
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
import TreeNode from './TreeNode.vue'
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

const handleItemClick = (eventData) => {
  const { file, event } = eventData
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

const handleItemDoubleClick = (eventData) => {
  const { file, event } = eventData
  if (file.is_directory) {
    emit('path-selected', file.path)
  } else {
    emit('file-double-click', {
      file,
      event
    })
  }
}

const handleContextMenu = (eventData) => {
  const { file, event } = eventData
  emit('context-menu', event, file)
}

const handleEmptySpaceContextMenu = (event) => {
  // Only trigger if the click is on the tree structure container itself
  if (event.target === event.currentTarget) {
    event.preventDefault()
    emit('context-menu', event, null) // null indicates empty space
  }
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