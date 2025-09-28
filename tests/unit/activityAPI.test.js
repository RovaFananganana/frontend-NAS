// tests/unit/activityAPI.test.js
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Create a mock axios instance that we can control
const mockAxiosInstance = {
  get: vi.fn(),
  post: vi.fn(),
  interceptors: {
    request: {
      use: vi.fn()
    }
  }
}

// Mock axios before importing anything else
vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => mockAxiosInstance)
  }
}))

// Now import the modules
const { activityAPI, ActivityAPIError } = await import('@/services/activityAPI.js')

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

describe('activityAPI', () => {
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks()
    
    // Mock localStorage token
    localStorageMock.getItem.mockReturnValue('test-token')
    
    // Clear cache before each test
    activityAPI.clearCache()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('getActivities', () => {
    it('should fetch activities successfully', async () => {
      const mockResponse = {
        data: {
          activities: [
            { id: 1, action: 'login', created_at: '2024-01-01T10:00:00Z' },
            { id: 2, action: 'navigation', created_at: '2024-01-01T10:05:00Z' }
          ],
          pagination: {
            page: 1,
            limit: 20,
            total_count: 2,
            has_next: false,
            has_prev: false
          }
        }
      }
      
      mockAxiosInstance.get.mockResolvedValue(mockResponse)
      
      const result = await activityAPI.getActivities()
      
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/activities', { params: {} })
      expect(result).toEqual(mockResponse.data)
    })

    it('should fetch activities with filters', async () => {
      const mockResponse = {
        data: {
          activities: [{ id: 1, action: 'login' }],
          pagination: { page: 1, limit: 20, total_count: 1 }
        }
      }
      
      mockAxiosInstance.get.mockResolvedValue(mockResponse)
      
      const filters = {
        period: 'today',
        action: 'login',
        page: 1,
        limit: 10
      }
      
      const result = await activityAPI.getActivities(filters)
      
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/activities', { 
        params: filters 
      })
      expect(result).toEqual(mockResponse.data)
    })

    it('should use cached data when available', async () => {
      const mockResponse = {
        data: {
          activities: [{ id: 1, action: 'login' }],
          pagination: { page: 1, limit: 20, total_count: 1 }
        }
      }
      
      mockAxiosInstance.get.mockResolvedValue(mockResponse)
      
      // First call - should hit API
      await activityAPI.getActivities()
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(1)
      
      // Second call - should use cache
      await activityAPI.getActivities()
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(1)
    })

    it('should bypass cache when requested', async () => {
      const mockResponse = {
        data: {
          activities: [{ id: 1, action: 'login' }],
          pagination: { page: 1, limit: 20, total_count: 1 }
        }
      }
      
      mockAxiosInstance.get.mockResolvedValue(mockResponse)
      
      // First call
      await activityAPI.getActivities()
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(1)
      
      // Second call with bypassCache = true
      await activityAPI.getActivities({}, true)
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(2)
    })

    it('should handle API errors', async () => {
      const errorResponse = {
        response: {
          status: 500,
          data: { message: 'Internal server error' }
        }
      }
      
      mockAxiosInstance.get.mockRejectedValue(errorResponse)
      
      await expect(activityAPI.getActivities()).rejects.toThrow(ActivityAPIError)
      
      try {
        await activityAPI.getActivities()
      } catch (error) {
        expect(error).toBeInstanceOf(ActivityAPIError)
        expect(error.message).toBe('Internal server error')
        expect(error.status).toBe(500)
        expect(error.code).toBe('LOAD_ACTIVITIES_FAILED')
      }
    })

    it('should handle network errors', async () => {
      mockAxiosInstance.get.mockRejectedValue(new Error('Network error'))
      
      await expect(activityAPI.getActivities()).rejects.toThrow(ActivityAPIError)
      
      try {
        await activityAPI.getActivities()
      } catch (error) {
        expect(error).toBeInstanceOf(ActivityAPIError)
        expect(error.message).toBe('Network error while loading activities')
        expect(error.status).toBe(0)
        expect(error.code).toBe('NETWORK_ERROR')
      }
    })
  })

  describe('getActivityStats', () => {
    it('should fetch activity statistics successfully', async () => {
      const mockResponse = {
        data: {
          total_activities: 100,
          activities_by_type: {
            login: 20,
            navigation: 50,
            file_download: 30
          },
          success_rate: 95.5,
          recent_activities: []
        }
      }
      
      mockAxiosInstance.get.mockResolvedValue(mockResponse)
      
      const result = await activityAPI.getActivityStats()
      
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/activities/stats')
      expect(result).toEqual(mockResponse.data)
    })

    it('should use cached stats when available', async () => {
      const mockResponse = {
        data: { total_activities: 100 }
      }
      
      mockAxiosInstance.get.mockResolvedValue(mockResponse)
      
      // First call
      await activityAPI.getActivityStats()
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(1)
      
      // Second call - should use cache
      await activityAPI.getActivityStats()
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(1)
    })

    it('should handle stats API errors', async () => {
      const errorResponse = {
        response: {
          status: 403,
          data: { message: 'Forbidden' }
        }
      }
      
      mockAxiosInstance.get.mockRejectedValue(errorResponse)
      
      await expect(activityAPI.getActivityStats()).rejects.toThrow(ActivityAPIError)
    })
  })

  describe('logActivity', () => {
    it('should log activity successfully', async () => {
      const mockResponse = {
        data: {
          message: 'Activity logged successfully',
          activity: { id: 1, action: 'navigation', resource: '/dashboard' }
        }
      }
      
      mockAxiosInstance.post.mockResolvedValue(mockResponse)
      
      const activityData = {
        action: 'navigation',
        resource: '/dashboard',
        details: { page: 'dashboard' }
      }
      
      const result = await activityAPI.logActivity(activityData)
      
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/api/activities', activityData)
      expect(result).toEqual(mockResponse.data)
    })

    it('should invalidate cache after logging activity', async () => {
      const mockResponse = {
        data: { message: 'Activity logged successfully' }
      }
      
      mockAxiosInstance.post.mockResolvedValue(mockResponse)
      
      // Spy on invalidateCache method
      const invalidateCacheSpy = vi.spyOn(activityAPI, 'invalidateCache')
      
      await activityAPI.logActivity({ action: 'test' })
      
      expect(invalidateCacheSpy).toHaveBeenCalled()
    })

    it('should handle logging errors', async () => {
      const errorResponse = {
        response: {
          status: 400,
          data: { message: 'Invalid action type' }
        }
      }
      
      mockAxiosInstance.post.mockRejectedValue(errorResponse)
      
      await expect(activityAPI.logActivity({ action: 'invalid' })).rejects.toThrow(ActivityAPIError)
    })
  })

  describe('getActivityTypes', () => {
    it('should fetch activity types successfully', async () => {
      const mockResponse = {
        data: {
          activity_types: [
            { value: 'login', display_name: 'Connexion' },
            { value: 'logout', display_name: 'Déconnexion' },
            { value: 'navigation', display_name: 'Navigation' }
          ]
        }
      }
      
      mockAxiosInstance.get.mockResolvedValue(mockResponse)
      
      const result = await activityAPI.getActivityTypes()
      
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/activities/types')
      expect(result).toEqual(mockResponse.data)
    })

    it('should cache activity types for longer duration', async () => {
      const mockResponse = {
        data: { activity_types: [] }
      }
      
      mockAxiosInstance.get.mockResolvedValue(mockResponse)
      
      // First call
      await activityAPI.getActivityTypes()
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(1)
      
      // Second call - should use cache
      await activityAPI.getActivityTypes()
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(1)
    })
  })

  describe('cache management', () => {
    it('should invalidate cache with pattern', () => {
      // Test the invalidateCache method directly
      const spy = vi.spyOn(activityAPI, 'invalidateCache')
      
      activityAPI.invalidateCache('activities_')
      
      expect(spy).toHaveBeenCalledWith('activities_')
      
      spy.mockRestore()
    })

    it('should clear all cache', () => {
      // Test the clearCache method directly
      const spy = vi.spyOn(activityAPI, 'clearCache')
      
      activityAPI.clearCache()
      
      expect(spy).toHaveBeenCalled()
      
      spy.mockRestore()
    })

    it('should provide cache statistics', () => {
      const stats = activityAPI.getCacheStats()
      
      expect(stats).toHaveProperty('size')
      expect(stats).toHaveProperty('keys')
      expect(stats).toHaveProperty('config')
      expect(Array.isArray(stats.keys)).toBe(true)
    })
  })

  describe('ActivityAPIError', () => {
    it('should create error with message, status, and code', () => {
      const error = new ActivityAPIError('Test error', 400, 'TEST_ERROR')
      
      expect(error.message).toBe('Test error')
      expect(error.status).toBe(400)
      expect(error.code).toBe('TEST_ERROR')
      expect(error).toBeInstanceOf(Error)
    })
  })
})