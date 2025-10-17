// services/activityIntegration.js
/**
 * Activity Integration Service
 * Provides a unified interface for activity logging across the application
 * Integrates with file operations, authentication, navigation, and favorites
 */

import { useActivityLogger } from '@/composables/useActivityLogger.js'
import { activityAPI } from './activityAPI.js'

// Activity types constants
export const ActivityTypes = {
  FILE_DOWNLOAD: 'FILE_DOWNLOAD',
  FILE_UPLOAD: 'FILE_UPLOAD',
  FILE_COPY: 'FILE_COPY',
  FILE_MOVE: 'FILE_MOVE',
  FILE_DELETE: 'FILE_DELETE',
  FILE_RENAME: 'FILE_RENAME',
  FILE_CREATE: 'FILE_CREATE',
  FOLDER_CREATE: 'FOLDER_CREATE',
  FOLDER_OPEN: 'FOLDER_OPEN'
}

class ActivityIntegrationService {
  constructor() {
    this.logger = null
    this.isInitialized = false
  }

  /**
   * Initialize the activity integration service
   */
  init() {
    if (!this.isInitialized) {
      this.logger = useActivityLogger()
      this.setupGlobalErrorHandler()
      this.setupNavigationLogging()
      this.isInitialized = true
    }
    return this
  }

  /**
   * Setup global error handler for automatic error logging
   */
  setupGlobalErrorHandler() {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', async (event) => {
      await this.logError(event.reason, 'unhandled_promise_rejection', {
        promise: event.promise?.toString(),
        url: window.location.href
      })
    })

    // Handle JavaScript errors
    window.addEventListener('error', async (event) => {
      await this.logError(event.error, 'javascript_error', {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        message: event.message,
        url: window.location.href
      })
    })

    // Handle Vue errors (if available)
    if (window.Vue && window.Vue.config) {
      const originalErrorHandler = window.Vue.config.errorHandler
      window.Vue.config.errorHandler = async (err, vm, info) => {
        await this.logError(err, 'vue_error', {
          component_info: info,
          component_name: vm?.$options?.name || 'Unknown',
          url: window.location.href
        })
        
        // Call original handler if it exists
        if (originalErrorHandler) {
          originalErrorHandler(err, vm, info)
        }
      }
    }
  }

  /**
   * Setup automatic navigation logging
   */
  setupNavigationLogging() {
    // Log page visibility changes
    document.addEventListener('visibilitychange', async () => {
      if (document.visibilityState === 'visible') {
        await this.logNavigation(window.location.pathname, {
          visibility_change: 'visible',
          referrer: document.referrer
        })
      }
    })

    // Log hash changes (for SPA routing)
    window.addEventListener('hashchange', async (event) => {
      await this.logNavigation(window.location.hash, {
        old_hash: event.oldURL,
        new_hash: event.newURL,
        navigation_type: 'hash_change'
      })
    })

    // Log popstate events (back/forward navigation)
    window.addEventListener('popstate', async (event) => {
      await this.logNavigation(window.location.pathname, {
        navigation_type: 'popstate',
        state: event.state
      })
    })
  }

  /**
   * Log user activity
   */
  async logActivity(action, resource = null, details = null, success = true, batch = false) {
    if (!this.logger) this.init()
    
    // Use the appropriate method based on action type
    switch (action) {
      case 'download':
        return this.logger.logFileDownload(resource, details?.fileInfo || {}, details?.timing || {})
      case 'upload':
        return this.logger.logFileUpload(resource, details?.fileInfo || {}, details?.timing || {})
      case 'copy':
        return this.logger.logCopy(details?.sourcePath || resource, details?.destPath || resource, details?.isFolder || false, details?.timing || {})
      case 'move':
        return this.logger.logMove(details?.sourcePath || resource, details?.destPath || resource, details?.isFolder || false, details?.timing || {})
      case 'delete':
        return this.logger.logDelete(resource, details?.isFolder || false, details?.timing || {})
      case 'rename':
        return this.logger.logRename(details?.oldPath || resource, details?.newPath || resource, details?.isFolder || false, details?.timing || {})
      case 'folder_open':
        return this.logger.logFolderOpen(resource, details?.timing || {})
      default:
        // For other actions, log as error for now
        return this.logger.logError(action, resource, { details, success })
    }
  }

  /**
   * Log navigation activity
   */
  async logNavigation(path, details = {}) {
    if (!this.logger) this.init()
    return this.logger.logFolderOpen(path, { navigation: true, ...details })
  }

  /**
   * Log file operation activity
   */
  async logFileOperation(operation, filePath, details = {}, success = true) {
    if (!this.logger) this.init()
    return this.logActivity(operation, filePath, { ...details, success })
  }

  /**
   * Log authentication activity
   */
  async logAuth(type, details = {}, success = true) {
    if (!this.logger) this.init()
    return this.logger.logError('auth_' + type, null, { ...details, success })
  }

  /**
   * Log favorite operation
   */
  async logFavorite(operation, path, details = {}) {
    if (!this.logger) this.init()
    return this.logger.logError('favorite_' + operation, path, details)
  }

  /**
   * Log error activity
   */
  async logError(error, context, details = {}) {
    if (!this.logger) this.init()
    return this.logger.logError(context, error?.message || error, { error: error?.stack, ...details })
  }

  /**
   * Log user interaction (clicks, form submissions, etc.)
   */
  async logInteraction(type, element, details = {}) {
    if (!this.logger) this.init()
    
    return this.logger.logError('user_interaction', element, {
      interaction_type: type,
      element_id: element,
      timestamp: new Date().toISOString(),
      ...details
    })
  }

  /**
   * Log performance metrics
   */
  async logPerformance(metric, value, details = {}) {
    if (!this.logger) this.init()
    
    return this.logger.logError('performance_metric', metric, {
      metric_name: metric,
      metric_value: value,
      timestamp: new Date().toISOString(),
      ...details
    })
  }

  /**
   * Log search activity
   */
  async logSearch(query, results, details = {}) {
    if (!this.logger) this.init()
    
    return this.logger.logError('search', query, {
      search_query: query,
      result_count: results,
      timestamp: new Date().toISOString(),
      ...details
    })
  }

  /**
   * Flush any pending batched logs
   */
  async flushLogs() {
    if (!this.logger) this.init()
    // No flush method needed for current implementation
    console.log('📝 Activity integration flush requested')
  }

  /**
   * Get activity statistics
   */
  async getActivityStats(bypassCache = false) {
    return await activityAPI.getActivityStats(bypassCache)
  }

  /**
   * Get user activities
   */
  async getActivities(filters = {}, bypassCache = false) {
    return await activityAPI.getActivities(filters, bypassCache)
  }

  /**
   * Get activity types
   */
  async getActivityTypes() {
    return await activityAPI.getActivityTypes()
  }

  /**
   * Invalidate activity cache
   */
  invalidateCache(pattern = null) {
    activityAPI.invalidateCache(pattern)
  }

  /**
   * Clear all activity cache
   */
  clearCache() {
    activityAPI.clearCache()
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return activityAPI.getCacheStats()
  }

  /**
   * Create activity logging middleware for Vue Router
   */
  createRouterMiddleware() {
    return async (to, from, next) => {
      // Log route navigation
      await this.logNavigation(to.path, {
        route_name: to.name,
        route_params: to.params,
        route_query: to.query,
        from_path: from.path,
        from_name: from.name,
        navigation_type: 'router'
      })
      
      next()
    }
  }

  /**
   * Create activity logging directive for Vue components
   */
  createVueDirective() {
    return {
      mounted(el, binding) {
        const { value, arg, modifiers } = binding
        const eventType = arg || 'click'
        
        const handler = async (event) => {
          const details = {
            element_tag: el.tagName,
            element_class: el.className,
            element_id: el.id,
            event_type: eventType,
            ...value
          }
          
          if (modifiers.prevent) {
            event.preventDefault()
          }
          
          if (modifiers.stop) {
            event.stopPropagation()
          }
          
          await activityIntegration.logInteraction(eventType, el.id || el.className, details)
        }
        
        el.addEventListener(eventType, handler)
        el._activityHandler = handler
        el._activityEventType = eventType
      },
      
      unmounted(el) {
        if (el._activityHandler && el._activityEventType) {
          el.removeEventListener(el._activityEventType, el._activityHandler)
        }
      }
    }
  }

  /**
   * Setup automatic form submission logging
   */
  setupFormLogging() {
    document.addEventListener('submit', async (event) => {
      const form = event.target
      if (form.tagName === 'FORM') {
        await this.logInteraction('form_submit', form.id || form.className, {
          form_action: form.action,
          form_method: form.method,
          form_elements: form.elements.length
        })
      }
    })
  }

  /**
   * Setup automatic link click logging
   */
  setupLinkLogging() {
    document.addEventListener('click', async (event) => {
      const link = event.target.closest('a')
      if (link && link.href) {
        await this.logInteraction('link_click', link.id || link.className, {
          link_href: link.href,
          link_text: link.textContent?.trim(),
          link_target: link.target,
          is_external: !link.href.startsWith(window.location.origin)
        })
      }
    })
  }

  /**
   * Setup performance monitoring
   */
  setupPerformanceMonitoring() {
    // Log page load performance
    window.addEventListener('load', async () => {
      const perfData = performance.getEntriesByType('navigation')[0]
      if (perfData) {
        await this.logPerformance('page_load', perfData.loadEventEnd - perfData.loadEventStart, {
          dom_content_loaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
          first_paint: perfData.responseEnd - perfData.requestStart,
          page_url: window.location.href
        })
      }
    })

    // Log resource loading performance
    const observer = new PerformanceObserver(async (list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'resource' && entry.duration > 1000) { // Log slow resources
          await this.logPerformance('slow_resource', entry.duration, {
            resource_name: entry.name,
            resource_type: entry.initiatorType,
            resource_size: entry.transferSize
          })
        }
      }
    })
    
    observer.observe({ entryTypes: ['resource'] })
  }
}

// Create and export singleton instance
export const activityIntegration = new ActivityIntegrationService()

// Auto-initialize when imported
activityIntegration.init()

export default activityIntegration