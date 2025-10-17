<!-- components/Admin/AccessLogs.vue -->
<template>
  <div class="p-6">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <!-- <h1 class="text-3xl font-bold">Journaux d'accès</h1> -->
      <div class="flex items-center gap-3">
        <select v-model="perPage" class="select select-bordered select-sm" @change="changePage(1)">
          <option :value="20">20 par page</option>
          <option :value="50">50 par page</option>
          <option :value="100">100 par page</option>
        </select>
        <button class="btn btn-primary btn-sm" @click="refreshLogs">
          <i class="fas fa-sync-alt mr-2"></i>
          Actualiser
        </button>
      </div>
    </div>

    <!-- Filters -->
    <div class="card bg-base-100 shadow-xl mb-6">
      <div class="card-body">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <!-- Search -->
          <div class="form-control">
            <label class="label">
              <span class="label-text">Rechercher</span>
            </label>
            <input v-model="filters.search" type="text" placeholder="Utilisateur, action, cible..."
              class="input input-bordered input-sm" @input="debouncedFilter">
          </div>

          <!-- Action Filter -->
          <div class="form-control">
            <label class="label">
              <span class="label-text">Action</span>
            </label>
            <select v-model="filters.action" class="select select-bordered select-sm" @change="applyFilters">
              <option value="">Toutes les actions</option>
              <option value="CREATE">Création</option>
              <option value="READ">Lecture</option>
              <option value="UPDATE">Modification</option>
              <option value="DELETE">Suppression</option>
              <option value="CREATE_USER">Créer utilisateur</option>
              <option value="UPDATE_USER">Modifier utilisateur</option>
              <option value="DELETE_USER">Supprimer utilisateur</option>
              <option value="CREATE_GROUP">Créer groupe</option>
              <option value="UPDATE_GROUP">Modifier groupe</option>
              <option value="DELETE_GROUP">Supprimer groupe</option>
              <option value="CREATE_FOLDER">Créer dossier</option>
              <option value="DELETE_FOLDER">Supprimer dossier</option>
            </select>
          </div>

          <!-- User Filter -->
          <div class="form-control relative z-20">
            <label class="label">
              <span class="label-text">Utilisateur ({{ users.length }} chargés)</span>
            </label>
            <select v-model="filters.userId" class="select select-bordered select-sm w-full" @change="applyFilters" style="z-index: 20;">
              <option value="">Tous les utilisateurs</option>
              <option v-for="user in users" :key="user.id" :value="user.id">
                {{ user.username || user.user || `User ${user.id}` }}
              </option>
            </select>
          </div>

          <!-- Date Filter -->
          <div class="form-control">
            <label class="label">
              <span class="label-text">Période</span>
            </label>
            <select v-model="filters.period" class="select select-bordered select-sm" @change="applyFilters">
              <option value="">Toute période</option>
              <option value="today">Aujourd'hui</option>
              <option value="week">Cette semaine</option>
              <option value="month">Ce mois</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center py-12">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <!-- Logs Table -->
    <div v-else class="card bg-base-100 shadow-xl">
      <div class="card-body p-0">
        <div class="overflow-x-auto">
          <table class="table table-zebra w-full">
            <thead>
              <tr>
                <th>Date/Heure</th>
                <th>Utilisateur</th>
                <th>Action</th>
                <th>Cible</th>
                <th>Détails</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="log in paginatedLogs" :key="log.id">
                <td>
                  <div class="text-sm">
                    <div class="font-medium">{{ formatDate(log.timestamp) }}</div>
                    <div class="opacity-70">{{ formatTime(log.timestamp) }}</div>
                  </div>
                </td>
                <td>
                  <div class="flex items-center space-x-2">
                    <div
                      class="mask mask-squircle w-8 h-8 bg-secondary text-secondary-content flex items-center justify-center">
                      {{ (log.user || log.user_id || 'S').toString().charAt(0).toUpperCase() }}
                    </div>
                    <div>
                      <div class="font-medium text-sm">{{ log.user || `ID: ${log.user_id}` }}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div class="badge" :class="getActionBadgeClass(log.action)">
                    {{ getActionLabel(log.action) }}
                  </div>
                </td>
                <td>
                  <div class="text-sm max-w-xs truncate" :title="formatLogDetails(log)">
                    {{ formatLogDetails(log) }}
                  </div>
                </td>
                <td>
                  <!-- Toujours afficher le bouton Voir -->
                  <button class="btn btn-ghost btn-xs" @click="showLogDetails(log)">
                    <i class="fas fa-eye"></i>
                    Voir
                  </button>
                </td>
              </tr>
            </tbody>

          </table>
        </div>

        <!-- Empty State -->
        <div v-if="logs.length === 0" class="text-center py-12">
          <i class="fas fa-list text-6xl opacity-30 mb-4"></i>
          <p class="text-xl opacity-70 mb-2">Aucun journal trouvé</p>
          <p class="opacity-50">{{ hasFilters ? 'Essayez de modifier vos filtres' : 'Les journaux d\'activité apparaîtront ici' }}</p>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="flex items-center justify-between mt-6">
      <div class="text-sm opacity-70">
        Page {{ currentPage }} sur {{ totalPages }} ({{ totalLogs }} entrées)
      </div>

      <div class="btn-group">
        <button class="btn btn-sm" :disabled="currentPage <= 1" @click="changePage(currentPage - 1)">
          <i class="fas fa-chevron-left"></i>
        </button>

        <!-- Page numbers -->
        <button v-for="page in visiblePages" :key="page" class="btn btn-sm"
          :class="{ 'btn-active': page === currentPage }" @click="changePage(page)">
          {{ page }}
        </button>

        <button class="btn btn-sm" :disabled="currentPage >= totalPages" @click="changePage(currentPage + 1)">
          <i class="fas fa-chevron-right"></i>
        </button>
      </div>
    </div>

    <!-- Log Details Modal -->
    <div v-if="selectedLog" class="modal modal-open">
      <div class="modal-box max-w-2xl">
        <h3 class="font-bold text-lg mb-4">Détails du journal</h3>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <div class="text-sm font-medium opacity-70">Date/Heure</div>
            <div>{{ formatDateTime(selectedLog.timestamp) }}</div>
          </div>

          <div>
            <div class="text-sm font-medium opacity-70">Utilisateur</div>
            <div>{{ selectedLog.user || `ID: ${selectedLog.user_id}` }}</div>
          </div>

          <div>
            <div class="text-sm font-medium opacity-70">Action</div>
            <div class="badge" :class="getActionBadgeClass(selectedLog.action)">
              {{ getActionLabel(selectedLog.action) }}
            </div>
          </div>

          <div>
            <div class="text-sm font-medium opacity-70">ID Journal</div>
            <div>#{{ selectedLog.id }}</div>
          </div>
        </div>

        <div class="mb-4">
          <div class="text-sm font-medium opacity-70 mb-2">Détails</div>
          <div class="bg-base-200 p-3 rounded text-sm">
            {{ formatLogDetails(selectedLog) }}
          </div>
        </div>

        <div class="modal-action">
          <button class="btn" @click="selectedLog = null">Fermer</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { adminAPI } from '@/services/api'
import { useStore } from 'vuex'

const store = useStore()

// Reactive data
const logs = ref([])
const users = ref([])
const loading = ref(false)
const currentPage = ref(1)
const perPage = ref(50)
const totalLogs = computed(() => filteredLogs.value.length)
const selectedLog = ref(null)

// Filters
const filters = ref({
  search: '',
  action: '',
  userId: '',
  period: ''
})

let debounceTimer = null

// Computed properties
const totalPages = computed(() => Math.ceil(totalLogs.value / perPage.value))

const hasFilters = computed(() => {
  return Object.values(filters.value).some(value => value !== '')
})

const paginatedLogs = computed(() => {
  const start = (currentPage.value - 1) * perPage.value
  const end = start + perPage.value
  return filteredLogs.value.slice(start, end)
})


const visiblePages = computed(() => {
  const pages = []
  const start = Math.max(1, currentPage.value - 2)
  const end = Math.min(totalPages.value, currentPage.value + 2)

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  return pages
})

const filteredLogs = computed(() => {
  return logs.value.filter(log => {
    const matchesSearch = filters.value.search
      ? (log.user?.toLowerCase().includes(filters.value.search.toLowerCase()) ||
        log.action?.toLowerCase().includes(filters.value.search.toLowerCase()) ||
        log.target?.toLowerCase().includes(filters.value.search.toLowerCase()))
      : true

    const matchesAction = filters.value.action
      ? log.action === filters.value.action
      : true

    const matchesUser = filters.value.userId
      ? (() => {
          // Trouver le nom d'utilisateur correspondant à l'ID sélectionné
          const selectedUser = users.value.find(u => u.id == filters.value.userId)
          const selectedUsername = selectedUser ? (selectedUser.username || selectedUser.user) : null
          
          // Comparer avec le champ 'user' du log
          return selectedUsername && log.user === selectedUsername
        })()
      : true

    const matchesPeriod = (() => {
      if (!filters.value.period) return true
      const date = new Date(log.timestamp)
      const now = new Date()

      if (filters.value.period === 'today') {
        return date.toDateString() === now.toDateString()
      }
      if (filters.value.period === 'week') {
        const weekAgo = new Date()
        weekAgo.setDate(now.getDate() - 7)
        return date >= weekAgo
      }
      if (filters.value.period === 'month') {
        return (
          date.getMonth() === now.getMonth() &&
          date.getFullYear() === now.getFullYear()
        )
      }
      return true
    })()

    return matchesSearch && matchesAction && matchesUser && matchesPeriod
  })
})

// Methods
const formatDate = (timestamp) => {
  return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(new Date(timestamp))
}

const formatTime = (timestamp) => {
  return new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(new Date(timestamp))
}

const formatDateTime = (timestamp) => {
  return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(new Date(timestamp))
}

const getActionLabel = (action) => {
  const labels = {
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
    
    // Actions legacy
    'CREATE': 'Création',
    'READ': 'Lecture',
    'UPDATE': 'Modification',
    'DELETE': 'Suppression',
    'LOGIN': 'Connexion',
    'LOGOUT': 'Déconnexion',
    'ERROR': 'Erreur de chargement',
    'UPLOAD': 'Upload',
    'DOWNLOAD': 'Téléchargement',
    'COPY': 'Copie',
    'MOVE': 'Déplacement',
    'RENAME': 'Renommage',
    'SHARE': 'Partage',
    'ADD_FAVORITE': 'Ajout aux favoris',
    'REMOVE_FAVORITE': 'Retrait des favoris',
    
    // Actions utilisateurs/groupes
    'CREATE_USER': 'Créer utilisateur',
    'UPDATE_USER': 'Modifier utilisateur',
    'DELETE_USER': 'Supprimer utilisateur',
    'CREATE_GROUP': 'Créer groupe',
    'UPDATE_GROUP': 'Modifier groupe',
    'DELETE_GROUP': 'Supprimer groupe',
    'ADD_USER_TO_GROUP': 'Ajout utilisateur au groupe',
    'REMOVE_USER_FROM_GROUP': 'Retrait du groupe',
    'UPDATE_PROFILE': 'Modifier profil',
    
    // Actions permissions
    'CREATE_PERMISSION': 'Accorder permission',
    'DELETE_PERMISSION': 'Supprimer permission',
    'UPDATE_PERMISSION': 'Modifier permission',
    
    // Actions snake_case
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
  if (!labels[action]) {
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
  
  return labels[action] || action
}

const getActionBadgeClass = (action) => {
  if (!action) return 'badge-ghost'
  
  const actionUpper = action.toUpperCase()
  
  // Actions d'erreur/suppression (rouge)
  if (actionUpper.includes('DELETE') || actionUpper.includes('REMOVE') || actionUpper.includes('LOGOUT')) {
    return 'badge-error'
  }
  
  // Actions de succès/création (vert)
  if (actionUpper.includes('CREATE') || actionUpper.includes('UPLOAD') || 
      actionUpper.includes('ADD') || actionUpper.includes('LOGIN')) {
    return 'badge-success'
  }
  
  // Actions d'information/accès (bleu)
  if (actionUpper.includes('ACCESS') || actionUpper.includes('READ') || 
      actionUpper.includes('NAVIGATION') || actionUpper.includes('DOWNLOAD')) {
    return 'badge-info'
  }
  
  // Actions d'avertissement/modification (orange)
  if (actionUpper.includes('UPDATE') || actionUpper.includes('MOVE') || 
      actionUpper.includes('RENAME') || actionUpper.includes('COPY') || 
      actionUpper.includes('SHARE')) {
    return 'badge-warning'
  }
  
  // Actions spéciales (violet)
  if (actionUpper.includes('GROUP') || actionUpper.includes('PERMISSION')) {
    return 'badge-secondary'
  }
  
  return 'badge-ghost'
}

const loadLogs = async () => {
  loading.value = true
  try {
    const response = await adminAPI.getLogs(currentPage.value, perPage.value)
    const data = response.data

    logs.value = data.logs || data || []
    // totalLogs est un computed, pas besoin de l'assigner
    console.log('📊 Logs loaded:', logs.value.length)
  } catch (error) {
    console.error('Error loading logs:', error)
    store.dispatch('showError', 'Erreur lors du chargement des journaux')
  } finally {
    loading.value = false
  }
}

const loadUsers = async () => {
  try {
    console.log('🔄 Loading users for AccessLogs filter...')
    const response = await adminAPI.getUsers()
    users.value = response.data || []
    console.log('✅ Users loaded:', users.value.length, users.value)
  } catch (error) {
    console.error('❌ Error loading users:', error)
  }
}

const changePage = (page) => {
  currentPage.value = Math.max(1, Math.min(page, totalPages.value))
  loadLogs()
}

const refreshLogs = () => {
  currentPage.value = 1
  loadLogs()
}

const debouncedFilter = () => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    applyFilters()
  }, 500)
}

const applyFilters = () => {
  console.log('🔍 Applying filters:', filters.value)
  console.log('📊 Total logs before filter:', logs.value.length)
  
  // Debug de la correspondance utilisateur
  if (filters.value.userId) {
    const selectedUser = users.value.find(u => u.id == filters.value.userId)
    const selectedUsername = selectedUser ? (selectedUser.username || selectedUser.user) : null
    console.log('👤 Selected user ID:', filters.value.userId)
    console.log('👤 Selected username:', selectedUsername)
    console.log('👤 Available usernames in logs:', [...new Set(logs.value.map(log => log.user))])
  }
  
  console.log('📊 Filtered logs after filter:', filteredLogs.value.length)
  
  // Debug du premier log pour voir la structure
  if (logs.value.length > 0) {
    console.log('🔍 First log structure:', logs.value[0])
  }
  
  currentPage.value = 1
}

const showLogDetails = (log) => {
  selectedLog.value = log
}

const formatLogDetails = (log) => {
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
    console.warn('Erreur formatage détails admin:', error)
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

// Lifecycle
onMounted(async () => {
  await Promise.all([loadLogs(), loadUsers()])
})
</script>

<style scoped>
.table th {
  position: sticky;
  top: 0;
  z-index: 10;
}

.btn-group .btn {
  border-radius: 0;
}

.btn-group .btn:first-child {
  border-top-left-radius: 0.5rem;
  border-bottom-left-radius: 0.5rem;
}

.btn-group .btn:last-child {
  border-top-right-radius: 0.5rem;
  border-bottom-right-radius: 0.5rem;
}
</style>/* Am
élioration du select utilisateur */
.form-control select {
  position: relative;
  z-index: 20 !important;
}

/* Force l'affichage des options du select */
.select option {
  background-color: hsl(var(--b1)) !important;
  color: hsl(var(--bc)) !important;
  padding: 0.5rem;
}

/* Assurer que le select est au-dessus des autres éléments */
.form-control.relative {
  z-index: 20;
}