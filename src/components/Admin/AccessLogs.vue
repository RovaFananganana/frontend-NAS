<template>
  <div class="p-6">

    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
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

    <!-- Logs Table -->
    <div class="card bg-base-100 shadow-xl">
      <div class="card-body p-0">
        <div class="overflow-x-auto">
          <table class="table table-zebra w-full">
            <thead>
              <tr>
                <th>Date/Heure</th>
                <th>Utilisateur</th>
                <th>Action</th>
                <th>Cible</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="log in logs" :key="log.id">
                <td class="text-sm">
                  {{ formatDateTime(log.timestamp) }}
                </td>
                <td class="text-sm">
                  {{ log.user || 'Utilisateur inconnu' }}
                </td>
                <td>
                  <div class="badge" :class="getActionBadgeClass(log.action)">
                    {{ getActionLabel(log.action) }}
                  </div>
                </td>
                <td class="text-sm max-w-xs truncate" :title="log.target">
                  {{ log.target }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Empty State -->
        <div v-if="logs.length === 0" class="text-center py-12">
          <i class="fas fa-list text-6xl opacity-30 mb-4"></i>
          <p class="text-xl opacity-70 mb-2">Aucun journal trouvé</p>
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
        <button v-for="page in visiblePages" :key="page" class="btn btn-sm" :class="{ 'btn-active': page === currentPage }" @click="changePage(page)">
          {{ page }}
        </button>
        <button class="btn btn-sm" :disabled="currentPage >= totalPages" @click="changePage(currentPage + 1)">
          <i class="fas fa-chevron-right"></i>
        </button>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { adminAPI } from '@/services/api'
import { useStore } from 'vuex'

const store = useStore()
const logs = ref([])
const users = ref([])
const loading = ref(false)
const currentPage = ref(1)
const perPage = ref(50)
const totalLogs = ref(0)

const filters = ref({ search: '', action: '', user: '', period: '' })
let debounceTimer = null

const totalPages = computed(() => Math.ceil(totalLogs.value / perPage.value))
const visiblePages = computed(() => {
  const pages = []
  const start = Math.max(1, currentPage.value - 2)
  const end = Math.min(totalPages.value, currentPage.value + 2)
  for (let i = start; i <= end; i++) pages.push(i)
  return pages
})

const formatDateTime = (timestamp) => {
  return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  }).format(new Date(timestamp))
}

const getActionLabel = (action) => {
  const labels = {
    'CREATE': 'Création', 'READ': 'Lecture', 'UPDATE': 'Modification', 'DELETE': 'Suppression',
    'CREATE_USER': 'Créer utilisateur', 'UPDATE_USER': 'Modifier utilisateur', 'DELETE_USER': 'Supprimer utilisateur',
    'CREATE_GROUP': 'Créer groupe', 'UPDATE_GROUP': 'Modifier groupe', 'DELETE_GROUP': 'Supprimer groupe',
    'CREATE_FOLDER': 'Créer dossier', 'DELETE_FOLDER': 'Supprimer dossier', 'ADD_USER_TO_GROUP': 'Ajouter utilisateur à un groupe',
    
  }
  return labels[action] || action
}

const getActionBadgeClass = (action) => {
  if (action.startsWith('CREATE')) return 'badge-success'
  if (action.startsWith('UPDATE')) return 'badge-warning'
  if (action.startsWith('DELETE')) return 'badge-error'
  if (action.startsWith('READ')) return 'badge-info'
  if (action === 'ADD_USER_TO_GROUP' || action === 'REMOVE_USER_FROM_GROUP') return 'badge-primary'
  return 'badge-ghost'
}

const loadLogs = async () => {
  loading.value = true
  try {
    const response = await adminAPI.getLogs(currentPage.value, perPage.value)
    const data = response.data
    logs.value = data.logs || data || []
    totalLogs.value = data.total || logs.value.length
    console.log('Logs:', logs.value) 
  } catch (error) {
    console.error('Error loading logs:', error)
    store.dispatch('showError', 'Erreur lors du chargement des journaux')
  } finally {
    loading.value = false
  }
}

const changePage = (page) => {
  currentPage.value = Math.max(1, Math.min(page, totalPages.value))
  loadLogs()
}

const refreshLogs = () => { currentPage.value = 1; loadLogs() }

onMounted(() => { loadLogs() })
</script>

<style scoped>
.table th { position: sticky; top: 0; z-index: 10; background-color: var(--base-200); color: var(--base-content); }
.btn-group .btn { border-radius: 0; background-color: var(--base-200); color: var(--base-content); transition: 0.2s; }
.btn-group .btn:first-child { border-top-left-radius: 0.5rem; border-bottom-left-radius: 0.5rem; }
.btn-group .btn:last-child { border-top-right-radius: 0.5rem; border-bottom-right-radius: 0.5rem; }
.btn-group .btn:hover { background-color: var(--base-300); color: var(--base-content); }
</style>
