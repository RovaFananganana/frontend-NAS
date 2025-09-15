// services/performance.js
import { getToken } from "./auth";

// Performance tracking
class PerformanceTracker {
  constructor() {
    this.metrics = new Map();
    this.requestTimes = new Map();
    this.cacheStats = {
      hits: 0,
      misses: 0,
      total: 0
    };
  }

  startRequest(requestId, config) {
    this.requestTimes.set(requestId, {
      startTime: Date.now(),
      method: config.method?.toUpperCase(),
      url: config.url,
      endpoint: this.extractEndpoint(config.url)
    });
  }

  endRequest(requestId, response, error = null) {
    const requestData = this.requestTimes.get(requestId);
    if (!requestData) return;

    const duration = Date.now() - requestData.startTime;
    const endpoint = requestData.endpoint;

    // Update metrics
    if (!this.metrics.has(endpoint)) {
      this.metrics.set(endpoint, {
        count: 0,
        totalTime: 0,
        avgTime: 0,
        minTime: Infinity,
        maxTime: 0,
        errors: 0,
        lastCall: null,
        recentTimes: []
      });
    }

    const metric = this.metrics.get(endpoint);
    metric.count++;
    metric.totalTime += duration;
    metric.avgTime = metric.totalTime / metric.count;
    metric.minTime = Math.min(metric.minTime, duration);
    metric.maxTime = Math.max(metric.maxTime, duration);
    metric.lastCall = new Date().toISOString();
    
    // Keep last 10 response times for trend analysis
    metric.recentTimes.push(duration);
    if (metric.recentTimes.length > 10) {
      metric.recentTimes.shift();
    }

    if (error) {
      metric.errors++;
    }

    // Log slow requests
    if (duration > 1000) {
      console.warn(`Slow API request: ${requestData.method} ${requestData.url} took ${duration}ms`);
    }

    // Send to backend if enabled (temporarily disabled for debugging)
    if (import.meta.env.VITE_ENABLE_FRONTEND_METRICS === 'true' && false) {
      this.sendMetricToBackend({
        endpoint,
        method: requestData.method,
        duration,
        timestamp: new Date().toISOString(),
        success: !error,
        error: error?.message,
        userAgent: navigator.userAgent,
        url: requestData.url
      });
    }

    this.requestTimes.delete(requestId);
  }

  extractEndpoint(url) {
    // Extract meaningful endpoint from URL
    if (!url) return 'unknown';
    
    // Remove base URL
    const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001";
    let endpoint = url.replace(baseUrl, '');
    
    // Remove query parameters and normalize IDs
    return endpoint
      .replace(/\?.*$/, '') // Remove query params
      .replace(/\/\d+/g, '/:id') // Replace numeric IDs
      .replace(/\/[a-f0-9-]{36}/g, '/:uuid') // Replace UUIDs
      .replace(/\/[a-f0-9]{24}/g, '/:objectId') // Replace MongoDB ObjectIds
      .toLowerCase();
  }

  async sendMetricToBackend(metric) {
    try {
      // Don't track the metrics endpoint itself to avoid recursion
      if (metric.endpoint && metric.endpoint.includes('/metrics')) return;

      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001";
      
      // Ensure all required fields are present
      const cleanMetric = {
        endpoint: metric.endpoint || 'unknown',
        method: metric.method || 'GET',
        duration: Number(metric.duration) || 0,
        timestamp: metric.timestamp || new Date().toISOString(),
        success: metric.success !== false,
        userAgent: metric.userAgent || navigator.userAgent,
        url: metric.url || 'unknown'
      };

      const response = await fetch(`${API_BASE_URL}/api/metrics/frontend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken() || ''}`
        },
        body: JSON.stringify(cleanMetric)
      });

      if (!response.ok) {
        console.debug(`Metrics API returned ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      // Silently fail - don't break the app for metrics
      console.debug('Failed to send frontend metric:', error.message);
    }
  }

  // Cache tracking methods
  recordCacheHit(key) {
    this.cacheStats.hits++;
    this.cacheStats.total++;
    console.debug(`Cache HIT for key: ${key}`);
  }

  recordCacheMiss(key) {
    this.cacheStats.misses++;
    this.cacheStats.total++;
    console.debug(`Cache MISS for key: ${key}`);
  }

  getCacheStats() {
    return {
      ...this.cacheStats,
      hitRate: this.cacheStats.total > 0 ? (this.cacheStats.hits / this.cacheStats.total) * 100 : 0
    };
  }

  getMetrics() {
    return Object.fromEntries(this.metrics);
  }

  getTopSlowEndpoints(limit = 5) {
    const metrics = Array.from(this.metrics.entries())
      .map(([endpoint, data]) => ({ endpoint, ...data }))
      .sort((a, b) => b.avgTime - a.avgTime)
      .slice(0, limit);
    
    return metrics;
  }

  getErrorRate() {
    const totalRequests = Array.from(this.metrics.values()).reduce((sum, metric) => sum + metric.count, 0);
    const totalErrors = Array.from(this.metrics.values()).reduce((sum, metric) => sum + metric.errors, 0);
    
    return totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0;
  }

  clearMetrics() {
    this.metrics.clear();
    this.cacheStats = { hits: 0, misses: 0, total: 0 };
  }

  // Get performance summary
  getSummary() {
    const metrics = this.getMetrics();
    const endpoints = Object.keys(metrics);
    
    if (endpoints.length === 0) {
      return {
        totalRequests: 0,
        avgResponseTime: 0,
        errorRate: 0,
        slowestEndpoint: null,
        cacheStats: this.getCacheStats()
      };
    }

    const totalRequests = endpoints.reduce((sum, endpoint) => sum + metrics[endpoint].count, 0);
    const totalTime = endpoints.reduce((sum, endpoint) => sum + metrics[endpoint].totalTime, 0);
    const avgResponseTime = totalTime / totalRequests;
    
    const slowestEndpoint = endpoints.reduce((slowest, endpoint) => {
      return !slowest || metrics[endpoint].avgTime > metrics[slowest].avgTime ? endpoint : slowest;
    }, null);

    return {
      totalRequests,
      avgResponseTime: Math.round(avgResponseTime),
      errorRate: this.getErrorRate(),
      slowestEndpoint: slowestEndpoint ? {
        endpoint: slowestEndpoint,
        avgTime: Math.round(metrics[slowestEndpoint].avgTime)
      } : null,
      cacheStats: this.getCacheStats()
    };
  }
}

// Global performance tracker instance
const performanceTracker = new PerformanceTracker();

// Setup function to add interceptors to axios instance
export function setupApiPerformanceTracking(axiosInstance) {
  // Request interceptor
  axiosInstance.interceptors.request.use(
    (config) => {
      // Start performance tracking
      const requestId = `${Date.now()}-${Math.random()}`;
      config.metadata = { requestId };
      performanceTracker.startRequest(requestId, config);
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor
  axiosInstance.interceptors.response.use(
    (response) => {
      // End performance tracking
      const requestId = response.config.metadata?.requestId;
      if (requestId) {
        performanceTracker.endRequest(requestId, response);
      }
      return response;
    },
    (error) => {
      // End performance tracking with error
      const requestId = error.config?.metadata?.requestId;
      if (requestId) {
        performanceTracker.endRequest(requestId, null, error);
      }
      return Promise.reject(error);
    }
  );
}

// Cache implementation with performance tracking
class PerformanceCache {
  constructor(maxSize = 100, ttl = 5 * 60 * 1000) { // 5 minutes default TTL
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttl = ttl;
  }

  get(key) {
    const item = this.cache.get(key);
    
    if (!item) {
      performanceTracker.recordCacheMiss(key);
      return null;
    }

    // Check if expired
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      performanceTracker.recordCacheMiss(key);
      return null;
    }

    performanceTracker.recordCacheHit(key);
    return item.value;
  }

  set(key, value) {
    // Remove oldest item if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      value,
      expiry: Date.now() + this.ttl
    });
  }

  delete(key) {
    return this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  size() {
    return this.cache.size;
  }

  // Clean expired entries
  cleanup() {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
      }
    }
  }
}

// Global cache instances
const apiCache = new PerformanceCache(200, 5 * 60 * 1000); // 5 minutes
const permissionCache = new PerformanceCache(500, 10 * 60 * 1000); // 10 minutes for permissions

// Cleanup expired cache entries every minute
setInterval(() => {
  apiCache.cleanup();
  permissionCache.cleanup();
}, 60 * 1000);

// Cached API wrapper
export function createCachedApiCall(apiFunction, cacheKey, cache = apiCache) {
  return async (...args) => {
    const key = typeof cacheKey === 'function' ? cacheKey(...args) : cacheKey;
    
    // Try cache first
    const cached = cache.get(key);
    if (cached) {
      return cached;
    }

    // Call API and cache result
    try {
      const result = await apiFunction(...args);
      cache.set(key, result);
      return result;
    } catch (error) {
      // Don't cache errors
      throw error;
    }
  };
}

// Export instances
export { performanceTracker, apiCache, permissionCache };

// Export performance monitoring utilities
export const PerformanceMonitor = {
  // Start a custom performance measurement
  start(label) {
    const startTime = Date.now();
    return {
      end() {
        const duration = Date.now() - startTime;
        console.debug(`Performance: ${label} took ${duration}ms`);
        return duration;
      }
    };
  },

  // Measure a function execution
  async measure(label, fn) {
    const monitor = this.start(label);
    try {
      const result = await fn();
      monitor.end();
      return result;
    } catch (error) {
      monitor.end();
      throw error;
    }
  },

  // Get current performance metrics
  getMetrics() {
    return performanceTracker.getSummary();
  },

  // Get detailed metrics
  getDetailedMetrics() {
    return {
      summary: performanceTracker.getSummary(),
      endpoints: performanceTracker.getMetrics(),
      topSlow: performanceTracker.getTopSlowEndpoints(),
      cache: {
        api: {
          size: apiCache.size(),
          stats: performanceTracker.getCacheStats()
        },
        permissions: {
          size: permissionCache.size()
        }
      }
    };
  }
};