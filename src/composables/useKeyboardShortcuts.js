/**
 * @fileoverview Composable pour la gestion des raccourcis clavier
 */

import { onMounted, onUnmounted, ref, computed } from 'vue'

/**
 * Composable pour la gestion des raccourcis clavier
 * @param {Object} shortcuts - Objet des raccourcis avec leurs actions
 * @param {Object} options - Options de configuration
 * @returns {Object} API du composable
 */
export function useKeyboardShortcuts(shortcuts = {}, options = {}) {
  const {
    preventDefault = true,
    stopPropagation = false,
    target = null, // null = document, sinon un élément DOM
    context = 'global', // contexte pour les raccourcis (global, fileExplorer, etc.)
    priority = 0 // priorité pour la résolution des conflits
  } = options

  const isActive = ref(true)
  const registeredShortcuts = ref({ ...shortcuts })
  const currentFocus = ref(null)
  const navigationIndex = ref(-1)

  /**
   * Normalise une combinaison de touches
   * @param {KeyboardEvent} event - Événement clavier
   * @returns {string} Combinaison normalisée
   */
  const normalizeShortcut = (event) => {
    const parts = []
    
    if (event.ctrlKey || event.metaKey) parts.push('Ctrl')
    if (event.altKey) parts.push('Alt')
    if (event.shiftKey) parts.push('Shift')
    
    // Normaliser la touche
    let key = event.key
    if (key === ' ') key = 'Space'
    if (key === 'Escape') key = 'Esc'
    if (key === 'Backspace') key = 'Backspace'
    if (key === 'Delete') key = 'Delete'
    if (key === 'Enter') key = 'Enter'
    if (key === 'Tab') key = 'Tab'
    
    // Gérer les touches de fonction
    if (key.startsWith('F') && key.length <= 3) {
      // F1, F2, etc.
      key = key.toUpperCase()
    }
    
    // Gérer les flèches
    if (key.startsWith('Arrow')) {
      key = key.replace('Arrow', '')
    }
    
    parts.push(key)
    
    return parts.join('+')
  }

  /**
   * Vérifie si l'élément actuel peut recevoir du texte
   * @param {Element} element - Élément à vérifier
   * @returns {boolean} True si l'élément peut recevoir du texte
   */
  const isTextInput = (element) => {
    if (!element) return false
    
    const tagName = element.tagName.toLowerCase()
    const type = element.type?.toLowerCase()
    
    return (
      tagName === 'input' && 
      ['text', 'password', 'email', 'search', 'url', 'tel'].includes(type)
    ) || 
    tagName === 'textarea' || 
    element.contentEditable === 'true'
  }

  /**
   * Gestionnaire d'événement clavier
   * @param {KeyboardEvent} event - Événement clavier
   */
  const handleKeydown = (event) => {
    if (!isActive.value) return

    // Ne pas intercepter les raccourcis dans les champs de saisie
    // sauf pour certains raccourcis globaux (Esc, F1, etc.)
    const activeElement = document.activeElement
    const isInTextInput = isTextInput(activeElement)
    
    const shortcut = normalizeShortcut(event)
    const action = registeredShortcuts.value[shortcut]

    // Liste des raccourcis autorisés même dans les champs de saisie
    const allowedInTextInput = [
      'Esc', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12',
      'Ctrl+a', 'Ctrl+c', 'Ctrl+v', 'Ctrl+x', 'Ctrl+z', 'Ctrl+y'
    ]

    if (isInTextInput && !allowedInTextInput.includes(shortcut)) {
      return
    }

    if (action && typeof action === 'function') {
      // Empêcher le comportement par défaut seulement si nécessaire
      const shouldPreventDefault = preventDefault && (
        !isInTextInput || 
        !['Ctrl+a', 'Ctrl+c', 'Ctrl+v', 'Ctrl+x', 'Ctrl+z', 'Ctrl+y'].includes(shortcut)
      )
      
      if (shouldPreventDefault) event.preventDefault()
      if (stopPropagation) event.stopPropagation()
      
      try {
        action(event, { shortcut, context, isInTextInput })
      } catch (error) {
        console.error('Erreur lors de l\'exécution du raccourci:', shortcut, error)
      }
    }
  }

  /**
   * Ajoute un raccourci
   * @param {string} shortcut - Combinaison de touches
   * @param {Function} action - Action à exécuter
   */
  const addShortcut = (shortcut, action) => {
    registeredShortcuts.value[shortcut] = action
  }

  /**
   * Supprime un raccourci
   * @param {string} shortcut - Combinaison de touches
   */
  const removeShortcut = (shortcut) => {
    delete registeredShortcuts.value[shortcut]
  }

  /**
   * Active ou désactive les raccourcis
   * @param {boolean} active - État d'activation
   */
  const setActive = (active) => {
    isActive.value = active
  }

  /**
   * Obtient la liste des raccourcis actifs
   * @returns {Object} Raccourcis actifs
   */
  const getShortcuts = () => {
    return { ...registeredShortcuts.value }
  }

  /**
   * Met à jour l'index de navigation
   * @param {number} index - Nouvel index
   */
  const setNavigationIndex = (index) => {
    navigationIndex.value = index
  }

  /**
   * Obtient l'index de navigation actuel
   * @returns {number} Index actuel
   */
  const getNavigationIndex = () => {
    return navigationIndex.value
  }

  /**
   * Met à jour l'élément ayant le focus
   * @param {Element} element - Élément ayant le focus
   */
  const setCurrentFocus = (element) => {
    currentFocus.value = element
  }

  /**
   * Obtient l'élément ayant le focus
   * @returns {Element} Élément ayant le focus
   */
  const getCurrentFocus = () => {
    return currentFocus.value
  }

  // Computed pour les raccourcis par catégorie
  const shortcutsByCategory = computed(() => {
    const categories = {
      navigation: {},
      selection: {},
      actions: {},
      modes: {},
      sorting: {},
      help: {}
    }

    Object.entries(registeredShortcuts.value).forEach(([shortcut, action]) => {
      if (typeof action === 'string') {
        // Catégoriser selon le nom de l'action
        if (action.includes('select') || action.includes('Select')) {
          categories.selection[shortcut] = action
        } else if (action.includes('sort') || action.includes('Sort')) {
          categories.sorting[shortcut] = action
        } else if (action.includes('mode') || action.includes('Mode') || action.includes('switch')) {
          categories.modes[shortcut] = action
        } else if (action.includes('help') || action.includes('Help') || shortcut === 'F1') {
          categories.help[shortcut] = action
        } else if (['Up', 'Down', 'Left', 'Right', 'Home', 'End', 'Enter', 'Backspace'].some(nav => shortcut.includes(nav))) {
          categories.navigation[shortcut] = action
        } else {
          categories.actions[shortcut] = action
        }
      }
    })

    return categories
  })

  // Montage et démontage des événements
  onMounted(() => {
    const element = target || document
    element.addEventListener('keydown', handleKeydown)
    
    // Écouter les changements de focus pour la navigation
    document.addEventListener('focusin', (event) => {
      setCurrentFocus(event.target)
    })
  })

  onUnmounted(() => {
    const element = target || document
    element.removeEventListener('keydown', handleKeydown)
    
    document.removeEventListener('focusin', setCurrentFocus)
  })

  return {
    isActive,
    addShortcut,
    removeShortcut,
    setActive,
    getShortcuts,
    registeredShortcuts,
    shortcutsByCategory,
    navigationIndex,
    setNavigationIndex,
    getNavigationIndex,
    setCurrentFocus,
    getCurrentFocus,
    currentFocus
  }
}

/**
 * Raccourcis prédéfinis pour les modes d'affichage
 */
export const VIEW_MODE_SHORTCUTS = {
  // Navigation
  'Up': 'selectPrevious',
  'Down': 'selectNext',
  'Left': 'collapseOrGoUp',
  'Right': 'expandOrEnter',
  'Enter': 'openSelected',
  'Backspace': 'goUp',
  'Home': 'selectFirst',
  'End': 'selectLast',
  'PageUp': 'selectPageUp',
  'PageDown': 'selectPageDown',
  
  // Sélection
  'Ctrl+a': 'selectAll',
  'Ctrl+d': 'deselectAll',
  'Shift+Up': 'extendSelectionUp',
  'Shift+Down': 'extendSelectionDown',
  'Shift+Home': 'extendSelectionToFirst',
  'Shift+End': 'extendSelectionToLast',
  'Shift+PageUp': 'extendSelectionPageUp',
  'Shift+PageDown': 'extendSelectionPageDown',
  'Ctrl+Space': 'toggleCurrentSelection',
  'Space': 'toggleCurrentSelection',
  
  // Modes d'affichage
  'Ctrl+1': 'switchToTreeView',
  'Ctrl+2': 'switchToDetailedList',
  'Ctrl+3': 'switchToGridView',
  
  // Tri
  'Ctrl+Shift+n': 'sortByName',
  'Ctrl+Shift+s': 'sortBySize',
  'Ctrl+Shift+t': 'sortByType',
  'Ctrl+Shift+d': 'sortByDate',
  'Ctrl+Shift+m': 'sortByModified',
  
  // Actions
  'F2': 'rename',
  'Delete': 'delete',
  'Shift+Delete': 'permanentDelete',
  'Ctrl+c': 'copy',
  'Ctrl+v': 'paste',
  'Ctrl+x': 'cut',
  'Ctrl+z': 'undo',
  'Ctrl+y': 'redo',
  'F5': 'refresh',
  'Ctrl+r': 'refresh',
  'Ctrl+n': 'newFolder',
  'Ctrl+Shift+n': 'newFile',
  
  // Recherche et aide
  'Ctrl+f': 'search',
  'Esc': 'clearSearchOrDeselect',
  'F1': 'showHelp',
  '?': 'showHelp',
  'Ctrl+h': 'showHelp',
  
  // Navigation rapide
  'Ctrl+l': 'focusAddressBar',
  'Alt+Up': 'goUp',
  'Alt+Left': 'goBack',
  'Alt+Right': 'goForward',
  'Ctrl+Shift+e': 'focusFileExplorer'
}

/**
 * Actions de navigation pour les raccourcis clavier
 */
export const NAVIGATION_ACTIONS = {
  selectPrevious: 'Sélectionner l\'élément précédent',
  selectNext: 'Sélectionner l\'élément suivant',
  collapseOrGoUp: 'Réduire ou remonter',
  expandOrEnter: 'Développer ou entrer',
  openSelected: 'Ouvrir la sélection',
  goUp: 'Dossier parent',
  selectFirst: 'Premier élément',
  selectLast: 'Dernier élément',
  selectPageUp: 'Page précédente',
  selectPageDown: 'Page suivante'
}

/**
 * Actions de sélection pour les raccourcis clavier
 */
export const SELECTION_ACTIONS = {
  selectAll: 'Tout sélectionner',
  deselectAll: 'Tout désélectionner',
  extendSelectionUp: 'Étendre la sélection vers le haut',
  extendSelectionDown: 'Étendre la sélection vers le bas',
  extendSelectionToFirst: 'Étendre jusqu\'au premier',
  extendSelectionToLast: 'Étendre jusqu\'au dernier',
  extendSelectionPageUp: 'Étendre d\'une page vers le haut',
  extendSelectionPageDown: 'Étendre d\'une page vers le bas',
  toggleCurrentSelection: 'Basculer la sélection actuelle'
}

/**
 * Actions d'édition pour les raccourcis clavier
 */
export const ACTION_SHORTCUTS = {
  rename: 'Renommer',
  delete: 'Supprimer',
  permanentDelete: 'Supprimer définitivement',
  copy: 'Copier',
  paste: 'Coller',
  cut: 'Couper',
  undo: 'Annuler',
  redo: 'Rétablir',
  refresh: 'Actualiser',
  newFolder: 'Nouveau dossier',
  newFile: 'Nouveau fichier'
}

export default useKeyboardShortcuts