// composables/usePermissions.js

import { computed, ref } from 'vue'
import { useStore } from 'vuex'
import { nasAPI } from '@/services/nasAPI'

/**
 * Composable for managing file and folder permissions
 * Provides reactive permission checking and caching with detailed logging
 */
export function usePermissions() {
  const store = useStore()
  
  // Cache for permissions to avoid repeated API calls
  const permissionsCache = ref(new Map())
  const loadingPermissions = ref(new Set())
  
  // Logging and metrics
  const permissionLogs = ref([])
  const performanceMetrics = ref({
    totalChecks: 0,
    cacheHits: 0,
    cacheMisses: 0,
    totalDuration: 0,
    averageDuration: 0,
    failures: 0
  })
  
  // User info from store
  const user = computed(() => store.state.user)
  const isAdmin = computed(() => store.getters.isAdmin)
  
  /**
   * Check if user is admin (always has all permissions)
   */
  const isUserAdmin = computed(() => {
    return user.value?.role === 'ADMIN'
  })
  
  /**
   * Log permission operation with detailed context
   */
  const logPermissionOperation = (operation, context) => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      operation,
      user_id: user.value?.id,
      username: user.value?.username,
      ...context
    }
    
    // Add to local logs (keep last 100 entries)
    permissionLogs.value.unshift(logEntry)
    if (permissionLogs.value.length > 100) {
      permissionLogs.value = permissionLogs.value.slice(0, 100)
    }
    
    // Console logging for development
    if (import.meta.env.DEV) {
      console.log(`🔍 [PERMISSION] ${operation}:`, context)
    }
  }

  /**
   * Update performance metrics
   */
  const updatePerformanceMetrics = (operation, duration, success = true) => {
    performanceMetrics.value.totalChecks++
    
    if (operation === 'cache_hit') {
      performanceMetrics.value.cacheHits++
    } else if (operation === 'cache_miss') {
      performanceMetrics.value.cacheMisses++
    }
    
    if (!success) {
      performanceMetrics.value.failures++
    }
    
    if (duration) {
      performanceMetrics.value.totalDuration += duration
      performanceMetrics.value.averageDuration = 
        performanceMetrics.value.totalDuration / performanceMetrics.value.totalChecks
    }
  }

  /**
   * Get cached permissions for a path with logging
   */
  const getCachedPermissions = (path) => {
    const startTime = performance.now()
    const cached = permissionsCache.value.get(path)
    
    if (cached && Date.now() - cached.timestamp < 300000) { // 5 minutes cache
      const duration = performance.now() - startTime
      
      logPermissionOperation('cache_hit', {
        path,
        cache_age_ms: Date.now() - cached.timestamp,
        duration_ms: duration,
        permissions: cached.permissions
      })
      
      updatePerformanceMetrics('cache_hit', duration)
      return cached.permissions
    }
    
    if (cached) {
      logPermissionOperation('cache_expired', {
        path,
        cache_age_ms: Date.now() - cached.timestamp,
        expired_permissions: cached.permissions
      })
    }
    
    return null
  }
  
  /**
   * Cache permissions for a path with logging
   */
  const setCachedPermissions = (path, permissions) => {
    const cacheEntry = {
      permissions,
      timestamp: Date.now()
    }
    
    permissionsCache.value.set(path, cacheEntry)
    
    logPermissionOperation('cache_set', {
      path,
      permissions,
      cache_size: permissionsCache.value.size
    })
  }
  
  /**
   * Load permissions for a specific path from backend with detailed logging
   */
  const loadPermissions = async (path) => {
    const startTime = performance.now()
    const operationId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    logPermissionOperation('load_permissions_start', {
      path,
      operation_id: operationId,
      user_id: user.value?.id,
      is_admin: isUserAdmin.value
    })
    
    if (!path || !user.value) {
      logPermissionOperation('load_permissions_invalid_input', {
        path,
        user_exists: !!user.value,
        operation_id: operationId
      })
      return null
    }
    
    // Admin always has all permissions
    if (isUserAdmin.value) {
      const adminPermissions = {
        can_read: true,
        can_write: true,
        can_delete: true,
        can_share: true,
        can_modify: true
      }
      
      const duration = performance.now() - startTime
      
      logPermissionOperation('admin_permissions_granted', {
        path,
        permissions: adminPermissions,
        duration_ms: duration,
        operation_id: operationId
      })
      
      setCachedPermissions(path, adminPermissions)
      updatePerformanceMetrics('admin_bypass', duration)
      return adminPermissions
    }
    
    // Check cache first
    const cached = getCachedPermissions(path)
    if (cached) {
      const duration = performance.now() - startTime
      
      logPermissionOperation('permissions_from_cache', {
        path,
        permissions: cached,
        duration_ms: duration,
        operation_id: operationId
      })
      
      return cached
    }
    
    // Avoid duplicate requests
    if (loadingPermissions.value.has(path)) {
      logPermissionOperation('duplicate_request_blocked', {
        path,
        operation_id: operationId
      })
      return null
    }
    
    try {
      loadingPermissions.value.add(path)
      
      logPermissionOperation('api_request_start', {
        path,
        operation_id: operationId
      })
      
      const apiStartTime = performance.now()
      const response = await nasAPI.checkPermissions(path)
      const apiDuration = performance.now() - apiStartTime
      
      const permissions = response.permissions || {
        can_read: false,
        can_write: false,
        can_delete: false,
        can_share: false,
        can_modify: false
      }
      
      const totalDuration = performance.now() - startTime
      
      logPermissionOperation('permissions_loaded_success', {
        path,
        permissions,
        api_duration_ms: apiDuration,
        total_duration_ms: totalDuration,
        operation_id: operationId,
        response_data: response
      })
      
      setCachedPermissions(path, permissions)
      updatePerformanceMetrics('cache_miss', totalDuration, true)
      return permissions
      
    } catch (error) {
      const totalDuration = performance.now() - startTime
      
      logPermissionOperation('permissions_load_error', {
        path,
        error: error.message,
        error_code: error.code,
        error_status: error.status,
        total_duration_ms: totalDuration,
        operation_id: operationId,
        stack_trace: error.stack
      })
      
      console.error('Error loading permissions for', path, error)
      
      // Default to read-only for regular users on error
      const defaultPermissions = {
        can_read: true,
        can_write: false,
        can_delete: false,
        can_share: false,
        can_modify: false
      }
      
      logPermissionOperation('fallback_permissions_applied', {
        path,
        fallback_permissions: defaultPermissions,
        original_error: error.message,
        operation_id: operationId
      })
      
      setCachedPermissions(path, defaultPermissions)
      updatePerformanceMetrics('api_error', totalDuration, false)
      return defaultPermissions
    } finally {
      loadingPermissions.value.delete(path)
      
      logPermissionOperation('load_permissions_complete', {
        path,
        operation_id: operationId,
        total_duration_ms: performance.now() - startTime
      })
    }
  }
  
  /**
   * Check if user can perform a specific action on a path with detailed logging
   */
  const canPerformAction = async (path, action) => {
    const startTime = performance.now()
    const operationId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    logPermissionOperation('action_check_start', {
      path,
      action,
      operation_id: operationId,
      user_id: user.value?.id
    })
    
    if (!user.value) {
      logPermissionOperation('action_check_no_user', {
        path,
        action,
        operation_id: operationId
      })
      return false
    }
    
    // Admin can do everything
    if (isUserAdmin.value) {
      const duration = performance.now() - startTime
      
      logPermissionOperation('action_check_admin_granted', {
        path,
        action,
        result: true,
        duration_ms: duration,
        operation_id: operationId
      })
      
      return true
    }
    
    const permissions = await loadPermissions(path)
    if (!permissions) {
      const duration = performance.now() - startTime
      
      logPermissionOperation('action_check_no_permissions', {
        path,
        action,
        result: false,
        duration_ms: duration,
        operation_id: operationId
      })
      
      return false
    }
    
    let result = false
    let permission_source = 'none'
    
    switch (action) {
      case 'read':
      case 'view':
      case 'download':
        result = permissions.can_read
        permission_source = 'can_read'
        break
      case 'write':
      case 'modify':
      case 'rename':
      case 'upload':
        result = permissions.can_write || permissions.can_modify
        permission_source = permissions.can_write ? 'can_write' : 'can_modify'
        break
      case 'delete':
      case 'remove':
        result = permissions.can_delete
        permission_source = 'can_delete'
        break
      case 'share':
      case 'permissions':
        result = permissions.can_share || isUserAdmin.value
        permission_source = permissions.can_share ? 'can_share' : 'admin'
        break
      case 'copy':
        result = permissions.can_read // Can copy if can read
        permission_source = 'can_read'
        break
      case 'cut':
      case 'move':
        result = permissions.can_write || permissions.can_modify
        permission_source = permissions.can_write ? 'can_write' : 'can_modify'
        break
      case 'create_folder':
        result = permissions.can_write || permissions.can_modify
        permission_source = permissions.can_write ? 'can_write' : 'can_modify'
        break
      default:
        result = false
        permission_source = 'unknown_action'
    }
    
    const duration = performance.now() - startTime
    
    logPermissionOperation('action_check_complete', {
      path,
      action,
      result,
      permission_source,
      permissions,
      duration_ms: duration,
      operation_id: operationId
    })
    
    // Log failures with more detail
    if (!result) {
      logPermissionOperation('action_check_denied', {
        path,
        action,
        required_permission: permission_source,
        available_permissions: permissions,
        user_id: user.value?.id,
        operation_id: operationId
      })
    }
    
    return result
  }
  
  /**
   * Check multiple permissions at once
   */
  const checkMultiplePermissions = async (path, actions) => {
    const results = {}
    for (const action of actions) {
      results[action] = await canPerformAction(path, action)
    }
    return results
  }
  
  /**
   * Get permission error message for an action
   */
  const getPermissionErrorMessage = (action) => {
    const messages = {
      read: "Vous n'avez pas la permission de lire ce fichier/dossier",
      write: "Vous n'avez pas la permission de modifier ce fichier/dossier",
      delete: "Vous n'avez pas la permission de supprimer ce fichier/dossier",
      share: "Vous n'avez pas la permission de partager ce fichier/dossier",
      rename: "Vous n'avez pas la permission de renommer ce fichier/dossier",
      move: "Vous n'avez pas la permission de déplacer ce fichier/dossier",
      copy: "Vous n'avez pas la permission de copier ce fichier/dossier",
      create_folder: "Vous n'avez pas la permission de créer un dossier ici",
      permissions: "Seuls les administrateurs peuvent modifier les permissions"
    }
    return messages[action] || "Vous n'avez pas la permission d'effectuer cette action"
  }
  
  /**
   * Clear permissions cache
   */
  const clearPermissionsCache = (path = null) => {
    if (path) {
      permissionsCache.value.delete(path)
    } else {
      permissionsCache.value.clear()
    }
  }

  /**
   * Get cache statistics for diagnostic purposes
   */
  const getCacheStatistics = () => {
    const now = Date.now()
    const cacheEntries = Array.from(permissionsCache.value.entries())
    
    return {
      total_entries: cacheEntries.length,
      active_entries: cacheEntries.filter(([, entry]) => 
        now - entry.timestamp < 300000 // 5 minutes
      ).length,
      expired_entries: cacheEntries.filter(([, entry]) => 
        now - entry.timestamp >= 300000
      ).length,
      oldest_entry: cacheEntries.length > 0 ? 
        Math.min(...cacheEntries.map(([, entry]) => entry.timestamp)) : null,
      newest_entry: cacheEntries.length > 0 ? 
        Math.max(...cacheEntries.map(([, entry]) => entry.timestamp)) : null
    }
  }

  /**
   * Validate cache consistency for diagnostic purposes
   */
  const validateCacheConsistency = async (path) => {
    const cached = getCachedPermissions(path)
    if (!cached) {
      return {
        consistent: true,
        reason: 'no_cache_entry'
      }
    }

    try {
      // Re-fetch permissions from backend
      const fresh = await loadPermissions(path)
      
      // Compare permissions
      const permissionTypes = ['can_read', 'can_write', 'can_delete', 'can_share', 'can_modify']
      const inconsistencies = []
      
      for (const permType of permissionTypes) {
        if (cached[permType] !== fresh[permType]) {
          inconsistencies.push({
            permission: permType,
            cached_value: cached[permType],
            fresh_value: fresh[permType]
          })
        }
      }
      
      return {
        consistent: inconsistencies.length === 0,
        inconsistencies,
        cached_permissions: cached,
        fresh_permissions: fresh,
        cache_age_ms: Date.now() - (permissionsCache.value.get(path)?.timestamp || 0)
      }
    } catch (error) {
      return {
        consistent: false,
        error: error.message,
        reason: 'validation_failed'
      }
    }
  }

  /**
   * Enhanced permission loading with diagnostic information
   */
  const loadPermissionsWithDiagnostics = async (path) => {
    const startTime = Date.now()
    const diagnosticInfo = {
      path,
      start_time: startTime,
      cache_hit: false,
      cache_age_ms: null,
      api_call_duration_ms: null,
      errors: []
    }

    try {
      // Check cache first
      const cached = getCachedPermissions(path)
      if (cached) {
        diagnosticInfo.cache_hit = true
        diagnosticInfo.cache_age_ms = Date.now() - (permissionsCache.value.get(path)?.timestamp || 0)
        diagnosticInfo.end_time = Date.now()
        diagnosticInfo.total_duration_ms = diagnosticInfo.end_time - startTime
        
        return {
          permissions: cached,
          diagnostic_info: diagnosticInfo
        }
      }

      // Load from API
      const apiStartTime = Date.now()
      const permissions = await loadPermissions(path)
      const apiEndTime = Date.now()
      
      diagnosticInfo.api_call_duration_ms = apiEndTime - apiStartTime
      diagnosticInfo.end_time = apiEndTime
      diagnosticInfo.total_duration_ms = apiEndTime - startTime
      
      return {
        permissions,
        diagnostic_info: diagnosticInfo
      }
    } catch (error) {
      diagnosticInfo.errors.push(error.message)
      diagnosticInfo.end_time = Date.now()
      diagnosticInfo.total_duration_ms = diagnosticInfo.end_time - startTime
      
      throw {
        error,
        diagnostic_info: diagnosticInfo
      }
    }
  }
  
  /**
   * Reactive computed properties for common permission checks
   */
  const createPermissionChecker = (path) => {
    return {
      canRead: computed(async () => await canPerformAction(path, 'read')),
      canWrite: computed(async () => await canPerformAction(path, 'write')),
      canDelete: computed(async () => await canPerformAction(path, 'delete')),
      canShare: computed(async () => await canPerformAction(path, 'share')),
      canRename: computed(async () => await canPerformAction(path, 'rename')),
      canMove: computed(async () => await canPerformAction(path, 'move')),
      canCopy: computed(async () => await canPerformAction(path, 'copy'))
    }
  }
  
  /**
   * Clear permissions cache with logging
   */
  const clearPermissionsCacheWithLogging = (path = null) => {
    const beforeSize = permissionsCache.value.size
    
    if (path) {
      const existed = permissionsCache.value.has(path)
      permissionsCache.value.delete(path)
      
      logPermissionOperation('cache_clear_single', {
        path,
        existed,
        cache_size_before: beforeSize,
        cache_size_after: permissionsCache.value.size
      })
    } else {
      permissionsCache.value.clear()
      
      logPermissionOperation('cache_clear_all', {
        entries_cleared: beforeSize,
        cache_size_after: 0
      })
    }
  }

  /**
   * Get detailed permission logs for debugging
   */
  const getPermissionLogs = (filter = {}) => {
    let logs = [...permissionLogs.value]
    
    // Apply filters
    if (filter.operation) {
      logs = logs.filter(log => log.operation === filter.operation)
    }
    
    if (filter.path) {
      logs = logs.filter(log => log.path === filter.path)
    }
    
    if (filter.user_id) {
      logs = logs.filter(log => log.user_id === filter.user_id)
    }
    
    if (filter.since) {
      const sinceTime = new Date(filter.since)
      logs = logs.filter(log => new Date(log.timestamp) >= sinceTime)
    }
    
    return logs
  }

  /**
   * Get performance metrics summary
   */
  const getPerformanceMetrics = () => {
    return {
      ...performanceMetrics.value,
      cache_hit_rate: performanceMetrics.value.cacheHits / 
        (performanceMetrics.value.cacheHits + performanceMetrics.value.cacheMisses) || 0,
      failure_rate: performanceMetrics.value.failures / performanceMetrics.value.totalChecks || 0,
      cache_size: permissionsCache.value.size
    }
  }

  /**
   * Detect cache inconsistencies
   */
  const detectCacheInconsistencies = async () => {
    const inconsistencies = []
    const paths = Array.from(permissionsCache.value.keys())
    
    for (const path of paths) {
      try {
        const validation = await validateCacheConsistency(path)
        if (!validation.consistent) {
          inconsistencies.push({
            path,
            ...validation
          })
          
          logPermissionOperation('cache_inconsistency_detected', {
            path,
            validation_result: validation
          })
        }
      } catch (error) {
        logPermissionOperation('cache_validation_error', {
          path,
          error: error.message
        })
      }
    }
    
    return inconsistencies
  }

  /**
   * Export logs for external analysis
   */
  const exportLogs = (format = 'json') => {
    const exportData = {
      timestamp: new Date().toISOString(),
      user_id: user.value?.id,
      username: user.value?.username,
      performance_metrics: getPerformanceMetrics(),
      cache_statistics: getCacheStatistics(),
      logs: permissionLogs.value
    }
    
    if (format === 'json') {
      return JSON.stringify(exportData, null, 2)
    } else if (format === 'csv') {
      // Simple CSV export of logs
      const headers = ['timestamp', 'operation', 'path', 'user_id', 'duration_ms', 'result']
      const rows = permissionLogs.value.map(log => [
        log.timestamp,
        log.operation,
        log.path || '',
        log.user_id || '',
        log.duration_ms || '',
        log.result !== undefined ? log.result : ''
      ])
      
      return [headers, ...rows].map(row => row.join(',')).join('\n')
    }
    
    return exportData
  }

  return {
    // State
    isAdmin: isUserAdmin,
    user,
    
    // Methods
    loadPermissions,
    canPerformAction,
    checkMultiplePermissions,
    getPermissionErrorMessage,
    clearPermissionsCache: clearPermissionsCacheWithLogging,
    createPermissionChecker,
    
    // Cache management
    getCachedPermissions,
    setCachedPermissions,
    
    // Diagnostic methods
    getCacheStatistics,
    validateCacheConsistency,
    loadPermissionsWithDiagnostics,
    
    // Enhanced logging and monitoring
    getPermissionLogs,
    getPerformanceMetrics,
    detectCacheInconsistencies,
    exportLogs,
    logPermissionOperation,
    
    // Reactive state for monitoring
    permissionLogs: computed(() => permissionLogs.value),
    performanceMetrics: computed(() => getPerformanceMetrics())
  }
}