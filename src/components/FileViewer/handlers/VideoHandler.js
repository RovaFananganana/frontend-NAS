/**
 * @fileoverview Video Handler for file viewer
 * Handles video file processing using MediaHandler
 */

import { MediaHandler } from './MediaHandler.js'

/**
 * Video Handler class - extends MediaHandler for video-specific functionality
 */
export class VideoHandler extends MediaHandler {
  constructor() {
    super()
    this.name = 'VideoHandler'
    // Filter to only video types
    this.supportedTypes = this.supportedTypes.filter(type => type.startsWith('video/'))
    this.supportedExtensions = ['mp4', 'webm', 'ogv', 'avi', 'mov', 'wmv', 'flv', 'mkv']
  }

  /**
   * Process video file for viewing
   * @param {File|Object} file - File object or file info
   * @returns {Promise<Object>} Processed content object
   */
  async process(file) {
    const result = await super.process(file)
    
    // Ensure type is set to video
    if (result.type !== 'video' && !result.error) {
      result.type = 'video'
      if (result.metadata) {
        result.metadata.mediaType = 'video'
      }
    }
    
    return result
  }
}