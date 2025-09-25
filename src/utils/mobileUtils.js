/**
 * Utilitaires pour la gestion mobile et tactile
 */

/**
 * Détecte si l'appareil est tactile
 * @returns {boolean}
 */
export const isTouchDevice = () => {
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    navigator.msMaxTouchPoints > 0
  )
}

/**
 * Détecte si l'écran est de petite taille (mobile)
 * @returns {boolean}
 */
export const isMobileScreen = () => {
  return window.innerWidth < 768
}

/**
 * Détecte si l'écran est de taille tablette
 * @returns {boolean}
 */
export const isTabletScreen = () => {
  return window.innerWidth >= 768 && window.innerWidth < 1024
}

/**
 * Détecte si l'écran est de taille desktop
 * @returns {boolean}
 */
export const isDesktopScreen = () => {
  return window.innerWidth >= 1024
}

/**
 * Obtient les breakpoints responsive
 * @returns {object}
 */
export const getBreakpoints = () => ({
  mobile: 640,
  tablet: 768,
  desktop: 1024,
  wide: 1280
})

/**
 * Détermine quelles colonnes afficher selon la taille d'écran
 * @param {number} screenWidth - Largeur de l'écran
 * @returns {object} Configuration des colonnes visibles
 */
export const getVisibleColumns = (screenWidth) => {
  const breakpoints = getBreakpoints()
  
  if (screenWidth < breakpoints.mobile) {
    // Mobile très petit - seulement nom et taille
    return {
      name: true,
      size: true,
      type: false,
      date: false
    }
  } else if (screenWidth < breakpoints.tablet) {
    // Mobile - nom, taille et type
    return {
      name: true,
      size: true,
      type: true,
      date: false
    }
  } else if (screenWidth < breakpoints.desktop) {
    // Tablette - toutes sauf date complète
    return {
      name: true,
      size: true,
      type: true,
      date: true
    }
  } else {
    // Desktop - toutes les colonnes
    return {
      name: true,
      size: true,
      type: true,
      date: true
    }
  }
}

/**
 * Calcule la taille optimale des zones de touch
 * @param {boolean} isTouchDevice - Si l'appareil est tactile
 * @returns {object} Tailles recommandées
 */
export const getTouchSizes = (isTouchDevice = false) => {
  if (isTouchDevice) {
    return {
      minTouchTarget: 44, // 44px minimum recommandé par Apple/Google
      buttonHeight: 48,
      iconSize: 24,
      spacing: 16
    }
  } else {
    return {
      minTouchTarget: 32,
      buttonHeight: 36,
      iconSize: 20,
      spacing: 12
    }
  }
}

/**
 * Formate la date selon la taille d'écran
 * @param {string|Date} date - Date à formater
 * @param {number} screenWidth - Largeur de l'écran
 * @returns {string} Date formatée
 */
export const formatDateForScreen = (date, screenWidth) => {
  if (!date) return ''
  
  const dateObj = new Date(date)
  const breakpoints = getBreakpoints()
  
  if (screenWidth < breakpoints.mobile) {
    // Mobile très petit - format court
    return dateObj.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit'
    })
  } else if (screenWidth < breakpoints.desktop) {
    // Tablette - format moyen
    return dateObj.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    })
  } else {
    // Tablette et desktop - format complet
    return dateObj.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }
}

/**
 * Adapte la taille des fichiers selon l'écran
 * @param {number} bytes - Taille en bytes
 * @param {number} screenWidth - Largeur de l'écran
 * @returns {string} Taille formatée
 */
export const formatSizeForScreen = (bytes, screenWidth) => {
  if (!bytes || bytes === 0) return '—'
  
  const breakpoints = getBreakpoints()
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  
  let size = bytes
  let unitIndex = 0
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }
  
  // Format selon la taille d'écran
  if (screenWidth < breakpoints.mobile) {
    // Mobile très petit - format ultra court
    return `${Math.round(size)}${units[unitIndex]}`
  } else if (screenWidth < breakpoints.tablet) {
    // Mobile - format court
    return `${size.toFixed(size < 10 ? 1 : 0)} ${units[unitIndex]}`
  } else {
    // Tablette et desktop - format complet
    return `${size.toFixed(size < 10 ? 1 : 0)} ${units[unitIndex]}`
  }
}

/**
 * Détermine si on doit utiliser la virtualisation
 * @param {number} itemCount - Nombre d'éléments
 * @param {boolean} isMobile - Si c'est un appareil mobile
 * @returns {boolean}
 */
export const shouldUseVirtualization = (itemCount, isMobile = false) => {
  // Seuil plus bas sur mobile pour économiser les performances
  const threshold = isMobile ? 50 : 100
  return itemCount > threshold
}

/**
 * Calcule la hauteur d'un élément selon l'appareil
 * @param {boolean} isTouchDevice - Si l'appareil est tactile
 * @param {boolean} isCompact - Si le mode compact est activé
 * @returns {number} Hauteur en pixels
 */
export const getItemHeight = (isTouchDevice = false, isCompact = false) => {
  if (isTouchDevice) {
    return isCompact ? 56 : 64 // Plus grand pour le touch
  } else {
    return isCompact ? 40 : 48 // Standard pour desktop
  }
}