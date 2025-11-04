// composables/useFileSession.js
import { ref, computed, onUnmounted } from 'vue'
import { fileSessionAPI } from '@/services/api'
import { useStore } from 'vuex'

export function useFileSession() {
  const store = useStore()
  
  // State
  const sessionId = ref(null)
  const sessionInfo = ref(null)
  const isLoading = ref(false)
  const isSyncing = ref(false)
  const error = ref(null)
  const fileContent = ref(null)
  const hasUnsavedChanges = ref(false)
  const autoSyncInterval = ref(null)
  
  // Computed
  const isSessionActive = computed(() => !!sessionId.value)
  const isModified = computed(() => sessionInfo.value?.is_modified || false)
  const syncPending = computed(() => sessionInfo.value?.sync_pending || false)
  
  /**
   * Open a file and create a cache session
   */
  const openFile = async (filePath, mode = 'edit') => {
    isLoading.value = true
    error.value = null
    
    try {
      const response = await fileSessionAPI.openFile(filePath, mode)
      
      if (response.data.success) {
        sessionId.value = response.data.session_id
        sessionInfo.value = {
          session_id: response.data.session_id,
          file_name: response.data.file_name,
          file_size: response.data.file_size,
          created_at: response.data.created_at,
          mode: response.data.mode,
          lock_acquired: response.data.lock_acquired,
          lock_info: response.data.lock_info
        }
        
        // Load file content
        await loadContent()
        
        // Start auto-sync if in edit mode
        if (mode === 'edit' && response.data.lock_acquired) {
          startAutoSync()
        }
        
        store.dispatch('showSuccess', `Fichier ouvert: ${response.data.file_name}`)
        return { success: true, sessionId: sessionId.value }
      } else {
        // File is locked by another user
        error.value = response.data.error
        store.dispatch('showWarning', response.data.error)
        return { success: false, error: response.data.error, lockInfo: response.data.lock_info }
      }
    } catch (err) {
      error.value = err.response?.data?.error || err.message
      store.dispatch('showError', `Erreur lors de l'ouverture du fichier: ${error.value}`)
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }
  
  /**
   * Load file content from cache session
   */
  const loadContent = async () => {
    if (!sessionId.value) {
      error.value = 'No active session'
      return null
    }
    
    isLoading.value = true
    error.value = null
    
    try {
      const response = await fileSessionAPI.getFileContent(sessionId.value)
      
      // Convert blob to text or keep as blob depending on file type
      const blob = response.data
      fileContent.value = blob
      
      return blob
    } catch (err) {
      error.value = err.response?.data?.error || err.message
      store.dispatch('showError', `Erreur lors du chargement du contenu: ${error.value}`)
      return null
    } finally {
      isLoading.value = false
    }
  }
  
  /**
   * Update file content in cache session
   */
  const updateContent = async (content) => {
    if (!sessionId.value) {
      error.value = 'No active session'
      return false
    }
    
    error.value = null
    
    try {
      // Convert content to blob if it's a string
      let blob = content
      if (typeof content === 'string') {
        blob = new Blob([content], { type: 'text/plain' })
      }
      
      const response = await fileSessionAPI.updateFileContent(sessionId.value, blob)
      
      if (response.data.success) {
        hasUnsavedChanges.value = true
        
        // Update session info
        if (sessionInfo.value) {
          sessionInfo.value.is_modified = true
          sessionInfo.value.sync_pending = response.data.sync_pending
          sessionInfo.value.last_modified = response.data.last_modified
        }
        
        return true
      }
      
      return false
    } catch (err) {
      error.value = err.response?.data?.error || err.message
      store.dispatch('showError', `Erreur lors de la mise à jour: ${error.value}`)
      return false
    }
  }
  
  /**
   * Manually sync file to NAS
   */
  const syncToNas = async () => {
    if (!sessionId.value) {
      error.value = 'No active session'
      return false
    }
    
    isSyncing.value = true
    error.value = null
    
    try {
      const response = await fileSessionAPI.syncToNas(sessionId.value)
      
      if (response.data.success) {
        hasUnsavedChanges.value = false
        
        // Update session info
        if (sessionInfo.value) {
          sessionInfo.value.sync_pending = false
          sessionInfo.value.last_synced = response.data.synced_at
        }
        
        store.dispatch('showSuccess', 'Fichier synchronisé avec le NAS')
        return true
      }
      
      return false
    } catch (err) {
      error.value = err.response?.data?.error || err.message
      store.dispatch('showError', `Erreur lors de la synchronisation: ${error.value}`)
      return false
    } finally {
      isSyncing.value = false
    }
  }
  
  /**
   * Close file editing session
   */
  const closeSession = async (syncBeforeClose = true) => {
    if (!sessionId.value) {
      return true
    }
    
    // Stop auto-sync
    stopAutoSync()
    
    isLoading.value = true
    error.value = null
    
    try {
      const response = await fileSessionAPI.closeSession(sessionId.value, syncBeforeClose)
      
      if (response.data.success) {
        // Clear state
        sessionId.value = null
        sessionInfo.value = null
        fileContent.value = null
        hasUnsavedChanges.value = false
        
        store.dispatch('showSuccess', 'Session fermée')
        return true
      }
      
      return false
    } catch (err) {
      error.value = err.response?.data?.error || err.message
      store.dispatch('showError', `Erreur lors de la fermeture: ${error.value}`)
      return false
    } finally {
      isLoading.value = false
    }
  }
  
  /**
   * Get session information
   */
  const refreshSessionInfo = async () => {
    if (!sessionId.value) {
      return null
    }
    
    try {
      const response = await fileSessionAPI.getSessionInfo(sessionId.value)
      sessionInfo.value = response.data
      return response.data
    } catch (err) {
      error.value = err.response?.data?.error || err.message
      return null
    }
  }
  
  /**
   * Start auto-sync timer
   */
  const startAutoSync = (intervalSeconds = 30) => {
    stopAutoSync() // Clear any existing interval
    
    autoSyncInterval.value = setInterval(async () => {
      if (hasUnsavedChanges.value && !isSyncing.value) {
        await syncToNas()
      }
    }, intervalSeconds * 1000)
  }
  
  /**
   * Stop auto-sync timer
   */
  const stopAutoSync = () => {
    if (autoSyncInterval.value) {
      clearInterval(autoSyncInterval.value)
      autoSyncInterval.value = null
    }
  }
  
  /**
   * Save file (update content and sync)
   */
  const saveFile = async (content) => {
    const updated = await updateContent(content)
    if (updated) {
      return await syncToNas()
    }
    return false
  }
  
  // Cleanup on unmount
  onUnmounted(() => {
    stopAutoSync()
  })
  
  return {
    // State
    sessionId,
    sessionInfo,
    isLoading,
    isSyncing,
    error,
    fileContent,
    hasUnsavedChanges,
    
    // Computed
    isSessionActive,
    isModified,
    syncPending,
    
    // Methods
    openFile,
    loadContent,
    updateContent,
    syncToNas,
    closeSession,
    refreshSessionInfo,
    startAutoSync,
    stopAutoSync,
    saveFile
  }
}
