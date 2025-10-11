<template>
  <!-- Skip links for accessibility -->
  <div class="skip-links">
    <a href="#file-explorer-main" class="skip-link">
      Aller au contenu principal de l'explorateur
    </a>
    <a href="#view-mode-selector" class="skip-link">
      Aller au sélecteur de mode d'affichage
    </a>
  </div>

  <div ref="explorerContainer" :class="[
    'file-explorer file-explorer-enhanced file-explorer-focus-trap',
    {
      'mobile-optimized': isMobile,
      'touch-optimized': isTouch
    }
  ]" role="application" aria-label="Explorateur de fichiers" :aria-busy="loading"
    @contextmenu="handleGlobalContextMenu">

    <!-- Navigation et sélecteur de mode d'affichage -->
    <div id="view-mode-selector" :class="[
      'file-explorer-header',
      {
        'mb-4': !isMobile,
        'mb-2': isMobile
      }
    ]" role="toolbar" aria-label="Navigation et modes d'affichage des fichiers">

      <!-- Navigation par chemin interactif -->
      <div class="flex items-center gap-2 mb-2">
        <!-- Navigation history buttons -->
        <div class="flex items-center gap-1">
          <button @click="navigateHistoryBack" :disabled="!canNavigateBack" class="btn btn-sm btn-ghost"
            :class="{ 'opacity-50 cursor-not-allowed': !canNavigateBack }"
            :aria-label="canNavigateBack ? 'Naviguer vers la page précédente' : 'Aucune page précédente'"
            title="Précédent (Alt+←)">
            <i class="fas fa-chevron-left" aria-hidden="true"></i>
          </button>

          <button @click="navigateHistoryForward" :disabled="!canNavigateForward" class="btn btn-sm btn-ghost"
            :class="{ 'opacity-50 cursor-not-allowed': !canNavigateForward }"
            :aria-label="canNavigateForward ? 'Naviguer vers la page suivante' : 'Aucune page suivante'"
            title="Suivant (Alt+→)">
            <i class="fas fa-chevron-right" aria-hidden="true"></i>
          </button>

          <button v-if="currentPath !== '/'" @click="handleNavigateBack" class="btn btn-sm btn-ghost"
            :aria-label="`Retour au dossier parent`" title="Retour au dossier parent (Backspace)">
            <i class="fas fa-arrow-up mr-1" aria-hidden="true"></i>
            Retour
          </button>
        </div>

        <!-- Breadcrumb Navigation -->
        <div class="flex-1">
          <BreadcrumbNavigation :current-path="currentPath" @navigate="handleBreadcrumbNavigation" />
        </div>

        <!-- Barre de recherche -->
        <div class="ml-4 flex-1 max-w-md">
          <div class="form-control">
            <div class="input-group">
              <!-- <span class="btn btn-sm btn-ghost pointer-events-none">
                <!-- <i class="fas fa-search"></i> -->
              <!-- </span> -->
              <input v-model="searchQuery" type="text" placeholder="Rechercher..."
                class="input input-bordered input-sm w-full" @input="handleSearchInput" @keydown.escape="clearSearch" />
              <button v-if="searchQuery" @click="clearSearch" class="btn btn-sm btn-ghost" title="Effacer">
                <i class="fas fa-times"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Conteneur principal avec gestion d'erreur -->
    <div id="file-explorer-main" class="file-explorer-content" role="main"
      aria-label="Contenu de l'explorateur de fichiers">

      <!-- État de chargement global -->
      <div v-if="loading && !files.length" class="loading-state-enhanced" role="status" aria-live="polite"
        aria-label="Chargement en cours">
        <div class="loading-spinner-enhanced" aria-hidden="true"></div>
        <span class="text-base-content/70">Chargement des fichiers...</span>
      </div>

      <!-- État d'erreur global -->
      <div v-else-if="error" class="alert alert-error" role="alert" aria-live="assertive">
        <i class="fas fa-exclamation-triangle" aria-hidden="true"></i>
        <div>
          <h3 class="font-bold">Erreur de chargement</h3>
          <div class="text-sm">{{ error }}</div>
        </div>
        <button @click="refresh" class="btn btn-sm btn-outline" aria-label="Réessayer le chargement des fichiers">
          <i class="fas fa-redo mr-1" aria-hidden="true"></i>
          Réessayer
        </button>
      </div>

      <!-- État de la recherche -->
      <div v-if="isSearchActive" class="search-status mb-4" role="status" aria-live="polite">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-2">
            <div v-if="isSearching" class="loading loading-spinner loading-sm" aria-hidden="true"></div>
            <i v-else-if="hasResults" class="fas fa-search text-primary" aria-hidden="true"></i>
            <i v-else class="fas fa-search text-base-content/50" aria-hidden="true"></i>
            <span class="text-sm">{{ searchStatusMessage }}</span>
          </div>
          <div v-if="searchStats.searchTime > 0" class="text-xs text-base-content/50">
            {{ searchStats.searchTime }}ms
          </div>
        </div>
      </div>

      <!-- Composant de vue dynamique -->
      <component v-if="!loading && !error" :is="currentViewComponent" :current-path="currentPath" :files="files" :loading="loading"
        :error="error" :focused-index="focusedIndex" :user-role="userRole" :file-operations-state="{
          hasOperation,
          isCopyOperation,
          isCutOperation,
          operationItems,
          isItemInOperation,
          getItemIndicatorClass
        }" :is-selected="isSelected" :is-favorite="isItemFavorite" @path-selected="handlePathSelected"
        @file-selected="handleFileSelected" @file-double-click="handleFileDoubleClick" @sort-changed="handleSortChanged"
        @navigate-back="handleNavigateBack" @show-actions="handleShowActions" @context-menu="showContextMenu" />
    </div>

    <!-- Barre d'état avec informations -->
    <div v-if="!loading && !error"
      class="file-explorer-status mt-4 flex justify-between items-center text-sm text-base-content/60">
      <div class="flex items-center space-x-4">
        <span v-if="isSearchActive">
          {{ searchStatusMessage }}
          <span v-if="searchStats.truncated" class="text-warning ml-1">
            (résultats limités)
          </span>
        </span>
        <span v-else>
          {{ fileCount }} {{ fileCount === 1 ? 'élément' : 'éléments' }}
        </span>
        <span v-if="selectedCount > 0">
          {{ selectedCount }} sélectionné{{ selectedCount > 1 ? 's' : '' }}
        </span>
        <span v-if="currentPath !== '/' && !isSearchActive" class="flex items-center">
          <i class="fas fa-folder-open mr-1"></i>
          {{ currentPath }}
        </span>
        <span v-if="isSearchActive && searchStats.localResults > 0" class="text-xs text-info">
          {{ searchStats.localResults }} local{{ searchStats.localResults > 1 ? 'aux' : '' }}
        </span>
        <span v-if="isSearchActive && searchStats.remoteResults > 0" class="text-xs text-success">
          {{ searchStats.remoteResults }} distant{{ searchStats.remoteResults > 1 ? 's' : '' }}
        </span>
      </div>

      <div class="flex items-center space-x-2">
        <button @click="refresh" :disabled="loading" class="btn btn-xs btn-ghost tooltip tooltip-left"
          data-tip="Actualiser (F5)">
          <i class="fas fa-redo" :class="{ 'animate-spin': loading }"></i>
        </button>

        <button @click="showShortcutsHelp = true" class="btn btn-xs btn-ghost tooltip tooltip-left"
          data-tip="Aide (F1)">
          <i class="fas fa-keyboard"></i>
        </button>
      </div>
    </div>
  </div>

  <!-- Composant d'aide pour les raccourcis -->
  <KeyboardShortcutsHelp :show="showShortcutsHelp" @close="showShortcutsHelp = false" />

  <!-- Context Menu -->
  <ContextMenu v-if="contextMenu.show" :show="contextMenu.show" :x="contextMenu.x" :y="contextMenu.y"
    :item="contextMenu.item" :permissions="contextMenuPermissions" :clipboard-info="{
      items: operationItems,
      operation: isCopyOperation ? 'copy' : (isCutOperation ? 'cut' : null),
      count: operationCount,
      description: getOperationDescription()
    }" :show-permission-errors="showPermissionErrors" :is-favorite="isItemFavorite(contextMenu.item)"
    :current-view-mode="currentMode" @open="openContextItem" @download="downloadContextFile" @rename="openRenameModal"
    @copy="copyContextItem" @cut="cutContextItem" @paste="pasteItems" @permissions="openPermissions"
    @move="openMoveModal" @create-folder="openCreateFolderModal" @create-file="openCreateFileModal"
    @delete="confirmDelete" @properties="showProperties" @toggle-favorite="handleToggleFavorite"
    @view-mode-changed="handleViewModeChange" />

  <!-- Modals -->
  <PermissionModal v-if="showPermissionModal && selectedItemForPermissions" :item="selectedItemForPermissions"
    @close="showPermissionModal = false" @updated="onPermissionsUpdated" />

  <RenameModal v-if="showRenameModal && itemToRename" :item="itemToRename" @close="showRenameModal = false"
    @renamed="onItemRenamed" />

  <MoveModal v-if="showMoveModal && itemsToMove.length > 0" :items="itemsToMove" :current-path="currentPath"
    @close="showMoveModal = false" @moved="onItemsMoved" />

  <DeleteConfirmModalFixed :show="showDeleteModal && itemsToDelete.length > 0" :items="itemsToDelete"
    @close="showDeleteModal = false" @confirmed="onItemsDeleted" />

  <PropertiesModal v-if="showPropertiesModal && selectedItemForProperties" :item="selectedItemForProperties"
    @close="showPropertiesModal = false" />

  <CreateFolderModal v-if="showCreateFolderModal && currentPath" :current-path="currentPath"
    @close="showCreateFolderModal = false" @created="onFolderCreated" />

  <CreateFileModal v-if="showCreateFileModal && currentPath" :current-path="currentPath"
    @close="showCreateFileModal = false" @created="onFileCreated" />

  <UploadModal v-if="showUploadModal && currentPath" :current-path="currentPath" @close="showUploadModal = false"
    @uploaded="onFilesUploaded" @error="handleUploadError" />

  <!-- Notifications -->
  <div v-if="notification.show" class="toast toast-top toast-end">
    <div :class="[
      'alert',
      notification.type === 'success' ? 'alert-success' :
        notification.type === 'error' ? 'alert-error' :
          'alert-info'
    ]">
      <span>{{ notification.message }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useViewMode } from '@/composables/useViewMode.js'
import { useKeyboardShortcuts } from '@/composables/useKeyboardShortcuts.js'
import { useFileExplorerNavigation } from '@/composables/useFileExplorerNavigation.js'
import { useResponsive } from '@/composables/useResponsive.js'
import { useTouchGestures } from '@/composables/useTouchGestures.js'
import { useAccessibility } from '@/composables/useAccessibility.js'
import { usePermissions } from '@/composables/usePermissions.js'
import { useNotifications } from '@/composables/useNotifications.js'
import { useFileOperations } from '@/composables/useFileOperations.js'
import { useFavorites } from '@/composables/useFavorites.js'
import { useFileSearch } from '@/composables/useFileSearch.js'
import { nasAPI } from '@/services/nasAPI.js'
import { VIEW_MODES } from '@/types/viewMode.js'

// Composants
import BreadcrumbNavigation from './BreadcrumbNavigation.vue'
import NasFolderTree from './NasFolderTree.vue'
import DetailedListView from './DetailedListView.vue'
import OptimizedDetailedListView from './OptimizedDetailedListView.vue'
import MosaicView from './MosaicView.vue'
import TreeFileView from './TreeFileView.vue'
import KeyboardShortcutsHelp from './KeyboardShortcutsHelp.vue'

import ContextMenu from './ContextMenu.vue'
import PermissionModal from './PermissionModal.vue'
import RenameModal from './RenameModal.vue'
import MoveModal from './MoveModal.vue'
import DeleteConfirmModalFixed from './DeleteConfirmModalFixed.vue'
import PropertiesModal from './PropertiesModal.vue'
import CreateFolderModal from './CreateFolderModal.vue'
import CreateFileModal from './CreateFileModal.vue'
import UploadModal from './UploadModal.vue'

// Props
const props = defineProps({
  initialPath: {
    type: String,
    default: '/'
  },
  showModeSelector: {
    type: Boolean,
    default: true
  },
  autoLoad: {
    type: Boolean,
    default: true
  },
  userRole: {
    type: String,
    default: 'user'
  },
  externalPath: {
    type: String,
    default: null
  }
})

// Émissions
const emit = defineEmits([
  'path-changed',
  'file-selected',
  'file-double-click',
  'file-downloaded',
  'mode-changed',
  'sort-changed',
  'selection-changed',
  'error',
  'show-mobile-actions',
  'navigate-back',
  'navigate',
  'info',
  'success',
  'download-progress'
])

// Composables
const {
  currentMode,
  currentViewMode,
  selectedFiles,
  getSelectedCount,
  clearSelection,
  setSelectedFiles,
  addSelectedFile,
  removeSelectedFile,
  toggleSelectedFile,
  selectAll,
  isSelected,
  setCurrentMode
} = useViewMode()

const {
  isMobile,
  isTouch,
  shouldUseVirtualization
} = useResponsive()

// Composable d'accessibilité
const {
  announce,
  focusElement,
  enhanceElement,
  isKeyboardNavigation
} = useAccessibility({
  announcePolitely: true,
  manageFocus: true,
  restoreFocus: true
})

// Référence pour le conteneur principal
const explorerContainer = ref(null)

// Gestion des gestes tactiles
const {
  isGesturing,
  swipeDirection
} = useTouchGestures(explorerContainer, {
  enableSwipe: true,
  enablePinch: false,
  swipeThreshold: 80
})

// État local
const currentPath = ref(props.initialPath)
const files = ref([])
const allFiles = ref([]) // Tous les fichiers (non filtrés)
const loading = ref(false)
const error = ref('')
const showShortcutsHelp = ref(false)
const currentSelectionMode = ref('single')

// Composable de recherche rapide
const {
  searchQuery,
  searchResults,
  isSearching,
  searchError,
  searchStats,
  isSearchActive,
  hasResults,
  searchStatusMessage,
  performSearch,
  clearSearch: clearFileSearch,
  cleanup: cleanupSearch
} = useFileSearch()

// Navigation history state
const navigationHistory = ref([props.initialPath])
const historyIndex = ref(0)

// Context menu and modals state
const contextMenu = ref({
  show: false,
  x: 0,
  y: 0,
  item: null
})

const showPermissionModal = ref(false)
const showRenameModal = ref(false)
const showMoveModal = ref(false)
const showDeleteModal = ref(false)
const showPropertiesModal = ref(false)
const showCreateFolderModal = ref(false)
const showCreateFileModal = ref(false)
const showUploadModal = ref(false)
const selectedItemForPermissions = ref(null)
const selectedItemForProperties = ref(null)
const itemToRename = ref(null)
const itemsToMove = ref([])
const itemsToDelete = ref([])

// Notification state
const notification = ref({
  show: false,
  message: '',
  type: 'info'
})

// File operations composable for copy/cut/paste
const {
  hasOperation,
  isCopyOperation,
  isCutOperation,
  operationItems,
  operationCount,
  sourceFolder,
  copy,
  cut,
  paste,
  clear: clearFileOperations,
  isItemInOperation,
  getItemIndicatorClass,
  getOperationDescription,
  canPasteToDestination
} = useFileOperations()

// Favorites composable
const {
  favorites,
  loading: favoritesLoading,
  isFavorite,
  addFavorite,
  removeFavorite,
  toggleFavorite,
  loadFavorites
} = useFavorites()

// Permissions composable
const {
  isAdmin,
  canPerformAction,
  getPermissionErrorMessage,
  loadPermissions
} = usePermissions()

// Notification system
const { showPermissionError, showError } = useNotifications()

// Permission state
const contextMenuPermissions = ref({
  can_read: false,
  can_write: false,
  can_delete: false,
  can_share: false
})

const showPermissionErrors = ref(false)

// Computed
const currentViewComponent = computed(() => {
  const componentMap = {
    [VIEW_MODES.TREE]: TreeFileView,
    [VIEW_MODES.DETAILED_LIST]: shouldUseVirtualization(files.value.length, isMobile.value)
      ? OptimizedDetailedListView
      : DetailedListView,
    [VIEW_MODES.MOSAIC]: MosaicView
  }
  return componentMap[currentMode.value] || DetailedListView
})

const fileCount = computed(() => files.value?.length || 0)
const selectedCount = computed(() => getSelectedCount())

// Navigation history management
const canNavigateBack = computed(() => historyIndex.value > 0)
const canNavigateForward = computed(() => historyIndex.value < navigationHistory.value.length - 1)



// Méthodes de chargement des données avec vrais appels API
const loadFiles = async (path = currentPath.value) => {
  if (loading.value) return

  loading.value = true
  error.value = ''

  try {
    console.log(`FileExplorer: Loading files for path: ${path}`)

    // Vrai appel API via nasAPI
    const response = await nasAPI.browse(path)

    if (!response.success) {
      throw new Error(response.error || 'Échec du chargement des fichiers')
    }

    allFiles.value = response.items || []
    console.log(`FileExplorer: Loaded ${allFiles.value.length} items:`, allFiles.value.map(f => ({ name: f.name, path: f.path })))

    // Si une recherche est active, relancer la recherche avec les nouveaux fichiers
    if (isSearchActive.value) {
      await performSearch(searchQuery.value, currentPath.value, allFiles.value)
    }

    // Nettoyer la sélection si on change de dossier
    if (path !== currentPath.value) {
      clearSelection()
    }

    currentPath.value = path

    // Charger les permissions pour chaque fichier si nécessaire
    if (files.value.length > 0) {
      await loadFilePermissions()
    }

  } catch (err) {
    console.error('FileExplorer: Error loading files:', err)
    error.value = err.message || 'Erreur lors du chargement des fichiers'
    allFiles.value = []
    files.value = []

    // Émettre l'erreur pour permettre la gestion parent
    emit('error', {
      error: err,
      path,
      timestamp: Date.now()
    })
  } finally {
    loading.value = false
  }
}

// Charger les permissions pour les fichiers affichés
const loadFilePermissions = async () => {
  try {
    // Charger les permissions en lot pour optimiser
    const paths = files.value.map(file => file.path)
    const permissionsPromises = paths.map(path => loadPermissions(path))

    await Promise.allSettled(permissionsPromises)
    console.log('Permissions loaded for current files')
  } catch (error) {
    console.error('Error loading file permissions:', error)
  }
}

// Load permissions for context menu item
const loadContextMenuPermissions = async (item) => {
  try {
    showPermissionErrors.value = false

    // For empty space (item is null), check permissions on current directory
    const pathToCheck = item ? item.path : currentPath.value

    // Use the permissions composable to check permissions
    const permissions = await loadPermissions(pathToCheck)

    contextMenuPermissions.value = {
      can_read: permissions?.can_read || false,
      can_write: permissions?.can_write || false,
      can_delete: permissions?.can_delete || false,
      can_share: permissions?.can_share || false
    }

  } catch (error) {
    console.error('Error loading context menu permissions:', error)
    showPermissionErrors.value = true
    contextMenuPermissions.value = {
      can_read: false,
      can_write: false,
      can_delete: false,
      can_share: false
    }
  }
}

const refresh = async () => {
  await loadFiles(currentPath.value)
}

// Navigation history management
const addToNavigationHistory = (path) => {
  // Remove any forward history if we're not at the end
  if (historyIndex.value < navigationHistory.value.length - 1) {
    navigationHistory.value = navigationHistory.value.slice(0, historyIndex.value + 1)
  }

  // Add new path if it's different from current
  if (navigationHistory.value[navigationHistory.value.length - 1] !== path) {
    navigationHistory.value.push(path)
    historyIndex.value = navigationHistory.value.length - 1

    // Limit history size to prevent memory issues
    if (navigationHistory.value.length > 50) {
      navigationHistory.value = navigationHistory.value.slice(-50)
      historyIndex.value = navigationHistory.value.length - 1
    }
  }
}

const navigateHistoryBack = async () => {
  if (canNavigateBack.value) {
    historyIndex.value--
    const targetPath = navigationHistory.value[historyIndex.value]
    await loadFiles(targetPath)

    emit('navigate', {
      path: targetPath,
      source: 'history-back',
      timestamp: Date.now()
    })
  }
}

const navigateHistoryForward = async () => {
  if (canNavigateForward.value) {
    historyIndex.value++
    const targetPath = navigationHistory.value[historyIndex.value]
    await loadFiles(targetPath)

    emit('navigate', {
      path: targetPath,
      source: 'history-forward',
      timestamp: Date.now()
    })
  }
}

// Gestionnaires d'événements
const handleModeChange = (event) => {
  console.log(`FileExplorer: Mode changed from ${event.oldMode} to ${event.newMode}`)

  emit('mode-changed', {
    ...event,
    currentPath: currentPath.value,
    fileCount: fileCount.value
  })
}

const handlePathSelected = async (path) => {
  console.log(`FileExplorer: Path selected: ${path}`)

  // Normaliser le chemin
  const normalizedPath = nasAPI.normalizePath(path)

  if (normalizedPath !== currentPath.value) {
    const oldPath = currentPath.value

    // Clear search when navigating to a new path from search results
    if (isSearchActive.value) {
      clearFileSearch()
    }

    // Add to navigation history
    addToNavigationHistory(normalizedPath)

    await loadFiles(normalizedPath)

    emit('path-changed', {
      oldPath: oldPath,
      newPath: normalizedPath,
      timestamp: Date.now()
    })
  }
}

// Watcher pour les changements de chemin externe (défini après handlePathSelected)
watch(() => props.externalPath, (newPath, oldPath) => {
  console.log('🔄 FileExplorer: External path changed from', oldPath, 'to', newPath)

  if (newPath && newPath !== currentPath.value) {
    console.log('✅ FileExplorer: Navigating to external path:', newPath)
    handlePathSelected(newPath)
  }
}, { immediate: true })

const handleBreadcrumbNavigation = async (path) => {
  // Normaliser le chemin
  const normalizedPath = nasAPI.normalizePath(path)

  if (normalizedPath !== currentPath.value) {
    const oldPath = currentPath.value

    try {
      // Add to navigation history
      addToNavigationHistory(normalizedPath)

      // Charger les fichiers
      await loadFiles(normalizedPath)

      emit('path-changed', {
        oldPath: oldPath,
        newPath: normalizedPath,
        source: 'breadcrumb',
        timestamp: Date.now()
      })

      emit('navigate', {
        path: normalizedPath,
        source: 'breadcrumb',
        timestamp: Date.now()
      })
    } catch (error) {
      console.error('FileExplorer: Error during breadcrumb navigation:', error)

      // Émettre une notification d'erreur
      emit('error', {
        error: error,
        path: normalizedPath,
        source: 'breadcrumb',
        message: `Impossible d'accéder au dossier: ${path}`,
        timestamp: Date.now()
      })
    }
  }
}

const handleFileSelected = (event) => {
  const { file, multiSelect, rangeSelect, action, anchorIndex } = event
  const filePath = file.path || file.name

  console.log(`FileExplorer: File selected: ${filePath}`, {
    multiSelect,
    rangeSelect,
    action,
    anchorIndex,
    totalSelected: selectedFiles.value.length
  })

  // Déterminer le mode de sélection
  if (rangeSelect) {
    currentSelectionMode.value = 'range'
  } else if (multiSelect) {
    currentSelectionMode.value = 'multiple'
  } else {
    currentSelectionMode.value = 'single'
  }

  // Utiliser la navigation clavier pour gérer la sélection
  handleKeyboardClick(file, {
    ctrlKey: multiSelect,
    metaKey: multiSelect,
    shiftKey: rangeSelect
  })

  // Émettre l'événement de changement de sélection
  emit('selection-changed', {
    selectedFiles: selectedFiles.value,
    action: action || (multiSelect ? 'multiSelect' : (rangeSelect ? 'rangeSelect' : 'singleSelect')),
    targetFile: filePath,
    anchorIndex,
    selectionMode: currentSelectionMode.value,
    timestamp: Date.now()
  })
}

const handleFileDoubleClick = (event) => {
  const { file } = event

  console.log(`FileExplorer: File double-clicked: ${file.name}`, file)

  // Utiliser la navigation clavier pour gérer le double-clic
  handleKeyboardDoubleClick(file, event)

  // Les événements sont déjà émis par la navigation clavier
}

const handleSortChanged = (event) => {
  console.log(`FileExplorer: Sort changed: ${event.column} ${event.direction}`)

  emit('sort-changed', {
    ...event,
    currentPath: currentPath.value,
    fileCount: fileCount.value
  })
}

// Gestionnaires pour les gestes mobiles
const handleNavigateBack = () => {
  console.log('🔙 handleNavigateBack called, currentPath:', currentPath.value)
  
  // Always navigate to parent directory when back button is clicked
  if (currentPath.value !== '/') {
    const pathSegments = currentPath.value.split('/').filter(segment => segment !== '')
    const parentPath = pathSegments.length > 0 ? '/' + pathSegments.slice(0, -1).join('/') : '/'
    const normalizedParentPath = parentPath === '//' ? '/' : parentPath
    
    console.log('🔙 Navigating to parent:', normalizedParentPath)
    handlePathSelected(normalizedParentPath)
  } else {
    console.log('🔙 Already at root, cannot go back')
  }
}

const handleShowActions = () => {
  // Afficher un menu d'actions contextuelles sur mobile
  emit('show-mobile-actions', {
    currentPath: currentPath.value,
    selectedFiles: selectedFiles.value,
    timestamp: Date.now()
  })
}

// Configuration de la navigation clavier
const navigationOptions = {
  files,
  selectedFiles,
  currentPath,
  onFileSelect: (event) => {
    emit('file-selected', {
      ...event,
      timestamp: Date.now()
    })

    emit('selection-changed', {
      selectedFiles: event.selectedFiles || selectedFiles.value,
      action: event.action || 'select',
      targetFile: event.file?.path || event.file?.name,
      timestamp: Date.now()
    })
  },
  onFileOpen: (event) => {
    const { file } = event
    if (file.is_directory) {
      handlePathSelected(file.path)
    } else {
      emit('file-double-click', {
        file,
        currentPath: currentPath.value,
        timestamp: Date.now()
      })
    }
  },
  onPathChange: (path) => {
    handlePathSelected(path)
  },
  onSort: (event) => {
    handleSortChanged(event)
  },
  onRefresh: () => {
    refresh()
  },
  onShowHelp: () => {
    showShortcutsHelp.value = true
  }
}

// Initialisation de la navigation clavier
const {
  focusedIndex,
  focusedFile,
  hasSelection: hasKeyboardSelection,
  activate: activateNavigation,
  deactivate: deactivateNavigation,
  setFocusedIndex,
  handleClick: handleKeyboardClick,
  handleDoubleClick: handleKeyboardDoubleClick,
  clearSelection: clearKeyboardSelection,
  selectAll: selectAllKeyboard
} = useFileExplorerNavigation(navigationOptions)

// Context menu and file operations methods
const handleGlobalContextMenu = (event) => {
  console.log('� Global lcontext menu triggered on:', event.target.tagName, event.target.className)

  // Check if the click is on empty space (not on a file item or UI element)
  const isOnFileItem = event.target.closest('.file-list-item') ||
    event.target.closest('tr[role="row"]') ||
    event.target.closest('.file-tile') ||
    event.target.closest('button') ||
    event.target.closest('.btn')

  if (!isOnFileItem) {
    console.log('✅ Global empty space detected, preventing default and showing context menu')
    event.preventDefault()
    event.stopPropagation()
    showContextMenu(event, null)
  } else {
    console.log('❌ Click on UI element, letting it handle contextmenu')
  }
}

const showContextMenu = async (event, item) => {
  console.log('🎯 FileExplorer showContextMenu called:', { item: item?.name || 'empty space', permissions: contextMenuPermissions.value })

  // Load permissions for the item
  await loadContextMenuPermissions(item)

  console.log('📋 Context menu permissions loaded:', contextMenuPermissions.value)

  contextMenu.value = {
    show: true,
    x: event.clientX,
    y: event.clientY,
    item
  }

  nextTick(() => {
    const hideMenu = () => {
      contextMenu.value.show = false
      document.removeEventListener('click', hideMenu)
    }
    document.addEventListener('click', hideMenu)
  })
}

const openContextItem = (item) => {
  if (item.is_directory) {
    handlePathSelected(item.path)
  } else {
    downloadContextFile(item)
  }
  contextMenu.value.show = false
}

const downloadContextFile = async (item) => {
  try {
    // Skip system files that might cause issues
    const systemFiles = ['desktop.ini', 'thumbs.db', '.ds_store', 'folder.jpg', 'albumartsmall.jpg']
    if (systemFiles.includes(item.name.toLowerCase())) {
      emit('error', {
        error: new Error('Cannot download system files'),
        action: 'download',
        file: item,
        message: 'Les fichiers système ne peuvent pas être téléchargés',
        timestamp: Date.now()
      })
      return
    }

    emit('info', `Téléchargement de ${item.name} en cours...`)

    const blob = await nasAPI.downloadFile(item.path, (percentage, loaded, total) => {
      // Emit progress updates
      emit('download-progress', {
        file: item,
        percentage: Math.round(percentage),
        loaded,
        total,
        timestamp: Date.now()
      })
    })

    // Create download link
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = item.name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    emit('file-downloaded', { file: item, timestamp: Date.now() })
    emit('success', `Téléchargement de ${item.name} terminé`)
  } catch (err) {
    console.error('Error downloading file:', err)

    let errorMessage = `Erreur lors du téléchargement: ${err.message}`
    if (err.status === 403) {
      errorMessage = 'Permission refusée pour télécharger ce fichier'
    } else if (err.status === 404) {
      errorMessage = 'Fichier introuvable'
    }

    emit('error', {
      error: err,
      action: 'download',
      file: item,
      message: errorMessage,
      timestamp: Date.now()
    })
  }
  contextMenu.value.show = false
}

const copyContextItem = async (item) => {
  // Check read permission for copying
  const canCopy = await canPerformAction(item.path, 'read')
  if (!canCopy) {
    showPermissionError('copy')
    contextMenu.value.show = false
    return
  }

  // Use the file operations composable
  copy([item], currentPath.value)
  contextMenu.value.show = false
}

const cutContextItem = async (item) => {
  // Check write permission for cutting (need write permission to move/delete from source)
  const canCut = await canPerformAction(item.path, 'write')
  if (!canCut) {
    showPermissionError('move')
    contextMenu.value.show = false
    return
  }

  // Use the file operations composable
  cut([item], currentPath.value)
  contextMenu.value.show = false
}

const pasteItems = async () => {
  if (!hasOperation.value) return

  // Check write permission on current folder
  const canPasteHere = await canPerformAction(currentPath.value, 'write')
  if (!canPasteHere) {
    showPermissionError('write')
    contextMenu.value.show = false
    return
  }

  // Check if paste is allowed to this destination
  if (!canPasteToDestination(currentPath.value)) {
    showError('Impossible de coller dans ce dossier')
    contextMenu.value.show = false
    return
  }

  try {
    // Use the file operations composable
    const result = await paste(currentPath.value)

    if (result.success) {
      // Refresh the file list to show changes
      await loadFiles(currentPath.value)
    }
  } catch (err) {
    console.error('Error pasting items:', err)
    emit('error', {
      error: err,
      action: 'paste',
      timestamp: Date.now()
    })
  }

  contextMenu.value.show = false
}

const openPermissions = async (item) => {
  // Only admins can modify permissions
  if (!isAdmin.value) {
    showPermissionError('permissions')
    contextMenu.value.show = false
    return
  }

  selectedItemForPermissions.value = item
  showPermissionModal.value = true
  contextMenu.value.show = false
}

const openRenameModal = async (item) => {
  // Check write permission for renaming
  const canRename = await canPerformAction(item.path, 'rename')
  if (!canRename) {
    showPermissionError('rename')
    contextMenu.value.show = false
    return
  }

  // Close context menu first
  contextMenu.value.show = false

  // Wait for next tick to ensure DOM is ready
  await nextTick()

  itemToRename.value = item
  showRenameModal.value = true
}

const openMoveModal = async (item) => {
  // Check write permission for moving
  const canMove = await canPerformAction(item.path, 'move')
  if (!canMove) {
    showPermissionError('move')
    contextMenu.value.show = false
    return
  }

  itemsToMove.value = [item]
  showMoveModal.value = true
  contextMenu.value.show = false
}

const openCreateFolderModal = async () => {
  // Check write permission for creating folders
  const canCreateFolder = await canPerformAction(currentPath.value, 'create_folder')
  if (!canCreateFolder) {
    showPermissionError('create_folder')
    contextMenu.value.show = false
    return
  }

  showCreateFolderModal.value = true
  contextMenu.value.show = false
}

const openCreateFileModal = async () => {
  // Check write permission for creating files
  const canCreateFile = await canPerformAction(currentPath.value, 'write')
  if (!canCreateFile) {
    showPermissionError('write')
    contextMenu.value.show = false
    return
  }

  showCreateFileModal.value = true
  contextMenu.value.show = false
}

const confirmDelete = async (item) => {
  // Check delete permission
  const canDelete = await canPerformAction(item.path, 'delete')
  if (!canDelete) {
    showPermissionError('delete')
    contextMenu.value.show = false
    return
  }

  // Close context menu first
  contextMenu.value.show = false

  // Wait for next tick to ensure DOM is ready
  await nextTick()

  itemsToDelete.value = [item]
  showDeleteModal.value = true
}

const showProperties = async (item) => {
  // Close context menu first
  contextMenu.value.show = false

  // Wait for next tick to ensure DOM is ready
  await nextTick()

  selectedItemForProperties.value = item
  showPropertiesModal.value = true
}

// Favorites methods
const handleToggleFavorite = async (item) => {
  console.log('Toggle favorite for:', item)
  if (!item) {
    console.error('No item provided for favorite toggle')
    return
  }

  try {
    const itemType = item.is_directory ? 'folder' : 'file'
    const wasAdded = await toggleFavorite(item.path, item.name, itemType)

    if (wasAdded) {
      showNotification(`${item.name} ajouté aux favoris`, 'success')
    } else {
      showNotification(`${item.name} retiré des favoris`, 'success')
    }

    contextMenu.value.show = false

  } catch (err) {
    console.error('Error toggling favorite:', err)
    showNotification(`Erreur: ${err.message}`, 'error')

    emit('error', {
      error: err,
      action: 'toggle-favorite',
      file: item,
      timestamp: Date.now()
    })
  }
}

const isItemFavorite = (item) => {
  if (!item) return false
  return isFavorite(item.path)
}

const handleViewModeChange = (newMode) => {
  console.log('🔄 FileExplorer: View mode changed from context menu to:', newMode)

  const oldMode = currentMode.value

  // Changer le mode via le composable
  setCurrentMode(newMode)

  // Fermer le menu contextuel
  contextMenu.value.show = false

  // Émettre l'événement pour informer les composants parents
  const event = {
    oldMode,
    newMode,
    source: 'context-menu'
  }

  emit('mode-changed', {
    ...event,
    currentPath: currentPath.value,
    fileCount: fileCount.value
  })

  console.log('✅ FileExplorer: View mode changed successfully')
}

const showNotification = (message, type = 'info') => {
  notification.value = {
    show: true,
    message,
    type
  }

  // Auto-hide after 3 seconds
  setTimeout(() => {
    notification.value.show = false
  }, 3000)
}

// Modal event handlers
const onPermissionsUpdated = () => {
  loadFiles(currentPath.value)
}

const onItemRenamed = async (renameData) => {
  try {
    // renameData is an object: {oldPath, newPath, newName}
    console.log('Item renamed:', renameData)

    // Show success notification
    showNotification(`Élément renommé en "${renameData.newName}"`, 'success')

    // Refresh the file list to show changes
    await loadFiles(currentPath.value)

    // Update selection if the renamed item was selected
    const oldPath = renameData.oldPath
    const newPath = renameData.newPath

    if (selectedFiles.value.includes(oldPath)) {
      const updatedSelection = selectedFiles.value.map(path =>
        path === oldPath ? newPath : path
      )
      setSelectedFiles(updatedSelection)
    }

  } catch (error) {
    console.error('Error handling rename:', error)
    showNotification(`Erreur lors du renommage: ${error.message}`, 'error')
  }
}

const onItemsMoved = () => {
  loadFiles(currentPath.value)
}

const onItemsDeleted = async (items) => {
  try {
    for (const item of items) {
      // Remove from selection if it was selected
      if (selectedFiles.value.includes(item.path)) {
        removeSelectedFile(item.path)
      }
    }

    // Show success notification
    const itemCount = items.length
    showNotification(
      `${itemCount} élément${itemCount > 1 ? 's' : ''} supprimé${itemCount > 1 ? 's' : ''}`,
      'success'
    )

    // Refresh the file list
    await loadFiles(currentPath.value)

  } catch (error) {
    console.error('Error handling deletion:', error)
    showNotification(`Erreur lors de la suppression: ${error.message}`, 'error')
  }
}

const onFolderCreated = (event) => {
  // Show success notification
  showNotification(`Dossier "${event?.folderName || 'nouveau dossier'}" créé avec succès`, 'success')
  // Refresh the file list
  loadFiles(currentPath.value)
}

const onFileCreated = (event) => {
  // Show success notification
  showNotification(`Fichier "${event.fileName}" créé avec succès`, 'success')
  // Refresh the file list
  loadFiles(currentPath.value)
}

const onFilesUploaded = (event) => {
  // Show success notification
  showNotification(`${event.files?.length || 1} fichier(s) uploadé(s) avec succès`, 'success')
  // Refresh the file list
  loadFiles(currentPath.value)
}

const handleUploadError = (error) => {
  // Show error notification
  showNotification(`Erreur d'upload: ${error.message}`, 'error')
}

// Version simple de la recherche sans le composable complexe
const simpleSearchResults = ref([])
const isSimpleSearchActive = computed(() => searchQuery.value.length >= 2)

// Computed pour afficher les fichiers (version simple qui fonctionne)
const displayedFiles = computed(() => {
  if (isSimpleSearchActive.value) {
    console.log('🔍 Showing search results:', simpleSearchResults.value.length, 'results')
    return simpleSearchResults.value
  }
  console.log('📁 Showing all files:', allFiles.value?.length || 0, 'files')
  return allFiles.value || []
})

// Watcher pour mettre à jour les fichiers affichés (simplifié)
watch(displayedFiles, (newFiles) => {
  console.log('📋 Updating displayed files:', newFiles.length, 'files')
  files.value = newFiles || []
}, { immediate: true })

// Méthodes de recherche simplifiées
const handleSearchInput = async () => {
  console.log('🔍 Search input changed:', searchQuery.value)
  await performSimpleSearch(searchQuery.value)
}

const performSimpleSearch = async (query) => {
  console.log('🔍 Simple search for:', query, 'in', allFiles.value?.length || 0, 'local files')
  
  if (!query || query.length < 2) {
    simpleSearchResults.value = []
    return
  }
  
  const searchTerm = query.toLowerCase().trim()
  
  // 1. Recherche locale (répertoire courant)
  const localResults = (allFiles.value || []).filter(file => {
    const nameMatch = file.name.toLowerCase().includes(searchTerm)
    if (nameMatch) {
      console.log('✅ Local match found:', file.name)
    }
    return nameMatch
  })
  
  console.log('📍 Local search found:', localResults.length, 'results')
  
  // Afficher immédiatement les résultats locaux
  simpleSearchResults.value = localResults
  
  // 2. Recherche récursive simplifiée - chercher dans les dossiers du niveau actuel
  try {
    console.log('🔍 Starting simplified recursive search...')
    const folders = (allFiles.value || []).filter(file => file.is_directory)
    console.log('📁 Found', folders.length, 'folders to search in')
    
    const allResults = [...localResults]
    const seenPaths = new Set(localResults.map(f => f.path))
    
    // Chercher dans chaque dossier (limité aux premiers niveaux pour éviter la lenteur)
    for (const folder of folders.slice(0, 5)) { // Limiter à 5 dossiers pour les performances
      try {
        console.log('🔍 Searching in folder:', folder.name)
        const folderResponse = await nasAPI.browse(folder.path)
        
        if (folderResponse.success && folderResponse.items) {
          const folderMatches = folderResponse.items.filter(item => 
            item.name.toLowerCase().includes(searchTerm)
          )
          
          folderMatches.forEach(match => {
            if (!seenPaths.has(match.path)) {
              allResults.push({
                ...match,
                source: 'folder_search',
                parent_folder: folder.name
              })
              seenPaths.add(match.path)
              console.log('✅ Found in', folder.name + ':', match.name)
            }
          })
        }
      } catch (error) {
        console.warn('Error searching in folder', folder.name, ':', error.message)
      }
    }
    
    simpleSearchResults.value = allResults
    console.log('🎯 Total search results:', allResults.length, '(local + folder search)')
    
  } catch (error) {
    console.warn('Simplified recursive search error:', error.message)
    // Garder les résultats locaux en cas d'erreur
  }
}

const clearSearch = () => {
  console.log('🧹 Clearing simple search')
  searchQuery.value = ''
  simpleSearchResults.value = []
}

// Lifecycle hooks
onMounted(async () => {
  if (props.autoLoad) {
    await loadFiles(currentPath.value)
  }

  // Load favorites
  await loadFavorites()

  // Activate keyboard navigation
  activateNavigation()
})

onUnmounted(() => {
  // Deactivate keyboard navigation
  deactivateNavigation()
  
  // Cleanup search
  cleanupSearch()
})
</script>

<style scoped>
.file-explorer-content {
  min-height: 400px;
}

/* Styles pour la barre de recherche */
.input-group {
  display: flex;
  align-items: center;
}

.input-group .input {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}

.input-group .btn {
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
  border-left: none;
}

.input-group .btn:not(:last-child) {
  border-right: none;
  border-radius: 0;
}

/* Styles pour l'état de recherche */
.search-status {
  padding: 0.75rem 1rem;
  background: rgba(var(--b2), 0.5);
  border-radius: 0.5rem;
  border: 1px solid rgba(var(--bc), 0.1);
}

/* Animation pour les notifications */
.toast {
  animation: slideInRight 0.3s ease-out;
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }

  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.loading-state-enhanced {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  min-height: 200px;
}

.loading-spinner-enhanced {
  width: 2rem;
  height: 2rem;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.skip-links {
  position: absolute;
  top: -40px;
  left: 6px;
  z-index: 1000;
}

.skip-link {
  position: absolute;
  top: -40px;
  left: 6px;
  background: #000;
  color: #fff;
  padding: 8px;
  text-decoration: none;
  z-index: 1000;
}

.skip-link:focus {
  top: 6px;
}
</style>