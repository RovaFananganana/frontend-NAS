// services/activityAPI.js
import axios from 'axios'

// Get the API base URL from environment
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001"

// Create axios instance for activity API
const activityAxios = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Add auth interceptor
activityAxios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Cache configuration
const CACHE_CONFIG = {
  ACTIVITIES_TTL: 5 * 60 * 1000, // 5 minutes for activities
  STATS_TTL: 2 * 60 * 1000, // 2 minutes for stats
  MAX_CACHE_SIZE: 50 // Maximum number of cached entries
}

// Simple in-memory cache with TTL
class ActivityCache {
  constructor() {
    this.cache = new Map()
    this.timers = new Map()
  }

  set(key, value, ttl = CACHE_CONFIG.ACTIVITIES_TTL) {
    // Clear existing timer if any
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key))
    }

    // Implement cache size limit
    if (this.cache.size >= CACHE_CONFIG.MAX_CACHE_SIZE) {
      const firstKey = this.cache.keys().next().value
      this.delete(firstKey)
    }

    // Set cache entry
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    })

    // Set expiration timer
    const timer = setTimeout(() => {
      this.delete(key)
    }, ttl)
    
    this.timers.set(key, timer)
  }

  get(key) {
    const entry = this.cache.get(key)
    if (!entry) return null

    // Check if entry is still valid
    const now = Date.now()
    const age = now - entry.timestamp
    
    if (age > CACHE_CONFIG.ACTIVITIES_TTL) {
      this.delete(key)
      return null
    }

    return entry.value
  }

  delete(key) {
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key))
      this.timers.delete(key)
    }
    this.cache.delete(key)
  }

  clear() {
    this.timers.forEach(timer => clearTimeout(timer))
    this.timers.clear()
    this.cache.clear()
  }

  invalidatePattern(pattern) {
    const regex = new RegExp(pattern)
    const keysToDelete = []
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        keysToDelete.push(key)
      }
    }
    
    keysToDelete.forEach(key => this.delete(key))
  }
}

// Create cache instance
const activityCache = new ActivityCache()

class ActivityAPIError extends Error {
  constructor(message, status, code) {
    super(message)
    this.status = status
    this.code = code
  }
}

export const activityAPI = {
  /**
   * Get user activities with optional filters
   * @param {Object} filters - Filter options
   * @param {string} filters.period - Period filter (today, week, month, custom)
   * @param {string} filters.date - Custom date for filtering
   * @param {string} filters.action - Action type filter
   * @param {number} filters.page - Page number for pagination
   * @param {number} filters.limit - Items per page
   * @param {boolean} bypassCache - Skip cache and fetch fresh data
   * @returns {Promise<Object>} Activities data with pagination info
   */
  async getActivities(filters = {}, bypassCache = false) {
    try {
      // Create cache key from filters
      const cacheKey = `activities_${JSON.stringify(filters)}`
      
      // Check cache first (unless bypassed)
      if (!bypassCache) {
        const cachedData = activityCache.get(cacheKey)
        if (cachedData) {
          return cachedData
        }
      }

      const params = {}
      
      if (filters.period) params.period = filters.period
      if (filters.date) params.date = filters.date
      if (filters.action) params.action = filters.action
      if (filters.page) params.page = filters.page
      if (filters.limit) params.limit = filters.limit

      const response = await activityAxios.get('/api/activities', { params })
      
      // Cache the response (only cache first page for better performance)
      if (!filters.page || filters.page === 1) {
        activityCache.set(cacheKey, response.data, CACHE_CONFIG.ACTIVITIES_TTL)
      }
      
      return response.data
    } catch (error) {
      console.error('Activity API Error:', error)
      
      if (error.response) {
        throw new ActivityAPIError(
          error.response.data?.message || 'Failed to load activities',
          error.response.status,
          'LOAD_ACTIVITIES_FAILED'
        )
      }
      
      throw new ActivityAPIError(
        'Network error while loading activities',
        0,
        'NETWORK_ERROR'
      )
    }
  },

  /**
   * Get activity statistics for dashboard
   * @param {boolean} bypassCache - Skip cache and fetch fresh data
   * @returns {Promise<Object>} Activity statistics
   */
  async getActivityStats(bypassCache = false) {
    try {
      const cacheKey = 'activity_stats'
      
      // Check cache first (unless bypassed)
      if (!bypassCache) {
        const cachedData = activityCache.get(cacheKey)
        if (cachedData) {
          return cachedData
        }
      }

      const response = await activityAxios.get('/api/activities/stats')
      
      // Cache the stats with shorter TTL
      activityCache.set(cacheKey, response.data, CACHE_CONFIG.STATS_TTL)
      
      return response.data
    } catch (error) {
      console.error('Activity Stats API Error:', error)
      
      if (error.response) {
        throw new ActivityAPIError(
          error.response.data?.message || 'Failed to load activity statistics',
          error.response.status,
          'LOAD_STATS_FAILED'
        )
      }
      
      throw new ActivityAPIError(
        'Network error while loading activity statistics',
        0,
        'NETWORK_ERROR'
      )
    }
  },

  /**
   * Log a new activity (for manual logging)
   * @param {Object} activity - Activity data
   * @param {string} activity.action - Action type
   * @param {string} activity.resource - Resource affected
   * @param {Object} activity.details - Additional details
   * @returns {Promise<Object>} Created activity
   */
  async logActivity(activity) {
    try {
      const response = await activityAxios.post('/api/activities', activity)
      
      // Invalidate relevant caches when new activity is logged
      this.invalidateCache()
      
      return response.data
    } catch (error) {
      console.error('Log Activity API Error:', error)
      
      if (error.response) {
        throw new ActivityAPIError(
          error.response.data?.message || 'Failed to log activity',
          error.response.status,
          'LOG_ACTIVITY_FAILED'
        )
      }
      
      throw new ActivityAPIError(
        'Network error while logging activity',
        0,
        'NETWORK_ERROR'
      )
    }
  },

  /**
   * Get available activity types
   * @returns {Promise<Object>} Available activity types
   */
  async getActivityTypes() {
    try {
      const cacheKey = 'activity_types'
      
      // Check cache first (activity types rarely change)
      const cachedData = activityCache.get(cacheKey)
      if (cachedData) {
        return cachedData
      }

      const response = await activityAxios.get('/api/activities/types')
      
      // Cache activity types for longer (they don't change often)
      activityCache.set(cacheKey, response.data, 30 * 60 * 1000) // 30 minutes
      
      return response.data
    } catch (error) {
      console.error('Activity Types API Error:', error)
      
      if (error.response) {
        throw new ActivityAPIError(
          error.response.data?.message || 'Failed to load activity types',
          error.response.status,
          'LOAD_TYPES_FAILED'
        )
      }
      
      throw new ActivityAPIError(
        'Network error while loading activity types',
        0,
        'NETWORK_ERROR'
      )
    }
  },

  /**
   * Invalidate activity cache
   * @param {string} pattern - Optional pattern to match cache keys
   */
  invalidateCache(pattern = null) {
    if (pattern) {
      activityCache.invalidatePattern(pattern)
    } else {
      // Invalidate activities and stats, but keep activity types
      activityCache.invalidatePattern('^activities_')
      activityCache.delete('activity_stats')
    }
  },

  /**
   * Clear all activity cache
   */
  clearCache() {
    activityCache.clear()
  },

  /**
   * Get cache statistics (for debugging)
   */
  getCacheStats() {
    return {
      size: activityCache.cache.size,
      keys: Array.from(activityCache.cache.keys()),
      config: CACHE_CONFIG
    }
  }
}

export { ActivityAPIError }