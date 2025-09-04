// src/services/auth.js
import { authAPI } from "./api";

/**
 * Fonction de connexion
 * @param {string} username
 * @param {string} password 
 * @returns {Promise<Object>} user (avec token et role)
 */
export async function login(username, password) {
  try {
    // Appel à l'API login
    const response = await authAPI.login({ username, password });

    // Backend renvoie { access_token, user }
    const { access_token, user } = response;

    if (!access_token) throw new Error('Token non reçu');

    // Sauvegarde du token et des infos utilisateur
    localStorage.setItem('token', access_token);
    localStorage.setItem('user', JSON.stringify(user));

    return user;
  } catch (error) {
    console.error('Erreur de connexion:', error);
    throw error;
  }
}

/**
 * Déconnexion : suppression du token et user
 */
export function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login'; // redirection après logout
}

/**
 * Récupère le token actuel
 */
export function getToken() {
  return localStorage.getItem('token');
}

/**
 * Récupère les infos utilisateur actuel
 */
export function getCurrentUser() {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
}
