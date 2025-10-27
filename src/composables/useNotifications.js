// composables/useNotifications.js

/**
 * Composable for showing notifications and error messages
 * Uses console logging and browser alerts as fallback
 */
export function useNotifications() {
  
  /**
   * Show a success notification
   */
  const showSuccess = (message, title = 'Succès') => {
    console.log(`✅ ${title}: ${message}`)
    // Could be enhanced with toast notifications later
  }

  /**
   * Show an error notification
   */
  const showError = (message, title = 'Erreur') => {
    console.error(`❌ ${title}: ${message}`)
    // Could be enhanced with toast notifications later
  }

  /**
   * Show a warning notification
   */
  const showWarning = (message, title = 'Attention') => {
    console.warn(`⚠️ ${title}: ${message}`)
    // Could be enhanced with toast notifications later
  }

  /**
   * Show an info notification
   */
  const showInfo = (message, title = 'Information') => {
    console.info(`ℹ️ ${title}: ${message}`)
    // Could be enhanced with toast notifications later
  }

  /**
   * Show a permission error notification
   */
  const showPermissionError = (action) => {
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
    
    const message = messages[action] || "Vous n'avez pas la permission d'effectuer cette action"
    showError(message, 'Permission refusée')
  }

  /**
   * Clear all notifications
   */
  const clearNotifications = () => {
    console.log('🧹 Notifications cleared')
    // Could be enhanced with toast notifications later
  }

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showPermissionError,
    clearNotifications
  }
}