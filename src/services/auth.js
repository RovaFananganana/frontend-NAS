// services/auth.js
import { authAPI } from './api'
import TokenService from './tokenService'

const USER_KEY = 'user_data'

// Gestion du token (délégué au TokenService)
export const getToken = () => TokenService.getToken()
export const setToken = (token, rememberMe = true) => TokenService.setToken(token, rememberMe)
export const removeToken = () => TokenService.removeToken()

// Gestion des données utilisateur
export const getUser = () => {
  const userData = localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY)
  return userData ? JSON.parse(userData) : null
}

export const setUser = (user, rememberMe = true) => {
  if (rememberMe) {
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  } else {
    sessionStorage.setItem(USER_KEY, JSON.stringify(user))
  }
}

export const removeUser = () => {
  localStorage.removeItem(USER_KEY)
  sessionStorage.removeItem(USER_KEY)
}

// Fonction de connexion
export const login = async (username, password, rememberMe = false) => {
  try {
    const response = await authAPI.login(username, password)
    const { access_token, user } = response.data

    // Stockage cohérent
    setToken(access_token, rememberMe)
    setUser(user, rememberMe)

    return user
  } catch (error) {
    throw new Error(error.response?.data?.msg || 'Erreur de connexion')
  }
}

// Fonction de déconnexion
export const logout = () => {
  removeToken()
  removeUser()
}

// Vérifier si l'utilisateur est authentifié
export const isAuthenticated = () => {
  return !!getToken()
}

// Récupérer les données utilisateur courantes
export const getCurrentUser = async () => {
  try {
    const response = await authAPI.getCurrentUser()
    const user = response.data

    // récupérer rememberMe en fonction de là où est stocké le token
    const rememberMe = !!localStorage.getItem('auth_token')
    setUser(user, rememberMe)

    return user
  } catch (error) {
    logout()
    throw error
  }
}

// Vérifier si l'utilisateur est admin
export const isAdmin = () => {
  const user = getUser()
  return user?.role === 'ADMIN'
}
