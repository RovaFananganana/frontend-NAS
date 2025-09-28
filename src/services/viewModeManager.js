/**
 * @fileoverview Service de gestion des modes d'affichage avec persistance
 */

import { ref, computed, watch } from 'vue'
import { VIEW_MODES, DEFAULT_VIEW_MODE_STATE } from '@/types/viewMode.js'

// Clé pour le localStorage
const STORAGE_KEY = 'nas-view-mode-preferences'
const TRANSITION_DURATION = 300 // ms

// État global partagé
let globalState = null
let subscribers = []

/**
 * Service de gestion des modes d'affichage
 */
class ViewModeManager {
  constructor() {
    if (globalState) {
      return this // Singleton pattern
    }

    // Initialiser l'état global
    this.state = ref(this.loadPreferences())
    globalState = this.state

    // Watcher pour la persistance automatique
    watch(
      () => this.state.value,
      (newState) => {
        this.savePreferences(newState)
        this.notifySubscribers(newState)
      },
      { deep: true }
    )

    // État de transition
    this.isTransitioning = ref(false)
    this.transitionPromise = null
  }

  /**
   * Charge les préférences depuis le localStorage
   * @returns {Object} État des préférences
   */
  loadPreferences() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        return {
          currentMode: this.validateMode(parsed.currentMode) || DEFAULT_VIEW_MODE_STATE.currentMode,
          sortColumn: parsed.sortColumn || DEFAULT_VIEW_MODE_STATE.sortColumn,
          sortDirection: parsed.sortDirection || DEFAULT_VIEW_MODE_STATE.sortDirection,
          selectedFiles: [], // Ne pas persister la sélection
          columnVisibility: {
            ...DEFAULT_VIEW_MODE_STATE.columnVisibility,
            ...parsed.columnVisibility
          },
          gridSize: parsed.gridSize || 'medium',
          treeExpanded: parsed.treeExpanded || true,
          lastUsedMode: parsed.lastUsedMode || DEFAULT_VIEW_MODE_STATE.currentMode
        }
      }
    } catch (error) {
      console.warn('Erreur lors du chargement des préférences de vue:', error)
    }

    return {
      ...DEFAULT_VIEW_MODE_STATE,
      gridSize: 'medium',
      treeExpanded: true,
      lastUsedMode: DEFAULT_VIEW_MODE_STATE.currentMode
    }
  }

  /**
   * Sauvegarde les préférences dans le localStorage
   * @param {Object} state - État à sauvegarder
   */
  savePreferences(state) {
    try {
      const toSave = {
        currentMode: state.currentMode,
        sortColumn: state.sortColumn,
        sortDirection: state.sortDirection,
        columnVisibility: state.columnVisibility,
        gridSize: state.gridSize,
        treeExpanded: state.treeExpanded,
        lastUsedMode: state.currentMode,
        timestamp: Date.now()
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave))
    } catch (error) {
      console.warn('Erreur lors de la sauvegarde des préférences de vue:', error)
    }
  }

  /**
   * Valide qu'un mode d'affichage est supporté
   * @param {string} mode - Mode à valider
   * @returns {string|null} Mode validé ou null
   */
  validateMode(mode) {
    return Object.values(VIEW_MODES).includes(mode) ? mode : null
  }

  /**
   * Change le mode d'affichage avec transition fluide
   * @param {string} newMode - Nouveau mode d'affichage
   * @returns {Promise} Promise de la transition
   */
  async setMode(newMode) {
    if (!this.validateMode(newMode)) {
      console.warn(`Mode d'affichage invalide: ${newMode}`)
      return Promise.reject(new Error(`Mode d'affichage invalide: ${newMode}`))
    }

    if (this.state.value.currentMode === newMode) {
      return Promise.resolve() // Pas de changement nécessaire
    }

    // Éviter les transitions multiples simultanées
    if (this.isTransitioning.value) {
      await this.transitionPromise
    }

    const oldMode = this.state.value.currentMode

    // Démarrer la transition
    this.isTransitioning.value = true
    this.transitionPromise = this.performTransition(oldMode, newMode)

    try {
      await this.transitionPromise
      return { oldMode, newMode }
    } finally {
      this.isTransitioning.value = false
      this.transitionPromise = null
    }
  }

  /**
   * Effectue la transition entre les modes
   * @param {string} oldMode - Ancien mode
   * @param {string} newMode - Nouveau mode
   * @returns {Promise} Promise de la transition
   */
  async performTransition(oldMode, newMode) {
    // Phase 1: Préparer la transition (fade out)
    await this.fadeOut()

    // Phase 2: Changer le mode
    this.state.value.currentMode = newMode
    this.state.value.lastUsedMode = oldMode

    // Phase 3: Attendre le rendu du nouveau composant
    await this.waitForNextTick()

    // Phase 4: Fade in du nouveau mode
    await this.fadeIn()

    // Émettre l'événement de changement
    this.emitModeChange(oldMode, newMode)
  }

  /**
   * Animation de fade out
   * @returns {Promise} Promise de l'animation
   */
  fadeOut() {
    return new Promise(resolve => {
      const container = document.querySelector('.file-explorer-content')
      if (container) {
        container.style.opacity = '0'
        container.style.transform = 'translateY(10px)'
        setTimeout(resolve, TRANSITION_DURATION / 2)
      } else {
        resolve()
      }
    })
  }

  /**
   * Animation de fade in
   * @returns {Promise} Promise de l'animation
   */
  fadeIn() {
    return new Promise(resolve => {
      const container = document.querySelector('.file-explorer-content')
      if (container) {
        // Forcer le reflow
        container.offsetHeight
        
        container.style.transition = `opacity ${TRANSITION_DURATION / 2}ms ease, transform ${TRANSITION_DURATION / 2}ms ease`
        container.style.opacity = '1'
        container.style.transform = 'translateY(0)'
        
        setTimeout(() => {
          container.style.transition = ''
          resolve()
        }, TRANSITION_DURATION / 2)
      } else {
        resolve()
      }
    })
  }

  /**
   * Attendre le prochain tick de Vue
   * @returns {Promise} Promise du prochain tick
   */
  waitForNextTick() {
    return new Promise(resolve => {
      if (typeof window !== 'undefined' && window.requestAnimationFrame) {
        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(resolve)
        })
      } else {
        setTimeout(resolve, 16) // ~60fps fallback
      }
    })
  }

  /**
   * Émet l'événement de changement de mode
   * @param {string} oldMode - Ancien mode
   * @param {string} newMode - Nouveau mode
   */
  emitModeChange(oldMode, newMode) {
    const event = new CustomEvent('viewModeChanged', {
      detail: {
        oldMode,
        newMode,
        timestamp: Date.now()
      }
    })
    
    if (typeof window !== 'undefined') {
      window.dispatchEvent(event)
    }
  }

  /**
   * Abonne un callback aux changements d'état
   * @param {Function} callback - Fonction de callback
   * @returns {Function} Fonction de désabonnement
   */
  subscribe(callback) {
    subscribers.push(callback)
    
    // Retourner la fonction de désabonnement
    return () => {
      const index = subscribers.indexOf(callback)
      if (index > -1) {
        subscribers.splice(index, 1)
      }
    }
  }

  /**
   * Notifie tous les abonnés des changements
   * @param {Object} newState - Nouvel état
   */
  notifySubscribers(newState) {
    subscribers.forEach(callback => {
      try {
        callback(newState)
      } catch (error) {
        console.error('Erreur dans le callback de ViewModeManager:', error)
      }
    })
  }

  /**
   * Restaure le dernier mode utilisé
   * @returns {Promise} Promise de la restauration
   */
  async restoreLastMode() {
    const lastMode = this.state.value.lastUsedMode
    if (lastMode && lastMode !== this.state.value.currentMode) {
      return this.setMode(lastMode)
    }
    return Promise.resolve()
  }

  /**
   * Réinitialise les préférences aux valeurs par défaut
   */
  resetToDefaults() {
    this.state.value = {
      ...DEFAULT_VIEW_MODE_STATE,
      gridSize: 'medium',
      treeExpanded: true,
      lastUsedMode: DEFAULT_VIEW_MODE_STATE.currentMode
    }
  }

  /**
   * Exporte les préférences actuelles
   * @returns {Object} Préférences exportées
   */
  exportPreferences() {
    return {
      ...this.state.value,
      exportedAt: new Date().toISOString()
    }
  }

  /**
   * Importe des préférences
   * @param {Object} preferences - Préférences à importer
   * @returns {boolean} Succès de l'importation
   */
  importPreferences(preferences) {
    try {
      if (!preferences || typeof preferences !== 'object') {
        throw new Error('Préférences invalides')
      }

      const validatedMode = this.validateMode(preferences.currentMode)
      if (!validatedMode) {
        throw new Error('Mode d\'affichage invalide dans les préférences')
      }

      this.state.value = {
        ...DEFAULT_VIEW_MODE_STATE,
        ...preferences,
        currentMode: validatedMode,
        selectedFiles: [] // Ne pas importer la sélection
      }

      return true
    } catch (error) {
      console.error('Erreur lors de l\'importation des préférences:', error)
      return false
    }
  }

  // Getters computed
  get currentMode() {
    return computed(() => this.state.value.currentMode)
  }

  get sortColumn() {
    return computed(() => this.state.value.sortColumn)
  }

  get sortDirection() {
    return computed(() => this.state.value.sortDirection)
  }

  get selectedFiles() {
    return computed({
      get: () => this.state.value.selectedFiles,
      set: (value) => {
        this.state.value.selectedFiles = value
      }
    })
  }

  get columnVisibility() {
    return computed(() => this.state.value.columnVisibility)
  }

  get gridSize() {
    return computed({
      get: () => this.state.value.gridSize,
      set: (value) => {
        this.state.value.gridSize = value
      }
    })
  }

  get treeExpanded() {
    return computed({
      get: () => this.state.value.treeExpanded,
      set: (value) => {
        this.state.value.treeExpanded = value
      }
    })
  }

  get isTransitioningMode() {
    return computed(() => this.isTransitioning.value)
  }
}

// Instance singleton
let instance = null

/**
 * Factory function pour obtenir l'instance du ViewModeManager
 * @returns {ViewModeManager} Instance du manager
 */
export function createViewModeManager() {
  if (!instance) {
    instance = new ViewModeManager()
  }
  return instance
}

/**
 * Hook composable pour utiliser le ViewModeManager
 * @returns {ViewModeManager} Instance du manager
 */
export function useViewModeManager() {
  return createViewModeManager()
}

// Export par défaut
export default ViewModeManager