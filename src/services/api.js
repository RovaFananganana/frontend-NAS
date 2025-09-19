// services/api.js
import axios from "axios";
import { getToken, removeToken } from "./auth";
import router from "../router";
import { setupApiPerformanceTracking } from "./performance";

// ⚠️ Avec Vite, on utilise import.meta.env
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5001";

// Configuration de base d'axios
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Setup performance tracking
setupApiPerformanceTracking(api);

// Intercepteur pour ajouter le token d'authentification
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercepteur pour gérer les erreurs de réponse
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      removeToken();
      router.push("/login");
    }
    return Promise.reject(error);
  }
);

// ========== AUTH API ==========
export const authAPI = {
  login: (username, password) =>
    api.post("/auth/login", { username, password }),

  getCurrentUser: () => api.get("/users/me"),
};

// ========== USER API ==========
export const userAPI = {
  // Profile
  getProfile: () => api.get("/users/me"),
  updateProfile: (data) => api.put("/users/me", data),

  // Dashboard
  getDashboard: () => api.get("/users/dashboard"),

  // Files and Folders
  getFolders: (parentId = null) =>
    api.get("/users/my-folders", {
      params: parentId ? { parent_id: parentId } : { root_only: true },
    }),

  getFiles: (folderId = null) =>
    api.get("/users/my-files", {
      params: folderId ? { folder_id: folderId } : { root_only: true },
    }),

  createFolder: (name, parentId = null) =>
    api.post("/users/folders", { name, parent_id: parentId }),

  updateFolder: (folderId, name) =>
    api.put(`/users/folders/${folderId}`, { name }),

  deleteFolder: (folderId) => api.delete(`/users/folders/${folderId}`),

  deleteFile: (fileId) => api.delete(`/users/files/${fileId}`),

  updateFile: (fileId, data) => api.put(`/users/files/${fileId}`, data),

  moveFile: (fileId, data) => api.put(`/users/files/${fileId}/move`, data),

  moveFolder: (folderId, data) => api.put(`/users/folders/${folderId}/move`, data),

  // Storage
  getStorageInfo: () => api.get("/users/storage-info"),
  
  //fileupload
  uploadFile: (formData) =>
    api.post("/users/files/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  // Logs
  getLogs: (page = 1, perPage = 20) =>
    api.get("/users/my-logs", { params: { page, per_page: perPage } }),
};

// ========== ADMIN API ==========
export const adminAPI = {
  // Users Management
  getUsers: () => api.get("/admin/users"),
  createUser: (userData) => api.post("/admin/users", userData),
  updateUser: (userId, userData) =>
    api.put(`/admin/users/${userId}`, userData),
  deleteUser: (userId) => api.delete(`/admin/users/${userId}`),

  // Groups Management
  getGroups: () => api.get("/admin/groups"),
  createGroup: (name) => api.post("/admin/groups", { name }),
  updateGroup: (groupId, name) =>
    api.put(`/admin/groups/${groupId}`, { name }),
  deleteGroup: (groupId) => api.delete(`/admin/groups/${groupId}`),
  addUserToGroup: (groupId, userId) =>
    api.post(`/admin/groups/${groupId}/users`, { user_id: userId }),
  removeUserFromGroup: (groupId, userId) =>
    api.delete(`/admin/groups/${groupId}/users/${userId}`),

  // Files Management
  getAllFolders: () => api.get("/admin/folders"),
  getAllFiles: () => api.get("/admin/files"),
  createAdminFolder: (name, ownerId, parentId = null) =>
    api.post("/admin/folders", {
      name,
      owner_id: ownerId,
      parent_id: parentId,
    }),
  deleteAdminFolder: (folderId) => api.delete(`/admin/folders/${folderId}`),
  
  uploadFile: (formData) =>
    api.post("/admin/files/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  // Logs and Stats
  getLogs: (page = 1, perPage = 50) =>
    api.get("/admin/logs", { params: { page, per_page: perPage } }),
  getStats: (syncWithNas = false) => 
    api.get("/admin/stats", { params: { sync: syncWithNas } }),
  
  // NAS Synchronization
  syncWithNas: (options = {}) =>
    api.post("/admin/sync-nas", {
      dry_run: options.dryRun || false,
      max_depth: options.maxDepth || 10
    }),
  
  getNasStatus: () => api.get("/admin/nas-status"),
};

const permissionAPI = {
  // Gestion des permissions de dossiers
  getFolderPermissions: (folderId) => 
    api.get(`/permissions/folders/${folderId}`),
  
  setFolderUserPermission: (folderId, userId, permissions) =>
    api.post(`/permissions/folders/${folderId}/user/${userId}`, permissions),
  
  setFolderGroupPermission: (folderId, groupId, permissions) =>
    api.post(`/permissions/folders/${folderId}/group/${groupId}`, permissions),
  
  deleteFolderPermission: (folderId, permissionId) =>
    api.delete(`/permissions/folders/${folderId}/permissions/${permissionId}`),

  // Gestion des permissions de fichiers
  getFilePermissions: (fileId) => 
    api.get(`/permissions/files/${fileId}`),
  
  setFileUserPermission: (fileId, userId, permissions) =>
    api.post(`/permissions/files/${fileId}/user/${userId}`, permissions),
  
  setFileGroupPermission: (fileId, groupId, permissions) =>
    api.post(`/permissions/files/${fileId}/group/${groupId}`, permissions),
  
  deleteFilePermission: (fileId, permissionId) =>
    api.delete(`/permissions/files/${fileId}/permissions/${permissionId}`),
  getFilePermissions: (fileId) => 
    api.get(`/permissions/files/${fileId}`),
  
  setFileUserPermission: (fileId, userId, permissions) =>
    api.post(`/permissions/files/${fileId}/user/${userId}`, permissions),
  
  setFileGroupPermission: (fileId, groupId, permissions) =>
    api.post(`/permissions/files/${fileId}/group/${groupId}`, permissions),
  
  deleteFilePermission: (fileId, permissionId) =>
    api.delete(`/permissions/files/${fileId}/permissions/${permissionId}`),

  // Récupération des données
  getAllResources: () => 
    api.get('/permissions/resources'),
  
  getUserEffectivePermissions: (userId) =>
    api.get(`/permissions/effective/${userId}`),

  // Permissions en lot
  setBatchFolderPermissions: (data) =>
    api.post('/permissions/batch/folders', data),

  // Helpers pour les permissions
  getPermissionMatrix: () =>
    api.get('/permissions/matrix'),
  
  exportPermissions: () =>
    api.get('/permissions/export')
}

// Étendez votre adminAPI existant
Object.assign(adminAPI, permissionAPI)

export { permissionAPI }
export default adminAPI