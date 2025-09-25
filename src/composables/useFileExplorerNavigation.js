/**
 * @fileoverview Composable pour la navigation clavier dans l'explorateur de fichiers
 */

import { ref, computed, nextTick } from 'vue'
import { useKeyboardShortcuts, VIEW_MODE_SHORTCUTS } from './useKeyboardShortcuts.js'

/**
 * Composable pour la navigation clavier dans l'explorateur de fichiers
 * @param {Object} options - Options de configuration
 * @returns {Object} API du composable
 */
export function useFileExplorerNavigation(options = {}) {
  const {
    files = ref([]),
    selectedFiles = ref([]),
    currentPath = ref('/'),
    onFileSelect = () => {},
    onFileOpen = () => {},
    onPathChange = () => {},
    onSort = () => {},
    onRefresh = () => {},
    onShowHelp = () => {}
  } = options

  // État de navigation
  const focusedIndex = ref(-1)
  const lastSelectedIndex = ref(-1)
  const isNavigating = ref(false)
  const selectionAnchor = ref(-1)

  // Computed
  const focusedFile = computed(() => {
    const index = focusedIndex.value
    return index >= 0 && index < files.value.length ? files.value[index] : null
  })

  const hasSelection = computed(() => selectedFiles.value.length > 0)

  const canGoUp = computed(() => currentPath.value !== '/' && currentPath.value !== '')

  // Méthodes de navigation
  const setFocusedIndex = (index) => {
    const maxIndex = files.value.length - 1
    if (index < 0) {
      focusedIndex.value = 0
    } else if (index > maxIndex) {
      focusedIndex.value = maxIndex
    } else {
      focusedIndex.value = index
    }
    
    // Faire défiler vers l'élément si nécessaire
    nextTick(() => {
      scrollToFocusedItem()
    })
  }

  const moveFocus = (direction) => {
    if (files.value.length === 0) return

    const currentIndex = focusedIndex.value
    let newIndex = currentIndex

    switch (direction) {
      case 'up':
        newIndex = currentIndex <= 0 ? files.value.length - 1 : currentIndex - 1
        break
      case 'down':
        newIndex = currentIndex >= files.value.length - 1 ? 0 : currentIndex + 1
        break
      case 'first':
        newIndex = 0
        break
      case 'last':
        newIndex = files.value.length - 1
        break
      case 'pageUp':
        newIndex = Math.max(0, currentIndex - 10)
        break
      case 'pageDown':
        newIndex = Math.min(files.value.length - 1, currentIndex + 10)
        break
    }

    setFocusedIndex(newIndex)
    isNavigating.value = true
  }

  const scrollToFocusedItem = () => {
    const focusedElement = document.querySelector(`[data-file-index="${focusedIndex.value}"]`)
    if (focusedElement) {
      focusedElement.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      })
    }
  }

  // Méthodes de sélection
  const selectFile = (index, multiSelect = false, rangeSelect = false) => {
    if (index < 0 || index >= files.value.length) return

    const file = files.value[index]
    const filePath = file.path || file.name

    if (rangeSelect && selectionAnchor.value >= 0) {
      // Sélection par plage - remplace la sélection actuelle
      const start = Math.min(selectionAnchor.value, index)
      const end = Math.max(selectionAnchor.value, index)
      const rangeFiles = []

      for (let i = start; i <= end; i++) {
        const f = files.value[i]
        if (f) {
          rangeFiles.push(f.path || f.name)
        }
      }

      selectedFiles.value = rangeFiles
    } else if (multiSelect) {
      // Sélection multiple - toggle
      const isSelected = selectedFiles.value.includes(filePath)
      if (isSelected) {
        selectedFiles.value = selectedFiles.value.filter(path => path !== filePath)
        // Si on désélectionne l'ancre, la déplacer vers un autre élément sélectionné
        if (selectionAnchor.value === index && selectedFiles.value.length > 0) {
          const remainingIndex = findFileIndex(selectedFiles.value[selectedFiles.value.length - 1])
          selectionAnchor.value = remainingIndex >= 0 ? remainingIndex : -1
        }
      } else {
        selectedFiles.value = [...selectedFiles.value, filePath]
        selectionAnchor.value = index
      }
    } else {
      // Sélection simple - remplace la sélection actuelle
      selectedFiles.value = [filePath]
      selectionAnchor.value = index
    }

    lastSelectedIndex.value = index
    onFileSelect({
      file,
      selectedFiles: selectedFiles.value,
      multiSelect,
      rangeSelect,
      action: rangeSelect ? 'rangeSelect' : (multiSelect ? 'multiSelect' : 'singleSelect'),
      anchorIndex: selectionAnchor.value
    })
  }

  const selectAll = () => {
    const allPaths = files.value.map(f => f.path || f.name)
    selectedFiles.value = allPaths
    onFileSelect({
      selectedFiles: selectedFiles.value,
      action: 'selectAll'
    })
  }

  const clearSelection = () => {
    selectedFiles.value = []
    selectionAnchor.value = -1
    onFileSelect({
      selectedFiles: [],
      action: 'clear'
    })
  }

  const extendSelection = (direction) => {
    if (files.value.length === 0) return

    let targetIndex = focusedIndex.value

    switch (direction) {
      case 'up':
        targetIndex = Math.max(0, focusedIndex.value - 1)
        break
      case 'down':
        targetIndex = Math.min(files.value.length - 1, focusedIndex.value + 1)
        break
      case 'first':
        targetIndex = 0
        break
      case 'last':
        targetIndex = files.value.length - 1
        break
      case 'pageUp':
        targetIndex = Math.max(0, focusedIndex.value - 10)
        break
      case 'pageDown':
        targetIndex = Math.min(files.value.length - 1, focusedIndex.value + 10)
        break
    }

    // Établir l'ancre si elle n'existe pas
    if (selectionAnchor.value === -1) {
      // Si aucune sélection, utiliser l'index actuel comme ancre
      if (selectedFiles.value.length === 0) {
        selectionAnchor.value = focusedIndex.value
      } else {
        // Utiliser le dernier élément sélectionné comme ancre
        const lastSelectedPath = selectedFiles.value[selectedFiles.value.length - 1]
        selectionAnchor.value = findFileIndex(lastSelectedPath)
      }
    }

    setFocusedIndex(targetIndex)
    selectFile(targetIndex, false, true)
  }

  const extendSelectionToIndex = (targetIndex) => {
    if (targetIndex < 0 || targetIndex >= files.value.length) return

    // Établir l'ancre si elle n'existe pas
    if (selectionAnchor.value === -1) {
      if (selectedFiles.value.length === 0) {
        selectionAnchor.value = focusedIndex.value >= 0 ? focusedIndex.value : 0
      } else {
        const lastSelectedPath = selectedFiles.value[selectedFiles.value.length - 1]
        selectionAnchor.value = findFileIndex(lastSelectedPath)
      }
    }

    setFocusedIndex(targetIndex)
    selectFile(targetIndex, false, true)
  }

  // Actions des raccourcis clavier
  const keyboardActions = {
    // Navigation
    selectPrevious: () => moveFocus('up'),
    selectNext: () => moveFocus('down'),
    selectFirst: () => moveFocus('first'),
    selectLast: () => moveFocus('last'),
    selectPageUp: () => moveFocus('pageUp'),
    selectPageDown: () => moveFocus('pageDown'),

    // Sélection
    selectAll: () => selectAll(),
    deselectAll: () => clearSelection(),
    extendSelectionUp: () => extendSelection('up'),
    extendSelectionDown: () => extendSelection('down'),
    extendSelectionToFirst: () => extendSelection('first'),
    extendSelectionToLast: () => extendSelection('last'),
    extendSelectionPageUp: () => extendSelection('pageUp'),
    extendSelectionPageDown: () => extendSelection('pageDown'),
    
    toggleCurrentSelection: () => {
      if (focusedIndex.value >= 0) {
        selectFile(focusedIndex.value, true, false)
      }
    },

    // Actions
    openSelected: () => {
      const file = focusedFile.value
      if (file) {
        onFileOpen({ file })
      }
    },

    goUp: () => {
      if (canGoUp.value) {
        const parentPath = getParentPath(currentPath.value)
        onPathChange(parentPath)
      }
    },

    refresh: () => onRefresh(),
    showHelp: () => onShowHelp(),

    // Tri
    sortByName: () => onSort({ column: 'name', direction: 'asc' }),
    sortBySize: () => onSort({ column: 'size', direction: 'desc' }),
    sortByType: () => onSort({ column: 'type', direction: 'asc' }),
    sortByDate: () => onSort({ column: 'modified_time', direction: 'desc' }),

    // Échappement
    clearSearchOrDeselect: () => {
      if (hasSelection.value) {
        clearSelection()
      }
    }
  }

  // Utilitaires
  const getParentPath = (path) => {
    if (path === '/' || path === '') return '/'
    const parts = path.split('/').filter(Boolean)
    parts.pop()
    return parts.length === 0 ? '/' : '/' + parts.join('/')
  }

  const findFileIndex = (fileName) => {
    return files.value.findIndex(f => (f.path || f.name) === fileName)
  }

  const focusFile = (fileName) => {
    const index = findFileIndex(fileName)
    if (index >= 0) {
      setFocusedIndex(index)
    }
  }

  // Initialiser les raccourcis clavier
  const { setActive: setShortcutsActive } = useKeyboardShortcuts(keyboardActions, {
    context: 'fileExplorer',
    preventDefault: true
  })

  // Méthodes publiques
  const activate = () => {
    setShortcutsActive(true)
    // Initialiser le focus sur le premier élément si aucun n'est sélectionné
    if (focusedIndex.value === -1 && files.value.length > 0) {
      setFocusedIndex(0)
    }
  }

  const deactivate = () => {
    setShortcutsActive(false)
  }

  const handleClick = (file, event) => {
    const index = findFileIndex(file.path || file.name)
    if (index >= 0) {
      setFocusedIndex(index)
      selectFile(index, event.ctrlKey || event.metaKey, event.shiftKey)
    }
  }

  const handleDoubleClick = (file, event) => {
    const index = findFileIndex(file.path || file.name)
    if (index >= 0) {
      setFocusedIndex(index)
      onFileOpen({ file, event })
    }
  }

  return {
    // État
    focusedIndex,
    focusedFile,
    lastSelectedIndex,
    isNavigating,
    hasSelection,
    canGoUp,

    // Méthodes de navigation
    setFocusedIndex,
    moveFocus,
    scrollToFocusedItem,

    // Méthodes de sélection
    selectFile,
    selectAll,
    clearSelection,
    extendSelection,
    extendSelectionToIndex,

    // Méthodes utilitaires
    findFileIndex,
    focusFile,
    getParentPath,

    // Gestionnaires d'événements
    handleClick,
    handleDoubleClick,

    // Contrôle
    activate,
    deactivate,

    // Actions
    keyboardActions
  }
}

export default useFileExplorerNavigation