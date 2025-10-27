/**
 * @fileoverview Tests for TextHandler
 */

import { describe, it, expect } from 'vitest'
import { TextHandler } from '../components/FileViewer/handlers/TextHandler.js'

describe('TextHandler', () => {
  let handler

  beforeEach(() => {
    handler = new TextHandler()
  })

  it('should be created with correct properties', () => {
    expect(handler.name).toBe('TextHandler')
    expect(handler.supportedTypes).toContain('text/plain')
    expect(handler.supportedTypes).toContain('application/json')
    expect(handler.supportedExtensions).toContain('txt')
    expect(handler.supportedExtensions).toContain('js')
  })

  it('should detect if it can handle text files', () => {
    expect(handler.canHandle('test.txt', 'text/plain')).toBe(true)
    expect(handler.canHandle('test.js', 'text/javascript')).toBe(true)
    expect(handler.canHandle('test.json', 'application/json')).toBe(true)
    expect(handler.canHandle('test.py', 'text/plain')).toBe(true)
    expect(handler.canHandle('test.jpg', 'image/jpeg')).toBe(false)
  })

  it('should detect encoding correctly', () => {
    // UTF-8 BOM
    const utf8Bom = new ArrayBuffer(6)
    const utf8View = new Uint8Array(utf8Bom)
    utf8View[0] = 0xEF
    utf8View[1] = 0xBB
    utf8View[2] = 0xBF
    utf8View[3] = 0x48 // 'H'
    utf8View[4] = 0x65 // 'e'
    utf8View[5] = 0x6C // 'l'
    
    expect(handler.detectEncoding(utf8Bom)).toBe('utf-8')

    // Plain ASCII (should be detected as UTF-8)
    const ascii = new ArrayBuffer(5)
    const asciiView = new Uint8Array(ascii)
    asciiView[0] = 0x48 // 'H'
    asciiView[1] = 0x65 // 'e'
    asciiView[2] = 0x6C // 'l'
    asciiView[3] = 0x6C // 'l'
    asciiView[4] = 0x6F // 'o'
    
    expect(handler.detectEncoding(ascii)).toBe('utf-8')
  })

  it('should determine Monaco language correctly', () => {
    expect(handler.getMonacoLanguage('test.js')).toBe('javascript')
    expect(handler.getMonacoLanguage('test.json')).toBe('json')
    expect(handler.getMonacoLanguage('test.html')).toBe('html')
    expect(handler.getMonacoLanguage('test.css')).toBe('css')
    expect(handler.getMonacoLanguage('test.py')).toBe('python')
    expect(handler.getMonacoLanguage('test.txt')).toBe('plaintext')
    expect(handler.getMonacoLanguage('unknown.xyz')).toBe('plaintext')
  })

  it('should process text content correctly', async () => {
    const testContent = 'Hello, World!\nThis is a test file.'
    
    // Mock file object with content property (simulating API response)
    const mockFile = {
      name: 'test.txt',
      content: testContent,
      type: 'text/plain'
    }

    const result = await handler.process(mockFile)

    expect(result.type).toBe('text')
    expect(result.content).toBe(testContent)
    expect(result.editable).toBe(true)
    expect(result.metadata.language).toBe('plaintext')
    expect(result.metadata.lineCount).toBe(2)
    expect(result.metadata.wordCount).toBe(7)
    expect(result.metadata.charCount).toBe(testContent.length)
  })

  it('should handle JSON files with validation', async () => {
    const jsonContent = '{"name": "test", "value": 123}'
    
    // Mock file object with content property
    const mockFile = {
      name: 'test.json',
      content: jsonContent,
      type: 'application/json'
    }

    const result = await handler.process(mockFile)

    expect(result.type).toBe('text')
    expect(result.content).toBe(jsonContent)
    expect(result.metadata.language).toBe('json')
  })

  it('should validate JSON content', () => {
    const validJson = '{"valid": true}'
    const invalidJson = '{"invalid": true'

    const validResult = handler.validateContent(validJson, 'json')
    expect(validResult.valid).toBe(true)
    expect(validResult.issues).toHaveLength(0)

    const invalidResult = handler.validateContent(invalidJson, 'json')
    expect(invalidResult.valid).toBe(false)
    expect(invalidResult.issues).toHaveLength(1)
  })

  it('should create save blob correctly', async () => {
    const content = 'Test content for saving'
    const mockFile = { name: 'test.txt' }

    const blob = await handler.saveContent(mockFile, content, 'utf-8')

    expect(blob).toBeInstanceOf(Blob)
    expect(blob.type).toBe('text/plain;charset=utf-8')
    
    // Verify content using FileReader (more compatible)
    const reader = new FileReader()
    const readPromise = new Promise((resolve) => {
      reader.onload = () => resolve(reader.result)
    })
    reader.readAsText(blob)
    const savedContent = await readPromise
    
    expect(savedContent).toBe(content)
  })
})