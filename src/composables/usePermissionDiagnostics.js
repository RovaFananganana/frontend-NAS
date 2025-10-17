// composables/usePermissionDiagnostics.js

import { ref, computed } from 'vue'
import { useStore } from 'vuex'
import { permissionDiagnosticService } from '@/services/permissionDiagnosticService.js'
import { usePermissions } from './usePermissions.js'

/**
 * Composable pour le diagnostic des permissions
 * Fournit des outils avancés pour diagnostiquer et résoudre les problèmes de permissions
 */
export function usePermissionDiagnostics() {
  const store = useStore()
  const { getCachedPermissions, clearPermissionsCache } = usePermissions()
  
  // État réactif
  const isLoading = ref(false)
  const lastDiagnosis = ref(null)
  const lastComparison = ref(null)
  const diagnosticHistory = ref([])
  
  // Utilisateur actuel
  const currentUser = computed(() => store.state.user)
  const isAdmin = computed(() => store.getters.isAdmin)
  
  /**
   * Diagnostiquer les permissions d'un utilisateur pour un chemin spécifique
   * @param {number} userId - ID de l'utilisateur à diagnostiquer
   * @param {string} path - Chemin à analyser
   * @returns {Promise<Object>} Rapport de diagnostic
   */
  const diagnoseUserPermissions = async (userId, path) => {
    if (!isAdmin.value) {
      throw new Error('Seuls les administrateurs peuvent effectuer des diagnostics')
    }
    
    isLoading.value = true
    
    try {
      // Enrichir le diagnostic avec les informations du cache local
      const diagnosis = await permissionDiagnosticService.diagnoseUserPermissions(userId, path)
      
      // Ajouter les informations du cache frontend
      const frontendCache = getCachedPermissions(path)
      if (frontendCache) {
        diagnosis.cache_status.frontend_cache = {
          exists: true,
          permissions: frontendCache,
          age_minutes: Math.floor((Date.now() - (frontendCache.timestamp || 0)) / 60000)
        }
      } else {
        diagnosis.cache_status.frontend_cache = {
          exists: false,
          permissions: null,
          age_minutes: null
        }
      }
      
      // Sauvegarder le diagnostic
      lastDiagnosis.value = diagnosis
      diagnosticHistory.value.unshift({
        type: 'diagnosis',
        timestamp: new Date().toISOString(),
        userId,
        path,
        result: diagnosis
      })
      
      // Limiter l'historique à 50 entrées
      if (diagnosticHistory.value.length > 50) {
        diagnosticHistory.value = diagnosticHistory.value.slice(0, 50)
      }
      
      return diagnosis
    } catch (error) {
      console.error('Error in diagnoseUserPermissions:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }
  
  /**
   * Comparer les permissions entre deux utilisateurs
   * @param {number} userId1 - ID du premier utilisateur
   * @param {number} userId2 - ID du deuxième utilisateur
   * @param {string} path - Chemin à comparer
   * @returns {Promise<Object>} Rapport de comparaison
   */
  const compareUserPermissions = async (userId1, userId2, path) => {
    if (!isAdmin.value) {
      throw new Error('Seuls les administrateurs peuvent effectuer des comparaisons')
    }
    
    isLoading.value = true
    
    try {
      const comparison = await permissionDiagnosticService.compareUserPermissions(userId1, userId2, path)
      
      // Sauvegarder la comparaison
      lastComparison.value = comparison
      diagnosticHistory.value.unshift({
        type: 'comparison',
        timestamp: new Date().toISOString(),
        userId1,
        userId2,
        path,
        result: comparison
      })
      
      return comparison
    } catch (error) {
      console.error('Error in compareUserPermissions:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }
  
  /**
   * Valider la cohérence du cache de permissions
   * @param {number} userId - ID de l'utilisateur (optionnel)
   * @param {string} path - Chemin à valider (optionnel)
   * @returns {Promise<Object>} Rapport de validation
   */
  const validatePermissionCache = async (userId = null, path = null) => {
    isLoading.value = true
    
    try {
      const validation = await permissionDiagnosticService.validatePermissionCache(userId, path)
      
      // Ajouter à l'historique
      diagnosticHistory.value.unshift({
        type: 'cache_validation',
        timestamp: new Date().toISOString(),
        userId,
        path,
        result: validation
      })
      
      return validation
    } catch (error) {
      console.error('Error in validatePermissionCache:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }
  
  /**
   * Simuler la session d'un utilisateur
   * @param {number} userId - ID de l'utilisateur à simuler
   * @param {string} path - Chemin à tester
   * @returns {Promise<Object>} Résultat de la simulation
   */
  const simulateUserSession = async (userId, path) => {
    if (!isAdmin.value) {
      throw new Error('Seuls les administrateurs peuvent simuler des sessions')
    }
    
    isLoading.value = true
    
    try {
      const simulation = await permissionDiagnosticService.simulateUserSession(userId, path)
      
      // Ajouter à l'historique
      diagnosticHistory.value.unshift({
        type: 'simulation',
        timestamp: new Date().toISOString(),
        userId,
        path,
        result: simulation
      })
      
      return simulation
    } catch (error) {
      console.error('Error in simulateUserSession:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }
  
  /**
   * Résoudre automatiquement les problèmes de cache détectés
   * @param {Object} diagnosis - Diagnostic contenant les problèmes
   * @returns {Promise<Object>} Résultat de la résolution
   */
  const resolvePermissionIssues = async (diagnosis) => {
    if (!diagnosis || !diagnosis.diagnosis) {
      throw new Error('Diagnostic invalide fourni')
    }
    
    const resolutionSteps = []
    let success = true
    
    try {
      // Résoudre les problèmes de cache
      if (diagnosis.diagnosis.issue_type === 'cache_inconsistency') {
        resolutionSteps.push({
          action: 'clear_frontend_cache',
          description: 'Invalidation du cache frontend',
          status: 'in_progress'
        })
        
        // Invalider le cache frontend
        clearPermissionsCache(diagnosis.path)
        
        resolutionSteps[resolutionSteps.length - 1].status = 'completed'
        resolutionSteps[resolutionSteps.length - 1].result = 'Cache frontend invalidé'
      }
      
      // Autres résolutions automatiques peuvent être ajoutées ici
      
      return {
        success,
        steps: resolutionSteps,
        message: success ? 'Problèmes résolus avec succès' : 'Certains problèmes n\'ont pas pu être résolus automatiquement',
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      console.error('Error resolving permission issues:', error)
      return {
        success: false,
        steps: resolutionSteps,
        error: error.message,
        timestamp: new Date().toISOString()
      }
    }
  }
  
  /**
   * Obtenir un résumé des problèmes de permissions pour un utilisateur
   * @param {number} userId - ID de l'utilisateur
   * @param {Array} paths - Liste des chemins à vérifier
   * @returns {Promise<Object>} Résumé des problèmes
   */
  const getPermissionsSummary = async (userId, paths = []) => {
    if (!isAdmin.value) {
      throw new Error('Seuls les administrateurs peuvent obtenir des résumés')
    }
    
    isLoading.value = true
    
    try {
      const summary = {
        user_id: userId,
        total_paths_checked: paths.length,
        issues_found: 0,
        cache_inconsistencies: 0,
        permission_mismatches: 0,
        group_issues: 0,
        paths_with_issues: [],
        recommendations: []
      }
      
      // Diagnostiquer chaque chemin
      for (const path of paths) {
        try {
          const diagnosis = await diagnoseUserPermissions(userId, path)
          
          if (diagnosis.diagnosis.issues.length > 0) {
            summary.issues_found++
            summary.paths_with_issues.push({
              path,
              issues: diagnosis.diagnosis.issues,
              severity: diagnosis.diagnosis.severity
            })
            
            // Compter les types de problèmes
            for (const issue of diagnosis.diagnosis.issues) {
              switch (issue.type) {
                case 'cache_inconsistency':
                  summary.cache_inconsistencies++
                  break
                case 'permission_mismatch':
                  summary.permission_mismatches++
                  break
                case 'no_groups':
                  summary.group_issues++
                  break
              }
            }
            
            // Ajouter les recommandations
            summary.recommendations.push(...diagnosis.diagnosis.recommendations)
          }
        } catch (error) {
          console.warn(`Failed to diagnose path ${path}:`, error)
        }
      }
      
      // Dédupliquer les recommandations
      summary.recommendations = [...new Set(summary.recommendations)]
      
      return summary
    } catch (error) {
      console.error('Error getting permissions summary:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }
  
  /**
   * Effacer l'historique des diagnostics
   */
  const clearDiagnosticHistory = () => {
    diagnosticHistory.value = []
    lastDiagnosis.value = null
    lastComparison.value = null
  }
  
  /**
   * Obtenir les statistiques des diagnostics
   * @returns {Object} Statistiques
   */
  const getDiagnosticStats = computed(() => {
    const stats = {
      total_diagnostics: 0,
      total_comparisons: 0,
      total_validations: 0,
      total_simulations: 0,
      issues_found: 0,
      cache_issues: 0
    }
    
    for (const entry of diagnosticHistory.value) {
      switch (entry.type) {
        case 'diagnosis':
          stats.total_diagnostics++
          if (entry.result.diagnosis && entry.result.diagnosis.issues.length > 0) {
            stats.issues_found++
            if (entry.result.diagnosis.issue_type === 'cache_inconsistency') {
              stats.cache_issues++
            }
          }
          break
        case 'comparison':
          stats.total_comparisons++
          break
        case 'cache_validation':
          stats.total_validations++
          break
        case 'simulation':
          stats.total_simulations++
          break
      }
    }
    
    return stats
  })
  
  /**
   * Exporter l'historique des diagnostics
   * @returns {string} JSON de l'historique
   */
  const exportDiagnosticHistory = () => {
    return JSON.stringify({
      exported_at: new Date().toISOString(),
      exported_by: currentUser.value?.username || 'unknown',
      history: diagnosticHistory.value,
      stats: getDiagnosticStats.value
    }, null, 2)
  }
  
  return {
    // État
    isLoading,
    lastDiagnosis,
    lastComparison,
    diagnosticHistory,
    isAdmin,
    
    // Méthodes principales
    diagnoseUserPermissions,
    compareUserPermissions,
    validatePermissionCache,
    simulateUserSession,
    
    // Utilitaires
    resolvePermissionIssues,
    getPermissionsSummary,
    clearDiagnosticHistory,
    exportDiagnosticHistory,
    
    // Statistiques
    getDiagnosticStats
  }
}