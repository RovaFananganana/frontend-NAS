/**
 * Utilitaires pour le formatage des dates
 */

/**
 * Formate une date en format lisible français
 * Supporte plusieurs formats d'entrée
 */
export const formatDate = (dateString) => {
  if (!dateString) return null
  
  try {
    let date
    
    // Essayer différents formats de date
    if (typeof dateString === 'string') {
      // Format GMT: "Fri, 17 Oct 2025 05:33:28 GMT"
      if (dateString.includes('GMT') || dateString.includes(',')) {
        date = new Date(dateString)
      }
      // Format PostgreSQL: "2025-10-06 08:06:04.184352"
      else if (dateString.includes(' ') && !dateString.includes('T')) {
        const isoString = dateString.replace(' ', 'T')
        date = new Date(isoString)
      }
      // Format ISO ou autres
      else {
        date = new Date(dateString)
      }
    } else {
      // Si c'est déjà un objet Date ou un timestamp
      date = new Date(dateString)
    }
    
    // Vérifier si la date est valide
    if (isNaN(date.getTime())) {
      console.warn('Date invalide:', dateString)
      return null
    }
    
    // Formatter en français
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    
    return `${day}/${month}/${year} à ${hours}:${minutes}`
  } catch (error) {
    console.error('Erreur formatage date:', error, 'date:', dateString)
    return null
  }
}

/**
 * Formate une date de manière relative (il y a X temps)
 */
export const formatRelativeDate = (dateString) => {
  if (!dateString) return null
  
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return null
    
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) {
      return 'À l\'instant'
    } else if (diffMins < 60) {
      return `Il y a ${diffMins} min`
    } else if (diffHours < 24) {
      return `Il y a ${diffHours}h`
    } else if (diffDays < 7) {
      return `Il y a ${diffDays}j`
    } else {
      return formatDate(dateString)
    }
  } catch (error) {
    console.error('Erreur formatage date relative:', error)
    return null
  }
}

/**
 * Test des différents formats de date
 */
export const testDateFormats = () => {
  const testDates = [
    'Fri, 17 Oct 2025 05:33:28 GMT',
    'Mon, 13 Oct 2025 16:36:16 GMT',
    '2025-10-06 08:06:04.184352',
    '2025-10-06T08:06:04.184Z',
    new Date().toISOString()
  ]
  
  console.log('Test des formats de date:')
  testDates.forEach(dateStr => {
    const formatted = formatDate(dateStr)
    console.log(`${dateStr} -> ${formatted}`)
  })
}