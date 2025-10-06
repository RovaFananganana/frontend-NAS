/**
 * Composable pour la gestion des favoris
 * Gère l'état des favoris, les appels API et la synchronisation avec le backend
 */

import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useStore } from 'vuex'
import { favoritesService } from '@/services/favoritesService.js'
import TokenService from '@/services/tokenService.js'

export function useFavorites() {
  const store = useStore()
  
  // Configuration API
  const baseURL = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5001') + '/favorites'
  
  // État local
  const favorites = ref([])
  const loading = ref(false)
  const error = ref(null)
  
  // État de synchronisation
  const lastSyncTime = ref(null)
  const syncInProgress = ref(false)
  
  // Computed
  const favoritePaths = computed(() => 
    favorites.value.map(fav => fav.item_path)
  )
  
  const favoriteCount = computed(() => favorites.value.length)
  
  const isAuthenticated = computed(() => store.getters.isAuthenticated)
  
  /**
   * Vérifie si un élément est dans les favoris
   * @param {string} path - Chemin de l'élément
   * @returns {boolean}
   */
  const isFavorite = (path) => {
    if (!path) return false
    
    // Check backend favorites first
    const isInBackend = favoritePaths.value.includes(path)
    
    // If not authenticated or backend failed, check local storage as fallback
    if (!isInBackend && (!isAuthenticated.value || error.value)) {
      return favoritesService.isFavorite(path)
    }
    
    return isInBackend
  }
  
  /**
   * Récupère un favori par son chemin
   * @param {string} path - Chemin de l'élément
   * @returns {Object|null}
   */
  const getFavorite = (path) => {
    if (!path) return null
    return favorites.value.find(fav => fav.item_path === path) || null
  }
  
  /**
   * Charge la liste des favoris depuis le backend
   * @returns {Promise<boolean>} Success status
   */
  const loadFavorites = async () => {
    if (!isAuthenticated.value) {
      favorites.value = []
      return false
    }
    
    loading.value = true
    error.value = null
    
    try {
      const token = TokenService.getToken()
      console.log('Using token for favorites API:', token ? 'Token present' : 'No token')
      
      if (!token) {
        console.warn('No authentication token available, skipping favorites loading')
        favorites.value = []
        loading.value = false
        return false
      }
      
      const response = await fetch(`${baseURL}/list`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorData.msg || errorMessage
        } catch (e) {
          // If response is not JSON, use status text
        }
        
        // Handle specific authentication errors
        if (response.status === 401) {
          errorMessage = 'Session expirée, veuillez vous reconnecter'
        } else if (response.status === 403) {
          errorMessage = 'Accès non autorisé aux favoris'
        }
        
        throw new Error(errorMessage)
      }
      
      const data = await response.json()
      favorites.value = data.favorites || []
      lastSyncTime.value = Date.now()
      
      console.log(`Loaded ${favorites.value.length} favorites`)
      return true
      
    } catch (err) {
      console.error('Error loading favorites:', err)
      error.value = err.message
      
      // Reset favorites on error
      favorites.value = []
      
      return false
    } finally {
      loading.value = false
    }
  }
  
  /**
   * Ajoute un élément aux favoris
   * @param {string} path - Chemin de l'élément
   * @param {string} name - Nom de l'élément
   * @param {string} type - Type ('file' ou 'folder')
   * @returns {Promise<boolean>} Success status
   */
  const addFavorite = async (path, name, type = 'folder') => {
    if (!isAuthenticated.value) {
      throw new Error('Utilisateur non authentifié')
    }
    
    if (!path || !name) {
      throw new Error('Chemin et nom requis')
    }
    
    // Vérifier si déjà en favoris
    if (isFavorite(path)) {
      console.info('Élément déjà dans les favoris')
      return false
    }
    
    try {
      const token = TokenService.getToken()
      console.log('Adding favorite with token:', token ? 'Token present' : 'No token')
      console.log('API URL:', `${baseURL}/add`)
      
      if (!token) {
        throw new Error('Aucun token d\'authentification disponible')
      }
      
      const response = await fetch(`${baseURL}/add`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          item_path: path,
          item_name: name,
          item_type: type
        })
      })
      
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorData.msg || errorMessage
        } catch (e) {
          // If response is not JSON, use status text
        }
        
        // Handle specific errors
        if (response.status === 401) {
          errorMessage = 'Session expirée, veuillez vous reconnecter'
        } else if (response.status === 403) {
          errorMessage = 'Accès non autorisé pour ajouter des favoris'
        } else if (response.status === 409) {
          errorMessage = 'Cet élément est déjà dans vos favoris'
        }
        
        throw new Error(errorMessage)
      }
      
      const data = await response.json()
      
      // Ajouter à la liste locale
      favorites.value.push(data.favorite)
      
      // Trier par nom pour cohérence
      favorites.value.sort((a, b) => a.item_name.localeCompare(b.item_name))
      
      console.log(`Added favorite: ${name}`)
      return true
      
    } catch (err) {
      console.error('Error adding favorite:', err)
      error.value = err.message
      throw err
    }
  }
  
  /**
   * Retire un élément des favoris
   * @param {string} path - Chemin de l'élément
   * @returns {Promise<boolean>} Success status
   */
  const removeFavorite = async (path) => {
    if (!isAuthenticated.value) {
      throw new Error('Utilisateur non authentifié')
    }
    
    if (!path) {
      throw new Error('Chemin requis')
    }
    
    // Vérifier si dans les favoris
    if (!isFavorite(path)) {
      console.info('Élément pas dans les favoris')
      return false
    }
    
    try {
      const token = TokenService.getToken()
      const response = await fetch(`${baseURL}/remove`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          item_path: path
        })
      })
      
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorData.msg || errorMessage
        } catch (e) {
          // If response is not JSON, use status text
        }
        throw new Error(errorMessage)
      }
      
      // Retirer de la liste locale
      const favoriteToRemove = getFavorite(path)
      favorites.value = favorites.value.filter(fav => fav.item_path !== path)
      
      console.log(`Removed favorite: ${favoriteToRemove?.item_name || path}`)
      return true
      
    } catch (err) {
      console.error('Error removing favorite:', err)
      error.value = err.message
      throw err
    }
  }
  
  /**
   * Bascule l'état favori d'un élément
   * @param {string} path - Chemin de l'élément
   * @param {string} name - Nom de l'élément
   * @param {string} type - Type ('file' ou 'folder')
   * @returns {Promise<boolean>} New favorite status
   */
  const toggleFavorite = async (path, name, type = 'folder') => {
    try {
      if (isFavorite(path)) {
        await removeFavorite(path)
        return false
      } else {
        await addFavorite(path, name, type)
        return true
      }
    } catch (err) {
      // Fallback to local storage if backend fails
      console.warn('Backend favorites failed, using local storage fallback:', err.message)
      
      if (favoritesService.isFavorite(path)) {
        const success = favoritesService.removeFavorite(path)
        if (success) {
          // Update local state to match
          favorites.value = favorites.value.filter(fav => fav.item_path !== path)
          return false
        }
      } else {
        const success = favoritesService.addFavorite(path, name)
        if (success) {
          // Update local state to match
          const newFavorite = {
            item_path: path,
            item_name: name,
            item_type: type,
            created_at: new Date().toISOString()
          }
          favorites.value.push(newFavorite)
          favorites.value.sort((a, b) => a.item_name.localeCompare(b.item_name))
          return true
        }
      }
      
      // If both backend and local storage fail, re-throw the error
      throw err
    }
  }
  
  /**
   * Synchronise les favoris avec le backend
   * @param {boolean} force - Forcer la synchronisation même si récente
   * @returns {Promise<boolean>} Success status
   */
  const syncFavorites = async (force = false) => {
    if (syncInProgress.value) return false
    
    // Éviter les synchronisations trop fréquentes (sauf si forcé)
    if (!force && lastSyncTime.value && (Date.now() - lastSyncTime.value) < 30000) {
      return true
    }
    
    syncInProgress.value = true
    
    try {
      const success = await loadFavorites()
      
      // If backend sync successful, try to sync local favorites to backend
      if (success && isAuthenticated.value) {
        await syncLocalFavoritesToBackend()
      }
      
      return success
    } finally {
      syncInProgress.value = false
    }
  }
  
  /**
   * Synchronise les favoris locaux vers le backend
   * @private
   */
  const syncLocalFavoritesToBackend = async () => {
    try {
      const localFavorites = favoritesService.getFavorites()
      
      for (const localFav of localFavorites) {
        // Check if this favorite exists in backend
        const existsInBackend = favorites.value.some(backendFav => 
          backendFav.item_path === localFav.path
        )
        
        if (!existsInBackend) {
          try {
            await addFavorite(localFav.path, localFav.name, 'folder')
            console.log(`Synced local favorite to backend: ${localFav.name}`)
          } catch (err) {
            console.warn(`Failed to sync local favorite: ${localFav.name}`, err)
          }
        }
      }
    } catch (err) {
      console.warn('Failed to sync local favorites to backend:', err)
    }
  }
  
  /**
   * Nettoie les favoris (retire ceux qui n'existent plus)
   * @returns {Promise<number>} Nombre de favoris nettoyés
   */
  const cleanupFavorites = async () => {
    if (!isAuthenticated.value) return 0
    
    const initialCount = favorites.value.length
    await loadFavorites() // Le backend fait déjà le nettoyage
    const finalCount = favorites.value.length
    
    return Math.max(0, initialCount - finalCount)
  }
  
  /**
   * Recherche dans les favoris
   * @param {string} query - Terme de recherche
   * @returns {Array} Favoris correspondants
   */
  const searchFavorites = (query) => {
    if (!query || typeof query !== 'string') {
      return favorites.value
    }
    
    const searchTerm = query.toLowerCase().trim()
    return favorites.value.filter(fav => 
      fav.item_name.toLowerCase().includes(searchTerm) ||
      fav.item_path.toLowerCase().includes(searchTerm)
    )
  }
  
  /**
   * Exporte les favoris au format JSON
   * @returns {string} JSON des favoris
   */
  const exportFavorites = () => {
    return JSON.stringify(favorites.value, null, 2)
  }
  
  /**
   * Statistiques des favoris
   * @returns {Object} Statistiques
   */
  const getFavoritesStats = () => {
    const stats = {
      total: favorites.value.length,
      folders: 0,
      files: 0,
      lastSync: lastSyncTime.value
    }
    
    favorites.value.forEach(fav => {
      if (fav.item_type === 'folder') {
        stats.folders++
      } else {
        stats.files++
      }
    })
    
    return stats
  }
  
  // Gestion des événements de synchronisation automatique
  let syncInterval = null
  
  const startAutoSync = (intervalMs = 300000) => { // 5 minutes par défaut
    if (syncInterval) {
      clearInterval(syncInterval)
    }
    
    syncInterval = setInterval(() => {
      if (isAuthenticated.value) {
        syncFavorites(false)
      }
    }, intervalMs)
  }
  
  const stopAutoSync = () => {
    if (syncInterval) {
      clearInterval(syncInterval)
      syncInterval = null
    }
  }
  
  // Lifecycle
  onMounted(() => {
    if (isAuthenticated.value) {
      loadFavorites()
      startAutoSync()
    }
  })
  
  onUnmounted(() => {
    stopAutoSync()
  })
  
  // Écouter les changements d'authentification
  const unwatchAuth = store.watch(
    (state) => state.isAuthenticated,
    (newValue) => {
      if (newValue) {
        loadFavorites()
        startAutoSync()
      } else {
        favorites.value = []
        stopAutoSync()
      }
    }
  )
  
  onUnmounted(() => {
    unwatchAuth()
  })
  
  return {
    // État
    favorites,
    loading,
    error,
    syncInProgress,
    lastSyncTime,
    
    // Computed
    favoritePaths,
    favoriteCount,
    
    // Méthodes principales
    isFavorite,
    getFavorite,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    
    // Gestion des données
    loadFavorites,
    syncFavorites,
    cleanupFavorites,
    
    // Utilitaires
    searchFavorites,
    exportFavorites,
    getFavoritesStats,
    
    // Synchronisation automatique
    startAutoSync,
    stopAutoSync
  }
}

export default useFavorites