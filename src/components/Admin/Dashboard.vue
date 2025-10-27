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
    <!-- Theme Test removed -->

<!--Header -->
    <div class="flex items-center justify-between mb-6">
      <!-- <h1 class="text-3xl font-bold">Tableau de bord Admin</h1> -->
      <div class="flex gap-2">
        <button 
          class="btn btn-primary btn-sm"
          @click="refreshStats"
          :disabled="loading"
        >
          <i class="fas fa-sync-alt mr-2"></i>
          {{ loading ? 'Actualisation...' : 'Actualiser' }}
        </button>
        <button 
          class="btn btn-secondary btn-sm"
          @click="syncWithNas"
          :disabled="syncing || (nasStatus && !nasStatus.connected)"
          :title="nasStatus && !nasStatus.connected ? 'NAS non accessible - se connecter au réseau de travail' : ''"
        >
          <i class="fas fa-hdd mr-2" :class="{ 'animate-spin': syncing }"></i>
          {{ syncing ? 'Synchronisation...' : 'Sync NAS' }}
        </button>
        <button 
          class="btn btn-accent btn-sm"
          @click="openDriveClient"
          :disabled="!nasStatus?.connected"
          :title="!nasStatus?.connected ? 'NAS non accessible' : 'Ouvrir Synology Drive Client'"
        >
          <i class="fas fa-external-link-alt mr-2"></i>
          Open Drive Client
        </button>
        <button 
          class="btn btn-outline btn-sm"
          @click="showConfigModal = true"
        >
          <i class="fas fa-cog mr-2"></i>
          Configurer
        </button>
      </div>
    </div>

    <!-- System Status Bar -->
    <div class="w-full mb-6">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- NAS Connection Status -->
        <div v-if="nasStatus" class="alert" :class="getSystemStatusClass('nas', nasStatus.connected)">
          <i class="fas" :class="nasStatus.connected ? 'fa-check-circle' : 'fa-wifi-slash'"></i>
          <div class="flex-1">
            <div class="font-medium">Connexion NAS</div>
            <div class="text-sm opacity-90">{{ nasStatus.message }}</div>
            <div v-if="nasStatus.connected && nasStatus.server_info" class="text-xs mt-1 opacity-75">
              {{ nasStatus.server_info.ip }}:{{ nasStatus.server_info.port }} | {{ nasStatus.server_info.share }} | {{ nasStatus.root_files_count }} fichiers
            </div>
          </div>
        </div>

        <!-- System Health Status -->
        <div class="alert" :class="getSystemStatusClass('system', getSystemHealth())">
          <i class="fas fa-server"></i>
          <div class="flex-1">
            <div class="font-medium">État du système</div>
            <div class="text-sm opacity-90">
              {{ getSystemHealthMessage() }}
            </div>
            <div class="text-xs mt-1 opacity-75">
              DB: Connectée | Stockage: {{ usagePercentage }}% | Dernière MAJ: {{ formatTime(new Date()) }}
            </div>
          </div>
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

    <!-- Debug Panel removed -->



    <!-- Recent Activity - Full Width -->
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
        
        <div v-else class="overflow-x-auto">
          <table class="table table-zebra w-full">
            <thead>
              <tr>
                <th class="w-48">Date & Heure</th>
                <th class="w-40">Action</th>
                <th>Détails</th>
              </tr>
            </thead>
            <tbody>
              <tr 
                v-for="log in recentLogs" 
                :key="log.id"
                class="hover:bg-base-200"
              >
                <td class="text-sm">
                  {{ formatFullDate(log.timestamp) }}
                </td>
                <td>
                  <span class="inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium" :class="getActionBadgeClass(log.action)">
                    <i class="fas" :class="getActionIcon(log.action)"></i>
                    {{ getActionLabel(log.action) }}
                  </span>
                </td>
                <td class="text-sm">
                  {{ formatLogDetails(log) }}
                </td>
              </tr>
            </tbody>
          </table>
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

    <!-- Configuration Modal -->
    <div v-if="showConfigModal" class="modal modal-open">
      <div class="modal-box max-w-2xl">
        <h3 class="font-bold text-lg mb-4">
          <i class="fas fa-cog mr-2"></i>
          Configuration du système
        </h3>
        
        <div class="space-y-6">
          <!-- NAS Configuration -->
          <div class="form-control">
            <label class="label">
              <span class="label-text font-medium">Configuration NAS</span>
            </label>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="label">
                  <span class="label-text">Serveur NAS</span>
                </label>
                <input 
                  type="text" 
                  class="input input-bordered w-full" 
                  :value="nasStatus?.server_info?.ip || '10.61.17.33'"
                  readonly
                />
              </div>
              <div>
                <label class="label">
                  <span class="label-text">Partage</span>
                </label>
                <input 
                  type="text" 
                  class="input input-bordered w-full" 
                  :value="nasStatus?.server_info?.share || 'NAS'"
                  readonly
                />
              </div>
            </div>
          </div>

          <!-- Sync Configuration -->
          <div class="form-control">
            <label class="label">
              <span class="label-text font-medium">Configuration de synchronisation</span>
            </label>
            <div class="space-y-2">
              <label class="cursor-pointer label">
                <span class="label-text">Synchronisation automatique</span>
                <input type="checkbox" class="toggle toggle-primary" checked />
              </label>
              <label class="cursor-pointer label">
                <span class="label-text">Notifications de synchronisation</span>
                <input type="checkbox" class="toggle toggle-primary" checked />
              </label>
            </div>
          </div>

          <!-- System Settings -->
          <div class="form-control">
            <label class="label">
              <span class="label-text font-medium">Paramètres système</span>
            </label>
            <div class="space-y-2">
              <label class="cursor-pointer label">
                <span class="label-text">Mode debug</span>
                <input type="checkbox" class="toggle toggle-secondary" />
              </label>
              <label class="cursor-pointer label">
                <span class="label-text">Logs détaillés</span>
                <input type="checkbox" class="toggle toggle-secondary" />
              </label>
            </div>
          </div>
        </div>

        <div class="modal-action">
          <button class="btn btn-primary">
            <i class="fas fa-save mr-2"></i>
            Sauvegarder
          </button>
          <button class="btn" @click="showConfigModal = false">Annuler</button>
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



const store = useStore()

// Reactive data
const stats = ref(null)
const recentLogs = ref([])
const loading = ref(false)
const error = ref('')
const showPerformanceDashboard = ref(false)
const syncing = ref(false)
const nasStatus = ref(null)
const showConfigModal = ref(false)

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

const formatFullDate = (date) => {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(new Date(date))
}

const formatTime = (date) => {
  return new Intl.DateTimeFormat('fr-FR', {
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
    'DELETE_FOLDER': 'Dossier supprimé',
    'DOWNLOAD_FILE': 'Fichier téléchargé',
    'ACCESS_FILE': 'Fichier consulté',
    'ACCESS_FOLDER': 'Dossier ouvert'
  }
  return labels[action] || action
}

const getActionIcon = (action) => {
  const icons = {
    'CREATE_USER': 'fa-user-plus',
    'UPDATE_USER': 'fa-user-edit',
    'DELETE_USER': 'fa-user-minus',
    'CREATE_GROUP': 'fa-users',
    'UPDATE_GROUP': 'fa-users-cog',
    'DELETE_GROUP': 'fa-users-slash',
    'CREATE_FOLDER': 'fa-folder-plus',
    'DELETE_FOLDER': 'fa-folder-minus',
    'DOWNLOAD_FILE': 'fa-download',
    'ACCESS_FILE': 'fa-file',
    'ACCESS_FOLDER': 'fa-folder-open'
  }
  return icons[action] || 'fa-info-circle'
}

const getSystemStatusClass = (type, status) => {
  if (type === 'nas') {
    return status ? 'alert-success' : 'alert-warning'
  }
  if (type === 'system') {
    if (status === 'good') return 'alert-success'
    if (status === 'warning') return 'alert-warning'
    if (status === 'critical') return 'alert-error'
  }
  return 'alert-info'
}

const getSystemHealth = () => {
  if (usagePercentage.value >= 95) return 'critical'
  if (usagePercentage.value >= 80) return 'warning'
  return 'good'
}

const getSystemHealthMessage = () => {
  const health = getSystemHealth()
  if (health === 'critical') return 'Attention critique requise'
  if (health === 'warning') return 'Surveillance recommandée'
  return 'Système opérationnel'
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
    
    // Cas spécial : si target contient "path | {json}", extraire seulement le path
    if (log.target && log.target.includes(' | {')) {
      const pathPart = log.target.split(' | {')[0]
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

const getActionBadgeClass = (action) => {
  const classes = {
    'CREATE_USER': 'bg-success/20 text-success',
    'UPDATE_USER': 'bg-info/20 text-info',
    'DELETE_USER': 'bg-error/20 text-error',
    'CREATE_GROUP': 'bg-success/20 text-success',
    'UPDATE_GROUP': 'bg-info/20 text-info',
    'DELETE_GROUP': 'bg-error/20 text-error',
    'CREATE_FOLDER': 'bg-success/20 text-success',
    'DELETE_FOLDER': 'bg-error/20 text-error',
    'DOWNLOAD_FILE': 'bg-primary/20 text-primary',
    'ACCESS_FILE': 'bg-accent/20 text-accent',
    'ACCESS_FOLDER': 'bg-secondary/20 text-secondary',
    'LOGIN': 'bg-success/20 text-success',
    'LOGOUT': 'bg-warning/20 text-warning'
  }
  return classes[action] || 'bg-base-300 text-base-content'
}

const openDriveClient = () => {
  if (nasStatus.value?.connected && nasStatus.value?.server_info) {
    const driveUrl = `http://${nasStatus.value.server_info.ip}:5000`
    window.open(driveUrl, '_blank')
  } else {
    store.dispatch('showWarning', 'NAS non accessible - impossible d\'ouvrir Drive Client')
  }
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