/**
 * Service centralisé pour la gestion des tokens d'authentification
 * Harmonise l'accès aux tokens à travers toute l'application
 */

const TOKEN_KEY = 'auth_token'

export class TokenService {
  /**
   * Récupère le token d'authentification
   * @returns {string|null} Le token ou null si non trouvé
   */
  static getToken() {
    return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY)
  }

  /**
   * Stocke le token d'authentification
   * @param {string} token - Le token à stocker
   * @param {boolean} rememberMe - Si true, stocke dans localStorage, sinon sessionStorage
   */
  static setToken(token, rememberMe = true) {
    if (rememberMe) {
      localStorage.setItem(TOKEN_KEY, token)
      sessionStorage.removeItem(TOKEN_KEY) // Nettoie l'autre storage
    } else {
      sessionStorage.setItem(TOKEN_KEY, token)
      localStorage.removeItem(TOKEN_KEY) // Nettoie l'autre storage
    }
  }

  /**
   * Supprime le token d'authentification
   */
  static removeToken() {
    localStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(TOKEN_KEY)
  }

  /**
   * Vérifie si un token existe
   * @returns {boolean} True si un token existe
   */
  static hasToken() {
    return !!this.getToken()
  }

  /**
   * Récupère les headers d'authentification pour les requêtes API
   * @returns {Object} Headers avec Authorization si token disponible
   */
  static getAuthHeaders() {
    const token = this.getToken()
    return token ? { 'Authorization': `Bearer ${token}` } : {}
  }

  /**
   * Nettoie les anciens tokens avec des noms différents (migration)
   */
  static cleanupLegacyTokens() {
    // Nettoie les anciens noms de tokens
    localStorage.removeItem('token')
    localStorage.removeItem('access_token')
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('access_token')
  }
}

export default TokenService