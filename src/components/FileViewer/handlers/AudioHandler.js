/**
 * @fileoverview Audio Handler for file viewer
 * Handles audio file processing using MediaHandler
 */

import { MediaHandler } from './MediaHandler.js'

/**
 * Audio Handler class - extends MediaHandler for audio-specific functionality
 */
export class AudioHandler extends MediaHandler {
  constructor() {
    super()
    this.name = 'AudioHandler'
    // Filter to only audio types
    this.supportedTypes = this.supportedTypes.filter(type => type.startsWith('audio/'))
    this.supportedExtensions = ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'wma']
  }

  /**
   * Process audio file for viewing
   * @param {File|Object} file - File object or file info
   * @returns {Promise<Object>} Processed content object
   */
  async process(file) {
    const result = await super.process(file)
    
    // Ensure type is set to audio
    if (result.type !== 'audio' && !result.error) {
      result.type = 'audio'
      if (result.metadata) {
        result.metadata.mediaType = 'audio'
      }
    }
    
    return result
  }
}