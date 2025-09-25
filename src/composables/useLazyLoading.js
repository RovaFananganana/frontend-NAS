/**
 * @fileoverview Composable pour le lazy loading des gros dossiers
 */

import { ref, computed, watch, nextTick } from 'vue'

/**
 * Composable pour le lazy loading des fichiers
 * @param {Object} options - Options de configuration
 * @returns {Object} API du composable
 */
export function useLazyLoading(options = {}) {
  const {
    batchSize = 50, // Nombre d'éléments à charger par batch
    threshold = 100, // Seuil pour activer le lazy loading
    loadDelay = 100, // Délai entre les chargements (ms)
    enabled = true // Activer/désactiver le lazy loading
  } = options

  // État réactif
  const allItems = ref([])
  const loadedItems = ref([])
  const isLoading = ref(false)
  const hasMore = ref(false)
  const currentBatch = ref(0)
  const isLazyEnabled = ref(false)

  // Computed
  const totalItems = computed(() => allItems.value.length)
  const loadedCount = computed(() => loadedItems.value.length)
  const remainingCount = computed(() => totalItems.value - loadedCount.value)
  const progress = computed(() => {
    if (totalItems.value === 0) return 100
    return Math.round((loadedCount.value / totalItems.value) * 100)
  })

  // Méthodes
  const setAllItems = (items) => {
    allItems.value = items || []
    isLazyEnabled.value = enabled && allItems.value.length > threshold
    
    if (isLazyEnabled.value) {
      // Charger le premier batch
      loadedItems.value = allItems.value.slice(0, batchSize)
      currentBatch.value = 1
      hasMore.value = allItems.value.length > batchSize
    } else {
      // Charger tous les éléments directement
      loadedItems.value = [...allItems.value]
      currentBatch.value = 0
      hasMore.value = false
    }
  }

  const loadNextBatch = async () => {
    if (isLoading.value || !hasMore.value || !isLazyEnabled.value) {
      return false
    }

    isLoading.value = true

    try {
      // Simuler un délai de chargement pour éviter les blocages
      if (loadDelay > 0) {
        await new Promise(resolve => setTimeout(resolve, loadDelay))
      }

      const startIndex = currentBatch.value * batchSize
      const endIndex = Math.min(startIndex + batchSize, allItems.value.length)
      
      if (startIndex < allItems.value.length) {
        const nextBatch = allItems.value.slice(startIndex, endIndex)
        loadedItems.value = [...loadedItems.value, ...nextBatch]
        currentBatch.value++
        
        hasMore.value = endIndex < allItems.value.length
        
        // Attendre le prochain tick pour que le DOM se mette à jour
        await nextTick()
        
        return true
      }
      
      hasMore.value = false
      return false
    } catch (error) {
      console.error('Erreur lors du chargement du batch:', error)
      return false
    } finally {
      isLoading.value = false
    }
  }

  const loadAllRemaining = async () => {
    if (!hasMore.value || !isLazyEnabled.value) return

    isLoading.value = true

    try {
      const startIndex = currentBatch.value * batchSize
      const remainingItems = allItems.value.slice(startIndex)
      
      // Charger par petits groupes pour éviter de bloquer l'UI
      const chunkSize = Math.min(batchSize * 2, remainingItems.length)
      
      for (let i = 0; i < remainingItems.length; i += chunkSize) {
        const chunk = remainingItems.slice(i, i + chunkSize)
        loadedItems.value = [...loadedItems.value, ...chunk]
        
        // Petite pause pour laisser l'UI respirer
        if (i + chunkSize < remainingItems.length) {
          await new Promise(resolve => setTimeout(resolve, 10))
        }
      }
      
      hasMore.value = false
      currentBatch.value = Math.ceil(allItems.value.length / batchSize)
      
      await nextTick()
    } catch (error) {
      console.error('Erreur lors du chargement complet:', error)
    } finally {
      isLoading.value = false
    }
  }

  const reset = () => {
    loadedItems.value = []
    currentBatch.value = 0
    hasMore.value = false
    isLoading.value = false
  }

  const reload = () => {
    reset()
    setAllItems(allItems.value)
  }

  // Méthode pour vérifier si un élément est chargé
  const isItemLoaded = (index) => {
    return index < loadedItems.value.length
  }

  // Méthode pour obtenir un élément par index
  const getItem = (index) => {
    return loadedItems.value[index] || null
  }

  // Méthode pour obtenir une plage d'éléments
  const getItemsRange = (startIndex, endIndex) => {
    return loadedItems.value.slice(startIndex, endIndex + 1)
  }

  // Auto-loading basé sur la position de scroll
  const checkAutoLoad = (scrollPosition, containerHeight, itemHeight) => {
    if (!hasMore.value || isLoading.value || !isLazyEnabled.value) return

    const totalHeight = loadedItems.value.length * itemHeight
    const scrollBottom = scrollPosition + containerHeight
    const threshold = totalHeight - (itemHeight * 10) // Charger quand il reste 10 éléments

    if (scrollBottom >= threshold) {
      loadNextBatch()
    }
  }

  // Méthode pour forcer le chargement jusqu'à un index spécifique
  const loadUpToIndex = async (targetIndex) => {
    if (!isLazyEnabled.value || targetIndex < loadedItems.value.length) return

    while (hasMore.value && loadedItems.value.length <= targetIndex) {
      const success = await loadNextBatch()
      if (!success) break
    }
  }

  // Statistiques pour le debug
  const getStats = () => {
    return {
      totalItems: totalItems.value,
      loadedCount: loadedCount.value,
      remainingCount: remainingCount.value,
      progress: progress.value,
      currentBatch: currentBatch.value,
      isLazyEnabled: isLazyEnabled.value,
      isLoading: isLoading.value,
      hasMore: hasMore.value,
      batchSize
    }
  }

  return {
    // État
    loadedItems: computed(() => loadedItems.value),
    isLoading: computed(() => isLoading.value),
    hasMore: computed(() => hasMore.value),
    isLazyEnabled: computed(() => isLazyEnabled.value),
    totalItems,
    loadedCount,
    remainingCount,
    progress,
    currentBatch: computed(() => currentBatch.value),

    // Méthodes
    setAllItems,
    loadNextBatch,
    loadAllRemaining,
    reset,
    reload,
    isItemLoaded,
    getItem,
    getItemsRange,
    checkAutoLoad,
    loadUpToIndex,
    getStats
  }
}

export default useLazyLoading