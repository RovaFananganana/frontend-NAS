/**
 * @fileoverview Service for managing file type configurations
 * This service integrates with the backend API to provide dynamic file type configuration
 */

import { fileTypeConfigAPI } from './fileTypeConfigAPI'
import { FILE_TYPES } from '@/types/fileViewer.js'

class FileTypeConfigService {
  constructor() {
    this.configCache = new Map()
    this.cacheExpiry = 5 * 60 * 1000 // 5 minutes
    this.lastCacheUpdate = 0
  }

  /**
   * Get all file type configurations from the backend
   * @param {boolean} includeDisabled - Whether to include disabled configurations
   * @returns {Promise<Array>} Array of file type configurations
   */
  async getAllConfigs(includeDisabled = false) {
    try {
      return await fileTypeConfigAPI.getAllConfigs(includeDisabled)
    } catch (error) {
      console.error('Error fetching file type configurations:', error)
      return this._getFallbackConfigs()
    }
  }

  /**
   * Get configuration for a specific file type
   * @param {string} mimeType - MIME type to get config for
   * @param {string} extension - File extension to get config for
   * @returns {Promise<Object|null>} Configuration object or null if not found
   */
  async getConfigForFile(mimeType = null, extension = null) {
    try {
      const params = {}
      if (mimeType) params.mime_type = mimeType
      if (extension) params.extension = extension

      return await fileTypeConfigAPI.getConfigForType(params)
    } catch (error) {
      console.error('Error fetching file type config:', error)
      return this._getFallbackConfigForFile(mimeType, extension)
    }
  }

  /**
   * Validate a file against configuration rules
   * @param {Object} fileData - File data to validate
   * @returns {Promise<Object>} Validation result
   */
  async validateFile(fileData) {
    try {
      return await fileTypeConfigAPI.validateFile(fileData)
    } catch (error) {
      console.error('Error validating file:', error)
      return {
        valid: false,
        error: 'Validation service unavailable',
        config: null
      }
    }
  }

  /**
   * Get supported file types summary
   * @returns {Promise<Object>} Summary of supported types
   */
  async getSupportedTypes() {
    try {
      return await fileTypeConfigAPI.getSupportedTypes()
    } catch (error) {
      console.error('Error fetching supported types:', error)
      return this._getFallbackSupportedTypes()
    }
  }

  /**
   * Check if a file type is supported
   * @param {string} mimeType - MIME type to check
   * @param {string} extension - File extension to check
   * @returns {Promise<boolean>} True if supported
   */
  async isFileTypeSupported(mimeType = null, extension = null) {
    try {
      const config = await this.getConfigForFile(mimeType, extension)
      return config !== null && config.is_enabled !== false
    } catch (error) {
      console.error('Error checking file type support:', error)
      return false
    }
  }

  /**
   * Get maximum file size for a file type
   * @param {string} mimeType - MIME type
   * @param {string} extension - File extension
   * @returns {Promise<number>} Maximum file size in bytes, or 0 if unlimited
   */
  async getMaxFileSize(mimeType = null, extension = null) {
    try {
      const config = await this.getConfigForFile(mimeType, extension)
      return config ? config.max_size_mb * 1024 * 1024 : 0
    } catch (error) {
      console.error('Error getting max file size:', error)
      return 100 * 1024 * 1024 // Default 100MB
    }
  }

  /**
   * Check if a file size is within limits for its type
   * @param {string} mimeType - MIME type
   * @param {string} extension - File extension
   * @param {number} fileSize - File size in bytes
   * @returns {Promise<boolean>} True if within limits
   */
  async isFileSizeAllowed(mimeType, extension, fileSize) {
    try {
      const maxSize = await this.getMaxFileSize(mimeType, extension)
      return maxSize === 0 || fileSize <= maxSize
    } catch (error) {
      console.error('Error checking file size limits:', error)
      return fileSize <= 100 * 1024 * 1024 // Default 100MB limit
    }
  }

  /**
   * Get file type icon class
   * @param {string} mimeType - MIME type
   * @param {string} extension - File extension
   * @returns {Promise<string>} CSS class for file type icon
   */
  async getFileTypeIcon(mimeType = null, extension = null) {
    try {
      const config = await this.getConfigForFile(mimeType, extension)
      return config ? config.icon_class : 'fas fa-file'
    } catch (error) {
      console.error('Error getting file type icon:', error)
      return 'fas fa-file'
    }
  }

  /**
   * Check if a file type is editable
   * @param {string} mimeType - MIME type
   * @param {string} extension - File extension
   * @returns {Promise<boolean>} True if editable
   */
  async isFileTypeEditable(mimeType = null, extension = null) {
    try {
      const config = await this.getConfigForFile(mimeType, extension)
      return config ? config.is_editable : false
    } catch (error) {
      console.error('Error checking if file type is editable:', error)
      return false
    }
  }

  /**
   * Check if a file type is viewable
   * @param {string} mimeType - MIME type
   * @param {string} extension - File extension
   * @returns {Promise<boolean>} True if viewable
   */
  async isFileTypeViewable(mimeType = null, extension = null) {
    try {
      const config = await this.getConfigForFile(mimeType, extension)
      return config ? config.is_viewable : false
    } catch (error) {
      console.error('Error checking if file type is viewable:', error)
      return false
    }
  }

  /**
   * Fallback configurations when backend is unavailable
   * @returns {Array} Static fallback configurations
   */
  _getFallbackConfigs() {
    return [
      {
        id: 1,
        type_name: 'text',
        display_name: 'Text Files',
        mime_types: ['text/plain', 'text/markdown', 'application/json'],
        extensions: ['txt', 'md', 'json'],
        handler_name: 'TextHandler',
        icon_class: 'fas fa-file-alt',
        is_viewable: true,
        is_editable: true,
        max_size_mb: 10,
        is_enabled: true
      },
      {
        id: 2,
        type_name: 'image',
        display_name: 'Images',
        mime_types: ['image/jpeg', 'image/png', 'image/gif'],
        extensions: ['jpg', 'jpeg', 'png', 'gif'],
        handler_name: 'ImageHandler',
        icon_class: 'fas fa-file-image',
        is_viewable: true,
        is_editable: true,
        max_size_mb: 50,
        is_enabled: true
      }
    ]
  }

  /**
   * Fallback configuration for a specific file type
   * @param {string} mimeType - MIME type
   * @param {string} extension - File extension
   * @returns {Object|null} Fallback configuration or null
   */
  _getFallbackConfigForFile(mimeType, extension) {
    const fallbackConfigs = this._getFallbackConfigs()
    
    for (const config of fallbackConfigs) {
      if (mimeType && config.mime_types.includes(mimeType)) {
        return config
      }
      if (extension) {
        const cleanExt = extension.toLowerCase().replace('.', '')
        if (config.extensions.includes(cleanExt)) {
          return config
        }
      }
    }
    
    return null
  }

  /**
   * Fallback supported types summary
   * @returns {Object} Fallback summary
   */
  _getFallbackSupportedTypes() {
    const configs = this._getFallbackConfigs()
    return {
      total_types: configs.length,
      viewable_types: configs.filter(c => c.is_viewable).length,
      editable_types: configs.filter(c => c.is_editable).length,
      mime_types: configs.flatMap(c => c.mime_types),
      extensions: configs.flatMap(c => c.extensions),
      handlers: [...new Set(configs.map(c => c.handler_name))]
    }
  }
}

// Create and export singleton instance
export const fileTypeConfigService = new FileTypeConfigService()
export default fileTypeConfigService