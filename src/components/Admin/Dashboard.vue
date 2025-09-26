<!-- components/Admin/Dashboard.vue -->
<template>
  <div class="p-6">
    <!-- Performance Alert -->
    <div v-if="performanceIssues.length > 0" class="alert alert-warning mb-6">
      <i class="fas fa-exclamation-triangle"></i>
      <div>
        <h4 class="font-bold">Performance Issues Detected</h4>
        <p>{{ performanceIssues.length }} performance issues need attention.</p>
        <button class="btn btn-sm btn-outline mt-2" @click="showPerformanceDashboard = true">
          View Details
        </button>
      </div>
    </div>
    <!-- Theme Test (temporary)>
 <ThemeTest />

<!--Header -->
    <div class="flex items-center justify-between mb-6">
      <!-- <h1 class="text-3xl font-bold">Tableau de bord Admin</h1> -->
      <div class="flex gap-2">
        <button 
          class="btn btn-secondary btn-sm"
          @click="syncWithNas"
          :disabled="syncing || (nasStatus && !nasStatus.connected)"
          :title="nasStatus && !nasStatus.connected ? 'NAS not accessible - connect to work network' : ''"
        >
          <i class="fas fa-hdd mr-2" :class="{ 'animate-spin': syncing }"></i>
          {{ syncing ? 'Synchronisation...' : 'Sync NAS' }}
        </button>
        <button 
          class="btn btn-primary btn-sm"
          @click="refreshStats"
          :disabled="loading"
        >
          <i class="fas fa-sync-alt mr-2"></i>
          {{ loading ? 'Actualisation...' : 'Actualiser' }}
        </button>
      </div>
    </div>

    <!-- NAS Status -->
    <div v-if="nasStatus" class="alert mb-6" :class="nasStatus.connected ? 'alert-success' : 'alert-warning'">
      <i class="fas" :class="nasStatus.connected ? 'fa-check-circle' : 'fa-wifi-slash'"></i>
      <div>
        <h4 class="font-bold">NAS Status</h4>
        <p>{{ nasStatus.message }}</p>
        <div v-if="nasStatus.connected && nasStatus.server_info" class="text-sm mt-1">
          Server: {{ nasStatus.server_info.ip }}:{{ nasStatus.server_info.port }} | 
          Share: {{ nasStatus.server_info.share }} | 
          Files: {{ nasStatus.root_files_count }}
        </div>
        <div v-else-if="!nasStatus.connected" class="text-sm mt-1">
          💡 Tip: Connect to work network to enable NAS synchronization
        </div>
      </div>
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
          <span v-if="stats?.sync_performed" class="badge badge-success badge-xs ml-2">Sync NAS</span>
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

    <!-- Debug Panel (temporary) -->
    <div class="mb-6">
      <AuthDebug />
    </div>

    <!-- Synology Drive Integration -->
    <div class="mb-6">
      <SynologyDriveStatus />
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
              <span>NAS Synology</span>
              <div 
                class="badge"
                :class="nasStatus?.connected ? 'badge-success' : 'badge-warning'"
              >
                {{ nasStatus?.connected ? 'Connecté' : 'Déconnecté' }}
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

    <!-- Performance Dashboard Modal -->
    <div v-if="showPerformanceDashboard" class="modal modal-open">
      <div class="modal-box max-w-6xl">
        <h3 class="font-bold text-lg mb-4">Performance Dashboard</h3>
        <PerformanceDashboard />
        <div class="modal-action">
          <button class="btn" @click="showPerformanceDashboard = false">Close</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { adminAPI } from '@/services/api'
import { useStore } from 'vuex'
import PerformanceDashboard from './PerformanceDashboard.vue'
import SynologyDriveStatus from '../Shared/SynologyDriveStatus.vue'
import AuthDebug from '../Debug/AuthDebug.vue'
import ThemeTest from '../Debug/ThemeTest.vue'

const store = useStore()

// Reactive data
const stats = ref(null)
const recentLogs = ref([])
const loading = ref(false)
const error = ref('')
const showPerformanceDashboard = ref(false)
const syncing = ref(false)
const nasStatus = ref(null)

// Computed properties
const performanceIssues = computed(() => {
  // Mock performance issues - in real implementation this would come from performance monitoring
  return []
})

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

const loadNasStatus = async () => {
  try {
    const response = await adminAPI.getNasStatus()
    nasStatus.value = response.data
  } catch (err) {
    console.error('Error loading NAS status:', err)
    nasStatus.value = {
      connected: false,
      message: 'Erreur lors de la vérification du statut NAS'
    }
  }
}

const syncWithNas = async () => {
  syncing.value = true
  
  try {
    const response = await adminAPI.syncWithNas({ dryRun: false, maxDepth: 10 })
    
    if (response.data.success) {
      store.dispatch('showSuccess', `Synchronisation réussie: ${response.data.stats.folders_added} dossiers et ${response.data.stats.files_added} fichiers ajoutés, ${response.data.stats.folders_removed} dossiers et ${response.data.stats.files_removed} fichiers supprimés`)
      
      // Refresh stats and NAS status after sync
      await Promise.all([loadStats(), loadNasStatus()])
    } else {
      if (response.data.nas_accessible === false) {
        store.dispatch('showWarning', `NAS non accessible: ${response.data.message}`)
      } else {
        store.dispatch('showError', `Erreur de synchronisation: ${response.data.message}`)
      }
    }
  } catch (err) {
    console.error('Error syncing with NAS:', err)
    if (err.response?.status === 400) {
      store.dispatch('showWarning', 'NAS non accessible - vérifiez votre connexion au réseau de travail')
    } else {
      store.dispatch('showError', 'Erreur lors de la synchronisation avec le NAS')
    }
  } finally {
    syncing.value = false
  }
}

const refreshStats = async () => {
  loading.value = true
  error.value = ''
  
  try {
    await Promise.all([loadStats(), loadRecentLogs(), loadNasStatus()])
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