import { describe, it, expect } from 'vitest'
import {
  formatFileSize,
  formatDate,
  detectFileType,
  getFileIcon,
  getFileType,
  getMimeType,
  isImageFile,
  isVideoFile,
  isAudioFile,
  isTextFile,
  isDocumentFile,
  isArchiveFile,
  isCodeFile,
  isExecutableFile,
  formatFileName,
  getFileDescription,
  sortFiles,
  filterFiles
} from '../fileUtils.js'

describe('fileUtils', () => {
  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 B')
      expect(formatFileSize(1024)).toBe('1 KB')
      expect(formatFileSize(1048576)).toBe('1 MB')
      expect(formatFileSize(1073741824)).toBe('1 GB')
      expect(formatFileSize(500)).toBe('500 B')
      expect(formatFileSize(1536)).toBe('1.5 KB')
    })

    it('should handle edge cases', () => {
      expect(formatFileSize(null)).toBe('0 B')
      expect(formatFileSize(undefined)).toBe('0 B')
      expect(formatFileSize(-1)).toBe('N/A')
      expect(formatFileSize('invalid')).toBe('N/A')
    })
  })

  describe('formatDate', () => {
    it('should format dates in French', () => {
      const date = new Date('2024-01-15T10:30:00')
      const formatted = formatDate(date)
      expect(formatted).toContain('2024')
      expect(formatted).toContain('janv.')
    })

    it('should handle relative dates', () => {
      const now = new Date()
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
      
      expect(formatDate(oneHourAgo, 'relative')).toContain('Il y a 1 heure')
    })

    it('should handle invalid dates', () => {
      expect(formatDate('')).toBe('')
      expect(formatDate(null)).toBe('')
      expect(formatDate('invalid')).toBe('')
    })
  })

  describe('detectFileType', () => {
    it('should detect file types correctly', () => {
      expect(detectFileType('document.pdf')).toEqual({
        type: 'pdf',
        category: 'document',
        label: 'Document PDF',
        extension: 'pdf'
      })

      expect(detectFileType('image.jpg')).toEqual({
        type: 'image',
        category: 'image',
        label: 'Image JPEG',
        extension: 'jpg'
      })

      expect(detectFileType('script.js')).toEqual({
        type: 'code',
        category: 'code',
        label: 'JavaScript',
        extension: 'js'
      })
    })

    it('should handle unknown extensions', () => {
      const result = detectFileType('file.unknown')
      expect(result.type).toBe('unknown')
      expect(result.category).toBe('other')
    })
  })

  describe('getFileIcon', () => {
    it('should return folder icon for directories', () => {
      const folder = { is_directory: true, name: 'folder' }
      const result = getFileIcon(folder)
      
      expect(result.icon).toBe('fas fa-folder')
      expect(result.color).toBe('text-blue-500')
    })

    it('should return appropriate icons for files', () => {
      const pdfFile = { is_directory: false, name: 'document.pdf' }
      const result = getFileIcon(pdfFile)
      
      expect(result.icon).toBe('fas fa-file-pdf')
      expect(result.color).toBe('text-red-500')
    })
  })

  describe('file type checkers', () => {
    it('should identify image files', () => {
      expect(isImageFile('photo.jpg')).toBe(true)
      expect(isImageFile('image.png')).toBe(true)
      expect(isImageFile('document.pdf')).toBe(false)
    })

    it('should identify video files', () => {
      expect(isVideoFile('movie.mp4')).toBe(true)
      expect(isVideoFile('clip.avi')).toBe(true)
      expect(isVideoFile('song.mp3')).toBe(false)
    })

    it('should identify audio files', () => {
      expect(isAudioFile('song.mp3')).toBe(true)
      expect(isAudioFile('audio.wav')).toBe(true)
      expect(isAudioFile('movie.mp4')).toBe(false)
    })

    it('should identify document files', () => {
      expect(isDocumentFile('report.pdf')).toBe(true)
      expect(isDocumentFile('sheet.xlsx')).toBe(true)
      expect(isDocumentFile('image.jpg')).toBe(false)
    })

    it('should identify code files', () => {
      expect(isCodeFile('script.js')).toBe(true)
      expect(isCodeFile('style.css')).toBe(true)
      expect(isCodeFile('image.jpg')).toBe(false)
    })
  })

  describe('formatFileName', () => {
    it('should truncate long filenames', () => {
      const longName = 'this-is-a-very-long-filename-that-should-be-truncated.txt'
      const result = formatFileName(longName, 20)
      
      expect(result.length).toBeLessThanOrEqual(24) // 20 + "..." + extension
      expect(result).toContain('...')
      expect(result).toContain('.txt')
    })

    it('should not truncate short filenames', () => {
      const shortName = 'short.txt'
      expect(formatFileName(shortName, 20)).toBe(shortName)
    })
  })

  describe('sortFiles', () => {
    const testFiles = [
      { name: 'zebra.txt', size: 100, is_directory: false, modified_time: '2024-01-01' },
      { name: 'alpha.txt', size: 200, is_directory: false, modified_time: '2024-01-02' },
      { name: 'folder', size: null, is_directory: true, modified_time: '2024-01-01' }
    ]

    it('should sort by name', () => {
      const sorted = sortFiles(testFiles, 'name', 'asc')
      expect(sorted[0].name).toBe('folder') // Folders first
      expect(sorted[1].name).toBe('alpha.txt')
      expect(sorted[2].name).toBe('zebra.txt')
    })

    it('should sort by size', () => {
      const sorted = sortFiles(testFiles, 'size', 'desc')
      expect(sorted[0].name).toBe('folder') // Folders first
      expect(sorted[1].name).toBe('alpha.txt') // Larger file
      expect(sorted[2].name).toBe('zebra.txt')
    })
  })

  describe('filterFiles', () => {
    const testFiles = [
      { name: 'document.pdf', is_directory: false },
      { name: 'image.jpg', is_directory: false },
      { name: 'folder', is_directory: true }
    ]

    it('should filter files by name', () => {
      const filtered = filterFiles(testFiles, 'doc')
      expect(filtered).toHaveLength(1)
      expect(filtered[0].name).toBe('document.pdf')
    })

    it('should return all files when no search term', () => {
      const filtered = filterFiles(testFiles, '')
      expect(filtered).toHaveLength(3)
    })
  })
})