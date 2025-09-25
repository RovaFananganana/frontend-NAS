<template>
  <div 
    ref="listContainer"
    :class="[
      'detailed-list-view file-list-enhanced bg-base-100 shadow-sm border border-base-300 overflow-hidden',
      'transition-all duration-200',
      {
        'rounded-lg': !isMobile,
        'rounded-none border-x-0': isMobile,
        'mobile-optimized': isMobile,
        'touch-optimized': isTouch
      }
    ]"
    role="grid"
    :aria-label="`Liste des fichiers, ${files?.length || 0} éléments`"
    :aria-busy="loading"
  >
    <!-- Header avec gradient subtil -->
    <div class="list-header bg-gradient-to-r from-base-200 to-base-100 border-b border-base-300">
      <table class="table w-full" :class="{ 'table-sm': !isTouch, 'table-md': isTouch }">
        <thead>
          <tr class="border-none" role="row">
            <th 
              v-for="column in displayedColumns" 
              :key="column.key"
              @click="handleSort(column.key)"
              @keydown.enter="handleSort(column.key)"
              @keydown.space.prevent="handleSort(column.key)"
              :class="[
                'column-header cursor-pointer hover:bg-base-300/50 transition-all duration-200',
                'font-semibold text-base-content/80 tracking-tight',
                'first:rounded-tl-lg last:rounded-tr-lg',
                'group relative select-none focus-visible-only',
                {
                  'hover:shadow-sm hover:scale-[1.02] active:scale-[0.98]': !isMobile,
                  'active:bg-base-300/70': isMobile,
                  'bg-primary/10 text-primary border-b-2 border-primary active-sort': sortColumn === column.key,
                  'hover:bg-primary/5': sortColumn !== column.key,
                  'sorting': sortingColumn === column.key,
                  'px-2 py-3': isMobile,
                  'px-4 py-2': !isMobile,
                  'min-h-[44px]': isTouch // Minimum touch target
                }
              ]"
              :style="{ minHeight: isTouch ? '44px' : 'auto' }"
              role="columnheader"
              :aria-sort="getSortAriaValue(column.key)"
              :aria-label="`Trier par ${column.label}${sortColumn === column.key ? (sortDirection === 'asc' ? ', tri croissant actuel' : ', tri décroissant actuel') : ''}`"
              tabindex="0"
            >
              <div class="flex items-center justify-between">
                <span class="truncate">{{ column.label }}</span>
                <div class="sort-indicator-container ml-2 w-4 h-4 flex items-center justify-center flex-shrink-0">
                  <i 
                    v-if="sortColumn === column.key" 
                    :class="[
                      sortDirection === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down',
                      'text-primary transition-all duration-300 transform',
                      'animate-sort-change'
                    ]"
                  ></i>
                  <i 
                    v-else 
                    class="fas fa-sort text-base-content/30 opacity-0 group-hover:opacity-60 transition-all duration-200 transform group-hover:scale-110"
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
    
    <!-- Body avec hover effects et support tactile -->
    <div 
      v-else 
      :class="[
        'overflow-y-auto custom-scrollbar',
        {
          'max-h-96': !isMobile,
          'max-h-[70vh]': isMobile,
          'touch-scroll': isTouch
        }
      ]"
    >
      <table class="table w-full" :class="{ 'table-sm': !isTouch, 'table-md': isTouch }">
        <tbody>
          <FileListItem
            v-for="(file, index) in sortedFiles"
            :key="file.path || file.name"
            :file="file"
            :index="index"
            :selected="isSelected(file.path || file.name)"
            :focused="focusedIndex === index"
            :is-mobile="isMobile"
            :is-touch="isTouch"
            :visible-columns="displayedColumns"
            :file-operation-indicator="getFileOperationIndicator(file)"
            @click="handleFileClick"
            @double-click="handleFileDoubleClick"
            @context-menu="handleContextMenu"
          />
        </tbody>
      </table>
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
import { computed, watch, ref } from 'vue'
import { useViewMode } from '@/composables/useViewMode.js'
import { useResponsive } from '@/composables/useResponsive.js'
import { useTouchGestures } from '@/composables/useTouchGestures.js'
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
  isSelected,
  sortFiles,
  addShortcut
} = useViewMode()

const {
  isMobile,
  isTablet,
  isDesktop,
  isTouch,
  shouldShowColumn,
  touchSizes,
  responsiveClasses
} = useResponsive()

// Référence pour le conteneur
const listContainer = ref(null)

// Gestion des gestes tactiles
const {
  isGesturing,
  swipeDirection
} = useTouchGestures(listContainer, {
  enableSwipe: true,
  enablePinch: false,
  swipeThreshold: 50
})

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

// Computed pour les colonnes affichées selon l'écran
const displayedColumns = computed(() => {
  const allColumns = [
    { key: 'name', label: 'Nom', required: true },
    { key: 'size', label: isMobile.value ? 'Taille' : 'Taille', required: false },
    { key: 'type', label: 'Type', required: false },
    { key: 'date', label: isMobile.value ? 'Modifié' : 'Date de modification', required: false }
  ]
  
  return allColumns.filter(column => {
    if (column.required) return true
    return shouldShowColumn(column.key)
  })
})

// État pour les animations et l'aide
const sortingColumn = ref(null)
const showShortcutsHelp = ref(false)

// Obtient la valeur ARIA pour le tri
const getSortAriaValue = (columnKey) => {
  if (sortColumn.value !== columnKey) return 'none'
  return sortDirection.value === 'asc' ? 'ascending' : 'descending'
}

// Gestion du tri avec animations
const handleSort = (column) => {
  const oldColumn = sortColumn.value
  const oldDirection = sortDirection.value
  
  // Marquer la colonne comme en cours de tri pour l'animation
  sortingColumn.value = column
  
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
  
  // Retirer l'animation après un délai
  setTimeout(() => {
    sortingColumn.value = null
  }, 300)
}

// Gestion des clics sur les fichiers avec support tactile
const handleFileClick = (file, event) => {
  const fileIndex = sortedFiles.value.findIndex(f => (f.path || f.name) === (file.path || f.name))
  
  // Sur mobile/tactile, gérer différemment les interactions
  if (isTouch.value && isMobile.value) {
    // Sur mobile tactile, un simple tap sélectionne, double tap ouvre
    emit('file-selected', {
      file,
      event,
      multiSelect: false, // Pas de multi-sélection par défaut sur mobile
      rangeSelect: false,
      currentIndex: fileIndex,
      files: sortedFiles.value,
      isTouchInteraction: true
    })
  } else {
    // Comportement desktop standard
    emit('file-selected', {
      file,
      event,
      multiSelect: event.ctrlKey || event.metaKey,
      rangeSelect: event.shiftKey,
      currentIndex: fileIndex,
      files: sortedFiles.value,
      isTouchInteraction: false
    })
  }
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

// Gestion des gestes de swipe pour la navigation
const handleSwipeGesture = () => {
  if (!isGesturing.value) return
  
  if (swipeDirection.value === 'left') {
    // Swipe vers la gauche - aller au dossier suivant ou action
    emit('swipe-left')
  } else if (swipeDirection.value === 'right') {
    // Swipe vers la droite - retour ou action
    emit('swipe-right')
  }
}

// Écouter les événements de swipe
if (listContainer.value) {
  listContainer.value.addEventListener('swipe', (event) => {
    const { direction } = event.detail
    if (direction === 'right') {
      // Swipe vers la droite - navigation retour
      emit('navigate-back')
    } else if (direction === 'left') {
      // Swipe vers la gauche - action contextuelle
      emit('show-actions')
    }
  })
}

// Get file operation indicator for visual feedback
const getFileOperationIndicator = (file) => {
  if (!props.fileOperationsState.hasOperation) {
    return null
  }
  
  const isInOperation = props.fileOperationsState.isItemInOperation(file)
  if (!isInOperation) {
    return null
  }
  
  return {
    type: props.fileOperationsState.isCopyOperation ? 'copy' : 'cut',
    cssClass: props.fileOperationsState.getItemIndicatorClass(file),
    label: props.fileOperationsState.isCopyOperation ? 'Copié' : 'Coupé'
  }
}

// Watcher pour les changements de fichiers
watch(() => props.files, (newFiles) => {
  console.log('DetailedListView: Files updated', newFiles?.length || 0, 'items')
}, { immediate: true })

// Watcher pour les changements de taille d'écran
watch([isMobile, isTouch], ([newIsMobile, newIsTouch]) => {
  console.log('DetailedListView: Screen changed', { mobile: newIsMobile, touch: newIsTouch })
}, { immediate: true })
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

/* Animation pour les indicateurs de tri */
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

/* Indicateur de colonne active */
.table th.active-sort {
  background: linear-gradient(135deg, hsl(var(--p) / 0.1), hsl(var(--p) / 0.05));
  border-bottom: 2px solid hsl(var(--p));
}

.table th.active-sort::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, hsl(var(--p)), transparent);
  opacity: 0.6;
}

/* Container pour l'indicateur de tri */
.sort-indicator-container {
  min-width: 16px;
  min-height: 16px;
}

/* Animation de pulsation pour les changements */
@keyframes pulse-sort {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.7;
    transform: scale(1.1);
  }
}

.table th.sorting {
  animation: pulse-sort 0.6s ease-in-out;
}

/* Adaptations mobiles et tactiles */
.mobile-optimized {
  border-radius: 0;
  border-left: none;
  border-right: none;
}

.touch-optimized .table th,
.touch-optimized .table td {
  padding: 0.75rem 0.5rem;
  min-height: 44px; /* Minimum touch target */
}

.mobile-optimized .table th,
.mobile-optimized .table td {
  padding: 0.5rem 0.25rem;
}

.mobile-optimized .table th:first-child,
.mobile-optimized .table td:first-child {
  padding-left: 0.5rem;
}

.mobile-optimized .table th:last-child,
.mobile-optimized .table td:last-child {
  padding-right: 0.5rem;
}

/* Scroll tactile amélioré */
.touch-scroll {
  -webkit-overflow-scrolling: touch;
  scroll-behavior: smooth;
}

.touch-scroll::-webkit-scrollbar {
  width: 12px; /* Plus large pour le tactile */
}

.touch-scroll::-webkit-scrollbar-thumb {
  background-color: hsl(var(--bc) / 0.3);
  border-radius: 6px;
  border: 2px solid transparent;
  background-clip: content-box;
}

/* Responsive breakpoints */
@media (max-width: 640px) {
  .detailed-list-view {
    border-radius: 0;
    border-left: none;
    border-right: none;
  }
  
  /* Masquer les colonnes moins importantes */
  .table th:nth-child(4),
  .table td:nth-child(4) {
    display: none; /* Masquer la date sur très petit écran */
  }
}

@media (max-width: 480px) {
  /* Masquer aussi le type sur très petit écran */
  .table th:nth-child(3),
  .table td:nth-child(3) {
    display: none;
  }
  
  /* Ajuster les tailles */
  .table th,
  .table td {
    padding: 0.5rem 0.25rem;
    font-size: 0.875rem;
  }
}

@media (min-width: 768px) and (max-width: 1024px) {
  /* Tablette - optimisations spécifiques */
  .table th,
  .table td {
    padding: 0.625rem 0.5rem;
  }
}

/* Amélioration de l'accessibilité */
.table th[role="columnheader"] {
  position: relative;
}

.table th[role="columnheader"]:focus {
  outline: 2px solid hsl(var(--p));
  outline-offset: -2px;
}

/* Animation pour le loading */
@keyframes pulse-subtle {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.loading {
  animation: pulse-subtle 1.5s ease-in-out infinite;
}
</style>