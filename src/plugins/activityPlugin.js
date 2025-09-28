// plugins/activityPlugin.js
/**
 * Vue Plugin for Activity Logging
 * Provides global access to activity logging functionality
 */

import { activityIntegration } from '@/services/activityIntegration.js'

export default {
  install(app, options = {}) {
    // Make activity integration available globally
    app.config.globalProperties.$activity = activityIntegration
    
    // Provide activity integration for composition API
    app.provide('activity', activityIntegration)
    
    // Register activity logging directive
    app.directive('activity', activityIntegration.createVueDirective())
    
    // Setup optional features based on options
    if (options.autoSetup !== false) {
      // Setup form logging
      if (options.forms !== false) {
        activityIntegration.setupFormLogging()
      }
      
      // Setup link logging
      if (options.links !== false) {
        activityIntegration.setupLinkLogging()
      }
      
      // Setup performance monitoring
      if (options.performance !== false) {
        activityIntegration.setupPerformanceMonitoring()
      }
    }
    
    // Add router middleware if router is provided
    if (options.router) {
      options.router.beforeEach(activityIntegration.createRouterMiddleware())
    }
    
    // Setup global error handling
    if (options.errorHandling !== false) {
      const originalErrorHandler = app.config.errorHandler
      app.config.errorHandler = async (err, vm, info) => {
        await activityIntegration.logError(err, 'vue_error', {
          component_info: info,
          component_name: vm?.$?.type?.name || 'Unknown'
        })
        
        // Call original handler if it exists
        if (originalErrorHandler) {
          originalErrorHandler(err, vm, info)
        }
      }
    }
  }
}

/**
 * Composable for using activity logging in composition API
 */
export function useActivity() {
  return activityIntegration
}