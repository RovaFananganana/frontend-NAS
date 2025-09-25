// composables/useNotifications.js

import { useStore } from 'vuex'

/**
 * Composable for showing notifications and error messages
 */
export function useNotifications() {
  const store = useStore()

  /**
   * Show a success notification
   */
  const showSuccess = (message, title = 'Succès') => {
    store.dispatch('showSuccess', message)
  }

  /**
   * Show an error notification
   */
  const showError = (message, title = 'Erreur') => {
    store.dispatch('showError', message)
  }

  /**
   * Show a warning notification
   */
  const showWarning = (message, title = 'Attention') => {
    store.dispatch('showWarning', message)
  }

  /**
   * Show an info notification
   */
  const showInfo = (message, title = 'Information') => {
    store.dispatch('showInfo', message)
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
    store.dispatch('clearAllNotifications')
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