/**
 * @fileoverview Vue composable for lazy loading file content
 */

import { ref, onMounted, onUnmounted, nextTick, readonly } from 'vue'
import { lazyLoadingService } from '@/services/lazyLoadingService'

export function useLazyFileLoading() {
  const loadingStates = ref(new Map())
  const loadedContent = ref(new Map())
  const errors = ref(new Map())

  /**
   * Setup lazy loading for a thumbnail
   * @param {Ref} elementRef - Vue ref to the target element
   * @param {string} filePath - Path to the file
   * @param {Object} options - Loading options
   */
  const setupThumbnailLoading = (elementRef, filePath, options = {}) => {
    const config = {
      type: 'thumbnail',
      filePath,
      size: options.size || { width: 200, height: 200 },
      onLoad: (element, thumbnail) => {
        loadedContent.value.set(filePath, thumbnail)
        loadingStates.value.set(filePath, false)
        
        if (options.onLoad) {
          options.onLoad(thumbnail)
        }
      },
      onError: (element, error) => {
        errors.value.set(filePath, error)
        loadingStates.value.set(filePath, false)
        
        if (options.onError) {
          options.onError(error)
        }
      }
    }

    nextTick(() => {
      if (elementRef.value) {
        loadingStates.value.set(filePath, true)
        lazyLoadingService.observe(elementRef.value, config)
      }
    })
  }

  /**
   * Setup lazy loading for file preview
   * @param {Ref} elementRef - Vue ref to the target element
   * @param {string} filePath - Path to the file
   * @param {Object} options - Loading options
   */
  const setupPreviewLoading = (elementRef, filePath, options = {}) => {
    const config = {
      type: 'preview',
      filePath,
      previewType: options.previewType || 'basic',
      onLoad: (element, content) => {
        loadedContent.value.set(filePath, content)
        loadingStates.value.set(filePath, false)
        
        if (options.onLoad) {
          options.onLoad(content)
        }
      },
      onError: (element, error) => {
        errors.value.set(filePath, error)
        loadingStates.value.set(filePath, false)
        
        if (options.onError) {
          options.onError(error)
        }
      }
    }

    nextTick(() => {
      if (elementRef.value) {
        loadingStates.value.set(filePath, true)
        lazyLoadingService.observe(elementRef.value, config)
      }
    })
  }

  /**
   * Setup lazy loading for file metadata
   * @param {Ref} elementRef - Vue ref to the target element
   * @param {string} filePath - Path to the file
   * @param {Object} options - Loading options
   */
  const setupMetadataLoading = (elementRef, filePath, options = {}) => {
    const config = {
      type: 'metadata',
      filePath,
      onLoad: (element, metadata) => {
        loadedContent.value.set(filePath, metadata)
        loadingStates.value.set(filePath, false)
        
        if (options.onLoad) {
          options.onLoad(metadata)
        }
      },
      onError: (element, error) => {
        errors.value.set(filePath, error)
        loadingStates.value.set(filePath, false)
        
        if (options.onError) {
          options.onError(error)
        }
      }
    }

    nextTick(() => {
      if (elementRef.value) {
        loadingStates.value.set(filePath, true)
        lazyLoadingService.observe(elementRef.value, config)
      }
    })
  }

  /**
   * Manually load content without lazy loading
   * @param {string} filePath - Path to the file
   * @param {string} type - Type of content to load
   * @param {Object} options - Loading options
   */
  const loadContent = async (filePath, type, options = {}) => {
    loadingStates.value.set(filePath, true)
    errors.value.delete(filePath)

    try {
      let content = null

      switch (type) {
        case 'thumbnail':
          content = await lazyLoadingService.loadThumbnail(
            filePath, 
            options.size || { width: 200, height: 200 }
          )
          break
        case 'preview':
          content = await lazyLoadingService.loadPreview(
            filePath, 
            options.previewType || 'basic'
          )
          break
        case 'metadata':
          content = await lazyLoadingService.loadMetadata(filePath)
          break
        default:
          throw new Error(`Unknown content type: ${type}`)
      }

      loadedContent.value.set(filePath, content)
      return content
    } catch (error) {
      errors.value.set(filePath, error)
      throw error
    } finally {
      loadingStates.value.set(filePath, false)
    }
  }

  /**
   * Preload content for better performance
   * @param {Array} filePaths - Array of file paths
   * @param {string} type - Type of content to preload
   */
  const preloadContent = async (filePaths, type = 'thumbnail') => {
    try {
      await lazyLoadingService.preloadContent(filePaths, type)
    } catch (error) {
      console.error('Error preloading content:', error)
    }
  }

  /**
   * Check if content is loading
   * @param {string} filePath - Path to the file
   * @returns {boolean} True if loading
   */
  const isLoading = (filePath) => {
    return loadingStates.value.get(filePath) || false
  }

  /**
   * Check if content is loaded
   * @param {string} filePath - Path to the file
   * @returns {boolean} True if loaded
   */
  const isLoaded = (filePath) => {
    return loadedContent.value.has(filePath)
  }

  /**
   * Get loaded content
   * @param {string} filePath - Path to the file
   * @returns {any} Loaded content or null
   */
  const getContent = (filePath) => {
    return loadedContent.value.get(filePath) || null
  }

  /**
   * Get error for a file
   * @param {string} filePath - Path to the file
   * @returns {Error|null} Error or null
   */
  const getError = (filePath) => {
    return errors.value.get(filePath) || null
  }

  /**
   * Clear content for a specific file
   * @param {string} filePath - Path to the file
   */
  const clearContent = (filePath) => {
    loadedContent.value.delete(filePath)
    loadingStates.value.delete(filePath)
    errors.value.delete(filePath)
  }

  /**
   * Clear all loaded content
   */
  const clearAllContent = () => {
    loadedContent.value.clear()
    loadingStates.value.clear()
    errors.value.clear()
    lazyLoadingService.clearCache()
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  const getCacheStats = () => {
    return {
      ...lazyLoadingService.getCacheStats(),
      loadedContent: loadedContent.value.size,
      loadingStates: loadingStates.value.size,
      errors: errors.value.size
    }
  }

  // Cleanup on unmount
  onUnmounted(() => {
    // The service will handle cleanup of observers
  })

  return {
    // Setup functions
    setupThumbnailLoading,
    setupPreviewLoading,
    setupMetadataLoading,
    
    // Manual loading
    loadContent,
    preloadContent,
    
    // State checks
    isLoading,
    isLoaded,
    getContent,
    getError,
    
    // Cleanup
    clearContent,
    clearAllContent,
    
    // Statistics
    getCacheStats,
    
    // Reactive state
    loadingStates: readonly(loadingStates),
    loadedContent: readonly(loadedContent),
    errors: readonly(errors)
  }
}

export default useLazyFileLoading