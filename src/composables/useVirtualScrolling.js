/**
 * @fileoverview Composable pour la virtualisation des listes avec de nombreux éléments
 */

import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'

/**
 * Composable pour la virtualisation des listes
 * @param {Object} options - Options de configuration
 * @returns {Object} API du composable
 */
export function useVirtualScrolling(options = {}) {
  const {
    itemHeight = 48, // Hauteur d'un élément en pixels
    containerHeight = 400, // Hauteur du conteneur visible
    overscan = 5, // Nombre d'éléments supplémentaires à rendre
    threshold = 100, // Seuil pour activer la virtualisation
    enabled = true // Activer/désactiver la virtualisation
  } = options

  // État réactif
  const scrollTop = ref(0)
  const containerRef = ref(null)
  const items = ref([])
  const isVirtualized = ref(false)

  // Calculs pour la virtualisation
  const visibleItemCount = computed(() => Math.ceil(containerHeight / itemHeight))
  const totalHeight = computed(() => items.value.length * itemHeight)
  
  const startIndex = computed(() => {
    if (!isVirtualized.value) return 0
    return Math.max(0, Math.floor(scrollTop.value / itemHeight) - overscan)
  })
  
  const endIndex = computed(() => {
    if (!isVirtualized.value) return items.value.length - 1
    return Math.min(
      items.value.length - 1,
      startIndex.value + visibleItemCount.value + overscan * 2
    )
  })

  const visibleItems = computed(() => {
    if (!isVirtualized.value) return items.value
    return items.value.slice(startIndex.value, endIndex.value + 1)
  })

  const offsetY = computed(() => {
    if (!isVirtualized.value) return 0
    return startIndex.value * itemHeight
  })

  // Méthodes
  const setItems = (newItems) => {
    items.value = newItems || []
    isVirtualized.value = enabled && items.value.length > threshold
    
    // Réinitialiser le scroll si nécessaire
    if (scrollTop.value > totalHeight.value) {
      scrollTop.value = 0
      if (containerRef.value) {
        containerRef.value.scrollTop = 0
      }
    }
  }

  const handleScroll = (event) => {
    scrollTop.value = event.target.scrollTop
  }

  const scrollToIndex = (index) => {
    if (!containerRef.value || index < 0 || index >= items.value.length) return
    
    const targetScrollTop = index * itemHeight
    containerRef.value.scrollTop = targetScrollTop
    scrollTop.value = targetScrollTop
  }

  const scrollToTop = () => {
    scrollToIndex(0)
  }

  const scrollToBottom = () => {
    scrollToIndex(items.value.length - 1)
  }

  // Méthode pour obtenir l'index d'un élément visible
  const getItemIndex = (visibleIndex) => {
    return startIndex.value + visibleIndex
  }

  // Méthode pour vérifier si un index est visible
  const isIndexVisible = (index) => {
    return index >= startIndex.value && index <= endIndex.value
  }

  // Méthode pour obtenir la position d'un élément
  const getItemPosition = (index) => {
    return {
      top: index * itemHeight,
      height: itemHeight
    }
  }

  // Optimisation des performances avec debounce pour le scroll
  let scrollTimeout = null
  const debouncedScroll = (event) => {
    if (scrollTimeout) {
      clearTimeout(scrollTimeout)
    }
    
    // Mise à jour immédiate pour la fluidité
    scrollTop.value = event.target.scrollTop
    
    // Debounce pour les calculs coûteux
    scrollTimeout = setTimeout(() => {
      // Ici on pourrait ajouter des calculs supplémentaires si nécessaire
    }, 16) // ~60fps
  }

  // Gestion des événements
  const attachScrollListener = () => {
    if (containerRef.value) {
      containerRef.value.addEventListener('scroll', debouncedScroll, { passive: true })
    }
  }

  const detachScrollListener = () => {
    if (containerRef.value) {
      containerRef.value.removeEventListener('scroll', debouncedScroll)
    }
    if (scrollTimeout) {
      clearTimeout(scrollTimeout)
    }
  }

  // Watchers
  watch(containerRef, (newContainer, oldContainer) => {
    if (oldContainer) {
      detachScrollListener()
    }
    if (newContainer) {
      nextTick(() => {
        attachScrollListener()
      })
    }
  })

  // Lifecycle
  onUnmounted(() => {
    detachScrollListener()
  })

  return {
    // Refs
    containerRef,
    
    // État
    items: computed(() => items.value),
    visibleItems,
    isVirtualized: computed(() => isVirtualized.value),
    totalHeight,
    offsetY,
    startIndex: computed(() => startIndex.value),
    endIndex: computed(() => endIndex.value),
    visibleItemCount: computed(() => visibleItemCount.value),
    
    // Méthodes
    setItems,
    handleScroll,
    scrollToIndex,
    scrollToTop,
    scrollToBottom,
    getItemIndex,
    isIndexVisible,
    getItemPosition,
    
    // Utilitaires
    attachScrollListener,
    detachScrollListener
  }
}

export default useVirtualScrolling