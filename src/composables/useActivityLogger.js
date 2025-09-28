// composables/useActivityLogger.js
import { ref, onUnmounted } from 'vue'
import { activityAPI } from '@/services/activityAPI.js'

/**
 * Composable for automatic activity logging
 * Provides methods to log user activities and integrate with file operations
 */
export function useActivityLogger() {
  const isLogging = ref(false)
  const logQueue = ref([])
  const batchTimeout = ref(null)

  // Configuration
  const BATCH_SIZE = 5
  const BATCH_DELAY = 2000 // 2 seconds

  /**
   * Log a single activity
   * @param {string} action - Activity type
   * @param {string} resource - Resource affected
   * @param {Object} details - Additional details
   * @param {boolean} success - Whether the action was successful
   * @param {boolean} batch - Whether to batch this log entry
   */
  const logActivity = async (action, resource = null, details = null, success = true, batch = false) => {
    const activityData = {
      action,
      resource,
      details: {
        timestamp: new Date().toISOString(),
        user_agent: navigator.userAgent,
        url: window.location.pathname,
        ...details
      },
      success
    }

    if (batch) {
      // Add to batch queue
      logQueue.value.push(activityData)
      
      // Process batch if it reaches the size limit
      if (logQueue.value.length >= BATCH_SIZE) {
        await processBatch()
      } else {
        // Set timeout to process batch
        if (batchTimeout.value) {
          clearTimeout(batchTimeout.value)
        }
        batchTimeout.value = setTimeout(processBatch, BATCH_DELAY)
      }
    } else {
      // Log immediately
      try {
        isLogging.value = true
        await activityAPI.logActivity(activityData)
      } catch (error) {
        console.warn('Failed to log activity:', error)
        // Don't throw error to avoid disrupting user flow
      } finally {
        isLogging.value = false
      }
    }
  }

  /**
   * Process batched log entries
   */
  const processBatch = async () => {
    if (logQueue.value.length === 0) return

    const batch = [...logQueue.value]
    logQueue.value = []

    if (batchTimeout.value) {
      clearTimeout(batchTimeout.value)
      batchTimeout.value = null
    }

    try {
      isLogging.value = true
      
      // Log each activity in the batch
      await Promise.allSettled(
        batch.map(activity => activityAPI.logActivity(activity))
      )
    } catch (error) {
      console.warn('Failed to process activity batch:', error)
    } finally {
      isLogging.value = false
    }
  }

  /**
   * Log navigation activity
   * @param {string} path - Navigation path
   * @param {Object} details - Additional details
   */
  const logNavigation = async (path, details = {}) => {
    await logActivity('navigation', path, {
      page: path,
      referrer: document.referrer,
      ...details
    }, true, true) // Batch navigation logs
  }

  /**
   * Log file operation activity
   * @param {string} operation - File operation type
   * @param {string} filePath - File path
   * @param {Object} details - Additional details
   * @param {boolean} success - Whether operation was successful
   */
  const logFileOperation = async (operation, filePath, details = {}, success = true) => {
    const actionMap = {
      'browse': 'navigation',
      'download': 'file_download',
      'upload': 'file_upload',
      'delete': 'file_delete',
      'rename': 'file_rename',
      'move': 'file_move',
      'copy': 'file_copy',
      'create_folder': 'folder_create',
      'delete_folder': 'folder_delete'
    }

    const action = actionMap[operation] || operation
    
    await logActivity(action, filePath, {
      operation,
      file_path: filePath,
      ...details
    }, success)
  }

  /**
   * Log authentication activity
   * @param {string} type - Auth type (login, logout)
   * @param {Object} details - Additional details
   * @param {boolean} success - Whether auth was successful
   */
  const logAuth = async (type, details = {}, success = true) => {
    await logActivity(type, null, {
      auth_type: type,
      ...details
    }, success)
  }

  /**
   * Log favorite operation
   * @param {string} operation - Favorite operation (add, remove, navigate)
   * @param {string} path - Favorite path
   * @param {Object} details - Additional details
   */
  const logFavorite = async (operation, path, details = {}) => {
    const actionMap = {
      'add': 'favorite_add',
      'remove': 'favorite_remove',
      'navigate': 'navigation'
    }

    const action = actionMap[operation] || operation
    
    await logActivity(action, path, {
      favorite_operation: operation,
      favorite_path: path,
      ...details
    }, true, true) // Batch favorite operations
  }

  /**
   * Log error activity
   * @param {Error} error - Error object
   * @param {string} context - Error context
   * @param {Object} details - Additional details
   */
  const logError = async (error, context, details = {}) => {
    await logActivity('error', context, {
      error_message: error.message,
      error_stack: error.stack,
      error_context: context,
      ...details
    }, false)
  }

  /**
   * Flush any pending batched logs
   */
  const flushLogs = async () => {
    if (logQueue.value.length > 0) {
      await processBatch()
    }
  }

  // Cleanup on unmount
  onUnmounted(async () => {
    if (batchTimeout.value) {
      clearTimeout(batchTimeout.value)
    }
    await flushLogs()
  })

  // Flush logs when page is about to unload
  const handleBeforeUnload = () => {
    // Use sendBeacon for reliable logging on page unload
    if (logQueue.value.length > 0 && navigator.sendBeacon) {
      const batch = [...logQueue.value]
      logQueue.value = []
      
      // Send batch using sendBeacon (more reliable for page unload)
      const data = JSON.stringify({ activities: batch })
      const token = localStorage.getItem('token')
      
      if (token) {
        const blob = new Blob([data], { type: 'application/json' })
        navigator.sendBeacon('/api/activities/batch', blob)
      }
    }
  }

  // Add event listener for page unload
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', handleBeforeUnload)
    
    // Cleanup event listener on unmount
    onUnmounted(() => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    })
  }

  return {
    isLogging,
    logActivity,
    logNavigation,
    logFileOperation,
    logAuth,
    logFavorite,
    logError,
    flushLogs,
    processBatch
  }
}

/**
 * Activity logger singleton for global use
 */
let globalActivityLogger = null

export function useGlobalActivityLogger() {
  if (!globalActivityLogger) {
    globalActivityLogger = useActivityLogger()
  }
  return globalActivityLogger
}

/**
 * Activity types enum for consistency
 */
export const ActivityTypes = {
  LOGIN: 'login',
  LOGOUT: 'logout',
  NAVIGATION: 'navigation',
  FILE_DOWNLOAD: 'file_download',
  FILE_UPLOAD: 'file_upload',
  FILE_DELETE: 'file_delete',
  FILE_RENAME: 'file_rename',
  FILE_MOVE: 'file_move',
  FILE_COPY: 'file_copy',
  FOLDER_CREATE: 'folder_create',
  FOLDER_DELETE: 'folder_delete',
  FAVORITE_ADD: 'favorite_add',
  FAVORITE_REMOVE: 'favorite_remove',
  ERROR: 'error'
}