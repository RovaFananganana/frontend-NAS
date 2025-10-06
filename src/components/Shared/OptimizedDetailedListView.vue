<template>
  <!-- Utiliser la version optimisée pour les gros dossiers -->
  <VirtualizedDetailedListView
    v-if="shouldUseVirtualized"
    :files="files"
    :loading="loading"
    :error="error"
    :current-path="currentPath"
    :focused-index="focusedIndex"
    :container-height="containerHeight"
    :item-height="itemHeight"
    :show-performance-info="showPerformanceInfo"
    @file-selected="handleFileClick"
    @file-double-click="handleFileDoubleClick"
    @path-selected="$emit('path-selected', $event)"
    @sort-changed="handleSort"
  />
  
  <!-- Version standard pour les petits dossiers -->
  <div v-else class="detailed-list-view bg-base-100 rounded-lg shadow-sm border border-base-300 overflow-hidden">
    <!-- Header avec gradient subtil -->
    <div class="bg-gradient-to-r from-base-200 to-base-100 border-b border-base-300">
      <table class="table table-sm w-full">
        <thead>
          <tr class="border-none">
            <th 
              v-for="column in visibleColumns" 
              :key="column.key"
              @click="handleSort(column.key)"
              :class="[
                'cursor-pointer hover:bg-base-300/50',
                'font-semibold text-base-content/80 tracking-tight',
                'first:rounded-tl-lg last:rounded-tr-lg',
                'group relative',
                {
                  'bg-primary/10 text-primary border-b-2 border-primary active-sort': sortColumn === column.key,
                  'hover:bg-primary/5': sortColumn !== column.key,
                  'sorting': sortingColumn === column.key,
                  'hover:shadow-sm hover:scale-[1.02] active:scale-[0.98]': !isPerformanceMode,
                  'hover:bg-base-300/30': isPerformanceMode
                }
              ]"
              :style="{ 
                transitionDuration: getTransitionDuration('200ms'),
                ...getOptimizedStyles() 
              }"
            >
              <div class="flex items-center justify-between">
                <span class="select-none">{{ column.label }}</span>
                <div class="sort-indicator-container ml-2 w-4 h-4 flex items-center justify-center">
                  <i 
                    v-if="sortColumn === column.key" 
                    :class="[
                      sortDirection === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down',
                      'text-primary transition-all transform',
                      { 'animate-sort-change': !isPerformanceMode }
                    ]"
                    :style="{ 
                      transitionDuration: getTransitionDuration('300ms'),
                      animationDuration: getAnimationDuration('300ms')
                    }"
                  ></i>
                  <i 
                    v-else 
                    :class="[
                      'fas fa-sort text-base-content/30 opacity-0 transition-all transform',
                      { 'group-hover:opacity-60 group-hover:scale-110': !isPerformanceMode }
                    ]"
                    :style="{ transitionDuration: getTransitionDuration('200ms') }"
                  ></i>
                </div>
              </div>
            </th>
          </tr>
        </thead>
      </table>
    </div>
    
    <!-- Loading state -->
    <div v-if="loading" class="flex justify-center py-8">
      <div class="loading loading-spinner loading-md"></div>
      <span class="ml-3 text-base-content/70">Chargement...</span>
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
    
    <!-- Body avec hover effects optimisés -->
    <div 
      v-else 
      class="max-h-96 overflow-y-auto custom-scrollbar"
      :style="getOptimizedStyles()"
      @contextmenu="handleEmptySpaceContextMenu"
    >
      <table class="table table-sm w-full">
        <tbody>
          <FileListItem
            v-for="(file, index) in sortedFiles"
            :key="file.path || file.name"
            :file="file"
            :index="index"
            :selected="isSelected(file.path || file.name)"
            :focused="focusedIndex === index"
            :is-favorite="props.isFavorite(file.path || file.name)"
            @click="handleFileClick"
            @double-click="handleFileDoubleClick"
          />
        </tbody>
      </table>
    </div>
    
    <!-- Informations de performance -->
    <div 
      v-if="showPerformanceInfo && !loading && !error && files && files.length > 0"
      class="performance-info p-2 border-t border-base-300 bg-base-100 text-xs text-base-content/60"
    >
      <div class="grid grid-cols-3 gap-2">
        <div>{{ files.length }} éléments</div>
        <div>FPS: {{ frameRate }}</div>
        <div>{{ isPerformanceMode ? 'Performance' : 'Qualité' }}</div>
      </div>
    </div>
    
    <!-- Aide contextuelle pour les raccourcis -->
    <div 
      v-if="!loading && !error && files && files.length > 0"
      class="absolute bottom-2 right-2 opacity-60 hover:opacity-100 transition-opacity"
    >
      <button 
        @click="showShortcutsHelp = true"
        class="btn btn-xs btn-circle btn-ghost tooltip tooltip-left"
        data-tip="Raccourcis clavier (F1)"
      >
        <i class="fas fa-keyboard text-xs"></i>
      </button>
    </div>
  </div>

  <!-- Composant d'aide pour les raccourcis -->
  <KeyboardShortcutsHelp 
    :show="showShortcutsHelp"
    @close="showShortcutsHelp = false"
  />
</template>

<script setup>
import { computed, watch, ref, onMounted } from 'vue'
import { useViewMode } from '@/composables/useViewMode.js'
import { usePerformanceOptimization } from '@/composables/usePerformanceOptimization.js'
import FileListItem from './FileListItem.vue'
import VirtualizedDetailedListView from './VirtualizedDetailedListView.vue'
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
  containerHeight: {
    type: Number,
    default: 400
  },
  itemHeight: {
    type: Number,
    default: 48
  },
  showPerformanceInfo: {
    type: Boolean,
    default: false
  },
  virtualizationThreshold: {
    type: Number,
    default: 100
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
  'sort-changed'
])

// Composables
const {
  sortColumn,
  sortDirection,
  visibleColumns,
  setSortColumn,
  isSelected,
  sortFiles
} = useViewMode()

const {
  isPerformanceMode,
  frameRate,
  getOptimizedStyles,
  getTransitionDuration,
  getAnimationDuration,
  measurePerformance
} = usePerformanceOptimization()

// État local
const sortingColumn = ref(null)
const showShortcutsHelp = ref(false)

// Computed
const sortedFiles = computed(() => {
  return sortFiles(props.files)
})

const shouldUseVirtualized = computed(() => {
  return props.files.length > props.virtualizationThreshold
})

// Méthodes
const handleSort = (column) => {
  const oldColumn = sortColumn.value
  const oldDirection = sortDirection.value
  
  sortingColumn.value = column
  setSortColumn(column)
  
  emit('sort-changed', {
    column: sortColumn.value,
    direction: sortDirection.value,
    oldColumn,
    oldDirection
  })
  
  setTimeout(() => {
    sortingColumn.value = null
  }, 300)
}

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
    emit('path-selected', file.path)
  } else {
    emit('file-double-click', {
      file,
      event
    })
  }
}

const handleEmptySpaceContextMenu = (event) => {
  // More comprehensive check for empty space
  const isEmptySpace = event.target === event.currentTarget || 
                      event.target.tagName === 'TABLE' || 
                      event.target.tagName === 'TBODY' ||
                      event.target.classList.contains('overflow-y-auto') ||
                      event.target.classList.contains('custom-scrollbar') ||
                      event.target.closest('.file-list-item') === null
  
  if (isEmptySpace) {
    event.preventDefault()
    event.stopPropagation()
    emit('context-menu', event, null) // null indicates empty space
  }
}

// Watchers pour les performances
watch(() => props.files, (newFiles) => {
  console.log(`OptimizedDetailedListView: Files updated, ${newFiles?.length || 0} items, virtualized: ${shouldUseVirtualized.value}`)
  
  // Mesurer les performances après un changement de données
  if (props.showPerformanceInfo) {
    setTimeout(measurePerformance, 100)
  }
}, { immediate: true })

// Lifecycle
onMounted(() => {
  if (props.showPerformanceInfo) {
    measurePerformance()
  }
})
</script>

<style scoped>
.detailed-list-view {
  min-height: 200px;
  position: relative;
}

/* Custom scrollbar pour une meilleure apparence */
.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: hsl(var(--bc) / 0.2) transparent;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 8px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: hsl(var(--bc) / 0.2);
  border-radius: 4px;
  border: 2px solid transparent;
  background-clip: content-box;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: hsl(var(--bc) / 0.3);
}

/* Optimisations pour le mode performance */
:global(.performance-mode) .detailed-list-view {
  will-change: auto;
}

:global(.performance-mode) .table th,
:global(.performance-mode) .table td {
  transition: none !important;
  animation: none !important;
}

/* Animations pour les changements de tri */
.table th {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.table th:not(.performance-mode):hover {
  background-color: hsl(var(--b3) / 0.5);
  transform: translateY(-1px);
}

.table th:active {
  transform: translateY(0);
}

@keyframes sort-change {
  0% {
    transform: scale(0.8) rotate(-10deg);
    opacity: 0.5;
  }
  50% {
    transform: scale(1.2) rotate(5deg);
    opacity: 0.8;
  }
  100% {
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
}

.animate-sort-change {
  animation: sort-change 0.3s ease-out;
}

.table th.active-sort {
  background: linear-gradient(135deg, hsl(var(--p) / 0.1), hsl(var(--p) / 0.05));
  border-bottom: 2px solid hsl(var(--p));
}

.sort-indicator-container {
  min-width: 16px;
  min-height: 16px;
}

/* Informations de performance */
.performance-info {
  font-family: 'Courier New', monospace;
  background: hsl(var(--b2));
}

/* Responsive */
@media (max-width: 768px) {
  .detailed-list-view {
    border-radius: 0;
    border-left: none;
    border-right: none;
  }
  
  .table th,
  .table td {
    padding: 0.5rem 0.25rem;
  }
  
  .performance-info {
    display: none;
  }
}

/* Réduction des animations si demandé */
@media (prefers-reduced-motion: reduce) {
  .table th,
  .animate-sort-change {
    animation: none !important;
    transition: none !important;
  }
  
  .table th:hover {
    transform: none !important;
  }
}

/* Mode contraste élevé */
@media (prefers-contrast: high) {
  .table th:hover {
    background-color: hsl(var(--b2));
    border-color: hsl(var(--bc) / 0.3);
  }
}
</style>