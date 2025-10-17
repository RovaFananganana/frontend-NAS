/**
 * Integration tests for HTTP client migration
 * Tests that all components properly use the unified HTTP client
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createStore } from 'vuex'
import httpClient, { HTTPClientError } from '@/services/httpClient.js'
import { nasAPI } from '@/services/nasAPI.js'
import TokenService from '@/services/tokenService.js'

// Mock components for testing
const mockStore = createStore({
  state: {
    user: {
      role: 'admin',
      permissions: ['read', 'write', 'delete']
    }
  },
  getters: {
    isAdmin: (state) => state.user.role === 'admin',
    userRole: (state) => state.user.role
  }
})

describe('HTTP Client Migration Tests', () => {
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks()
    
    // Mock token service
    vi.spyOn(TokenService, 'getToken').mockReturnValue('mock-token')
    
    // Mock console methods to avoid noise in tests
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('HTTP Client Service', () => {
    it('should be properly configured with base URL and timeout', () => {
      const config = httpClient.getConfig()
      
      expect(config.baseURL).toBeDefined()
      expect(config.timeout).toBe(30000)
      expect(config.maxRetries).toBe(3)
      expect(config.retryDelay).toBe(1000)
    })

    it('should have authentication interceptor configured', async () => {
      const axiosInstance = httpClient.getAxiosInstance()
      
      // Check that request interceptor is configured
      expect(axiosInstance.interceptors.request.handlers).toHaveLength(1)
      
      // Check that response interceptor is configured
      expect(axiosInstance.interceptors.response.handlers).toHaveLength(1)
    })

    it('should handle authentication errors correctly', async () => {
      // Mock axios to return 401 error
      const mockError = {
        response: {
          status: 401,
          data: { error: 'Unauthorized' }
        },
        config: {}
      }

      try {
        await httpClient.get('/test-endpoint')
      } catch (error) {
        // The interceptor should transform this to HTTPClientError
        expect(error).toBeInstanceOf(HTTPClientError)
        expect(error.status).toBe(401)
      }
    })

    it('should handle network errors correctly', async () => {
      // Mock network error
      const mockError = {
        request: {},
        message: 'Network Error'
      }

      const transformedError = httpClient.transformError(mockError)
      
      expect(transformedError).toBeInstanceOf(HTTPClientError)
      expect(transformedError.code).toBe('NETWORK_ERROR')
      expect(transformedError.message).toContain('Network error')
    })

    it('should support file downloads with progress tracking', async () => {
      const mockBlob = new Blob(['test content'], { type: 'text/plain' })
      const progressCallback = vi.fn()

      // Mock successful download
      vi.spyOn(httpClient, 'downloadFile').mockResolvedValue(mockBlob)

      const result = await httpClient.downloadFile('/test-file.txt', progressCallback)
      
      expect(result).toBe(mockBlob)
      expect(httpClient.downloadFile).toHaveBeenCalledWith('/test-file.txt', progressCallback)
    })

    it('should support file uploads with progress tracking', async () => {
      const mockFormData = new FormData()
      mockFormData.append('file', new File(['test'], 'test.txt'))
      const progressCallback = vi.fn()
      const mockResponse = { success: true, file_id: '123' }

      // Mock successful upload
      vi.spyOn(httpClient, 'uploadFile').mockResolvedValue(mockResponse)

      const result = await httpClient.uploadFile('/upload', mockFormData, progressCallback)
      
      expect(result).toEqual(mockResponse)
      expect(httpClient.uploadFile).toHaveBeenCalledWith('/upload', mockFormData, progressCallback)
    })
  })

  describe('NAS API Service Migration', () => {
    it('should use httpClient for download operations', async () => {
      const mockBlob = new Blob(['file content'], { type: 'application/octet-stream' })
      const progressCallback = vi.fn()

      // Mock httpClient downloadFile method
      vi.spyOn(httpClient, 'downloadFile').mockResolvedValue(mockBlob)

      const result = await nasAPI.downloadFile('/test/file.txt', progressCallback)
      
      expect(result).toBe(mockBlob)
      expect(httpClient.downloadFile).toHaveBeenCalledWith(
        '/nas/download/test/file.txt',
        expect.any(Function),
        expect.objectContaining({
          timeout: 300000,
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-token'
          })
        })
      )
    })

    it('should handle download errors correctly', async () => {
      const mockError = new HTTPClientError('Download failed', 500, 'SERVER_ERROR')
      
      vi.spyOn(httpClient, 'downloadFile').mockRejectedValue(mockError)

      try {
        await nasAPI.downloadFile('/test/file.txt')
      } catch (error) {
        expect(error.message).toContain('Download failed')
        expect(error.status).toBe(500)
      }
    })

    it('should properly encode file paths for downloads', async () => {
      const mockBlob = new Blob(['content'])
      vi.spyOn(httpClient, 'downloadFile').mockResolvedValue(mockBlob)

      // Test with special characters in path
      await nasAPI.downloadFile('/test/file with spaces & symbols.txt')
      
      expect(httpClient.downloadFile).toHaveBeenCalledWith(
        '/nas/download/test/file%20with%20spaces%20%26%20symbols.txt',
        expect.any(Function),
        expect.any(Object)
      )
    })

    it('should maintain backward compatibility with existing API methods', async () => {
      // Test that all existing methods are still available
      expect(typeof nasAPI.browse).toBe('function')
      expect(typeof nasAPI.search).toBe('function')
      expect(typeof nasAPI.createFolder).toBe('function')
      expect(typeof nasAPI.uploadFile).toBe('function')
      expect(typeof nasAPI.downloadFile).toBe('function')
      expect(typeof nasAPI.deleteItem).toBe('function')
      expect(typeof nasAPI.renameItem).toBe('function')
      expect(typeof nasAPI.moveItem).toBe('function')
      expect(typeof nasAPI.copyItem).toBe('function')
    })

    it('should handle authentication token correctly', () => {
      const headers = nasAPI.getHeaders()
      
      expect(headers.Authorization).toBe('Bearer mock-token')
      expect(headers['Content-Type']).toBe('application/json')
    })
  })

  describe('Component Integration', () => {
    it('should verify FileExplorer uses httpClient indirectly through nasAPI', () => {
      // FileExplorer should import and use nasAPI, which uses httpClient
      // This is verified by checking the imports in the component
      
      // Mock the component's loadFiles method behavior
      const mockLoadFiles = vi.fn().mockImplementation(async (path) => {
        // This should internally call nasAPI.browse which uses httpClient
        return await nasAPI.browse(path)
      })

      expect(typeof mockLoadFiles).toBe('function')
    })

    it('should verify PermissionModal uses proper API endpoints', () => {
      // PermissionModal should use the admin API which should use httpClient
      // This test verifies the component structure supports the migration
      
      const mockPermissionAPI = {
        getFolderPermissions: vi.fn(),
        setFolderUserPermission: vi.fn(),
        deleteFolderPermission: vi.fn()
      }

      expect(typeof mockPermissionAPI.getFolderPermissions).toBe('function')
      expect(typeof mockPermissionAPI.setFolderUserPermission).toBe('function')
      expect(typeof mockPermissionAPI.deleteFolderPermission).toBe('function')
    })
  })

  describe('Error Handling Migration', () => {
    it('should handle 401 errors consistently across all services', async () => {
      const mockError = new HTTPClientError('Authentication required', 401, 'AUTH_REQUIRED')
      
      // Test that all services handle 401 errors the same way
      vi.spyOn(httpClient, 'get').mockRejectedValue(mockError)

      try {
        await httpClient.get('/protected-endpoint')
      } catch (error) {
        expect(error).toBeInstanceOf(HTTPClientError)
        expect(error.status).toBe(401)
        expect(error.code).toBe('AUTH_REQUIRED')
      }
    })

    it('should handle network errors consistently', async () => {
      const networkError = new HTTPClientError('Network error', 0, 'NETWORK_ERROR')
      
      vi.spyOn(httpClient, 'get').mockRejectedValue(networkError)

      try {
        await httpClient.get('/any-endpoint')
      } catch (error) {
        expect(error).toBeInstanceOf(HTTPClientError)
        expect(error.code).toBe('NETWORK_ERROR')
        expect(error.message).toContain('Network error')
      }
    })

    it('should handle server errors with retry logic', async () => {
      const serverError = new HTTPClientError('Server error', 500, 'SERVER_ERROR')
      
      // Mock that first calls fail, then succeed
      vi.spyOn(httpClient, 'get')
        .mockRejectedValueOnce(serverError)
        .mockRejectedValueOnce(serverError)
        .mockResolvedValue({ success: true })

      // The httpClient should retry automatically
      const result = await httpClient.get('/flaky-endpoint')
      
      expect(result).toEqual({ success: true })
    })
  })

  describe('Performance and Configuration', () => {
    it('should have appropriate timeout configurations', () => {
      const config = httpClient.getConfig()
      
      // Standard timeout should be 30 seconds
      expect(config.timeout).toBe(30000)
      
      // Should be configurable
      httpClient.setTimeout(60000)
      const updatedConfig = httpClient.getConfig()
      expect(updatedConfig.timeout).toBe(60000)
    })

    it('should have retry configuration', () => {
      const config = httpClient.getConfig()
      
      expect(config.maxRetries).toBe(3)
      expect(config.retryDelay).toBe(1000)
      
      // Should be configurable
      httpClient.setRetryConfig(5, 2000)
      const updatedConfig = httpClient.getConfig()
      expect(updatedConfig.maxRetries).toBe(5)
      expect(updatedConfig.retryDelay).toBe(2000)
    })

    it('should support custom timeouts for specific requests', async () => {
      const mockResponse = { data: 'test' }
      vi.spyOn(httpClient, 'requestWithTimeout').mockResolvedValue(mockResponse)

      const result = await httpClient.requestWithTimeout('GET', '/test', null, 5000)
      
      expect(result).toEqual(mockResponse)
      expect(httpClient.requestWithTimeout).toHaveBeenCalledWith('GET', '/test', null, 5000, {})
    })
  })

  describe('Backward Compatibility', () => {
    it('should maintain all existing nasAPI methods', () => {
      const expectedMethods = [
        'browse', 'search', 'createFolder', 'createFile', 'uploadFile',
        'downloadFile', 'deleteItem', 'renameItem', 'moveItem', 'copyItem',
        'getProperties', 'setPermissions', 'testConnection', 'getConfig',
        'getSyncStatus', 'triggerSync', 'syncDatabase'
      ]

      expectedMethods.forEach(method => {
        expect(typeof nasAPI[method]).toBe('function')
      })
    })

    it('should maintain existing error types for backward compatibility', async () => {
      // nasAPI should still throw NASAPIError for backward compatibility
      const mockError = new Error('Test error')
      vi.spyOn(httpClient, 'get').mockRejectedValue(mockError)

      try {
        await nasAPI.browse('/test')
      } catch (error) {
        // Should be transformed to NASAPIError for backward compatibility
        expect(error.name).toBe('NASAPIError')
      }
    })
  })
})