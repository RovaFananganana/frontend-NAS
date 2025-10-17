/**
 * Activity Logger Service
 * Integrates with the existing activity logging system
 */

import { useGlobalActivityLogger, ActivityTypes } from '@/composables/useActivityLogger.js'

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
      this.logger = useGlobalActivityLogger()
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
    
    await this.logger.logFileOperation('download', filePath, {
      fileName,
      description: `Téléchargement de "${fileName}"`
    }, true)
  }

  /**
   * Log copy activity
   */
  async logCopy(items, source = 'internal') {
    if (!this.logger) return
    
    const count = Array.isArray(items) ? items.length : 1
    const itemNames = Array.isArray(items) ? items.map(item => item.name || item) : [items.name || items]
    const firstItem = Array.isArray(items) ? items[0] : items
    const filePath = firstItem?.path || firstItem?.name || 'unknown'
    
    await this.logger.logFileOperation('copy', filePath, {
      items: itemNames,
      count,
      source,
      description: `Copie de ${count} élément${count > 1 ? 's' : ''} (${source})`
    }, true)
  }

  /**
   * Log paste activity
   */
  async logPaste(items, targetPath, source = 'internal') {
    if (!this.logger) return
    
    const count = Array.isArray(items) ? items.length : 1
    const itemNames = Array.isArray(items) ? items.map(item => item.name || item) : [items.name || items]
    
    await this.logger.logFileOperation('copy', targetPath, {
      items: itemNames,
      count,
      targetPath,
      source,
      operation: 'paste',
      description: `Collage de ${count} élément${count > 1 ? 's' : ''} vers "${targetPath}" (${source})`
    }, true)
  }

  /**
   * Log cut activity
   */
  async logCut(items) {
    if (!this.logger) return
    
    const count = Array.isArray(items) ? items.length : 1
    const itemNames = Array.isArray(items) ? items.map(item => item.name || item) : [items.name || items]
    const firstItem = Array.isArray(items) ? items[0] : items
    const filePath = firstItem?.path || firstItem?.name || 'unknown'
    
    await this.logger.logFileOperation('move', filePath, {
      items: itemNames,
      count,
      operation: 'cut',
      description: `Coupe de ${count} élément${count > 1 ? 's' : ''}`
    }, true)
  }

  /**
   * Log upload activity
   */
  async logUpload(files, targetPath) {
    if (!this.logger) return
    
    const count = Array.isArray(files) ? files.length : 1
    const fileNames = Array.isArray(files) ? files.map(file => file.name) : [files.name]
    
    await this.logger.logFileOperation('upload', targetPath, {
      files: fileNames,
      count,
      targetPath,
      description: `Upload de ${count} fichier${count > 1 ? 's' : ''} vers "${targetPath}"`
    }, true)
  }

  /**
   * Log drag and drop activity
   */
  async logDragDrop(files, targetPath) {
    if (!this.logger) return
    
    const count = Array.isArray(files) ? files.length : 1
    const fileNames = Array.isArray(files) ? files.map(file => file.name) : [files.name]
    
    await this.logger.logFileOperation('upload', targetPath, {
      files: fileNames,
      count,
      targetPath,
      operation: 'drag_drop',
      description: `Glisser-déposer de ${count} fichier${count > 1 ? 's' : ''} vers "${targetPath}"`
    }, true)
  }

  /**
   * Log create activity
   */
  async logCreate(itemName, itemType, path) {
    if (!this.logger) return
    
    const operation = itemType === 'folder' ? 'create_folder' : 'create_file'
    const fullPath = `${path}/${itemName}`.replace(/\/+/g, '/')
    
    await this.logger.logFileOperation(operation, fullPath, {
      itemName,
      itemType,
      path,
      description: `Création ${itemType === 'folder' ? 'du dossier' : 'du fichier'} "${itemName}"`
    }, true)
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
    
    await this.logger.logFileOperation('delete', filePath, {
      items: itemNames,
      count,
      description: `Suppression de ${count} élément${count > 1 ? 's' : ''}`
    }, true)
  }

  /**
   * Log rename activity
   */
  async logRename(oldName, newName, path) {
    if (!this.logger) return
    
    await this.logger.logFileOperation('rename', path, {
      oldName,
      newName,
      path,
      description: `Renommage de "${oldName}" en "${newName}"`
    }, true)
  }

  /**
   * Log move activity
   */
  async logMove(items, sourcePath, targetPath) {
    if (!this.logger) return
    
    const count = Array.isArray(items) ? items.length : 1
    const itemNames = Array.isArray(items) ? items.map(item => item.name || item) : [items.name || items]
    
    await this.logger.logFileOperation('move', targetPath, {
      items: itemNames,
      count,
      sourcePath,
      targetPath,
      description: `Déplacement de ${count} élément${count > 1 ? 's' : ''} vers "${targetPath}"`
    }, true)
  }

  /**
   * Flush any pending logs
   */
  async flush() {
    if (this.logger && this.logger.flushLogs) {
      await this.logger.flushLogs()
    }
  }


}

// Create and export singleton instance
export const activityLogger = new ActivityLogger()
export default activityLogger