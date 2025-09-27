/**
 * @fileoverview Composable pour la gestion des modes d'affichage des fichiers
 */

import { ref, computed, watch } from 'vue'
import { 
  VIEW_MODES, 
  SORT_DIRECTIONS, 
  SORT_COLUMNS, 
  DEFAULT_VIEW_MODE_STATE,
  DEFAULT_COLUMNS
} from '../types/viewMode.js'
import { useKeyboardShortcuts } from './useKeyboardShortcuts.js'

// Constantes pour les modes d'affichage disponibles
const AVAILABLE_MODES = [
  {
    id: VIEW_MODES.TREE,
    label: 'Arbre',
    icon: 'fas fa-sitemap',
    component: 'TreeView'
  },
  {
    id: VIEW_MODES.DETAILED_LIST,
    label: 'Liste détaillée',
    icon: 'fas fa-list',
    component: 'DetailedListView'
  }
]

// Clé pour le localStorage
const STORAGE_KEY = 'nas-view-mode-preferences'

// État global partagé entre toutes les instances
const globalState = ref(null)

/**
 * Charge les préférences depuis le localStorage
 * @returns {ViewModeState} État des préférences
 */
function loadPreferences() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      return {
        currentMode: parsed.currentMode || 'tree',
        sortColumn: parsed.sortColumn || 'name',
        sortDirection: parsed.sortDirection || 'asc',
        selectedFiles: [],
        columnVisibility: {
          name: true,
          size: true,
          type: true,
          modified: true,
          ...parsed.columnVisibility
        }
      }
    }
  } catch (error) {
    console.warn('Erreur lors du chargement des préférences de vue:', error)
  }

  // Valeurs par défaut
  return {
    ...DEFAULT_VIEW_MODE_STATE
  }
}

/**
 * Sauvegarde les préférences dans le localStorage
 * @param {ViewModeState} state - État à sauvegarder
 */
function savePreferences(state) {
  try {
    const toSave = {
      currentMode: state.currentMode,
      sortColumn: state.sortColumn,
      sortDirection: state.sortDirection,
      columnVisibility: state.columnVisibility
      // Note: selectedFiles n'est pas persisté car c'est un état temporaire
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave))
  } catch (error) {
    console.warn('Erreur lors de la sauvegarde des préférences de vue:', error)
  }
}

/**
 * Composable pour la gestion des modes d'affichage
 * @returns {Object} API du composable
 */
export function useViewMode() {
  // Initialisation de l'état global si nécessaire
  if (!globalState.value) {
    globalState.value = loadPreferences()
  }

  // État local réactif
  const state = globalState

  // Getters computed
  const currentMode = computed(() => state.value.currentMode)
  const sortColumn = computed(() => state.value.sortColumn)
  const sortDirection = computed(() => state.value.sortDirection)
  // selectedFiles doit être une ref pour permettre les modifications
  const selectedFiles = computed({
    get: () => state.value.selectedFiles,
    set: (value) => {
      state.value.selectedFiles = value
    }
  })
  const columnVisibility = computed(() => state.value.columnVisibility)

  // Mode d'affichage actuel avec métadonnées
  const currentViewMode = computed(() => {
    return AVAILABLE_MODES.find(mode => mode.id === state.value.currentMode) || AVAILABLE_MODES[0]
  })

  // Modes d'affichage disponibles
  const availableModes = computed(() => AVAILABLE_MODES)

  // Colonnes visibles pour le mode liste
  const visibleColumns = computed(() => {
    return DEFAULT_COLUMNS.filter(col => state.value.columnVisibility[col.key])
  })

  // Actions
  const setCurrentMode = (modeId) => {
    const mode = AVAILABLE_MODES.find(m => m.id === modeId)
    if (mode) {
      state.value.currentMode = modeId
      console.log(`Mode d'affichage changé vers: ${mode.label}`)
    } else {
      console.warn(`Mode d'affichage inconnu: ${modeId}`)
    }
  }

  const setSortColumn = (column) => {
    const oldColumn = state.value.sortColumn
    const oldDirection = state.value.sortDirection
    
    if (state.value.sortColumn === column) {
      // Inverser la direction si c'est la même colonne
      state.value.sortDirection = state.value.sortDirection === 'asc' ? 'desc' : 'asc'
    } else {
      // Nouvelle colonne, tri ascendant par défaut
      state.value.sortColumn = column
      state.value.sortDirection = 'asc'
    }
    
    console.log(`Tri changé: ${column} ${state.value.sortDirection} (précédent: ${oldColumn} ${oldDirection})`)
  }

  const setSortDirection = (direction) => {
    if (Object.values(SORT_DIRECTIONS).includes(direction)) {
      state.value.sortDirection = direction
    }
  }

  const setSelectedFiles = (files) => {
    state.value.selectedFiles = Array.isArray(files) ? [...files] : []
  }

  const addSelectedFile = (filePath) => {
    if (!state.value.selectedFiles.includes(filePath)) {
      state.value.selectedFiles.push(filePath)
    }
  }

  const removeSelectedFile = (filePath) => {
    const index = state.value.selectedFiles.indexOf(filePath)
    if (index > -1) {
      state.value.selectedFiles.splice(index, 1)
    }
  }

  const toggleSelectedFile = (filePath) => {
    if (state.value.selectedFiles.includes(filePath)) {
      removeSelectedFile(filePath)
    } else {
      addSelectedFile(filePath)
    }
  }

  const clearSelection = () => {
    state.value.selectedFiles = []
  }

  const selectAll = (files) => {
    state.value.selectedFiles = files.map(file => file.path || file.name)
  }

  // Enhanced multiple selection methods
  const selectRange = (files, startIndex, endIndex) => {
    if (!Array.isArray(files) || startIndex < 0 || endIndex < 0) return
    
    const minIndex = Math.min(startIndex, endIndex)
    const maxIndex = Math.max(startIndex, endIndex)
    
    const rangeFiles = []
    for (let i = minIndex; i <= maxIndex && i < files.length; i++) {
      const file = files[i]
      if (file) {
        rangeFiles.push(file.path || file.name)
      }
    }
    
    // Merge with existing selection
    const newSelection = [...new Set([...state.value.selectedFiles, ...rangeFiles])]
    state.value.selectedFiles = newSelection
  }

  const selectRangeReplace = (files, startIndex, endIndex) => {
    if (!Array.isArray(files) || startIndex < 0 || endIndex < 0) return
    
    const minIndex = Math.min(startIndex, endIndex)
    const maxIndex = Math.max(startIndex, endIndex)
    
    const rangeFiles = []
    for (let i = minIndex; i <= maxIndex && i < files.length; i++) {
      const file = files[i]
      if (file) {
        rangeFiles.push(file.path || file.name)
      }
    }
    
    state.value.selectedFiles = rangeFiles
  }

  const handleMultipleSelection = (filePath, files, options = {}) => {
    const { 
      ctrlKey = false, 
      shiftKey = false, 
      currentIndex = -1, 
      lastSelectedIndex = -1 
    } = options

    if (shiftKey && lastSelectedIndex >= 0 && currentIndex >= 0) {
      // Range selection with Shift+Click
      selectRangeReplace(files, lastSelectedIndex, currentIndex)
    } else if (ctrlKey) {
      // Toggle selection with Ctrl+Click
      toggleSelectedFile(filePath)
    } else {
      // Single selection (replace current selection)
      setSelectedFiles([filePath])
    }
  }

  const setColumnVisibility = (column, visible) => {
    state.value.columnVisibility[column] = visible
  }

  const toggleColumnVisibility = (column) => {
    state.value.columnVisibility[column] = !state.value.columnVisibility[column]
  }

  // Utilitaires
  const isSelected = (filePath) => {
    return state.value.selectedFiles.includes(filePath)
  }

  const getSelectedCount = () => {
    return state.value.selectedFiles.length
  }

  const isTreeMode = computed(() => state.value.currentMode === VIEW_MODES.TREE)
  const isDetailedListMode = computed(() => state.value.currentMode === VIEW_MODES.DETAILED_LIST)

  // Fonction de tri pour les fichiers
  const sortFiles = (files) => {
    if (!Array.isArray(files)) return []

    const sorted = [...files].sort((a, b) => {
      let aValue, bValue

      switch (state.value.sortColumn) {
        case SORT_COLUMNS.NAME:
          aValue = (a.name || '').toLowerCase()
          bValue = (b.name || '').toLowerCase()
          break
        case SORT_COLUMNS.SIZE:
          aValue = a.size || 0
          bValue = b.size || 0
          break
        case SORT_COLUMNS.TYPE:
          aValue = a.is_directory ? 'dossier' : (a.file_type || 'fichier')
          bValue = b.is_directory ? 'dossier' : (b.file_type || 'fichier')
          break
        case SORT_COLUMNS.MODIFIED:
          aValue = new Date(a.modified_time || 0)
          bValue = new Date(b.modified_time || 0)
          break
        default:
          return 0
      }

      // Toujours mettre les dossiers en premier
      if (a.is_directory && !b.is_directory) return -1
      if (!a.is_directory && b.is_directory) return 1

      // Tri selon la direction
      if (aValue < bValue) return state.value.sortDirection === SORT_DIRECTIONS.ASC ? -1 : 1
      if (aValue > bValue) return state.value.sortDirection === SORT_DIRECTIONS.ASC ? 1 : -1
      return 0
    })

    return sorted
  }

  // Actions de tri par raccourcis clavier
  const sortByName = () => setSortColumn(SORT_COLUMNS.NAME)
  const sortBySize = () => setSortColumn(SORT_COLUMNS.SIZE)
  const sortByType = () => setSortColumn(SORT_COLUMNS.TYPE)
  const sortByDate = () => setSortColumn(SORT_COLUMNS.MODIFIED)

  // Configuration des raccourcis clavier pour le tri
  const sortingShortcuts = {
    'Ctrl+Shift+n': sortByName,
    'Ctrl+Shift+s': sortBySize,
    'Ctrl+Shift+t': sortByType,
    'Ctrl+Shift+d': sortByDate
  }

  // Initialisation des raccourcis clavier
  const { addShortcut, removeShortcut, setActive: setShortcutsActive } = useKeyboardShortcuts(sortingShortcuts)

  // Watcher pour la persistance automatique
  watch(
    () => state.value,
    (newState) => {
      savePreferences(newState)
    },
    { deep: true }
  )

  // API publique
  return {
    // État
    currentMode,
    sortColumn,
    sortDirection,
    selectedFiles,
    columnVisibility,
    currentViewMode,
    availableModes,
    visibleColumns,

    // Actions
    setCurrentMode,
    setSortColumn,
    setSortDirection,
    setSelectedFiles,
    addSelectedFile,
    removeSelectedFile,
    toggleSelectedFile,
    clearSelection,
    selectAll,
    selectRange,
    selectRangeReplace,
    handleMultipleSelection,
    setColumnVisibility,
    toggleColumnVisibility,

    // Actions de tri par raccourcis
    sortByName,
    sortBySize,
    sortByType,
    sortByDate,

    // Gestion des raccourcis
    addShortcut,
    removeShortcut,
    setShortcutsActive,

    // Utilitaires
    isSelected,
    getSelectedCount,
    isTreeMode,
    isDetailedListMode,
    sortFiles,

    // Constantes
    AVAILABLE_MODES
  }
}

// Export par défaut pour compatibilité
export default useViewMode