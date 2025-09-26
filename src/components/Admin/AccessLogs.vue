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
            <input
              v-model="filters.search"
              type="text"
              placeholder="Utilisateur, action, cible..."
              class="input input-bordered input-sm"
              @input="debouncedFilter"
            >
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
          <div class="form-control">
            <label class="label">
              <span class="label-text">Utilisateur</span>
            </label>
            <select v-model="filters.userId" class="select select-bordered select-sm" @change="applyFilters">
              <option value="">Tous les utilisateurs</option>
              <option v-for="user in users" :key="user.id" :value="user.id">
                {{ user.user }}
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
        <div class="mask mask-squircle w-8 h-8 bg-secondary text-secondary-content flex items-center justify-center">
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
      <div class="text-sm max-w-xs truncate" :title="log.target">
        {{ log.target }}
      </div>
    </td>
    <td>
      <!-- Toujours afficher le bouton Voir -->
      <button
        class="btn btn-ghost btn-xs"
        @click="showLogDetails(log)"
      >
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
        <button
          class="btn btn-sm"
          :disabled="currentPage <= 1"
          @click="changePage(currentPage - 1)"
        >
          <i class="fas fa-chevron-left"></i>
        </button>
        
        <!-- Page numbers -->
        <button
          v-for="page in visiblePages"
          :key="page"
          class="btn btn-sm"
          :class="{ 'btn-active': page === currentPage }"
          @click="changePage(page)"
        >
          {{ page }}
        </button>
        
        <button
          class="btn btn-sm"
          :disabled="currentPage >= totalPages"
          @click="changePage(currentPage + 1)"
        >
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
          <div class="text-sm font-medium opacity-70 mb-2">Cible</div>
          <div class="bg-base-200 p-3 rounded text-sm">
            {{ selectedLog.target }}
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
      ? log.userId == filters.value.userId
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
    'CREATE': 'Création',
    'READ': 'Lecture',
    'UPDATE': 'Modification',
    'DELETE': 'Suppression',
    'CREATE_USER': 'Créer utilisateur',
    'UPDATE_USER': 'Modifier utilisateur',
    'DELETE_USER': 'Supprimer utilisateur',
    'CREATE_GROUP': 'Créer groupe',
    'UPDATE_GROUP': 'Modifier groupe',
    'DELETE_GROUP': 'Supprimer groupe',
    'CREATE_FOLDER': 'Créer dossier',
    'DELETE_FOLDER': 'Supprimer dossier',
    'ADD_USER_TO_GROUP': 'Ajout utilisateur au groupe',
    'REMOVE_USER_FROM_GROUP': 'Retrait du groupe',
    'UPDATE_PROFILE': 'Modifier profil',
    'GRANT_PERMISSION': 'Accorder permission',
    'REVOKE_PERMISSION': 'Révoquer permission',
   'UPDATE_PERMISSION': 'Modifier permission'
  }
  return labels[action] || action
}

const getActionBadgeClass = (action) => {
  if (action.startsWith('CREATE')) return 'badge-success'
  if (action.startsWith('UPDATE')) return 'badge-warning'
  if (action.startsWith('DELETE')) return 'badge-error'
  if (action.startsWith('READ')) return 'badge-info'
  if (action.includes('GROUP')) return 'badge-primary'
  if (action.includes('PERMISSION')) return 'badge-secondary'
  return 'badge-ghost'
}

const loadLogs = async () => {
  loading.value = true
  try {
    const response = await adminAPI.getLogs(currentPage.value, perPage.value)
    const data = response.data
    
    logs.value = data.logs || data || []
    totalLogs.value = data.total || logs.value.length
  } catch (error) {
    console.error('Error loading logs:', error)
    store.dispatch('showError', 'Erreur lors du chargement des journaux')
  } finally {
    loading.value = false
  }
}

const loadUsers = async () => {
  try {
    const response = await adminAPI.getUsers()
    users.value = response.data || []
  } catch (error) {
    console.error('Error loading users:', error)
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
  currentPage.value = 1
}

const showLogDetails = (log) => {
  selectedLog.value = log
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
</style>