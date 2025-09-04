// src/services/api.js
import { getToken } from './auth';

const API_BASE = 'http://127.0.0.1:5001'; // Adresse de ton backend

async function apiRequest(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  if (response.status === 401) {
    // Token invalide ou expiré
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    return;
  }

  if (!response.ok) {
    const err = await response.json().catch(() => null);
    throw new Error(err?.msg || `API error: ${response.status}`);
  }

  return response.json();
}

// === Auth ===
export const authAPI = {
  login: ({ username, password }) =>
    apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    })
};

// === Admin endpoints ===
export const adminAPI = {
  getUsers: () => apiRequest('/admin/users'),
  createUser: (userData) => apiRequest('/admin/users', { method: 'POST', body: JSON.stringify(userData) }),
  updateUser: (id, userData) => apiRequest(`/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(userData) }),
  deleteUser: (id) => apiRequest(`/admin/users/${id}`, { method: 'DELETE' }),

  getGroups: () => apiRequest('/admin/groups'),
  createGroup: (groupData) => apiRequest('/admin/groups', { method: 'POST', body: JSON.stringify(groupData) }),
  updateGroup: (id, groupData) => apiRequest(`/admin/groups/${id}`, { method: 'PUT', body: JSON.stringify(groupData) }),
  deleteGroup: (id) => apiRequest(`/admin/groups/${id}`, { method: 'DELETE' }),
  addUserToGroup: (groupId, userId) => apiRequest(`/admin/groups/${groupId}/users`, { method: 'POST', body: JSON.stringify({ user_id: userId }) }),
  removeUserFromGroup: (groupId, userId) => apiRequest(`/admin/groups/${groupId}/users/${userId}`, { method: 'DELETE' }),

  getFolders: () => apiRequest('/admin/folders'),
  createFolder: (folderData) => apiRequest('/admin/folders', { method: 'POST', body: JSON.stringify(folderData) }),
  deleteFolder: (id) => apiRequest(`/admin/folders/${id}`, { method: 'DELETE' }),

  getFiles: () => apiRequest('/admin/files'),

  getLogs: (page = 1, perPage = 50) => apiRequest(`/admin/logs?page=${page}&per_page=${perPage}`),
  getStats: () => apiRequest('/admin/stats')
};

// === User endpoints ===
export const userAPI = {
  getProfile: () => apiRequest('/users/me'),
  updateProfile: (userData) => apiRequest('/users/me', { method: 'PUT', body: JSON.stringify(userData) }),

  getFolders: (parentId, rootOnly) => {
    let url = '/users/my-folders?';
    if (parentId) url += `parent_id=${parentId}&`;
    if (rootOnly) url += 'root_only=true';
    return apiRequest(url);
  },
  createFolder: (folderData) => apiRequest('/users/folders', { method: 'POST', body: JSON.stringify(folderData) }),
  updateFolder: (id, folderData) => apiRequest(`/users/folders/${id}`, { method: 'PUT', body: JSON.stringify(folderData) }),
  deleteFolder: (id) => apiRequest(`/users/folders/${id}`, { method: 'DELETE' }),

  getFiles: (folderId, rootOnly) => {
    let url = '/users/my-files?';
    if (folderId) url += `folder_id=${folderId}&`;
    if (rootOnly) url += 'root_only=true';
    return apiRequest(url);
  },
  deleteFile: (id) => apiRequest(`/users/files/${id}`, { method: 'DELETE' }),

  getStorageInfo: () => apiRequest('/users/storage-info'),
  getLogs: (page = 1, perPage = 20) => apiRequest(`/users/my-logs?page=${page}&per_page=${perPage}`),
  getDashboard: () => apiRequest('/users/dashboard')
};
