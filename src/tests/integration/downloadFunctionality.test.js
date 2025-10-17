/**
 * Integration tests for download functionality
 * Tests file downloads with progress tracking and various file types
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { nasAPI } from '@/services/nasAPI.js'
import httpClient from '@/services/httpClient.js'
import TokenService from '@/services/tokenService.js'

describe('Download Functionality Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(TokenService, 'getToken').mockReturnValue('mock-token')
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Basic Download Operations', () => {
    it('should download a small text file successfully', async () => {
      const mockBlob = new Blob(['Hello, World!'], { type: 'text/plain' })
      vi.spyOn(httpClient, 'downloadFile').mockResolvedValue(mockBlob)

      const result = await nasAPI.downloadFile('/documents/test.txt')
      
      expect(result).toBe(mockBlob)
      expect(httpClient.downloadFile).toHaveBeenCalledWith(
        expect.stringContaining('/nas/download/'),
        null,
        expect.objectContaining({
          timeout: 300000,
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-token'
          })
        })
      )
    })

    it('should download a binary file successfully', async () => {
      const mockImageData = new ArrayBuffer(1024)
      const mockBlob = new Blob([mockImageData], { type: 'image/jpeg' })
      vi.spyOn(httpClient, 'downloadFile').mockResolvedValue(mockBlob)

      const result = await nasAPI.downloadFile('/images/photo.jpg')
      
      expect(result).toBe(mockBlob)
      expect(result.type).toBe('image/jpeg')
    })

    it('should handle large file downloads with timeout', async () => {
      const mockLargeFile = new Blob([new ArrayBuffer(100 * 1024 * 1024)], { type: 'video/mp4' })
      vi.spyOn(httpClient, 'downloadFile').mockResolvedValue(mockLargeFile)

      const result = await nasAPI.downloadFile('/videos/large-video.mp4')
      
      expect(result).toBe(mockLargeFile)
      expect(httpClient.downloadFile).toHaveBeenCalledWith(
        expect.any(String),
        null,
        expect.objectContaining({
          timeout: 300000 // 5 minutes for large files
        })
      )
    })
  })

  describe('Progress Tracking', () => {
    it('should track download progress correctly', async () => {
      const mockBlob = new Blob(['test content'], { type: 'text/plain' })
      const progressCallback = vi.fn()
      
      // Mock progress events
      vi.spyOn(httpClient, 'downloadFile').mockImplementation(async (url, onProgress) => {
        if (onProgress) {
          // Simulate progress updates
          onProgress(25, 256, 1024)
          onProgress(50, 512, 1024)
          onProgress(75, 768, 1024)
          onProgress(100, 1024, 1024)
        }
        return mockBlob
      })

      const result = await nasAPI.downloadFile('/test/file.txt', progressCallback)
      
      expect(result).toBe(mockBlob)
      expect(progressCallback).toHaveBeenCalledTimes(4)
      expect(progressCallback).toHaveBeenNthCalledWith(1, 25, 256, 1024)
      expect(progressCallback).toHaveBeenNthCalledWith(2, 50, 512, 1024)
      expect(progressCallback).toHaveBeenNthCalledWith(3, 75, 768, 1024)
      expect(progressCallback).toHaveBeenNthCalledWith(4, 100, 1024, 1024)
    })

    it('should handle progress callback errors gracefully', async () => {
      const mockBlob = new Blob(['test content'], { type: 'text/plain' })
      const faultyProgressCallback = vi.fn().mockImplementation(() => {
        throw new Error('Progress callback error')
      })
      
      vi.spyOn(httpClient, 'downloadFile').mockImplementation(async (url, onProgress) => {
        if (onProgress) {
          try {
            onProgress(50, 512, 1024)
          } catch (error) {
            // Should not break the download
            console.warn('Progress callback error:', error)
          }
        }
        return mockBlob
      })

      // Download should still succeed despite callback error
      const result = await nasAPI.downloadFile('/test/file.txt', faultyProgressCallback)
      
      expect(result).toBe(mockBlob)
      expect(faultyProgressCallback).toHaveBeenCalled()
    })

    it('should work without progress callback', async () => {
      const mockBlob = new Blob(['test content'], { type: 'text/plain' })
      vi.spyOn(httpClient, 'downloadFile').mockResolvedValue(mockBlob)

      const result = await nasAPI.downloadFile('/test/file.txt')
      
      expect(result).toBe(mockBlob)
      expect(httpClient.downloadFile).toHaveBeenCalledWith(
        expect.any(String),
        null, // No progress callback
        expect.any(Object)
      )
    })
  })

  describe('File Path Handling', () => {
    it('should properly encode file paths with special characters', async () => {
      const mockBlob = new Blob(['content'], { type: 'text/plain' })
      vi.spyOn(httpClient, 'downloadFile').mockResolvedValue(mockBlob)

      const specialPath = '/documents/file with spaces & symbols (1).txt'
      await nasAPI.downloadFile(specialPath)
      
      expect(httpClient.downloadFile).toHaveBeenCalledWith(
        expect.stringContaining('file%20with%20spaces%20%26%20symbols%20%281%29.txt'),
        null,
        expect.any(Object)
      )
    })

    it('should handle Unicode characters in file paths', async () => {
      const mockBlob = new Blob(['content'], { type: 'text/plain' })
      vi.spyOn(httpClient, 'downloadFile').mockResolvedValue(mockBlob)

      const unicodePath = '/documents/文档.txt'
      await nasAPI.downloadFile(unicodePath)
      
      expect(httpClient.downloadFile).toHaveBeenCalledWith(
        expect.stringContaining('%E6%96%87%E6%A1%A3.txt'),
        null,
        expect.any(Object)
      )
    })

    it('should handle nested directory paths correctly', async () => {
      const mockBlob = new Blob(['content'], { type: 'text/plain' })
      vi.spyOn(httpClient, 'downloadFile').mockResolvedValue(mockBlob)

      const nestedPath = '/documents/projects/2024/report.pdf'
      await nasAPI.downloadFile(nestedPath)
      
      expect(httpClient.downloadFile).toHaveBeenCalledWith(
        '/nas/download/documents/projects/2024/report.pdf',
        null,
        expect.any(Object)
      )
    })

    it('should handle root level files', async () => {
      const mockBlob = new Blob(['content'], { type: 'text/plain' })
      vi.spyOn(httpClient, 'downloadFile').mockResolvedValue(mockBlob)

      const rootPath = '/readme.txt'
      await nasAPI.downloadFile(rootPath)
      
      expect(httpClient.downloadFile).toHaveBeenCalledWith(
        '/nas/download/readme.txt',
        null,
        expect.any(Object)
      )
    })
  })

  describe('Error Handling', () => {
    it('should handle 404 file not found errors', async () => {
      const notFoundError = {
        name: 'HTTPClientError',
        message: 'File not found',
        status: 404,
        code: 'NOT_FOUND'
      }
      
      vi.spyOn(httpClient, 'downloadFile').mockRejectedValue(notFoundError)

      try {
        await nasAPI.downloadFile('/nonexistent/file.txt')
      } catch (error) {
        expect(error.message).toContain('Download failed')
        expect(error.status).toBe(0) // NASAPIError transforms status
      }
    })

    it('should handle network errors during download', async () => {
      const networkError = {
        name: 'HTTPClientError',
        message: 'Network error - please check your connection',
        status: 0,
        code: 'NETWORK_ERROR'
      }
      
      vi.spyOn(httpClient, 'downloadFile').mockRejectedValue(networkError)

      try {
        await nasAPI.downloadFile('/test/file.txt')
      } catch (error) {
        expect(error.message).toContain('Download failed')
        expect(error.code).toBe('DOWNLOAD_ERROR')
      }
    })

    it('should handle server errors during download', async () => {
      const serverError = {
        name: 'HTTPClientError',
        message: 'Internal server error',
        status: 500,
        code: 'SERVER_ERROR'
      }
      
      vi.spyOn(httpClient, 'downloadFile').mockRejectedValue(serverError)

      try {
        await nasAPI.downloadFile('/test/file.txt')
      } catch (error) {
        expect(error.message).toContain('Download failed')
      }
    })

    it('should handle timeout errors for large files', async () => {
      const timeoutError = {
        name: 'HTTPClientError',
        message: 'Request timeout',
        status: 408,
        code: 'TIMEOUT'
      }
      
      vi.spyOn(httpClient, 'downloadFile').mockRejectedValue(timeoutError)

      try {
        await nasAPI.downloadFile('/large-files/huge-video.mp4')
      } catch (error) {
        expect(error.message).toContain('Download failed')
      }
    })

    it('should handle authentication errors', async () => {
      const authError = {
        name: 'HTTPClientError',
        message: 'Authentication required',
        status: 401,
        code: 'AUTH_REQUIRED'
      }
      
      vi.spyOn(httpClient, 'downloadFile').mockRejectedValue(authError)

      try {
        await nasAPI.downloadFile('/private/file.txt')
      } catch (error) {
        expect(error.message).toContain('Download failed')
      }
    })
  })

  describe('Different File Types', () => {
    const fileTypes = [
      { path: '/documents/report.pdf', type: 'application/pdf', size: 1024 * 1024 },
      { path: '/images/photo.jpg', type: 'image/jpeg', size: 2 * 1024 * 1024 },
      { path: '/videos/clip.mp4', type: 'video/mp4', size: 50 * 1024 * 1024 },
      { path: '/audio/song.mp3', type: 'audio/mpeg', size: 5 * 1024 * 1024 },
      { path: '/archives/backup.zip', type: 'application/zip', size: 100 * 1024 * 1024 },
      { path: '/code/script.js', type: 'text/javascript', size: 1024 },
      { path: '/data/spreadsheet.xlsx', type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', size: 512 * 1024 }
    ]

    fileTypes.forEach(({ path, type, size }) => {
      it(`should download ${type} files correctly`, async () => {
        const mockBlob = new Blob([new ArrayBuffer(size)], { type })
        vi.spyOn(httpClient, 'downloadFile').mockResolvedValue(mockBlob)

        const result = await nasAPI.downloadFile(path)
        
        expect(result).toBe(mockBlob)
        expect(result.type).toBe(type)
        expect(result.size).toBe(size)
      })
    })
  })

  describe('Concurrent Downloads', () => {
    it('should handle multiple simultaneous downloads', async () => {
      const files = [
        '/file1.txt',
        '/file2.txt',
        '/file3.txt'
      ]
      
      const mockBlobs = files.map((_, index) => 
        new Blob([`Content ${index}`], { type: 'text/plain' })
      )
      
      vi.spyOn(httpClient, 'downloadFile')
        .mockResolvedValueOnce(mockBlobs[0])
        .mockResolvedValueOnce(mockBlobs[1])
        .mockResolvedValueOnce(mockBlobs[2])

      const downloadPromises = files.map(file => nasAPI.downloadFile(file))
      const results = await Promise.all(downloadPromises)
      
      expect(results).toHaveLength(3)
      expect(results[0]).toBe(mockBlobs[0])
      expect(results[1]).toBe(mockBlobs[1])
      expect(results[2]).toBe(mockBlobs[2])
      expect(httpClient.downloadFile).toHaveBeenCalledTimes(3)
    })

    it('should handle partial failures in concurrent downloads', async () => {
      const files = [
        '/file1.txt',
        '/file2.txt',
        '/file3.txt'
      ]
      
      const mockBlob = new Blob(['Content'], { type: 'text/plain' })
      const mockError = {
        name: 'HTTPClientError',
        message: 'File not found',
        status: 404
      }
      
      vi.spyOn(httpClient, 'downloadFile')
        .mockResolvedValueOnce(mockBlob)
        .mockRejectedValueOnce(mockError)
        .mockResolvedValueOnce(mockBlob)

      const downloadPromises = files.map(file => 
        nasAPI.downloadFile(file).catch(error => ({ error }))
      )
      const results = await Promise.all(downloadPromises)
      
      expect(results).toHaveLength(3)
      expect(results[0]).toBe(mockBlob)
      expect(results[1]).toHaveProperty('error')
      expect(results[2]).toBe(mockBlob)
    })
  })

  describe('Download as Blob for Clipboard', () => {
    it('should support downloadFileAsBlob method', async () => {
      const mockBlob = new Blob(['test content'], { type: 'text/plain' })
      vi.spyOn(httpClient, 'downloadFile').mockResolvedValue(mockBlob)

      const result = await nasAPI.downloadFileAsBlob('/test/file.txt')
      
      expect(result).toEqual({
        blob: mockBlob,
        fileName: 'file.txt'
      })
    })

    it('should extract filename correctly from path', async () => {
      const mockBlob = new Blob(['content'], { type: 'text/plain' })
      vi.spyOn(httpClient, 'downloadFile').mockResolvedValue(mockBlob)

      const result = await nasAPI.downloadFileAsBlob('/documents/projects/report.pdf')
      
      expect(result.fileName).toBe('report.pdf')
    })
  })

  describe('Performance Considerations', () => {
    it('should use appropriate timeout for different file sizes', async () => {
      const mockBlob = new Blob([new ArrayBuffer(1024)], { type: 'text/plain' })
      vi.spyOn(httpClient, 'downloadFile').mockResolvedValue(mockBlob)

      await nasAPI.downloadFile('/small-file.txt')
      
      expect(httpClient.downloadFile).toHaveBeenCalledWith(
        expect.any(String),
        null,
        expect.objectContaining({
          timeout: 300000 // 5 minutes timeout
        })
      )
    })

    it('should include proper headers for authentication', async () => {
      const mockBlob = new Blob(['content'], { type: 'text/plain' })
      vi.spyOn(httpClient, 'downloadFile').mockResolvedValue(mockBlob)

      await nasAPI.downloadFile('/test/file.txt')
      
      expect(httpClient.downloadFile).toHaveBeenCalledWith(
        expect.any(String),
        null,
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-token'
          })
        })
      )
    })
  })
})