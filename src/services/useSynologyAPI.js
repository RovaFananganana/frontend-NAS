// services/useSynologyAPI.js
import { ref } from 'vue'
import axios from 'axios'

// Utilitaires pour gérer les chemins NAS
export const NasPathUtils = {
  join: (base, sub) => {
    if (base.endsWith('/')) base = base.slice(0, -1)
    if (!sub.startsWith('/')) sub = '/' + sub
    return base + sub
  },
  
  dirname: (path) => {
    if (path === '/') return '/'
    const parts = path.split('/').filter(Boolean)
    if (parts.length <= 1) return '/'
    return '/' + parts.slice(0, -1).join('/')
  },
  
  basename: (path) => {
    if (path === '/') return ''
    return path.split('/').pop() || ''
  },
  
  normalize: (path) => {
    if (!path || path === '/') return '/'
    // Supprimer les doubles slashes et s'assurer que ça commence par /
    let normalized = path.replace(/\/+/g, '/').replace(/\/$/, '')
    if (!normalized.startsWith('/')) {
      normalized = '/' + normalized
    }
    return normalized || '/'
  }
}

// Hook principal pour l'API Synology
export function useSynologyAPI() {
  const loading = ref(false)
  const error = ref(null)

  // Configuration de base - doit pointer vers le backend Flask
  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5001'

  const api = axios.create({
    baseURL: `${API_BASE}/nas`, // Utiliser /nas au lieu de /synology
    timeout: 60000, // Augmenté pour les gros fichiers
    headers: { 'Content-Type': 'application/json' }
  })

  // Intercepteur pour ajouter le token JWT
  api.interceptors.request.use(
    config => {
      const token = localStorage.getItem('token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    },
    error => Promise.reject(error)
  )

  // Intercepteur pour gérer les erreurs
  api.interceptors.response.use(
    response => response,
    error => {
      console.error('NAS API Error:', error)
      
      // Gestion spécifique des erreurs d'authentification
      if (error.response?.status === 401) {
        // Token expiré ou invalide
        localStorage.removeItem('token')
        window.location.href = '/login'
      }
      
      return Promise.reject(error)
    }
  )

  // Navigation dans les répertoires
  const listDirectory = async (path = '/') => {
    loading.value = true
    error.value = null
    
    try {
      const normalizedPath = NasPathUtils.normalize(path)
      const response = await api.get('/browse', { 
        params: { path: normalizedPath } 
      })
      
      return {
        success: true,
        path: response.data.path,
        parent_path: response.data.parent_path,
        items: response.data.items || [],
        total: response.data.total || 0
      }
    } catch (err) {
      const message = err.response?.data?.error || err.message || 'Erreur lors du chargement du répertoire'
      error.value = message
      throw new Error(message)
    } finally {
      loading.value = false
    }
  }

  // Création de dossier
  const createFolder = async (parentPath, name) => {
    loading.value = true
    error.value = null
    
    try {
      const normalizedPath = NasPathUtils.normalize(parentPath)
      const response = await api.post('/create-folder', { 
        parent_path: normalizedPath, 
        name: name.trim() 
      })
      
      return {
        success: response.data.success || true,
        path: response.data.path,
        name: response.data.name || name,
        message: response.data.message || 'Dossier créé avec succès'
      }
    } catch (err) {
      const message = err.response?.data?.error || err.message || 'Erreur lors de la création du dossier'
      error.value = message
      throw new Error(message)
    } finally {
      loading.value = false
    }
  }

  // Suppression de fichier/dossier
  const deleteFile = async (path) => {
    loading.value = true
    error.value = null
    
    try {
      const normalizedPath = NasPathUtils.normalize(path)
      const response = await api.delete('/delete', { 
        data: { path: normalizedPath } 
      })
      
      return {
        success: response.data.success || true,
        message: response.data.message || 'Suppression réussie'
      }
    } catch (err) {
      const message = err.response?.data?.error || err.message || 'Erreur lors de la suppression'
      error.value = message
      throw new Error(message)
    } finally {
      loading.value = false
    }
  }

  // Renommage
  const renameFile = async (oldPath, newName) => {
    loading.value = true
    error.value = null
    
    try {
      const normalizedPath = NasPathUtils.normalize(oldPath)
      const response = await api.put('/rename', { 
        old_path: normalizedPath, 
        new_name: newName.trim() 
      })
      
      return {
        success: response.data.success || true,
        old_path: response.data.old_path || oldPath,
        new_path: response.data.new_path,
        message: response.data.message || 'Renommage réussi'
      }
    } catch (err) {
      const message = err.response?.data?.error || err.message || 'Erreur lors du renommage'
      error.value = message
      throw new Error(message)
    } finally {
      loading.value = false
    }
  }

  // Déplacement
  const moveFile = async (sourcePath, destFolderPath) => {
    loading.value = true
    error.value = null
    
    try {
      const normalizedSource = NasPathUtils.normalize(sourcePath)
      const normalizedDest = NasPathUtils.normalize(destFolderPath)
      
      const response = await api.put('/move', { 
        source_path: normalizedSource, 
        dest_folder_path: normalizedDest 
      })
      
      return {
        success: response.data.success || true,
        source_path: response.data.source_path || sourcePath,
        new_path: response.data.new_path,
        message: response.data.message || 'Déplacement réussi'
      }
    } catch (err) {
      const message = err.response?.data?.error || err.message || 'Erreur lors du déplacement'
      error.value = message
      throw new Error(message)
    } finally {
      loading.value = false
    }
  }

  // Upload de fichier avec progression
  const uploadFile = async (file, destPath, onProgress = null) => {
    loading.value = true
    error.value = null
    
    try {
      const normalizedPath = NasPathUtils.normalize(destPath)
      const formData = new FormData()
      formData.append('file', file)
      formData.append('path', normalizedPath)
      formData.append('overwrite', 'false') // Par défaut, ne pas écraser

      const response = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            onProgress(percentCompleted)
          }
        },
        timeout: 300000 // 5 minutes pour les gros fichiers
      })
      
      return {
        success: response.data.success || true,
        path: response.data.path,
        name: response.data.name || file.name,
        message: response.data.message || 'Fichier uploadé avec succès'
      }
    } catch (err) {
      const message = err.response?.data?.error || err.message || 'Erreur lors de l\'upload'
      error.value = message
      throw new Error(message)
    } finally {
      loading.value = false
    }
  }

  // URL de téléchargement
  const getDownloadUrl = (filePath) => {
    const token = localStorage.getItem('token')
    const normalizedPath = NasPathUtils.normalize(filePath)
    const encodedPath = encodeURIComponent(normalizedPath)
    
    // Construire l'URL avec le token en paramètre
    return `${API_BASE}/nas/download/${encodedPath}?token=${token}`
  }

  // Téléchargement de fichier (alternative avec blob)
  const downloadFile = async (filePath) => {
    loading.value = true
    error.value = null
    
    try {
      const normalizedPath = NasPathUtils.normalize(filePath)
      const encodedPath = encodeURIComponent(normalizedPath)
      
      const response = await api.get(`/download/${encodedPath}`, {
        responseType: 'blob'
      })
      
      // Créer un blob URL pour le téléchargement
      const blob = new Blob([response.data])
      const url = window.URL.createObjectURL(blob)
      const filename = NasPathUtils.basename(filePath) || 'download'
      
      return {
        success: true,
        url: url,
        filename: filename,
        blob: blob
      }
    } catch (err) {
      const message = err.response?.data?.error || err.message || 'Erreur lors du téléchargement'
      error.value = message
      throw new Error(message)
    } finally {
      loading.value = false
    }
  }

  // Informations sur un fichier
  const getFileInfo = async (filePath) => {
    loading.value = true
    error.value = null
    
    try {
      const normalizedPath = NasPathUtils.normalize(filePath)
      const encodedPath = encodeURIComponent(normalizedPath)
      const response = await api.get(`/info/${encodedPath}`)
      
      return {
        success: response.data.success || true,
        file_info: response.data.file_info || response.data
      }
    } catch (err) {
      const message = err.response?.data?.error || err.message || 'Erreur lors de la récupération des informations'
      error.value = message
      throw new Error(message)
    } finally {
      loading.value = false
    }
  }

  // Test de connexion NAS
  const testConnection = async () => {
    loading.value = true
    error.value = null
    
    try {
      const response = await api.get('/test-connection')
      
      return {
        success: response.data.success || true,
        message: response.data.message || 'Connexion NAS OK',
        server_info: response.data.server_info || {}
      }
    } catch (err) {
      const message = err.response?.data?.error || err.message || 'Erreur de connexion NAS'
      error.value = message
      throw new Error(message)
    } finally {
      loading.value = false
    }
  }

  // Synchronisation complète
  const fullSync = async () => {
    loading.value = true
    error.value = null
    
    try {
      const response = await api.post('/sync/full', {}, {
        timeout: 300000 // 5 minutes pour la sync complète
      })
      
      return {
        success: response.data.success || true,
        message: response.data.message || 'Synchronisation terminée',
        stats: response.data.stats || {}
      }
    } catch (err) {
      const message = err.response?.data?.error || err.message || 'Erreur de synchronisation'
      error.value = message
      throw new Error(message)
    } finally {
      loading.value = false
    }
  }

  // Synchronisation d'un chemin spécifique
  const syncPath = async (path = '/') => {
    loading.value = true
    error.value = null
    
    try {
      const normalizedPath = NasPathUtils.normalize(path)
      const response = await api.post('/sync/path', { 
        path: normalizedPath 
      })
      
      return {
        success: response.data.success || true,
        message: response.data.message || 'Synchronisation du chemin terminée',
        stats: response.data.stats || {}
      }
    } catch (err) {
      const message = err.response?.data?.error || err.message || 'Erreur de synchronisation du chemin'
      error.value = message
      throw new Error(message)
    } finally {
      loading.value = false
    }
  }

  // Recherche de fichiers (si supportée par le backend)
  const searchFiles = async (query, path = '/', options = {}) => {
    loading.value = true
    error.value = null
    
    try {
      const normalizedPath = NasPathUtils.normalize(path)
      const response = await api.get('/search', {
        params: {
          q: query,
          path: normalizedPath,
          ...options
        }
      })
      
      return {
        success: true,
        results: response.data.results || [],
        total: response.data.total || 0,
        query: query
      }
    } catch (err) {
      const message = err.response?.data?.error || err.message || 'Erreur lors de la recherche'
      error.value = message
      throw new Error(message)
    } finally {
      loading.value = false
    }
  }

  // Fonction utilitaire pour vérifier si un chemin est valide
  const isValidPath = (path) => {
    if (!path || typeof path !== 'string') return false
    
    // Vérifier les caractères interdits
    const invalidChars = /[<>:"|?*]/
    if (invalidChars.test(path)) return false
    
    // Vérifier les séquences dangereuses
    if (path.includes('../') || path.includes('..\\')) return false
    
    return true
  }

  // Fonction utilitaire pour formater les tailles de fichiers
  const formatBytes = (bytes, decimals = 2) => {
    if (!bytes || bytes === 0) return '0 B'
    
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i]
  }

  // Retourner toutes les fonctions et états
  return {
    // États réactifs
    loading,
    error,
    
    // Fonctions principales
    listDirectory,
    createFolder,
    deleteFile,
    renameFile,
    moveFile,
    uploadFile,
    downloadFile,
    getDownloadUrl,
    getFileInfo,
    testConnection,
    fullSync,
    syncPath,
    searchFiles,
    
    // Utilitaires
    isValidPath,
    formatBytes
  }
}