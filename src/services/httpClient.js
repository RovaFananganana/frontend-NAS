/**
 * Unified HTTP Client Service
 * 
 * This service provides a centralized HTTP client using axios with:
 * - Authentication interceptors
 * - Error handling interceptors
 * - Timeout and retry logic
 * - Consistent configuration across the application
 */

import axios from 'axios'
import { getToken, removeToken } from './auth'
import router from '../router'

/**
 * HTTP Client Error class for better error handling
 */
export class HTTPClientError extends Error {
  constructor(message, status, code, originalError) {
    super(message)
    this.name = 'HTTPClientError'
    this.status = status
    this.code = code
    this.originalError = originalError
  }
}

/**
 * Unified HTTP Client Service
 */
class HTTPClientService {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5001'
    this.timeout = 30000 // 30 seconds default timeout
    this.maxRetries = 3
    this.retryDelay = 1000 // 1 second base delay
    
    this.client = this.createAxiosInstance()
    this.setupInterceptors()
  }

  /**
   * Create axios instance with base configuration
   */
  createAxiosInstance() {
    return axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }

  /**
   * Setup request and response interceptors
   */
  setupInterceptors() {
    // Request interceptor for authentication
    this.client.interceptors.request.use(
      (config) => {
        const token = getToken()
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        
        // Add request timestamp for performance tracking
        config.metadata = { startTime: new Date() }
        
        return config
      },
      (error) => {
        console.error('Request interceptor error:', error)
        return Promise.reject(new HTTPClientError(
          'Request configuration failed',
          0,
          'REQUEST_CONFIG_ERROR',
          error
        ))
      }
    )

    // Response interceptor for error handling and performance tracking
    this.client.interceptors.response.use(
      (response) => {
        // Calculate request duration for performance tracking
        if (response.config.metadata?.startTime) {
          const duration = new Date() - response.config.metadata.startTime
          console.debug(`HTTP ${response.config.method?.toUpperCase()} ${response.config.url} - ${duration}ms`)
        }
        
        return response
      },
      async (error) => {
        const originalRequest = error.config
        
        // Handle authentication errors
        if (error.response?.status === 401 && !originalRequest._retry) {
          console.warn('Authentication failed, redirecting to login')
          removeToken()
          
          // Avoid redirect loop if already on login page
          if (router.currentRoute.value.path !== '/login') {
            router.push('/login')
          }
          
          return Promise.reject(new HTTPClientError(
            'Authentication required',
            401,
            'AUTH_REQUIRED',
            error
          ))
        }

        // Handle retry logic for network errors and 5xx errors
        if (this.shouldRetry(error) && !originalRequest._retry) {
          originalRequest._retry = true
          originalRequest._retryCount = (originalRequest._retryCount || 0) + 1
          
          if (originalRequest._retryCount <= this.maxRetries) {
            const delay = this.calculateRetryDelay(originalRequest._retryCount)
            console.warn(`Retrying request (${originalRequest._retryCount}/${this.maxRetries}) after ${delay}ms`)
            
            await this.sleep(delay)
            return this.client(originalRequest)
          }
        }

        // Transform error to HTTPClientError
        return Promise.reject(this.transformError(error))
      }
    )
  }

  /**
   * Determine if a request should be retried
   */
  shouldRetry(error) {
    // Retry on network errors
    if (!error.response) {
      return true
    }
    
    // Retry on 5xx server errors
    if (error.response.status >= 500) {
      return true
    }
    
    // Retry on specific 4xx errors that might be temporary
    if (error.response.status === 408 || error.response.status === 429) {
      return true
    }
    
    return false
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  calculateRetryDelay(retryCount) {
    return Math.min(this.retryDelay * Math.pow(2, retryCount - 1), 10000) // Max 10 seconds
  }

  /**
   * Sleep utility for retry delays
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Transform axios error to HTTPClientError
   */
  transformError(error) {
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response
      const message = data?.error || data?.message || data?.msg || `HTTP ${status}: ${error.response.statusText}`
      const code = data?.code || `HTTP_${status}`
      
      return new HTTPClientError(message, status, code, error)
    } else if (error.request) {
      // Network error
      return new HTTPClientError(
        'Network error - please check your connection',
        0,
        'NETWORK_ERROR',
        error
      )
    } else {
      // Request configuration error
      return new HTTPClientError(
        `Request failed: ${error.message}`,
        0,
        'REQUEST_ERROR',
        error
      )
    }
  }

  // ==================== HTTP Methods ====================

  /**
   * GET request
   */
  async get(url, config = {}) {
    try {
      const response = await this.client.get(url, config)
      return response.data
    } catch (error) {
      throw error instanceof HTTPClientError ? error : this.transformError(error)
    }
  }

  /**
   * POST request
   */
  async post(url, data = null, config = {}) {
    try {
      const response = await this.client.post(url, data, config)
      return response.data
    } catch (error) {
      throw error instanceof HTTPClientError ? error : this.transformError(error)
    }
  }

  /**
   * PUT request
   */
  async put(url, data = null, config = {}) {
    try {
      const response = await this.client.put(url, data, config)
      return response.data
    } catch (error) {
      throw error instanceof HTTPClientError ? error : this.transformError(error)
    }
  }

  /**
   * DELETE request
   */
  async delete(url, config = {}) {
    try {
      const response = await this.client.delete(url, config)
      return response.data
    } catch (error) {
      throw error instanceof HTTPClientError ? error : this.transformError(error)
    }
  }

  /**
   * PATCH request
   */
  async patch(url, data = null, config = {}) {
    try {
      const response = await this.client.patch(url, data, config)
      return response.data
    } catch (error) {
      throw error instanceof HTTPClientError ? error : this.transformError(error)
    }
  }

  // ==================== Specialized Methods ====================

  /**
   * Download file with progress tracking
   */
  async downloadFile(url, onProgress = null, config = {}) {
    try {
      const downloadConfig = {
        ...config,
        responseType: 'blob',
        onDownloadProgress: onProgress ? (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress(percentCompleted, progressEvent.loaded, progressEvent.total)
        } : undefined
      }
      
      const response = await this.client.get(url, downloadConfig)
      return response.data // Returns blob
    } catch (error) {
      throw error instanceof HTTPClientError ? error : this.transformError(error)
    }
  }

  /**
   * Upload file with progress tracking
   */
  async uploadFile(url, formData, onProgress = null, config = {}) {
    try {
      const uploadConfig = {
        ...config,
        headers: {
          ...config.headers,
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: onProgress ? (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress(percentCompleted, progressEvent.loaded, progressEvent.total)
        } : undefined
      }
      
      const response = await this.client.post(url, formData, uploadConfig)
      return response.data
    } catch (error) {
      throw error instanceof HTTPClientError ? error : this.transformError(error)
    }
  }

  /**
   * Request with custom timeout
   */
  async requestWithTimeout(method, url, data = null, timeout = null, config = {}) {
    const requestConfig = {
      ...config,
      timeout: timeout || this.timeout
    }
    
    try {
      const response = await this.client.request({
        method,
        url,
        data,
        ...requestConfig
      })
      return response.data
    } catch (error) {
      throw error instanceof HTTPClientError ? error : this.transformError(error)
    }
  }

  // ==================== Configuration Methods ====================

  /**
   * Update base URL
   */
  setBaseURL(baseURL) {
    this.baseURL = baseURL
    this.client.defaults.baseURL = baseURL
  }

  /**
   * Update default timeout
   */
  setTimeout(timeout) {
    this.timeout = timeout
    this.client.defaults.timeout = timeout
  }

  /**
   * Update retry configuration
   */
  setRetryConfig(maxRetries, retryDelay) {
    this.maxRetries = maxRetries
    this.retryDelay = retryDelay
  }

  /**
   * Get current configuration
   */
  getConfig() {
    return {
      baseURL: this.baseURL,
      timeout: this.timeout,
      maxRetries: this.maxRetries,
      retryDelay: this.retryDelay
    }
  }

  /**
   * Get raw axios instance (for advanced usage)
   */
  getAxiosInstance() {
    return this.client
  }
}

// Create and export singleton instance
export const httpClient = new HTTPClientService()

// Export class for testing or custom instances
export { HTTPClientService }

// Export default instance
export default httpClient