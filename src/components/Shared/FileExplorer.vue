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
  ]" role="application" aria-label="Explorateur de fichiers" :aria-busy="loading">
    <!-- Navigation et sélecteur de mode d'affichage -->
    <div id="view-mode-selector" :class="[
      'file-explorer-header',
      {
        'mb-4': !isMobile,
        'mb-2': isMobile
      }
    ]" role="toolbar" aria-label="Navigation et modes d'affichage des fichiers">
      <!-- Bouton de navigation retour -->
      <div class="flex items-center gap-2 mb-2">
        <button v-if="currentPath !== '/'" @click="handleNavigateBack" class="btn btn-sm btn-ghost"
          :aria-label="`Retour au dossier parent`" title="Retour au dossier parent">
          <i class="fas fa-arrow-left mr-2"></i>
          Retour
        </button>

        <!-- Affichage du chemin actuel -->
        <div class="text-sm text-base-content opacity-70 flex-1">
          <i class="fas fa-folder mr-1"></i>
          {{ currentPath === '/' ? 'Racine' : currentPath }}
        </div>
      </div>

      <ViewModeSelector :show-shortcuts="!isMobile" @mode-changed="handleModeChange" />
    </div>

    <!-- Indicateur de sélection -->
    <SelectionIndicator v-if="selectedCount > 0" :selected-count="selectedCount" :total-count="fileCount"
      :selection-mode="currentSelectionMode" :show-progress="selectedCount > 1" :show-shortcuts="selectedCount === 1"
      @select-all="handleSelectAll" @invert-selection="handleInvertSelection" @clear-selection="handleClearSelection" />

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

      <!-- Composant de vue dynamique -->
      <component v-else :is="currentViewComponent" :current-path="currentPath" :files="files" :loading="loading"
        :error="error" :focused-index="focusedIndex" :user-role="userRole" :file-operations-state="{
          hasOperation,
          isCopyOperation,
          isCutOperation,
          operationItems,
          isItemInOperation,
          getItemIndicatorClass
        }" @path-selected="handlePathSelected" @file-selected="handleFileSelected"
        @file-double-click="handleFileDoubleClick" @sort-changed="handleSortChanged" @navigate-back="handleNavigateBack"
        @show-actions="handleShowActions" @context-menu="showContextMenu" />
    </div>

    <!-- Barre d'état avec informations -->
    <div v-if="!loading && !error"
      class="file-explorer-status mt-4 flex justify-between items-center text-sm text-base-content/60">
      <div class="flex items-center space-x-4">
        <span>
          {{ fileCount }} {{ fileCount === 1 ? 'élément' : 'éléments' }}
        </span>
        <span v-if="selectedCount > 0">
          {{ selectedCount }} sélectionné{{ selectedCount > 1 ? 's' : '' }}
        </span>
        <span v-if="currentPath !== '/'" class="flex items-center">
          <i class="fas fa-folder-open mr-1"></i>
          {{ currentPath }}
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
  <ContextMenu :show="contextMenu.show" :x="contextMenu.x" :y="contextMenu.y" :item="contextMenu.item"
    :permissions="contextMenuPermissions" :clipboard-info="{
      items: operationItems,
      operation: isCopyOperation ? 'copy' : (isCutOperation ? 'cut' : null),
      count: operationCount,
      description: getOperationDescription()
    }" :show-permission-errors="showPermissionErrors" @open="openContextItem" @download="downloadContextFile"
    @rename="openRenameModal" @copy="copyContextItem" @cut="cutContextItem" @paste="pasteItems"
    @permissions="openPermissions" @move="openMoveModal" @create-folder="openCreateFolderModal" @delete="confirmDelete"
    @properties="showProperties" />

  <!-- Modals -->
  <PermissionModal v-if="showPermissionModal" :item="selectedItemForPermissions" @close="showPermissionModal = false"
    @updated="onPermissionsUpdated" />

  <RenameModal v-if="showRenameModal" :item="itemToRename" @close="showRenameModal = false" @renamed="onItemRenamed" />

  <MoveModal v-if="showMoveModal" :items="itemsToMove" :current-path="currentPath" @close="showMoveModal = false"
    @moved="onItemsMoved" />

  <DeleteConfirmModal v-if="showDeleteModal" :items="itemsToDelete" @close="showDeleteModal = false"
    @confirmed="onItemsDeleted" />

  <PropertiesModal v-if="showPropertiesModal" :item="selectedItemForProperties" @close="showPropertiesModal = false" />

  <CreateFolderModal v-if="showCreateFolderModal" :current-path="currentPath" @close="showCreateFolderModal = false"
    @created="onFolderCreated" />
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
import { nasAPI } from '@/services/nasAPI.js'
import { VIEW_MODES } from '@/types/viewMode.js'

// Composants
import ViewModeSelector from './ViewModeSelector.vue'
import NasFolderTree from './NasFolderTree.vue'
import DetailedListView from './DetailedListView.vue'
import OptimizedDetailedListView from './OptimizedDetailedListView.vue'
import KeyboardShortcutsHelp from './KeyboardShortcutsHelp.vue'
import SelectionIndicator from './SelectionIndicator.vue'
import ContextMenu from './ContextMenu.vue'
import PermissionModal from './PermissionModal.vue'
import RenameModal from './RenameModal.vue'
import MoveModal from './MoveModal.vue'
import DeleteConfirmModal from './DeleteConfirmModal.vue'
import PropertiesModal from './PropertiesModal.vue'
import CreateFolderModal from './CreateFolderModal.vue'

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
  'navigate'
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
  selectAll
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
  swipeThreshold: 80 // Plus élevé pour éviter les faux positifs
})

// État local
const currentPath = ref(props.initialPath)
const files = ref([])
const loading = ref(false)
const error = ref('')
const showShortcutsHelp = ref(false)
const currentSelectionMode = ref('single')

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
const selectedItemForPermissions = ref(null)
const selectedItemForProperties = ref(null)
const itemToRename = ref(null)
const itemsToMove = ref([])
const itemsToDelete = ref([])

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

// Computed
const currentViewComponent = computed(() => {
  const componentMap = {
    [VIEW_MODES.TREE]: DetailedListView, // Temporairement utiliser DetailedListView pour éviter l'erreur DOM
    [VIEW_MODES.DETAILED_LIST]: shouldUseVirtualization(files.value.length, isMobile.value)
      ? OptimizedDetailedListView
      : DetailedListView
  }
  return componentMap[currentMode.value] || DetailedListView
})

const fileCount = computed(() => files.value?.length || 0)
const selectedCount = computed(() => getSelectedCount())

// Méthodes de chargement des données
const loadFiles = async (path = currentPath.value) => {
  if (loading.value) return

  loading.value = true
  error.value = ''

  try {
    console.log(`FileExplorer: Loading files for path: ${path}`)
    const response = await nasAPI.browse(path)

    if (!response.success) {
      throw new Error(response.error || 'Échec du chargement des fichiers')
    }

    files.value = response.items || []
    console.log(`FileExplorer: Loaded ${files.value.length} items`)

    // Nettoyer la sélection si on change de dossier
    if (path !== currentPath.value) {
      clearSelection()
    }

    currentPath.value = path

  } catch (err) {
    console.error('FileExplorer: Error loading files:', err)
    error.value = err.message || 'Erreur lors du chargement des fichiers'
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

const refresh = async () => {
  await loadFiles(currentPath.value)
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
    await loadFiles(normalizedPath)

    emit('path-changed', {
      oldPath: oldPath,
      newPath: normalizedPath,
      timestamp: Date.now()
    })
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
  if (currentPath.value !== '/') {
    const parentPath = currentPath.value.split('/').slice(0, -1).join('/') || '/'
    handlePathSelected(parentPath)
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

const handleSelectAll = () => {
  selectAll(files.value) // Use the proper selectAll from useViewMode
  selectAllKeyboard()
  currentSelectionMode.value = 'multiple'

  emit('selection-changed', {
    selectedFiles: selectedFiles.value,
    action: 'selectAll',
    timestamp: Date.now()
  })
}

const handleInvertSelection = () => {
  const allFiles = files.value.map(f => f.path || f.name)
  const currentSelection = selectedFiles.value
  const invertedSelection = allFiles.filter(filePath => !currentSelection.includes(filePath))

  setSelectedFiles(invertedSelection)
  currentSelectionMode.value = invertedSelection.length > 1 ? 'multiple' : 'single'

  emit('selection-changed', {
    selectedFiles: invertedSelection,
    action: 'invertSelection',
    timestamp: Date.now()
  })
}

const handleClearSelection = () => {
  clearSelection() // Use the proper clearSelection from useViewMode
  clearKeyboardSelection()
  currentSelectionMode.value = 'single'

  emit('selection-changed', {
    selectedFiles: [],
    action: 'clearSelection',
    timestamp: Date.now()
  })
}

const handleRangeSelection = (targetFilePath) => {
  const currentSelection = selectedFiles.value
  if (currentSelection.length === 0) {
    setSelectedFiles([targetFilePath])
    return
  }

  const lastSelected = currentSelection[currentSelection.length - 1]
  const fileNames = files.value.map(f => f.path || f.name)

  const startIndex = fileNames.indexOf(lastSelected)
  const endIndex = fileNames.indexOf(targetFilePath)

  if (startIndex !== -1 && endIndex !== -1) {
    const minIndex = Math.min(startIndex, endIndex)
    const maxIndex = Math.max(startIndex, endIndex)

    const rangeFiles = fileNames.slice(minIndex, maxIndex + 1)
    const newSelection = [...new Set([...currentSelection, ...rangeFiles])]

    setSelectedFiles(newSelection)
  }
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
const showContextMenu = async (event, item) => {
  // Load permissions for the item
  await loadContextMenuPermissions(item)

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
    const blob = await nasAPI.downloadFile(item.path)

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
  } catch (err) {
    console.error('Error downloading file:', err)
    emit('error', {
      error: err,
      action: 'download',
      file: item,
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

  itemToRename.value = item
  showRenameModal.value = true
  contextMenu.value.show = false
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

const confirmDelete = async (item) => {
  // Check delete permission
  const canDelete = await canPerformAction(item.path, 'delete')
  if (!canDelete) {
    showPermissionError('delete')
    contextMenu.value.show = false
    return
  }

  itemsToDelete.value = [item]
  showDeleteModal.value = true
  contextMenu.value.show = false
}

const showProperties = (item) => {
  selectedItemForProperties.value = item
  showPropertiesModal.value = true
  contextMenu.value.show = false
}

// Permission system
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
  can_share: false,
  can_modify: false
})

const showPermissionErrors = ref(false)

// Load permissions for context menu item
const loadContextMenuPermissions = async (item) => {
  if (!item) {
    contextMenuPermissions.value = {
      can_read: false,
      can_write: false,
      can_delete: false,
      can_share: false,
      can_modify: false
    }
    return
  }

  try {
    const permissions = await loadPermissions(item.path)
    contextMenuPermissions.value = permissions || {
      can_read: false,
      can_write: false,
      can_delete: false,
      can_share: false,
      can_modify: false
    }
  } catch (error) {
    console.error('Error loading context menu permissions:', error)
    showPermissionErrors.value = true
    contextMenuPermissions.value = {
      can_read: false,
      can_write: false,
      can_delete: false,
      can_share: false,
      can_modify: false
    }
  }
}

// Legacy permission functions for backward compatibility
const canModifyItem = async (item) => {
  if (!item) return false
  return await canPerformAction(item.path, 'write')
}

const canDeleteItem = async (item) => {
  if (!item) return false
  return await canPerformAction(item.path, 'delete')
}

const canModifyCurrentFolder = async () => {
  return await canPerformAction(currentPath.value, 'write')
}

// Modal event handlers
const onPermissionsUpdated = () => {
  loadFiles(currentPath.value)
}

const onItemRenamed = async (oldPath, newName) => {
  try {
    const result = await nasAPI.renameItem(oldPath, newName)
    if (result.success) {
      await loadFiles(currentPath.value)
    } else {
      throw new Error(result.error || 'Rename failed')
    }
  } catch (error) {
    console.error('Rename error:', error)
    emit('error', {
      error,
      action: 'rename',
      timestamp: Date.now()
    })
  }
}

const onItemsMoved = () => {
  loadFiles(currentPath.value)
}

const onItemsDeleted = async (items) => {
  try {
    for (const item of items) {
      const result = await nasAPI.deleteItem(item.path)
      if (!result.success) {
        throw new Error(result.error || `Failed to delete ${item.name}`)
      }
    }

    await loadFiles(currentPath.value)
  } catch (error) {
    console.error('Delete error:', error)
    emit('error', {
      error,
      action: 'delete',
      timestamp: Date.now()
    })
  }
}

const onFolderCreated = () => {
  loadFiles(currentPath.value)
}

// Raccourcis clavier additionnels spécifiques au FileExplorer
const additionalShortcuts = {
  'F1': () => {
    showShortcutsHelp.value = true
  },
  '?': () => {
    showShortcutsHelp.value = true
  },
  'Escape': () => {
    if (showShortcutsHelp.value) {
      showShortcutsHelp.value = false
    } else if (contextMenu.value.show) {
      contextMenu.value.show = false
    } else if (hasKeyboardSelection.value) {
      clearKeyboardSelection()
    }
  },
  'Ctrl+Shift+e': () => {
    // Focus sur l'explorateur de fichiers
    const explorerElement = document.querySelector('.file-explorer')
    if (explorerElement) {
      explorerElement.focus()
    }
  },
  'Ctrl+Shift+n': () => {
    // Créer un nouveau dossier
    showCreateFolderModal.value = true
  }
}

// Initialisation des raccourcis clavier additionnels
const { setActive: setAdditionalShortcutsActive } = useKeyboardShortcuts(additionalShortcuts, {
  preventDefault: true,
  stopPropagation: false,
  context: 'fileExplorerGlobal'
})

// Watchers
watch(() => props.initialPath, (newPath) => {
  if (newPath !== currentPath.value) {
    handlePathSelected(newPath)
  }
})

// Lifecycle hooks
onMounted(async () => {
  console.log('FileExplorer: Component mounted')

  if (props.autoLoad) {
    await loadFiles(props.initialPath)
  }

  // Activer les raccourcis clavier (seulement sur desktop)
  if (!isMobile.value) {
    activateNavigation()
    setAdditionalShortcutsActive(true)
  }

  // Écouter les événements de gestes tactiles
  if (explorerContainer.value && isTouch.value) {
    explorerContainer.value.addEventListener('swipe', (event) => {
      const { direction, velocity } = event.detail

      // Swipe rapide vers la droite = navigation retour
      if (direction === 'right' && velocity > 0.5) {
        handleNavigateBack()
      }
      // Swipe vers la gauche = actions
      else if (direction === 'left' && velocity > 0.3) {
        handleShowActions()
      }
    })
  }
})

onUnmounted(() => {
  console.log('FileExplorer: Component unmounted')

  // Désactiver les raccourcis clavier
  deactivateNavigation()
  setAdditionalShortcutsActive(false)
})

// API publique pour utilisation externe
defineExpose({
  // Méthodes
  loadFiles,
  refresh,
  goToPath: handlePathSelected,

  // État
  currentPath: computed(() => currentPath.value),
  files: computed(() => files.value),
  loading: computed(() => loading.value),
  error: computed(() => error.value),
  selectedFiles,
  selectedCount,
  focusedIndex,
  focusedFile,
  showShortcutsHelp,

  // Actions
  clearSelection: clearKeyboardSelection,
  selectAll: selectAllKeyboard,

  // Navigation
  activateNavigation,
  deactivateNavigation,
  setFocusedIndex,
  handleKeyboardClick,
  handleKeyboardDoubleClick,

  // Gestionnaires
  handleModeChange,
  handlePathSelected
})
</script>

<style scoped>
.file-explorer {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 400px;
}

.file-explorer-header {
  flex-shrink: 0;
}

.file-explorer-content {
  flex: 1;
  min-height: 0;
  /* Important pour le scroll dans les enfants */
  display: flex;
  flex-direction: column;
}

.file-explorer-status {
  flex-shrink: 0;
  padding: 0.5rem 0;
  border-top: 1px solid hsl(var(--b3));
  background: hsl(var(--b1));
}

/* Optimisations mobiles et tactiles */
.mobile-optimized {
  padding: 0;
}

.mobile-optimized .file-explorer-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background: hsl(var(--b1));
  border-bottom: 1px solid hsl(var(--b3));
}

.touch-optimized {
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  user-select: none;
}

/* Responsive adaptations */
@media (max-width: 768px) {
  .file-explorer {
    height: 100vh;
    min-height: 100vh;
  }

  .file-explorer-content {
    flex: 1;
    overflow: hidden;
  }

  .file-explorer-status {
    flex-direction: column;
    gap: 0.5rem;
    align-items: flex-start;
    padding: 0.75rem;
    background: hsl(var(--b1));
    border-top: 1px solid hsl(var(--b3));
    position: sticky;
    bottom: 0;
  }

  .file-explorer-status>div {
    width: 100%;
    justify-content: space-between;
  }
}

@media (max-width: 480px) {
  .file-explorer-status {
    padding: 0.5rem;
    font-size: 0.75rem;
  }

  .file-explorer-status .btn {
    padding: 0.25rem;
    min-height: 2rem;
  }
}

/* Animation pour les changements de mode */
.file-explorer-content>* {
  transition: opacity 0.2s ease-in-out;
}

/* Amélioration de l'accessibilité */
.file-explorer:focus-within {
  outline: 2px solid hsl(var(--p));
  outline-offset: 2px;
  border-radius: 0.5rem;
}

/* Styles pour les états de chargement */
.loading {
  color: hsl(var(--p));
}

/* Styles pour les alertes */
.alert {
  border-radius: 0.5rem;
  margin-bottom: 1rem;
}

.alert .btn {
  margin-left: auto;
}
</style>