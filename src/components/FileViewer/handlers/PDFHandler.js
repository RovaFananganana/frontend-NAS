/**
 * @fileoverview PDF Handler for file viewer
 * Handles PDF file processing using PDF.js library
 */

import * as pdfjsLib from 'pdfjs-dist'

// Configure PDF.js worker - try to use a working CDN
try {
  // Use unpkg CDN which should be more reliable
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@5.4.296/build/pdf.worker.min.js'
} catch (error) {
  console.warn('Failed to set PDF worker, PDFs may not work properly:', error)
}

/**
 * PDF Handler class for processing PDF files
 * Supports PDF rendering, navigation, zoom, and text search
 */
export class PDFHandler {
  constructor() {
    this.name = 'PDFHandler'
    this.supportedTypes = [
      'application/pdf'
    ]
    this.supportedExtensions = [
      'pdf'
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

    const extension = filename.split('.').pop()?.toLowerCase()
    return this.supportedExtensions.includes(extension)
  }

  /**
   * Extract metadata from PDF document
   * @param {Object} pdfDocument - PDF.js document object
   * @returns {Promise<Object>} PDF metadata
   */
  async extractMetadata(pdfDocument) {
    try {
      const metadata = await pdfDocument.getMetadata()
      return {
        title: metadata.info?.Title || '',
        author: metadata.info?.Author || '',
        subject: metadata.info?.Subject || '',
        creator: metadata.info?.Creator || '',
        producer: metadata.info?.Producer || '',
        creationDate: metadata.info?.CreationDate || '',
        modificationDate: metadata.info?.ModDate || '',
        pageCount: pdfDocument.numPages,
        pdfVersion: metadata.info?.PDFFormatVersion || '',
        encrypted: metadata.info?.IsEncrypted || false
      }
    } catch (error) {
      console.warn('Could not extract PDF metadata:', error)
      return {
        pageCount: pdfDocument.numPages,
        error: 'Could not extract metadata'
      }
    }
  }

  /**
   * Extract text content from PDF for search functionality
   * @param {Object} pdfDocument - PDF.js document object
   * @param {number} maxPages - Maximum pages to process (default: 10 for performance)
   * @returns {Promise<Array>} Array of page text content
   */
  async extractTextContent(pdfDocument, maxPages = 10) {
    const textContent = []
    const pagesToProcess = Math.min(pdfDocument.numPages, maxPages)
    
    try {
      for (let pageNum = 1; pageNum <= pagesToProcess; pageNum++) {
        const page = await pdfDocument.getPage(pageNum)
        const textData = await page.getTextContent()
        
        const pageText = textData.items
          .map(item => item.str)
          .join(' ')
          .trim()
        
        textContent.push({
          pageNum,
          text: pageText,
          length: pageText.length
        })
      }
    } catch (error) {
      console.warn('Error extracting text content:', error)
    }
    
    return textContent
  }

  /**
   * Create object URL for PDF file
   * @param {File|Blob} file - PDF file
   * @returns {string} Object URL
   */
  createPDFUrl(file) {
    if (file instanceof File || file instanceof Blob) {
      return URL.createObjectURL(file)
    } else if (typeof file === 'string') {
      return file
    } else if (file && (file.url || file.path)) {
      return file.url || file.path
    } else {
      throw new Error('Invalid file format for PDF processing')
    }
  }

  /**
   * Validate PDF file
   * @param {File|Blob} file - PDF file to validate
   * @returns {Promise<Object>} Validation result
   */
  async validatePDF(file) {
    let url = null
    try {
      url = this.createPDFUrl(file)
      
      // For basic validation, just check if we can create a loading task
      // Don't actually load the full document during validation
      const loadingTask = pdfjsLib.getDocument({
        url: url,
        verbosity: 0, // Suppress console warnings
        disableAutoFetch: true,
        disableStream: true
      })
      
      // Set a shorter timeout for validation
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('PDF validation timeout')), 5000)
      })
      
      const pdfDocument = await Promise.race([
        loadingTask.promise,
        timeoutPromise
      ])
      
      // Basic validation checks
      const isValid = pdfDocument && pdfDocument.numPages > 0
      const pageCount = pdfDocument?.numPages || 0
      
      // Clean up
      if (pdfDocument) {
        pdfDocument.destroy()
      }
      
      return {
        valid: isValid,
        pageCount: pageCount,
        error: null
      }
    } catch (error) {
      console.warn('PDF validation failed:', error.message)
      
      // For validation failures, we'll be more lenient
      // If it's a network error or timeout, assume it might be valid
      const isNetworkError = error.message.includes('timeout') || 
                            error.message.includes('network') ||
                            error.message.includes('fetch')
      
      return {
        valid: isNetworkError, // Allow network errors to pass through
        pageCount: 0,
        error: isNetworkError ? null : error.message
      }
    } finally {
      // Clean up URL if we created it
      if (url && (file instanceof File || file instanceof Blob)) {
        try {
          URL.revokeObjectURL(url)
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    }
  }

  /**
   * Process PDF file for viewing
   * @param {File|Object} file - File object or file info
   * @returns {Promise<Object>} Processed content object
   */
  async process(file) {
    try {
      let pdfUrl
      let fileSize = 0
      let filename = 'document.pdf'
      
      if (file instanceof File || file instanceof Blob) {
        // Direct file processing
        pdfUrl = this.createPDFUrl(file)
        fileSize = file.size || 0
        filename = file.name || filename
      } else if (file.url || file.path) {
        // URL-based processing (from API)
        pdfUrl = file.url || file.path
        fileSize = file.size || 0
        filename = file.name || file.filename || filename
      } else {
        throw new Error('Invalid file format for PDF processing')
      }

      // Try to validate PDF, but don't fail if validation has issues
      try {
        const validation = await this.validatePDF(file)
        if (!validation.valid && validation.error) {
          console.warn('PDF validation warning:', validation.error)
          // Continue processing anyway - let PDF.js handle the actual validation
        }
      } catch (validationError) {
        console.warn('PDF validation failed, continuing anyway:', validationError.message)
        // Continue processing - validation is not critical
      }

      // Load PDF document to extract metadata
      let loadingTask
      try {
        loadingTask = pdfjsLib.getDocument({
          url: pdfUrl,
          verbosity: 0, // Suppress console warnings
          disableAutoFetch: true,
          disableStream: true
        })
      } catch (workerError) {
        console.warn('PDF.js worker error, trying without worker:', workerError.message)
        // If worker fails, try to disable it and retry
        pdfjsLib.GlobalWorkerOptions.workerSrc = false
        loadingTask = pdfjsLib.getDocument({
          url: pdfUrl,
          verbosity: 0,
          disableAutoFetch: true,
          disableStream: true
        })
      }
      
      const pdfDocument = await loadingTask.promise
      
      // Extract metadata
      const metadata = await this.extractMetadata(pdfDocument)
      
      // Extract some text content for search preview (first few pages only)
      const textContent = await this.extractTextContent(pdfDocument, 5)
      
      // Clean up the document (we'll reload it in the viewer)
      pdfDocument.destroy()

      return {
        type: 'pdf',
        url: pdfUrl,
        content: null, // PDF content is handled by the viewer component
        editable: false, // PDF editing not supported in this implementation
        metadata: {
          ...metadata,
          filename,
          fileSize,
          textContent,
          hasText: textContent.some(page => page.text.length > 0),
          processedAt: new Date().toISOString()
        }
      }
    } catch (error) {
      console.error('PDFHandler processing error:', error)
      return {
        type: 'pdf',
        content: null,
        editable: false,
        error: `Erreur lors du traitement du PDF: ${error.message}`,
        metadata: {
          filename: file.name || file.filename || 'document.pdf',
          fileSize: file.size || 0,
          errorDetails: error.stack
        }
      }
    }
  }

  /**
   * Search text in PDF document
   * @param {string} pdfUrl - URL of the PDF
   * @param {string} searchQuery - Text to search for
   * @param {Object} options - Search options
   * @returns {Promise<Array>} Search results
   */
  async searchInPDF(pdfUrl, searchQuery, options = {}) {
    const {
      caseSensitive = false,
      wholeWords = false,
      maxResults = 100
    } = options

    try {
      const loadingTask = pdfjsLib.getDocument(pdfUrl)
      const pdfDocument = await loadingTask.promise
      
      const results = []
      const query = caseSensitive ? searchQuery : searchQuery.toLowerCase()
      
      for (let pageNum = 1; pageNum <= pdfDocument.numPages && results.length < maxResults; pageNum++) {
        const page = await pdfDocument.getPage(pageNum)
        const textContent = await page.getTextContent()
        
        const pageText = textContent.items
          .map(item => item.str)
          .join(' ')
        
        const searchText = caseSensitive ? pageText : pageText.toLowerCase()
        
        if (wholeWords) {
          const regex = new RegExp(`\\b${query}\\b`, caseSensitive ? 'g' : 'gi')
          const matches = [...searchText.matchAll(regex)]
          
          matches.forEach(match => {
            results.push({
              pageNum,
              position: match.index,
              context: this.getSearchContext(pageText, match.index, query.length),
              matchText: match[0]
            })
          })
        } else {
          let index = searchText.indexOf(query)
          while (index !== -1 && results.length < maxResults) {
            results.push({
              pageNum,
              position: index,
              context: this.getSearchContext(pageText, index, query.length),
              matchText: pageText.substr(index, query.length)
            })
            index = searchText.indexOf(query, index + 1)
          }
        }
      }
      
      pdfDocument.destroy()
      
      return results
    } catch (error) {
      console.error('Error searching PDF:', error)
      throw new Error(`Erreur lors de la recherche: ${error.message}`)
    }
  }

  /**
   * Get context around search match
   * @param {string} text - Full text
   * @param {number} position - Match position
   * @param {number} matchLength - Length of match
   * @param {number} contextLength - Context length (default: 50)
   * @returns {string} Context string
   */
  getSearchContext(text, position, matchLength, contextLength = 50) {
    const start = Math.max(0, position - contextLength)
    const end = Math.min(text.length, position + matchLength + contextLength)
    
    let context = text.substring(start, end)
    
    // Add ellipsis if truncated
    if (start > 0) context = '...' + context
    if (end < text.length) context = context + '...'
    
    return context.trim()
  }

  /**
   * Get PDF page as image (for thumbnail generation)
   * @param {string} pdfUrl - URL of the PDF
   * @param {number} pageNum - Page number
   * @param {number} scale - Scale factor (default: 0.5)
   * @returns {Promise<string>} Base64 image data URL
   */
  async getPageAsImage(pdfUrl, pageNum = 1, scale = 0.5) {
    try {
      const loadingTask = pdfjsLib.getDocument(pdfUrl)
      const pdfDocument = await loadingTask.promise
      
      const page = await pdfDocument.getPage(pageNum)
      const viewport = page.getViewport({ scale })
      
      // Create canvas
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')
      canvas.height = viewport.height
      canvas.width = viewport.width
      
      // Render page
      const renderContext = {
        canvasContext: context,
        viewport: viewport
      }
      
      await page.render(renderContext).promise
      
      // Convert to data URL
      const dataUrl = canvas.toDataURL('image/png')
      
      // Clean up
      pdfDocument.destroy()
      
      return dataUrl
    } catch (error) {
      console.error('Error generating PDF thumbnail:', error)
      throw new Error(`Erreur lors de la génération de la miniature: ${error.message}`)
    }
  }

  /**
   * Extract bookmarks/outline from PDF
   * @param {Object} pdfDocument - PDF.js document object
   * @returns {Promise<Array>} Array of bookmark objects
   */
  async extractBookmarks(pdfDocument) {
    try {
      const outline = await pdfDocument.getOutline()
      if (!outline) return []
      
      const processOutlineItems = (items, level = 0) => {
        const bookmarks = []
        
        items.forEach(item => {
          const bookmark = {
            title: item.title,
            level: level,
            dest: item.dest,
            url: item.url,
            unsafeUrl: item.unsafeUrl,
            newWindow: item.newWindow
          }
          
          bookmarks.push(bookmark)
          
          // Process children recursively
          if (item.items && item.items.length > 0) {
            bookmarks.push(...processOutlineItems(item.items, level + 1))
          }
        })
        
        return bookmarks
      }
      
      return processOutlineItems(outline)
    } catch (error) {
      console.warn('Could not extract bookmarks:', error)
      return []
    }
  }

  /**
   * Extract links from a PDF page
   * @param {Object} page - PDF.js page object
   * @returns {Promise<Array>} Array of link objects
   */
  async extractPageLinks(page) {
    try {
      const annotations = await page.getAnnotations()
      const links = []
      
      annotations.forEach(annotation => {
        if (annotation.subtype === 'Link') {
          links.push({
            rect: annotation.rect,
            url: annotation.url,
            dest: annotation.dest,
            unsafeUrl: annotation.unsafeUrl,
            newWindow: annotation.newWindow
          })
        }
      })
      
      return links
    } catch (error) {
      console.warn('Could not extract page links:', error)
      return []
    }
  }

  /**
   * Navigate to a destination in the PDF
   * @param {Object} pdfDocument - PDF.js document object
   * @param {string|Array} dest - Destination reference
   * @returns {Promise<Object>} Navigation result with page number and position
   */
  async navigateToDestination(pdfDocument, dest) {
    try {
      if (!dest) return null
      
      let destination = dest
      
      // If dest is a string, resolve it
      if (typeof dest === 'string') {
        destination = await pdfDocument.getDestination(dest)
      }
      
      if (!destination || !Array.isArray(destination)) {
        return null
      }
      
      // Get page reference
      const pageRef = destination[0]
      const pageIndex = await pdfDocument.getPageIndex(pageRef)
      const pageNum = pageIndex + 1
      
      // Extract position information
      const fitType = destination[1]?.name || 'XYZ'
      const left = destination[2] || null
      const top = destination[3] || null
      const zoom = destination[4] || null
      
      return {
        pageNum,
        fitType,
        left,
        top,
        zoom
      }
    } catch (error) {
      console.warn('Could not navigate to destination:', error)
      return null
    }
  }

  /**
   * Create annotation data for PDF-lib
   * @param {Array} annotations - Array of annotation objects
   * @returns {Array} Array of PDF-lib compatible annotations
   */
  createPDFLibAnnotations(annotations) {
    return annotations.map(annotation => {
      const baseAnnotation = {
        type: annotation.type,
        page: annotation.page - 1, // PDF-lib uses 0-based page indexing
        color: this.hexToRgb(annotation.color),
        createdAt: annotation.createdAt,
        modifiedAt: annotation.modifiedAt
      }
      
      if (annotation.type === 'highlight') {
        return {
          ...baseAnnotation,
          rect: [
            Math.min(annotation.startX, annotation.endX),
            Math.min(annotation.startY, annotation.endY),
            Math.abs(annotation.endX - annotation.startX),
            Math.abs(annotation.endY - annotation.startY)
          ]
        }
      } else if (annotation.type === 'comment' || annotation.type === 'note') {
        return {
          ...baseAnnotation,
          position: [annotation.x, annotation.y],
          content: annotation.content || ''
        }
      }
      
      return baseAnnotation
    })
  }

  /**
   * Convert hex color to RGB array
   * @param {string} hex - Hex color string
   * @returns {Array} RGB array [r, g, b] with values 0-1
   */
  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? [
      parseInt(result[1], 16) / 255,
      parseInt(result[2], 16) / 255,
      parseInt(result[3], 16) / 255
    ] : [1, 1, 0] // Default to yellow
  }

  /**
   * Save PDF with annotations using pdf-lib
   * @param {string} pdfUrl - Original PDF URL
   * @param {Array} annotations - Annotations to add
   * @returns {Promise<Blob>} Modified PDF as blob
   */
  async savePDFWithAnnotations(pdfUrl, annotations) {
    try {
      // Import pdf-lib dynamically
      const { PDFDocument, rgb } = await import('pdf-lib')
      
      // Load the original PDF
      const existingPdfBytes = await fetch(pdfUrl).then(res => res.arrayBuffer())
      const pdfDoc = await PDFDocument.load(existingPdfBytes)
      
      // Group annotations by page
      const annotationsByPage = {}
      annotations.forEach(annotation => {
        const pageIndex = annotation.page - 1
        if (!annotationsByPage[pageIndex]) {
          annotationsByPage[pageIndex] = []
        }
        annotationsByPage[pageIndex].push(annotation)
      })
      
      // Add annotations to each page
      for (const [pageIndex, pageAnnotations] of Object.entries(annotationsByPage)) {
        const page = pdfDoc.getPage(parseInt(pageIndex))
        
        pageAnnotations.forEach(annotation => {
          if (annotation.type === 'highlight') {
            // Add highlight annotation
            const [r, g, b] = this.hexToRgb(annotation.color)
            
            page.drawRectangle({
              x: Math.min(annotation.startX, annotation.endX),
              y: page.getHeight() - Math.max(annotation.startY, annotation.endY),
              width: Math.abs(annotation.endX - annotation.startX),
              height: Math.abs(annotation.endY - annotation.startY),
              color: rgb(r, g, b),
              opacity: 0.3
            })
          } else if (annotation.type === 'comment' || annotation.type === 'note') {
            // Add text annotation (simplified)
            const [r, g, b] = this.hexToRgb(annotation.color)
            
            page.drawCircle({
              x: annotation.x,
              y: page.getHeight() - annotation.y,
              size: 10,
              color: rgb(r, g, b)
            })
            
            if (annotation.content) {
              page.drawText(annotation.content, {
                x: annotation.x + 15,
                y: page.getHeight() - annotation.y - 5,
                size: 10,
                color: rgb(0, 0, 0)
              })
            }
          }
        })
      }
      
      // Save the PDF
      const pdfBytes = await pdfDoc.save()
      return new Blob([pdfBytes], { type: 'application/pdf' })
      
    } catch (error) {
      console.error('Error saving PDF with annotations:', error)
      throw new Error(`Erreur lors de la sauvegarde: ${error.message}`)
    }
  }

  /**
   * Clean up resources
   * @param {string} url - Object URL to revoke
   */
  cleanup(url) {
    if (url && url.startsWith('blob:')) {
      URL.revokeObjectURL(url)
    }
  }
}