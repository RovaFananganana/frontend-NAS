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

export default createStore({
  state: {
    // Auth
    user: getUser(),
    isAuthenticated: isAuthenticated(),
    
    // UI
    sidebarOpen: false,
    loading: false,
    
    // Notifications
    notifications: [],
    
    // Navigation
    currentFolder: null,
    breadcrumbs: [{ name: 'Racine', id: null }]
  },

  getters: {
    isAdmin: (state) => state.user?.role === 'admin',
    username: (state) => state.user?.username || '',
    userEmail: (state) => state.user?.email || '',
    userQuota: (state) => state.user?.quota_mb || 0,
    currentFolderId: (state) => state.currentFolder?.id || null
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

    // Notifications mutations
    ADD_NOTIFICATION(state, notification) {
      const id = Date.now()
      state.notifications.push({
        id,
        type: notification.type || 'info',
        title: notification.title || '',
        message: notification.message || '',
        timeout: notification.timeout || 5000
      })

      // Auto-remove notification
      setTimeout(() => {
        state.notifications = state.notifications.filter(n => n.id !== id)
      }, notification.timeout || 5000)
    },

    REMOVE_NOTIFICATION(state, id) {
      state.notifications = state.notifications.filter(n => n.id !== id)
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

    // Notification actions
    showNotification({ commit }, notification) {
      commit('ADD_NOTIFICATION', notification)
    },

    showSuccess({ commit }, message) {
      commit('ADD_NOTIFICATION', {
        type: 'success',
        title: 'Succès',
        message,
        timeout: 3000
      })
    },

    showError({ commit }, message) {
      commit('ADD_NOTIFICATION', {
        type: 'error',
        title: 'Erreur',
        message,
        timeout: 5000
      })
    },

    showWarning({ commit }, message) {
      commit('ADD_NOTIFICATION', {
        type: 'warning',
        title: 'Attention',
        message,
        timeout: 4000
      })
    },

    showInfo({ commit }, message) {
      commit('ADD_NOTIFICATION', {
        type: 'info',
        title: 'Information',
        message,
        timeout: 4000
      })
    }
  }
})
