/**
 * Service de gestion des dossiers favoris
 * Permet d'ajouter, supprimer et gérer les dossiers favoris de l'utilisateur
 */

// Import de l'API pour le logging d'activité
import { userAPI } from './api.js'

class FavoritesService {
  constructor() {
    this.storageKey = 'file-favorites'
    this.maxFavorites = 50 // Limite pour éviter les problèmes de performance
  }

  /**
   * Enregistre une activité de favori dans les logs utilisateur
   * @param {string} action - Action effectuée ('favorite_add' ou 'favorite_remove')
   * @param {string} path - Chemin du dossier
   * @param {string} name - Nom du dossier
   */
  async _logFavoriteActivity(action, path, name) {
    try {
      // Utiliser l'API backend pour enregistrer l'activité
      // Note: Cette API devra être implémentée côté backend
      await fetch('/api/users/log-activity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          action: action,
          target: `${name} (${path})`,
          details: action === 'favorite_add' ? 'Ajout aux favoris' : 'Suppression des favoris'
        })
      })
    } catch (error) {
      // Ne pas faire échouer l'opération principale si le logging échoue
      console.warn('Erreur lors de l\'enregistrement de l\'activité favori:', error)
    }
  }

  /**
   * Récupère la liste des favoris depuis le localStorage
   * @returns {Array} Liste des favoris
   */
  getFavorites() {
    try {
      const stored = localStorage.getItem(this.storageKey)
      const favorites = stored ? JSON.parse(stored) : []
      
      // Valider et nettoyer les données si nécessaire
      return favorites.filter(fav => 
        fav && 
        typeof fav.path === 'string' && 
        typeof fav.name === 'string' &&
        fav.path.trim() !== '' &&
        fav.name.trim() !== ''
      )
    } catch (error) {
      console.error('Erreur lors de la récupération des favoris:', error)
      return []
    }
  }

  /**
   * Ajoute un dossier aux favoris
   * @param {string} path - Chemin du dossier
   * @param {string} name - Nom d'affichage du dossier
   * @returns {boolean} True si ajouté avec succès
   */
  addFavorite(path, name) {
    try {
      if (!path || !name || typeof path !== 'string' || typeof name !== 'string') {
        console.warn('Paramètres invalides pour ajouter un favori')
        return false
      }

      const favorites = this.getFavorites()
      
      // Vérifier si le favori existe déjà
      if (favorites.find(fav => fav.path === path)) {
        console.info('Ce dossier est déjà dans les favoris')
        return false
      }

      // Vérifier la limite
      if (favorites.length >= this.maxFavorites) {
        console.warn(`Limite de ${this.maxFavorites} favoris atteinte`)
        return false
      }

      // Ajouter le nouveau favori
      const newFavorite = {
        path: path.trim(),
        name: name.trim(),
        addedAt: Date.now()
      }

      favorites.push(newFavorite)
      
      // Trier par nom pour un affichage cohérent
      favorites.sort((a, b) => a.name.localeCompare(b.name))
      
      localStorage.setItem(this.storageKey, JSON.stringify(favorites))
      
      // Émettre un événement pour notifier les composants
      this._emitFavoritesChanged('added', newFavorite)
      
      // Enregistrer l'activité dans les logs
      this._logFavoriteActivity('favorite_add', path, name)
      
      return true
    } catch (error) {
      console.error('Erreur lors de l\'ajout du favori:', error)
      return false
    }
  }

  /**
   * Supprime un favori par son chemin
   * @param {string} path - Chemin du dossier à supprimer
   * @returns {boolean} True si supprimé avec succès
   */
  removeFavorite(path) {
    try {
      if (!path || typeof path !== 'string') {
        console.warn('Chemin invalide pour supprimer un favori')
        return false
      }

      const favorites = this.getFavorites()
      const initialLength = favorites.length
      const filteredFavorites = favorites.filter(fav => fav.path !== path)
      
      if (filteredFavorites.length === initialLength) {
        console.info('Favori non trouvé pour suppression')
        return false
      }

      localStorage.setItem(this.storageKey, JSON.stringify(filteredFavorites))
      
      // Émettre un événement pour notifier les composants
      this._emitFavoritesChanged('removed', { path })
      
      // Enregistrer l'activité dans les logs (récupérer le nom du favori supprimé)
      const removedFavorite = favorites.find(fav => fav.path === path)
      if (removedFavorite) {
        this._logFavoriteActivity('favorite_remove', path, removedFavorite.name)
      }
      
      return true
    } catch (error) {
      console.error('Erreur lors de la suppression du favori:', error)
      return false
    }
  }

  /**
   * Vérifie si un dossier est dans les favoris
   * @param {string} path - Chemin du dossier
   * @returns {boolean} True si le dossier est favori
   */
  isFavorite(path) {
    if (!path || typeof path !== 'string') {
      return false
    }
    
    const favorites = this.getFavorites()
    return favorites.some(fav => fav.path === path)
  }

  /**
   * Récupère un favori par son chemin
   * @param {string} path - Chemin du dossier
   * @returns {Object|null} Objet favori ou null si non trouvé
   */
  getFavorite(path) {
    if (!path || typeof path !== 'string') {
      return null
    }
    
    const favorites = this.getFavorites()
    return favorites.find(fav => fav.path === path) || null
  }

  /**
   * Met à jour le nom d'un favori
   * @param {string} path - Chemin du dossier
   * @param {string} newName - Nouveau nom
   * @returns {boolean} True si mis à jour avec succès
   */
  updateFavoriteName(path, newName) {
    try {
      if (!path || !newName || typeof path !== 'string' || typeof newName !== 'string') {
        console.warn('Paramètres invalides pour mettre à jour un favori')
        return false
      }

      const favorites = this.getFavorites()
      const favoriteIndex = favorites.findIndex(fav => fav.path === path)
      
      if (favoriteIndex === -1) {
        console.info('Favori non trouvé pour mise à jour')
        return false
      }

      favorites[favoriteIndex].name = newName.trim()
      favorites[favoriteIndex].updatedAt = Date.now()
      
      // Retrier après la mise à jour du nom
      favorites.sort((a, b) => a.name.localeCompare(b.name))
      
      localStorage.setItem(this.storageKey, JSON.stringify(favorites))
      
      // Émettre un événement pour notifier les composants
      this._emitFavoritesChanged('updated', favorites[favoriteIndex])
      
      return true
    } catch (error) {
      console.error('Erreur lors de la mise à jour du favori:', error)
      return false
    }
  }

  /**
   * Supprime tous les favoris
   * @returns {boolean} True si supprimés avec succès
   */
  clearAllFavorites() {
    try {
      localStorage.removeItem(this.storageKey)
      
      // Émettre un événement pour notifier les composants
      this._emitFavoritesChanged('cleared', null)
      
      return true
    } catch (error) {
      console.error('Erreur lors de la suppression de tous les favoris:', error)
      return false
    }
  }

  /**
   * Exporte les favoris au format JSON
   * @returns {string} JSON des favoris
   */
  exportFavorites() {
    try {
      const favorites = this.getFavorites()
      return JSON.stringify(favorites, null, 2)
    } catch (error) {
      console.error('Erreur lors de l\'export des favoris:', error)
      return '[]'
    }
  }

  /**
   * Importe des favoris depuis un JSON
   * @param {string} jsonData - Données JSON des favoris
   * @param {boolean} merge - Si true, fusionne avec les favoris existants
   * @returns {boolean} True si importés avec succès
   */
  importFavorites(jsonData, merge = false) {
    try {
      const importedFavorites = JSON.parse(jsonData)
      
      if (!Array.isArray(importedFavorites)) {
        console.warn('Format d\'import invalide')
        return false
      }

      // Valider les favoris importés
      const validFavorites = importedFavorites.filter(fav => 
        fav && 
        typeof fav.path === 'string' && 
        typeof fav.name === 'string' &&
        fav.path.trim() !== '' &&
        fav.name.trim() !== ''
      )

      let finalFavorites = validFavorites

      if (merge) {
        const existingFavorites = this.getFavorites()
        const existingPaths = new Set(existingFavorites.map(fav => fav.path))
        
        // Ajouter seulement les nouveaux favoris
        const newFavorites = validFavorites.filter(fav => !existingPaths.has(fav.path))
        finalFavorites = [...existingFavorites, ...newFavorites]
      }

      // Respecter la limite
      if (finalFavorites.length > this.maxFavorites) {
        finalFavorites = finalFavorites.slice(0, this.maxFavorites)
        console.warn(`Import limité à ${this.maxFavorites} favoris`)
      }

      // Trier par nom
      finalFavorites.sort((a, b) => a.name.localeCompare(b.name))
      
      localStorage.setItem(this.storageKey, JSON.stringify(finalFavorites))
      
      // Émettre un événement pour notifier les composants
      this._emitFavoritesChanged('imported', { count: validFavorites.length, merge })
      
      return true
    } catch (error) {
      console.error('Erreur lors de l\'import des favoris:', error)
      return false
    }
  }

  /**
   * Émet un événement personnalisé pour notifier les changements
   * @private
   */
  _emitFavoritesChanged(action, data) {
    try {
      const event = new CustomEvent('favorites-changed', {
        detail: {
          action,
          data,
          favorites: this.getFavorites(),
          timestamp: Date.now()
        }
      })
      window.dispatchEvent(event)
    } catch (error) {
      console.error('Erreur lors de l\'émission de l\'événement:', error)
    }
  }

  /**
   * Ajoute un écouteur d'événements pour les changements de favoris
   * @param {Function} callback - Fonction à appeler lors des changements
   * @returns {Function} Fonction pour supprimer l'écouteur
   */
  onFavoritesChanged(callback) {
    if (typeof callback !== 'function') {
      console.warn('Le callback doit être une fonction')
      return () => {}
    }

    const handler = (event) => {
      callback(event.detail)
    }

    window.addEventListener('favorites-changed', handler)
    
    // Retourner une fonction pour supprimer l'écouteur
    return () => {
      window.removeEventListener('favorites-changed', handler)
    }
  }
}

// Créer et exporter une instance singleton
export const favoritesService = new FavoritesService()
export default favoritesService