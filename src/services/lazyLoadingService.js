/**
 * @fileoverview Lazy loading service for file viewer components
 * Provides efficient loading of file content and thumbnails
 */

class LazyLoadingService {
  constructor() {
    this.loadingQueue = new Map()
    this.loadedContent = new Map()
    this.thumbnailCache = new Map()
    this.observers = new Map()
    this.maxConcurrentLoads = 3
    this.currentLoads = 0
    
    // Intersection Observer for viewport-based loading
    this.intersectionObserver = new IntersectionObserver(
      this.handleIntersection.bind(this),
      {
        root: null,
        rootMargin: '50px',
        threshold: 0.1
      }
    )
  }

  /**
   * Register an element for lazy loading
   * @param {HTMLElement} element - Element to observe
   * @param {Object} config - Loading configuration
   */
  observe(element, config) {
    if (!element || this.observers.has(element)) return

    this.observers.set(element, {
      ...config,
      loaded: false,
      loading: false
    })

    this.intersectionObserver.observe(element)
  }

  /**
   * Unregister an element from lazy loading
   * @param {HTMLElement} element - Element to stop observing
   */
  unobserve(element) {
    if (!element) return

    this.intersectionObserver.unobserve(element)
    this.observers.delete(element)
  }

  /**
   * Handle intersection observer events
   * @param {Array} entries - Intersection observer entries
   */
  handleIntersection(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const config = this.observers.get(entry.target)
        if (config && !config.loaded && !config.loading) {
          this.loadContent(entry.target, config)
        }
      }
    })
  }

  /**
   * Load content for an element
   * @param {HTMLElement} element - Target element
   * @param {Object} config - Loading configuration
   */
  async loadContent(element, config) {
    if (config.loading || config.loaded) return

    config.loading = true
    this.currentLoads++

    try {
      let content = null

      switch (config.type) {
        case 'thumbnail':
          content = await this.loadThumbnail(config.filePath, config.size)
          break
        case 'preview':
          content = await this.loadPreview(config.filePath, config.previewType)
          break
        case 'metadata':
          content = await this.loadMetadata(config.filePath)
          break
        default:
          console.warn('Unknown lazy loading type:', config.type)
      }

      if (content && config.onLoad) {
        config.onLoad(element, content)
      }

      config.loaded = true
    } catch (error) {
      console.error('Error loading content:', error)
      if (config.onError) {
        config.onError(element, error)
      }
    } finally {
      config.loading = false
      this.currentLoads--
      this.processQueue()
    }
  }

  /**
   * Load thumbnail for a file
   * @param {string} filePath - Path to the file
   * @param {Object} size - Thumbnail size {width, height}
   * @returns {Promise<string>} Base64 encoded thumbnail
   */
  async loadThumbnail(filePath, size = { width: 200, height: 200 }) {
    const cacheKey = `${filePath}_${size.width}x${size.height}`
    
    // Check cache first
    if (this.thumbnailCache.has(cacheKey)) {
      return this.thumbnailCache.get(cacheKey)
    }

    try {
      const axios = (await import('axios')).default
      const response = await axios.post(`/files/thumbnail`, {
        file_path: filePath,
        width: size.width,
        height: size.height
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to load thumbnail: ${response.statusText}`)
      }

      const data = await response.json()
      const thumbnail = data.thumbnail

      // Cache the thumbnail
      this.thumbnailCache.set(cacheKey, thumbnail)
      
      // Limit cache size
      if (this.thumbnailCache.size > 100) {
        const firstKey = this.thumbnailCache.keys().next().value
        this.thumbnailCache.delete(firstKey)
      }

      return thumbnail
    } catch (error) {
      console.error('Error loading thumbnail:', error)
      throw error
    }
  }

  /**
   * Load preview content for a file
   * @param {string} filePath - Path to the file
   * @param {string} previewType - Type of preview to load
   * @returns {Promise<Object>} Preview content
   */
  async loadPreview(filePath, previewType = 'basic') {
    const cacheKey = `${filePath}_preview_${previewType}`
    
    // Check cache first
    if (this.loadedContent.has(cacheKey)) {
      return this.loadedContent.get(cacheKey)
    }

    try {
      const axios = (await import('axios')).default
      const response = await axios.get(`/files/${encodeURIComponent(filePath)}/preview`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      const content = response.data

      // Cache the content
      this.loadedContent.set(cacheKey, content)
      
      // Limit cache size
      if (this.loadedContent.size > 50) {
        const firstKey = this.loadedContent.keys().next().value
        this.loadedContent.delete(firstKey)
      }

      return content
    } catch (error) {
      console.error('Error loading preview:', error)
      throw error
    }
  }

  /**
   * Load metadata for a file
   * @param {string} filePath - Path to the file
   * @returns {Promise<Object>} File metadata
   */
  async loadMetadata(filePath) {
    const cacheKey = `${filePath}_metadata`
    
    // Check cache first
    if (this.loadedContent.has(cacheKey)) {
      return this.loadedContent.get(cacheKey)
    }

    try {
      const axios = (await import('axios')).default
      const response = await axios.get(`/files/${encodeURIComponent(filePath)}/metadata`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      const metadata = response.data

      // Cache the metadata
      this.loadedContent.set(cacheKey, metadata)

      return metadata
    } catch (error) {
      console.error('Error loading metadata:', error)
      throw error
    }
  }

  /**
   * Process the loading queue
   */
  processQueue() {
    if (this.currentLoads >= this.maxConcurrentLoads) return

    // Process any queued loads
    for (const [element, config] of this.observers) {
      if (!config.loaded && !config.loading && this.currentLoads < this.maxConcurrentLoads) {
        // Check if element is still in viewport or should be loaded
        const rect = element.getBoundingClientRect()
        const isVisible = rect.top < window.innerHeight + 100 && rect.bottom > -100

        if (isVisible) {
          this.loadContent(element, config)
        }
      }
    }
  }

  /**
   * Preload content for better performance
   * @param {Array} filePaths - Array of file paths to preload
   * @param {string} type - Type of content to preload
   */
  async preloadContent(filePaths, type = 'thumbnail') {
    const preloadPromises = filePaths.slice(0, 10).map(async (filePath) => {
      try {
        switch (type) {
          case 'thumbnail':
            await this.loadThumbnail(filePath)
            break
          case 'metadata':
            await this.loadMetadata(filePath)
            break
        }
      } catch (error) {
        // Ignore preload errors
        console.debug('Preload failed for:', filePath, error)
      }
    })

    await Promise.allSettled(preloadPromises)
  }

  /**
   * Clear all caches
   */
  clearCache() {
    this.loadedContent.clear()
    this.thumbnailCache.clear()
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  getCacheStats() {
    return {
      loadedContent: this.loadedContent.size,
      thumbnailCache: this.thumbnailCache.size,
      observers: this.observers.size,
      currentLoads: this.currentLoads
    }
  }

  /**
   * Cleanup - remove all observers
   */
  cleanup() {
    this.intersectionObserver.disconnect()
    this.observers.clear()
    this.clearCache()
  }
}

// Create and export singleton instance
export const lazyLoadingService = new LazyLoadingService()
export default lazyLoadingService