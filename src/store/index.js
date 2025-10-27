// store/index.js
import { createStore } from 'vuex'
import { 
  getUser, 
  isAuthenticated, 
  getCurrentUser, 
  logout as authLogout, 
  login as authLogin, 
  setUser, 
  setToken 
} from '../services/auth'
import TokenService from '../services/tokenService'
// Performance monitoring removed for now

export default createStore({
  state: {
    // Auth
    user: getUser(),
    isAuthenticated: isAuthenticated(),
    
    // UI
    sidebarOpen: false,
    loading: false,
    

    
    // Navigation
    currentFolder: null,
    breadcrumbs: [{ name: 'Racine', id: null }],
    
    // Performance & Caching
    cache: {
      permissions: new Map(),
      files: new Map(),
      folders: new Map()
    },
    
    // App Performance
    performance: {
      apiCalls: [],
      slowOperations: [],
      lastUpdate: null
    },
    
    // User Preferences
    preferences: {
      theme: localStorage.getItem('theme') || 'light',
      language: localStorage.getItem('language') || 'fr',
      fileView: localStorage.getItem('fileView') || 'grid',
      itemsPerPage: parseInt(localStorage.getItem('itemsPerPage')) || 50
    },
    
    // View Mode State (managed by useViewMode composable)
    viewMode: {
      initialized: false
    }
  },

  getters: {
    isAuthenticated: (state) => state.isAuthenticated,
    authToken: () => TokenService.getToken(),
    isAdmin: (state) => state.user?.role === 'ADMIN',
    username: (state) => state.user?.username || '',
    userEmail: (state) => state.user?.email || '',
    userQuota: (state) => state.user?.quota_mb || 0,
    currentFolderId: (state) => state.currentFolder?.id || null,
    
    // Performance getters
    recentApiCalls: (state) => state.performance.apiCalls.slice(-10),
    slowOperationsCount: (state) => state.performance.slowOperations.length,
    
    // Cache getters
    getCachedPermissions: (state) => (resourceId) => state.cache.permissions.get(resourceId),
    getCachedFile: (state) => (fileId) => state.cache.files.get(fileId),
    getCachedFolder: (state) => (folderId) => state.cache.folders.get(folderId),
    
    // Preferences getters
    currentTheme: (state) => state.preferences.theme,
    currentLanguage: (state) => state.preferences.language,
    preferredFileView: (state) => state.preferences.fileView,
    preferredItemsPerPage: (state) => state.preferences.itemsPerPage,
    
    // View Mode getters
    isViewModeInitialized: (state) => state.viewMode.initialized
  },

  mutations: {
    // Auth mutations
    SET_USER(state, user) {
      state.user = user
      state.isAuthenticated = !!user
    },

    LOGOUT(state) {
      state.user = null
      state.isAuthenticated = false
      state.currentFolder = null
      state.breadcrumbs = [{ name: 'Racine', id: null }]
    },

    // UI mutations
    SET_LOADING(state, loading) {
      state.loading = loading
    },

    TOGGLE_SIDEBAR(state) {
      state.sidebarOpen = !state.sidebarOpen
    },

    SET_SIDEBAR(state, open) {
      state.sidebarOpen = open
    },

    // Navigation mutations
    SET_CURRENT_FOLDER(state, folder) {
      state.currentFolder = folder
    },

    SET_BREADCRUMBS(state, breadcrumbs) {
      state.breadcrumbs = breadcrumbs
    },



    // Performance mutations
    ADD_API_CALL(state, apiCall) {
      state.performance.apiCalls.push({
        ...apiCall,
        timestamp: Date.now()
      })
      
      // Keep only last 100 API calls
      if (state.performance.apiCalls.length > 100) {
        state.performance.apiCalls = state.performance.apiCalls.slice(-100)
      }
      
      // Track slow operations
      if (apiCall.duration > 200) {
        state.performance.slowOperations.push(apiCall)
        
        // Keep only last 50 slow operations
        if (state.performance.slowOperations.length > 50) {
          state.performance.slowOperations = state.performance.slowOperations.slice(-50)
        }
      }
      
      state.performance.lastUpdate = Date.now()
    },

    CLEAR_PERFORMANCE_DATA(state) {
      state.performance.apiCalls = []
      state.performance.slowOperations = []
      state.performance.lastUpdate = Date.now()
    },

    // Cache mutations
    SET_CACHED_PERMISSIONS(state, { resourceId, permissions }) {
      state.cache.permissions.set(resourceId, {
        data: permissions,
        timestamp: Date.now(),
        ttl: 5 * 60 * 1000 // 5 minutes
      })
    },

    SET_CACHED_FILE(state, { fileId, file }) {
      state.cache.files.set(fileId, {
        data: file,
        timestamp: Date.now(),
        ttl: 10 * 60 * 1000 // 10 minutes
      })
    },

    SET_CACHED_FOLDER(state, { folderId, folder }) {
      state.cache.folders.set(folderId, {
        data: folder,
        timestamp: Date.now(),
        ttl: 10 * 60 * 1000 // 10 minutes
      })
    },

    CLEAR_CACHE(state, cacheType = 'all') {
      if (cacheType === 'all' || cacheType === 'permissions') {
        state.cache.permissions.clear()
      }
      if (cacheType === 'all' || cacheType === 'files') {
        state.cache.files.clear()
      }
      if (cacheType === 'all' || cacheType === 'folders') {
        state.cache.folders.clear()
      }
    },

    CLEANUP_EXPIRED_CACHE(state) {
      const now = Date.now()
      
      // Clean permissions cache
      for (const [key, value] of state.cache.permissions.entries()) {
        if (now - value.timestamp > value.ttl) {
          state.cache.permissions.delete(key)
        }
      }
      
      // Clean files cache
      for (const [key, value] of state.cache.files.entries()) {
        if (now - value.timestamp > value.ttl) {
          state.cache.files.delete(key)
        }
      }
      
      // Clean folders cache
      for (const [key, value] of state.cache.folders.entries()) {
        if (now - value.timestamp > value.ttl) {
          state.cache.folders.delete(key)
        }
      }
    },

    // Preferences mutations
    SET_PREFERENCE(state, { key, value }) {
      state.preferences[key] = value
      localStorage.setItem(key, value.toString())
    },

    SET_THEME(state, theme) {
      state.preferences.theme = theme
      localStorage.setItem('theme', theme)
      document.documentElement.setAttribute('data-theme', theme)
    },

    SET_LANGUAGE(state, language) {
      state.preferences.language = language
      localStorage.setItem('language', language)
    },

    // View Mode mutations
    SET_VIEW_MODE_INITIALIZED(state, initialized) {
      state.viewMode.initialized = initialized
    }
  },

  actions: {
    // 🔑 Connexion (via axios dans auth.js)
    async login({ commit }, { username, password, rememberMe }) {
      commit('SET_LOADING', true)
      try {
        const user = await authLogin(username, password, rememberMe)
        commit('SET_USER', user)
        return user
      } catch (error) {
        commit('LOGOUT')
        throw error
      } finally {
        commit('SET_LOADING', false)
      }
    },

    // Récupération utilisateur (si token déjà en mémoire)
    async fetchCurrentUser({ commit }) {
      commit('SET_LOADING', true)
      try {
        const user = await getCurrentUser()
        commit('SET_USER', user)
        return user
      } catch (error) {
        commit('LOGOUT')
        throw error
      } finally {
        commit('SET_LOADING', false)
      }
    },

    // Déconnexion
    logout({ commit }) {
      authLogout()
      commit('LOGOUT')
    },

    // Navigation actions
    navigateToFolder({ commit }, folder) {
      commit('SET_CURRENT_FOLDER', folder)
      
      let breadcrumbs = [{ name: 'Racine', id: null }]
      if (folder) {
        breadcrumbs.push({ name: folder.name, id: folder.id })
      }
      commit('SET_BREADCRUMBS', breadcrumbs)
    },

    navigateToRoot({ dispatch }) {
      dispatch('navigateToFolder', null)
    },



    // Performance actions
    trackApiCall({ commit }, apiCall) {
      commit('ADD_API_CALL', apiCall)
      
      // Performance monitoring removed for now
      console.debug('API call tracked:', apiCall.operation, apiCall.duration + 'ms')
    },

    clearPerformanceData({ commit }) {
      commit('CLEAR_PERFORMANCE_DATA')
    },

    // Cache actions
    getCachedData({ state, commit }, { type, id }) {
      const cache = state.cache[type]
      const cached = cache.get(id)
      
      if (cached) {
        const now = Date.now()
        if (now - cached.timestamp < cached.ttl) {
          return cached.data
        } else {
          // Remove expired cache
          cache.delete(id)
        }
      }
      
      return null
    },

    setCachedData({ commit }, { type, id, data }) {
      const mutation = {
        permissions: 'SET_CACHED_PERMISSIONS',
        files: 'SET_CACHED_FILE',
        folders: 'SET_CACHED_FOLDER'
      }[type]
      
      if (mutation) {
        const payload = {}
        payload[`${type.slice(0, -1)}Id`] = id
        payload[type.slice(0, -1)] = data
        commit(mutation, payload)
      }
    },

    clearCache({ commit }, cacheType) {
      commit('CLEAR_CACHE', cacheType)
    },

    cleanupExpiredCache({ commit }) {
      commit('CLEANUP_EXPIRED_CACHE')
    },

    // Preferences actions
    updatePreference({ commit }, { key, value }) {
      commit('SET_PREFERENCE', { key, value })
    },

    setTheme({ commit }, theme) {
      commit('SET_THEME', theme)
    },

    setLanguage({ commit }, language) {
      commit('SET_LANGUAGE', language)
    },

    // View Mode actions
    initializeViewMode({ commit }) {
      commit('SET_VIEW_MODE_INITIALIZED', true)
      console.log('View mode system initialized')
    },

    // Notification actions (simple console-based for now)
    showError({ commit }, message) {
      console.error('❌ Error:', message)
      // Could be enhanced with toast notifications later
    },

    showSuccess({ commit }, message) {
      console.log('✅ Success:', message)
      // Could be enhanced with toast notifications later
    },

    showWarning({ commit }, message) {
      console.warn('⚠️ Warning:', message)
      // Could be enhanced with toast notifications later
    },

    showInfo({ commit }, message) {
      console.info('ℹ️ Info:', message)
      // Could be enhanced with toast notifications later
    },

    // Initialize app
    async initializeApp({ commit, dispatch }) {
      // Clean up legacy tokens
      TokenService.cleanupLegacyTokens()
      
      // Set initial theme
      const theme = localStorage.getItem('theme') || 'light'
      document.documentElement.setAttribute('data-theme', theme)
      
      // Start cache cleanup interval
      setInterval(() => {
        dispatch('cleanupExpiredCache')
      }, 5 * 60 * 1000) // Every 5 minutes
      
      // Performance tracking removed for now
      console.log('App initialized successfully')
    },

    // Storage info action
    async fetchStorageInfo({ commit }) {
      try {
        const { userAPI } = await import('../services/api')
        const response = await userAPI.getStorageInfo()
        const data = response.data
        
        const used = data.used_mb || 0
        const total = data.quota_mb || 0
        const usage = `${used}/${total} MB`
        
        return usage
      } catch (error) {
        console.error('Error fetching storage info:', error)
        return '0/0 MB'
      }
    }
  }
})
