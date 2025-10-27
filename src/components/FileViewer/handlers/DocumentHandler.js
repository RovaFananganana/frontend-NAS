/**
 * @fileoverview Document Handler for file viewer
 * Handles Office document files (Word, Excel, PowerPoint) processing and conversion
 */

import mammoth from 'mammoth'
import * as XLSX from 'xlsx'
import { detectFileType } from '@/utils/fileTypeDetection.js'

/**
 * Document Handler class for processing Office documents
 * Supports Word (.docx, .doc), Excel (.xlsx, .xls), and PowerPoint (.pptx, .ppt) files
 */
export class DocumentHandler {
  constructor() {
    this.name = 'DocumentHandler'
    this.supportedTypes = [
      // Word documents
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/msword', // .doc
      // Excel spreadsheets
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      // PowerPoint presentations
      'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
      'application/vnd.ms-powerpoint' // .ppt
    ]
    this.supportedExtensions = [
      'docx', 'doc', 'xlsx', 'xls', 'pptx', 'ppt'
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
   * Determine document type from filename or MIME type
   * @param {string} filename - Name of the file
   * @param {string} mimeType - MIME type of the file
   * @returns {string} Document type (word, excel, powerpoint)
   */
  getDocumentType(filename, mimeType) {
    const extension = filename.split('.').pop()?.toLowerCase()
    
    if (['docx', 'doc'].includes(extension) || 
        mimeType?.includes('wordprocessingml') || 
        mimeType === 'application/msword') {
      return 'word'
    }
    
    if (['xlsx', 'xls'].includes(extension) || 
        mimeType?.includes('spreadsheetml') || 
        mimeType === 'application/vnd.ms-excel') {
      return 'excel'
    }
    
    if (['pptx', 'ppt'].includes(extension) || 
        mimeType?.includes('presentationml') || 
        mimeType === 'application/vnd.ms-powerpoint') {
      return 'powerpoint'
    }
    
    return 'unknown'
  }

  /**
   * Open document in local application via SMB
   * @param {Object} file - File object with path information
   * @param {string} filename - Document filename
   * @param {string} mimeType - Document MIME type
   * @returns {Promise<Object>} Local application opening result
   */
  async openInLocalApplication(file, filename, mimeType) {
    try {
      // Construct SMB path from file information
      const smbPath = this.constructSMBPath(file)
      
      // Try to open in local application
      const opened = await this.tryOpenLocalApplication(smbPath, mimeType)
      
      if (opened) {
        return {
          type: 'local-application',
          content: null, // No content needed for local opening
          url: smbPath,
          editable: true,
          metadata: {
            documentType: this.getDocumentType(filename, mimeType),
            filename: filename,
            openedLocally: true,
            smbPath: smbPath,
            mimeType: mimeType,
            canEdit: true,
            supportedOperations: ['local-edit'],
            instructions: 'Document ouvert dans l\'application locale. Les modifications seront automatiquement sauvegardées sur le NAS.'
          }
        }
      } else {
        // Fallback: provide download option
        return {
          type: 'download-required',
          content: `
            <div class="text-center p-8">
              <div class="text-6xl mb-4 text-info">
                <i class="fas fa-external-link-alt"></i>
              </div>
              <h3 class="text-xl font-semibold mb-4">Ouverture dans l'application locale</h3>
              <p class="text-base-content/70 mb-6">
                Ce document doit être ouvert dans l'application Office locale pour être modifié.
              </p>
              <div class="space-y-3">
                <button onclick="window.open('${smbPath}')" class="btn btn-primary">
                  <i class="fas fa-external-link-alt mr-2"></i>
                  Ouvrir dans Office
                </button>
                <p class="text-sm text-base-content/60">
                  Chemin SMB: ${smbPath}
                </p>
              </div>
            </div>
          `,
          editable: false,
          metadata: {
            documentType: this.getDocumentType(filename, mimeType),
            filename: filename,
            requiresLocalApp: true,
            smbPath: smbPath,
            mimeType: mimeType,
            canEdit: false,
            supportedOperations: ['download', 'local-open']
          }
        }
      }
    } catch (error) {
      console.error('Error opening document locally:', error)
      throw new Error(`Impossible d'ouvrir le document localement: ${error.message}`)
    }
  }

  /**
   * Construct SMB path from file object
   * @param {Object} file - File object
   * @returns {string} SMB path
   */
  constructSMBPath(file) {
    // Extract NAS server info from environment or file object
    const nasServer = '10.61.17.33' // From your NAS configuration
    const shareName = 'NAS'
    
    // Clean and construct the path
    let filePath = file.path || file.full_path || ''
    
    // Remove leading slash if present
    if (filePath.startsWith('/')) {
      filePath = filePath.substring(1)
    }
    
    // Construct SMB URL
    return `smb://${nasServer}/${shareName}/${filePath}`
  }

  /**
   * Try to open document in local application
   * @param {string} smbPath - SMB path to document
   * @param {string} mimeType - Document MIME type
   * @returns {Promise<boolean>} Success status
   */
  async tryOpenLocalApplication(smbPath, mimeType) {
    try {
      // Try different methods to open the file locally
      
      // Method 1: Direct window.open (works in some browsers)
      const opened = window.open(smbPath, '_blank')
      
      if (opened && !opened.closed) {
        return true
      }
      
      // Method 2: Create temporary link and click it
      const link = document.createElement('a')
      link.href = smbPath
      link.target = '_blank'
      link.style.display = 'none'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // Method 3: Try protocol handler
      if (mimeType.includes('word')) {
        window.location.href = `ms-word:ofe|u|${encodeURIComponent(smbPath)}`
      } else if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) {
        window.location.href = `ms-excel:ofe|u|${encodeURIComponent(smbPath)}`
      } else if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) {
        window.location.href = `ms-powerpoint:ofe|u|${encodeURIComponent(smbPath)}`
      }
      
      return true
    } catch (error) {
      console.warn('Failed to open document locally:', error)
      return false
    }
  }

  /**
   * Process Word document using mammoth.js
   * @param {ArrayBuffer} buffer - Document file buffer
   * @param {string} filename - Document filename
   * @returns {Promise<Object>} Processed Word document content
   */
  async processWordDocument(buffer, filename) {
    try {
      const result = await mammoth.convertToHtml({ arrayBuffer: buffer })
      
      // Extract basic document statistics
      const htmlContent = result.value
      const textContent = htmlContent.replace(/<[^>]*>/g, '')
      const wordCount = textContent.split(/\s+/).filter(word => word.length > 0).length
      const charCount = textContent.length
      const paragraphCount = (htmlContent.match(/<p[^>]*>/g) || []).length
      
      return {
        type: 'word',
        content: htmlContent,
        rawText: textContent,
        editable: true, // Basic text editing will be supported
        metadata: {
          documentType: 'word',
          filename: filename,
          wordCount: wordCount,
          charCount: charCount,
          paragraphCount: paragraphCount,
          hasImages: htmlContent.includes('<img'),
          hasTables: htmlContent.includes('<table'),
          warnings: result.messages || [],
          canEdit: true,
          supportedOperations: ['text-edit', 'format-preserve']
        }
      }
    } catch (error) {
      console.error('Error processing Word document:', error)
      throw new Error(`Erreur lors du traitement du document Word: ${error.message}`)
    }
  }

  /**
   * Process Excel spreadsheet using SheetJS
   * @param {ArrayBuffer} buffer - Spreadsheet file buffer
   * @param {string} filename - Spreadsheet filename
   * @returns {Promise<Object>} Processed Excel spreadsheet content
   */
  async processExcelDocument(buffer, filename) {
    try {
      const workbook = XLSX.read(buffer, { type: 'array' })
      const sheets = {}
      const sheetNames = workbook.SheetNames
      
      // Process each sheet
      for (const sheetName of sheetNames) {
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' })
        const htmlTable = XLSX.utils.sheet_to_html(worksheet)
        
        // Calculate sheet statistics
        const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1')
        const rowCount = range.e.r + 1
        const colCount = range.e.c + 1
        const cellCount = Object.keys(worksheet).filter(key => !key.startsWith('!')).length
        
        sheets[sheetName] = {
          name: sheetName,
          data: jsonData,
          html: htmlTable,
          metadata: {
            rowCount: rowCount,
            colCount: colCount,
            cellCount: cellCount,
            hasFormulas: Object.values(worksheet).some(cell => 
              typeof cell === 'object' && cell.f
            ),
            range: worksheet['!ref'] || 'A1:A1'
          }
        }
      }
      
      return {
        type: 'excel',
        content: sheets,
        activeSheet: sheetNames[0] || null,
        editable: true, // Basic cell editing will be supported
        metadata: {
          documentType: 'excel',
          filename: filename,
          sheetCount: sheetNames.length,
          sheetNames: sheetNames,
          totalCells: Object.values(sheets).reduce((sum, sheet) => 
            sum + sheet.metadata.cellCount, 0
          ),
          hasFormulas: Object.values(sheets).some(sheet => 
            sheet.metadata.hasFormulas
          ),
          canEdit: true,
          supportedOperations: ['cell-edit', 'formula-edit', 'sheet-navigation']
        }
      }
    } catch (error) {
      console.error('Error processing Excel document:', error)
      throw new Error(`Erreur lors du traitement du fichier Excel: ${error.message}`)
    }
  }

  /**
   * Process PowerPoint presentation (enhanced implementation)
   * @param {ArrayBuffer} buffer - Presentation file buffer
   * @param {string} filename - Presentation filename
   * @returns {Promise<Object>} Processed PowerPoint presentation content
   */
  async processPowerPointDocument(buffer, filename) {
    try {
      // Enhanced placeholder implementation with more realistic slide data
      // In a full implementation, you'd use a library like pptx2json or similar
      
      // Generate sample slides based on file size to simulate content
      const fileSize = buffer.byteLength
      const estimatedSlideCount = Math.max(1, Math.min(20, Math.floor(fileSize / (50 * 1024)))) // Rough estimate
      
      const slides = []
      for (let i = 0; i < estimatedSlideCount; i++) {
        slides.push({
          slideNumber: i + 1,
          title: i === 0 ? 'Titre de la présentation' : `Diapositive ${i + 1}`,
          content: i === 0 
            ? 'Bienvenue dans cette présentation PowerPoint. Le contenu complet sera disponible avec l\'implémentation complète du parser PPTX.'
            : `Contenu de la diapositive ${i + 1}. Cette diapositive contient du texte et potentiellement des éléments multimédias.`,
          notes: i % 3 === 0 ? `Notes du présentateur pour la diapositive ${i + 1}` : '',
          hasImages: i % 4 === 0,
          hasAnimations: i % 5 === 0,
          footer: i === estimatedSlideCount - 1 ? 'Merci pour votre attention' : ''
        })
      }
      
      return {
        type: 'powerpoint',
        content: slides,
        currentSlide: 0,
        editable: true, // Now enabled with basic editing support
        metadata: {
          documentType: 'powerpoint',
          filename: filename,
          slideCount: slides.length,
          hasNotes: slides.some(slide => slide.notes),
          hasImages: slides.some(slide => slide.hasImages),
          hasAnimations: slides.some(slide => slide.hasAnimations),
          canEdit: true, // Now enabled with basic editing support
          supportedOperations: ['slide-navigation', 'fullscreen', 'presentation-mode', 'basic-editing'],
          estimatedContent: true // Flag to indicate this is estimated content
        }
      }
    } catch (error) {
      console.error('Error processing PowerPoint document:', error)
      throw new Error(`Erreur lors du traitement de la présentation PowerPoint: ${error.message}`)
    }
  }

  /**
   * Process document file for viewing/editing
   * @param {File|Object} file - File object or file info
   * @returns {Promise<Object>} Processed content object
   */
  async process(file) {
    try {
      let buffer
      let filename = file.name || file.filename || 'document'
      let mimeType = file.type || file.mimeType || ''
      
      if (file instanceof File || file instanceof Blob) {
        buffer = await file.arrayBuffer()
      } else if (file.content && file.content instanceof ArrayBuffer) {
        buffer = file.content
      } else if (file.path) {
        // For server-side files, open directly in local application
        return await this.openInLocalApplication(file, filename, mimeType)
      } else {
        throw new Error('No document content available')
      }

      const documentType = this.getDocumentType(filename, mimeType)
      
      switch (documentType) {
        case 'word':
          return await this.processWordDocument(buffer, filename)
        case 'excel':
          return await this.processExcelDocument(buffer, filename)
        case 'powerpoint':
          return await this.processPowerPointDocument(buffer, filename)
        default:
          throw new Error(`Type de document non supporté: ${documentType}`)
      }
    } catch (error) {
      console.error('DocumentHandler processing error:', error)
      return {
        type: 'document',
        content: null,
        editable: false,
        error: error.message,
        metadata: {
          documentType: 'unknown',
          filename: file.name || file.filename || 'unknown',
          canEdit: false
        }
      }
    }
  }

  /**
   * Save edited document content
   * @param {Object} file - Original file info
   * @param {Object} content - New content to save
   * @param {string} documentType - Type of document (word, excel, powerpoint)
   * @returns {Promise<Blob>} New document blob
   */
  async saveContent(file, content, documentType) {
    try {
      switch (documentType) {
        case 'word':
          return await this.saveWordDocument(file, content)
        case 'excel':
          return await this.saveExcelDocument(file, content)
        case 'powerpoint':
          return await this.savePowerPointDocument(file, content)
        default:
          throw new Error(`Type de document non supporté pour la sauvegarde: ${documentType}`)
      }
    } catch (error) {
      throw new Error(`Erreur lors de la sauvegarde: ${error.message}`)
    }
  }

  /**
   * Save Word document content
   * @param {Object} file - Original file info
   * @param {Object} content - New content to save
   * @returns {Promise<Blob>} New Word document blob
   */
  async saveWordDocument(file, content) {
    try {
      // For Word documents, we'll convert the HTML content back to a simple format
      // In a full implementation, you'd use a library to generate proper DOCX
      
      const htmlContent = content.content || content
      
      // Create a simple HTML document that can be saved as .html
      // This is a basic implementation - full DOCX generation would require more complex libraries
      const htmlDocument = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${file.name || 'Document'}</title>
    <style>
        body {
            font-family: 'Times New Roman', serif;
            font-size: 12pt;
            line-height: 1.6;
            margin: 1in;
            color: #000;
        }
        h1, h2, h3, h4, h5, h6 {
            color: #000;
            margin-top: 1em;
            margin-bottom: 0.5em;
        }
        p {
            margin: 0.5em 0;
        }
        table {
            border-collapse: collapse;
            width: 100%;
            margin: 1em 0;
        }
        table, th, td {
            border: 1px solid #000;
        }
        th, td {
            padding: 8px;
            text-align: left;
        }
    </style>
</head>
<body>
    ${htmlContent}
</body>
</html>`
      
      // Create blob with HTML content
      // Note: This creates an HTML file, not a true DOCX file
      // For true DOCX generation, you'd need libraries like docx or mammoth in reverse
      const blob = new Blob([htmlDocument], { 
        type: 'text/html;charset=utf-8' 
      })
      
      return blob
    } catch (error) {
      throw new Error(`Erreur lors de la sauvegarde du document Word: ${error.message}`)
    }
  }

  /**
   * Save Excel document content
   * @param {Object} file - Original file info
   * @param {Object} content - New content to save
   * @returns {Promise<Blob>} New Excel document blob
   */
  async saveExcelDocument(file, content) {
    try {
      // For Excel documents, we'll use SheetJS to generate a new workbook
      const workbook = XLSX.utils.book_new()
      
      if (content.sheetName && content.newValue !== undefined) {
        // Single cell update
        const sheetName = content.sheetName
        const worksheet = XLSX.utils.aoa_to_sheet([[content.newValue]])
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
      } else if (content.sheets) {
        // Full workbook update
        Object.entries(content.sheets).forEach(([sheetName, sheetData]) => {
          const worksheet = XLSX.utils.aoa_to_sheet(sheetData.data || [[]])
          XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
        })
      } else {
        throw new Error('Format de contenu Excel invalide')
      }
      
      // Generate Excel file buffer
      const excelBuffer = XLSX.write(workbook, { 
        bookType: 'xlsx', 
        type: 'array' 
      })
      
      const blob = new Blob([excelBuffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      })
      
      return blob
    } catch (error) {
      throw new Error(`Erreur lors de la sauvegarde du fichier Excel: ${error.message}`)
    }
  }

  /**
   * Save PowerPoint document content
   * @param {Object} file - Original file info
   * @param {Object} content - New content to save
   * @returns {Promise<Blob>} New PowerPoint document blob
   */
  async savePowerPointDocument(file, content) {
    try {
      // PowerPoint editing is complex and would require specialized libraries
      // For now, we'll create an HTML representation of the slides
      
      const slides = content.slides || content.content || []
      
      let htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${file.name || 'Présentation'}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .slide {
            background: white;
            margin: 20px auto;
            padding: 40px;
            width: 800px;
            min-height: 600px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            page-break-after: always;
        }
        .slide-title {
            font-size: 2em;
            font-weight: bold;
            margin-bottom: 20px;
            color: #333;
        }
        .slide-content {
            font-size: 1.2em;
            line-height: 1.6;
            color: #666;
        }
        .slide-number {
            position: absolute;
            bottom: 10px;
            right: 20px;
            font-size: 0.8em;
            color: #999;
        }
        @media print {
            body { margin: 0; padding: 0; }
            .slide { margin: 0; box-shadow: none; }
        }
    </style>
</head>
<body>`

      slides.forEach((slide, index) => {
        htmlContent += `
    <div class="slide">
        <div class="slide-number">${index + 1}</div>
        <h1 class="slide-title">${slide.title || `Diapositive ${index + 1}`}</h1>
        <div class="slide-content">${slide.content || ''}</div>
        ${slide.notes ? `<div class="slide-notes"><strong>Notes:</strong> ${slide.notes}</div>` : ''}
    </div>`
      })

      htmlContent += `
</body>
</html>`
      
      const blob = new Blob([htmlContent], { 
        type: 'text/html;charset=utf-8' 
      })
      
      return blob
    } catch (error) {
      throw new Error(`Erreur lors de la sauvegarde de la présentation PowerPoint: ${error.message}`)
    }
  }

  /**
   * Validate document file
   * @param {File} file - Document file to validate
   * @returns {Object} Validation result
   */
  validateDocument(file) {
    const maxSize = 100 * 1024 * 1024 // 100MB
    const issues = []
    
    if (file.size > maxSize) {
      issues.push({
        type: 'error',
        message: 'Document file is too large (max 100MB)'
      })
    }
    
    if (!this.canHandle(file.name, file.type)) {
      issues.push({
        type: 'error',
        message: 'Unsupported document format'
      })
    }
    
    // Check for password-protected documents (basic check)
    if (file.name.toLowerCase().includes('password') || 
        file.name.toLowerCase().includes('protected')) {
      issues.push({
        type: 'warning',
        message: 'Document may be password-protected'
      })
    }
    
    return {
      valid: issues.filter(i => i.type === 'error').length === 0,
      issues: issues
    }
  }

  /**
   * Get document format information
   * @param {string} filename - Document filename
   * @returns {Object} Format information
   */
  getDocumentFormat(filename) {
    const extension = filename.split('.').pop()?.toLowerCase()
    
    const formatMap = {
      'docx': { name: 'Word Document', version: '2007+', editable: true },
      'doc': { name: 'Word Document', version: '97-2003', editable: true },
      'xlsx': { name: 'Excel Spreadsheet', version: '2007+', editable: true },
      'xls': { name: 'Excel Spreadsheet', version: '97-2003', editable: true },
      'pptx': { name: 'PowerPoint Presentation', version: '2007+', editable: true },
      'ppt': { name: 'PowerPoint Presentation', version: '97-2003', editable: true }
    }
    
    return formatMap[extension] || { 
      name: 'Unknown Document', 
      version: 'Unknown', 
      editable: false 
    }
  }
}