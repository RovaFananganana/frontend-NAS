<template>
  <div class="system-logs-panel">
    <div class="panel-header">
      <h2>Journaux Système</h2>
      <div class="header-controls">
        <button @click="refreshAllLogs" :disabled="loading" class="btn-primary">
          <i class="fas fa-sync-alt" :class="{ 'fa-spin': loading }"></i>
          Actualiser
        </button>
      </div>
    </div>

    <div class="tabs-container">
      <div class="tabs">
        <button 
          v-for="tab in tabs" 
          :key="tab.id"
          @click="activeTab = tab.id"
          :class="['tab', { active: activeTab === tab.id }]"
        >
          <i :class="tab.icon"></i>
          {{ tab.label }}
          <span v-if="tab.count" class="tab-count">{{ tab.count }}</span>
        </button>
      </div>

      <div class="tab-content">
        <!-- Onglet Activités Fichiers -->
        <div v-if="activeTab === 'activity'" class="tab-panel">
          <div class="alert alert-info">
            <i class="fas fa-info-circle"></i>
            <span>Visualiseur de logs d'activité en cours de développement</span>
          </div>
        </div>

        <!-- Onglet Permissions -->
        <div v-if="activeTab === 'permissions'" class="tab-panel">
          <div class="alert alert-info">
            <i class="fas fa-info-circle"></i>
            <span>Visualiseur de logs de permissions en cours de développement</span>
          </div>
        </div>

        <!-- Onglet Résumé -->
        <div v-if="activeTab === 'summary'" class="tab-panel">
          <div class="summary-grid">
            <!-- Statistiques d'activité -->
            <div class="summary-card">
              <h3>Activités Récentes (24h)</h3>
              <div class="stats-grid">
                <div class="stat-item">
                  <div class="stat-value">{{ activityStats.total_activities }}</div>
                  <div class="stat-label">Total Activités</div>
                </div>
                <div class="stat-item">
                  <div class="stat-value">{{ activityStats.downloads }}</div>
                  <div class="stat-label">Téléchargements</div>
                </div>
                <div class="stat-item">
                  <div class="stat-value">{{ activityStats.uploads }}</div>
                  <div class="stat-label">Uploads</div>
                </div>
                <div class="stat-item error" v-if="activityStats.errors > 0">
                  <div class="stat-value">{{ activityStats.errors }}</div>
                  <div class="stat-label">Erreurs</div>
                </div>
              </div>
            </div>

            <!-- Statistiques de permissions -->
            <div class="summary-card">
              <h3>Permissions (24h)</h3>
              <div class="stats-grid">
                <div class="stat-item">
                  <div class="stat-value">{{ permissionStats.totalChecks }}</div>
                  <div class="stat-label">Vérifications</div>
                </div>
                <div class="stat-item">
                  <div class="stat-value">{{ (permissionStats.cache_hit_rate * 100).toFixed(1) }}%</div>
                  <div class="stat-label">Taux Cache</div>
                </div>
                <div class="stat-item">
                  <div class="stat-value">{{ permissionStats.averageDuration.toFixed(1) }}ms</div>
                  <div class="stat-label">Durée Moy.</div>
                </div>
                <div class="stat-item error" v-if="permissionStats.failures > 0">
                  <div class="stat-value">{{ permissionStats.failures }}</div>
                  <div class="stat-label">Échecs</div>
                </div>
              </div>
            </div>

            <!-- Chemins les plus actifs -->
            <div class="summary-card">
              <h3>Chemins les Plus Actifs</h3>
              <div class="active-paths-list">
                <div 
                  v-for="(count, path) in topActivePaths" 
                  :key="path"
                  class="path-item"
                >
                  <div class="path-name" :title="path">{{ path }}</div>
                  <div class="path-count">{{ count }} activités</div>
                </div>
                <div v-if="Object.keys(topActivePaths).length === 0" class="no-data">
                  Aucune activité récente
                </div>
              </div>
            </div>

            <!-- Utilisateurs les plus actifs -->
            <div class="summary-card">
              <h3>Utilisateurs les Plus Actifs</h3>
              <div class="active-users-list">
                <div 
                  v-for="user in topActiveUsers" 
                  :key="user.username"
                  class="user-item"
                >
                  <div class="user-name">{{ user.username }}</div>
                  <div class="user-stats">
                    <span class="user-activities">{{ user.activities }} activités</span>
                    <span class="user-permissions">{{ user.permissions }} permissions</span>
                  </div>
                </div>
                <div v-if="topActiveUsers.length === 0" class="no-data">
                  Aucune activité récente
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Onglet Alertes -->
        <div v-if="activeTab === 'alerts'" class="tab-panel">
          <div class="alerts-section">
            <h3>Alertes Système</h3>
            
            <!-- Alertes d'erreurs récentes -->
            <div class="alert-group" v-if="recentErrors.length > 0">
              <h4>Erreurs Récentes</h4>
              <div class="alert-list">
                <div 
                  v-for="error in recentErrors" 
                  :key="error.id"
                  class="alert-item error"
                >
                  <div class="alert-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                  </div>
                  <div class="alert-content">
                    <div class="alert-title">{{ error.operation }} - {{ error.error_message }}</div>
                    <div class="alert-details">
                      <span class="alert-path">{{ error.path }}</span>
                      <span class="alert-time">{{ formatTimestamp(error.timestamp) }}</span>
                      <span class="alert-user">{{ error.username }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Alertes de permissions -->
            <div class="alert-group" v-if="permissionFailures.length > 0">
              <h4>Échecs de Permissions</h4>
              <div class="alert-list">
                <div 
                  v-for="failure in permissionFailures" 
                  :key="failure.id"
                  class="alert-item warning"
                >
                  <div class="alert-icon">
                    <i class="fas fa-shield-alt"></i>
                  </div>
                  <div class="alert-content">
                    <div class="alert-title">Accès refusé - {{ failure.action }}</div>
                    <div class="alert-details">
                      <span class="alert-path">{{ failure.path }}</span>
                      <span class="alert-time">{{ formatTimestamp(failure.timestamp) }}</span>
                      <span class="alert-user">{{ failure.username }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="recentErrors.length === 0 && permissionFailures.length === 0" class="no-alerts">
              <i class="fas fa-check-circle"></i>
              <p>Aucune alerte récente</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useActivityLogger } from '@/composables/useActivityLogger'
import { usePermissions } from '@/composables/usePermissions'


export default {
  name: 'SystemLogsPanel',

  setup() {
    const activeTab = ref('summary')
    const loading = ref(false)
    const refreshInterval = ref(null)

    // Composables
    const { 
      getActivityStats, 
      getActivityLogs,
      activityLogs 
    } = useActivityLogger()
    
    const { 
      getPerformanceMetrics, 
      getPermissionLogs,
      permissionLogs 
    } = usePermissions()

    // Computed properties
    const activityStats = computed(() => getActivityStats(24))
    const permissionStats = computed(() => getPerformanceMetrics())

    const tabs = computed(() => [
      {
        id: 'summary',
        label: 'Résumé',
        icon: 'fas fa-chart-pie',
        count: null
      },
      {
        id: 'activity',
        label: 'Activités',
        icon: 'fas fa-file-alt',
        count: activityLogs.value.length
      },
      {
        id: 'permissions',
        label: 'Permissions',
        icon: 'fas fa-shield-alt',
        count: permissionLogs.value.length
      },
      {
        id: 'alerts',
        label: 'Alertes',
        icon: 'fas fa-exclamation-triangle',
        count: recentErrors.value.length + permissionFailures.value.length
      }
    ])

    const topActivePaths = computed(() => {
      const stats = activityStats.value
      const paths = stats.most_active_paths || {}
      
      // Trier et prendre les 5 premiers
      const sorted = Object.entries(paths)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
      
      return Object.fromEntries(sorted)
    })

    const topActiveUsers = computed(() => {
      const activityLogs = getActivityLogs({ since: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() })
      const permissionLogs = getPermissionLogs({ since: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() })
      
      const userStats = {}
      
      // Compter les activités par utilisateur
      activityLogs.forEach(log => {
        const username = log.username || 'Inconnu'
        if (!userStats[username]) {
          userStats[username] = { username, activities: 0, permissions: 0 }
        }
        userStats[username].activities++
      })
      
      // Compter les permissions par utilisateur
      permissionLogs.forEach(log => {
        const username = log.username || 'Inconnu'
        if (!userStats[username]) {
          userStats[username] = { username, activities: 0, permissions: 0 }
        }
        userStats[username].permissions++
      })
      
      return Object.values(userStats)
        .sort((a, b) => (b.activities + b.permissions) - (a.activities + a.permissions))
        .slice(0, 5)
    })

    const recentErrors = computed(() => {
      return getActivityLogs({ 
        operation: 'ERROR',
        since: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      }).slice(0, 10)
    })

    const permissionFailures = computed(() => {
      return getPermissionLogs({ 
        operation: 'action_check_denied',
        since: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      }).slice(0, 10)
    })

    // Methods
    const refreshAllLogs = async () => {
      loading.value = true
      try {
        // Simuler un délai de rafraîchissement
        await new Promise(resolve => setTimeout(resolve, 1000))
      } finally {
        loading.value = false
      }
    }

    const formatTimestamp = (timestamp) => {
      return new Date(timestamp).toLocaleString('fr-FR')
    }

    const startAutoRefresh = () => {
      refreshInterval.value = setInterval(() => {
        if (!loading.value) {
          refreshAllLogs()
        }
      }, 30000) // Rafraîchir toutes les 30 secondes
    }

    const stopAutoRefresh = () => {
      if (refreshInterval.value) {
        clearInterval(refreshInterval.value)
        refreshInterval.value = null
      }
    }

    // Lifecycle
    onMounted(() => {
      refreshAllLogs()
      startAutoRefresh()
    })

    onUnmounted(() => {
      stopAutoRefresh()
    })

    return {
      activeTab,
      loading,
      tabs,
      activityStats,
      permissionStats,
      topActivePaths,
      topActiveUsers,
      recentErrors,
      permissionFailures,
      refreshAllLogs,
      formatTimestamp
    }
  }
}
</script>

<style scoped>
.system-logs-panel {
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  height: calc(100vh - 120px);
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #e5e7eb;
}

.panel-header h2 {
  margin: 0;
  color: #1f2937;
}

.header-controls {
  display: flex;
  gap: 10px;
}

.btn-primary {
  padding: 8px 16px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.tabs-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.tabs {
  display: flex;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 20px;
}

.tab {
  padding: 12px 20px;
  border: none;
  background: none;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #6b7280;
}

.tab:hover {
  color: #374151;
  background: #f9fafb;
}

.tab.active {
  color: #3b82f6;
  border-bottom-color: #3b82f6;
}

.tab-count {
  background: #e5e7eb;
  color: #6b7280;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 500;
}

.tab.active .tab-count {
  background: #dbeafe;
  color: #3b82f6;
}

.tab-content {
  flex: 1;
  overflow: hidden;
}

.tab-panel {
  height: 100%;
  overflow: auto;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.summary-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 20px;
}

.summary-card h3 {
  margin: 0 0 15px 0;
  color: #1f2937;
  font-size: 16px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 15px;
}

.stat-item {
  text-align: center;
  padding: 10px;
  background: white;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.stat-item.error {
  background: #fef2f2;
  border-color: #fecaca;
}

.stat-value {
  font-size: 20px;
  font-weight: bold;
  color: #1e40af;
}

.stat-item.error .stat-value {
  color: #dc2626;
}

.stat-label {
  font-size: 12px;
  color: #6b7280;
  margin-top: 4px;
}

.active-paths-list, .active-users-list {
  max-height: 200px;
  overflow-y: auto;
}

.path-item, .user-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f3f4f6;
}

.path-item:last-child, .user-item:last-child {
  border-bottom: none;
}

.path-name, .user-name {
  font-weight: 500;
  color: #374151;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  margin-right: 10px;
}

.path-count {
  color: #6b7280;
  font-size: 14px;
}

.user-stats {
  display: flex;
  gap: 10px;
  font-size: 12px;
  color: #6b7280;
}

.alerts-section h3 {
  margin-bottom: 20px;
  color: #1f2937;
}

.alert-group {
  margin-bottom: 25px;
}

.alert-group h4 {
  margin-bottom: 10px;
  color: #374151;
  font-size: 14px;
  font-weight: 600;
}

.alert-list {
  max-height: 300px;
  overflow-y: auto;
}

.alert-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 8px;
}

.alert-item.error {
  background: #fef2f2;
  border: 1px solid #fecaca;
}

.alert-item.warning {
  background: #fffbeb;
  border: 1px solid #fed7aa;
}

.alert-icon {
  color: #dc2626;
  font-size: 16px;
  margin-top: 2px;
}

.alert-item.warning .alert-icon {
  color: #d97706;
}

.alert-content {
  flex: 1;
}

.alert-title {
  font-weight: 500;
  color: #374151;
  margin-bottom: 4px;
}

.alert-details {
  display: flex;
  gap: 15px;
  font-size: 12px;
  color: #6b7280;
}

.alert-path {
  font-family: monospace;
}

.no-data, .no-alerts {
  text-align: center;
  color: #6b7280;
  padding: 20px;
}

.no-alerts {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.no-alerts i {
  font-size: 48px;
  color: #10b981;
}
</style>