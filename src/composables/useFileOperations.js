/**
 * Composable for managing file copy/cut/paste operations
 * Provides state management, persistence, and visual indicators for file operations
 */

import { ref, computed, watch } from 'vue'
import { nasAPI } from '@/services/nasAPI.js'
import { useToast } from '@/services/useToast.js'

// Global state for file operations (shared across components)
const operationState = ref({
  operation: null, // 'copy' | 'cut' | null
  items: [], // Array of file/folder items
  timestamp: null, // When the operation was initiated
  sourceFolder: null // Source folder path
})

// Storage key for persistence
const STORAGE_KEY = 'nas-file-operations-state'

/**
 * Load state from localStorage
 */
function loadPersistedState() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      // Only restore if timestamp is less than 1 hour old
      const oneHour = 60 * 60 * 1000
      if (parsed.timestamp && (Date.now() - parsed.timestamp) < oneHour) {
        operationState.value = parsed
      }
    }
  } catch (error) {
    console.warn('Failed to load persisted file operations state:', error)
  }
}

/**
 * Save state to localStorage
 */
function saveStateToStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(operationState.value))
  } catch (error) {
    console.warn('Failed to save file operations state:', error)
  }
}

/**
 * Clear persisted state
 */
function clearPersistedState() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.warn('Failed to clear persisted file operations state:', error)
  }
}

// Load initial state
loadPersistedState()

// Watch for state changes and persist them
watch(operationState, saveStateToStorage, { deep: true })

export function useFileOperations() {
  const toast = useToast()

  // Computed properties for easy access
  const hasOperation = computed(() => operationState.value.operation !== null)
  const isCopyOperation = computed(() => operationState.value.operation === 'copy')
  const isCutOperation = computed(() => operationState.value.operation === 'cut')
  const operationItems = computed(() => operationState.value.items)
  const operationCount = computed(() => operationState.value.items.length)
  const sourceFolder = computed(() => operationState.value.sourceFolder)

  /**
   * Copy items to clipboard
   * @param {Array} items - Array of file/folder items to copy
   * @param {string} currentPath - Current folder path
   */
  function copy(items, currentPath) {
    if (!items || items.length === 0) {
      toast.error('Aucun élément sélectionné pour la copie')
      return
    }

    operationState.value = {
      operation: 'copy',
      items: Array.isArray(items) ? [...items] : [items],
      timestamp: Date.now(),
      sourceFolder: currentPath
    }

    const count = operationState.value.items.length
    toast.success(`${count} élément(s) copié(s) dans le presse-papiers`)
  }

  /**
   * Cut items to clipboard
   * @param {Array} items - Array of file/folder items to cut
   * @param {string} currentPath - Current folder path
   */
  function cut(items, currentPath) {
    if (!items || items.length === 0) {
      toast.error('Aucun élément sélectionné pour la coupe')
      return
    }

    operationState.value = {
      operation: 'cut',
      items: Array.isArray(items) ? [...items] : [items],
      timestamp: Date.now(),
      sourceFolder: currentPath
    }

    const count = operationState.value.items.length
    toast.success(`${count} élément(s) coupé(s) dans le presse-papiers`)
  }

  /**
   * Paste items from clipboard to destination
   * @param {string} destinationPath - Destination folder path
   * @returns {Promise<Object>} - Result of paste operation
   */
  async function paste(destinationPath) {
    if (!hasOperation.value) {
      toast.error('Aucune opération en attente')
      return { success: false, error: 'No operation pending' }
    }

    const { operation, items, sourceFolder } = operationState.value
    const results = []
    let successCount = 0
    let errorCount = 0

    // Validate destination path
    if (!destinationPath) {
      toast.error('Chemin de destination invalide')
      return { success: false, error: 'Invalid destination path' }
    }

    // Check if trying to paste into the same folder for cut operations
    if (operation === 'cut' && destinationPath === sourceFolder) {
      toast.error('Impossible de déplacer dans le même dossier')
      return { success: false, error: 'Cannot move to same folder' }
    }

    try {
      for (const item of items) {
        try {
          let result
          const itemPath = item.path || item.full_path || item.name
          const itemName = item.name || itemPath.split('/').pop()
          
          // Check for self-paste (trying to paste a folder into itself)
          if (item.is_directory && destinationPath.startsWith(itemPath)) {
            console.warn(`Skipping self-paste for directory: ${itemName}`)
            results.push({ 
              item, 
              success: false, 
              error: 'Impossible de coller un dossier dans lui-même' 
            })
            errorCount++
            continue
          }
          
          if (operation === 'copy') {
            // For copy operation, use the copy API
            result = await nasAPI.copyItem(itemPath, destinationPath)
          } else if (operation === 'cut') {
            // For cut operation, use the move API
            result = await nasAPI.moveItem(itemPath, destinationPath)
          }

          if (result && result.success) {
            results.push({ item, success: true, result })
            successCount++
          } else {
            const errorMsg = result?.error || 'Opération échouée'
            results.push({ item, success: false, error: errorMsg })
            errorCount++
          }
        } catch (error) {
          console.error(`Failed to ${operation} item:`, item, error)
          
          // Handle specific error types
          let errorMessage = error.message
          if (error.status === 403) {
            errorMessage = 'Permissions insuffisantes'
          } else if (error.status === 409) {
            errorMessage = 'Un élément avec ce nom existe déjà'
          } else if (error.status === 404) {
            errorMessage = 'Élément source introuvable'
          } else if (error.message.includes('exists')) {
            errorMessage = 'Un élément avec ce nom existe déjà'
          } else if (error.message.includes('permission')) {
            errorMessage = 'Permissions insuffisantes'
          }
          
          results.push({ item, success: false, error: errorMessage })
          errorCount++
        }
      }

      // Show detailed results to user
      if (successCount > 0) {
        const operationText = operation === 'copy' ? 'copié(s)' : 'déplacé(s)'
        toast.success(`${successCount} élément(s) ${operationText} avec succès`)
      }

      if (errorCount > 0) {
        const operationText = operation === 'copy' ? 'copiés' : 'déplacés'
        
        // Show specific error messages for failed items
        const failedItems = results.filter(r => !r.success)
        if (failedItems.length === 1) {
          toast.error(`Impossible de ${operation === 'copy' ? 'copier' : 'déplacer'} "${failedItems[0].item.name}": ${failedItems[0].error}`)
        } else {
          toast.error(`${errorCount} élément(s) n'ont pas pu être ${operationText}`)
          
          // Log detailed errors for debugging
          failedItems.forEach(failed => {
            console.error(`Failed to ${operation} "${failed.item.name}":`, failed.error)
          })
        }
      }

      // Clear operation state after paste (regardless of success/failure)
      clear()

      return {
        success: successCount > 0,
        results,
        successCount,
        errorCount,
        operation,
        destinationPath
      }
    } catch (error) {
      console.error('Paste operation failed:', error)
      toast.error(`Erreur lors du collage: ${error.message}`)
      return { success: false, error: error.message }
    }
  }

  /**
   * Clear current operation state
   */
  function clear() {
    operationState.value = {
      operation: null,
      items: [],
      timestamp: null,
      sourceFolder: null
    }
    clearPersistedState()
  }

  /**
   * Check if a specific item is in the current operation
   * @param {Object|string} item - Item to check (object with path or string path)
   * @returns {boolean}
   */
  function isItemInOperation(item) {
    if (!hasOperation.value) return false
    
    const itemPath = typeof item === 'string' ? item : (item.path || item.full_path || item.name)
    return operationState.value.items.some(opItem => {
      const opItemPath = opItem.path || opItem.full_path || opItem.name
      return opItemPath === itemPath
    })
  }

  /**
   * Get visual indicator class for an item
   * @param {Object|string} item - Item to get indicator for
   * @returns {string} - CSS class name
   */
  function getItemIndicatorClass(item) {
    if (!isItemInOperation(item)) return ''
    
    return isCopyOperation.value ? 'file-operation-copy' : 'file-operation-cut'
  }

  /**
   * Get operation description for UI display
   * @returns {string}
   */
  function getOperationDescription() {
    if (!hasOperation.value) return ''
    
    const count = operationCount.value
    const operation = isCopyOperation.value ? 'copié' : 'coupé'
    const plural = count > 1 ? 's' : ''
    
    return `${count} élément${plural} ${operation}${plural}`
  }

  /**
   * Check if paste is available for current destination
   * @param {string} destinationPath - Destination path to check
   * @returns {boolean}
   */
  function canPasteToDestination(destinationPath) {
    if (!hasOperation.value) return false
    
    // Don't allow pasting to the same folder for cut operations
    if (isCutOperation.value && destinationPath === sourceFolder.value) {
      return false
    }
    
    // Don't allow pasting items into themselves
    return !operationState.value.items.some(item => {
      const itemPath = item.path || item.full_path || item.name
      return destinationPath.startsWith(itemPath)
    })
  }

  /**
   * Get time since operation was initiated
   * @returns {string}
   */
  function getOperationAge() {
    if (!operationState.value.timestamp) return ''
    
    const ageMs = Date.now() - operationState.value.timestamp
    const ageMinutes = Math.floor(ageMs / (1000 * 60))
    
    if (ageMinutes < 1) return 'à l\'instant'
    if (ageMinutes === 1) return 'il y a 1 minute'
    if (ageMinutes < 60) return `il y a ${ageMinutes} minutes`
    
    const ageHours = Math.floor(ageMinutes / 60)
    if (ageHours === 1) return 'il y a 1 heure'
    return `il y a ${ageHours} heures`
  }

  return {
    // State
    hasOperation,
    isCopyOperation,
    isCutOperation,
    operationItems,
    operationCount,
    sourceFolder,
    
    // Actions
    copy,
    cut,
    paste,
    clear,
    
    // Utilities
    isItemInOperation,
    getItemIndicatorClass,
    getOperationDescription,
    canPasteToDestination,
    getOperationAge
  }
}