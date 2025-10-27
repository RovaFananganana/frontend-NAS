/**
 * @fileoverview File Handler Service
 * Manages file handlers and provides file processing capabilities
 */

import { detectFileType, isViewableType, isEditableType } from '@/utils/fileTypeDetection.js'
import { 
  getConfigForMimeType, 
  getConfigForExtension, 
  isFileTypeSupported,
  isFileSizeAllowed,
  getMaxFileSize 
} from '@/config/fileTypeConfig.js'

/**
 * Determine the action to take for a file based on its type
 * @param {Object} file - File object with extension and mime_type
 * @returns {string} Action to take: 'open-in-browser', 'open-local', 'preview', 'download'
 */
function getFileAction(file) {
  const ext = file.extension?.toLowerCase() || ''
  const mime = file.mime_type || ''

  // --- PDF ---
  if (ext === 'pdf' || mime === 'application/pdf') {
    return 'open-in-browser'
  }

  // --- Fichiers Office ---
  if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'txt', 'pptx'].includes(ext)) {
    return 'open-local'
  }

  // --- Images ---
  if (mime.startsWith('image/')) {
    return 'preview'
  }

  // --- Vidéos & audio ---
  if (mime.startsWith('video/') || mime.startsWith('audio/')) {
    return 'preview'
  }

  // --- Autres : téléchargement par défaut ---
  return 'download'
}

/**
 * Process file with simplified action-based approach
 * @param {Object} file - File object
 * @returns {Object|void} Result object or void for direct actions
 */
export async function processFileSimple(file) {
  const action = getFileAction(file)
  const backendUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5001'

  switch (action) {
    // --- Ouvrir PDF dans le navigateur ---
    case 'open-in-browser': {
      try {
        // First, get a temporary URL for the file
        const filePath = file.path || file.full_path
        const tempUrlResponse = await fetch(`${backendUrl}/files/temp-url?path=${encodeURIComponent(filePath)}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })
        
        if (tempUrlResponse.ok) {
          const tempUrlData = await tempUrlResponse.json()
          const tempUrl = `${backendUrl}${tempUrlData.temp_url}`
          
          // Now try to check if it's an SMB file
          const contentResponse = await fetch(`${backendUrl}/files/${encodeURIComponent(file.path || file.full_path)}/content`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          })
          
          if (contentResponse.ok) {
            const data = await contentResponse.json()
            
            // If it's an SMB file, handle differently
            if (data.type === 'smb_file') {
              // For PDFs on SMB, try to open SMB path directly
              window.open(data.smb_path, '_blank')
              return {
                type: 'smb-redirect',
                content: `Fichier ouvert via SMB: ${data.smb_path}`,
                metadata: { smbPath: data.smb_path }
              }
            }
          }
          
          // Open with temporary URL
          window.open(tempUrl, '_blank')
          return
        }
        
        // Fallback to FileViewer
        return {
          type: 'viewer',
          url: `${backendUrl}/files/${encodeURIComponent(file.path || file.full_path)}/content`,
          requiresAuth: true
        }
      } catch (error) {
        console.warn('Error getting temp URL:', error)
        // Return for FileViewer to handle
        return {
          type: 'viewer',
          url: `${backendUrl}/files/${encodeURIComponent(file.path || file.full_path)}/content`,
          requiresAuth: true
        }
      }
    }

    // --- Ouvrir document Office avec l'application locale ---
    case 'open-local': {
      // Construire le chemin SMB
      const smbPath = `smb://10.61.17.33/NAS/${(file.path || file.full_path).replace(/^\//, '')}`
      
      // Essayer plusieurs méthodes d'ouverture
      try {
        // Méthode 1: window.open
        window.open(smbPath, '_blank')
        
        // Méthode 2: Protocoles Office
        const ext = file.extension?.toLowerCase()
        if (ext === 'docx' || ext === 'doc') {
          window.location.href = `ms-word:ofe|u|${encodeURIComponent(smbPath)}`
        } else if (ext === 'xlsx' || ext === 'xls') {
          window.location.href = `ms-excel:ofe|u|${encodeURIComponent(smbPath)}`
        } else if (ext === 'pptx' || ext === 'ppt') {
          window.location.href = `ms-powerpoint:ofe|u|${encodeURIComponent(smbPath)}`
        }
        
        return {
          type: 'local-application',
          content: `Document ouvert localement: ${smbPath}`,
          metadata: { smbPath, openedLocally: true }
        }
      } catch (error) {
        console.warn('Erreur ouverture locale:', error)
        // Fallback vers téléchargement
        const downloadUrl = `${backendUrl}/files/${encodeURIComponent(file.path || file.full_path)}/download`
        window.location.href = downloadUrl
        return
      }
    }

    // --- Affichage interne (images, vidéos, etc.) ---
    case 'preview': {
      const contentUrl = `${backendUrl}/files/${encodeURIComponent(file.path || file.full_path)}/content`
      
      try {
        // Check if file is on SMB
        const response = await fetch(contentUrl, { 
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          
          // If it's an SMB file, return SMB info
          if (data.type === 'smb_file') {
            return {
              type: 'smb-file',
              content: data,
              metadata: { 
                smbPath: data.smb_path,
                fileInfo: data.file_info 
              }
            }
          }
        }
      } catch (error) {
        console.warn('Error checking file type for preview:', error)
      }
      
      // Return for authenticated viewer
      return {
        type: 'viewer',
        url: contentUrl,
        requiresAuth: true
      }
    }

    // --- Téléchargement par défaut ---
    case 'download':
    default: {
      const downloadUrl = `${backendUrl}/files/${encodeURIComponent(file.path || file.full_path)}/download`
      window.location.href = downloadUrl
      return
    }
  }
}

/**
 * File Handler Service class
 * Manages registration and execution of file handlers
 */
export class FileHandlerService {
  constructor() {
    /** @type {Map<string, Object>} */
    this.handlers = new Map()
    
    /** @type {Map<string, string>} */
    this.mimeTypeHandlers = new Map()
    
    /** @type {Map<string, string>} */
    this.extensionHandlers = new Map()

    /** @type {boolean} */
    this.initialized = false

    // Initialize with placeholder handlers
    this.initializePlaceholderHandlers()
  }

  /**
   * Initialize placeholder handlers for development
   * These will be replaced by actual handlers in later tasks
   */
  initializePlaceholderHandlers() {
    // Import and register the real TextHandler
    import('../components/FileViewer/handlers/TextHandler.js').then(module => {
      const textHandler = new module.TextHandler()
      this.registerHandler(textHandler)
    }).catch(error => {
      console.warn('Failed to load TextHandler:', error)
      // Fallback to placeholder
      this.registerHandler({
        name: 'TextHandler',
        supportedTypes: ['text/plain', 'text/markdown', 'application/json', 'text/javascript', 'text/css', 'text/html', 'text/xml', 'text/csv', 'text/yaml'],
        supportedExtensions: ['txt', 'md', 'json', 'js', 'css', 'html', 'htm', 'xml', 'csv', 'log', 'ini', 'conf', 'cfg', 'yml', 'yaml'],
        process: async (file) => ({
          type: 'text',
          content: 'Erreur de chargement du gestionnaire de texte',
          editable: true,
          metadata: { placeholder: true, error: true }
        })
      })
    })

    // Import and register the real ImageHandler
    import('../components/FileViewer/handlers/ImageHandler.js').then(module => {
      const imageHandler = new module.ImageHandler()
      this.registerHandler(imageHandler)
    }).catch(error => {
      console.warn('Failed to load ImageHandler:', error)
      // Fallback to placeholder
      this.registerHandler({
        name: 'ImageHandler',
        supportedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/webp', 'image/svg+xml'],
        supportedExtensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'ico'],
        process: async (file) => ({
          type: 'image',
          content: 'Erreur de chargement du gestionnaire d\'image',
          editable: false,
          metadata: { placeholder: true, error: true }
        })
      })
    })

    // PDFHandler temporarily disabled due to worker issues
    // Register a simple fallback that suggests downloading the PDF
    this.registerHandler({
      name: 'PDFHandler',
      supportedTypes: ['application/pdf'],
      supportedExtensions: ['pdf'],
      process: async (file) => ({
        type: 'download-required',
        content: `
          <div class="text-center p-8">
            <div class="text-6xl mb-4 text-error">
              <i class="fas fa-file-pdf"></i>
            </div>
            <h3 class="text-xl font-semibold mb-4">Visualiseur PDF temporairement indisponible</h3>
            <p class="text-base-content/70 mb-6">
              Le visualiseur PDF rencontre des problèmes techniques. Veuillez télécharger le fichier pour le consulter.
            </p>
            <button onclick="window.location.href='http://127.0.0.1:5001/files/${encodeURIComponent(file.path || file.full_path)}/download'" class="btn btn-primary">
              <i class="fas fa-download mr-2"></i>
              Télécharger le PDF
            </button>
          </div>
        `,
        editable: false,
        metadata: { 
          placeholder: true, 
          requiresDownload: true,
          filename: file.name || 'document.pdf'
        }
      })
    })

    // Import and register the real VideoHandler
    import('../components/FileViewer/handlers/VideoHandler.js').then(module => {
      const videoHandler = new module.VideoHandler()
      this.registerHandler(videoHandler)
    }).catch(error => {
      console.warn('Failed to load VideoHandler:', error)
      // Fallback to placeholder
      this.registerHandler({
        name: 'VideoHandler',
        supportedTypes: ['video/mp4', 'video/x-msvideo', 'video/quicktime', 'video/x-ms-wmv', 'video/x-flv', 'video/webm', 'video/x-matroska'],
        supportedExtensions: ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'],
        process: async (file) => ({
          type: 'video',
          content: 'Erreur de chargement du gestionnaire vidéo',
          editable: false,
          metadata: { placeholder: true, error: true }
        })
      })
    })

    // Import and register the real AudioHandler
    import('../components/FileViewer/handlers/AudioHandler.js').then(module => {
      const audioHandler = new module.AudioHandler()
      this.registerHandler(audioHandler)
    }).catch(error => {
      console.warn('Failed to load AudioHandler:', error)
      // Fallback to placeholder
      this.registerHandler({
        name: 'AudioHandler',
        supportedTypes: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/flac', 'audio/aac', 'audio/mp4'],
        supportedExtensions: ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a'],
        process: async (file) => ({
          type: 'audio',
          content: 'Erreur de chargement du gestionnaire audio',
          editable: false,
          metadata: { placeholder: true, error: true }
        })
      })
    })

    // Import and register the real DocumentHandler
    import('../components/FileViewer/handlers/DocumentHandler.js').then(module => {
      const documentHandler = new module.DocumentHandler()
      this.registerHandler(documentHandler)
    }).catch(error => {
      console.warn('Failed to load DocumentHandler:', error)
      // Fallback to placeholder
      this.registerHandler({
        name: 'DocumentHandler',
        supportedTypes: [
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'application/vnd.ms-powerpoint'
        ],
        supportedExtensions: ['docx', 'doc', 'xlsx', 'xls', 'pptx', 'ppt'],
        process: async (file) => ({
          type: 'document',
          content: 'Erreur de chargement du gestionnaire de documents',
          editable: false,
          metadata: { placeholder: true, error: true }
        })
      })
    })

    this.initialized = true
  }

  /**
   * Register a file handler
   * @param {Object} handler - Handler instance implementing FileHandler interface
   */
  registerHandler(handler) {
    if (!handler || !handler.name) {
      throw new Error('Handler must have a name property')
    }

    if (!handler.supportedTypes || !Array.isArray(handler.supportedTypes)) {
      throw new Error('Handler must have supportedTypes array')
    }

    if (!handler.process || typeof handler.process !== 'function') {
      throw new Error('Handler must have a process function')
    }

    // Register handler
    this.handlers.set(handler.name, handler)

    // Map MIME types to handler
    handler.supportedTypes.forEach(mimeType => {
      this.mimeTypeHandlers.set(mimeType, handler.name)
    })

    // Map extensions to handler if provided
    if (handler.supportedExtensions && Array.isArray(handler.supportedExtensions)) {
      handler.supportedExtensions.forEach(extension => {
        this.extensionHandlers.set(extension.toLowerCase(), handler.name)
      })
    }
  }

  /**
   * Get handler for a specific MIME type
   * @param {string} mimeType - MIME type to find handler for
   * @returns {Object|null} Handler instance or null if not found
   */
  getHandlerForMimeType(mimeType) {
    const handlerName = this.mimeTypeHandlers.get(mimeType)
    return handlerName ? this.handlers.get(handlerName) : null
  }

  /**
   * Get handler for a specific file extension
   * @param {string} extension - File extension to find handler for
   * @returns {Object|null} Handler instance or null if not found
   */
  getHandlerForExtension(extension) {
    const cleanExtension = extension.startsWith('.') ? extension.substring(1) : extension
    const handlerName = this.extensionHandlers.get(cleanExtension.toLowerCase())
    return handlerName ? this.handlers.get(handlerName) : null
  }

  /**
   * Get handler for a file with enhanced fallback logic
   * @param {string} filename - Filename to find handler for
   * @param {string} [mimeType] - Optional MIME type
   * @returns {Object|null} Handler instance or null if not found
   */
  getHandlerForFile(filename, mimeType = null) {
    // First, detect file type from filename
    const fileType = detectFileType(filename)
    const detectedMimeType = mimeType || fileType.mimeType

    // Check if file type is supported in configuration
    const config = getConfigForMimeType(detectedMimeType) || getConfigForExtension(fileType.extension)
    
    if (!config) {
      // Try fallback detection with different approaches
      return this.getFallbackHandler(filename, detectedMimeType)
    }

    // Try to get handler by MIME type first
    if (detectedMimeType) {
      const handler = this.getHandlerForMimeType(detectedMimeType)
      if (handler) return handler
    }

    // Try to get handler by extension
    if (fileType.extension) {
      const handler = this.getHandlerForExtension(fileType.extension)
      if (handler) return handler
    }

    // Try configuration-based handler name
    if (config.handler) {
      const handler = this.handlers.get(config.handler)
      if (handler) return handler
    }

    return null
  }

  /**
   * Get fallback handler for unsupported file types
   * @param {string} filename - Filename
   * @param {string} mimeType - MIME type
   * @returns {Object|null} Fallback handler or null
   */
  getFallbackHandler(filename, mimeType) {
    // Try generic text handler for text-like files
    if (mimeType.startsWith('text/') || this.isTextLikeFile(filename)) {
      return this.handlers.get('TextHandler')
    }

    // Try generic image handler for image-like files
    if (mimeType.startsWith('image/')) {
      return this.handlers.get('ImageHandler')
    }

    // Try generic video handler for video-like files
    if (mimeType.startsWith('video/')) {
      return this.handlers.get('VideoHandler')
    }

    // Try generic audio handler for audio-like files
    if (mimeType.startsWith('audio/')) {
      return this.handlers.get('AudioHandler')
    }

    return null
  }

  /**
   * Get multiple fallback handlers for a file type
   * @param {string} filename - Filename
   * @param {string} mimeType - MIME type
   * @returns {Array<Object>} Array of potential fallback handlers
   */
  getFallbackHandlers(filename, mimeType) {
    const fallbacks = []
    
    // Primary fallback based on MIME type
    const primaryFallback = this.getFallbackHandler(filename, mimeType)
    if (primaryFallback) {
      fallbacks.push(primaryFallback)
    }
    
    // Secondary fallbacks based on file characteristics
    if (this.isTextLikeFile(filename) && !fallbacks.some(h => h.name === 'TextHandler')) {
      const textHandler = this.handlers.get('TextHandler')
      if (textHandler) fallbacks.push(textHandler)
    }
    
    // Generic binary file handler (if we had one)
    // For now, we don't have a generic binary handler
    
    return fallbacks
  }

  /**
   * Check if file appears to be text-like based on extension
   * @param {string} filename - Filename to check
   * @returns {boolean} True if appears to be text-like
   */
  isTextLikeFile(filename) {
    const textLikeExtensions = [
      'txt', 'md', 'json', 'xml', 'html', 'htm', 'css', 'js', 'ts',
      'py', 'java', 'c', 'cpp', 'h', 'hpp', 'cs', 'php', 'rb', 'go',
      'rs', 'swift', 'kt', 'scala', 'clj', 'hs', 'ml', 'fs', 'vb',
      'sql', 'sh', 'bat', 'ps1', 'yaml', 'yml', 'toml', 'ini', 'cfg',
      'conf', 'log', 'csv', 'tsv', 'properties', 'gitignore', 'dockerfile'
    ]
    
    const extension = filename.split('.').pop()?.toLowerCase()
    return textLikeExtensions.includes(extension)
  }

  /**
   * Check if a file can be handled with enhanced validation
   * @param {string} filename - Filename to check
   * @param {string} [mimeType] - Optional MIME type
   * @param {number} [fileSize] - Optional file size in bytes
   * @returns {Object} Object with canHandle boolean and reason
   */
  canHandle(filename, mimeType = null, fileSize = null) {
    const fileType = detectFileType(filename)
    const detectedMimeType = mimeType || fileType.mimeType

    // Check if handler exists
    const handler = this.getHandlerForFile(filename, detectedMimeType)
    if (!handler) {
      return {
        canHandle: false,
        reason: 'NO_HANDLER',
        message: 'Aucun gestionnaire disponible pour ce type de fichier'
      }
    }

    // Check file size limits if provided
    if (fileSize !== null && !isFileSizeAllowed(detectedMimeType, fileSize)) {
      const maxSize = getMaxFileSize(detectedMimeType)
      return {
        canHandle: false,
        reason: 'FILE_TOO_LARGE',
        message: `Fichier trop volumineux (max: ${this.formatFileSize(maxSize)})`
      }
    }

    // Check if file type is supported in configuration
    if (!isFileTypeSupported(detectedMimeType)) {
      return {
        canHandle: false,
        reason: 'UNSUPPORTED_TYPE',
        message: 'Type de fichier non supporté'
      }
    }

    return {
      canHandle: true,
      reason: 'SUPPORTED',
      message: 'Fichier supporté',
      handler: handler.name
    }
  }

  /**
   * Format file size for display
   * @param {number} bytes - Size in bytes
   * @returns {string} Formatted size string
   */
  formatFileSize(bytes) {
    if (!bytes) return '0 B'
    
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
  }

  /**
   * Process a file using appropriate handler with enhanced error handling
   * @param {File|Object} file - File object or file info
   * @param {string} [mimeType] - Optional MIME type override
   * @returns {Promise<Object>} FileViewerContent object
   */
  async processFile(file, mimeType = null) {
    try {
      const filename = file.name || file.filename || ''
      const fileSize = file.size || 0
      const detectedMimeType = mimeType || file.type || detectFileType(filename).mimeType

      // Validate file before processing
      const validation = this.canHandle(filename, detectedMimeType, fileSize)
      
      if (!validation.canHandle) {
        return {
          type: 'unsupported',
          error: validation.message,
          editable: false,
          metadata: {
            filename,
            mimeType: detectedMimeType,
            size: fileSize,
            validationReason: validation.reason
          }
        }
      }

      // Find appropriate handler
      const handler = this.getHandlerForFile(filename, detectedMimeType)
      
      if (!handler) {
        return {
          type: 'unsupported',
          error: `Aucun gestionnaire disponible pour le type: ${detectedMimeType}`,
          editable: false,
          metadata: {
            filename,
            mimeType: detectedMimeType,
            size: fileSize
          }
        }
      }

      // Check if handler has process method
      if (!handler.process || typeof handler.process !== 'function') {
        return {
          type: 'unsupported',
          error: `Gestionnaire ${handler.name} non implémenté`,
          editable: false,
          metadata: {
            filename,
            mimeType: detectedMimeType,
            size: fileSize,
            handlerName: handler.name
          }
        }
      }

      // Process file with handler
      const content = await handler.process(file)
      
      // Ensure content has required properties
      return {
        type: content.type || 'unsupported',
        content: content.content,
        url: content.url,
        metadata: {
          filename,
          mimeType: detectedMimeType,
          size: fileSize,
          handlerName: handler.name,
          processedAt: new Date().toISOString(),
          ...content.metadata
        },
        editable: content.editable !== undefined ? content.editable : isEditableType(detectedMimeType),
        error: content.error
      }
    } catch (error) {
      console.error('Error processing file:', error)
      return {
        type: 'unsupported',
        error: `Erreur lors du traitement: ${error.message}`,
        editable: false,
        metadata: {
          filename: file.name || file.filename || 'unknown',
          size: file.size || 0,
          errorDetails: error.stack
        }
      }
    }
  }

  /**
   * Validate file before processing
   * @param {File|Object} file - File to validate
   * @returns {Object} Validation result
   */
  validateFile(file) {
    const filename = file.name || file.filename || ''
    const fileSize = file.size || 0
    const mimeType = file.type || detectFileType(filename).mimeType

    // Basic validation
    if (!filename) {
      return {
        valid: false,
        reason: 'INVALID_FILENAME',
        message: 'Nom de fichier invalide'
      }
    }

    // Size validation (basic check for extremely large files)
    const maxGlobalSize = 1024 * 1024 * 1024 // 1GB global limit
    if (fileSize > maxGlobalSize) {
      return {
        valid: false,
        reason: 'FILE_TOO_LARGE_GLOBAL',
        message: 'Fichier trop volumineux (limite globale: 1GB)'
      }
    }

    // Check if we can handle this file
    const canHandleResult = this.canHandle(filename, mimeType, fileSize)
    
    return {
      valid: canHandleResult.canHandle,
      reason: canHandleResult.reason,
      message: canHandleResult.message,
      handler: canHandleResult.handler
    }
  }

  /**
   * Get list of all registered handlers
   * @returns {Array} Array of handler names
   */
  getRegisteredHandlers() {
    return Array.from(this.handlers.keys())
  }

  /**
   * Get supported MIME types
   * @returns {Array} Array of supported MIME types
   */
  getSupportedMimeTypes() {
    return Array.from(this.mimeTypeHandlers.keys())
  }

  /**
   * Get supported file extensions
   * @returns {Array} Array of supported file extensions
   */
  getSupportedExtensions() {
    return Array.from(this.extensionHandlers.keys())
  }
}

// Create singleton instance
export const fileHandlerService = new FileHandlerService()

// Export for use in other modules
export default fileHandlerService