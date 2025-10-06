// ============================================================================
// 📦 explorerStore.js — Store Pinia pour FileExplorer
// Gère le chemin courant, le mode d'affichage et l'historique
// ============================================================================

import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useExplorerStore = defineStore('explorer', () => {
  const currentDirectory = ref('/')
  const viewMode = ref('grid') // 'grid' ou 'list'
  const history = ref([])

  /**
   * Définit le dossier courant
   */
  const setCurrentDirectory = (path) => {
    currentDirectory.value = path
    history.value.push(path)
  }

  /**
   * Change le mode d'affichage
   */
  const setViewMode = (mode) => {
    viewMode.value = mode
  }

  /**
   * Revient au dossier précédent (si possible)
   */
  const goBack = () => {
    if (history.value.length > 1) {
      history.value.pop()
      currentDirectory.value = history.value[history.value.length - 1]
    }
  }

  return { currentDirectory, viewMode, history, setCurrentDirectory, setViewMode, goBack }
})
