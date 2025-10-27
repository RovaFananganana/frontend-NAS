/**
 * @fileoverview Media Handler for file viewer
 * Handles video and audio file processing and playback
 */

import { detectFileType } from '@/utils/fileTypeDetection.js'

/**
 * Media Handler class for processing video and audio files
 * Supports various media formats with HTML5 media elements
 */
export class MediaHandler {
  constructor() {
    this.name = 'MediaHandler'
    this.supportedTypes = [
      // Video types
      'video/mp4',
      'video/webm',
      'video/ogg',
      'video/x-msvideo', // AVI
      'video/quicktime', // MOV
      'video/x-ms-wmv', // WMV
      'video/x-flv', // FLV
      'video/x-matroska', // MKV
      // Audio types
      'audio/mpeg', // MP3
      'audio/wav',
      'audio/ogg',
      'audio/flac',
      'audio/aac',
      'audio/mp4', // M4A
      'audio/x-ms-wma' // WMA
    ]
    this.supportedExtensions = [
      // Video extensions
      'mp4', 'webm', 'ogv', 'avi', 'mov', 'wmv', 'flv', 'mkv',
      // Audio extensions
      'mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'wma'
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
   * Determine if file is video or audio
   * @param {string} filename - Name of the file
   * @param {string} mimeType - MIME type of the file
   * @returns {string} 'video' or 'audio'
   */
  getMediaType(filename, mimeType) {
    if (mimeType.startsWith('video/')) {
      return 'video'
    }
    if (mimeType.startsWith('audio/')) {
      return 'audio'
    }

    // Fallback to extension-based detection
    const fileType = detectFileType(filename)
    const videoExtensions = ['mp4', 'webm', 'ogv', 'avi', 'mov', 'wmv', 'flv', 'mkv']
    const audioExtensions = ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'wma']

    if (videoExtensions.includes(fileType.extension.toLowerCase())) {
      return 'video'
    }
    if (audioExtensions.includes(fileType.extension.toLowerCase())) {
      return 'audio'
    }

    return 'audio' // Default fallback
  }

  /**
   * Extract media metadata using HTML5 media element
   * @param {string} url - Media file URL
   * @param {string} mediaType - 'video' or 'audio'
   * @returns {Promise<Object>} Media metadata
   */
  async extractMetadata(url, mediaType) {
    return new Promise((resolve) => {
      const element = document.createElement(mediaType)
      element.preload = 'metadata'
      element.muted = true // Required for autoplay policies
      
      const cleanup = () => {
        element.removeEventListener('loadedmetadata', onLoadedMetadata)
        element.removeEventListener('error', onError)
        element.src = ''
        element.load()
      }

      const onLoadedMetadata = () => {
        const metadata = {
          duration: element.duration || 0,
          hasAudio: true,
          hasVideo: mediaType === 'video'
        }

        if (mediaType === 'video') {
          metadata.width = element.videoWidth || 0
          metadata.height = element.videoHeight || 0
          metadata.aspectRatio = metadata.width && metadata.height 
            ? (metadata.width / metadata.height).toFixed(2) 
            : '16:9'
        }

        cleanup()
        resolve(metadata)
      }

      const onError = () => {
        cleanup()
        resolve({
          duration: 0,
          hasAudio: mediaType === 'audio',
          hasVideo: mediaType === 'video',
          error: 'Failed to load metadata'
        })
      }

      element.addEventListener('loadedmetadata', onLoadedMetadata)
      element.addEventListener('error', onError)
      
      // Set source and load
      element.src = url
      element.load()

      // Timeout fallback
      setTimeout(() => {
        if (element.readyState === 0) {
          onError()
        }
      }, 5000)
    })
  }

  /**
   * Format duration in seconds to readable format
   * @param {number} seconds - Duration in seconds
   * @returns {string} Formatted duration (e.g., "1:23:45" or "2:30")
   */
  formatDuration(seconds) {
    if (!seconds || isNaN(seconds) || !isFinite(seconds)) {
      return '0:00'
    }

    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    } else {
      return `${minutes}:${secs.toString().padStart(2, '0')}`
    }
  }

  /**
   * Generate waveform data for audio files (simplified version)
   * @param {string} url - Audio file URL
   * @returns {Promise<Array>} Waveform data points
   */
  async generateWaveform(url) {
    try {
      // This is a simplified waveform generation
      // In a real implementation, you might use Web Audio API
      const response = await fetch(url)
      const arrayBuffer = await response.arrayBuffer()
      
      // Create a simple waveform visualization data
      const dataPoints = 100 // Number of bars in waveform
      const waveform = []
      
      // Generate pseudo-random waveform based on file data
      const view = new Uint8Array(arrayBuffer)
      const chunkSize = Math.floor(view.length / dataPoints)
      
      for (let i = 0; i < dataPoints; i++) {
        const start = i * chunkSize
        const end = Math.min(start + chunkSize, view.length)
        let sum = 0
        
        for (let j = start; j < end; j++) {
          sum += view[j]
        }
        
        const average = sum / (end - start)
        const normalized = (average / 255) * 100 // Convert to percentage
        waveform.push(Math.max(5, normalized)) // Minimum height of 5%
      }
      
      return waveform
    } catch (error) {
      console.warn('Failed to generate waveform:', error)
      // Return a default waveform pattern
      return Array.from({ length: 100 }, () => Math.random() * 80 + 20)
    }
  }

  /**
   * Process file for viewing/playing
   * @param {File|Object} file - File object or file info
   * @returns {Promise<Object>} Processed content object
   */
  async process(file) {
    try {
      let url
      let filename = file.name || file.filename || 'media'
      let mimeType = file.type || detectFileType(filename).mimeType

      // Create object URL for File objects
      if (file instanceof File || file instanceof Blob) {
        url = URL.createObjectURL(file)
      } else if (file.url) {
        url = file.url
      } else if (file.path) {
        // Construct URL from path (assuming API endpoint)
        url = `/api/files/${encodeURIComponent(file.path)}`
      } else {
        throw new Error('No valid file source available')
      }

      const mediaType = this.getMediaType(filename, mimeType)
      
      // Extract metadata
      const metadata = await this.extractMetadata(url, mediaType)
      
      // Generate waveform for audio files
      let waveform = null
      if (mediaType === 'audio') {
        try {
          waveform = await this.generateWaveform(url)
        } catch (error) {
          console.warn('Waveform generation failed:', error)
        }
      }

      return {
        type: mediaType,
        content: url,
        url: url,
        editable: false, // Media files are not editable in this implementation
        metadata: {
          mediaType: mediaType,
          duration: metadata.duration,
          durationFormatted: this.formatDuration(metadata.duration),
          hasAudio: metadata.hasAudio,
          hasVideo: metadata.hasVideo,
          width: metadata.width,
          height: metadata.height,
          aspectRatio: metadata.aspectRatio,
          waveform: waveform,
          filename: filename,
          mimeType: mimeType,
          size: file.size || 0,
          canPlay: true
        }
      }
    } catch (error) {
      console.error('MediaHandler processing error:', error)
      return {
        type: 'media',
        content: null,
        editable: false,
        error: `Erreur lors du chargement du média: ${error.message}`,
        metadata: {
          filename: file.name || file.filename || 'unknown',
          mimeType: file.type || 'unknown',
          canPlay: false
        }
      }
    }
  }

  /**
   * Check if browser supports the media type
   * @param {string} mimeType - MIME type to check
   * @param {string} mediaType - 'video' or 'audio'
   * @returns {string} Support level: 'probably', 'maybe', or ''
   */
  checkBrowserSupport(mimeType, mediaType) {
    const element = document.createElement(mediaType)
    return element.canPlayType(mimeType)
  }

  /**
   * Get supported formats for current browser
   * @returns {Object} Object with supported video and audio formats
   */
  getSupportedFormats() {
    const video = document.createElement('video')
    const audio = document.createElement('audio')

    const videoFormats = {}
    const audioFormats = {}

    // Test video formats
    const videoTypes = [
      'video/mp4',
      'video/webm',
      'video/ogg',
      'video/x-msvideo',
      'video/quicktime'
    ]

    videoTypes.forEach(type => {
      videoFormats[type] = video.canPlayType(type)
    })

    // Test audio formats
    const audioTypes = [
      'audio/mpeg',
      'audio/wav',
      'audio/ogg',
      'audio/flac',
      'audio/aac',
      'audio/mp4'
    ]

    audioTypes.forEach(type => {
      audioFormats[type] = audio.canPlayType(type)
    })

    return {
      video: videoFormats,
      audio: audioFormats
    }
  }

  /**
   * Clean up resources (e.g., object URLs)
   * @param {string} url - URL to clean up
   */
  cleanup(url) {
    if (url && url.startsWith('blob:')) {
      URL.revokeObjectURL(url)
    }
  }
}