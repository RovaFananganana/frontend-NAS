// services/nasAPI.js

/**
 * Enhanced NAS API service for Synology integration
 * Provides methods for file operations, sync management, and Drive Client integration
 */

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
    // Try both possible token keys for compatibility
    const token = localStorage.getItem('auth_token') || 
                  sessionStorage.getItem('auth_token') || 
                  localStorage.getItem('token')
    
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
      const response = await fetch(url, config)
      
      if (!response.ok) {
        // Handle authentication errors
        if (response.status === 401) {
          // Token might be expired, redirect to login
          localStorage.removeItem('token')
          window.location.href = '/login'
          throw new NASAPIError('Authentication required', 401, 'AUTH_REQUIRED')
        }
        
        let errorData = {}
        const contentType = response.headers.get('content-type')
        
        if (contentType && contentType.includes('application/json')) {
          errorData = await response.json().catch(() => ({}))
        } else {
          // If we get HTML instead of JSON, it's likely a server error
          const htmlText = await response.text()
          if (htmlText.includes('<!DOCTYPE')) {
            throw new NASAPIError(
              'Server error - check backend logs',
              response.status,
              'SERVER_ERROR'
            )
          }
          errorData = { error: htmlText }
        }
        
        throw new NASAPIError(
          errorData.error || errorData.msg || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorData.code
        )
      }

      // Handle different response types
      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        return await response.json()
      } else if (contentType && contentType.includes('application/octet-stream')) {
        return await response.blob()
      } else {
        return await response.text()
      }
    } catch (error) {
      if (error instanceof NASAPIError) {
        throw error
      }
      
      // Handle network errors
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new NASAPIError('Network error - check if backend is running', 0, 'NETWORK_ERROR')
      }
      
      throw new NASAPIError(`Request failed: ${error.message}`, 0, 'REQUEST_ERROR')
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
   * Browse directory contents
   */
  async browse(path = '/') {
    const encodedPath = encodeURIComponent(path)
    return await this.request(`/browse?path=${encodedPath}`)
  }

  /**
   * Create a new folder
   */
  async createFolder(parentPath, folderName) {
    return await this.request('/create-folder', {
      method: 'POST',
      body: JSON.stringify({
        parent_path: parentPath,
        name: folderName
      })
    })
  }

  /**
   * Upload file
   */
  async uploadFile(file, destinationPath, overwrite = false, onProgress = null) {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('path', destinationPath)
    formData.append('overwrite', overwrite.toString())

    const xhr = new XMLHttpRequest()
    
    return new Promise((resolve, reject) => {
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const percentComplete = (event.loaded / event.total) * 100
          onProgress(percentComplete)
        }
      })

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText)
            resolve(response)
          } catch (e) {
            reject(new NASAPIError('Invalid response format', xhr.status))
          }
        } else {
          try {
            const errorResponse = JSON.parse(xhr.responseText)
            reject(new NASAPIError(errorResponse.error || 'Upload failed', xhr.status))
          } catch (e) {
            reject(new NASAPIError(`Upload failed: ${xhr.statusText}`, xhr.status))
          }
        }
      })

      xhr.addEventListener('error', () => {
        reject(new NASAPIError('Network error during upload', 0, 'NETWORK_ERROR'))
      })

      xhr.addEventListener('timeout', () => {
        reject(new NASAPIError('Upload timeout', 0, 'TIMEOUT'))
      })

      xhr.open('POST', `${this.baseURL}/upload`)
      xhr.setRequestHeader('Authorization', `Bearer ${localStorage.getItem('token')}`)
      xhr.timeout = 300000 // 5 minutes for uploads
      xhr.send(formData)
    })
  }

  /**
   * Download file
   */
  async downloadFile(filePath) {
    const encodedPath = encodeURIComponent(filePath)
    const response = await fetch(`${this.baseURL}/download/${encodedPath}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new NASAPIError(
        errorData.error || `Download failed: ${response.statusText}`,
        response.status
      )
    }

    return response.blob()
  }

  /**
   * Delete file or folder
   */
  async deleteItem(path) {
    return await this.request('/delete', {
      method: 'DELETE',
      body: JSON.stringify({ path })
    })
  }

  /**
   * Rename file or folder
   */
  async renameItem(path, newName) {
    return await this.request('/rename', {
      method: 'PUT',
      body: JSON.stringify({
        old_path: path,
        new_name: newName
      })
    })
  }

  /**
   * Move file or folder
   */
  async moveItem(sourcePath, destinationPath) {
    return await this.request('/move', {
      method: 'PUT',
      body: JSON.stringify({
        source_path: sourcePath,
        dest_path: destinationPath
      })
    })
  }

  /**
   * Copy file or folder
   */
  async copyItem(sourcePath, destinationPath) {
    return await this.request('/copy', {
      method: 'POST',
      body: JSON.stringify({
        source_path: sourcePath,
        dest_path: destinationPath
      })
    })
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
   * Check permissions for a specific path
   */
  async checkPermissions(path) {
    const encodedPath = encodeURIComponent(path)
    return await this.request(`/permissions/check?path=${encodedPath}`)
  }
}

// Create and export singleton instance
export const nasAPI = new NASAPIService()
export { NASAPIError }
export default nasAPI