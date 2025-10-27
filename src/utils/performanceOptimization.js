/**
 * @fileoverview Performance Optimization Utilities
 * Provides performance monitoring, optimization, and cleanup utilities for the file viewer
 */

/**
 * Performance Monitor class
 */
export class PerformanceMonitor {
  constructor() {
    this.metrics = new Map()
    this.observers = new Map()
    this.memoryThreshold = 100 * 1024 * 1024 // 100MB
    this.enabled = true
  }

  /**
   * Start measuring performance for an operation
   * @param {string} operationName - Name of the operation
   * @returns {string} Measurement ID
   */
  startMeasurement(operationName) {
    if (!this.enabled) return null

    const measurementId = `${operationName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    this.metrics.set(measurementId, {
      name: operationName,
      startTime: performance.now(),
      startMemory: this.getMemoryUsage(),
      endTime: null,
      endMemory: null,
      duration: null,
      memoryDelta: null
    })

    return measurementId
  }

  /**
   * End measuring performance for an operation
   * @param {string} measurementId - Measurement ID from startMeasurement
   * @returns {Object} Performance metrics
   */
  endMeasurement(measurementId) {
    if (!this.enabled || !measurementId || !this.metrics.has(measurementId)) {
      return null
    }

    const metric = this.metrics.get(measurementId)
    metric.endTime = performance.now()
    metric.endMemory = this.getMemoryUsage()
    metric.duration = metric.endTime - metric.startTime
    metric.memoryDelta = metric.endMemory - metric.startMemory

    // Log performance if it's slow or uses too much memory
    if (metric.duration > 1000 || Math.abs(metric.memoryDelta) > this.memoryThreshold) {
      console.warn(`Performance warning for ${metric.name}:`, {
        duration: `${metric.duration.toFixed(2)}ms`,
        memoryDelta: `${(metric.memoryDelta / 1024 / 1024).toFixed(2)}MB`
      })
    }

    return metric
  }

  /**
   * Get current memory usage
   * @returns {number} Memory usage in bytes
   */
  getMemoryUsage() {
    if (performance.memory) {
      return performance.memory.usedJSHeapSize
    }
    return 0
  }

  /**
   * Get performance metrics for an operation
   * @param {string} operationName - Name of the operation
   * @returns {Array} Array of metrics for the operation
   */
  getMetrics(operationName) {
    const metrics = []
    for (const [id, metric] of this.metrics) {
      if (metric.name === operationName && metric.duration !== null) {
        metrics.push(metric)
      }
    }
    return metrics
  }

  /**
   * Clear old metrics to prevent memory leaks
   * @param {number} maxAge - Maximum age in milliseconds
   */
  clearOldMetrics(maxAge = 300000) { // 5 minutes default
    const now = Date.now()
    for (const [id, metric] of this.metrics) {
      if (now - metric.startTime > maxAge) {
        this.metrics.delete(id)
      }
    }
  }

  /**
   * Enable or disable performance monitoring
   * @param {boolean} enabled - Whether monitoring is enabled
   */
  setEnabled(enabled) {
    this.enabled = enabled
  }
}

/**
 * Memory Manager class
 */
export class MemoryManager {
  constructor() {
    this.objectUrls = new Set()
    this.intervals = new Set()
    this.timeouts = new Set()
    this.eventListeners = new Map()
    this.observers = new Set()
    this.cleanupCallbacks = new Set()
  }

  /**
   * Register an object URL for cleanup
   * @param {string} url - Object URL to track
   */
  registerObjectUrl(url) {
    this.objectUrls.add(url)
  }

  /**
   * Register an interval for cleanup
   * @param {number} intervalId - Interval ID
   */
  registerInterval(intervalId) {
    this.intervals.add(intervalId)
  }

  /**
   * Register a timeout for cleanup
   * @param {number} timeoutId - Timeout ID
   */
  registerTimeout(timeoutId) {
    this.timeouts.add(timeoutId)
  }

  /**
   * Register an event listener for cleanup
   * @param {HTMLElement} element - Element with listener
   * @param {string} event - Event type
   * @param {Function} listener - Event listener function
   */
  registerEventListener(element, event, listener) {
    if (!this.eventListeners.has(element)) {
      this.eventListeners.set(element, [])
    }
    this.eventListeners.get(element).push({ event, listener })
  }

  /**
   * Register an observer for cleanup
   * @param {Object} observer - Observer instance (IntersectionObserver, MutationObserver, etc.)
   */
  registerObserver(observer) {
    this.observers.add(observer)
  }

  /**
   * Register a custom cleanup callback
   * @param {Function} callback - Cleanup callback function
   */
  registerCleanupCallback(callback) {
    this.cleanupCallbacks.add(callback)
  }

  /**
   * Clean up all registered resources
   */
  cleanup() {
    // Revoke object URLs
    for (const url of this.objectUrls) {
      try {
        URL.revokeObjectURL(url)
      } catch (error) {
        console.warn('Failed to revoke object URL:', error)
      }
    }
    this.objectUrls.clear()

    // Clear intervals
    for (const intervalId of this.intervals) {
      clearInterval(intervalId)
    }
    this.intervals.clear()

    // Clear timeouts
    for (const timeoutId of this.timeouts) {
      clearTimeout(timeoutId)
    }
    this.timeouts.clear()

    // Remove event listeners
    for (const [element, listeners] of this.eventListeners) {
      for (const { event, listener } of listeners) {
        try {
          element.removeEventListener(event, listener)
        } catch (error) {
          console.warn('Failed to remove event listener:', error)
        }
      }
    }
    this.eventListeners.clear()

    // Disconnect observers
    for (const observer of this.observers) {
      try {
        observer.disconnect()
      } catch (error) {
        console.warn('Failed to disconnect observer:', error)
      }
    }
    this.observers.clear()

    // Execute custom cleanup callbacks
    for (const callback of this.cleanupCallbacks) {
      try {
        callback()
      } catch (error) {
        console.warn('Cleanup callback failed:', error)
      }
    }
    this.cleanupCallbacks.clear()
  }

  /**
   * Get memory usage statistics
   * @returns {Object} Memory usage statistics
   */
  getMemoryStats() {
    return {
      objectUrls: this.objectUrls.size,
      intervals: this.intervals.size,
      timeouts: this.timeouts.size,
      eventListeners: Array.from(this.eventListeners.values()).reduce((sum, listeners) => sum + listeners.length, 0),
      observers: this.observers.size,
      cleanupCallbacks: this.cleanupCallbacks.size,
      jsHeapSize: performance.memory ? performance.memory.usedJSHeapSize : 0,
      jsHeapSizeLimit: performance.memory ? performance.memory.jsHeapSizeLimit : 0
    }
  }
}

/**
 * Component Loader class for lazy loading
 */
export class ComponentLoader {
  constructor() {
    this.loadedComponents = new Map()
    this.loadingPromises = new Map()
  }

  /**
   * Lazy load a component
   * @param {string} componentName - Name of the component
   * @param {Function} importFunction - Function that returns import promise
   * @returns {Promise} Component import promise
   */
  async loadComponent(componentName, importFunction) {
    // Return cached component if already loaded
    if (this.loadedComponents.has(componentName)) {
      return this.loadedComponents.get(componentName)
    }

    // Return existing loading promise if already loading
    if (this.loadingPromises.has(componentName)) {
      return this.loadingPromises.get(componentName)
    }

    // Start loading the component
    const loadingPromise = importFunction()
      .then(module => {
        const component = module.default || module
        this.loadedComponents.set(componentName, component)
        this.loadingPromises.delete(componentName)
        return component
      })
      .catch(error => {
        this.loadingPromises.delete(componentName)
        throw error
      })

    this.loadingPromises.set(componentName, loadingPromise)
    return loadingPromise
  }

  /**
   * Preload components
   * @param {Array} components - Array of component definitions
   */
  async preloadComponents(components) {
    const promises = components.map(({ name, importFunction }) => 
      this.loadComponent(name, importFunction).catch(error => {
        console.warn(`Failed to preload component ${name}:`, error)
        return null
      })
    )

    await Promise.allSettled(promises)
  }

  /**
   * Clear component cache
   */
  clearCache() {
    this.loadedComponents.clear()
    this.loadingPromises.clear()
  }
}

/**
 * Progress Indicator class
 */
export class ProgressIndicator {
  constructor() {
    this.operations = new Map()
    this.callbacks = new Set()
  }

  /**
   * Start tracking progress for an operation
   * @param {string} operationId - Unique operation ID
   * @param {Object} options - Progress options
   */
  startProgress(operationId, options = {}) {
    const progress = {
      id: operationId,
      label: options.label || 'Operation in progress',
      current: 0,
      total: options.total || 100,
      startTime: Date.now(),
      indeterminate: options.indeterminate || false,
      stage: options.stage || 'initializing'
    }

    this.operations.set(operationId, progress)
    this.notifyCallbacks('start', progress)
  }

  /**
   * Update progress for an operation
   * @param {string} operationId - Operation ID
   * @param {Object} updates - Progress updates
   */
  updateProgress(operationId, updates) {
    const progress = this.operations.get(operationId)
    if (!progress) return

    Object.assign(progress, updates)
    this.notifyCallbacks('update', progress)
  }

  /**
   * Complete progress for an operation
   * @param {string} operationId - Operation ID
   * @param {Object} result - Operation result
   */
  completeProgress(operationId, result = {}) {
    const progress = this.operations.get(operationId)
    if (!progress) return

    progress.current = progress.total
    progress.completed = true
    progress.endTime = Date.now()
    progress.duration = progress.endTime - progress.startTime
    progress.result = result

    this.notifyCallbacks('complete', progress)
    
    // Clean up after a delay
    setTimeout(() => {
      this.operations.delete(operationId)
    }, 5000)
  }

  /**
   * Fail progress for an operation
   * @param {string} operationId - Operation ID
   * @param {Error} error - Error that occurred
   */
  failProgress(operationId, error) {
    const progress = this.operations.get(operationId)
    if (!progress) return

    progress.failed = true
    progress.error = error
    progress.endTime = Date.now()
    progress.duration = progress.endTime - progress.startTime

    this.notifyCallbacks('error', progress)
    
    // Clean up after a delay
    setTimeout(() => {
      this.operations.delete(operationId)
    }, 10000)
  }

  /**
   * Register a progress callback
   * @param {Function} callback - Callback function
   */
  onProgress(callback) {
    this.callbacks.add(callback)
    return () => this.callbacks.delete(callback)
  }

  /**
   * Notify all callbacks
   * @param {string} event - Event type
   * @param {Object} progress - Progress data
   */
  notifyCallbacks(event, progress) {
    for (const callback of this.callbacks) {
      try {
        callback(event, progress)
      } catch (error) {
        console.warn('Progress callback failed:', error)
      }
    }
  }

  /**
   * Get all active operations
   * @returns {Array} Array of active operations
   */
  getActiveOperations() {
    return Array.from(this.operations.values()).filter(op => !op.completed && !op.failed)
  }

  /**
   * Clear all operations
   */
  clear() {
    this.operations.clear()
  }
}

/**
 * Debounce utility
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @param {boolean} immediate - Execute immediately
 * @returns {Function} Debounced function
 */
export function debounce(func, wait, immediate = false) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      timeout = null
      if (!immediate) func(...args)
    }
    const callNow = immediate && !timeout
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
    if (callNow) func(...args)
  }
}

/**
 * Throttle utility
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
export function throttle(func, limit) {
  let inThrottle
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

/**
 * Create singleton instances
 */
export const performanceMonitor = new PerformanceMonitor()
export const memoryManager = new MemoryManager()
export const componentLoader = new ComponentLoader()
export const progressIndicator = new ProgressIndicator()

/**
 * Utility functions for performance optimization
 */
export const perfUtils = {
  /**
   * Measure async function performance
   * @param {Function} asyncFunc - Async function to measure
   * @param {string} operationName - Name for the operation
   * @returns {Promise} Function result with performance data
   */
  async measureAsync(asyncFunc, operationName) {
    const measurementId = performanceMonitor.startMeasurement(operationName)
    try {
      const result = await asyncFunc()
      const metrics = performanceMonitor.endMeasurement(measurementId)
      return { result, metrics }
    } catch (error) {
      performanceMonitor.endMeasurement(measurementId)
      throw error
    }
  },

  /**
   * Create a performance-optimized image loader
   * @param {string} src - Image source
   * @param {Object} options - Loading options
   * @returns {Promise} Image load promise
   */
  loadImage(src, options = {}) {
    return new Promise((resolve, reject) => {
      const img = new Image()
      
      if (options.crossOrigin) {
        img.crossOrigin = options.crossOrigin
      }
      
      img.onload = () => {
        memoryManager.registerObjectUrl(src)
        resolve(img)
      }
      
      img.onerror = reject
      img.src = src
    })
  },

  /**
   * Create a performance-optimized file reader
   * @param {File} file - File to read
   * @param {string} method - Read method ('text', 'arrayBuffer', 'dataURL')
   * @returns {Promise} File read promise
   */
  readFile(file, method = 'text') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      
      switch (method) {
        case 'text':
          reader.readAsText(file)
          break
        case 'arrayBuffer':
          reader.readAsArrayBuffer(file)
          break
        case 'dataURL':
          reader.readAsDataURL(file)
          break
        default:
          reject(new Error(`Unknown read method: ${method}`))
      }
    })
  },

  /**
   * Check if device has limited resources
   * @returns {boolean} True if device appears to have limited resources
   */
  isLowEndDevice() {
    // Check various indicators of low-end devices
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection
    const slowConnection = connection && (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g')
    const limitedMemory = navigator.deviceMemory && navigator.deviceMemory < 4
    const limitedCores = navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4
    
    return slowConnection || limitedMemory || limitedCores
  },

  /**
   * Get optimal chunk size for processing large data
   * @param {number} totalSize - Total size of data
   * @param {number} maxChunkSize - Maximum chunk size
   * @returns {number} Optimal chunk size
   */
  getOptimalChunkSize(totalSize, maxChunkSize = 1024 * 1024) {
    if (this.isLowEndDevice()) {
      return Math.min(maxChunkSize / 4, totalSize)
    }
    return Math.min(maxChunkSize, totalSize)
  }
}