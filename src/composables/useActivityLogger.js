// composables/useActivityLogger.js

import { ref, computed } from 'vue'
import { useStore } from 'vuex'
import { nasAPI } from '@/services/nasAPI'

/**
 * Composable pour logger les activités des utilisateurs sur les fichiers et dossiers
 * Fournit un logging détaillé pour toutes les opérations de fichiers
 */
export function useActivityLogger() {
  let store = null
  
  // Try to get store, but don't fail if not available
  try {
    store = useStore()
  } catch (error) {
    console.warn('Store not available in useActivityLogger:', error)
  }
  
  // Logs d'activité locaux
  const activityLogs = ref([])
  const maxLocalLogs = 200 // Garder les 200 dernières activités
  
  // User info from store (with safe access)
  const user = computed(() => {
    try {
      return store?.state?.user || null
    } catch (error) {
      return null
    }
  })
  
  /**
   * Logger une activité avec contexte détaillé
   */
  const logActivity = (operation, context) => {
    const logEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      operation,
      user_id: user.value?.id,
      username: user.value?.username,
      ...context
    }
    
    // Ajouter aux logs locaux
    activityLogs.value.unshift(logEntry)
    if (activityLogs.value.length > maxLocalLogs) {
      activityLogs.value = activityLogs.value.slice(0, maxLocalLogs)
    }
    
    // Console logging pour développement
    if (import.meta.env.DEV) {
      console.log(`📁 [ACTIVITY] ${operation}:`, context)
    }
    
    // Envoyer au backend pour sauvegarde persistante
    sendActivityToBackend(operation, context)
  }
  
  /**
   * Envoyer l'activité au backend
   */
  const sendActivityToBackend = async (operation, context) => {
    try {
      // Import dynamique pour éviter les problèmes de dépendances circulaires
      const { default: TokenService } = await import('@/services/tokenService')
      const { userAPI } = await import('@/services/api')
      
      // Ne pas envoyer si pas de token (utilisateur non connecté)
      if (!TokenService.hasToken()) {
        return
      }
      
      // Map frontend operations to backend actions
      const actionMapping = {
        'FOLDER_OPEN': 'ACCESS_FOLDER',
        'FILE_READ': 'ACCESS_FILE',
        'FILE_DOWNLOAD': 'DOWNLOAD_FILE',
        'FILE_UPLOAD': 'UPLOAD_FILE',
        'FILE_DELETE': 'DELETE_FILE',
        'FOLDER_DELETE': 'DELETE_FOLDER',
        'FILE_COPY': 'COPY_FILE',
        'FOLDER_COPY': 'COPY_FOLDER',
        'FILE_MOVE': 'MOVE_FILE',
        'FOLDER_MOVE': 'MOVE_FOLDER',
        'FILE_RENAME': 'RENAME_FILE',
        'FOLDER_RENAME': 'RENAME_FOLDER',
        'FILE_CREATE': 'CREATE_FILE',
        'FOLDER_CREATE': 'CREATE_FOLDER'
      }
      
      const action = actionMapping[operation] || operation
      const target = context.path || context.source_path || 'unknown'
      
      // Utiliser l'API existante pour éviter les problèmes CORS
      await userAPI.logActivity({
        action: action,
        target: target,
        details: JSON.stringify(context)
      })
      
    } catch (error) {
      console.warn('Error sending activity log to backend:', error)
    }
  }

  /**
   * Logger l'ouverture d'un dossier
   */
  const logFolderOpen = (folderPath, timing = {}) => {
    logActivity('FOLDER_OPEN', {
      path: folderPath,
      type: 'folder',
      action: 'open',
      timing: {
        duration_ms: timing.duration_ms || 0,
        ...timing
      }
    })
  }

  /**
   * Logger la lecture d'un fichier
   */
  const logFileRead = (filePath, fileInfo = {}, timing = {}) => {
    logActivity('FILE_READ', {
      path: filePath,
      type: 'file',
      action: 'read',
      file_info: {
        size: fileInfo.size,
        extension: filePath.split('.').pop()?.toLowerCase(),
        mime_type: fileInfo.mime_type,
        ...fileInfo
      },
      timing: {
        duration_ms: timing.duration_ms || 0,
        ...timing
      }
    })
  }

  /**
   * Logger le téléchargement d'un fichier
   */
  const logFileDownload = (filePath, fileInfo = {}, timing = {}) => {
    logActivity('FILE_DOWNLOAD', {
      path: filePath,
      type: 'file',
      action: 'download',
      file_info: {
        size: fileInfo.size,
        size_human: formatFileSize(fileInfo.size),
        extension: filePath.split('.').pop()?.toLowerCase(),
        mime_type: fileInfo.mime_type,
        ...fileInfo
      },
      timing: {
        duration_ms: timing.duration_ms || 0,
        download_speed_mbps: timing.download_speed_mbps,
        ...timing
      }
    })
  }

  /**
   * Logger l'upload d'un fichier
   */
  const logFileUpload = (filePath, fileInfo = {}, timing = {}) => {
    logActivity('FILE_UPLOAD', {
      path: filePath,
      type: 'file',
      action: 'upload',
      file_info: {
        size: fileInfo.size,
        size_human: formatFileSize(fileInfo.size),
        extension: filePath.split('.').pop()?.toLowerCase(),
        mime_type: fileInfo.mime_type,
        overwrite: fileInfo.overwrite || false,
        ...fileInfo
      },
      timing: {
        duration_ms: timing.duration_ms || 0,
        upload_speed_mbps: timing.upload_speed_mbps,
        ...timing
      }
    })
  }

  /**
   * Logger la suppression d'un fichier ou dossier
   */
  const logDelete = (path, isFolder = false, timing = {}) => {
    logActivity(isFolder ? 'FOLDER_DELETE' : 'FILE_DELETE', {
      path,
      type: isFolder ? 'folder' : 'file',
      action: 'delete',
      timing: {
        duration_ms: timing.duration_ms || 0,
        ...timing
      }
    })
  }

  /**
   * Logger la copie d'un fichier ou dossier
   */
  const logCopy = (sourcePath, destPath, isFolder = false, timing = {}) => {
    logActivity(isFolder ? 'FOLDER_COPY' : 'FILE_COPY', {
      source_path: sourcePath,
      destination_path: destPath,
      type: isFolder ? 'folder' : 'file',
      action: 'copy',
      timing: {
        duration_ms: timing.duration_ms || 0,
        ...timing
      }
    })
  }

  /**
   * Logger le déplacement d'un fichier ou dossier
   */
  const logMove = (sourcePath, destPath, isFolder = false, timing = {}) => {
    logActivity(isFolder ? 'FOLDER_MOVE' : 'FILE_MOVE', {
      source_path: sourcePath,
      destination_path: destPath,
      type: isFolder ? 'folder' : 'file',
      action: 'move',
      timing: {
        duration_ms: timing.duration_ms || 0,
        ...timing
      }
    })
  }

  /**
   * Logger le renommage d'un fichier ou dossier
   */
  const logRename = (oldPath, newPath, isFolder = false, timing = {}) => {
    logActivity(isFolder ? 'FOLDER_RENAME' : 'FILE_RENAME', {
      old_path: oldPath,
      new_path: newPath,
      old_name: oldPath.split('/').pop(),
      new_name: newPath.split('/').pop(),
      type: isFolder ? 'folder' : 'file',
      action: 'rename',
      timing: {
        duration_ms: timing.duration_ms || 0,
        ...timing
      }
    })
  }

  /**
   * Logger la création d'un dossier
   */
  const logFolderCreate = (folderPath, timing = {}) => {
    logActivity('FOLDER_CREATE', {
      path: folderPath,
      folder_name: folderPath.split('/').pop(),
      type: 'folder',
      action: 'create',
      timing: {
        duration_ms: timing.duration_ms || 0,
        ...timing
      }
    })
  }

  /**
   * Logger la création d'un fichier
   */
  const logFileCreate = (filePath, timing = {}) => {
    logActivity('FILE_CREATE', {
      path: filePath,
      file_name: filePath.split('/').pop(),
      extension: filePath.split('.').pop()?.toLowerCase(),
      type: 'file',
      action: 'create',
      timing: {
        duration_ms: timing.duration_ms || 0,
        ...timing
      }
    })
  }

  /**
   * Logger les erreurs d'opérations
   */
  const logError = (operation, path, error, context = {}) => {
    logActivity('ERROR', {
      failed_operation: operation,
      path,
      error_message: error.message,
      error_code: error.code,
      error_status: error.status,
      type: context.isFolder ? 'folder' : 'file',
      action: 'error',
      ...context
    })
  }

  /**
   * Obtenir les logs filtrés
   */
  const getActivityLogs = (filter = {}) => {
    let logs = [...activityLogs.value]
    
    // Filtrer par opération
    if (filter.operation) {
      logs = logs.filter(log => log.operation === filter.operation)
    }
    
    // Filtrer par type (file/folder)
    if (filter.type) {
      logs = logs.filter(log => log.type === filter.type)
    }
    
    // Filtrer par chemin
    if (filter.path) {
      logs = logs.filter(log => 
        log.path?.includes(filter.path) || 
        log.source_path?.includes(filter.path) ||
        log.destination_path?.includes(filter.path)
      )
    }
    
    // Filtrer par utilisateur
    if (filter.user_id) {
      logs = logs.filter(log => log.user_id === filter.user_id)
    }
    
    // Filtrer par période
    if (filter.since) {
      const sinceTime = new Date(filter.since)
      logs = logs.filter(log => new Date(log.timestamp) >= sinceTime)
    }
    
    return logs
  }

  /**
   * Obtenir les statistiques d'activité
   */
  const getActivityStats = (hours = 24) => {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000)
    const recentLogs = activityLogs.value.filter(log => 
      new Date(log.timestamp) >= since
    )
    
    const stats = {
      total_activities: recentLogs.length,
      file_operations: 0,
      folder_operations: 0,
      downloads: 0,
      uploads: 0,
      deletes: 0,
      copies: 0,
      moves: 0,
      errors: 0,
      most_active_paths: {},
      operation_counts: {}
    }
    
    recentLogs.forEach(log => {
      // Compter par type
      if (log.type === 'file') stats.file_operations++
      if (log.type === 'folder') stats.folder_operations++
      
      // Compter par action
      if (log.action === 'download') stats.downloads++
      if (log.action === 'upload') stats.uploads++
      if (log.action === 'delete') stats.deletes++
      if (log.action === 'copy') stats.copies++
      if (log.action === 'move') stats.moves++
      if (log.action === 'error') stats.errors++
      
      // Compter par opération
      stats.operation_counts[log.operation] = (stats.operation_counts[log.operation] || 0) + 1
      
      // Compter les chemins les plus actifs
      const path = log.path || log.source_path
      if (path) {
        const parentPath = path.substring(0, path.lastIndexOf('/')) || '/'
        stats.most_active_paths[parentPath] = (stats.most_active_paths[parentPath] || 0) + 1
      }
    })
    
    return stats
  }

  /**
   * Exporter les logs d'activité
   */
  const exportActivityLogs = (format = 'json') => {
    const exportData = {
      timestamp: new Date().toISOString(),
      user_id: user.value?.id,
      username: user.value?.username,
      total_logs: activityLogs.value.length,
      stats: getActivityStats(),
      logs: activityLogs.value
    }
    
    if (format === 'json') {
      return JSON.stringify(exportData, null, 2)
    } else if (format === 'csv') {
      const headers = [
        'timestamp', 'operation', 'type', 'action', 'path', 
        'user_id', 'duration_ms', 'file_size', 'error_message'
      ]
      
      const rows = activityLogs.value.map(log => [
        log.timestamp,
        log.operation,
        log.type || '',
        log.action || '',
        log.path || log.source_path || '',
        log.user_id || '',
        log.timing?.duration_ms || '',
        log.file_info?.size || '',
        log.error_message || ''
      ])
      
      return [headers, ...rows].map(row => row.join(',')).join('\n')
    }
    
    return exportData
  }

  /**
   * Vider les logs d'activité
   */
  const clearActivityLogs = () => {
    activityLogs.value = []
  }

  /**
   * Formater la taille de fichier
   */
  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return {
    // Logging methods
    logFolderOpen,
    logFileRead,
    logFileDownload,
    logFileUpload,
    logDelete,
    logCopy,
    logMove,
    logRename,
    logFolderCreate,
    logFileCreate,
    logError,
    
    // Data access
    getActivityLogs,
    getActivityStats,
    exportActivityLogs,
    clearActivityLogs,
    
    // Reactive state
    activityLogs: computed(() => activityLogs.value),
    totalActivities: computed(() => activityLogs.value.length),
    recentStats: computed(() => getActivityStats(1)) // Stats de la dernière heure
  }
}