/**
 * Enhanced Feedback Messages for Favorites Navigation
 * Provides contextual, user-friendly messages with better UX
 */

/**
 * Message categories for different types of feedback
 */
export const MESSAGE_CATEGORIES = {
  NAVIGATION: 'navigation',
  FAVORITES: 'favorites',
  PERMISSIONS: 'permissions',
  VALIDATION: 'validation',
  SYSTEM: 'system'
}

/**
 * Message types with corresponding icons and styles
 */
export const MESSAGE_TYPES = {
  SUCCESS: {
    type: 'success',
    icon: 'fas fa-check-circle',
    duration: 3000,
    sound: 'success'
  },
  INFO: {
    type: 'info',
    icon: 'fas fa-info-circle',
    duration: 4000,
    sound: 'info'
  },
  WARNING: {
    type: 'warning',
    icon: 'fas fa-exclamation-triangle',
    duration: 5000,
    sound: 'warning'
  },
  ERROR: {
    type: 'error',
    icon: 'fas fa-times-circle',
    duration: 6000,
    sound: 'error'
  }
}

/**
 * Enhanced feedback messages for favorites navigation
 */
export const FEEDBACK_MESSAGES = {
  // Navigation Success Messages
  NAVIGATION_SUCCESS: {
    category: MESSAGE_CATEGORIES.NAVIGATION,
    type: MESSAGE_TYPES.SUCCESS,
    template: (folderName) => ({
      title: 'Navigation réussie',
      message: `Vous êtes maintenant dans "${folderName}"`,
      icon: 'fas fa-folder-open',
      actions: [
        {
          label: 'Ajouter aux favoris',
          action: 'add-to-favorites',
          icon: 'fas fa-star'
        }
      ]
    })
  },

  FAVORITE_NAVIGATION_SUCCESS: {
    category: MESSAGE_CATEGORIES.FAVORITES,
    type: MESSAGE_TYPES.SUCCESS,
    template: (favoriteName) => ({
      title: 'Favori ouvert',
      message: `Navigation vers "${favoriteName}" réussie`,
      icon: 'fas fa-star',
      actions: [
        {
          label: 'Historique',
          action: 'show-history',
          icon: 'fas fa-history'
        }
      ]
    })
  },

  // Favorites Management Messages
  FAVORITE_ADDED: {
    category: MESSAGE_CATEGORIES.FAVORITES,
    type: MESSAGE_TYPES.SUCCESS,
    template: (folderName) => ({
      title: 'Favori ajouté',
      message: `"${folderName}" a été ajouté à vos favoris`,
      icon: 'fas fa-star',
      actions: [
        {
          label: 'Voir les favoris',
          action: 'show-favorites',
          icon: 'fas fa-list'
        }
      ]
    })
  },

  FAVORITE_REMOVED: {
    category: MESSAGE_CATEGORIES.FAVORITES,
    type: MESSAGE_TYPES.INFO,
    template: (folderName) => ({
      title: 'Favori supprimé',
      message: `"${folderName}" a été retiré de vos favoris`,
      icon: 'fas fa-star-o',
      actions: [
        {
          label: 'Annuler',
          action: 'undo-remove-favorite',
          icon: 'fas fa-undo'
        }
      ]
    })
  },

  FAVORITES_VALIDATED: {
    category: MESSAGE_CATEGORIES.FAVORITES,
    type: MESSAGE_TYPES.INFO,
    template: (stats) => ({
      title: 'Validation terminée',
      message: `${stats.valid} valide(s), ${stats.invalid} invalide(s), ${stats.inaccessible} inaccessible(s)`,
      icon: 'fas fa-check-double',
      progress: stats.valid / stats.total * 100
    })
  },

  // Permission Error Messages
  PERMISSION_DENIED: {
    category: MESSAGE_CATEGORIES.PERMISSIONS,
    type: MESSAGE_TYPES.ERROR,
    template: (folderName, details) => ({
      title: 'Accès refusé',
      message: `Vous n'avez pas les permissions pour accéder à "${folderName}"`,
      icon: 'fas fa-lock',
      details: details || 'Contactez votre administrateur pour obtenir l\'accès',
      actions: [
        {
          label: 'Réessayer',
          action: 'retry-access',
          icon: 'fas fa-redo'
        },
        {
          label: 'Contacter l\'admin',
          action: 'contact-admin',
          icon: 'fas fa-envelope'
        }
      ]
    })
  },

  FOLDER_NOT_FOUND: {
    category: MESSAGE_CATEGORIES.VALIDATION,
    type: MESSAGE_TYPES.ERROR,
    template: (folderName) => ({
      title: 'Dossier introuvable',
      message: `Le dossier "${folderName}" n'existe plus ou a été déplacé`,
      icon: 'fas fa-folder-minus',
      actions: [
        {
          label: 'Supprimer du favori',
          action: 'remove-invalid-favorite',
          icon: 'fas fa-trash'
        },
        {
          label: 'Rechercher',
          action: 'search-folder',
          icon: 'fas fa-search'
        }
      ]
    })
  },

  // System Messages
  NETWORK_ERROR: {
    category: MESSAGE_CATEGORIES.SYSTEM,
    type: MESSAGE_TYPES.ERROR,
    template: (action) => ({
      title: 'Erreur de connexion',
      message: `Impossible de ${action}. Vérifiez votre connexion réseau`,
      icon: 'fas fa-wifi',
      actions: [
        {
          label: 'Réessayer',
          action: 'retry-operation',
          icon: 'fas fa-redo'
        },
        {
          label: 'Mode hors ligne',
          action: 'enable-offline-mode',
          icon: 'fas fa-cloud-download-alt'
        }
      ]
    })
  },

  LOADING_TIMEOUT: {
    category: MESSAGE_CATEGORIES.SYSTEM,
    type: MESSAGE_TYPES.WARNING,
    template: (timeout) => ({
      title: 'Chargement lent',
      message: `L'opération prend plus de temps que prévu (${timeout}s)`,
      icon: 'fas fa-clock',
      actions: [
        {
          label: 'Continuer d\'attendre',
          action: 'continue-waiting',
          icon: 'fas fa-hourglass-half'
        },
        {
          label: 'Annuler',
          action: 'cancel-operation',
          icon: 'fas fa-times'
        }
      ]
    })
  },

  // Keyboard Shortcuts Messages
  SHORTCUT_HINT: {
    category: MESSAGE_CATEGORIES.NAVIGATION,
    type: MESSAGE_TYPES.INFO,
    template: (shortcut, action) => ({
      title: 'Raccourci disponible',
      message: `Utilisez ${shortcut} pour ${action}`,
      icon: 'fas fa-keyboard',
      duration: 2000
    })
  },

  SHORTCUTS_ENABLED: {
    category: MESSAGE_CATEGORIES.SYSTEM,
    type: MESSAGE_TYPES.SUCCESS,
    template: () => ({
      title: 'Raccourcis activés',
      message: 'Les raccourcis clavier sont maintenant actifs pour les favoris',
      icon: 'fas fa-keyboard',
      actions: [
        {
          label: 'Voir la liste',
          action: 'show-shortcuts-help',
          icon: 'fas fa-question-circle'
        }
      ]
    })
  }
}

/**
 * Context-aware message generator
 */
export class FeedbackMessageGenerator {
  constructor(store) {
    this.store = store
    this.messageHistory = []
    this.suppressedMessages = new Set()
    this.lastMessageTime = new Map()
  }

  /**
   * Generate a contextual message
   * @param {string} messageKey - Key from FEEDBACK_MESSAGES
   * @param {*} data - Data to populate the message template
   * @param {Object} options - Additional options
   * @returns {Object} Generated message
   */
  generate(messageKey, data = null, options = {}) {
    const messageConfig = FEEDBACK_MESSAGES[messageKey]
    if (!messageConfig) {
      console.warn(`Unknown message key: ${messageKey}`)
      return null
    }

    // Check if message should be suppressed (rate limiting)
    if (this.shouldSuppressMessage(messageKey, options)) {
      return null
    }

    // Generate message from template
    const message = typeof messageConfig.template === 'function'
      ? messageConfig.template(data)
      : { ...messageConfig.template }

    // Merge with message type defaults
    const fullMessage = {
      ...messageConfig.type,
      ...message,
      category: messageConfig.category,
      timestamp: Date.now(),
      id: this.generateMessageId(),
      ...options
    }

    // Add to history
    this.addToHistory(fullMessage)

    // Update last message time for rate limiting
    this.lastMessageTime.set(messageKey, Date.now())

    return fullMessage
  }

  /**
   * Show a message using the store
   * @param {string} messageKey - Message key
   * @param {*} data - Message data
   * @param {Object} options - Additional options
   */
  show(messageKey, data = null, options = {}) {
    const message = this.generate(messageKey, data, options)
    if (!message) return

    // Dispatch to store based on message type
    const storeAction = `show${message.type.charAt(0).toUpperCase() + message.type.slice(1)}`
    
    if (this.store && typeof this.store.dispatch === 'function') {
      this.store.dispatch(storeAction, message.message, {
        title: message.title,
        icon: message.icon,
        duration: message.duration,
        actions: message.actions
      })
    }

    return message
  }

  /**
   * Check if a message should be suppressed
   * @param {string} messageKey - Message key
   * @param {Object} options - Message options
   * @returns {boolean} True if message should be suppressed
   */
  shouldSuppressMessage(messageKey, options = {}) {
    const { rateLimitMs = 1000, suppressDuplicates = true } = options

    // Check if explicitly suppressed
    if (this.suppressedMessages.has(messageKey)) {
      return true
    }

    // Check rate limiting
    const lastTime = this.lastMessageTime.get(messageKey)
    if (lastTime && Date.now() - lastTime < rateLimitMs) {
      return true
    }

    // Check for duplicate suppression
    if (suppressDuplicates) {
      const recentMessages = this.messageHistory
        .filter(msg => msg.timestamp > Date.now() - 5000) // Last 5 seconds
        .filter(msg => msg.category === FEEDBACK_MESSAGES[messageKey]?.category)
      
      if (recentMessages.length > 2) {
        return true
      }
    }

    return false
  }

  /**
   * Suppress a message type temporarily
   * @param {string} messageKey - Message key to suppress
   * @param {number} duration - Duration in milliseconds
   */
  suppressMessage(messageKey, duration = 5000) {
    this.suppressedMessages.add(messageKey)
    setTimeout(() => {
      this.suppressedMessages.delete(messageKey)
    }, duration)
  }

  /**
   * Add message to history
   * @param {Object} message - Message to add
   */
  addToHistory(message) {
    this.messageHistory.push(message)
    
    // Keep only last 50 messages
    if (this.messageHistory.length > 50) {
      this.messageHistory = this.messageHistory.slice(-50)
    }
  }

  /**
   * Generate unique message ID
   * @returns {string} Unique ID
   */
  generateMessageId() {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Get message history for a category
   * @param {string} category - Message category
   * @returns {Array} Messages in category
   */
  getHistoryByCategory(category) {
    return this.messageHistory.filter(msg => msg.category === category)
  }

  /**
   * Clear message history
   */
  clearHistory() {
    this.messageHistory = []
    this.lastMessageTime.clear()
  }
}

/**
 * Keyboard shortcut descriptions for favorites
 */
export const FAVORITES_SHORTCUTS = {
  'Enter': 'Ouvrir le favori sélectionné',
  'F2': 'Renommer le favori',
  'Delete': 'Supprimer le favori',
  'Ctrl+Up': 'Monter dans la liste des favoris',
  'Ctrl+Down': 'Descendre dans la liste des favoris',
  'Ctrl+Home': 'Aller au premier favori',
  'Ctrl+End': 'Aller au dernier favori',
  'Ctrl+F': 'Rechercher dans les favoris',
  'Ctrl+A': 'Sélectionner tous les favoris',
  'Ctrl+R': 'Actualiser les favoris',
  'Ctrl+V': 'Valider tous les favoris',
  'Esc': 'Désélectionner ou fermer'
}

/**
 * Accessibility announcements for screen readers
 */
export const ACCESSIBILITY_ANNOUNCEMENTS = {
  FAVORITE_SELECTED: (name) => `Favori "${name}" sélectionné`,
  FAVORITE_OPENED: (name) => `Navigation vers le favori "${name}" en cours`,
  FAVORITE_ADDED: (name) => `"${name}" ajouté aux favoris`,
  FAVORITE_REMOVED: (name) => `"${name}" supprimé des favoris`,
  FAVORITES_LOADED: (count) => `${count} favoris chargés`,
  NAVIGATION_COMPLETE: (path) => `Navigation terminée vers ${path}`,
  ERROR_OCCURRED: (error) => `Erreur : ${error}`,
  SHORTCUT_ACTIVATED: (shortcut, action) => `Raccourci ${shortcut} activé : ${action}`
}

/**
 * Create feedback message generator instance
 * @param {Object} store - Vuex store instance
 * @returns {FeedbackMessageGenerator} Message generator
 */
export function createFeedbackGenerator(store) {
  return new FeedbackMessageGenerator(store)
}

export default {
  MESSAGE_CATEGORIES,
  MESSAGE_TYPES,
  FEEDBACK_MESSAGES,
  FeedbackMessageGenerator,
  FAVORITES_SHORTCUTS,
  ACCESSIBILITY_ANNOUNCEMENTS,
  createFeedbackGenerator
}