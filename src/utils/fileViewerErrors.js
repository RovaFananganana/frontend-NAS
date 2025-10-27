/**
 * @fileoverview File Viewer Error Classes
 * Defines error types and handling for the file viewer system
 */

/**
 * Base error class for file viewer operations
 */
export class FileViewerError extends Error {
  constructor(message, code, details = {}) {
    super(message)
    this.name = 'FileViewerError'
    this.code = code
    this.details = details
    this.timestamp = new Date().toISOString()
  }

  /**
   * Convert error to user-friendly message
   * @returns {string} User-friendly error message
   */
  toUserMessage() {
    const messages = {
      'UNSUPPORTED_TYPE': 'Ce type de fichier n\'est pas supporté pour la prévisualisation.',
      'FILE_TOO_LARGE': 'Le fichier est trop volumineux pour être ouvert.',
      'CONVERSION_FAILED': 'Erreur lors de la conversion du fichier.',
      'NETWORK_ERROR': 'Erreur de réseau lors du chargement du fichier.',
      'PERMISSION_DENIED': 'Vous n\'avez pas les permissions pour accéder à ce fichier.',
      'HANDLER_NOT_FOUND': 'Aucun gestionnaire disponible pour ce type de fichier.',
      'PROCESSING_ERROR': 'Erreur lors du traitement du fichier.',
      'SAVE_ERROR': 'Erreur lors de la sauvegarde du fichier.',
      'VALIDATION_ERROR': 'Le fichier ne respecte pas les critères de validation.',
      'TIMEOUT_ERROR': 'Le traitement du fichier a pris trop de temps.',
      'MEMORY_ERROR': 'Mémoire insuffisante pour traiter ce fichier.',
      'CORRUPTED_FILE': 'Le fichier semble être corrompu ou endommagé.'
    }
    
    return messages[this.code] || this.message || 'Une erreur inattendue s\'est produite.'
  }

  /**
   * Get suggested actions for the error
   * @returns {Array<Object>} Array of suggested actions
   */
  getSuggestedActions() {
    const actions = {
      'UNSUPPORTED_TYPE': [
        { label: 'Télécharger le fichier', action: 'download' },
        { label: 'Voir les types supportés', action: 'show_supported_types' }
      ],
      'FILE_TOO_LARGE': [
        { label: 'Télécharger le fichier', action: 'download' },
        { label: 'Réduire la taille du fichier', action: 'compress_file' }
      ],
      'CONVERSION_FAILED': [
        { label: 'Réessayer', action: 'retry' },
        { label: 'Télécharger le fichier original', action: 'download' }
      ],
      'NETWORK_ERROR': [
        { label: 'Réessayer', action: 'retry' },
        { label: 'Vérifier la connexion', action: 'check_connection' }
      ],
      'PERMISSION_DENIED': [
        { label: 'Demander l\'accès', action: 'request_access' },
        { label: 'Se connecter', action: 'login' }
      ],
      'CORRUPTED_FILE': [
        { label: 'Télécharger à nouveau', action: 'redownload' },
        { label: 'Vérifier le fichier source', action: 'check_source' }
      ]
    }
    
    return actions[this.code] || [
      { label: 'Réessayer', action: 'retry' },
      { label: 'Télécharger le fichier', action: 'download' }
    ]
  }
}

/**
 * Error for unsupported file types
 */
export class UnsupportedFileTypeError extends FileViewerError {
  constructor(fileType, supportedTypes = []) {
    super(
      `Type de fichier non supporté: ${fileType}`,
      'UNSUPPORTED_TYPE',
      { fileType, supportedTypes }
    )
    this.name = 'UnsupportedFileTypeError'
  }
}

/**
 * Error for files that are too large
 */
export class FileTooLargeError extends FileViewerError {
  constructor(fileSize, maxSize) {
    super(
      `Fichier trop volumineux: ${fileSize} bytes (max: ${maxSize} bytes)`,
      'FILE_TOO_LARGE',
      { fileSize, maxSize }
    )
    this.name = 'FileTooLargeError'
  }
}

/**
 * Error for file conversion failures
 */
export class ConversionError extends FileViewerError {
  constructor(message, originalError = null) {
    super(
      `Erreur de conversion: ${message}`,
      'CONVERSION_FAILED',
      { originalError: originalError?.message }
    )
    this.name = 'ConversionError'
  }
}

/**
 * Error for network-related issues
 */
export class NetworkError extends FileViewerError {
  constructor(message, status = null) {
    super(
      `Erreur réseau: ${message}`,
      'NETWORK_ERROR',
      { status }
    )
    this.name = 'NetworkError'
  }
}

/**
 * Error for permission-related issues
 */
export class PermissionError extends FileViewerError {
  constructor(message = 'Accès refusé') {
    super(message, 'PERMISSION_DENIED')
    this.name = 'PermissionError'
  }
}

/**
 * Error for handler-related issues
 */
export class HandlerError extends FileViewerError {
  constructor(handlerName, message) {
    super(
      `Erreur du gestionnaire ${handlerName}: ${message}`,
      'HANDLER_NOT_FOUND',
      { handlerName }
    )
    this.name = 'HandlerError'
  }
}

/**
 * Error for file processing issues
 */
export class ProcessingError extends FileViewerError {
  constructor(message, stage = 'unknown') {
    super(
      `Erreur de traitement: ${message}`,
      'PROCESSING_ERROR',
      { stage }
    )
    this.name = 'ProcessingError'
  }
}

/**
 * Error for save operations
 */
export class SaveError extends FileViewerError {
  constructor(message) {
    super(
      `Erreur de sauvegarde: ${message}`,
      'SAVE_ERROR'
    )
    this.name = 'SaveError'
  }
}

/**
 * Error for validation failures
 */
export class ValidationError extends FileViewerError {
  constructor(message, validationDetails = {}) {
    super(
      `Erreur de validation: ${message}`,
      'VALIDATION_ERROR',
      validationDetails
    )
    this.name = 'ValidationError'
  }
}

/**
 * Error for timeout issues
 */
export class TimeoutError extends FileViewerError {
  constructor(operation, timeout) {
    super(
      `Timeout lors de l'opération: ${operation} (${timeout}ms)`,
      'TIMEOUT_ERROR',
      { operation, timeout }
    )
    this.name = 'TimeoutError'
  }
}

/**
 * Error for memory issues
 */
export class MemoryError extends FileViewerError {
  constructor(message = 'Mémoire insuffisante') {
    super(message, 'MEMORY_ERROR')
    this.name = 'MemoryError'
  }
}

/**
 * Error for corrupted files
 */
export class CorruptedFileError extends FileViewerError {
  constructor(message = 'Fichier corrompu ou endommagé') {
    super(message, 'CORRUPTED_FILE')
    this.name = 'CorruptedFileError'
  }
}

/**
 * Utility function to create appropriate error from generic error
 * @param {Error} error - Original error
 * @param {string} context - Context where error occurred
 * @returns {FileViewerError} Appropriate FileViewerError instance
 */
export function createFileViewerError(error, context = 'unknown') {
  if (error instanceof FileViewerError) {
    return error
  }

  // Map common error patterns to specific error types
  const message = error.message || error.toString()
  
  if (message.includes('network') || message.includes('fetch')) {
    return new NetworkError(message)
  }
  
  if (message.includes('permission') || message.includes('access')) {
    return new PermissionError(message)
  }
  
  if (message.includes('timeout')) {
    return new TimeoutError(context, 30000)
  }
  
  if (message.includes('memory') || message.includes('heap')) {
    return new MemoryError(message)
  }
  
  if (message.includes('corrupt') || message.includes('invalid')) {
    return new CorruptedFileError(message)
  }
  
  // Default to processing error
  return new ProcessingError(message, context)
}

/**
 * Error recovery strategies
 */
export const ErrorRecoveryStrategies = {
  /**
   * Retry operation with exponential backoff
   * @param {Function} operation - Operation to retry
   * @param {number} maxRetries - Maximum number of retries
   * @param {number} baseDelay - Base delay in milliseconds
   * @returns {Promise} Operation result
   */
  async retryWithBackoff(operation, maxRetries = 3, baseDelay = 1000) {
    let lastError
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error
        
        if (attempt === maxRetries) {
          break
        }
        
        // Exponential backoff
        const delay = baseDelay * Math.pow(2, attempt)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
    
    throw createFileViewerError(lastError, 'retry_operation')
  },

  /**
   * Fallback to alternative handler
   * @param {Array<Function>} handlers - Array of handler functions
   * @param {Object} file - File to process
   * @returns {Promise} Result from successful handler
   */
  async fallbackHandlers(handlers, file) {
    let lastError
    
    for (const handler of handlers) {
      try {
        return await handler(file)
      } catch (error) {
        lastError = error
        console.warn(`Handler failed, trying next:`, error)
      }
    }
    
    throw createFileViewerError(lastError, 'fallback_handlers')
  },

  /**
   * Graceful degradation - return basic file info if processing fails
   * @param {Object} file - File object
   * @param {Error} error - Original error
   * @returns {Object} Basic file content object
   */
  gracefulDegradation(file, error) {
    return {
      type: 'unsupported',
      content: null,
      editable: false,
      error: createFileViewerError(error).toUserMessage(),
      metadata: {
        filename: file.name || 'unknown',
        size: file.size || 0,
        type: file.type || 'unknown',
        degraded: true,
        originalError: error.message
      }
    }
  }
}