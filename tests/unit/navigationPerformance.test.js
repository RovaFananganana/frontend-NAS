import { describe, it, expect, beforeEach, vi } from 'vitest'
import navigationPerformance from '@/utils/navigationPerformance.js'

describe('NavigationPerformance', () => {
  beforeEach(() => {
    // Clear cache and reset metrics before each test
    navigationPerformance.clearCache()
    navigationPerformance.resetMetrics()
  })

  describe('Path Validation Caching', () => {
    it('should cache path validation results', () => {
      const path = '/test/path'
      const isValid = true
      const metadata = { source: 'test' }

      // Cache the validation
      navigationPerformance.cachePathValidation(path, isValid, metadata)

      // Retrieve from cache
      const cached = navigationPerformance.getCachedPathValidation(path)

      expect(cached).toBeTruthy()
      expect(cached.isValid).toBe(isValid)
      expect(cached.metadata).toEqual(metadata)
      expect(cached.fromCache).toBe(true)
    })

    it('should return null for non-existent cache entries', () => {
      const cached = navigationPerformance.getCachedPathValidation('/non/existent')
      expect(cached).toBeNull()
    })

    it('should normalize paths when caching and retrieving', () => {
      const path1 = '/test/path/'
      const path2 = '/test/path'
      const isValid = true

      // Cache with trailing slash
      navigationPerformance.cachePathValidation(path1, isValid)

      // Retrieve without trailing slash
      const cached = navigationPerformance.getCachedPathValidation(path2)

      expect(cached).toBeTruthy()
      expect(cached.isValid).toBe(isValid)
    })

    it('should track cache hits and misses', () => {
      const path = '/test/path'
      
      // Cache miss
      let cached = navigationPerformance.getCachedPathValidation(path)
      expect(cached).toBeNull()

      // Cache the path
      navigationPerformance.cachePathValidation(path, true)

      // Cache hit
      cached = navigationPerformance.getCachedPathValidation(path)
      expect(cached).toBeTruthy()

      const metrics = navigationPerformance.getMetrics()
      expect(metrics.cacheHits).toBe(1)
      expect(metrics.cacheMisses).toBe(1)
    })
  })

  describe('Redundant Navigation Prevention', () => {
    it('should detect redundant navigation to same path', () => {
      const path = '/test/path'
      const currentPath = '/test/path'

      // Record a navigation
      navigationPerformance.recordNavigation(path, 'test')

      // Check for redundancy immediately (should be redundant)
      const isRedundant = navigationPerformance.isRedundantNavigation(path, currentPath, false)
      expect(isRedundant).toBe(true)
    })

    it('should allow navigation when force refresh is enabled', () => {
      const path = '/test/path'
      const currentPath = '/test/path'

      navigationPerformance.recordNavigation(path, 'test')

      const isRedundant = navigationPerformance.isRedundantNavigation(path, currentPath, true)
      expect(isRedundant).toBe(false)
    })

    it('should allow navigation to different paths', () => {
      const path = '/test/path1'
      const currentPath = '/test/path2'

      const isRedundant = navigationPerformance.isRedundantNavigation(path, currentPath, false)
      expect(isRedundant).toBe(false)
    })

    it('should track prevented redundant navigations', () => {
      const path = '/test/path'
      const currentPath = '/test/path'

      navigationPerformance.recordNavigation(path, 'test')
      navigationPerformance.isRedundantNavigation(path, currentPath, false)

      const metrics = navigationPerformance.getMetrics()
      expect(metrics.preventedRedundantNavigations).toBe(1)
    })
  })

  describe('Debouncing', () => {
    it('should debounce function calls', async () => {
      const mockFn = vi.fn()
      const debouncedFn = navigationPerformance.debounce('test', mockFn, 50)

      // Call multiple times rapidly
      debouncedFn('arg1')
      debouncedFn('arg2')
      debouncedFn('arg3')

      // Should not have been called yet
      expect(mockFn).not.toHaveBeenCalled()

      // Wait for debounce delay
      await new Promise(resolve => setTimeout(resolve, 60))

      // Should have been called only once with the last arguments
      expect(mockFn).toHaveBeenCalledTimes(1)
      expect(mockFn).toHaveBeenCalledWith('arg3')
    })

    it('should track debounced operations', async () => {
      const mockFn = vi.fn()
      const debouncedFn = navigationPerformance.debounce('test', mockFn, 50)

      debouncedFn()
      await new Promise(resolve => setTimeout(resolve, 60))

      const metrics = navigationPerformance.getMetrics()
      expect(metrics.debouncedOperations).toBe(1)
    })

    it('should cancel debounced operations', () => {
      const mockFn = vi.fn()
      const debouncedFn = navigationPerformance.debounce('test', mockFn, 50)

      debouncedFn()
      navigationPerformance.cancelDebounce('test')

      // Wait longer than debounce delay
      return new Promise(resolve => {
        setTimeout(() => {
          expect(mockFn).not.toHaveBeenCalled()
          resolve()
        }, 60)
      })
    })
  })

  describe('Optimized Watcher', () => {
    it('should prevent infinite loops by limiting executions', () => {
      const mockFn = vi.fn()
      const optimizedWatcher = navigationPerformance.createOptimizedWatcher(mockFn, {
        maxExecutions: 3,
        timeWindow: 1000,
        debounceDelay: 10,
        watcherKey: 'test'
      })

      // Call multiple times rapidly (more than maxExecutions)
      for (let i = 0; i < 5; i++) {
        optimizedWatcher(`value${i}`, `oldValue${i}`)
      }

      // Wait for debounce
      return new Promise(resolve => {
        setTimeout(() => {
          // Should have been called at most maxExecutions times
          expect(mockFn.mock.calls.length).toBeLessThanOrEqual(3)
          resolve()
        }, 50)
      })
    })

    it('should skip execution when value has not changed', () => {
      const mockFn = vi.fn()
      const optimizedWatcher = navigationPerformance.createOptimizedWatcher(mockFn, {
        debounceDelay: 10,
        watcherKey: 'test'
      })

      // Call with same value multiple times
      optimizedWatcher('sameValue', 'oldValue')
      optimizedWatcher('sameValue', 'sameValue')

      return new Promise(resolve => {
        setTimeout(() => {
          // Should have been called only once (first time when value changed)
          expect(mockFn).toHaveBeenCalledTimes(1)
          resolve()
        }, 50)
      })
    })
  })

  describe('Path Normalization', () => {
    it('should normalize paths consistently', () => {
      const testCases = [
        { input: '/path/', expected: '/path' },
        { input: 'path', expected: '/path' },
        { input: '/path//subpath/', expected: '/path/subpath' },
        { input: '/', expected: '/' },
        { input: '', expected: '/' },
        { input: null, expected: '/' },
        { input: undefined, expected: '/' }
      ]

      testCases.forEach(({ input, expected }) => {
        const result = navigationPerformance.normalizePath(input)
        expect(result).toBe(expected)
      })
    })
  })

  describe('Navigation State Management', () => {
    it('should track navigation in progress state', () => {
      expect(navigationPerformance.isNavigationInProgress()).toBe(false)

      navigationPerformance.setNavigationInProgress(true)
      expect(navigationPerformance.isNavigationInProgress()).toBe(true)

      navigationPerformance.setNavigationInProgress(false)
      expect(navigationPerformance.isNavigationInProgress()).toBe(false)
    })

    it('should record navigation attempts', () => {
      const path = '/test/path'
      const source = 'test'

      navigationPerformance.recordNavigation(path, source)

      // Verify that subsequent redundant navigation is detected
      const isRedundant = navigationPerformance.isRedundantNavigation(path, path, false)
      expect(isRedundant).toBe(true)
    })
  })

  describe('Performance Metrics', () => {
    it('should provide comprehensive metrics', () => {
      const metrics = navigationPerformance.getMetrics()

      expect(metrics).toHaveProperty('cacheHits')
      expect(metrics).toHaveProperty('cacheMisses')
      expect(metrics).toHaveProperty('cacheHitRate')
      expect(metrics).toHaveProperty('preventedRedundantNavigations')
      expect(metrics).toHaveProperty('debouncedOperations')
      expect(metrics).toHaveProperty('cacheSize')
      expect(metrics).toHaveProperty('activeDebouncers')
      expect(metrics).toHaveProperty('navigationInProgress')
    })

    it('should calculate cache hit rate correctly', () => {
      const path = '/test/path'

      // Generate some cache misses and hits
      navigationPerformance.getCachedPathValidation('/miss1')
      navigationPerformance.getCachedPathValidation('/miss2')
      
      navigationPerformance.cachePathValidation(path, true)
      navigationPerformance.getCachedPathValidation(path)
      navigationPerformance.getCachedPathValidation(path)

      const metrics = navigationPerformance.getMetrics()
      expect(metrics.cacheHits).toBe(2)
      expect(metrics.cacheMisses).toBe(2)
      expect(metrics.cacheHitRate).toBe('50.00%')
    })

    it('should reset metrics correctly', () => {
      // Generate some activity
      navigationPerformance.getCachedPathValidation('/test')
      navigationPerformance.isRedundantNavigation('/test', '/test', false)

      let metrics = navigationPerformance.getMetrics()
      expect(metrics.cacheMisses).toBeGreaterThan(0)

      navigationPerformance.resetMetrics()
      metrics = navigationPerformance.getMetrics()
      expect(metrics.cacheMisses).toBe(0)
      expect(metrics.cacheHits).toBe(0)
      expect(metrics.preventedRedundantNavigations).toBe(0)
      expect(metrics.debouncedOperations).toBe(0)
    })
  })

  describe('Cache Management', () => {
    it('should clear cache and reset state', () => {
      const path = '/test/path'
      
      // Add some cache entries and state
      navigationPerformance.cachePathValidation(path, true)
      navigationPerformance.recordNavigation(path, 'test')
      navigationPerformance.setNavigationInProgress(true)

      let metrics = navigationPerformance.getMetrics()
      expect(metrics.cacheSize).toBe(1)
      expect(metrics.navigationInProgress).toBe(true)

      navigationPerformance.clearCache()

      metrics = navigationPerformance.getMetrics()
      expect(metrics.cacheSize).toBe(0)
      expect(metrics.navigationInProgress).toBe(false)
    })
  })
})