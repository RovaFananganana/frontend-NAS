// services/errorHandler.js
import { useStore } from 'vuex'

class ErrorHandler {
  constructor() {
    this.errorCounts = new Map()
    this.maxRetries = 3
    this.retryDelay = 1000
  }

  // Enhanced error handling with context
  handleError(error, context = {}) {
    const errorInfo = this.parseError(error)
    const errorKey = `${errorInfo.type}_${errorInfo.code}`
    
    // Track error frequency
    this.errorCounts.set(errorKey, (this.errorCounts.get(errorKey) || 0) + 1)
    
    // Log error with context
    console.error('Error occurred:', {
      ...errorInfo,
      context,
      frequency: this.errorCounts.get(errorKey),
      timestamp: new Date().toISOString()
    })
    
    // Show user-friendly message
    this.showUserMessage(errorInfo, context)
    
    // Send to monitoring if critical
    if (errorInfo.severity === 'critical') {
      this.reportCriticalError(errorInfo, context)
    }
    
    return errorInfo
  }

  // Parse error into structured format
  parseError(error) {
    let errorInfo = {
      type: 'unknown',
      code: 'UNKNOWN_ERROR',
      message: 'An unexpected error occurred',
      severity: 'medium',
      retryable: false,
      userMessage: 'Something went wrong. Please try again.',
      technicalDetails: null
    }

    if (error.response) {
      // HTTP error response
      const { status, data } = error.response
      
      errorInfo = {
        ...errorInfo,
        type: 'http',
        code: `HTTP_${status}`,
        message: data?.message || data?.error || `HTTP ${status} Error`,
        technicalDetails: {
          status,
          url: error.config?.url,
          method: error.config?.method,
          data: data
        }
      }

      // Specific HTTP error handling
      switch (status) {
        case 400:
          errorInfo.userMessage = 'Invalid request. Please check your input.'
          errorInfo.severity = 'low'
          break
        case 401:
          errorInfo.userMessage = 'Your session has expired. Please log in again.'
          errorInfo.severity = 'high'
          errorInfo.code = 'UNAUTHORIZED'
          break
        case 403:
          errorInfo.userMessage = 'You don\'t have permission to perform this action.'
          errorInfo.severity = 'medium'
          errorInfo.code = 'FORBIDDEN'
          break
        case 404:
          errorInfo.userMessage = 'The requested resource was not found.'
          errorInfo.severity = 'low'
          errorInfo.code = 'NOT_FOUND'
          break
        case 422:
          errorInfo.userMessage = data?.message || 'Validation error. Please check your input.'
          errorInfo.severity = 'low'
          errorInfo.code = 'VALIDATION_ERROR'
          break
        case 429:
          errorInfo.userMessage = 'Too many requests. Please wait a moment and try again.'
          errorInfo.severity = 'medium'
          errorInfo.retryable = true
          errorInfo.code = 'RATE_LIMITED'
          break
        case 500:
          errorInfo.userMessage = 'Server error. Our team has been notified.'
          errorInfo.severity = 'critical'
          errorInfo.retryable = true
          errorInfo.code = 'SERVER_ERROR'
          break
        case 502:
        case 503:
        case 504:
          errorInfo.userMessage = 'Service temporarily unavailable. Please try again later.'
          errorInfo.severity = 'high'
          errorInfo.retryable = true
          errorInfo.code = 'SERVICE_UNAVAILABLE'
          break
      }
    } else if (error.request) {
      // Network error
      errorInfo = {
        ...errorInfo,
        type: 'network',
        code: 'NETWORK_ERROR',
        message: 'Network connection failed',
        userMessage: 'Unable to connect to the server. Please check your internet connection.',
        severity: 'high',
        retryable: true,
        technicalDetails: {
          request: error.request
        }
      }
    } else if (error.name === 'ValidationError') {
      // Validation error
      errorInfo = {
        ...errorInfo,
        type: 'validation',
        code: 'VALIDATION_ERROR',
        message: error.message,
        userMessage: 'Please check your input and try again.',
        severity: 'low',
        technicalDetails: error.details
      }
    } else {
      // JavaScript error
      errorInfo = {
        ...errorInfo,
        type: 'javascript',
        code: error.name || 'JS_ERROR',
        message: error.message,
        userMessage: 'An unexpected error occurred. Please refresh the page.',
        severity: 'medium',
        technicalDetails: {
          stack: error.stack,
          name: error.name
        }
      }
    }

    return errorInfo
  }

  // Show user-friendly message
  showUserMessage(errorInfo, context) {
    // This would integrate with your notification system
    const store = useStore()
    
    const notificationType = {
      'low': 'warning',
      'medium': 'error',
      'high': 'error',
      'critical': 'error'
    }[errorInfo.severity] || 'error'

    store.dispatch('showNotification', {
      type: notificationType,
      title: this.getErrorTitle(errorInfo),
      message: errorInfo.userMessage,
      timeout: this.getTimeoutForSeverity(errorInfo.severity),
      actions: this.getErrorActions(errorInfo, context)
    })
  }

  // Get error title based on type
  getErrorTitle(errorInfo) {
    const titles = {
      'http': 'Request Failed',
      'network': 'Connection Error',
      'validation': 'Validation Error',
      'javascript': 'Application Error',
      'unknown': 'Error'
    }
    return titles[errorInfo.type] || 'Error'
  }

  // Get timeout based on severity
  getTimeoutForSeverity(severity) {
    const timeouts = {
      'low': 3000,
      'medium': 5000,
      'high': 8000,
      'critical': 0 // No auto-dismiss for critical errors
    }
    return timeouts[severity] || 5000
  }

  // Get available actions for error
  getErrorActions(errorInfo, context) {
    const actions = []

    if (errorInfo.retryable && context.retryFunction) {
      actions.push({
        label: 'Retry',
        action: () => this.retryWithBackoff(context.retryFunction, context.retryCount || 0)
      })
    }

    if (errorInfo.code === 'UNAUTHORIZED') {
      actions.push({
        label: 'Login',
        action: () => {
          // Redirect to login
          window.location.href = '/login'
        }
      })
    }

    if (errorInfo.severity === 'critical') {
      actions.push({
        label: 'Report Issue',
        action: () => this.reportIssue(errorInfo, context)
      })
    }

    return actions
  }

  // Retry with exponential backoff
  async retryWithBackoff(retryFunction, retryCount = 0) {
    if (retryCount >= this.maxRetries) {
      throw new Error('Maximum retry attempts exceeded')
    }

    const delay = this.retryDelay * Math.pow(2, retryCount)
    
    await new Promise(resolve => setTimeout(resolve, delay))
    
    try {
      return await retryFunction()
    } catch (error) {
      return this.retryWithBackoff(retryFunction, retryCount + 1)
    }
  }

  // Report critical error to monitoring
  async reportCriticalError(errorInfo, context) {
    try {
      await fetch('/api/errors/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          error: errorInfo,
          context,
          userAgent: navigator.userAgent,
          url: window.location.href,
          timestamp: new Date().toISOString(),
          userId: context.userId
        })
      })
    } catch (reportError) {
      console.error('Failed to report critical error:', reportError)
    }
  }

  // Report issue (user-initiated)
  reportIssue(errorInfo, context) {
    // Open issue reporting modal or redirect to support
    console.log('Opening issue report for:', errorInfo)
    // Implementation depends on your support system
  }

  // Get error statistics
  getErrorStats() {
    const stats = {
      totalErrors: 0,
      errorsByType: {},
      errorsByCode: {},
      mostFrequent: []
    }

    for (const [key, count] of this.errorCounts.entries()) {
      stats.totalErrors += count
      
      const [type, code] = key.split('_', 2)
      stats.errorsByType[type] = (stats.errorsByType[type] || 0) + count
      stats.errorsByCode[code] = (stats.errorsByCode[code] || 0) + count
    }

    // Get most frequent errors
    stats.mostFrequent = Array.from(this.errorCounts.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([key, count]) => ({ key, count }))

    return stats
  }

  // Clear error statistics
  clearStats() {
    this.errorCounts.clear()
  }
}

// Create global instance
export const errorHandler = new ErrorHandler()

// Vue composable for error handling
export function useErrorHandler() {
  const handleError = (error, context = {}) => {
    return errorHandler.handleError(error, context)
  }

  const handleAsyncError = async (asyncFunction, context = {}) => {
    try {
      return await asyncFunction()
    } catch (error) {
      handleError(error, {
        ...context,
        retryFunction: asyncFunction
      })
      throw error
    }
  }

  const withRetry = async (asyncFunction, maxRetries = 3) => {
    return errorHandler.retryWithBackoff(asyncFunction, 0)
  }

  return {
    handleError,
    handleAsyncError,
    withRetry,
    getStats: () => errorHandler.getErrorStats(),
    clearStats: () => errorHandler.clearStats()
  }
}

export default errorHandler