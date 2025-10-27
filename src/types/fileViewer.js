/**
 * @fileoverview Type definitions for the File Viewer & Editor system
 * These types are defined in JSDoc for compatibility with the JavaScript project
 */

/**
 * File handler interface for processing different file types
 * @typedef {Object} FileHandler
 * @property {string} name - Handler name (e.g., 'TextHandler', 'ImageHandler')
 * @property {string[]} supportedTypes - Array of supported MIME types
 * @property {string[]} supportedExtensions - Array of supported file extensions
 * @property {function(File): Promise<FileViewerContent>} process - Process file and return content
 * @property {function(string): boolean} canHandle - Check if handler can process given MIME type
 * @property {Object} [config] - Optional handler-specific configuration
 */

/**
 * Content structure returned by file handlers
 * @typedef {Object} FileViewerContent
 * @property {string} type - Content type ('text', 'image', 'video', 'audio', 'pdf', 'unsupported')
 * @property {string} [content] - Text content for text files
 * @property {string} [url] - URL for media files (images, videos, audio)
 * @property {Object} [metadata] - File metadata (dimensions, duration, etc.)
 * @property {boolean} editable - Whether the content can be edited
 * @property {string} [error] - Error message if processing failed
 * @property {number} [size] - Content size in bytes
 */

/**
 * Configuration for different file types
 * @typedef {Object} FileTypeConfig
 * @property {string} type - File type identifier
 * @property {string[]} mimeTypes - Associated MIME types
 * @property {string[]} extensions - Associated file extensions
 * @property {string} icon - CSS class for file type icon
 * @property {string} handler - Handler class name to use
 * @property {boolean} viewable - Whether file can be viewed
 * @property {boolean} editable - Whether file can be edited
 * @property {Object} [settings] - Type-specific settings
 */

/**
 * File information structure
 * @typedef {Object} FileInfo
 * @property {string} name - File name
 * @property {string} path - Full file path
 * @property {string} extension - File extension
 * @property {string} mimeType - MIME type
 * @property {number} size - File size in bytes
 * @property {Date} lastModified - Last modification date
 * @property {boolean} isDirectory - Whether it's a directory
 */

/**
 * File viewer state
 * @typedef {Object} FileViewerState
 * @property {boolean} isOpen - Whether viewer is open
 * @property {FileInfo|null} currentFile - Currently viewed file
 * @property {FileViewerContent|null} content - Current file content
 * @property {boolean} isLoading - Whether content is loading
 * @property {string|null} error - Current error message
 * @property {boolean} isEditing - Whether in edit mode
 * @property {boolean} hasUnsavedChanges - Whether there are unsaved changes
 */

/**
 * Editor configuration
 * @typedef {Object} EditorConfig
 * @property {string} theme - Editor theme ('light', 'dark')
 * @property {number} fontSize - Font size in pixels
 * @property {boolean} wordWrap - Whether to wrap long lines
 * @property {boolean} showLineNumbers - Whether to show line numbers
 * @property {string} tabSize - Tab size (number of spaces)
 * @property {boolean} autoSave - Whether to auto-save changes
 * @property {number} autoSaveDelay - Auto-save delay in milliseconds
 */

// Export constants
export const FILE_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  VIDEO: 'video',
  AUDIO: 'audio',
  PDF: 'pdf',
  DOCUMENT: 'document',
  WORD: 'word',
  EXCEL: 'excel',
  POWERPOINT: 'powerpoint',
  UNSUPPORTED: 'unsupported'
}

export const VIEWER_MODES = {
  VIEW: 'view',
  EDIT: 'edit'
}

export const EDITOR_THEMES = {
  LIGHT: 'light',
  DARK: 'dark'
}