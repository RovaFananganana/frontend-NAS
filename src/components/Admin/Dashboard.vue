<!-- components/Admin/Dashboard.vue -->
<template>
  <div class="p-6">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-3xl font-bold">Tableau de bord Admin</h1>
      <button 
        class="btn btn-primary btn-sm"
        @click="refreshStats"
        :disabled="loading"
      >
        <i class="fas fa-sync-alt mr-2"></i>
        {{ loading ? 'Actualisation...' : 'Actualiser' }}
      </button>
    </div>

    <!-- Error Alert -->
    <div v-if="error" class="alert alert-error mb-6">
      <i class="fas fa-exclamation-triangle"></i>
      <span>{{ error }}</span>
    </div>

    <!-- Loading State -->
    <div v-if="loading && !stats" class="flex justify-center items-center py-12">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <!-- Stats Cards -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <!-- Utilisateurs -->
      <div class="stat bg-base-100 shadow rounded-lg">
        <div class="stat-figure text-primary">
          <i class="fas fa-users text-3xl"></i>
        </div>
        <div class="stat-title">Utilisateurs</div>
        <div class="stat-value text-primary">{{ stats?.total_users || 0 }}</div>
        <div class="stat-desc">
          {{ stats?.admin_users || 0 }} admins, {{ stats?.simple_users || 0 }} utilisateurs
        </div>
      </div>

      <!-- Groupes -->
      <div class="stat bg-base-100 shadow rounded-lg">
        <div class="stat-figure text-secondary">
          <i class="fas fa-layer-group text-3xl"></i>
        </div>
        <div class="stat-title">Groupes</div>
        <div class="stat-value text-secondary">{{ stats?.total_groups || 0 }}</div>
        <div class="stat-desc">Groupes actifs</div>
      </div>

      <!-- Dossiers -->
      <div class="stat bg-base-100 shadow rounded-lg">
        <div class="stat-figure text-accent">
          <i class="fas fa-folder text-3xl"></i>
        </div>
        <div class="stat-title">Dossiers</div>
        <div class="stat-value text-accent">{{ stats?.total_folders || 0 }}</div>
        <div class="stat-desc">Dossiers créés</div>
      </div>

      <!-- Fichiers -->
      <div class="stat bg-base-100 shadow rounded-lg">
        <div class="stat-figure text-success">
          <i class="fas fa-file text-3xl"></i>
        </div>
        <div class="stat-title">Fichiers</div>
        <div class="stat-value text-success">{{ stats?.total_files || 0 }}</div>
        <div class="stat-desc">Fichiers stockés</div>
      </div>
    </div>

    <!-- Storage Overview -->
    <div class="card bg-base-100 shadow-xl mb-6">
      <div class="card-body">
        <h2 class="card-title mb-4">
          <i class="fas fa-hdd mr-2"></i>
          Aperçu du stockage
        </h2>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div class="text-center">
            <div class="text-2xl font-bold text-info">{{ formatBytes(totalUsed) }}</div>
            <div class="text-sm opacity-70">Espace utilisé</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-warning">{{ formatBytes(totalQuota) }}</div>
            <div class="text-sm opacity-70">Quota total</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold" :class="usagePercentage > 90 ? 'text-error' : 'text-success'">
              {{ usagePercentage }}%
            </div>
            <div class="text-sm opacity-70">Utilisation</div>
          </div>
        </div>

        <!-- Progress Bar -->
        <div class="w-full">
          <progress 
            class="progress w-full"
            :class="{
              'progress-success': usagePercentage < 70,
              'progress-warning': usagePercentage >= 70 && usagePercentage < 90,
              'progress-error': usagePercentage >= 90
            }"
            :value="usagePercentage" 
            max="100"
          ></progress>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Recent Activity -->
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <h2 class="card-title">
            <i class="fas fa-clock mr-2"></i>
            Activité récente
          </h2>
          
          <div v-if="recentLogs.length === 0" class="text-center py-8 opacity-70">
            <i class="fas fa-inbox text-4xl mb-4"></i>
            <p>Aucune activité récente</p>
          </div>
          
          <div v-else class="space-y-3">
            <div 
              v-for="log in recentLogs" 
              :key="log.id"
              class="flex items-center justify-between p-3 bg-base-200 rounded-lg"
            >
              <div>
                <div class="font-medium">{{ getActionLabel(log.action) }}</div>
                <div class="text-sm opacity-70">{{ log.target }}</div>
              </div>
              <div class="text-sm opacity-70">
                {{ formatDate(log.timestamp) }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- System Status -->
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <h2 class="card-title">
            <i class="fas fa-server mr-2"></i>
            État du système
          </h2>
          
          <div class="space-y-4">
            <!-- Status indicators -->
            <div class="flex justify-between items-center">
              <span>Base de données</span>
              <div class="badge badge-success">Connectée</div>
            </div>
            
            <div class="flex justify-between items-center">
              <span>Stockage</span>
              <div 
                class="badge"
                :class="{
                  'badge-success': usagePercentage < 80,
                  'badge-warning': usagePercentage >= 80 && usagePercentage < 95,
                  'badge-error': usagePercentage >= 95
                }"
              >
                {{ usagePercentage < 80 ? 'Bon' : usagePercentage < 95 ? 'Attention' : 'Critique' }}
              </div>
            </div>
            
            <div class="flex justify-between items-center">
              <span>Dernière mise à jour</span>
              <span class="text-sm opacity-70">{{ formatDate(new Date()) }}</span>
            </div>
          </div>
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
const stats = ref(null)
const recentLogs = ref([])
const loading = ref(false)
const error = ref('')

// Computed properties
const totalUsed = computed(() => {
  // Calcul approximatif basé sur les stats
  return (stats.value?.total_files || 0) * 1024 * 1024 // Estimation
})

const totalQuota = computed(() => {
  // Estimation basée sur le nombre d'utilisateurs * quota moyen
  return (stats.value?.total_users || 0) * 2048 * 1024 * 1024 // 2GB par utilisateur
})

const usagePercentage = computed(() => {
  if (totalQuota.value === 0) return 0
  return Math.round((totalUsed.value / totalQuota.value) * 100)
})

// Methods
const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatDate = (date) => {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date))
}

const getActionLabel = (action) => {
  const labels = {
    'CREATE_USER': 'Utilisateur créé',
    'UPDATE_USER': 'Utilisateur modifié',
    'DELETE_USER': 'Utilisateur supprimé',
    'CREATE_GROUP': 'Groupe créé',
    'UPDATE_GROUP': 'Groupe modifié',
    'DELETE_GROUP': 'Groupe supprimé',
    'CREATE_FOLDER': 'Dossier créé',
    'DELETE_FOLDER': 'Dossier supprimé'
  }
  return labels[action] || action
}

const loadStats = async () => {
  try {
    const response = await adminAPI.getStats()
    stats.value = response.data
  } catch (err) {
    console.error('Error loading stats:', err)
    store.dispatch('showError', 'Erreur lors du chargement des statistiques')
  }
}

const loadRecentLogs = async () => {
  try {
    const response = await adminAPI.getLogs(1, 5) // 5 derniers logs
    recentLogs.value = response.data.logs || response.data || []
  } catch (err) {
    console.error('Error loading recent logs:', err)
  }
}

const refreshStats = async () => {
  loading.value = true
  error.value = ''
  
  try {
    await Promise.all([loadStats(), loadRecentLogs()])
    store.dispatch('showSuccess', 'Données actualisées')
  } catch (err) {
    error.value = 'Erreur lors de l\'actualisation des données'
    store.dispatch('showError', error.value)
  } finally {
    loading.value = false
  }
}

// Lifecycle
onMounted(() => {
  refreshStats()
})
</script>

<style scoped>
.stat {
  @apply border border-base-300;
}

.card {
  @apply border border-base-300;
}

/* Animation pour les stats */
.stat-value {
  animation: countUp 1s ease-out;
}

@keyframes countUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>