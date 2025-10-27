/**
 * @fileoverview Keyboard Shortcuts Manager
 * Manages global and context-specific keyboard shortcuts for the file viewer
 */

/**
 * Keyboard shortcut definitions
 */
export const KEYBOARD_SHORTCUTS = {
  // Global shortcuts (work anywhere in the file viewer)
  GLOBAL: {
    CLOSE: { key: 'Escape', description: 'Fermer le visualiseur' },
    SAVE: { key: 'Ctrl+S', description: 'Sauvegarder le fichier' },
    DOWNLOAD: { key: 'Ctrl+D', description: 'Télécharger le fichier' },
    RETRY: { key: 'Ctrl+R', description: 'Réessayer le chargement' },
    TOGGLE_MODE: { key: 'Tab', description: 'Basculer entre lecture/édition' },
    HELP: { key: 'F1', description: 'Afficher l\'aide' },
    FULLSCREEN: { key: 'F11', description: 'Mode plein écran' }
  },

  // Navigation shortcuts
  NAVIGATION: {
    PREVIOUS_FILE: { key: 'ArrowLeft', description: 'Fichier précédent' },
    NEXT_FILE: { key: 'ArrowRight', description: 'Fichier suivant' },
    FIRST_FILE: { key: 'Home', description: 'Premier fichier' },
    LAST_FILE: { key: 'End', description: 'Dernier fichier' }
  },

  // Text editor shortcuts
  TEXT_EDITOR: {
    FIND: { key: 'Ctrl+F', description: 'Rechercher dans le texte' },
    REPLACE: { key: 'Ctrl+H', description: 'Rechercher et remplacer' },
    GO_TO_LINE: { key: 'Ctrl+G', description: 'Aller à la ligne' },
    SELECT_ALL: { key: 'Ctrl+A', description: 'Sélectionner tout' },
    UNDO: { key: 'Ctrl+Z', description: 'Annuler' },
    REDO: { key: 'Ctrl+Y', description: 'Rétablir' },
    COMMENT: { key: 'Ctrl+/', description: 'Commenter/décommenter' },
    INDENT: { key: 'Tab', description: 'Indenter' },
    UNINDENT: { key: 'Shift+Tab', description: 'Désindenter' }
  },

  // Image viewer shortcuts
  IMAGE_VIEWER: {
    ZOOM_IN: { key: '+', description: 'Zoomer' },
    ZOOM_OUT: { key: '-', description: 'Dézoomer' },
    ZOOM_FIT: { key: '0', description: 'Ajuster à la fenêtre' },
    ZOOM_100: { key: '1', description: 'Taille réelle (100%)' },
    ROTATE_LEFT: { key: 'Ctrl+ArrowLeft', description: 'Rotation gauche' },
    ROTATE_RIGHT: { key: 'Ctrl+ArrowRight', description: 'Rotation droite' },
    FLIP_HORIZONTAL: { key: 'H', description: 'Retourner horizontalement' },
    FLIP_VERTICAL: { key: 'V', description: 'Retourner verticalement' }
  },

  // PDF viewer shortcuts
  PDF_VIEWER: {
    NEXT_PAGE: { key: 'PageDown', description: 'Page suivante' },
    PREVIOUS_PAGE: { key: 'PageUp', description: 'Page précédente' },
    FIRST_PAGE: { key: 'Ctrl+Home', description: 'Première page' },
    LAST_PAGE: { key: 'Ctrl+End', description: 'Dernière page' },
    ZOOM_IN: { key: 'Ctrl++', description: 'Zoomer' },
    ZOOM_OUT: { key: 'Ctrl+-', description: 'Dézoomer' },
    FIND: { key: 'Ctrl+F', description: 'Rechercher dans le PDF' }
  },

  // Media player shortcuts
  MEDIA_PLAYER: {
    PLAY_PAUSE: { key: 'Space', description: 'Lecture/Pause' },
    MUTE: { key: 'M', description: 'Couper/rétablir le son' },
    VOLUME_UP: { key: 'ArrowUp', description: 'Augmenter le volume' },
    VOLUME_DOWN: { key: 'ArrowDown', description: 'Diminuer le volume' },
    SEEK_FORWARD: { key: 'ArrowRight', description: 'Avancer de 10s' },
    SEEK_BACKWARD: { key: 'ArrowLeft', description: 'Reculer de 10s' },
    FULLSCREEN: { key: 'F', description: 'Mode plein écran' }
  },

  // Document viewer shortcuts
  DOCUMENT_VIEWER: {
    ZOOM_IN: { key: 'Ctrl++', description: 'Zoomer' },
    ZOOM_OUT: { key: 'Ctrl+-', description: 'Dézoomer' },
    FIND: { key: 'Ctrl+F', description: 'Rechercher dans le document' },
    NEXT_SHEET: { key: 'Ctrl+PageDown', description: 'Feuille suivante (Excel)' },
    PREVIOUS_SHEET: { key: 'Ctrl+PageUp', description: 'Feuille précédente (Excel)' },
    NEXT_SLIDE: { key: 'PageDown', description: 'Diapositive suivante (PowerPoint)' },
    PREVIOUS_SLIDE: { key: 'PageUp', description: 'Diapositive précédente (PowerPoint)' }
  }
}

/**
 * Keyboard Shortcuts Manager class
 */
export class KeyboardShortcutsManager {
  constructor() {
    this.shortcuts = new Map()
    this.contexts = new Set()
    this.currentContext = 'global'
    this.enabled = true
    this.listeners = new Map()
  }

  /**
   * Register a keyboard shortcut
   * @param {string} context - Context where shortcut is active
   * @param {string} key - Key combination
   * @param {Function} handler - Handler function
   * @param {string} description - Description for help
   */
  register(context, key, handler, description = '') {
    const shortcutKey = `${context}:${key}`
    this.shortcuts.set(shortcutKey, {
      context,
      key,
      handler,
      description,
      enabled: true
    })
    this.contexts.add(context)
  }

  /**
   * Unregister a keyboard shortcut
   * @param {string} context - Context
   * @param {string} key - Key combination
   */
  unregister(context, key) {
    const shortcutKey = `${context}:${key}`
    this.shortcuts.delete(shortcutKey)
  }

  /**
   * Set the current context
   * @param {string} context - New context
   */
  setContext(context) {
    this.currentContext = context
  }

  /**
   * Enable or disable shortcuts
   * @param {boolean} enabled - Whether shortcuts are enabled
   */
  setEnabled(enabled) {
    this.enabled = enabled
  }

  /**
   * Handle keyboard event
   * @param {KeyboardEvent} event - Keyboard event
   * @returns {boolean} True if event was handled
   */
  handleKeyEvent(event) {
    if (!this.enabled) return false

    const keyString = this.eventToKeyString(event)
    
    // Try context-specific shortcuts first
    const contextKey = `${this.currentContext}:${keyString}`
    if (this.shortcuts.has(contextKey)) {
      const shortcut = this.shortcuts.get(contextKey)
      if (shortcut.enabled) {
        event.preventDefault()
        shortcut.handler(event)
        return true
      }
    }

    // Try global shortcuts
    const globalKey = `global:${keyString}`
    if (this.shortcuts.has(globalKey)) {
      const shortcut = this.shortcuts.get(globalKey)
      if (shortcut.enabled) {
        event.preventDefault()
        shortcut.handler(event)
        return true
      }
    }

    return false
  }

  /**
   * Convert keyboard event to key string
   * @param {KeyboardEvent} event - Keyboard event
   * @returns {string} Key string representation
   */
  eventToKeyString(event) {
    const parts = []
    
    if (event.ctrlKey) parts.push('Ctrl')
    if (event.altKey) parts.push('Alt')
    if (event.shiftKey) parts.push('Shift')
    if (event.metaKey) parts.push('Meta')
    
    // Handle special keys
    const specialKeys = {
      ' ': 'Space',
      'ArrowUp': 'ArrowUp',
      'ArrowDown': 'ArrowDown',
      'ArrowLeft': 'ArrowLeft',
      'ArrowRight': 'ArrowRight',
      'Enter': 'Enter',
      'Escape': 'Escape',
      'Tab': 'Tab',
      'Backspace': 'Backspace',
      'Delete': 'Delete',
      'Home': 'Home',
      'End': 'End',
      'PageUp': 'PageUp',
      'PageDown': 'PageDown'
    }
    
    const key = specialKeys[event.key] || event.key
    parts.push(key)
    
    return parts.join('+')
  }

  /**
   * Get shortcuts for a specific context
   * @param {string} context - Context to get shortcuts for
   * @returns {Array} Array of shortcuts
   */
  getShortcutsForContext(context) {
    const shortcuts = []
    for (const [key, shortcut] of this.shortcuts) {
      if (shortcut.context === context) {
        shortcuts.push(shortcut)
      }
    }
    return shortcuts
  }

  /**
   * Get all available contexts
   * @returns {Array} Array of contexts
   */
  getContexts() {
    return Array.from(this.contexts)
  }

  /**
   * Generate help text for shortcuts
   * @param {string} context - Context to generate help for
   * @returns {string} Help text
   */
  generateHelpText(context = null) {
    const contextsToShow = context ? [context] : this.getContexts()
    let helpText = 'Raccourcis clavier disponibles:\n\n'
    
    for (const ctx of contextsToShow) {
      const shortcuts = this.getShortcutsForContext(ctx)
      if (shortcuts.length > 0) {
        helpText += `${ctx.toUpperCase()}:\n`
        for (const shortcut of shortcuts) {
          helpText += `  ${shortcut.key}: ${shortcut.description}\n`
        }
        helpText += '\n'
      }
    }
    
    return helpText
  }
}

/**
 * Default keyboard shortcuts manager instance
 */
export const keyboardShortcuts = new KeyboardShortcutsManager()

/**
 * Initialize default shortcuts for file viewer
 * @param {Object} handlers - Object containing handler functions
 */
export function initializeFileViewerShortcuts(handlers) {
  // Global shortcuts
  keyboardShortcuts.register('global', 'Escape', handlers.close, 'Fermer le visualiseur')
  keyboardShortcuts.register('global', 'Ctrl+S', handlers.save, 'Sauvegarder le fichier')
  keyboardShortcuts.register('global', 'Ctrl+D', handlers.download, 'Télécharger le fichier')
  keyboardShortcuts.register('global', 'Ctrl+R', handlers.retry, 'Réessayer le chargement')
  keyboardShortcuts.register('global', 'Tab', handlers.toggleMode, 'Basculer entre lecture/édition')
  keyboardShortcuts.register('global', 'F1', handlers.showHelp, 'Afficher l\'aide')
  keyboardShortcuts.register('global', 'F11', handlers.toggleFullscreen, 'Mode plein écran')

  // Navigation shortcuts
  keyboardShortcuts.register('global', 'ArrowLeft', handlers.previousFile, 'Fichier précédent')
  keyboardShortcuts.register('global', 'ArrowRight', handlers.nextFile, 'Fichier suivant')
  keyboardShortcuts.register('global', 'Home', handlers.firstFile, 'Premier fichier')
  keyboardShortcuts.register('global', 'End', handlers.lastFile, 'Dernier fichier')
}

/**
 * Utility function to format key combination for display
 * @param {string} keyString - Key string (e.g., "Ctrl+S")
 * @returns {string} Formatted key string
 */
export function formatKeyString(keyString) {
  return keyString
    .replace(/Ctrl/g, '⌃')
    .replace(/Alt/g, '⌥')
    .replace(/Shift/g, '⇧')
    .replace(/Meta/g, '⌘')
    .replace(/ArrowUp/g, '↑')
    .replace(/ArrowDown/g, '↓')
    .replace(/ArrowLeft/g, '←')
    .replace(/ArrowRight/g, '→')
    .replace(/Space/g, '␣')
}

/**
 * Check if a key combination is valid
 * @param {string} keyString - Key string to validate
 * @returns {boolean} True if valid
 */
export function isValidKeyString(keyString) {
  const validModifiers = ['Ctrl', 'Alt', 'Shift', 'Meta']
  const parts = keyString.split('+')
  
  if (parts.length === 0) return false
  
  // Last part should be the actual key
  const key = parts[parts.length - 1]
  if (!key || key.length === 0) return false
  
  // Check modifiers
  const modifiers = parts.slice(0, -1)
  for (const modifier of modifiers) {
    if (!validModifiers.includes(modifier)) return false
  }
  
  return true
}