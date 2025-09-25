<template>
  <div class="virtualized-detailed-list-view bg-base-100 rounded-lg shadow-sm border border-base-300 overflow-hidden">
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
                'hover:shadow-sm hover:scale-[1.02] active:scale-[0.98]',
                {
                  'bg-primary/10 text-primary border-b-2 border-primary active-sort': sortColumn === column.key,
                  'hover:bg-primary/5': sortColumn !== column.key,
                  'sorting': sortingColumn === column.key
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
                      'animate-sort-change'
                    ]"
                    :style="{ 
                      transitionDuration: getTransitionDuration('300ms'),
                      animationDuration: getAnimationDuration('300ms')
                    }"
                  ></i>
                  <i 
                    v-else 
                    class="fas fa-sort text-base-content/30 opacity-0 group-hover:opacity-60 transition-all transform group-hover:scale-110"
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
    
    <!-- Virtualized content -->
    <div 
      v-else
      ref="containerRef"
      class="virtual-scroll-container custom-scrollbar"
      :style="{ 
        height: `${containerHeight}px`,
        overflowY: 'auto',
        ...getOptimizedStyles()
      }"
      @scroll="handleScroll"
    >
      <!-- Spacer avant les éléments visibles -->
      <div 
        v-if="isVirtualized"
        :style="{ height: `${offsetY}px` }"
        class="virtual-spacer-top"
      ></div>
      
      <!-- Table avec éléments visibles -->
      <table class="table table-sm w-full">
        <tbody>
          <!-- Éléments chargés et visibles -->
          <VirtualizedFileListItem
            v-for="(file, visibleIndex) in visibleLoadedItems"
            :key="`${file.path || file.name}-${getItemIndex(visibleIndex)}`"
            :file="file"
            :index="getItemIndex(visibleIndex)"
            :selected="isSelected(file.path || file.name)"
            :focused="focusedIndex === getItemIndex(visibleIndex)"
            :performance-mode="isPerformanceMode"
            :transition-duration="getTransitionDuration()"
            :animation-duration="getAnimationDuration()"
            :optimized-styles="getOptimizedStyles()"
            @click="handleFileClick"
            @double-click="handleFileDoubleClick"
          />
          
          <!-- Placeholders pour les éléments en cours de chargement -->
          <tr 
            v-for="n in placeholderCount"
            :key="`placeholder-${n}`"
            class="animate-pulse"
            :style="{ 
              animationDuration: getAnimationDuration('1500ms'),
              height: `${itemHeight}px` 
            }"
          >
            <td class="py-3">
              <div class="flex items-center space-x-3">
                <div class="w-8 h-8 bg-base-300 rounded-lg"></div>
                <div class="flex-1">
                  <div class="h-4 bg-base-300 rounded w-3/4"></div>
                </div>
              </div>
            </td>
            <td><div class="h-3 bg-base-300 rounded w-16"></div></td>
            <td><div class="h-3 bg-base-300 rounded w-20"></div></td>
            <td><div class="h-3 bg-base-300 rounded w-24"></div></td>
          </tr>
        </tbody>
      </table>
      
      <!-- Spacer après les éléments visibles -->
      <div 
        v-if="isVirtualized"
        :style="{ height: `${totalHeight - offsetY - (visibleLoadedItems.length * itemHeight)}px` }"
        class="virtual-spacer-bottom"
      ></div>
      
      <!-- Indicateur de chargement en bas -->
      <div 
        v-if="isLazyLoading && hasMore"
        class="flex justify-center py-4 border-t border-base-300"
      >
        <button 
          @click="loadNextBatch"
          :disabled="isLoading"
          class="btn btn-sm btn-outline"
          :class="{ 'loading': isLoading }"
        >
          <i v-if="!isLoading" class="fas fa-chevron-down mr-2"></i>
          {{ isLoading ? 'Chargement...' : `Charger plus (${remainingCount} restants)` }}
        </button>
      </div>
    </div>
    
    <!-- Barre de progression pour le lazy loading -->
    <div 
      v-if="isLazyLoading && totalItems > 0"
      class="progress-container p-2 border-t border-base-300 bg-base-50"
    >
      <div class="flex justify-between items-center text-xs text-base-content/60 mb-1">
        <span>{{ loadedCount }} / {{ totalItems }} éléments chargés</span>
        <span>{{ progress }}%</span>
      </div>
      <progress 
        class="progress progress-primary w-full h-1" 
        :value="progress" 
        max="100"
      ></progress>
    </div>
    
    <!-- Informations de performance (mode debug) -->
    <div 
      v-if="showPerformanceInfo"
      class="performance-info p-2 border-t border-base-300 bg-base-100 text-xs text-base-content/60"
    >
      <div class="grid grid-cols-2 gap-2">
        <div>FPS: {{ frameRate }}</div>
        <div>Mode: {{ isPerformanceMode ? 'Performance' : 'Qualité' }}</div>
        <div>Virtualisé: {{ isVirtualized ? 'Oui' : 'Non' }}</div>
        <div>Lazy: {{ isLazyLoading ? 'Oui' : 'Non' }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, watch, ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useViewMode } from '@/composables/useViewMode.js'
import { useVirtualScrolling } from '@/composables/useVirtualScrolling.js'
import { useLazyLoading } from '@/composables/useLazyLoading.js'
import { usePerformanceOptimization } from '@/composables/usePerformanceOptimization.js'
import VirtualizedFileListItem from './VirtualizedFileListItem.vue'

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
  getAdaptiveConfig
} = usePerformanceOptimization()

// Configuration adaptative basée sur les performances
const adaptiveConfig = computed(() => getAdaptiveConfig())

const {
  containerRef,
  visibleItems,
  isVirtualized,
  totalHeight,
  offsetY,
  startIndex,
  endIndex,
  setItems: setVirtualItems,
  getItemIndex,
  handleScroll: handleVirtualScroll
} = useVirtualScrolling({
  itemHeight: props.itemHeight,
  containerHeight: props.containerHeight,
  threshold: adaptiveConfig.value.virtualScrollThreshold,
  overscan: isPerformanceMode.value ? 3 : 5
})

const {
  loadedItems,
  isLoading,
  hasMore,
  isLazyEnabled: isLazyLoading,
  totalItems,
  loadedCount,
  remainingCount,
  progress,
  setAllItems: setLazyItems,
  loadNextBatch,
  checkAutoLoad
} = useLazyLoading({
  batchSize: adaptiveConfig.value.batchSize,
  threshold: 100,
  loadDelay: isPerformanceMode.value ? 50 : 100
})

// État local
const sortingColumn = ref(null)

// Computed
const sortedFiles = computed(() => {
  return sortFiles(props.files)
})

const visibleLoadedItems = computed(() => {
  if (isVirtualized.value) {
    return visibleItems.value
  }
  return loadedItems.value
})

const placeholderCount = computed(() => {
  if (!isLazyLoading.value || !hasMore.value) return 0
  
  const visibleCount = Math.ceil(props.containerHeight / props.itemHeight)
  const loadedVisible = visibleLoadedItems.value.length
  
  return Math.max(0, Math.min(5, visibleCount - loadedVisible))
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

const handleScroll = (event) => {
  handleVirtualScroll(event)
  
  // Auto-loading pour le lazy loading
  if (isLazyLoading.value) {
    checkAutoLoad(
      event.target.scrollTop,
      props.containerHeight,
      props.itemHeight
    )
  }
}

// Mise à jour des données
const updateData = () => {
  const sorted = sortedFiles.value
  
  if (isLazyLoading.value) {
    setLazyItems(sorted)
    // Les éléments virtualisés seront mis à jour via le watcher
  } else {
    setVirtualItems(sorted)
  }
}

// Watchers
watch(() => props.files, () => {
  updateData()
}, { immediate: true })

watch(loadedItems, (newItems) => {
  if (isLazyLoading.value) {
    setVirtualItems(newItems)
  }
})

watch(sortedFiles, () => {
  updateData()
})

// Performance monitoring
let performanceInterval = null

onMounted(() => {
  updateData()
  
  // Surveiller les performances si en mode debug
  if (props.showPerformanceInfo) {
    performanceInterval = setInterval(() => {
      // Les métriques sont automatiquement mises à jour par le composable
    }, 1000)
  }
})

onUnmounted(() => {
  if (performanceInterval) {
    clearInterval(performanceInterval)
  }
})
</script>

<style scoped>
.virtualized-detailed-list-view {
  min-height: 200px;
  position: relative;
}

.virtual-scroll-container {
  scrollbar-width: thin;
  scrollbar-color: hsl(var(--bc) / 0.2) transparent;
}

.virtual-scroll-container::-webkit-scrollbar {
  width: 8px;
}

.virtual-scroll-container::-webkit-scrollbar-track {
  background: transparent;
}

.virtual-scroll-container::-webkit-scrollbar-thumb {
  background-color: hsl(var(--bc) / 0.2);
  border-radius: 4px;
  border: 2px solid transparent;
  background-clip: content-box;
}

.virtual-scroll-container::-webkit-scrollbar-thumb:hover {
  background-color: hsl(var(--bc) / 0.3);
}

/* Optimisations pour le mode performance */
:global(.performance-mode) .virtualized-detailed-list-view {
  will-change: auto;
}

:global(.performance-mode) .table th,
:global(.performance-mode) .table td {
  transition: none !important;
  animation: none !important;
}

:global(.performance-mode) .animate-pulse {
  animation: none !important;
}

/* Animations pour les changements de tri */
.table th {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.table th:hover {
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

/* Spacers virtuels */
.virtual-spacer-top,
.virtual-spacer-bottom {
  pointer-events: none;
}

/* Barre de progression */
.progress-container {
  background: linear-gradient(to right, hsl(var(--b1)), hsl(var(--b2)));
}

.progress {
  height: 2px;
}

/* Informations de performance */
.performance-info {
  font-family: 'Courier New', monospace;
  background: hsl(var(--b2));
}

/* Responsive */
@media (max-width: 768px) {
  .virtualized-detailed-list-view {
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
  .animate-pulse,
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