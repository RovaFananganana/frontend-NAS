/**
 * Utilitaires pour nettoyer les favoris problématiques
 */

/**
 * Vide complètement le localStorage des favoris
 */
export function clearAllLocalStorageFavorites() {
  try {
    localStorage.removeItem('file-favorites')
    console.log('🧹 Tous les favoris du localStorage ont été supprimés')
    
    // Émettre un événement pour notifier les composants
    window.dispatchEvent(new CustomEvent('favorites-changed', {
      detail: { action: 'cleared-all' }
    }))
    
    return true
  } catch (err) {
    console.error('Erreur lors de la suppression des favoris localStorage:', err)
    return false
  }
}

/**
 * Affiche les favoris actuels du localStorage pour debug
 */
export function debugLocalStorageFavorites() {
  try {
    const stored = localStorage.getItem('file-favorites')
    const favorites = stored ? JSON.parse(stored) : []
    
    console.log('🔍 Favoris actuels dans localStorage:')
    favorites.forEach((fav, index) => {
      console.log(`  ${index + 1}. ${fav.name} (${fav.path})`)
    })
    
    return favorites
  } catch (err) {
    console.error('Erreur lors de la lecture des favoris localStorage:', err)
    return []
  }
}

/**
 * Supprime des favoris spécifiques du localStorage
 */
export function removeSpecificLocalStorageFavorites(pathsToRemove) {
  try {
    const stored = localStorage.getItem('file-favorites')
    const favorites = stored ? JSON.parse(stored) : []
    
    const initialCount = favorites.length
    const cleanedFavorites = favorites.filter(fav => 
      !pathsToRemove.includes(fav.path)
    )
    
    localStorage.setItem('file-favorites', JSON.stringify(cleanedFavorites))
    
    const removedCount = initialCount - cleanedFavorites.length
    console.log(`🧹 ${removedCount} favoris spécifiques supprimés du localStorage`)
    
    // Émettre un événement pour notifier les composants
    window.dispatchEvent(new CustomEvent('favorites-changed', {
      detail: { action: 'removed-specific', count: removedCount }
    }))
    
    return removedCount
  } catch (err) {
    console.error('Erreur lors de la suppression des favoris spécifiques:', err)
    return 0
  }
}

/**
 * Favoris problématiques connus
 */
export const PROBLEMATIC_FAVORITES = [
  '/AIMtest',
  '/echange IL',
  '/administration', 
  '/finance',
  '/TWR'
]

/**
 * Nettoie les favoris problématiques connus
 */
export function cleanupProblematicFavorites() {
  return removeSpecificLocalStorageFavorites(PROBLEMATIC_FAVORITES)
}