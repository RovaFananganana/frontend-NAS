/**
 * Navigation Performance Optimization Utility
 * 
 * This utility provides caching, debouncing, and optimization features
 * for navigation operations to improve performance and avoid redundant operations.
 */

class NavigationPerformanceManager {
  constructor() {
    // Cache for path validations
    this.pathValidationCache = new Map()
    this.pathValidationCacheSize = 100 // Maximum cache entries
    this.pathValidationTTL = 5 * 60 * 1000 // 5 minutes TTL
    
    // Navigation state tracking
    this.lastNavigationPath = null
    this.lastNavigationTime = 0
    this.navigationInProgress = false
    
    // Debouncing state
    this.debounceTimers = new Map()
    this.defaultDebounceDelay = 300 // 300ms default debounce
    
    // Performance metrics
    this.metrics = {
      cacheHits: 0,
      cacheMisses: 0,
      preventedRedundantNavigations: 0,
      debouncedOperations: 0
    }
    
    // Cleanup interval for cache
    this.setupCacheCleanup()
  }

  /**
   * Cache a path validation result
   * @param {string} path - The path to cache
   * @param {boolean} isValid - Whether the path is valid
   * @param {Object} metadata - Additional metadata about the validation
   */
  cachePathValidation(path, isValid, metadata = {}) {
    if (!path || typeof path !== 'string') return

    const normalizedPath = this.normalizePath(path)
    const cacheEntry = {
      isValid,
      metadata,
      timestamp: Date.now(),
      accessCount: 1
    }

    // Check cache size and remove oldest entries if needed
    if (this.pathValidationCache.size >= this.pathValidationCacheSize) {
      this.evictOldestCacheEntries(10) // Remove 10 oldest entries
    }

    this.pathValidationCache.set(normalizedPath, cacheEntry)
    
    console.log('NavigationPerformance: Cached path validation', {
      path: normalizedPath,
      isValid,
      cacheSize: this.pathValidationCache.size,
      metadata
    })
  }

  /**
   * Get cached path validation result
   * @param {string} path - The path to check
   * @returns {Object|null} - Cached validation result or null if not found/expired
   */
  getCachedPathValidation(path) {
    if (!path || typeof path !== 'string') return null

    const normalizedPath = this.normalizePath(path)
    const cacheEntry = this.pathValidationCache.get(normalizedPath)

    if (!cacheEntry) {
      this.metrics.cacheMisses++
      return null
    }

    // Check if cache entry is expired
    const isExpired = (Date.now() - cacheEntry.timestamp) > this.pathValidationTTL
    if (isExpired) {
      this.pathValidationCache.delete(normalizedPath)
      this.metrics.cacheMisses++
      console.log('NavigationPerformance: Cache entry expired', { path: normalizedPath })
      return null
    }

    // Update access count and timestamp
    cacheEntry.accessCount++
    cacheEntry.lastAccess = Date.now()
    
    this.metrics.cacheHits++
    console.log('NavigationPerformance: Cache hit', {
      path: normalizedPath,
      isValid: cacheEntry.isValid,
      accessCount: cacheEntry.accessCount
    })

    return {
      isValid: cacheEntry.isValid,
      metadata: cacheEntry.metadata,
      fromCache: true
    }
  }

  /**
   * Check if navigation to a path would be redundant
   * @param {string} path - The target path
   * @param {string} currentPath - The current path
   * @param {boolean} forceRefresh - Whether to force navigation even if redundant
   * @returns {boolean} - True if navigation would be redundant
   */
  isRedundantNavigation(path, currentPath, forceRefresh = false) {
    if (forceRefresh) {
      console.log('NavigationPerformance: Force refresh requested, allowing navigation', { path })
      return false
    }

    const normalizedPath = this.normalizePath(path)
    const normalizedCurrentPath = this.normalizePath(currentPath)

    // Check if paths are identical
    if (normalizedPath === normalizedCurrentPath) {
      // Check if this is a rapid repeated navigation to the same path
      const timeSinceLastNavigation = Date.now() - this.lastNavigationTime
      const isRapidRepeat = (
        this.lastNavigationPath === normalizedPath && 
        timeSinceLastNavigation < 1000 // Less than 1 second
      )

      if (isRapidRepeat) {
        this.metrics.preventedRedundantNavigations++
        console.log('NavigationPerformance: Prevented redundant navigation', {
          path: normalizedPath,
          timeSinceLastNavigation,
          preventedCount: this.metrics.preventedRedundantNavigations
        })
        return true
      }
    }

    return false
  }

  /**
   * Record a navigation attempt
   * @param {string} path - The navigation path
   * @param {string} source - The source of navigation
   */
  recordNavigation(path, source = 'unknown') {
    const normalizedPath = this.normalizePath(path)
    this.lastNavigationPath = normalizedPath
    this.lastNavigationTime = Date.now()
    
    console.log('NavigationPerformance: Recorded navigation', {
      path: normalizedPath,
      source,
      timestamp: this.lastNavigationTime
    })
  }

  /**
   * Set navigation in progress state
   * @param {boolean} inProgress - Whether navigation is in progress
   */
  setNavigationInProgress(inProgress) {
    this.navigationInProgress = inProgress
    console.log('NavigationPerformance: Navigation in progress state changed', { inProgress })
  }

  /**
   * Check if navigation is currently in progress
   * @returns {boolean} - True if navigation is in progress
   */
  isNavigationInProgress() {
    return this.navigationInProgress
  }

  /**
   * Debounce a function call
   * @param {string} key - Unique key for the debounced operation
   * @param {Function} fn - Function to debounce
   * @param {number} delay - Debounce delay in milliseconds
   * @returns {Function} - Debounced function
   */
  debounce(key, fn, delay = this.defaultDebounceDelay) {
    return (...args) => {
      // Clear existing timer for this key
      if (this.debounceTimers.has(key)) {
        clearTimeout(this.debounceTimers.get(key))
      }

      // Set new timer
      const timer = setTimeout(() => {
        this.debounceTimers.delete(key)
        this.metrics.debouncedOperations++
        console.log('NavigationPerformance: Executing debounced operation', {
          key,
          delay,
          totalDebounced: this.metrics.debouncedOperations
        })
        fn.apply(this, args)
      }, delay)

      this.debounceTimers.set(key, timer)
      
      console.log('NavigationPerformance: Debounced operation scheduled', {
        key,
        delay,
        activeTimers: this.debounceTimers.size
      })
    }
  }

  /**
   * Cancel a debounced operation
   * @param {string} key - Key of the operation to cancel
   */
  cancelDebounce(key) {
    if (this.debounceTimers.has(key)) {
      clearTimeout(this.debounceTimers.get(key))
      this.debounceTimers.delete(key)
      console.log('NavigationPerformance: Cancelled debounced operation', { key })
    }
  }

  /**
   * Create an optimized watcher that prevents infinite loops
   * @param {Function} watchFn - The watch function
   * @param {Object} options - Watcher options
   * @returns {Function} - Optimized watcher function
   */
  createOptimizedWatcher(watchFn, options = {}) {
    const {
      maxExecutions = 10,
      timeWindow = 1000, // 1 second
      debounceDelay = 100,
      watcherKey = 'default'
    } = options

    let executionCount = 0
    let windowStart = Date.now()
    let lastValue = null

    return this.debounce(`watcher_${watcherKey}`, (newValue, oldValue) => {
      const now = Date.now()
      
      // Reset counter if time window has passed
      if (now - windowStart > timeWindow) {
        executionCount = 0
        windowStart = now
      }

      // Check for infinite loop prevention
      if (executionCount >= maxExecutions) {
        console.warn('NavigationPerformance: Watcher execution limit reached, preventing infinite loop', {
          watcherKey,
          executionCount,
          maxExecutions,
          timeWindow
        })
        return
      }

      // Check if value actually changed (deep comparison for objects)
      if (this.deepEqual(newValue, lastValue)) {
        console.log('NavigationPerformance: Watcher skipped - value unchanged', {
          watcherKey,
          value: newValue
        })
        return
      }

      executionCount++
      lastValue = this.deepClone(newValue)
      
      console.log('NavigationPerformance: Executing optimized watcher', {
        watcherKey,
        executionCount,
        newValue,
        oldValue
      })

      try {
        watchFn(newValue, oldValue)
      } catch (error) {
        console.error('NavigationPerformance: Watcher execution error', {
          watcherKey,
          error: error.message,
          stack: error.stack
        })
      }
    }, debounceDelay)
  }

  /**
   * Normalize a path for consistent comparison
   * @param {string} path - Path to normalize
   * @returns {string} - Normalized path
   */
  normalizePath(path) {
    if (!path || typeof path !== 'string') return '/'
    
    // Remove trailing slashes except for root
    let normalized = path.replace(/\/+$/, '') || '/'
    
    // Ensure it starts with /
    if (!normalized.startsWith('/')) {
      normalized = '/' + normalized
    }
    
    // Replace multiple slashes with single slash
    normalized = normalized.replace(/\/+/g, '/')
    
    return normalized
  }

  /**
   * Deep equality check for objects
   * @param {*} a - First value
   * @param {*} b - Second value
   * @returns {boolean} - True if values are deeply equal
   */
  deepEqual(a, b) {
    if (a === b) return true
    if (a == null || b == null) return false
    if (typeof a !== typeof b) return false
    
    if (typeof a === 'object') {
      const keysA = Object.keys(a)
      const keysB = Object.keys(b)
      
      if (keysA.length !== keysB.length) return false
      
      for (let key of keysA) {
        if (!keysB.includes(key)) return false
        if (!this.deepEqual(a[key], b[key])) return false
      }
      
      return true
    }
    
    return false
  }

  /**
   * Deep clone an object
   * @param {*} obj - Object to clone
   * @returns {*} - Cloned object
   */
  deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj
    if (obj instanceof Date) return new Date(obj.getTime())
    if (obj instanceof Array) return obj.map(item => this.deepClone(item))
    
    const cloned = {}
    for (let key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = this.deepClone(obj[key])
      }
    }
    return cloned
  }

  /**
   * Evict oldest cache entries
   * @param {number} count - Number of entries to evict
   */
  evictOldestCacheEntries(count) {
    const entries = Array.from(this.pathValidationCache.entries())
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp)
    
    for (let i = 0; i < Math.min(count, entries.length); i++) {
      this.pathValidationCache.delete(entries[i][0])
    }
    
    console.log('NavigationPerformance: Evicted cache entries', {
      evicted: Math.min(count, entries.length),
      remainingSize: this.pathValidationCache.size
    })
  }

  /**
   * Setup automatic cache cleanup
   */
  setupCacheCleanup() {
    // Clean up expired entries every 5 minutes
    setInterval(() => {
      const now = Date.now()
      let cleanedCount = 0
      
      for (const [path, entry] of this.pathValidationCache.entries()) {
        if (now - entry.timestamp > this.pathValidationTTL) {
          this.pathValidationCache.delete(path)
          cleanedCount++
        }
      }
      
      if (cleanedCount > 0) {
        console.log('NavigationPerformance: Automatic cache cleanup', {
          cleanedCount,
          remainingSize: this.pathValidationCache.size
        })
      }
    }, 5 * 60 * 1000) // 5 minutes
  }

  /**
   * Clear all caches and reset state
   */
  clearCache() {
    this.pathValidationCache.clear()
    this.lastNavigationPath = null
    this.lastNavigationTime = 0
    this.navigationInProgress = false
    
    // Cancel all pending debounced operations
    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer)
    }
    this.debounceTimers.clear()
    
    console.log('NavigationPerformance: All caches and state cleared')
  }

  /**
   * Get performance metrics
   * @returns {Object} - Performance metrics
   */
  getMetrics() {
    const cacheHitRate = this.metrics.cacheHits + this.metrics.cacheMisses > 0
      ? (this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses) * 100).toFixed(2)
      : 0

    return {
      ...this.metrics,
      cacheHitRate: `${cacheHitRate}%`,
      cacheSize: this.pathValidationCache.size,
      activeDebouncers: this.debounceTimers.size,
      navigationInProgress: this.navigationInProgress
    }
  }

  /**
   * Reset performance metrics
   */
  resetMetrics() {
    this.metrics = {
      cacheHits: 0,
      cacheMisses: 0,
      preventedRedundantNavigations: 0,
      debouncedOperations: 0
    }
    console.log('NavigationPerformance: Metrics reset')
  }
}

// Create singleton instance
const navigationPerformance = new NavigationPerformanceManager()

export default navigationPerformance