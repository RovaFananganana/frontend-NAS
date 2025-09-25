// composables/usePermissions.js

import { computed, ref } from 'vue'
import { useStore } from 'vuex'
import { nasAPI } from '@/services/nasAPI'

/**
 * Composable for managing file and folder permissions
 * Provides reactive permission checking and caching
 */
export function usePermissions() {
  const store = useStore()
  
  // Cache for permissions to avoid repeated API calls
  const permissionsCache = ref(new Map())
  const loadingPermissions = ref(new Set())
  
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
   * Get cached permissions for a path
   */
  const getCachedPermissions = (path) => {
    const cached = permissionsCache.value.get(path)
    if (cached && Date.now() - cached.timestamp < 300000) { // 5 minutes cache
      return cached.permissions
    }
    return null
  }
  
  /**
   * Cache permissions for a path
   */
  const setCachedPermissions = (path, permissions) => {
    permissionsCache.value.set(path, {
      permissions,
      timestamp: Date.now()
    })
  }
  
  /**
   * Load permissions for a specific path from backend
   */
  const loadPermissions = async (path) => {
    if (!path || !user.value) return null
    
    // Admin always has all permissions
    if (isUserAdmin.value) {
      const adminPermissions = {
        can_read: true,
        can_write: true,
        can_delete: true,
        can_share: true,
        can_modify: true
      }
      setCachedPermissions(path, adminPermissions)
      return adminPermissions
    }
    
    // Check cache first
    const cached = getCachedPermissions(path)
    if (cached) return cached
    
    // Avoid duplicate requests
    if (loadingPermissions.value.has(path)) {
      return null
    }
    
    try {
      loadingPermissions.value.add(path)
      
      const response = await nasAPI.checkPermissions(path)
      const permissions = response.permissions || {
        can_read: false,
        can_write: false,
        can_delete: false,
        can_share: false,
        can_modify: false
      }
      
      setCachedPermissions(path, permissions)
      return permissions
      
    } catch (error) {
      console.error('Error loading permissions for', path, error)
      // Default to read-only for regular users on error
      const defaultPermissions = {
        can_read: true,
        can_write: false,
        can_delete: false,
        can_share: false,
        can_modify: false
      }
      setCachedPermissions(path, defaultPermissions)
      return defaultPermissions
    } finally {
      loadingPermissions.value.delete(path)
    }
  }
  
  /**
   * Check if user can perform a specific action on a path
   */
  const canPerformAction = async (path, action) => {
    if (!user.value) return false
    
    // Admin can do everything
    if (isUserAdmin.value) return true
    
    const permissions = await loadPermissions(path)
    if (!permissions) return false
    
    switch (action) {
      case 'read':
      case 'view':
      case 'download':
        return permissions.can_read
      case 'write':
      case 'modify':
      case 'rename':
      case 'upload':
        return permissions.can_write || permissions.can_modify
      case 'delete':
      case 'remove':
        return permissions.can_delete
      case 'share':
      case 'permissions':
        return permissions.can_share || isUserAdmin.value
      case 'copy':
        return permissions.can_read // Can copy if can read
      case 'cut':
      case 'move':
        return permissions.can_write || permissions.can_modify
      case 'create_folder':
        return permissions.can_write || permissions.can_modify
      default:
        return false
    }
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
  
  return {
    // State
    isAdmin: isUserAdmin,
    user,
    
    // Methods
    loadPermissions,
    canPerformAction,
    checkMultiplePermissions,
    getPermissionErrorMessage,
    clearPermissionsCache,
    createPermissionChecker,
    
    // Cache management
    getCachedPermissions,
    setCachedPermissions
  }
}