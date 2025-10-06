// ============================================================================
// 🧠 fileService.js — Service API de gestion des fichiers
// Description : Centralise les appels à l’API Flask NAS_DOC_BACKEND
// Auteur : [Ton Nom]
// Projet : NAS_DOC_FRONTEND (ASECNA Madagascar)
// ============================================================================

import axios from 'axios'

// URL de base du backend Flask
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/files'

export function useFileService() {
  /**
   * Liste les fichiers d’un dossier donné
   * @param {string} path - Chemin du dossier à explorer
   */
  const list = (path = '/') => {
    return axios.get(`${API_BASE_URL}`, { params: { path } })
  }

  /**
   * Supprime un fichier ou dossier
   * @param {string} path - Chemin complet de l’élément à supprimer
   */
  const deleteFile = (path) => {
    return axios.delete(`${API_BASE_URL}`, { params: { path } })
  }

  /**
   * Crée un nouveau dossier
   * @param {string} name - Nom du dossier à créer
   * @param {string} parent - Chemin du dossier parent
   */
  const createFolder = (name, parent = '/') => {
    return axios.post(`${API_BASE_URL}/folder`, { name, parent })
  }

  /**
   * Renomme un fichier ou dossier
   * @param {string} oldPath - Chemin actuel
   * @param {string} newName - Nouveau nom
   */
  const rename = (oldPath, newName) => {
    return axios.put(`${API_BASE_URL}/rename`, { oldPath, newName })
  }

  /**
   * Upload de fichier
   * @param {FormData} formData - Données de fichier
   */
  const upload = (formData) => {
    return axios.post(`${API_BASE_URL}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  }

  return { list, delete: deleteFile, createFolder, rename, upload }
}
