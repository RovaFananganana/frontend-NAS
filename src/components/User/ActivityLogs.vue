<template>
  <div class="activity-logs-viewer">
    <div class="header">
      <h3>Journal d'Activité</h3>
      <div class="controls">
        <button @click="load" :disabled="loading" class="btn btn-primary btn-sm">
          <i class="fas fa-sync-alt mr-2" :class="{ 'fa-spin': loading }"></i>
          Actualiser
        </button>
        <div class="text-sm text-gray-500">Total : {{ total }}</div>
      </div>
    </div>

    <div v-if="error" class="alert alert-error mb-4">{{ error }}</div>

    <!-- Filters -->
    <div class="filters-section">
      <h4>Filtres</h4>
      <div class="filters-grid">
        <div class="filter-group">
          <label>Action:</label>
          <select v-model="filters.action" @change="load">
            <option value="">Toutes les actions</option>
            <option value="ACCESS_FOLDER">Lecture de dossier</option>
            <option value="ACCESS_FILE">Lecture de fichier</option>
            <option value="DOWNLOAD_FILE">Téléchargement</option>
            <option value="CREATE_FILE">Création de fichier</option>
            <option value="UPLOAD_FILE">Upload de fichier</option>
            <option value="COPY_FILE">Copie de fichier</option>
            <option value="COPY_FOLDER">Copie de dossier</option>
            <option value="DELETE_FILE">Suppression de fichier</option>
            <option value="DELETE_FOLDER">Suppression de dossier</option>
            <option value="MOVE_FILE">Déplacement de fichier</option>
            <option value="MOVE_FOLDER">Déplacement de dossier</option>
            <option value="RENAME_FILE">Renommage de fichier</option>
            <option value="RENAME_FOLDER">Renommage de dossier</option>
            <option value="CREATE_FOLDER">Création de dossier</option>
            <option value="LOGIN">Connexion</option>
            <option value="LOGOUT">Déconnexion</option>
            <option value="COPY">Copie</option>
            <option value="SHARE">Partage</option>
            <option value="ADD_FAVORITE">Ajout aux favoris</option>
            <option value="REMOVE_FAVORITE">Retrait des favoris</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Logs Table -->
    <div class="logs-section">
      <h4>Activités Récentes ({{ logs.length }} entrées)</h4>
      <div class="logs-table-container">
        <table class="logs-table">
          <thead>
            <tr>
              <th @click="handleSort('timestamp')" class="sortable-header">
                <div class="flex items-center gap-2 cursor-pointer">
                  <span>Date & Heure</span>
                  <i v-if="sortColumn === 'timestamp'" :class="[
                    sortDirection === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down',
                    'text-primary text-xs'
                  ]"></i>
                  <i v-else class="fas fa-sort text-gray-400 text-xs"></i>
                </div>
              </th>
              <th @click="handleSort('action')" class="sortable-header">
                <div class="flex items-center gap-2 cursor-pointer">
                  <span>Action</span>
                  <i v-if="sortColumn === 'action'" :class="[
                    sortDirection === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down',
                    'text-primary text-xs'
                  ]"></i>
                  <i v-else class="fas fa-sort text-gray-400 text-xs"></i>
                </div>
              </th>
              <th @click="handleSort('details')" class="sortable-header">
                <div class="flex items-center gap-2 cursor-pointer">
                  <span>Détails</span>
                  <i v-if="sortColumn === 'details'" :class="[
                    sortDirection === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down',
                    'text-primary text-xs'
                  ]"></i>
                  <i v-else class="fas fa-sort text-gray-400 text-xs"></i>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in sortedLogs" :key="log.id" :class="getLogRowClass(log.action)">
              <td class="timestamp">{{ formatDate(log.timestamp || log.created_at) }}</td>
              <td class="operation">
                <span :class="getOperationClass(log.action)">
                  <i :class="getActionIcon(log.action)" class="mr-2"></i>
                  {{ formatAction(log.action) }}
                </span>
              </td>
              <td class="details">{{ formatLogDetails(log) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="pagination" v-if="totalPages > 1">
        <button @click="go(page - 1)" :disabled="page <= 1" class="btn-page">
          <i class="fas fa-chevron-left"></i>
        </button>
        <span class="page-info">Page {{ page }} / {{ totalPages }}</span>
        <button @click="go(page + 1)" :disabled="page >= totalPages" class="btn-page">
          <i class="fas fa-chevron-right"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { userAPI } from '@/services/api'

const page = ref(1)
const perPage = ref(20)
const logs = ref([])
const total = ref(0)
const error = ref('')
const loading = ref(false)

const filters = ref({
  action: ''
})

// État du tri
const sortColumn = ref('timestamp')
const sortDirection = ref('desc')

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / perPage.value)))

// Computed pour les logs triés
const sortedLogs = computed(() => {
  if (!logs.value || logs.value.length === 0) return []
  
  const sorted = [...logs.value].sort((a, b) => {
    let aValue, bValue
    
    switch (sortColumn.value) {
      case 'timestamp':
        aValue = new Date(a.timestamp || a.created_at || 0)
        bValue = new Date(b.timestamp || b.created_at || 0)
        break
      case 'action':
        aValue = (a.action || '').toLowerCase()
        bValue = (b.action || '').toLowerCase()
        break
      case 'details':
        aValue = formatLogDetails(a).toLowerCase()
        bValue = formatLogDetails(b).toLowerCase()
        break
      default:
        return 0
    }
    
    if (aValue < bValue) return sortDirection.value === 'asc' ? -1 : 1
    if (aValue > bValue) return sortDirection.value === 'asc' ? 1 : -1
    return 0
  })
  
  return sorted
})

function formatDate(v) {
  if (!v) return '—'
  return new Date(v).toLocaleString()
}

function formatAction(action) {
  const actionLabels = {
    // Actions actuelles
    'ACCESS_FOLDER': 'Lecture de dossier',
    'ACCESS_FILE': 'Lecture de fichier',
    'DOWNLOAD_FILE': 'Téléchargement',
    'CREATE_FILE': 'Création de fichier',
    'UPLOAD_FILE': 'Upload de fichier',
    'COPY_FILE': 'Copie de fichier',
    'COPY_FOLDER': 'Copie de dossier',
    'DELETE_FILE': 'Suppression de fichier',
    'DELETE_FOLDER': 'Suppression de dossier',
    'MOVE_FILE': 'Déplacement de fichier',
    'MOVE_FOLDER': 'Déplacement de dossier',
    'RENAME_FILE': 'Renommage de fichier',
    'RENAME_FOLDER': 'Renommage de dossier',
    'CREATE_FOLDER': 'Création de dossier',
    
    // Actions legacy possibles
    'LOGIN': 'Connexion',
    'LOGOUT': 'Déconnexion',
    'READ': 'Lecture',
    'WRITE': 'Écriture',
    'CREATE': 'Création',
    'DELETE': 'Suppression',
    'UPDATE': 'Modification',
    'SHARE': 'Partage',
    'ERROR': 'Erreur de chargement',
    'ADD_FAVORITE': 'Ajout aux favoris',
    'REMOVE_FAVORITE': 'Retrait des favoris',
    'UPLOAD': 'Upload',
    'DOWNLOAD': 'Téléchargement',
    'COPY': 'Copie',
    'MOVE': 'Déplacement',
    'RENAME': 'Renommage',
    
    // Actions spécifiques aux fichiers/dossiers
    'file_download': 'Téléchargement de fichier',
    'file_upload': 'Upload de fichier',
    'file_delete': 'Suppression de fichier',
    'file_rename': 'Renommage de fichier',
    'file_move': 'Déplacement de fichier',
    'file_copy': 'Copie de fichier',
    'folder_create': 'Création de dossier',
    'folder_delete': 'Suppression de dossier',
    'navigation': 'Navigation',
    'favorite_add': 'Ajout aux favoris',
    'favorite_remove': 'Retrait des favoris'
  }
  
  // Si l'action n'est pas trouvée, essayer de la formater automatiquement
  if (!actionLabels[action]) {
    // Convertir snake_case en mots
    const formatted = action.toLowerCase()
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
    
    // Traductions spécifiques
    return formatted
      .replace(/File/g, 'fichier')
      .replace(/Folder/g, 'dossier')
      .replace(/Download/g, 'Téléchargement')
      .replace(/Upload/g, 'Upload')
      .replace(/Delete/g, 'Suppression')
      .replace(/Create/g, 'Création')
      .replace(/Move/g, 'Déplacement')
      .replace(/Rename/g, 'Renommage')
      .replace(/Copy/g, 'Copie')
      .replace(/Access/g, 'Accès')
      .replace(/Login/g, 'Connexion')
      .replace(/Logout/g, 'Déconnexion')
  }
  
  return actionLabels[action] || action
}

function formatLogDetails(log) {
  try {
    // Cas spécial : si target contient "path - {json}", extraire seulement le path
    if (log.target && log.target.includes(' - {')) {
      const pathPart = log.target.split(' - {')[0]
      if (pathPart && pathPart.trim()) {
        return pathPart.trim()
      }
    }
    
    let parsedDetails = null
    
    // Essayer de parser target s'il contient du JSON
    if (log.target && log.target.includes('{')) {
      try {
        // Si target commence par un chemin suivi de JSON, extraire le JSON
        const jsonStart = log.target.indexOf('{')
        if (jsonStart > 0) {
          const jsonPart = log.target.substring(jsonStart)
          parsedDetails = JSON.parse(jsonPart)
        } else {
          parsedDetails = JSON.parse(log.target)
        }
      } catch (e) {
        // Si le parsing échoue, essayer d'extraire le chemin avant le JSON
        const jsonStart = log.target.indexOf('{')
        if (jsonStart > 0) {
          const pathPart = log.target.substring(0, jsonStart).trim()
          if (pathPart && pathPart !== '-') {
            return pathPart
          }
        }
        return log.target
      }
    }
    
    // Essayer de parser details s'il contient du JSON
    if (!parsedDetails && log.details && typeof log.details === 'string' && log.details.includes('{')) {
      try {
        parsedDetails = JSON.parse(log.details)
      } catch (e) {
        // Si le parsing échoue, utiliser details tel quel
        return log.details
      }
    }
    
    // Si on a des détails parsés, extraire les informations importantes
    if (parsedDetails) {
      // Pour les opérations de déplacement/renommage
      if (parsedDetails.source_path && parsedDetails.destination_path) {
        return `${parsedDetails.source_path} → ${parsedDetails.destination_path}`
      }
      if (parsedDetails.old_path && parsedDetails.new_path) {
        return `${parsedDetails.old_path} → ${parsedDetails.new_path}`
      }
      
      // Pour les opérations simples, juste le chemin
      if (parsedDetails.path) {
        return parsedDetails.path
      }
      
      // Si c'est un objet avec d'autres propriétés, essayer d'extraire le plus important
      if (parsedDetails.frontend_context && parsedDetails.frontend_context.path) {
        return parsedDetails.frontend_context.path
      }
      
      // Pour les erreurs, afficher le message d'erreur
      if (parsedDetails.failed_operation && parsedDetails.error_message) {
        return `${parsedDetails.failed_operation}: ${parsedDetails.error_message}`
      }
      
      // Si c'est une erreur avec juste le message
      if (parsedDetails.error_message) {
        return parsedDetails.error_message
      }
    }
    
    // Si target ne contient pas de JSON, l'utiliser directement
    if (log.target && !log.target.includes('{')) {
      return log.target
    }
    
    // Si details ne contient pas de JSON, l'utiliser directement
    if (log.details && typeof log.details === 'string' && !log.details.includes('{')) {
      return log.details
    }
    
    return 'Aucun détail'
  } catch (error) {
    console.warn('Erreur formatage détails:', error)
    // En cas d'erreur, retourner la première valeur non-JSON disponible
    if (log.target && !log.target.includes('{')) {
      return log.target
    }
    if (log.details && typeof log.details === 'string' && !log.details.includes('{')) {
      return log.details
    }
    return 'Aucun détail'
  }
}

function getLogRowClass(action) {
  if (!action) return ''
  
  const actionUpper = action.toUpperCase()
  
  // Actions d'erreur/suppression (rouge)
  if (actionUpper.includes('DELETE') || actionUpper.includes('REMOVE') || actionUpper.includes('LOGOUT')) {
    return 'log-error'
  }
  
  // Actions de succès/création (vert)
  if (actionUpper.includes('CREATE') || actionUpper.includes('UPLOAD') || 
      actionUpper.includes('ADD') || actionUpper.includes('LOGIN')) {
    return 'log-success'
  }
  
  // Actions d'information/accès (bleu)
  if (actionUpper.includes('ACCESS') || actionUpper.includes('READ') || 
      actionUpper.includes('NAVIGATION') || actionUpper.includes('DOWNLOAD')) {
    return 'log-info'
  }
  
  return ''
}

function getOperationClass(action) {
  if (!action) return 'operation-default'
  
  const actionUpper = action.toUpperCase()
  
  // Actions d'erreur/suppression (rouge)
  if (actionUpper.includes('DELETE') || actionUpper.includes('REMOVE') || actionUpper.includes('LOGOUT')) {
    return 'operation-error'
  }
  
  // Actions de succès/création (vert)
  if (actionUpper.includes('CREATE') || actionUpper.includes('UPLOAD') || 
      actionUpper.includes('ADD') || actionUpper.includes('LOGIN')) {
    return 'operation-success'
  }
  
  // Actions d'information/accès (bleu)
  if (actionUpper.includes('ACCESS') || actionUpper.includes('READ') || 
      actionUpper.includes('NAVIGATION')) {
    return 'operation-info'
  }
  
  // Actions d'avertissement/modification (orange)
  if (actionUpper.includes('DOWNLOAD') || actionUpper.includes('MOVE') || 
      actionUpper.includes('RENAME') || actionUpper.includes('COPY') || 
      actionUpper.includes('UPDATE') || actionUpper.includes('SHARE')) {
    return 'operation-warning'
  }
  
  return 'operation-default'
}

function getActionIcon(action) {
  if (!action) return 'fas fa-file'
  
  const iconMap = {
    // Actions actuelles
    'ACCESS_FOLDER': 'fas fa-folder-open',
    'ACCESS_FILE': 'fas fa-eye',
    'DOWNLOAD_FILE': 'fas fa-download',
    'CREATE_FILE': 'fas fa-plus-circle',
    'DELETE_FILE': 'fas fa-trash',
    'DELETE_FOLDER': 'fas fa-trash',
    'MOVE_FILE': 'fas fa-arrows-alt',
    'MOVE_FOLDER': 'fas fa-arrows-alt',
    'RENAME_FILE': 'fas fa-edit',
    'RENAME_FOLDER': 'fas fa-edit',
    'CREATE_FOLDER': 'fas fa-folder-plus',
    
    // Actions legacy
    'LOGIN': 'fas fa-sign-in-alt',
    'LOGOUT': 'fas fa-sign-out-alt',
    'READ': 'fas fa-eye',
    'WRITE': 'fas fa-edit',
    'CREATE': 'fas fa-plus',
    'DELETE': 'fas fa-trash',
    'UPDATE': 'fas fa-edit',
    'SHARE': 'fas fa-share',
    'ADD_FAVORITE': 'fas fa-star',
    'REMOVE_FAVORITE': 'fas fa-star-o',
    'UPLOAD': 'fas fa-upload',
    'DOWNLOAD': 'fas fa-download',
    'COPY': 'fas fa-copy',
    'MOVE': 'fas fa-arrows-alt',
    'RENAME': 'fas fa-edit',
    
    // Actions snake_case
    'file_download': 'fas fa-download',
    'file_upload': 'fas fa-upload',
    'file_delete': 'fas fa-trash',
    'file_rename': 'fas fa-edit',
    'file_move': 'fas fa-arrows-alt',
    'file_copy': 'fas fa-copy',
    'folder_create': 'fas fa-folder-plus',
    'folder_delete': 'fas fa-trash',
    'navigation': 'fas fa-folder-open',
    'favorite_add': 'fas fa-star',
    'favorite_remove': 'fas fa-star-o'
  }
  
  // Si l'icône exacte n'est pas trouvée, essayer par mots-clés
  if (!iconMap[action]) {
    const actionUpper = action.toUpperCase()
    
    if (actionUpper.includes('DELETE') || actionUpper.includes('REMOVE')) {
      return 'fas fa-trash'
    }
    if (actionUpper.includes('CREATE') || actionUpper.includes('ADD')) {
      return actionUpper.includes('FOLDER') ? 'fas fa-folder-plus' : 'fas fa-plus-circle'
    }
    if (actionUpper.includes('DOWNLOAD')) {
      return 'fas fa-download'
    }
    if (actionUpper.includes('UPLOAD')) {
      return 'fas fa-upload'
    }
    if (actionUpper.includes('MOVE')) {
      return 'fas fa-arrows-alt'
    }
    if (actionUpper.includes('RENAME') || actionUpper.includes('EDIT')) {
      return 'fas fa-edit'
    }
    if (actionUpper.includes('COPY')) {
      return 'fas fa-copy'
    }
    if (actionUpper.includes('ACCESS') || actionUpper.includes('READ') || actionUpper.includes('NAVIGATION')) {
      return actionUpper.includes('FOLDER') ? 'fas fa-folder-open' : 'fas fa-eye'
    }
    if (actionUpper.includes('LOGIN')) {
      return 'fas fa-sign-in-alt'
    }
    if (actionUpper.includes('LOGOUT')) {
      return 'fas fa-sign-out-alt'
    }
    if (actionUpper.includes('FAVORITE') || actionUpper.includes('STAR')) {
      return 'fas fa-star'
    }
    if (actionUpper.includes('SHARE')) {
      return 'fas fa-share'
    }
  }
  
  return iconMap[action] || 'fas fa-file'
}

async function load() {
  error.value = ''
  loading.value = true
  try {
    // Force reload by adding timestamp to avoid cache
    const timestamp = Date.now()
    const { data } = await userAPI.getLogs(page.value, perPage.value, filters.value.action)
    // Backend returns { logs, total, pages, current_page }
    logs.value = data?.logs || data?.items || data || []
    total.value = data?.total ?? logs.value.length
    console.log('ActivityLogs - Données reçues:', data)
    console.log('ActivityLogs - Logs traités:', logs.value)
    console.log('ActivityLogs - Actions trouvées:', logs.value.map(log => log.action))
  } catch (e) {
    console.error('ActivityLogs - Erreur:', e)
    error.value = e?.response?.data?.message || e?.message || 'Erreur récupération journaux'
  } finally {
    loading.value = false
  }
}

function go(p) {
  page.value = Math.min(Math.max(1, p), totalPages.value)
  load()
}

// Gestion du tri
function handleSort(column) {
  if (sortColumn.value === column) {
    // Inverser la direction si c'est la même colonne
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    // Nouvelle colonne, tri ascendant par défaut (sauf pour timestamp qui est desc par défaut)
    sortColumn.value = column
    sortDirection.value = column === 'timestamp' ? 'desc' : 'asc'
  }
}

onMounted(load)
</script>

<style scoped>
.activity-logs-viewer {
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e5e7eb;
}

.header h3 {
  margin: 0;
  color: #1f2937;
  font-size: 1.5rem;
  font-weight: 600;
}

.controls {
  display: flex;
  gap: 15px;
  align-items: center;
}

.btn-page {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 5px;
}

.btn-page:hover {
  background: #f3f4f6;
}

.btn-page:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.filters-section, .logs-section {
  margin-bottom: 20px;
}

.filters-section h4, .logs-section h4 {
  margin: 0 0 10px 0;
  color: #374151;
  font-size: 1.1rem;
  font-weight: 600;
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-top: 10px;
}

.filter-group label {
  display: block;
  font-weight: 500;
  margin-bottom: 5px;
  color: #374151;
}

.filter-group select {
  width: 100%;
  padding: 8px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
}

.logs-table-container {
  overflow-x: auto;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
}

.logs-table {
  width: 100%;
  border-collapse: collapse;
}

.logs-table th {
  background: #f9fafb;
  padding: 12px 8px;
  text-align: left;
  font-weight: 600;
  color: #374151;
  border-bottom: 1px solid #e5e7eb;
}

.sortable-header {
  user-select: none;
  transition: background-color 0.2s;
}

.sortable-header:hover {
  background: #f3f4f6 !important;
}

.logs-table td {
  padding: 8px;
  border-bottom: 1px solid #f3f4f6;
  font-size: 14px;
}

.logs-table tr:hover {
  background: #f8fafc;
}

.log-error {
  background: #fef2f2 !important;
}

.log-success {
  background: #f0fdf4 !important;
}

.log-info {
  background: #eff6ff !important;
}

.operation-error {
  color: #dc2626;
  font-weight: 500;
}

.operation-success {
  color: #059669;
  font-weight: 500;
}

.operation-info {
  color: #2563eb;
  font-weight: 500;
}

.operation-warning {
  color: #d97706;
  font-weight: 500;
}

.operation-default {
  color: #6b7280;
  font-weight: 500;
}

.timestamp {
  font-family: monospace;
  font-size: 12px;
  color: #6b7280;
  white-space: nowrap;
}

.operation {
  white-space: nowrap;
}

.details {
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  margin-top: 15px;
}

.page-info {
  font-size: 14px;
  color: #6b7280;
}

.alert {
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 15px;
}

.alert-error {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
}
</style>

<style scoped>
.btn { @apply px-3 py-2 rounded border bg-white hover:bg-gray-50; }
.alert-error { @apply bg-red-50 border border-red-200 text-red-700 p-2 rounded; }
</style>
