/**
 * @fileoverview Text Handler for file viewer
 * Handles text file reading, encoding detection, and content processing
 */

import { detectFileType } from '@/utils/fileTypeDetection.js'

/**
 * Text Handler class for processing text files
 * Supports various text formats with encoding detection and syntax highlighting
 */
export class TextHandler {
  constructor() {
    this.name = 'TextHandler'
    this.supportedTypes = [
      'text/plain',
      'text/markdown', 
      'application/json',
      'text/javascript',
      'text/css',
      'text/html',
      'text/xml',
      'text/csv',
      'text/yaml',
      'application/javascript',
      'application/xml'
    ]
    this.supportedExtensions = [
      'txt', 'md', 'json', 'js', 'css', 'html', 'htm',
      'xml', 'csv', 'log', 'ini', 'conf', 'cfg', 'yml', 'yaml',
      'py', 'java', 'c', 'cpp', 'h', 'hpp', 'cs', 'php', 'rb',
      'go', 'rs', 'swift', 'kt', 'scala', 'sql', 'sh', 'bat', 'ps1'
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
   * Detect file encoding from content
   * @param {ArrayBuffer} buffer - File content as ArrayBuffer
   * @returns {string} Detected encoding
   */
  detectEncoding(buffer) {
    const bytes = new Uint8Array(buffer)
    
    // Check for BOM (Byte Order Mark)
    if (bytes.length >= 3 && bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF) {
      return 'utf-8'
    }
    if (bytes.length >= 2 && bytes[0] === 0xFF && bytes[1] === 0xFE) {
      return 'utf-16le'
    }
    if (bytes.length >= 2 && bytes[0] === 0xFE && bytes[1] === 0xFF) {
      return 'utf-16be'
    }

    // Simple heuristic for UTF-8 vs other encodings
    let utf8Valid = true
    for (let i = 0; i < Math.min(bytes.length, 1000); i++) {
      const byte = bytes[i]
      if (byte > 127) {
        // Check if it's valid UTF-8 sequence
        if ((byte & 0xE0) === 0xC0) {
          if (i + 1 >= bytes.length || (bytes[i + 1] & 0xC0) !== 0x80) {
            utf8Valid = false
            break
          }
          i++
        } else if ((byte & 0xF0) === 0xE0) {
          if (i + 2 >= bytes.length || 
              (bytes[i + 1] & 0xC0) !== 0x80 || 
              (bytes[i + 2] & 0xC0) !== 0x80) {
            utf8Valid = false
            break
          }
          i += 2
        } else if ((byte & 0xF8) === 0xF0) {
          if (i + 3 >= bytes.length || 
              (bytes[i + 1] & 0xC0) !== 0x80 || 
              (bytes[i + 2] & 0xC0) !== 0x80 || 
              (bytes[i + 3] & 0xC0) !== 0x80) {
            utf8Valid = false
            break
          }
          i += 3
        } else {
          utf8Valid = false
          break
        }
      }
    }

    return utf8Valid ? 'utf-8' : 'iso-8859-1'
  }

  /**
   * Determine Monaco Editor language from file extension
   * @param {string} filename - Name of the file
   * @returns {string} Monaco language identifier
   */
  getMonacoLanguage(filename) {
    const extension = filename.split('.').pop()?.toLowerCase()
    
    const languageMap = {
      'js': 'javascript',
      'ts': 'typescript',
      'json': 'json',
      'html': 'html',
      'htm': 'html',
      'css': 'css',
      'scss': 'scss',
      'sass': 'sass',
      'less': 'less',
      'xml': 'xml',
      'yaml': 'yaml',
      'yml': 'yaml',
      'md': 'markdown',
      'py': 'python',
      'java': 'java',
      'c': 'c',
      'cpp': 'cpp',
      'h': 'c',
      'hpp': 'cpp',
      'cs': 'csharp',
      'php': 'php',
      'rb': 'ruby',
      'go': 'go',
      'rs': 'rust',
      'swift': 'swift',
      'kt': 'kotlin',
      'scala': 'scala',
      'sql': 'sql',
      'sh': 'shell',
      'bat': 'bat',
      'ps1': 'powershell',
      'dockerfile': 'dockerfile',
      'ini': 'ini',
      'conf': 'ini',
      'cfg': 'ini',
      'log': 'plaintext',
      'txt': 'plaintext'
    }

    return languageMap[extension] || 'plaintext'
  }

  /**
   * Read file content with proper encoding handling
   * @param {File|Blob} file - File object to read
   * @returns {Promise<string>} File content as string
   */
  async readFileContent(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = () => {
        try {
          const buffer = reader.result
          const encoding = this.detectEncoding(buffer)
          
          // Create a new reader to read as text with detected encoding
          const textReader = new FileReader()
          textReader.onload = () => resolve(textReader.result)
          textReader.onerror = () => reject(new Error('Failed to read file as text'))
          
          // Read with detected encoding
          if (encoding === 'utf-16le' || encoding === 'utf-16be') {
            textReader.readAsText(file, 'utf-16')
          } else {
            textReader.readAsText(file, 'utf-8')
          }
        } catch (error) {
          reject(error)
        }
      }
      
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsArrayBuffer(file)
    })
  }

  /**
   * Process file for viewing/editing
   * @param {File|Object} file - File object or file info
   * @returns {Promise<Object>} Processed content object
   */
  async process(file) {
    try {
      let content
      let encoding = 'utf-8'
      
      if (file instanceof File || file instanceof Blob) {
        // Read file content directly
        content = await this.readFileContent(file)
        
        // Detect encoding from the file if arrayBuffer is available
        if (typeof file.arrayBuffer === 'function') {
          const buffer = await file.arrayBuffer()
          encoding = this.detectEncoding(buffer)
        } else {
          // Fallback for test environments or older browsers
          encoding = 'utf-8'
        }
      } else if (file.content) {
        // Content already provided (e.g., from API)
        content = file.content
      } else {
        throw new Error('No file content available')
      }

      // Determine language for syntax highlighting
      const language = this.getMonacoLanguage(file.name || file.filename || '')
      
      // Calculate basic statistics
      const lines = content.split('\n')
      const lineCount = lines.length
      const charCount = content.length
      const wordCount = content.split(/\s+/).filter(word => word.length > 0).length

      return {
        type: 'text',
        content: content,
        editable: true,
        metadata: {
          encoding: encoding,
          language: language,
          lineCount: lineCount,
          charCount: charCount,
          wordCount: wordCount,
          size: new Blob([content]).size,
          isEmpty: content.trim().length === 0
        }
      }
    } catch (error) {
      console.error('TextHandler processing error:', error)
      return {
        type: 'text',
        content: '',
        editable: false,
        error: `Erreur lors de la lecture du fichier: ${error.message}`,
        metadata: {
          encoding: 'unknown',
          language: 'plaintext'
        }
      }
    }
  }

  /**
   * Save edited content back to file
   * @param {Object} file - Original file info
   * @param {string} content - New content to save
   * @param {string} encoding - Encoding to use for saving
   * @returns {Promise<Blob>} New file blob
   */
  async saveContent(file, content, encoding = 'utf-8') {
    try {
      // Create blob with proper encoding
      const blob = new Blob([content], { 
        type: 'text/plain;charset=' + encoding 
      })
      
      return blob
    } catch (error) {
      throw new Error(`Erreur lors de la sauvegarde: ${error.message}`)
    }
  }

  /**
   * Validate text content
   * @param {string} content - Content to validate
   * @param {string} language - Language type
   * @returns {Object} Validation result
   */
  validateContent(content, language) {
    const issues = []
    
    try {
      // Basic validation for JSON
      if (language === 'json') {
        JSON.parse(content)
      }
      
      // Basic validation for XML
      if (language === 'xml') {
        const parser = new DOMParser()
        const doc = parser.parseFromString(content, 'text/xml')
        const errors = doc.getElementsByTagName('parsererror')
        if (errors.length > 0) {
          issues.push({
            type: 'error',
            message: 'XML syntax error',
            line: 1
          })
        }
      }
      
      return {
        valid: issues.length === 0,
        issues: issues
      }
    } catch (error) {
      return {
        valid: false,
        issues: [{
          type: 'error',
          message: error.message,
          line: 1
        }]
      }
    }
  }
}