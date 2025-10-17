/**
 * ClipboardService - Handles system clipboard operations using modern Clipboard API
 * Supports pasting files from Windows Explorer and copying NAS files to system clipboard
 */

import { reactive } from 'vue'
import { uploadService } from './uploadService.js'
import { nasAPI } from './nasAPI.js'

class ClipboardService {
  constructor() {
    // Reactive state for clipboard operations
    this.state = reactive({
      isSupported: false,
      hasFiles: false,
      isPasting: false,
      error: null,
      lastPasteTime: null
    })

    // Check browser support for Clipboard API
    this.checkSupport()
  }

  /**
   * Check if the browser supports the Clipboard API with file operations
   */
  checkSupport() {
    try {
      // Check for basic Clipboard API support
      const hasClipboardAPI = 'clipboard' in navigator

      // Check for read permission (needed for paste operations)
      const hasReadSupport = hasClipboardAPI && 'read' in navigator.clipboard

      // Check for write permission (needed for copy operations)  
      const hasWriteSupport = hasClipboardAPI && 'write' in navigator.clipboard

      this.state.isSupported = hasClipboardAPI && hasReadSupport && hasWriteSupport

      console.log('ClipboardService: Browser support check', {
        hasClipboardAPI,
        hasReadSupport,
        hasWriteSupport,
        isSupported: this.state.isSupported
      })

    } catch (error) {
      console.warn('ClipboardService: Error checking browser support:', error)
      this.state.isSupported = false
    }
  }

  /**
   * Check if clipboard contains files that can be pasted
   * @returns {Promise<boolean>}
   */
  async hasFilesInClipboard() {
    if (!this.state.isSupported) {
      return false
    }

    try {
      // Request clipboard read permission
      const permission = await navigator.permissions.query({ name: 'clipboard-read' })

      if (permission.state === 'denied') {
        console.warn('ClipboardService: Clipboard read permission denied')
        return false
      }

      // Read clipboard contents
      const clipboardItems = await navigator.clipboard.read()

      // Check if any clipboard item contains files
      for (const item of clipboardItems) {
        for (const type of item.types) {
          // Look for file types (images, documents, etc.)
          if (type.startsWith('image/') ||
            type.startsWith('application/') ||
            type.startsWith('text/') ||
            type === 'Files') {
            this.state.hasFiles = true
            return true
          }
        }
      }

      this.state.hasFiles = false
      return false

    } catch (error) {
      console.warn('ClipboardService: Error checking clipboard contents:', error)
      this.state.error = error.message
      this.state.hasFiles = false
      return false
    }
  }

  /**
   * Paste files from system clipboard to NAS directory
   * @param {string} targetPath - Target directory path in NAS
   * @returns {Promise<{success: boolean, files?: File[], error?: string}>}
   */
  async pasteFiles(targetPath) {
    if (!this.state.isSupported) {
      const error = 'Clipboard API not supported in this browser'
      this.state.error = error
      return { success: false, error }
    }

    if (!targetPath) {
      const error = 'Target path is required'
      this.state.error = error
      return { success: false, error }
    }

    this.state.isPasting = true
    this.state.error = null

    try {
      console.log('ClipboardService: Starting paste operation to', targetPath)

      // First try to read clipboard items (for files/images)
      try {
        const clipboardItems = await navigator.clipboard.read()

        if (clipboardItems && clipboardItems.length > 0) {
          const result = await this.processClipboardItems(clipboardItems, targetPath)
          if (result.success) {
            return result
          }
        }
      } catch (readError) {
        console.log('ClipboardService: Failed to read clipboard items, trying text fallback:', readError.message)
      }

      // Fallback: try to read as text
      try {
        const text = await navigator.clipboard.readText()
        if (text && text.trim()) {
          return await this.processClipboardText(text, targetPath)
        }
      } catch (textError) {
        console.log('ClipboardService: Failed to read clipboard text:', textError.message)
      }

      throw new Error('No supported content found in clipboard. Try copying files from Windows Explorer or images from other applications.')

    } catch (error) {
      console.error('ClipboardService: Paste operation failed:', error)
      this.state.error = error.message

      return {
        success: false,
        error: error.message
      }

    } finally {
      this.state.isPasting = false
    }
  }

  /**
   * Process clipboard items (files, images, etc.)
   */
  async processClipboardItems(clipboardItems, targetPath) {
    const files = []

    for (const item of clipboardItems) {
      console.log('ClipboardService: Processing clipboard item with types:', item.types)

      // Process each type in the clipboard item
      for (const type of item.types) {
        try {
          if (type.startsWith('image/') ||
            type.startsWith('application/') ||
            type === 'text/plain') {

            const blob = await item.getType(type)

            if (blob && blob.size > 0) {
              const fileName = this.generateFileName(type, blob.size)
              const file = new File([blob], fileName, { type })
              files.push(file)

              console.log('ClipboardService: Extracted file:', {
                name: fileName,
                type,
                size: blob.size
              })
            }
          }
        } catch (typeError) {
          console.warn('ClipboardService: Error processing type', type, typeError)
        }
      }
    }

    if (files.length === 0) {
      return { success: false, error: 'No files found in clipboard items' }
    }

    // Upload files
    console.log('ClipboardService: Uploading', files.length, 'files to', targetPath)

    const uploadIds = uploadService.addFiles(files, targetPath, {
      overwrite: false,
      maxRetries: 3
    })

    this.state.lastPasteTime = Date.now()

    return {
      success: true,
      files,
      uploadIds,
      message: `Started uploading ${files.length} file${files.length > 1 ? 's' : ''} from clipboard`
    }
  }

  /**
   * Process clipboard text content
   */
  async processClipboardText(text, targetPath) {
    try {
      // Create a text file from clipboard content
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const fileName = `clipboard-text-${timestamp}.txt`
      const file = new File([text], fileName, { type: 'text/plain' })

      console.log('ClipboardService: Creating text file from clipboard:', fileName)

      const uploadIds = uploadService.addFiles([file], targetPath, {
        overwrite: false,
        maxRetries: 3
      })

      this.state.lastPasteTime = Date.now()

      return {
        success: true,
        files: [file],
        uploadIds,
        message: `Created text file "${fileName}" from clipboard content`
      }

    } catch (error) {
      return {
        success: false,
        error: `Failed to create text file: ${error.message}`
      }
    }
  }

  /**
   * Copy NAS files to system clipboard for external paste
   * Note: Browser clipboard API limitations mean this works best for images and text files
   * @param {Array} filePaths - Array of NAS file paths to copy
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async copyFilesToClipboard(filePaths) {
    if (!this.state.isSupported) {
      const error = 'Clipboard API not supported in this browser'
      this.state.error = error
      return { success: false, error }
    }

    if (!filePaths || filePaths.length === 0) {
      const error = 'No files specified to copy'
      this.state.error = error
      return { success: false, error }
    }

    try {
      console.log('ClipboardService: Copying', filePaths.length, 'files to clipboard')

      // For now, we'll focus on the first file due to clipboard API limitations
      const filePath = filePaths[0]
      const fileName = nasAPI.getFilename(filePath)
      const mimeType = this.getMimeTypeFromFileName(fileName)

      console.log('ClipboardService: Processing file:', { fileName, mimeType })

      // Special handling for different file types
      if (mimeType.startsWith('image/')) {
        // Images work well with clipboard API
        return await this.copyImageToClipboard(filePath, mimeType)
      } else if (mimeType === 'text/plain') {
        // Text files can be copied as text
        return await this.copyTextFileToClipboard(filePath)
      } else {
        // For other file types, we'll copy the file path as text
        // This is a limitation of the browser clipboard API
        return await this.copyFilePathAsText(filePath, fileName)
      }

    } catch (error) {
      console.error('ClipboardService: Copy operation failed:', error)
      this.state.error = error.message

      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Copy image file to clipboard
   */
  async copyImageToClipboard(filePath, mimeType) {
    try {
      const response = await nasAPI.downloadFileAsBlob(filePath)

      if (response && response.blob) {
        const clipboardItem = new ClipboardItem({
          [mimeType]: response.blob
        })

        await navigator.clipboard.write([clipboardItem])

        return {
          success: true,
          message: `Image copied to clipboard. You can paste it in other applications.`
        }
      } else {
        throw new Error('Failed to download image file')
      }
    } catch (error) {
      throw new Error(`Failed to copy image: ${error.message}`)
    }
  }

  /**
   * Copy text file content to clipboard
   */
  async copyTextFileToClipboard(filePath) {
    try {
      const response = await nasAPI.downloadFileAsBlob(filePath)

      if (response && response.blob) {
        const text = await response.blob.text()
        await navigator.clipboard.writeText(text)

        return {
          success: true,
          message: `Text file content copied to clipboard.`
        }
      } else {
        throw new Error('Failed to download text file')
      }
    } catch (error) {
      throw new Error(`Failed to copy text file: ${error.message}`)
    }
  }

  /**
   * Copy file path as text (fallback for unsupported file types)
   */
  async copyFilePathAsText(filePath, fileName) {
    try {
      const fileInfo = `File: ${fileName}\nPath: ${filePath}\nSource: NAS System`
      await navigator.clipboard.writeText(fileInfo)

      return {
        success: true,
        message: `File information copied to clipboard as text. Note: Browser limitations prevent copying binary files directly.`
      }
    } catch (error) {
      throw new Error(`Failed to copy file information: ${error.message}`)
    }
  }

  /**
   * Generate a filename for clipboard content based on MIME type
   * @param {string} mimeType - MIME type of the content
   * @param {number} size - Size of the content in bytes
   * @returns {string}
   */
  generateFileName(mimeType, size) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')

    // Map common MIME types to extensions
    const extensionMap = {
      'image/png': 'png',
      'image/jpeg': 'jpg',
      'image/gif': 'gif',
      'image/webp': 'webp',
      'image/svg+xml': 'svg',
      'text/plain': 'txt',
      'text/html': 'html',
      'application/pdf': 'pdf',
      'application/json': 'json',
      'application/xml': 'xml',
      'application/zip': 'zip',
      'application/octet-stream': 'bin'
    }

    const extension = extensionMap[mimeType] || 'dat'
    const sizeKB = Math.round(size / 1024)

    return `clipboard-${timestamp}-${sizeKB}kb.${extension}`
  }

  /**
   * Get MIME type from filename extension
   * @param {string} fileName - Name of the file
   * @returns {string}
   */
  getMimeTypeFromFileName(fileName) {
    const extension = fileName.split('.').pop()?.toLowerCase()

    const mimeMap = {
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'svg': 'image/svg+xml',
      'txt': 'text/plain',
      'html': 'text/html',
      'htm': 'text/html',
      'pdf': 'application/pdf',
      'json': 'application/json',
      'xml': 'application/xml',
      'zip': 'application/zip',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    }

    return mimeMap[extension] || 'application/octet-stream'
  }

  /**
   * Clear clipboard error state
   */
  clearError() {
    this.state.error = null
  }

  /**
   * Get current clipboard state
   * @returns {Object}
   */
  getState() {
    return {
      isSupported: this.state.isSupported,
      hasFiles: this.state.hasFiles,
      isPasting: this.state.isPasting,
      error: this.state.error,
      lastPasteTime: this.state.lastPasteTime
    }
  }
}

// Create and export singleton instance
export const clipboardService = new ClipboardService()
export default clipboardService