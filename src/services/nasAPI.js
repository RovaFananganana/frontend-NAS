// services/nasAPI.js

/**
 * Enhanced NAS API service for Synology integration
 * Provides methods for file operations, sync management, and Drive Client integration
 */

import TokenService from './tokenService.js'
import httpClient from './httpClient.js'

// Simple activity logger for nasAPI (without Vue composable)
const simpleActivityLogger = {
  logs: [],
  maxLogs: 100,
  
  log(operation, context) {
    const logEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      operation,
      ...context
    }
    
    this.logs.unshift(logEntry)
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs)
    }
    
    if (import.meta.env.DEV) {
      console.log(`📁 [NAS_ACTIVITY] ${operation}:`, context)
    }
    
    // Send to backend for persistent storage
    this.sendToBackend(operation, context)
  },
  
  async sendToBackend(operation, context) {
    try {
      // Don't send if no token (user not authenticated)
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
      
      // Import userAPI dynamically to avoid circular dependencies
      const { userAPI } = await import('@/services/api')
      
      await userAPI.logActivity({
        action: action,
        target: target,
        details: JSON.stringify(context)
      })
      
    } catch (error) {
      console.warn('Error sending activity log to backend:', error)
    }
  },
  
  logFolderOpen(path, timing = {}) {
    this.log('FOLDER_OPEN', { path, type: 'folder', action: 'open', timing })
  },
  
  logFileDownload(path, fileInfo = {}, timing = {}) {
    this.log('FILE_DOWNLOAD', { path, type: 'file', action: 'download', file_info: fileInfo, timing })
  },
  
  logFileUpload(path, fileInfo = {}, timing = {}) {
    this.log('FILE_UPLOAD', { path, type: 'file', action: 'upload', file_info: fileInfo, timing })
  },
  
  logDelete(path, isFolder = false, timing = {}) {
    this.log(isFolder ? 'FOLDER_DELETE' : 'FILE_DELETE', { 
      path, 
      type: isFolder ? 'folder' : 'file', 
      action: 'delete', 
      timing 
    })
  },
  
  logCopy(sourcePath, destPath, isFolder = false, timing = {}) {
    this.log(isFolder ? 'FOLDER_COPY' : 'FILE_COPY', { 
      source_path: sourcePath,
      destination_path: destPath,
      type: isFolder ? 'folder' : 'file', 
      action: 'copy', 
      timing 
    })
  },
  
  logMove(sourcePath, destPath, isFolder = false, timing = {}) {
    this.log(isFolder ? 'FOLDER_MOVE' : 'FILE_MOVE', { 
      source_path: sourcePath,
      destination_path: destPath,
      type: isFolder ? 'folder' : 'file', 
      action: 'move', 
      timing 
    })
  },
  
  logRename(oldPath, newPath, isFolder = false, timing = {}) {
    this.log(isFolder ? 'FOLDER_RENAME' : 'FILE_RENAME', { 
      old_path: oldPath,
      new_path: newPath,
      type: isFolder ? 'folder' : 'file', 
      action: 'rename', 
      timing 
    })
  },
  
  logFolderCreate(path, timing = {}) {
    this.log('FOLDER_CREATE', { path, type: 'folder', action: 'create', timing })
  },
  
  logFileCreate(path, timing = {}) {
    this.log('FILE_CREATE', { path, type: 'file', action: 'create', timing })
  },
  
  logError(operation, path, error, context = {}) {
    // Créer un message d'erreur détaillé
    let errorDetails = error.message || 'Erreur inconnue'
    
    if (error.status === 403) {
      errorDetails = 'Permission refusée'
    } else if (error.status === 404) {
      errorDetails = 'Fichier ou dossier introuvable'
    } else if (error.status === 500) {
      errorDetails = 'Erreur serveur interne'
    }
    
    this.log('ERROR', { 
      failed_operation: operation,
      path,
      error_message: errorDetails,
      error_code: error.code,
      error_status: error.status,
      full_error: error.message,
      ...context
    })
  }
}

class NASAPIError extends Error {
  constructor(message, status, code) {
    super(message)
    this.name = 'NASAPIError'
    this.status = status
    this.code = code
  }
}

class NASAPIService {
  constructor() {
    this.baseURL = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5001') + '/nas'
    this.timeout = 30000 // 30 seconds for file operations
  }

  /**
   * Get authorization headers
   */
  getHeaders() {
    const token = TokenService.getToken()
    
    if (!token) {
      console.warn('No authentication token found')
    }
    
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }

  /**
   * Make API request with error handling
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`
    const config = {
      timeout: this.timeout,
      headers: this.getHeaders(),
      ...options
    }

    try {
      const method = (config.method || 'GET').toLowerCase()
      const data = config.body ? JSON.parse(config.body) : undefined
      const axiosConfig = { headers: config.headers }
      
      let response
      switch (method) {
        case 'post':
          response = await httpClient.post(url, data, axiosConfig)
          break
        case 'put':
          response = await httpClient.put(url, data, axiosConfig)
          break
        case 'delete':
          // For DELETE requests with body, pass data as second parameter
          if (data) {
            response = await httpClient.delete(url, { ...axiosConfig, data })
          } else {
            response = await httpClient.delete(url, axiosConfig)
          }
          break
        default:
          response = await httpClient.get(url, axiosConfig)
      }
      
      return response
    } catch (error) {
      if (error instanceof NASAPIError) {
        throw error
      }
      
      // Handle httpClient errors (which are already transformed)
      if (error.status) {
        if (error.status === 401) {
          localStorage.removeItem('token')
          window.location.href = '/login'
          throw new NASAPIError('Authentication required', 401, 'AUTH_REQUIRED')
        }
        
        throw new NASAPIError(
          error.message || `HTTP ${error.status}`,
          error.status,
          error.code
        )
      } else {
        // Network or other error
        throw new NASAPIError(`Request failed: ${error.message}`, 0, 'REQUEST_ERROR')
      }
    }
  }

  // ==================== Connection & Configuration ====================

  /**
   * Test NAS connection (Admin only)
   */
  async testConnection() {
    return await this.request('/test-connection')
  }

  /**
   * Get NAS and Synology Drive configuration
   */
  async getConfig() {
    return await this.request('/config')
  }

  /**
   * Get sync status
   */
  async getSyncStatus() {
    return await this.request('/sync-status')
  }

  /**
   * Trigger manual sync
   */
  async triggerSync(path = '/') {
    return await this.request('/force-sync', {
      method: 'POST',
      body: JSON.stringify({ path })
    })
  }

  /**
   * Synchronize database with NAS structure (Admin only)
   */
  async syncDatabase(options = {}) {
    const { dry_run = false, max_depth = 10 } = options
    return await this.request('/sync', {
      method: 'POST',
      body: JSON.stringify({
        dry_run,
        max_depth
      })
    })
  }

  // ==================== File Operations ====================

  /**
   * Browse directory contents with activity logging
   */
  async browse(path = '/') {
    const startTime = performance.now()
    const encodedPath = encodeURIComponent(path)
    
    try {
      const result = await this.request(`/browse?path=${encodedPath}`)
      
      // Log folder open activity
      simpleActivityLogger.logFolderOpen(path, {
        duration_ms: performance.now() - startTime,
        items_count: result.items?.length || 0
      })
      
      return result
    } catch (error) {
      // Log error
      simpleActivityLogger.logError('FOLDER_OPEN', path, error, { isFolder: true })
      throw error
    }
  }

  /**
   * Search for files and folders recursively
   */
  async search(query, path = '/', options = {}) {
    const params = new URLSearchParams({
      query: query,
      path: path,
      recursive: options.recursive !== false ? 'true' : 'false',
      include_files: options.includeFiles !== false ? 'true' : 'false',
      include_folders: options.includeFolders !== false ? 'true' : 'false',
      case_sensitive: options.caseSensitive === true ? 'true' : 'false',
      max_results: options.maxResults || '100'
    })
    
    return await this.request(`/search?${params.toString()}`)
  }

  /**
   * Create a new folder with activity logging
   */
  async createFolder(parentPath, folderName) {
    const startTime = performance.now()
    
    try {
      const result = await this.request('/create-folder', {
        method: 'POST',
        body: JSON.stringify({
          parent_path: parentPath,
          name: folderName
        })
      })
      
      const duration = performance.now() - startTime
      const folderPath = this.joinPaths(parentPath, folderName)
      
      // Log folder creation activity
      simpleActivityLogger.logFolderCreate(folderPath, { duration_ms: duration })
      
      return result
    } catch (error) {
      // Log error
      const folderPath = this.joinPaths(parentPath, folderName)
      simpleActivityLogger.logError('FOLDER_CREATE', folderPath, error, { isFolder: true })
      throw error
    }
  }

  /**
   * Create a new file with activity logging
   */
  async createFile(parentPath, fileName) {
    const startTime = performance.now()
    
    try {
      const result = await this.request('/create-file', {
        method: 'POST',
        body: JSON.stringify({
          parent_path: parentPath,
          name: fileName
        })
      })
      
      const duration = performance.now() - startTime
      const filePath = this.joinPaths(parentPath, fileName)
      
      // Log file creation activity
      simpleActivityLogger.logFileCreate(filePath, { duration_ms: duration })
      
      return result
    } catch (error) {
      // Log error
      const filePath = this.joinPaths(parentPath, fileName)
      simpleActivityLogger.logError('FILE_CREATE', filePath, error, { isFolder: false })
      throw error
    }
  }

  /**
   * Upload file with activity logging
   */
  async uploadFile(file, destinationPath, overwrite = false, onProgress = null) {
    const startTime = performance.now()
    const formData = new FormData()
    formData.append('file', file)
    formData.append('path', destinationPath)
    formData.append('overwrite', overwrite.toString())

    const xhr = new XMLHttpRequest()
    
    return new Promise((resolve, reject) => {
      let uploadSpeed = 0
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const percentComplete = (event.loaded / event.total) * 100
          onProgress(percentComplete)
          
          // Calculate upload speed
          const duration = performance.now() - startTime
          if (duration > 0) {
            uploadSpeed = (event.loaded / 1024 / 1024) / (duration / 1000) // MB/s
          }
        }
      })

      xhr.addEventListener('load', async () => {
        const duration = performance.now() - startTime
        
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText)
            
            // Log upload activity
            simpleActivityLogger.logFileUpload(destinationPath, {
              size: file.size,
              mime_type: file.type,
              overwrite
            }, {
              duration_ms: duration,
              upload_speed_mbps: uploadSpeed
            })
            
            resolve(response)
          } catch (e) {
            reject(new NASAPIError('Invalid response format', xhr.status))
          }
        } else {
          // Log error
          const error = new NASAPIError('Upload failed', xhr.status)
          simpleActivityLogger.logError('FILE_UPLOAD', destinationPath, error, { isFolder: false })
          
          try {
            const errorResponse = JSON.parse(xhr.responseText)
            reject(new NASAPIError(errorResponse.error || 'Upload failed', xhr.status))
          } catch (e) {
            reject(new NASAPIError(`Upload failed: ${xhr.statusText}`, xhr.status))
          }
        }
      })

      xhr.addEventListener('error', () => {
        const error = new NASAPIError('Network error during upload', 0, 'NETWORK_ERROR')
        simpleActivityLogger.logError('FILE_UPLOAD', destinationPath, error, { isFolder: false })
        reject(new NASAPIError('Network error during upload', 0, 'NETWORK_ERROR'))
      })

      xhr.addEventListener('timeout', () => {
        const error = new NASAPIError('Upload timeout', 0, 'TIMEOUT')
        simpleActivityLogger.logError('FILE_UPLOAD', destinationPath, error, { isFolder: false })
        reject(new NASAPIError('Upload timeout', 0, 'TIMEOUT'))
      })

      xhr.open('POST', `${this.baseURL}/upload`)
      xhr.setRequestHeader('Authorization', `Bearer ${TokenService.getToken()}`)
      xhr.timeout = 300000 // 5 minutes for uploads
      xhr.send(formData)
    })
  }

  /**
   * Download file with progress tracking and activity logging
   */
  async downloadFile(filePath, onProgress = null) {
    const startTime = performance.now()
    // Better encoding for special characters and normalize path
    const normalizedPath = filePath.startsWith('/') ? filePath.slice(1) : filePath
    const encodedPath = normalizedPath.split('/').map(segment => encodeURIComponent(segment)).join('/')
    
    let downloadSize = 0
    let downloadSpeed = 0
    
    try {
      // Use httpClient's downloadFile method which handles axios blob downloads with progress
      const blob = await httpClient.downloadFile(
        `/nas/download/${encodedPath}`,
        onProgress ? (percentComplete, loaded, total) => {
          downloadSize = total
          onProgress(percentComplete, loaded, total)
        } : null,
        {
          timeout: 300000, // 5 minutes for large file downloads
          headers: {
            'Authorization': `Bearer ${TokenService.getToken()}`
          }
        }
      )
      
      const duration = performance.now() - startTime
      if (duration > 0 && downloadSize > 0) {
        downloadSpeed = (downloadSize / 1024 / 1024) / (duration / 1000) // MB/s
      }
      
      // Log download activity
      simpleActivityLogger.logFileDownload(filePath, {
        size: downloadSize,
        mime_type: blob.type
      }, {
        duration_ms: duration,
        download_speed_mbps: downloadSpeed
      })
      
      return blob
      
    } catch (error) {
      // Log error
      simpleActivityLogger.logError('FILE_DOWNLOAD', filePath, error, { isFolder: false })
      
      // Transform httpClient errors to NASAPIError for consistency
      if (error.name === 'HTTPClientError') {
        throw new NASAPIError(
          error.message || 'Download failed',
          error.status || 0,
          error.code || 'DOWNLOAD_ERROR'
        )
      }
      
      throw new NASAPIError(`Download failed: ${error.message}`, 0, 'DOWNLOAD_ERROR')
    }
  }

  /**
   * Delete file or folder with activity logging
   */
  async deleteItem(path) {
    const startTime = performance.now()
    
    try {
      const result = await this.request('/delete', {
        method: 'DELETE',
        body: JSON.stringify({ path })
      })
      
      const duration = performance.now() - startTime
      
      // Log delete activity
      const isFolder = result.type === 'folder' || path.endsWith('/')
      simpleActivityLogger.logDelete(path, isFolder, { duration_ms: duration })
      
      return result
    } catch (error) {
      // Log error
      simpleActivityLogger.logError('DELETE', path, error)
      throw error
    }
  }

  /**
   * Rename file or folder with activity logging
   */
  async renameItem(path, newName) {
    const startTime = performance.now()
    
    try {
      const result = await this.request('/rename', {
        method: 'PUT',
        body: JSON.stringify({
          old_path: path,
          new_name: newName
        })
      })
      
      const duration = performance.now() - startTime
      const newPath = path.substring(0, path.lastIndexOf('/') + 1) + newName
      
      // Log rename activity
      const isFolder = result.type === 'folder' || path.endsWith('/')
      simpleActivityLogger.logRename(path, newPath, isFolder, { duration_ms: duration })
      
      return result
    } catch (error) {
      // Log error
      simpleActivityLogger.logError('RENAME', path, error)
      throw error
    }
  }

  /**
   * Move file or folder with activity logging
   */
  async moveItem(sourcePath, destinationPath) {
    const startTime = performance.now()
    
    try {
      const result = await this.request('/move', {
        method: 'PUT',
        body: JSON.stringify({
          source_path: sourcePath,
          dest_path: destinationPath
        })
      })
      
      const duration = performance.now() - startTime
      
      // Log move activity
      const isFolder = result.type === 'folder' || sourcePath.endsWith('/')
      simpleActivityLogger.logMove(sourcePath, destinationPath, isFolder, { duration_ms: duration })
      
      return result
    } catch (error) {
      // Log error
      simpleActivityLogger.logError('MOVE', sourcePath, error)
      throw error
    }
  }

  /**
   * Copy file or folder with activity logging
   */
  async copyItem(sourcePath, destinationPath) {
    const startTime = performance.now()
    
    try {
      const result = await this.request('/copy', {
        method: 'POST',
        body: JSON.stringify({
          source_path: sourcePath,
          dest_path: destinationPath
        })
      })
      
      const duration = performance.now() - startTime
      
      // Log copy activity
      const isFolder = result.type === 'folder' || sourcePath.endsWith('/')
      simpleActivityLogger.logCopy(sourcePath, destinationPath, isFolder, { duration_ms: duration })
      
      return result
    } catch (error) {
      // Log error
      simpleActivityLogger.logError('COPY', sourcePath, error)
      throw error
    }
  }

  /**
   * Get file/folder properties
   */
  async getProperties(path) {
    const encodedPath = encodeURIComponent(path)
    return await this.request(`/properties?path=${encodedPath}`)
  }

  /**
   * Set file/folder permissions
   */
  async setPermissions(path, permissions) {
    return await this.request('/permissions', {
      method: 'POST',
      body: JSON.stringify({
        path,
        permissions
      })
    })
  }

  /**
   * Get folder by path from database
   */
  async getFolderByPath(path) {
    const encodedPath = encodeURIComponent(path)
    return await this.request(`/folder-by-path?path=${encodedPath}`)
  }

  /**
   * Create folder in database
   */
  async createFolderInDB(name, path) {
    return await this.request('/create-folder-db', {
      method: 'POST',
      body: JSON.stringify({
        name,
        path
      })
    })
  }

  // ==================== Utility Methods ====================

  /**
   * Format file size in human readable format
   */
  formatFileSize(bytes) {
    if (!bytes || bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  /**
   * Get file icon class based on extension
   */
  getFileIcon(filename, isDirectory = false) {
    if (isDirectory) {
      return 'fas fa-folder'
    }
    
    const ext = filename?.split('.').pop()?.toLowerCase() || ''
    const iconMap = {
      'pdf': 'fas fa-file-pdf',
      'doc': 'fas fa-file-word',
      'docx': 'fas fa-file-word',
      'xls': 'fas fa-file-excel',
      'xlsx': 'fas fa-file-excel',
      'ppt': 'fas fa-file-powerpoint',
      'pptx': 'fas fa-file-powerpoint',
      'jpg': 'fas fa-file-image',
      'jpeg': 'fas fa-file-image',
      'png': 'fas fa-file-image',
      'gif': 'fas fa-file-image',
      'bmp': 'fas fa-file-image',
      'svg': 'fas fa-file-image',
      'mp4': 'fas fa-file-video',
      'avi': 'fas fa-file-video',
      'mkv': 'fas fa-file-video',
      'mov': 'fas fa-file-video',
      'wmv': 'fas fa-file-video',
      'mp3': 'fas fa-file-audio',
      'wav': 'fas fa-file-audio',
      'flac': 'fas fa-file-audio',
      'aac': 'fas fa-file-audio',
      'zip': 'fas fa-file-archive',
      'rar': 'fas fa-file-archive',
      '7z': 'fas fa-file-archive',
      'tar': 'fas fa-file-archive',
      'gz': 'fas fa-file-archive',
      'txt': 'fas fa-file-alt',
      'md': 'fas fa-file-alt',
      'rtf': 'fas fa-file-alt',
      'js': 'fas fa-file-code',
      'html': 'fas fa-file-code',
      'css': 'fas fa-file-code',
      'php': 'fas fa-file-code',
      'py': 'fas fa-file-code',
      'java': 'fas fa-file-code',
      'cpp': 'fas fa-file-code',
      'c': 'fas fa-file-code',
      'json': 'fas fa-file-code',
      'xml': 'fas fa-file-code'
    }
    return iconMap[ext] || 'fas fa-file'
  }

  /**
   * Get file color based on extension
   */
  getFileColor(filename, isDirectory = false) {
    if (isDirectory) {
      return '#3b82f6' // blue
    }
    
    const ext = filename?.split('.').pop()?.toLowerCase() || ''
    const colorMap = {
      'pdf': '#dc2626', // red
      'doc': '#2563eb', // blue
      'docx': '#2563eb',
      'xls': '#059669', // green
      'xlsx': '#059669',
      'ppt': '#ea580c', // orange
      'pptx': '#ea580c',
      'jpg': '#7c3aed', // purple
      'jpeg': '#7c3aed',
      'png': '#7c3aed',
      'gif': '#7c3aed',
      'bmp': '#7c3aed',
      'svg': '#7c3aed',
      'mp4': '#ea580c', // orange
      'avi': '#ea580c',
      'mkv': '#ea580c',
      'mov': '#ea580c',
      'mp3': '#10b981', // emerald
      'wav': '#10b981',
      'flac': '#10b981',
      'zip': '#6b7280', // gray
      'rar': '#6b7280',
      '7z': '#6b7280',
      'txt': '#374151', // gray-700
      'md': '#374151',
      'js': '#fbbf24', // amber
      'html': '#f97316', // orange
      'css': '#06b6d4', // cyan
      'php': '#8b5cf6', // violet
      'py': '#10b981', // emerald
      'java': '#f59e0b' // amber
    }
    return colorMap[ext] || '#6b7280'
  }

  /**
   * Validate file name
   */
  validateFileName(filename) {
    const invalidChars = /[<>:"/\\|?*]/
    const reservedNames = ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9', 'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9']
    
    if (!filename || filename.trim() === '') {
      return { valid: false, error: 'Filename cannot be empty' }
    }
    
    if (filename.length > 255) {
      return { valid: false, error: 'Filename too long (max 255 characters)' }
    }
    
    if (invalidChars.test(filename)) {
      return { valid: false, error: 'Filename contains invalid characters' }
    }
    
    if (reservedNames.includes(filename.toUpperCase())) {
      return { valid: false, error: 'Filename is reserved by system' }
    }
    
    if (filename.startsWith('.') || filename.endsWith('.')) {
      return { valid: false, error: 'Filename cannot start or end with a dot' }
    }
    
    return { valid: true }
  }

  /**
   * Normalize path
   */
  normalizePath(path) {
    return path.replace(/\/+/g, '/').replace(/\/$/, '') || '/'
  }

  /**
   * Get parent path
   */
  getParentPath(path) {
    const normalized = this.normalizePath(path)
    if (normalized === '/') return null
    const segments = normalized.split('/')
    segments.pop()
    return segments.join('/') || '/'
  }

  /**
   * Get filename from path
   */
  getFilename(path) {
    return path.split('/').pop() || ''
  }

  /**
   * Join paths
   */
  joinPaths(...paths) {
    return this.normalizePath(paths.join('/'))
  }

  /**
   * Check permissions for a specific path with enhanced logging
   */
  async checkPermissions(path) {
    const encodedPath = encodeURIComponent(path)
    return await this.request(`/permissions/check?path=${encodedPath}`)
  }

  /**
   * Get permission audit logs (Admin only)
   */
  async getPermissionAuditLog(filters = {}) {
    const params = new URLSearchParams()
    
    if (filters.user_id) params.append('user_id', filters.user_id)
    if (filters.path) params.append('path', filters.path)
    if (filters.action) params.append('action', filters.action)
    if (filters.limit) params.append('limit', filters.limit)
    
    const queryString = params.toString()
    const endpoint = queryString ? `/permissions/audit-log?${queryString}` : '/permissions/audit-log'
    
    return await this.request(endpoint)
  }

  /**
   * Get permission performance summary (Admin only)
   */
  async getPermissionPerformanceSummary(filters = {}) {
    const params = new URLSearchParams()
    
    if (filters.user_id) params.append('user_id', filters.user_id)
    if (filters.hours) params.append('hours', filters.hours)
    
    const queryString = params.toString()
    const endpoint = queryString ? `/permissions/performance-summary?${queryString}` : '/permissions/performance-summary'
    
    return await this.request(endpoint)
  }

  /**
   * Download file as blob for clipboard operations
   * This is an alias for downloadFile that returns the blob directly
   */
  async downloadFileAsBlob(filePath, onProgress = null) {
    const blob = await this.downloadFile(filePath, onProgress)
    return { blob, fileName: this.getFilename(filePath) }
  }
}

// Create and export singleton instance
export const nasAPI = new NASAPIService()
export { NASAPIError }
export default nasAPI

/**
 * Helper: build authenticated streaming URL for media/PDF/image/text preview.
 * Uses Bearer token in query to work with <video>/<audio>/<img>/<iframe>.
 */
export function getStreamUrl(path) {
  const base = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5001')
  const token = TokenService.getToken()
  const encodedPath = encodeURIComponent(path)
  const params = new URLSearchParams()
  params.set('path', encodedPath)
  if (token) params.set('token', token) // optional: backend can read Authorization header; query token helps for media tags
  // Prefer header auth; keep token in query only if your CORS forbids header for tags. You can remove if not needed.
  return `${base}/nas/stream?${params.toString()}`
}