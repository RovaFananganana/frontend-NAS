/**
 * @fileoverview File type detection utilities
 * Provides functions to detect file types based on extensions and MIME types
 */

/**
 * MIME type mappings for common file extensions
 */
export const MIME_TYPE_MAP = {
  // Text files
  'txt': 'text/plain',
  'md': 'text/markdown',
  'json': 'application/json',
  'js': 'text/javascript',
  'css': 'text/css',
  'html': 'text/html',
  'htm': 'text/html',
  'xml': 'text/xml',
  'csv': 'text/csv',
  'log': 'text/plain',
  'ini': 'text/plain',
  'conf': 'text/plain',
  'cfg': 'text/plain',
  'yml': 'text/yaml',
  'yaml': 'text/yaml',
  
  // Images
  'jpg': 'image/jpeg',
  'jpeg': 'image/jpeg',
  'png': 'image/png',
  'gif': 'image/gif',
  'bmp': 'image/bmp',
  'webp': 'image/webp',
  'svg': 'image/svg+xml',
  'ico': 'image/x-icon',
  
  // Videos
  'mp4': 'video/mp4',
  'avi': 'video/x-msvideo',
  'mov': 'video/quicktime',
  'wmv': 'video/x-ms-wmv',
  'flv': 'video/x-flv',
  'webm': 'video/webm',
  'mkv': 'video/x-matroska',
  
  // Audio
  'mp3': 'audio/mpeg',
  'wav': 'audio/wav',
  'ogg': 'audio/ogg',
  'flac': 'audio/flac',
  'aac': 'audio/aac',
  'm4a': 'audio/mp4',
  
  // Documents
  'pdf': 'application/pdf',
  'doc': 'application/msword',
  'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'xls': 'application/vnd.ms-excel',
  'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'ppt': 'application/vnd.ms-powerpoint',
  'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  
  // Archives
  'zip': 'application/zip',
  'rar': 'application/x-rar-compressed',
  '7z': 'application/x-7z-compressed',
  'tar': 'application/x-tar',
  'gz': 'application/gzip'
}

/**
 * File type categories based on MIME types
 */
export const FILE_TYPE_CATEGORIES = {
  text: [
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
  image: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/bmp',
    'image/webp',
    'image/svg+xml',
    'image/x-icon'
  ],
  video: [
    'video/mp4',
    'video/x-msvideo',
    'video/quicktime',
    'video/x-ms-wmv',
    'video/x-flv',
    'video/webm',
    'video/x-matroska'
  ],
  audio: [
    'audio/mpeg',
    'audio/wav',
    'audio/ogg',
    'audio/flac',
    'audio/aac',
    'audio/mp4'
  ],
  pdf: [
    'application/pdf'
  ]
}

/**
 * Extract file extension from filename
 * @param {string} filename - The filename to extract extension from
 * @returns {string} The file extension in lowercase
 */
export function getFileExtension(filename) {
  if (!filename || typeof filename !== 'string') {
    return ''
  }
  
  const lastDotIndex = filename.lastIndexOf('.')
  if (lastDotIndex === -1 || lastDotIndex === filename.length - 1) {
    return ''
  }
  
  return filename.substring(lastDotIndex + 1).toLowerCase()
}

/**
 * Get MIME type from file extension
 * @param {string} extension - File extension (with or without dot)
 * @returns {string} MIME type or 'application/octet-stream' if unknown
 */
export function getMimeTypeFromExtension(extension) {
  if (!extension) {
    return 'application/octet-stream'
  }
  
  // Remove leading dot if present
  const cleanExtension = extension.startsWith('.') ? extension.substring(1) : extension
  const lowerExtension = cleanExtension.toLowerCase()
  
  return MIME_TYPE_MAP[lowerExtension] || 'application/octet-stream'
}

/**
 * Get file type category from MIME type
 * @param {string} mimeType - MIME type to categorize
 * @returns {string} File type category ('text', 'image', 'video', 'audio', 'pdf', 'unsupported')
 */
export function getFileTypeCategory(mimeType) {
  if (!mimeType) {
    return 'unsupported'
  }
  
  for (const [category, mimeTypes] of Object.entries(FILE_TYPE_CATEGORIES)) {
    if (mimeTypes.includes(mimeType)) {
      return category
    }
  }
  
  return 'unsupported'
}

/**
 * Detect file type from filename
 * @param {string} filename - The filename to analyze
 * @returns {Object} Object containing extension, mimeType, and category
 */
export function detectFileType(filename) {
  const extension = getFileExtension(filename)
  const mimeType = getMimeTypeFromExtension(extension)
  const category = getFileTypeCategory(mimeType)
  
  return {
    extension,
    mimeType,
    category
  }
}

/**
 * Check if file type is viewable in the file viewer
 * @param {string} mimeType - MIME type to check
 * @returns {boolean} True if file can be viewed
 */
export function isViewableType(mimeType) {
  const category = getFileTypeCategory(mimeType)
  return ['text', 'image', 'video', 'audio', 'pdf'].includes(category)
}

/**
 * Check if file type is editable
 * @param {string} mimeType - MIME type to check
 * @returns {boolean} True if file can be edited
 */
export function isEditableType(mimeType) {
  const category = getFileTypeCategory(mimeType)
  return category === 'text'
}

/**
 * Get appropriate icon class for file type
 * @param {string} mimeType - MIME type
 * @returns {string} CSS class for file type icon
 */
export function getFileTypeIcon(mimeType) {
  const category = getFileTypeCategory(mimeType)
  
  const iconMap = {
    text: 'fas fa-file-alt',
    image: 'fas fa-file-image',
    video: 'fas fa-file-video',
    audio: 'fas fa-file-audio',
    pdf: 'fas fa-file-pdf',
    unsupported: 'fas fa-file'
  }
  
  return iconMap[category] || iconMap.unsupported
}