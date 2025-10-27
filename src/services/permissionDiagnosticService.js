// services/permissionDiagnosticService.js

/**
 * Service de diagnostic des permissions
 * Fournit des outils pour analyser et diagnostiquer les problèmes de permissions utilisateur
 */

import { nasAPI } from './nasAPI.js'
import httpClient from './httpClient.js'
import TokenService from './tokenService.js'

class PermissionDiagnosticService {
  constructor() {
    this.baseURL = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5001') + '/permissions'
  }

  /**
   * Obtenir les en-têtes d'autorisation
   */
  getHeaders() {
    const token = TokenService.getToken()
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }

  /**
   * Effectuer une requête API avec gestion d'erreur
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`
    const config = {
      headers: this.getHeaders(),
      ...options
    }

    try {
      const axios = (await import('axios')).default
      const response = await axios.request({
        url,
        method: config.method || 'GET',
        data: config.body ? JSON.parse(config.body) : undefined,
        headers: config.headers
      })

      return response.data
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('token')
        window.location.href = '/login'
        throw new Error('Authentication required')
      }
      
      console.error('Permission diagnostic API error:', error)
      const errorData = error.response?.data || {}
      throw new Error(errorData.error || errorData.msg || error.message)
    }
  }

  /**
   * Diagnostiquer les permissions d'un utilisateur spécifique pour un chemin donné
   * @param {number} userId - ID de l'utilisateur à diagnostiquer
   * @param {string} path - Chemin du fichier/dossier à analyser
   * @returns {Promise<Object>} Rapport de diagnostic détaillé
   */
  async diagnoseUserPermissions(userId, path) {
    try {
      // Obtenir les informations de base de l'utilisateur
      const userInfo = await this.getUserInfo(userId)
      
      // Vérifier les permissions actuelles via l'API existante
      const currentPermissions = await this.checkCurrentPermissions(path)
      
      // Obtenir les groupes de l'utilisateur avec leurs permissions
      const userGroups = await this.getUserGroups(userId)
      
      // Analyser les permissions attendues vs réelles
      const expectedPermissions = await this.calculateExpectedPermissions(userId, path, userGroups)
      
      // Vérifier l'état du cache
      const cacheStatus = await this.validatePermissionCache(userId, path)
      
      // Générer le rapport de diagnostic
      const diagnosis = this.generateDiagnosis(
        userInfo,
        path,
        currentPermissions,
        expectedPermissions,
        userGroups,
        cacheStatus
      )

      return {
        user: userInfo,
        path: path,
        current_permissions: currentPermissions,
        expected_permissions: expectedPermissions,
        user_groups: userGroups,
        cache_status: cacheStatus,
        diagnosis: diagnosis,
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      console.error('Error diagnosing user permissions:', error)
      throw new Error(`Diagnostic failed: ${error.message}`)
    }
  }

  /**
   * Comparer les permissions entre deux utilisateurs pour un chemin donné
   * @param {number} userId1 - ID du premier utilisateur
   * @param {number} userId2 - ID du deuxième utilisateur  
   * @param {string} path - Chemin à comparer
   * @returns {Promise<Object>} Rapport de comparaison
   */
  async compareUserPermissions(userId1, userId2, path) {
    try {
      // Diagnostiquer les permissions pour les deux utilisateurs
      const [user1Diagnosis, user2Diagnosis] = await Promise.all([
        this.diagnoseUserPermissions(userId1, path),
        this.diagnoseUserPermissions(userId2, path)
      ])

      // Analyser les différences
      const differences = this.analyzeDifferences(user1Diagnosis, user2Diagnosis)
      
      // Identifier les causes potentielles des différences
      const causes = this.identifyDifferenceCauses(user1Diagnosis, user2Diagnosis, differences)

      return {
        path: path,
        user1: user1Diagnosis,
        user2: user2Diagnosis,
        differences: differences,
        potential_causes: causes,
        recommendations: this.generateComparisonRecommendations(differences, causes),
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      console.error('Error comparing user permissions:', error)
      throw new Error(`Comparison failed: ${error.message}`)
    }
  }

  /**
   * Valider la cohérence du cache de permissions
   * @param {number} userId - ID de l'utilisateur (optionnel)
   * @param {string} path - Chemin à valider (optionnel)
   * @returns {Promise<Object>} Rapport de validation du cache
   */
  async validatePermissionCache(userId = null, path = null) {
    try {
      // Obtenir les permissions depuis le cache frontend (usePermissions)
      const frontendCache = await this.getFrontendCacheStatus(userId, path)
      
      // Obtenir les permissions depuis le backend
      const backendPermissions = path ? await nasAPI.checkPermissions(path) : null
      
      // Comparer les deux sources
      const inconsistencies = this.detectCacheInconsistencies(frontendCache, backendPermissions)
      
      return {
        frontend_cache: frontendCache,
        backend_permissions: backendPermissions,
        inconsistencies: inconsistencies,
        is_consistent: inconsistencies.length === 0,
        last_checked: new Date().toISOString()
      }
    } catch (error) {
      console.error('Error validating permission cache:', error)
      return {
        error: error.message,
        is_consistent: false,
        last_checked: new Date().toISOString()
      }
    }
  }

  /**
   * Simuler la session d'un utilisateur pour reproduire les problèmes
   * @param {number} userId - ID de l'utilisateur à simuler
   * @param {string} path - Chemin à tester
   * @returns {Promise<Object>} Résultat de la simulation
   */
  async simulateUserSession(userId, path) {
    try {
      // Obtenir le diagnostic complet
      const diagnosis = await this.diagnoseUserPermissions(userId, path)
      
      // Simuler les vérifications de permissions comme le ferait l'interface
      const simulationSteps = []
      
      // Étape 1: Chargement des permissions utilisateur
      simulationSteps.push({
        step: 'load_user_permissions',
        description: 'Chargement des permissions utilisateur',
        result: diagnosis.current_permissions,
        success: !!diagnosis.current_permissions
      })
      
      // Étape 2: Vérification des groupes
      simulationSteps.push({
        step: 'check_user_groups',
        description: 'Vérification des groupes utilisateur',
        result: diagnosis.user_groups,
        success: diagnosis.user_groups && diagnosis.user_groups.length > 0
      })
      
      // Étape 3: Validation du cache
      simulationSteps.push({
        step: 'validate_cache',
        description: 'Validation de la cohérence du cache',
        result: diagnosis.cache_status,
        success: diagnosis.cache_status.is_consistent
      })
      
      // Étape 4: Test d'accès final
      const finalAccess = this.determineFinalAccess(diagnosis)
      simulationSteps.push({
        step: 'final_access_check',
        description: 'Vérification finale de l\'accès',
        result: finalAccess,
        success: finalAccess.can_read
      })

      return {
        user_id: userId,
        path: path,
        simulation_steps: simulationSteps,
        final_diagnosis: diagnosis,
        overall_success: simulationSteps.every(step => step.success),
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      console.error('Error simulating user session:', error)
      throw new Error(`Simulation failed: ${error.message}`)
    }
  }

  /**
   * Obtenir les informations d'un utilisateur
   * @param {number} userId - ID de l'utilisateur
   * @returns {Promise<Object>} Informations utilisateur
   */
  async getUserInfo(userId) {
    try {
      // Utiliser l'API existante pour obtenir les infos utilisateur
      const response = await this.request(`/user-info/${userId}`)
      return response
    } catch (error) {
      // Fallback: créer un objet utilisateur basique
      return {
        id: userId,
        username: `User_${userId}`,
        role: 'user',
        error: 'Could not fetch user details'
      }
    }
  }

  /**
   * Obtenir les groupes d'un utilisateur avec leurs permissions détaillées
   * @param {number} userId - ID de l'utilisateur
   * @returns {Promise<Array>} Liste des groupes avec permissions
   */
  async getUserGroups(userId) {
    try {
      const response = await this.request(`/user-groups/${userId}`)
      return response.groups || []
    } catch (error) {
      console.warn('Could not fetch user groups:', error)
      return []
    }
  }

  /**
   * Vérifier les permissions actuelles via l'API existante
   * @param {string} path - Chemin à vérifier
   * @returns {Promise<Object>} Permissions actuelles
   */
  async checkCurrentPermissions(path) {
    try {
      const response = await nasAPI.checkPermissions(path)
      return response.permissions || {
        can_read: false,
        can_write: false,
        can_delete: false,
        can_share: false
      }
    } catch (error) {
      console.warn('Could not check current permissions:', error)
      return {
        can_read: false,
        can_write: false,
        can_delete: false,
        can_share: false,
        error: error.message
      }
    }
  }

  /**
   * Calculer les permissions attendues basées sur les groupes utilisateur
   * @param {number} userId - ID de l'utilisateur
   * @param {string} path - Chemin à analyser
   * @param {Array} userGroups - Groupes de l'utilisateur
   * @returns {Promise<Object>} Permissions attendues
   */
  async calculateExpectedPermissions(userId, path, userGroups) {
    // Logique pour calculer les permissions attendues
    // basée sur l'appartenance aux groupes et les permissions héritées
    
    let expectedPermissions = {
      can_read: false,
      can_write: false,
      can_delete: false,
      can_share: false,
      source: 'none'
    }

    // Parcourir les groupes et accumuler les permissions
    for (const group of userGroups) {
      if (group.permissions_on_path) {
        if (group.permissions_on_path.can_read) {
          expectedPermissions.can_read = true
          expectedPermissions.source = 'group'
        }
        if (group.permissions_on_path.can_write) {
          expectedPermissions.can_write = true
          expectedPermissions.source = 'group'
        }
        if (group.permissions_on_path.can_delete) {
          expectedPermissions.can_delete = true
          expectedPermissions.source = 'group'
        }
        if (group.permissions_on_path.can_share) {
          expectedPermissions.can_share = true
          expectedPermissions.source = 'group'
        }
      }
    }

    return expectedPermissions
  }

  /**
   * Obtenir l'état du cache frontend
   * @param {number} userId - ID de l'utilisateur
   * @param {string} path - Chemin à vérifier
   * @returns {Promise<Object>} État du cache frontend
   */
  async getFrontendCacheStatus(userId, path) {
    // Cette méthode devrait interagir avec le composable usePermissions
    // Pour l'instant, on simule la structure
    return {
      exists: false,
      age_minutes: null,
      permissions: null,
      source: 'not_cached'
    }
  }

  /**
   * Détecter les incohérences entre le cache et les permissions backend
   * @param {Object} frontendCache - État du cache frontend
   * @param {Object} backendPermissions - Permissions du backend
   * @returns {Array} Liste des incohérences détectées
   */
  detectCacheInconsistencies(frontendCache, backendPermissions) {
    const inconsistencies = []

    if (!frontendCache || !backendPermissions) {
      return inconsistencies
    }

    const frontendPerms = frontendCache.permissions
    const backendPerms = backendPermissions.permissions

    if (!frontendPerms || !backendPerms) {
      return inconsistencies
    }

    // Comparer chaque permission
    const permissionTypes = ['can_read', 'can_write', 'can_delete', 'can_share']
    
    for (const permType of permissionTypes) {
      if (frontendPerms[permType] !== backendPerms[permType]) {
        inconsistencies.push({
          type: 'permission_mismatch',
          permission: permType,
          frontend_value: frontendPerms[permType],
          backend_value: backendPerms[permType],
          description: `Cache frontend et backend ne correspondent pas pour ${permType}`
        })
      }
    }

    return inconsistencies
  }

  /**
   * Générer un diagnostic basé sur l'analyse des permissions
   * @param {Object} userInfo - Informations utilisateur
   * @param {string} path - Chemin analysé
   * @param {Object} currentPermissions - Permissions actuelles
   * @param {Object} expectedPermissions - Permissions attendues
   * @param {Array} userGroups - Groupes utilisateur
   * @param {Object} cacheStatus - État du cache
   * @returns {Object} Diagnostic généré
   */
  generateDiagnosis(userInfo, path, currentPermissions, expectedPermissions, userGroups, cacheStatus) {
    const issues = []
    const recommendations = []

    // Vérifier si les permissions actuelles correspondent aux attendues
    const permissionTypes = ['can_read', 'can_write', 'can_delete', 'can_share']
    
    for (const permType of permissionTypes) {
      if (currentPermissions[permType] !== expectedPermissions[permType]) {
        issues.push({
          type: 'permission_mismatch',
          permission: permType,
          expected: expectedPermissions[permType],
          actual: currentPermissions[permType],
          description: `Permission ${permType} ne correspond pas à l'attendu`
        })
      }
    }

    // Vérifier les problèmes de cache
    if (!cacheStatus.is_consistent) {
      issues.push({
        type: 'cache_inconsistency',
        description: 'Le cache de permissions n\'est pas cohérent',
        details: cacheStatus.inconsistencies
      })
      
      recommendations.push('Invalider le cache de permissions pour cet utilisateur')
    }

    // Vérifier les groupes utilisateur
    if (userGroups.length === 0) {
      issues.push({
        type: 'no_groups',
        description: 'L\'utilisateur n\'appartient à aucun groupe'
      })
      
      recommendations.push('Vérifier l\'appartenance aux groupes de l\'utilisateur')
    }

    // Déterminer le type de problème principal
    let issueType = 'no_issues'
    if (issues.some(i => i.type === 'cache_inconsistency')) {
      issueType = 'cache_inconsistency'
    } else if (issues.some(i => i.type === 'permission_mismatch')) {
      issueType = 'permission_mismatch'
    } else if (issues.some(i => i.type === 'no_groups')) {
      issueType = 'group_membership_issue'
    }

    return {
      issue_type: issueType,
      description: this.getIssueDescription(issueType),
      issues: issues,
      recommendations: recommendations,
      severity: this.calculateSeverity(issues),
      user_groups: userGroups,
      permission_chain: this.buildPermissionChain(userInfo, userGroups, expectedPermissions)
    }
  }

  /**
   * Analyser les différences entre deux diagnostics utilisateur
   * @param {Object} user1Diagnosis - Diagnostic du premier utilisateur
   * @param {Object} user2Diagnosis - Diagnostic du deuxième utilisateur
   * @returns {Object} Analyse des différences
   */
  analyzeDifferences(user1Diagnosis, user2Diagnosis) {
    const differences = {
      permissions: {},
      groups: {},
      cache_status: {},
      issues: {}
    }

    // Comparer les permissions
    const permissionTypes = ['can_read', 'can_write', 'can_delete', 'can_share']
    for (const permType of permissionTypes) {
      const user1Perm = user1Diagnosis.current_permissions[permType]
      const user2Perm = user2Diagnosis.current_permissions[permType]
      
      if (user1Perm !== user2Perm) {
        differences.permissions[permType] = {
          user1: user1Perm,
          user2: user2Perm,
          different: true
        }
      }
    }

    // Comparer les groupes
    const user1Groups = user1Diagnosis.user_groups.map(g => g.name).sort()
    const user2Groups = user2Diagnosis.user_groups.map(g => g.name).sort()
    
    differences.groups = {
      user1_groups: user1Groups,
      user2_groups: user2Groups,
      common_groups: user1Groups.filter(g => user2Groups.includes(g)),
      user1_only: user1Groups.filter(g => !user2Groups.includes(g)),
      user2_only: user2Groups.filter(g => !user1Groups.includes(g))
    }

    // Comparer l'état du cache
    differences.cache_status = {
      user1_consistent: user1Diagnosis.cache_status.is_consistent,
      user2_consistent: user2Diagnosis.cache_status.is_consistent,
      both_consistent: user1Diagnosis.cache_status.is_consistent && user2Diagnosis.cache_status.is_consistent
    }

    return differences
  }

  /**
   * Identifier les causes potentielles des différences
   * @param {Object} user1Diagnosis - Diagnostic du premier utilisateur
   * @param {Object} user2Diagnosis - Diagnostic du deuxième utilisateur
   * @param {Object} differences - Différences analysées
   * @returns {Array} Causes potentielles
   */
  identifyDifferenceCauses(user1Diagnosis, user2Diagnosis, differences) {
    const causes = []

    // Différences de groupes
    if (differences.groups.user1_only.length > 0 || differences.groups.user2_only.length > 0) {
      causes.push({
        type: 'group_membership_difference',
        description: 'Les utilisateurs appartiennent à des groupes différents',
        details: {
          user1_exclusive_groups: differences.groups.user1_only,
          user2_exclusive_groups: differences.groups.user2_only
        }
      })
    }

    // Problèmes de cache
    if (!differences.cache_status.both_consistent) {
      causes.push({
        type: 'cache_inconsistency',
        description: 'Incohérence dans le cache de permissions',
        details: {
          user1_cache_issues: user1Diagnosis.cache_status.inconsistencies,
          user2_cache_issues: user2Diagnosis.cache_status.inconsistencies
        }
      })
    }

    // Permissions directes différentes
    if (Object.keys(differences.permissions).length > 0) {
      causes.push({
        type: 'direct_permission_difference',
        description: 'Permissions directes différentes entre les utilisateurs',
        details: differences.permissions
      })
    }

    return causes
  }

  /**
   * Générer des recommandations basées sur la comparaison
   * @param {Object} differences - Différences analysées
   * @param {Array} causes - Causes identifiées
   * @returns {Array} Recommandations
   */
  generateComparisonRecommendations(differences, causes) {
    const recommendations = []

    for (const cause of causes) {
      switch (cause.type) {
        case 'group_membership_difference':
          recommendations.push('Vérifier et synchroniser l\'appartenance aux groupes des utilisateurs')
          break
        case 'cache_inconsistency':
          recommendations.push('Invalider et recharger le cache de permissions pour les deux utilisateurs')
          break
        case 'direct_permission_difference':
          recommendations.push('Examiner les permissions directes assignées aux utilisateurs')
          break
      }
    }

    if (recommendations.length === 0) {
      recommendations.push('Aucune action corrective nécessaire - les différences semblent normales')
    }

    return recommendations
  }

  /**
   * Déterminer l'accès final basé sur le diagnostic
   * @param {Object} diagnosis - Diagnostic complet
   * @returns {Object} Accès final déterminé
   */
  determineFinalAccess(diagnosis) {
    // Logique pour déterminer l'accès final
    // en tenant compte de tous les facteurs
    
    const currentPerms = diagnosis.current_permissions
    const expectedPerms = diagnosis.expected_permissions
    
    // Si le cache est incohérent, utiliser les permissions attendues
    if (!diagnosis.cache_status.is_consistent) {
      return {
        ...expectedPerms,
        source: 'expected_due_to_cache_issue'
      }
    }
    
    // Sinon, utiliser les permissions actuelles
    return {
      ...currentPerms,
      source: 'current_permissions'
    }
  }

  /**
   * Construire la chaîne de permissions pour traçabilité
   * @param {Object} userInfo - Informations utilisateur
   * @param {Array} userGroups - Groupes utilisateur
   * @param {Object} expectedPermissions - Permissions attendues
   * @returns {Array} Chaîne de permissions
   */
  buildPermissionChain(userInfo, userGroups, expectedPermissions) {
    const chain = []

    // Niveau utilisateur
    chain.push({
      level: 'user',
      name: userInfo.username,
      permissions: {},
      source: 'direct'
    })

    // Niveau groupes
    for (const group of userGroups) {
      if (group.permissions_on_path) {
        chain.push({
          level: 'group',
          name: group.name,
          permissions: group.permissions_on_path,
          source: 'group_membership'
        })
      }
    }

    return chain
  }

  /**
   * Obtenir la description d'un type de problème
   * @param {string} issueType - Type de problème
   * @returns {string} Description
   */
  getIssueDescription(issueType) {
    const descriptions = {
      'no_issues': 'Aucun problème détecté',
      'cache_inconsistency': 'Le cache de permissions contient des données obsolètes',
      'permission_mismatch': 'Les permissions actuelles ne correspondent pas aux attendues',
      'group_membership_issue': 'Problème avec l\'appartenance aux groupes utilisateur'
    }
    
    return descriptions[issueType] || 'Problème non identifié'
  }

  /**
   * Calculer la sévérité des problèmes
   * @param {Array} issues - Liste des problèmes
   * @returns {string} Niveau de sévérité
   */
  calculateSeverity(issues) {
    if (issues.length === 0) return 'none'
    
    const hasPermissionMismatch = issues.some(i => i.type === 'permission_mismatch')
    const hasCacheIssue = issues.some(i => i.type === 'cache_inconsistency')
    
    if (hasPermissionMismatch) return 'high'
    if (hasCacheIssue) return 'medium'
    
    return 'low'
  }
}

// Créer et exporter l'instance singleton
export const permissionDiagnosticService = new PermissionDiagnosticService()
export default permissionDiagnosticService