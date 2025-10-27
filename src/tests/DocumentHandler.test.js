/**
 * @fileoverview Tests for DocumentHandler
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { DocumentHandler } from '../components/FileViewer/handlers/DocumentHandler.js'

describe('DocumentHandler', () => {
  let handler

  beforeEach(() => {
    handler = new DocumentHandler()
  })

  it('should be created with correct properties', () => {
    expect(handler.name).toBe('DocumentHandler')
    expect(handler.supportedTypes).toBeInstanceOf(Array)
    expect(handler.supportedExtensions).toBeInstanceOf(Array)
    expect(handler.supportedTypes.length).toBeGreaterThan(0)
    expect(handler.supportedExtensions.length).toBeGreaterThan(0)
  })

  it('should detect if it can handle document files', () => {
    // Word documents
    expect(handler.canHandle('document.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')).toBe(true)
    expect(handler.canHandle('document.doc', 'application/msword')).toBe(true)
    
    // Excel documents
    expect(handler.canHandle('spreadsheet.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')).toBe(true)
    expect(handler.canHandle('spreadsheet.xls', 'application/vnd.ms-excel')).toBe(true)
    
    // PowerPoint documents
    expect(handler.canHandle('presentation.pptx', 'application/vnd.openxmlformats-officedocument.presentationml.presentation')).toBe(true)
    expect(handler.canHandle('presentation.ppt', 'application/vnd.ms-powerpoint')).toBe(true)
    
    // Non-document files
    expect(handler.canHandle('image.jpg', 'image/jpeg')).toBe(false)
    expect(handler.canHandle('text.txt', 'text/plain')).toBe(false)
  })

  it('should determine document type correctly', () => {
    expect(handler.getDocumentType('document.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')).toBe('word')
    expect(handler.getDocumentType('document.doc', 'application/msword')).toBe('word')
    
    expect(handler.getDocumentType('spreadsheet.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')).toBe('excel')
    expect(handler.getDocumentType('spreadsheet.xls', 'application/vnd.ms-excel')).toBe('excel')
    
    expect(handler.getDocumentType('presentation.pptx', 'application/vnd.openxmlformats-officedocument.presentationml.presentation')).toBe('powerpoint')
    expect(handler.getDocumentType('presentation.ppt', 'application/vnd.ms-powerpoint')).toBe('powerpoint')
    
    expect(handler.getDocumentType('unknown.xyz', 'application/unknown')).toBe('unknown')
  })

  it('should validate document files', () => {
    const validFile = {
      name: 'document.docx',
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      size: 1024 * 1024 // 1MB
    }
    
    const result = handler.validateDocument(validFile)
    expect(result.valid).toBe(true)
    expect(result.issues).toBeInstanceOf(Array)
  })

  it('should reject files that are too large', () => {
    const largeFile = {
      name: 'large.docx',
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      size: 200 * 1024 * 1024 // 200MB (over 100MB limit)
    }
    
    const result = handler.validateDocument(largeFile)
    expect(result.valid).toBe(false)
    expect(result.issues.some(issue => issue.type === 'error')).toBe(true)
  })

  it('should get document format information', () => {
    const docxFormat = handler.getDocumentFormat('document.docx')
    expect(docxFormat.name).toBe('Word Document')
    expect(docxFormat.version).toBe('2007+')
    expect(docxFormat.editable).toBe(true)
    
    const xlsxFormat = handler.getDocumentFormat('spreadsheet.xlsx')
    expect(xlsxFormat.name).toBe('Excel Spreadsheet')
    expect(xlsxFormat.version).toBe('2007+')
    expect(xlsxFormat.editable).toBe(true)
    
    const pptxFormat = handler.getDocumentFormat('presentation.pptx')
    expect(pptxFormat.name).toBe('PowerPoint Presentation')
    expect(pptxFormat.version).toBe('2007+')
    expect(pptxFormat.editable).toBe(true) // Now enabled with basic editing support
  })

  it('should handle process method for unsupported scenarios', async () => {
    // Test with a file that has no content
    const emptyFile = {
      name: 'empty.docx',
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    }
    
    const result = await handler.process(emptyFile)
    expect(result.type).toBe('document')
    expect(result.editable).toBe(false)
    expect(result.error).toBeDefined()
  })
})