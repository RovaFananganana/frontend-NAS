import { ref, computed } from 'vue'
import { nasAPI } from '@/services/nasAPI.js'
import { getFileIcon } from '@/utils/fileUtils.js'

/**
 * Obtient les informations d'icône optimisées pour l'affichage
 * @param {Object} item - Élément de fichier/dossier
 * @returns {Object} Informations d'icône optimisées
 */
const getOptimizedIconInfo = (item) => {
  try {
    return getFileIcon(item)
  } catch (error) {
    // Fallback silencieux en cas d'erreur
    return {
      icon: item.is_directory ? 'fas fa-folder' : 'fas fa-file',
      color: item.is_directory ? 'text-blue-500' : 'text-gray-500',
      bgColor: item.is_directory ? 'from-blue-400 to-blue-600' : 'from-gray-400 to-gray-600',
      textColor: 'text-white'
    }
  }
}

/**
 * Composable pour la recherche rapide de fichiers
 * Implémente une recherche hybride : locale instantanée + récursive distante
 */
export function useFileSearch(options = {}) {
  // Configuration par défaut
  const config = {
    minQueryLength: 2,
    maxResults: 30,
    searchTimeout: 1000,
    debounceDelay: 0, // Recherche instantanée
    ...options
  }

  // État réactif
  const searchQuery = ref('')
  const searchResults = ref([])
  const isSearching = ref(false)
  const searchError = ref(null)
  const searchStats = ref({
    totalFound: 0,
    truncated: false,
    searchTime: 0,
    localResults: 0,
    remoteResults: 0
  })

  // Contrôleur pour annuler les requêtes en cours
  let currentSearchController = null

  // Métriques de performance pour l'optimisation automatique
  const performanceMetrics = ref({
    averageSearchTime: 0,
    searchCount: 0,
    timeoutCount: 0,
    errorCount: 0
  })

  /**
   * Recherche locale instantanée dans les fichiers déjà chargés
   * @param {string} query - Terme de recherche
   * @param {Array} files - Fichiers locaux à filtrer
   * @returns {Array} Résultats de recherche locale
   */
  const localSearch = (query, files) => {
    console.log('🔍 localSearch called with:', { query, filesCount: files?.length })
    
    if (!query || !files || files.length === 0) {
      console.log('❌ localSearch: Invalid input')
      return []
    }

    const searchTerm = query.toLowerCase().trim()
    console.log('🔍 Searching for term:', searchTerm)
    
    // Log des fichiers disponibles pour debug
    console.log('📁 Available files:', files.map(f => ({ name: f.name, path: f.path })))
    console.log('📁 File names only:', files.map(f => f.name))
    
    const filteredFiles = files.filter(file => {
      // Recherche dans le nom du fichier
      const nameMatch = file.name.toLowerCase().includes(searchTerm)
      
      // Recherche dans le chemin relatif si disponible
      const pathMatch = file.relative_path && 
        file.relative_path.toLowerCase().includes(searchTerm)
      
      const matches = nameMatch || pathMatch
      
      if (matches) {
        console.log('✅ Match found:', file.name, { nameMatch, pathMatch })
      }
      
      return matches
    })

    console.log('🎯 Filtered files:', filteredFiles.length, 'matches')

    // Limitation automatique des résultats pour les performances
    const limitedFiles = filteredFiles.slice(0, config.maxResults)
    
    return limitedFiles.map(file => ({
      ...file,
      match_type: file.name.toLowerCase().includes(searchTerm) ? 'name' : 'path',
      source: 'local',
      relative_path: file.relative_path || file.path,
      // Ajouter les informations d'icône pour l'affichage optimisé
      icon_info: getOptimizedIconInfo(file)
    }))
  }

  /**
   * Recherche récursive distante via l'API avec gestion d'erreur optimisée
   * @param {string} query - Terme de recherche
   * @param {string} path - Chemin de base pour la recherche
   * @returns {Promise<Array>} Résultats de recherche distante
   */
  const remoteSearch = async (query, path) => {
    if (!query || query.length < config.minQueryLength) {
      return []
    }

    try {
      // Configurer la requête avec limitation automatique
      const searchOptions = {
        recursive: true,
        includeFiles: true,
        includeFolders: true,
        caseSensitive: false,
        maxResults: config.maxResults // Limitation côté serveur
        // Note: signal sera géré par le timeout global dans performSearch
      }

      // Effectuer la recherche avec timeout automatique géré par performSearch
      const response = await nasAPI.search(query, path, searchOptions)

      if (!response.success) {
        // Gestion d'erreur silencieuse - retourner un tableau vide
        console.warn('Remote search API error:', response.error)
        return []
      }

      // Traiter et limiter les résultats
      const results = response.results || response.items || []
      
      // Marquer les résultats comme distants et ajouter les icônes appropriées
      return results
        .slice(0, config.maxResults) // Double limitation pour la sécurité
        .map(item => ({
          ...item,
          match_type: item.match_type || 'name',
          source: 'remote',
          // Ajouter les informations d'icône pour l'affichage optimisé
          icon_info: getOptimizedIconInfo(item)
        }))

    } catch (error) {
      // Gestion d'erreur complètement silencieuse
      if (error.name === 'AbortError') {
        console.warn('Remote search aborted (timeout or cancellation)')
      } else {
        console.warn('Remote search failed silently:', error.message)
      }
      return [] // Toujours retourner un tableau vide en cas d'erreur
    }
  }

  /**
   * Fusion intelligente et optimisée des résultats locaux et distants
   * @param {Array} localResults - Résultats de recherche locale
   * @param {Array} remoteResults - Résultats de recherche distante
   * @returns {Array} Résultats fusionnés, dédupliqués et optimisés
   */
  const mergeResults = (localResults, remoteResults) => {
    // Gestion d'erreur silencieuse pour les paramètres invalides
    const safeLocalResults = Array.isArray(localResults) ? localResults : []
    const safeRemoteResults = Array.isArray(remoteResults) ? remoteResults : []
    
    const merged = []
    const seenPaths = new Set()

    // Prioriser les résultats locaux (plus rapides et pertinents)
    for (const result of safeLocalResults) {
      if (result && result.path && !seenPaths.has(result.path)) {
        // Assurer que les informations d'icône sont présentes
        const optimizedResult = {
          ...result,
          icon_info: result.icon_info || getOptimizedIconInfo(result)
        }
        merged.push(optimizedResult)
        seenPaths.add(result.path)
        
        // Limitation automatique pendant la fusion pour les performances
        if (merged.length >= config.maxResults) {
          break
        }
      }
    }

    // Ajouter les résultats distants non dupliqués si on n'a pas atteint la limite
    if (merged.length < config.maxResults) {
      for (const result of safeRemoteResults) {
        if (result && result.path && !seenPaths.has(result.path)) {
          // Assurer que les informations d'icône sont présentes
          const optimizedResult = {
            ...result,
            source: 'remote',
            icon_info: result.icon_info || getOptimizedIconInfo(result)
          }
          merged.push(optimizedResult)
          seenPaths.add(result.path)
          
          // Limitation automatique pendant la fusion
          if (merged.length >= config.maxResults) {
            break
          }
        }
      }
    }

    return merged
  }

  /**
   * Effectue une recherche complète (locale + distante)
   * @param {string} query - Terme de recherche
   * @param {string} currentPath - Chemin actuel
   * @param {Array} allFiles - Tous les fichiers locaux
   */
  const performSearch = async (query, currentPath, allFiles) => {
    console.log('🔍 performSearch called with:', { query, currentPath, allFilesCount: allFiles?.length })
    
    // Réinitialiser l'état
    searchError.value = null
    const startTime = Date.now()

    // Vérifier la longueur minimale de la requête
    if (!query || query.length < config.minQueryLength) {
      console.log('❌ Query too short or empty, clearing results')
      searchResults.value = []
      isSearching.value = false
      searchStats.value = {
        totalFound: 0,
        truncated: false,
        searchTime: 0,
        localResults: 0,
        remoteResults: 0
      }
      return
    }

    isSearching.value = true

    try {
      // Annuler la recherche précédente si elle existe
      if (currentSearchController) {
        currentSearchController.abort()
      }
      currentSearchController = new AbortController()

      // 1. Recherche locale instantanée
      const localResults = localSearch(query, allFiles || [])
      console.log('📍 Local search found:', localResults.length, 'results')
      
      // Afficher immédiatement les résultats locaux
      searchResults.value = localResults.slice(0, config.maxResults)
      console.log('📋 Set search results to:', searchResults.value.length, 'items')
      
      // 2. Lancer la recherche distante en parallèle
      let remoteResults = []
      try {
        remoteResults = await remoteSearch(query, currentPath)
        console.log('🌐 Remote search found:', remoteResults.length, 'results')
      } catch (error) {
        console.warn('Remote search failed silently:', error.message)
        remoteResults = []
      }

      // 3. Fusionner les résultats si la recherche n'a pas été annulée
      if (!currentSearchController || !currentSearchController.signal.aborted) {
        const mergedResults = mergeResults(localResults, remoteResults)
        
        // Limitation automatique des résultats finaux
        const limitedResults = mergedResults.slice(0, config.maxResults)
        searchResults.value = limitedResults
        console.log('🎯 Final search results set:', limitedResults.length, 'items')

        // Calculer le temps de recherche
        const searchTime = Date.now() - startTime
        
        // Déterminer si les résultats sont tronqués
        const totalPotentialResults = localResults.length + remoteResults.length
        const isTruncated = totalPotentialResults > config.maxResults

        searchStats.value = {
          totalFound: limitedResults.length,
          truncated: isTruncated,
          searchTime,
          localResults: localResults.length,
          remoteResults: remoteResults.length
        }
      }

    } catch (error) {
      // Gestion d'erreur silencieuse globale
      if (error.name !== 'AbortError') {
        console.warn('Search error handled silently:', error.message)
        
        // Maintenir les résultats locaux si disponibles
        if (searchResults.value.length === 0) {
          const fallbackResults = localSearch(query, allFiles || [])
          searchResults.value = fallbackResults.slice(0, config.maxResults)
        }
      }
      // Ne jamais définir searchError.value pour maintenir la fluidité
    } finally {
      isSearching.value = false
      currentSearchController = null
    }
  }

  /**
   * Efface la recherche et remet à zéro l'état
   */
  const clearSearch = () => {
    console.log('🧹 Clearing search')
    
    // Annuler la recherche en cours
    if (currentSearchController) {
      currentSearchController.abort()
      currentSearchController = null
    }

    // Réinitialiser l'état
    searchQuery.value = ''
    searchResults.value = []
    isSearching.value = false
    searchError.value = null
    searchStats.value = {
      totalFound: 0,
      truncated: false,
      searchTime: 0,
      localResults: 0,
      remoteResults: 0
    }
  }

  // Computed pour l'état de la recherche
  const isSearchActive = computed(() => {
    return searchQuery.value.length >= config.minQueryLength
  })

  const hasResults = computed(() => {
    return searchResults.value.length > 0
  })

  const searchStatusMessage = computed(() => {
    if (isSearching.value) {
      return 'Recherche en cours...'
    }
    
    if (!isSearchActive.value) {
      return ''
    }
    
    if (!hasResults.value) {
      return 'Aucun résultat trouvé'
    }
    
    const { totalFound, truncated, searchTime } = searchStats.value
    
    // Messages optimisés avec informations de performance
    if (truncated) {
      return `${totalFound} résultats (limité à ${config.maxResults} max)`
    }
    
    // Message standard
    const baseMessage = `${totalFound} résultat${totalFound > 1 ? 's' : ''} trouvé${totalFound > 1 ? 's' : ''}`
    
    if (searchTime > 500) { // Afficher le temps si > 500ms
      return `${baseMessage} (${searchTime}ms)`
    }
    
    return baseMessage
  })

  // Nettoyage lors de la destruction du composable
  const cleanup = () => {
    if (currentSearchController) {
      currentSearchController.abort()
    }
  }

  return {
    // État réactif
    searchQuery,
    searchResults,
    isSearching,
    searchError,
    searchStats,
    performanceMetrics,
    
    // Computed
    isSearchActive,
    hasResults,
    searchStatusMessage,
    
    // Méthodes
    performSearch,
    clearSearch,
    localSearch,
    remoteSearch,
    mergeResults,
    cleanup,
    
    // Configuration
    config
  }
}