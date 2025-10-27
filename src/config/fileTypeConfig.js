/**
 * @fileoverview File type configuration
 * Defines supported file types and their properties
 * Now integrates with backend configuration service
 */

import { FILE_TYPES } from '@/types/fileViewer.js'
import { fileTypeConfigService } from '@/services/fileTypeConfigService.js'

/**
 * Configuration for different file types
 * @type {Array<Object>} Array of FileTypeConfig objects
 */
export const FILE_TYPE_CONFIGS = [
  // Text files
  {
    type: FILE_TYPES.TEXT,
    mimeTypes: [
      'text/plain',
      'text/markdown',
      'application/json',
      'text/javascript',
      'text/css',
      'text/html',
      'text/xml',
      'text/csv',
      'text/yaml'
    ],
    extensions: [
      'txt', 'md', 'json', 'js', 'css', 'html', 'htm', 
      'xml', 'csv', 'log', 'ini', 'conf', 'cfg', 'yml', 'yaml'
    ],
    icon: 'fas fa-file-alt',
    handler: 'TextHandler',
    viewable: true,
    editable: true,
    settings: {
      maxSize: 10 * 1024 * 1024, // 10MB
      encoding: 'utf-8',
      lineNumbers: true,
      wordWrap: true
    }
  },

  // Image files
  {
    type: FILE_TYPES.IMAGE,
    mimeTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/bmp',
      'image/webp',
      'image/svg+xml',
      'image/x-icon'
    ],
    extensions: [
      'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'ico'
    ],
    icon: 'fas fa-file-image',
    handler: 'ImageHandler',
    viewable: true,
    editable: false,
    settings: {
      maxSize: 50 * 1024 * 1024, // 50MB
      thumbnailSize: 200,
      zoomEnabled: true,
      rotationEnabled: true
    }
  },

  // Video files
  {
    type: FILE_TYPES.VIDEO,
    mimeTypes: [
      'video/mp4',
      'video/x-msvideo',
      'video/quicktime',
      'video/x-ms-wmv',
      'video/x-flv',
      'video/webm',
      'video/x-matroska'
    ],
    extensions: [
      'mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'
    ],
    icon: 'fas fa-file-video',
    handler: 'VideoHandler',
    viewable: true,
    editable: false,
    settings: {
      maxSize: 500 * 1024 * 1024, // 500MB
      autoplay: false,
      controls: true,
      preload: 'metadata'
    }
  },

  // Audio files
  {
    type: FILE_TYPES.AUDIO,
    mimeTypes: [
      'audio/mpeg',
      'audio/wav',
      'audio/ogg',
      'audio/flac',
      'audio/aac',
      'audio/mp4'
    ],
    extensions: [
      'mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a'
    ],
    icon: 'fas fa-file-audio',
    handler: 'AudioHandler',
    viewable: true,
    editable: false,
    settings: {
      maxSize: 100 * 1024 * 1024, // 100MB
      autoplay: false,
      controls: true,
      preload: 'metadata'
    }
  },

  // PDF files
  {
    type: FILE_TYPES.PDF,
    mimeTypes: [
      'application/pdf'
    ],
    extensions: [
      'pdf'
    ],
    icon: 'fas fa-file-pdf',
    handler: 'PDFHandler',
    viewable: true,
    editable: false,
    settings: {
      maxSize: 100 * 1024 * 1024, // 100MB
      pageNavigation: true,
      zoom: true,
      search: true
    }
  },

  // Word documents
  {
    type: FILE_TYPES.WORD,
    mimeTypes: [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/msword' // .doc
    ],
    extensions: [
      'docx', 'doc'
    ],
    icon: 'fas fa-file-word',
    handler: 'DocumentHandler',
    viewable: true,
    editable: true,
    settings: {
      maxSize: 100 * 1024 * 1024, // 100MB
      preserveFormatting: true,
      enableEditing: true,
      zoom: true
    }
  },

  // Excel spreadsheets
  {
    type: FILE_TYPES.EXCEL,
    mimeTypes: [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel' // .xls
    ],
    extensions: [
      'xlsx', 'xls'
    ],
    icon: 'fas fa-file-excel',
    handler: 'DocumentHandler',
    viewable: true,
    editable: true,
    settings: {
      maxSize: 100 * 1024 * 1024, // 100MB
      sheetNavigation: true,
      formulaSupport: true,
      enableEditing: true,
      zoom: true
    }
  },

  // PowerPoint presentations
  {
    type: FILE_TYPES.POWERPOINT,
    mimeTypes: [
      'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
      'application/vnd.ms-powerpoint' // .ppt
    ],
    extensions: [
      'pptx', 'ppt'
    ],
    icon: 'fas fa-file-powerpoint',
    handler: 'DocumentHandler',
    viewable: true,
    editable: true, // Now enabled with basic editing support
    settings: {
      maxSize: 100 * 1024 * 1024, // 100MB
      slideNavigation: true,
      fullscreenMode: true,
      notesDisplay: true,
      zoom: true,
      enableEditing: true
    }
  }
]

/**
 * Get configuration for a specific file type
 * @param {string} type - File type to get config for
 * @returns {Object|null} Configuration object or null if not found
 */
export function getFileTypeConfig(type) {
  return FILE_TYPE_CONFIGS.find(config => config.type === type) || null
}

/**
 * Get configuration for a MIME type
 * @param {string} mimeType - MIME type to get config for
 * @returns {Object|null} Configuration object or null if not found
 */
export function getConfigForMimeType(mimeType) {
  return FILE_TYPE_CONFIGS.find(config => 
    config.mimeTypes.includes(mimeType)
  ) || null
}

/**
 * Get configuration for a file extension
 * @param {string} extension - File extension to get config for
 * @returns {Object|null} Configuration object or null if not found
 */
export function getConfigForExtension(extension) {
  const cleanExtension = extension.startsWith('.') ? extension.substring(1) : extension
  return FILE_TYPE_CONFIGS.find(config => 
    config.extensions.includes(cleanExtension.toLowerCase())
  ) || null
}

/**
 * Check if a file type is supported
 * @param {string} mimeType - MIME type to check
 * @returns {boolean} True if supported
 */
export function isFileTypeSupported(mimeType) {
  return getConfigForMimeType(mimeType) !== null
}

/**
 * Get all supported MIME types
 * @returns {Array<string>} Array of supported MIME types
 */
export function getSupportedMimeTypes() {
  return FILE_TYPE_CONFIGS.flatMap(config => config.mimeTypes)
}

/**
 * Get all supported file extensions
 * @returns {Array<string>} Array of supported file extensions
 */
export function getSupportedExtensions() {
  return FILE_TYPE_CONFIGS.flatMap(config => config.extensions)
}

/**
 * Get maximum file size for a MIME type
 * @param {string} mimeType - MIME type to check
 * @returns {number} Maximum file size in bytes, or 0 if unlimited
 */
export function getMaxFileSize(mimeType) {
  const config = getConfigForMimeType(mimeType)
  return config?.settings?.maxSize || 0
}

/**
 * Check if a file size is within limits for its type
 * @param {string} mimeType - MIME type
 * @param {number} fileSize - File size in bytes
 * @returns {boolean} True if within limits
 */
export function isFileSizeAllowed(mimeType, fileSize) {
  const maxSize = getMaxFileSize(mimeType)
  return maxSize === 0 || fileSize <= maxSize
}

/**
 * Dynamic configuration functions that use the backend service
 */

/**
 * Get configuration for a specific file type (async version)
 * @param {string} type - File type to get config for
 * @returns {Promise<Object|null>} Configuration object or null if not found
 */
export async function getFileTypeConfigAsync(type) {
  try {
    const configs = await fileTypeConfigService.getAllConfigs()
    return configs.find(config => config.type_name === type) || null
  } catch (error) {
    console.error('Error getting file type config:', error)
    return getFileTypeConfig(type) // Fallback to static config
  }
}

/**
 * Get configuration for a MIME type (async version)
 * @param {string} mimeType - MIME type to get config for
 * @returns {Promise<Object|null>} Configuration object or null if not found
 */
export async function getConfigForMimeTypeAsync(mimeType) {
  try {
    return await fileTypeConfigService.getConfigForFile(mimeType)
  } catch (error) {
    console.error('Error getting config for MIME type:', error)
    return getConfigForMimeType(mimeType) // Fallback to static config
  }
}

/**
 * Get configuration for a file extension (async version)
 * @param {string} extension - File extension to get config for
 * @returns {Promise<Object|null>} Configuration object or null if not found
 */
export async function getConfigForExtensionAsync(extension) {
  try {
    return await fileTypeConfigService.getConfigForFile(null, extension)
  } catch (error) {
    console.error('Error getting config for extension:', error)
    return getConfigForExtension(extension) // Fallback to static config
  }
}

/**
 * Check if a file type is supported (async version)
 * @param {string} mimeType - MIME type to check
 * @param {string} extension - File extension to check
 * @returns {Promise<boolean>} True if supported
 */
export async function isFileTypeSupportedAsync(mimeType = null, extension = null) {
  try {
    return await fileTypeConfigService.isFileTypeSupported(mimeType, extension)
  } catch (error) {
    console.error('Error checking file type support:', error)
    return mimeType ? isFileTypeSupported(mimeType) : false
  }
}

/**
 * Get maximum file size for a MIME type (async version)
 * @param {string} mimeType - MIME type to check
 * @param {string} extension - File extension to check
 * @returns {Promise<number>} Maximum file size in bytes, or 0 if unlimited
 */
export async function getMaxFileSizeAsync(mimeType = null, extension = null) {
  try {
    return await fileTypeConfigService.getMaxFileSize(mimeType, extension)
  } catch (error) {
    console.error('Error getting max file size:', error)
    return mimeType ? getMaxFileSize(mimeType) : 0
  }
}

/**
 * Check if a file size is within limits for its type (async version)
 * @param {string} mimeType - MIME type
 * @param {string} extension - File extension
 * @param {number} fileSize - File size in bytes
 * @returns {Promise<boolean>} True if within limits
 */
export async function isFileSizeAllowedAsync(mimeType, extension, fileSize) {
  try {
    return await fileTypeConfigService.isFileSizeAllowed(mimeType, extension, fileSize)
  } catch (error) {
    console.error('Error checking file size limits:', error)
    return mimeType ? isFileSizeAllowed(mimeType, fileSize) : false
  }
}

/**
 * Validate a file against configuration rules
 * @param {Object} fileData - File data to validate
 * @returns {Promise<Object>} Validation result
 */
export async function validateFileAsync(fileData) {
  try {
    return await fileTypeConfigService.validateFile(fileData)
  } catch (error) {
    console.error('Error validating file:', error)
    return {
      valid: false,
      error: 'Validation service unavailable',
      config: null
    }
  }
}