// tests/unit/useActivityLogger.test.js
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { nextTick } from 'vue'
import { useActivityLogger, useGlobalActivityLogger, ActivityTypes } from '@/composables/useActivityLogger.js'

// Mock the activityAPI
vi.mock('@/services/activityAPI.js', () => ({
  activityAPI: {
    logActivity: vi.fn().mockResolvedValue({ success: true })
  }
}))

// Mock navigator.sendBeacon
Object.defineProperty(navigator, 'sendBeacon', {
  value: vi.fn().mockReturnValue(true),
  writable: true
})

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn().mockReturnValue('test-token'),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

describe('useActivityLogger', () => {
  let activityLogger
  let mockActivityAPI

  beforeEach(async () => {
    vi.clearAllMocks()
    
    // Import the mocked activityAPI
    const { activityAPI } = await import('@/services/activityAPI.js')
    mockActivityAPI = activityAPI
    
    // Create a fresh instance for each test
    activityLogger = useActivityLogger()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('logActivity', () => {
    it('should log activity immediately when batch is false', async () => {
      await activityLogger.logActivity('test_action', '/test/resource', { test: 'data' }, true, false)
      
      expect(mockActivityAPI.logActivity).toHaveBeenCalledWith({
        action: 'test_action',
        resource: '/test/resource',
        details: expect.objectContaining({
          test: 'data',
          timestamp: expect.any(String),
          user_agent: expect.any(String),
          url: expect.any(String)
        }),
        success: true
      })
    })

    it('should add activity to batch queue when batch is true', async () => {
      await activityLogger.logActivity('test_action', '/test/resource', { test: 'data' }, true, true)
      
      // Should not call API immediately
      expect(mockActivityAPI.logActivity).not.toHaveBeenCalled()
      
      // Should have item in queue
      expect(activityLogger.logQueue.value).toHaveLength(1)
    })

    it('should process batch when queue reaches batch size', async () => {
      // Add activities to reach batch size (5)
      for (let i = 0; i < 5; i++) {
        await activityLogger.logActivity(`action_${i}`, `/resource_${i}`, {}, true, true)
      }
      
      // Wait for batch processing
      await nextTick()
      
      expect(mockActivityAPI.logActivity).toHaveBeenCalledTimes(5)
      expect(activityLogger.logQueue.value).toHaveLength(0)
    })

    it('should handle logging errors gracefully', async () => {
      mockActivityAPI.logActivity.mockRejectedValue(new Error('API Error'))
      
      // Should not throw error
      await expect(activityLogger.logActivity('test_action')).resolves.toBeUndefined()
      
      expect(activityLogger.isLogging.value).toBe(false)
    })

    it('should set isLogging flag during logging', async () => {
      let isLoggingDuringCall = false
      
      mockActivityAPI.logActivity.mockImplementation(async () => {
        isLoggingDuringCall = activityLogger.isLogging.value
        return { success: true }
      })
      
      await activityLogger.logActivity('test_action')
      
      expect(isLoggingDuringCall).toBe(true)
      expect(activityLogger.isLogging.value).toBe(false)
    })
  })

  describe('logNavigation', () => {
    it('should log navigation activity with correct parameters', async () => {
      await activityLogger.logNavigation('/dashboard', { section: 'main' })
      
      // Should be batched by default
      expect(activityLogger.logQueue.value).toHaveLength(1)
      
      const queuedActivity = activityLogger.logQueue.value[0]
      expect(queuedActivity.action).toBe('navigation')
      expect(queuedActivity.resource).toBe('/dashboard')
      expect(queuedActivity.details).toMatchObject({
        page: '/dashboard',
        section: 'main',
        referrer: expect.any(String)
      })
    })
  })

  describe('logFileOperation', () => {
    it('should map file operations to correct actions', async () => {
      const operationMappings = [
        ['browse', 'navigation'],
        ['download', 'file_download'],
        ['upload', 'file_upload'],
        ['delete', 'file_delete'],
        ['rename', 'file_rename'],
        ['move', 'file_move'],
        ['copy', 'file_copy'],
        ['create_folder', 'folder_create'],
        ['delete_folder', 'folder_delete']
      ]
      
      for (const [operation, expectedAction] of operationMappings) {
        await activityLogger.logFileOperation(operation, '/test/file.txt', { size: 1024 })
        
        expect(mockActivityAPI.logActivity).toHaveBeenCalledWith(
          expect.objectContaining({
            action: expectedAction,
            resource: '/test/file.txt',
            details: expect.objectContaining({
              operation,
              file_path: '/test/file.txt',
              size: 1024
            })
          })
        )
        
        vi.clearAllMocks()
      }
    })

    it('should handle unknown operations', async () => {
      await activityLogger.logFileOperation('unknown_operation', '/test/file.txt')
      
      expect(mockActivityAPI.logActivity).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'unknown_operation',
          resource: '/test/file.txt'
        })
      )
    })

    it('should log failed file operations', async () => {
      await activityLogger.logFileOperation('download', '/test/file.txt', { error: 'Not found' }, false)
      
      expect(mockActivityAPI.logActivity).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'file_download',
          success: false,
          details: expect.objectContaining({
            error: 'Not found'
          })
        })
      )
    })
  })

  describe('logAuth', () => {
    it('should log authentication activities', async () => {
      await activityLogger.logAuth('login', { method: 'password' }, true)
      
      expect(mockActivityAPI.logActivity).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'login',
          resource: null,
          details: expect.objectContaining({
            auth_type: 'login',
            method: 'password'
          }),
          success: true
        })
      )
    })

    it('should log failed authentication', async () => {
      await activityLogger.logAuth('login', { error: 'Invalid credentials' }, false)
      
      expect(mockActivityAPI.logActivity).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'login',
          success: false,
          details: expect.objectContaining({
            error: 'Invalid credentials'
          })
        })
      )
    })
  })

  describe('logFavorite', () => {
    it('should map favorite operations to correct actions', async () => {
      const operationMappings = [
        ['add', 'favorite_add'],
        ['remove', 'favorite_remove'],
        ['navigate', 'navigation']
      ]
      
      for (const [operation, expectedAction] of operationMappings) {
        await activityLogger.logFavorite(operation, '/favorite/path')
        
        // Should be batched
        expect(activityLogger.logQueue.value).toHaveLength(1)
        
        const queuedActivity = activityLogger.logQueue.value[0]
        expect(queuedActivity.action).toBe(expectedAction)
        expect(queuedActivity.resource).toBe('/favorite/path')
        
        // Clear queue for next test
        activityLogger.logQueue.value = []
      }
    })
  })

  describe('logError', () => {
    it('should log error activities with error details', async () => {
      const error = new Error('Test error')
      error.stack = 'Error stack trace'
      
      await activityLogger.logError(error, 'file_upload', { file: 'test.txt' })
      
      expect(mockActivityAPI.logActivity).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'error',
          resource: 'file_upload',
          details: expect.objectContaining({
            error_message: 'Test error',
            error_stack: 'Error stack trace',
            error_context: 'file_upload',
            file: 'test.txt'
          }),
          success: false
        })
      )
    })
  })

  describe('batch processing', () => {
    it('should process batch manually', async () => {
      // Add items to queue
      activityLogger.logQueue.value = [
        { action: 'test1', resource: null, details: {}, success: true },
        { action: 'test2', resource: null, details: {}, success: true }
      ]
      
      await activityLogger.processBatch()
      
      expect(mockActivityAPI.logActivity).toHaveBeenCalledTimes(2)
      expect(activityLogger.logQueue.value).toHaveLength(0)
    })

    it('should handle batch processing errors', async () => {
      mockActivityAPI.logActivity.mockRejectedValue(new Error('Batch error'))
      
      activityLogger.logQueue.value = [
        { action: 'test1', resource: null, details: {}, success: true }
      ]
      
      // Should not throw error
      await expect(activityLogger.processBatch()).resolves.toBeUndefined()
      
      expect(activityLogger.isLogging.value).toBe(false)
    })

    it('should flush logs on demand', async () => {
      // Add items to queue
      activityLogger.logQueue.value = [
        { action: 'test1', resource: null, details: {}, success: true }
      ]
      
      await activityLogger.flushLogs()
      
      expect(mockActivityAPI.logActivity).toHaveBeenCalledTimes(1)
      expect(activityLogger.logQueue.value).toHaveLength(0)
    })
  })

  describe('page unload handling', () => {
    it('should use sendBeacon on page unload when available', () => {
      // Add items to queue
      activityLogger.logQueue.value = [
        { action: 'test1', resource: null, details: {}, success: true }
      ]
      
      // Simulate beforeunload event
      const beforeUnloadEvent = new Event('beforeunload')
      window.dispatchEvent(beforeUnloadEvent)
      
      expect(navigator.sendBeacon).toHaveBeenCalledWith(
        '/api/activities/batch',
        expect.any(Blob)
      )
      expect(activityLogger.logQueue.value).toHaveLength(0)
    })

    it('should not use sendBeacon when no token available', () => {
      localStorageMock.getItem.mockReturnValue(null)
      
      activityLogger.logQueue.value = [
        { action: 'test1', resource: null, details: {}, success: true }
      ]
      
      const beforeUnloadEvent = new Event('beforeunload')
      window.dispatchEvent(beforeUnloadEvent)
      
      expect(navigator.sendBeacon).not.toHaveBeenCalled()
    })
  })
})

describe('useGlobalActivityLogger', () => {
  it('should return the same instance on multiple calls', () => {
    const logger1 = useGlobalActivityLogger()
    const logger2 = useGlobalActivityLogger()
    
    expect(logger1).toBe(logger2)
  })
})

describe('ActivityTypes', () => {
  it('should export all activity type constants', () => {
    expect(ActivityTypes.LOGIN).toBe('login')
    expect(ActivityTypes.LOGOUT).toBe('logout')
    expect(ActivityTypes.NAVIGATION).toBe('navigation')
    expect(ActivityTypes.FILE_DOWNLOAD).toBe('file_download')
    expect(ActivityTypes.FILE_UPLOAD).toBe('file_upload')
    expect(ActivityTypes.FILE_DELETE).toBe('file_delete')
    expect(ActivityTypes.FILE_RENAME).toBe('file_rename')
    expect(ActivityTypes.FILE_MOVE).toBe('file_move')
    expect(ActivityTypes.FILE_COPY).toBe('file_copy')
    expect(ActivityTypes.FOLDER_CREATE).toBe('folder_create')
    expect(ActivityTypes.FOLDER_DELETE).toBe('folder_delete')
    expect(ActivityTypes.FAVORITE_ADD).toBe('favorite_add')
    expect(ActivityTypes.FAVORITE_REMOVE).toBe('favorite_remove')
    expect(ActivityTypes.ERROR).toBe('error')
  })
})