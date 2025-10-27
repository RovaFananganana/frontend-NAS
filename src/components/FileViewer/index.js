/**
 * @fileoverview File Viewer & Editor module exports
 * Central export point for all file viewer components and services
 */

// Components
export { default as FileViewerModal } from './FileViewerModal.vue'
export { default as FileEditor } from './FileEditor.vue'
export { default as MediaViewer } from './MediaViewer.vue'
export { default as DocumentViewer } from './DocumentViewer.vue'
export { default as ExcelViewer } from './ExcelViewer.vue'
export { default as PowerPointViewer } from './PowerPointViewer.vue'
export { default as SlideEditor } from './SlideEditor.vue'

// Handlers
export { TextHandler } from './handlers/TextHandler.js'
export { ImageHandler } from './handlers/ImageHandler.js'
export { VideoHandler } from './handlers/VideoHandler.js'
export { AudioHandler } from './handlers/AudioHandler.js'
export { PDFHandler } from './handlers/PDFHandler.js'
export { MediaHandler } from './handlers/MediaHandler.js'
export { DocumentHandler } from './handlers/DocumentHandler.js'

// Services
export { FileHandlerService, fileHandlerService } from '@/services/fileHandlerService.js'

// Types
export * from '@/types/fileViewer.js'

// Utilities
export * from '@/utils/fileTypeDetection.js'

// Configuration
export * from '@/config/fileTypeConfig.js'