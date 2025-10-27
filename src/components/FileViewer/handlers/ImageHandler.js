/**
 * @fileoverview Image Handler for file viewer
 * Handles image file processing, metadata extraction, and basic editing
 */

import { detectFileType } from '@/utils/fileTypeDetection.js'

/**
 * Image Handler class for processing image files
 * Supports various image formats with EXIF metadata extraction and basic editing
 */
export class ImageHandler {
  constructor() {
    this.name = 'ImageHandler'
    this.supportedTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/bmp',
      'image/webp',
      'image/svg+xml',
      'image/x-icon',
      'image/vnd.microsoft.icon'
    ]
    this.supportedExtensions = [
      'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'ico'
    ]
  }

  /**
   * Check if this handler can process the given file
   * @param {string} filename - Name of the file
   * @param {string} mimeType - MIME type of the file
   * @returns {boolean} True if can handle
   */
  canHandle(filename, mimeType) {
    if (this.supportedTypes.includes(mimeType)) {
      return true
    }

    const fileType = detectFileType(filename)
    return this.supportedExtensions.includes(fileType.extension.toLowerCase())
  }

  /**
   * Extract EXIF metadata from image
   * @param {ArrayBuffer} buffer - Image file buffer
   * @param {string} mimeType - Image MIME type
   * @returns {Object} EXIF metadata object
   */
  extractEXIFMetadata(buffer, mimeType) {
    // Basic EXIF extraction for JPEG files
    if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
      try {
        const view = new DataView(buffer)
        
        // Check for JPEG signature
        if (view.getUint16(0) !== 0xFFD8) {
          return {}
        }

        let offset = 2
        let marker
        
        // Look for APP1 marker (EXIF)
        while (offset < view.byteLength) {
          marker = view.getUint16(offset)
          
          if (marker === 0xFFE1) { // APP1 marker
            const length = view.getUint16(offset + 2)
            const exifData = buffer.slice(offset + 4, offset + 2 + length)
            return this.parseBasicEXIF(exifData)
          }
          
          if (marker === 0xFFDA) { // Start of scan
            break
          }
          
          const segmentLength = view.getUint16(offset + 2)
          offset += 2 + segmentLength
        }
      } catch (error) {
        console.warn('Error extracting EXIF data:', error)
      }
    }
    
    return {}
  }

  /**
   * Parse basic EXIF data
   * @param {ArrayBuffer} exifData - EXIF data buffer
   * @returns {Object} Parsed EXIF metadata
   */
  parseBasicEXIF(exifData) {
    try {
      const view = new DataView(exifData)
      const metadata = {}
      
      // Check for EXIF header
      const exifHeader = String.fromCharCode(...new Uint8Array(exifData.slice(0, 4)))
      if (exifHeader !== 'Exif') {
        return metadata
      }
      
      // This is a simplified EXIF parser
      // For production, consider using a dedicated EXIF library
      metadata.hasEXIF = true
      
      return metadata
    } catch (error) {
      console.warn('Error parsing EXIF data:', error)
      return {}
    }
  }

  /**
   * Get image dimensions from file
   * @param {File|Blob} file - Image file
   * @returns {Promise<Object>} Image dimensions and metadata
   */
  async getImageMetadata(file) {
    return new Promise((resolve) => {
      const img = new Image()
      const url = URL.createObjectURL(file)
      
      img.onload = () => {
        const metadata = {
          width: img.naturalWidth,
          height: img.naturalHeight,
          aspectRatio: img.naturalWidth / img.naturalHeight,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified ? new Date(file.lastModified) : null
        }
        
        URL.revokeObjectURL(url)
        resolve(metadata)
      }
      
      img.onerror = () => {
        URL.revokeObjectURL(url)
        resolve({
          width: 0,
          height: 0,
          aspectRatio: 1,
          size: file.size,
          type: file.type,
          error: 'Failed to load image'
        })
      }
      
      img.src = url
    })
  }

  /**
   * Process image file for viewing/editing
   * @param {File|Object} file - File object or file info
   * @returns {Promise<Object>} Processed content object
   */
  async process(file) {
    try {
      let imageUrl
      let metadata = {}
      
      if (file instanceof File || file instanceof Blob) {
        // Create object URL for the image
        imageUrl = URL.createObjectURL(file)
        
        // Get image metadata
        metadata = await this.getImageMetadata(file)
        
        // Extract EXIF data if available
        if (file.arrayBuffer) {
          const buffer = await file.arrayBuffer()
          const exifData = this.extractEXIFMetadata(buffer, file.type)
          metadata = { ...metadata, ...exifData }
        }
      } else if (file.url || file.path) {
        // Use provided URL or construct from path
        imageUrl = file.url || `/api/files/${encodeURIComponent(file.path)}`
        metadata = {
          size: file.size || 0,
          type: file.type || file.mimeType || 'image/unknown',
          lastModified: file.lastModified ? new Date(file.lastModified) : null
        }
      } else {
        throw new Error('No image source available')
      }

      // Determine if image is editable (exclude SVG for now as it needs special handling)
      const isEditable = metadata.type !== 'image/svg+xml' && 
                        metadata.type !== 'image/gif' && 
                        metadata.width > 0 && 
                        metadata.height > 0

      return {
        type: 'image',
        url: imageUrl,
        editable: isEditable,
        metadata: {
          ...metadata,
          format: this.getImageFormat(file.name || file.filename || ''),
          isAnimated: metadata.type === 'image/gif',
          isVector: metadata.type === 'image/svg+xml',
          canEdit: isEditable,
          supportedOperations: isEditable ? [
            'rotate', 'crop', 'resize', 'brightness', 'contrast', 'saturation'
          ] : []
        }
      }
    } catch (error) {
      console.error('ImageHandler processing error:', error)
      return {
        type: 'image',
        url: null,
        editable: false,
        error: `Erreur lors du traitement de l'image: ${error.message}`,
        metadata: {
          format: 'unknown',
          width: 0,
          height: 0,
          size: file.size || 0
        }
      }
    }
  }

  /**
   * Get image format from filename
   * @param {string} filename - Image filename
   * @returns {string} Image format
   */
  getImageFormat(filename) {
    const extension = filename.split('.').pop()?.toLowerCase()
    
    const formatMap = {
      'jpg': 'JPEG',
      'jpeg': 'JPEG',
      'png': 'PNG',
      'gif': 'GIF',
      'bmp': 'BMP',
      'webp': 'WebP',
      'svg': 'SVG',
      'ico': 'ICO'
    }
    
    return formatMap[extension] || 'Unknown'
  }

  /**
   * Apply basic image transformations
   * @param {HTMLCanvasElement} canvas - Canvas with image
   * @param {Object} transformations - Transformations to apply
   * @returns {HTMLCanvasElement} Transformed canvas
   */
  applyTransformations(canvas, transformations) {
    const ctx = canvas.getContext('2d')
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data
    
    // Apply brightness, contrast, saturation adjustments
    if (transformations.brightness !== undefined || 
        transformations.contrast !== undefined || 
        transformations.saturation !== undefined) {
      
      const brightness = transformations.brightness || 0
      const contrast = transformations.contrast !== undefined ? transformations.contrast : 1
      const saturation = transformations.saturation !== undefined ? transformations.saturation : 1
      
      for (let i = 0; i < data.length; i += 4) {
        let r = data[i]
        let g = data[i + 1]
        let b = data[i + 2]
        
        // Apply brightness
        r += brightness
        g += brightness
        b += brightness
        
        // Apply contrast
        r = ((r - 128) * contrast) + 128
        g = ((g - 128) * contrast) + 128
        b = ((b - 128) * contrast) + 128
        
        // Apply saturation (simplified)
        if (saturation !== 1) {
          const gray = 0.299 * r + 0.587 * g + 0.114 * b
          r = gray + saturation * (r - gray)
          g = gray + saturation * (g - gray)
          b = gray + saturation * (b - gray)
        }
        
        // Clamp values
        data[i] = Math.max(0, Math.min(255, r))
        data[i + 1] = Math.max(0, Math.min(255, g))
        data[i + 2] = Math.max(0, Math.min(255, b))
      }
      
      ctx.putImageData(imageData, 0, 0)
    }
    
    return canvas
  }

  /**
   * Export image in specified format
   * @param {HTMLCanvasElement} canvas - Canvas with image
   * @param {string} format - Export format (jpeg, png, webp)
   * @param {number} quality - Export quality (0-1)
   * @returns {Promise<Blob>} Exported image blob
   */
  async exportImage(canvas, format = 'png', quality = 0.9) {
    return new Promise((resolve) => {
      const mimeType = `image/${format}`
      canvas.toBlob(resolve, mimeType, quality)
    })
  }

  /**
   * Save edited image content
   * @param {Object} file - Original file info
   * @param {Blob} blob - New image blob
   * @param {string} filename - Filename for the saved image
   * @returns {Promise<Blob>} Saved image blob
   */
  async saveContent(file, blob, filename) {
    try {
      // For now, just return the blob as-is
      // In a real implementation, this would upload to the server
      return blob
    } catch (error) {
      throw new Error(`Erreur lors de la sauvegarde: ${error.message}`)
    }
  }

  /**
   * Validate image file
   * @param {File} file - Image file to validate
   * @returns {Object} Validation result
   */
  validateImage(file) {
    const maxSize = 50 * 1024 * 1024 // 50MB
    const issues = []
    
    if (file.size > maxSize) {
      issues.push({
        type: 'warning',
        message: 'Image file is very large and may take time to process'
      })
    }
    
    if (!this.canHandle(file.name, file.type)) {
      issues.push({
        type: 'error',
        message: 'Unsupported image format'
      })
    }
    
    return {
      valid: issues.filter(i => i.type === 'error').length === 0,
      issues: issues
    }
  }
}