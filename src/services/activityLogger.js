/**
 * Activity Logger Service
 * Integrates with the existing activity logging system
 */

import { useActivityLogger } from '@/composables/useActivityLogger.js'

// Activity types constants
export const ActivityTypes = {
  FILE_DOWNLOAD: 'FILE_DOWNLOAD',
  FILE_UPLOAD: 'FILE_UPLOAD',
  FILE_COPY: 'FILE_COPY',
  FILE_MOVE: 'FILE_MOVE',
  FILE_DELETE: 'FILE_DELETE',
  FILE_RENAME: 'FILE_RENAME',
  FILE_CREATE: 'FILE_CREATE',
  FOLDER_CREATE: 'FOLDER_CREATE',
  FOLDER_OPEN: 'FOLDER_OPEN'
}

class ActivityLogger {
  constructor() {
    // Use the existing activity logger system
    this.logger = null
    this.initLogger()
  }

  /**
   * Initialize the logger
   */
  initLogger() {
    try {
      this.logger = useActivityLogger()
    } catch (error) {
      console.warn('Could not initialize activity logger:', error)
      this.logger = null
    }
  }

  /**
   * Log an activity using the existing system
   * @param {string} type - Type of activity (download, copy, paste, etc.)
   * @param {string} description - Description of the activity
   * @param {Object} details - Additional details
   */
  async log(type, description, details = {}) {
    if (!this.logger) {
      console.warn('Activity logger not initialized')
      return
    }

    try {
      // Map our types to the existing system types
      const mappedType = this.mapActivityType(type)
      
      // Extract resource from details or description
      const resource = details.filePath || details.targetPath || details.path || null
      
      // Log using the existing system
      await this.logger.logActivity(mappedType, resource, {
        description,
        original_type: type,
        ...details
      }, true, true) // Use batching for better performance

      console.log('📝 Activity logged:', { type: mappedType, description, details })
    } catch (error) {
      console.warn('Failed to log activity:', error)
    }
  }

  /**
   * Map our activity types to the existing system types
   */
  mapActivityType(type) {
    const typeMap = {
      'download': ActivityTypes.FILE_DOWNLOAD,
      'copy': ActivityTypes.FILE_COPY,
      'paste': ActivityTypes.FILE_COPY,
      'cut': ActivityTypes.FILE_MOVE,
      'upload': ActivityTypes.FILE_UPLOAD,
      'drag_drop': ActivityTypes.FILE_UPLOAD,
      'create': ActivityTypes.FOLDER_CREATE,
      'delete': ActivityTypes.FILE_DELETE,
      'rename': ActivityTypes.FILE_RENAME,
      'move': ActivityTypes.FILE_MOVE
    }
    
    return typeMap[type] || type
  }

  /**
   * Log download activity
   */
  async logDownload(fileName, filePath) {
    if (!this.logger) return
    
    this.logger.logFileDownload(filePath, {
      size: null,
      mime_type: null
    }, {
      fileName,
      description: `Téléchargement de "${fileName}"`
    })
  }

  /**
   * Log copy activity
   */
  async logCopy(items, source = 'internal') {
    if (!this.logger) return
    
    const count = Array.isArray(items) ? items.length : 1
    const itemNames = Array.isArray(items) ? items.map(item => item.name || item) : [items.name || items]
    const firstItem = Array.isArray(items) ? items[0] : items
    const sourcePath = firstItem?.path || firstItem?.name || 'unknown'
    const destPath = `${sourcePath}_copy`
    
    this.logger.logCopy(sourcePath, destPath, false, {
      items: itemNames,
      count,
      source,
      description: `Copie de ${count} élément${count > 1 ? 's' : ''} (${source})`
    })
  }

  /**
   * Log paste activity
   */
  async logPaste(items, targetPath, source = 'internal') {
    if (!this.logger) return
    
    const count = Array.isArray(items) ? items.length : 1
    const itemNames = Array.isArray(items) ? items.map(item => item.name || item) : [items.name || items]
    const firstItem = Array.isArray(items) ? items[0] : items
    const sourcePath = firstItem?.path || firstItem?.name || 'unknown'
    
    this.logger.logCopy(sourcePath, targetPath, false, {
      items: itemNames,
      count,
      targetPath,
      source,
      operation: 'paste',
      description: `Collage de ${count} élément${count > 1 ? 's' : ''} vers "${targetPath}" (${source})`
    })
  }

  /**
   * Log cut activity
   */
  async logCut(items) {
    if (!this.logger) return
    
    const count = Array.isArray(items) ? items.length : 1
    const itemNames = Array.isArray(items) ? items.map(item => item.name || item) : [items.name || items]
    const firstItem = Array.isArray(items) ? items[0] : items
    const sourcePath = firstItem?.path || firstItem?.name || 'unknown'
    const destPath = `${sourcePath}_moved`
    
    this.logger.logMove(sourcePath, destPath, false, {
      items: itemNames,
      count,
      operation: 'cut',
      description: `Coupe de ${count} élément${count > 1 ? 's' : ''}`
    })
  }

  /**
   * Log upload activity
   */
  async logUpload(files, targetPath) {
    if (!this.logger) return
    
    const count = Array.isArray(files) ? files.length : 1
    const fileNames = Array.isArray(files) ? files.map(file => file.name) : [files.name]
    const firstFile = Array.isArray(files) ? files[0] : files
    const filePath = `${targetPath}/${firstFile.name || 'unknown'}`
    
    this.logger.logFileUpload(filePath, {
      size: firstFile.size || null,
      mime_type: firstFile.type || null
    }, {
      files: fileNames,
      count,
      targetPath,
      description: `Upload de ${count} fichier${count > 1 ? 's' : ''} vers "${targetPath}"`
    })
  }

  /**
   * Log drag and drop activity
   */
  async logDragDrop(files, targetPath) {
    if (!this.logger) return
    
    const count = Array.isArray(files) ? files.length : 1
    const fileNames = Array.isArray(files) ? files.map(file => file.name) : [files.name]
    const firstFile = Array.isArray(files) ? files[0] : files
    const filePath = `${targetPath}/${firstFile.name || 'unknown'}`
    
    this.logger.logFileUpload(filePath, {
      size: firstFile.size || null,
      mime_type: firstFile.type || null
    }, {
      files: fileNames,
      count,
      targetPath,
      operation: 'drag_drop',
      description: `Glisser-déposer de ${count} fichier${count > 1 ? 's' : ''} vers "${targetPath}"`
    })
  }

  /**
   * Log create activity
   */
  async logCreate(itemName, itemType, path) {
    if (!this.logger) return
    
    const fullPath = `${path}/${itemName}`.replace(/\/+/g, '/')
    
    if (itemType === 'folder') {
      this.logger.logFolderCreate(fullPath, {
        itemName,
        itemType,
        path,
        description: `Création du dossier "${itemName}"`
      })
    } else {
      this.logger.logFileCreate(fullPath, {
        itemName,
        itemType,
        path,
        description: `Création du fichier "${itemName}"`
      })
    }
  }

  /**
   * Log delete activity
   */
  async logDelete(items) {
    if (!this.logger) return
    
    const count = Array.isArray(items) ? items.length : 1
    const itemNames = Array.isArray(items) ? items.map(item => item.name || item) : [items.name || items]
    const firstItem = Array.isArray(items) ? items[0] : items
    const filePath = firstItem?.path || firstItem?.name || 'unknown'
    const isFolder = firstItem?.isDirectory || firstItem?.type === 'folder'
    
    this.logger.logDelete(filePath, isFolder, {
      items: itemNames,
      count,
      description: `Suppression de ${count} élément${count > 1 ? 's' : ''}`
    })
  }

  /**
   * Log rename activity
   */
  async logRename(oldName, newName, path) {
    if (!this.logger) return
    
    const oldPath = `${path}/${oldName}`.replace(/\/+/g, '/')
    const newPath = `${path}/${newName}`.replace(/\/+/g, '/')
    
    this.logger.logRename(oldPath, newPath, false, {
      oldName,
      newName,
      path,
      description: `Renommage de "${oldName}" en "${newName}"`
    })
  }

  /**
   * Log move activity
   */
  async logMove(items, sourcePath, targetPath) {
    if (!this.logger) return
    
    const count = Array.isArray(items) ? items.length : 1
    const itemNames = Array.isArray(items) ? items.map(item => item.name || item) : [items.name || items]
    const firstItem = Array.isArray(items) ? items[0] : items
    const isFolder = firstItem?.isDirectory || firstItem?.type === 'folder'
    
    this.logger.logMove(sourcePath, targetPath, isFolder, {
      items: itemNames,
      count,
      sourcePath,
      targetPath,
      description: `Déplacement de ${count} élément${count > 1 ? 's' : ''} vers "${targetPath}"`
    })
  }

  /**
   * Flush any pending logs
   */
  async flush() {
    // No flush method needed for the current implementation
    console.log('📝 Activity logger flush requested')
  }


}

// Create and export singleton instance
export const activityLogger = new ActivityLogger()
export default activityLogger