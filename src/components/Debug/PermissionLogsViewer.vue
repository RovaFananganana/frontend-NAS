<template>
  <div class="permission-logs-viewer">
    <div class="header">
      <h3>Permission Logs & Performance Monitor</h3>
      <div class="controls">
        <button @click="refreshLogs" :disabled="loading" class="btn-refresh">
          <i class="fas fa-sync-alt" :class="{ 'fa-spin': loading }"></i>
          Actualiser
        </button>
        <button @click="clearLogs" class="btn-clear">
          <i class="fas fa-trash"></i>
          Effacer
        </button>
        <button @click="exportLogs" class="btn-export">
          <i class="fas fa-download"></i>
          Exporter
        </button>
      </div>
    </div>

    <!-- Performance Metrics -->
    <div class="metrics-section">
      <h4>Performance Metrics</h4>
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-value">{{ metrics.totalChecks }}</div>
          <div class="metric-label">Total vérifications</div>
        </div>
        <div class="metric-card">
          <div class="metric-value">{{ (metrics.cache_hit_rate * 100).toFixed(1) }}%</div>
          <div class="metric-label">Taux de cache</div>
        </div>
        <div class="metric-card">
          <div class="metric-value">{{ metrics.averageDuration.toFixed(1) }}ms</div>
          <div class="metric-label">Durée moyenne</div>
        </div>
        <div class="metric-card">
          <div class="metric-value">{{ metrics.failures }}</div>
          <div class="metric-label">Échecs</div>
        </div>
        <div class="metric-card">
          <div class="metric-value">{{ metrics.cache_size }}</div>
          <div class="metric-label">Taille cache</div>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="filters-section">
      <h4>Filters</h4>
      <div class="filters-grid">
        <div class="filter-group">
          <label>Opération:</label>
          <select v-model="filters.operation">
            <option value="">Toutes les opérations</option>
            <option value="load_permissions_start">Début de chargement</option>
            <option value="permissions_loaded_success">Chargement réussi</option>
            <option value="permissions_load_error">Erreur de chargement</option>
            <option value="cache_hit">Cache trouvé</option>
            <option value="cache_miss">Cache manqué</option>
            <option value="action_check_denied">Accès refusé</option>
          </select>
        </div>
        <div class="filter-group">
          <label>Chemin:</label>
          <input v-model="filters.path" type="text" placeholder="Filtrer par chemin...">
        </div>
        <div class="filter-group">
          <label>Depuis:</label>
          <input v-model="filters.since" type="datetime-local">
        </div>
      </div>
    </div>

    <!-- Logs Table -->
    <div class="logs-section">
      <h4>Permission Logs ({{ filteredLogs.length }} entries)</h4>
      <div class="logs-table-container">
        <table class="logs-table">
          <thead>
            <tr>
              <th @click="handleSort('timestamp')" class="sortable-header">
                <div class="flex items-center gap-2 cursor-pointer">
                  <span>Horodatage</span>
                  <i v-if="sortColumn === 'timestamp'" :class="[
                    sortDirection === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down',
                    'text-primary text-xs'
                  ]"></i>
                  <i v-else class="fas fa-sort text-gray-400 text-xs"></i>
                </div>
              </th>
              <th @click="handleSort('operation')" class="sortable-header">
                <div class="flex items-center gap-2 cursor-pointer">
                  <span>Opération</span>
                  <i v-if="sortColumn === 'operation'" :class="[
                    sortDirection === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down',
                    'text-primary text-xs'
                  ]"></i>
                  <i v-else class="fas fa-sort text-gray-400 text-xs"></i>
                </div>
              </th>
              <th @click="handleSort('path')" class="sortable-header">
                <div class="flex items-center gap-2 cursor-pointer">
                  <span>Chemin</span>
                  <i v-if="sortColumn === 'path'" :class="[
                    sortDirection === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down',
                    'text-primary text-xs'
                  ]"></i>
                  <i v-else class="fas fa-sort text-gray-400 text-xs"></i>
                </div>
              </th>
              <th @click="handleSort('duration')" class="sortable-header">
                <div class="flex items-center gap-2 cursor-pointer">
                  <span>Durée</span>
                  <i v-if="sortColumn === 'duration'" :class="[
                    sortDirection === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down',
                    'text-primary text-xs'
                  ]"></i>
                  <i v-else class="fas fa-sort text-gray-400 text-xs"></i>
                </div>
              </th>
              <th @click="handleSort('result')" class="sortable-header">
                <div class="flex items-center gap-2 cursor-pointer">
                  <span>Résultat</span>
                  <i v-if="sortColumn === 'result'" :class="[
                    sortDirection === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down',
                    'text-primary text-xs'
                  ]"></i>
                  <i v-else class="fas fa-sort text-gray-400 text-xs"></i>
                </div>
              </th>
              <th>Détails</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in paginatedLogs" :key="log.timestamp + log.operation" 
                :class="getLogRowClass(log)">
              <td class="timestamp">{{ formatTimestamp(log.timestamp) }}</td>
              <td class="operation">
                <span :class="getOperationClass(log.operation)">
                  {{ log.operation }}
                </span>
              </td>
              <td class="path">{{ log.path || '-' }}</td>
              <td class="duration">
                <span v-if="log.duration_ms">{{ log.duration_ms.toFixed(1) }}ms</span>
                <span v-else>-</span>
              </td>
              <td class="result">
                <span v-if="log.result !== undefined" :class="getResultClass(log.result)">
                  {{ log.result }}
                </span>
                <span v-else>-</span>
              </td>
              <td class="details">
                <button @click="showLogDetails(log)" class="btn-details">
                  <i class="fas fa-info-circle"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="pagination" v-if="totalPages > 1">
        <button @click="currentPage--" :disabled="currentPage === 1" class="btn-page">
          <i class="fas fa-chevron-left"></i>
        </button>
        <span class="page-info">Page {{ currentPage }} of {{ totalPages }}</span>
        <button @click="currentPage++" :disabled="currentPage === totalPages" class="btn-page">
          <i class="fas fa-chevron-right"></i>
        </button>
      </div>
    </div>

    <!-- Log Details Modal -->
    <div v-if="selectedLog" class="modal-overlay" @click="closeLogDetails">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h4>Log Details</h4>
          <button @click="closeLogDetails" class="btn-close">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <pre>{{ JSON.stringify(selectedLog, null, 2) }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import { usePermissions } from '@/composables/usePermissions'

export default {
  name: 'PermissionLogsViewer',
  setup() {
    const { 
      getPermissionLogs, 
      getPerformanceMetrics, 
      exportLogs,
      permissionLogs,
      performanceMetrics
    } = usePermissions()

    const loading = ref(false)
    const selectedLog = ref(null)
    const currentPage = ref(1)
    const pageSize = ref(50)
    
    // État du tri
    const sortColumn = ref('timestamp')
    const sortDirection = ref('desc')

    const filters = ref({
      operation: '',
      path: '',
      since: ''
    })

    // Computed properties
    const metrics = computed(() => performanceMetrics.value || {
      totalChecks: 0,
      cacheHits: 0,
      cacheMisses: 0,
      totalDuration: 0,
      averageDuration: 0,
      failures: 0,
      cache_hit_rate: 0,
      cache_size: 0
    })

    const filteredLogs = computed(() => {
      const logs = getPermissionLogs(filters.value)
      
      // Appliquer le tri
      return [...logs].sort((a, b) => {
        let aValue, bValue
        
        switch (sortColumn.value) {
          case 'timestamp':
            aValue = new Date(a.timestamp || 0)
            bValue = new Date(b.timestamp || 0)
            break
          case 'operation':
            aValue = (a.operation || '').toLowerCase()
            bValue = (b.operation || '').toLowerCase()
            break
          case 'path':
            aValue = (a.path || '').toLowerCase()
            bValue = (b.path || '').toLowerCase()
            break
          case 'duration':
            aValue = a.duration_ms || 0
            bValue = b.duration_ms || 0
            break
          case 'result':
            aValue = String(a.result || '').toLowerCase()
            bValue = String(b.result || '').toLowerCase()
            break
          default:
            return 0
        }
        
        if (aValue < bValue) return sortDirection.value === 'asc' ? -1 : 1
        if (aValue > bValue) return sortDirection.value === 'asc' ? 1 : -1
        return 0
      })
    })

    const totalPages = computed(() => {
      return Math.ceil(filteredLogs.value.length / pageSize.value)
    })

    const paginatedLogs = computed(() => {
      const start = (currentPage.value - 1) * pageSize.value
      const end = start + pageSize.value
      return filteredLogs.value.slice(start, end)
    })

    // Methods
    const refreshLogs = async () => {
      loading.value = true
      try {
        // Les logs sont automatiquement mis à jour via le composable
        await new Promise(resolve => setTimeout(resolve, 500)) // Simulated delay
      } finally {
        loading.value = false
      }
    }

    const clearLogs = () => {
      if (confirm('Are you sure you want to clear all logs?')) {
        // Clear logs logic would go here
        console.log('Clearing logs...')
      }
    }

    const exportLogsData = () => {
      const data = exportLogs('json')
      const blob = new Blob([data], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `permission-logs-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }

    const showLogDetails = (log) => {
      selectedLog.value = log
    }

    const closeLogDetails = () => {
      selectedLog.value = null
    }
    
    // Gestion du tri
    const handleSort = (column) => {
      if (sortColumn.value === column) {
        // Inverser la direction si c'est la même colonne
        sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
      } else {
        // Nouvelle colonne, tri ascendant par défaut (sauf pour timestamp qui est desc par défaut)
        sortColumn.value = column
        sortDirection.value = column === 'timestamp' ? 'desc' : 'asc'
      }
    }

    const formatTimestamp = (timestamp) => {
      return new Date(timestamp).toLocaleString()
    }

    const getLogRowClass = (log) => {
      if (log.operation.includes('error') || log.operation.includes('denied')) {
        return 'log-error'
      }
      if (log.operation.includes('success') || log.operation.includes('granted')) {
        return 'log-success'
      }
      if (log.operation.includes('cache_hit')) {
        return 'log-cache-hit'
      }
      return ''
    }

    const getOperationClass = (operation) => {
      if (operation.includes('error') || operation.includes('denied')) {
        return 'operation-error'
      }
      if (operation.includes('success') || operation.includes('granted')) {
        return 'operation-success'
      }
      if (operation.includes('cache')) {
        return 'operation-cache'
      }
      return 'operation-info'
    }

    const getResultClass = (result) => {
      if (typeof result === 'boolean') {
        return result ? 'result-success' : 'result-error'
      }
      return ''
    }

    // Watch for filter changes to reset pagination
    watch(filters, () => {
      currentPage.value = 1
    }, { deep: true })

    onMounted(() => {
      refreshLogs()
    })

    return {
      loading,
      selectedLog,
      currentPage,
      pageSize,
      filters,
      metrics,
      filteredLogs,
      totalPages,
      paginatedLogs,
      refreshLogs,
      clearLogs,
      exportLogs: exportLogsData,
      showLogDetails,
      closeLogDetails,
      handleSort,
      sortColumn,
      sortDirection,
      formatTimestamp,
      getLogRowClass,
      getOperationClass,
      getResultClass
    }
  }
}
</script>

<style scoped>
.permission-logs-viewer {
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

.controls {
  display: flex;
  gap: 10px;
}

.btn-refresh, .btn-clear, .btn-export, .btn-details, .btn-page, .btn-close {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-refresh:hover, .btn-clear:hover, .btn-export:hover, .btn-details:hover, .btn-page:hover {
  background: #f3f4f6;
}

.btn-refresh:disabled, .btn-page:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.metrics-section, .filters-section, .logs-section {
  margin-bottom: 20px;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
  margin-top: 10px;
}

.metric-card {
  padding: 15px;
  background: #f8fafc;
  border-radius: 6px;
  text-align: center;
  border: 1px solid #e2e8f0;
}

.metric-value {
  font-size: 24px;
  font-weight: bold;
  color: #1e40af;
}

.metric-label {
  font-size: 12px;
  color: #64748b;
  margin-top: 5px;
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

.filter-group input, .filter-group select {
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

.log-cache-hit {
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

.operation-cache {
  color: #2563eb;
  font-weight: 500;
}

.operation-info {
  color: #6b7280;
}

.result-success {
  color: #059669;
  font-weight: 500;
}

.result-error {
  color: #dc2626;
  font-weight: 500;
}

.timestamp {
  font-family: monospace;
  font-size: 12px;
  color: #6b7280;
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

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  max-width: 80vw;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-body {
  padding: 20px;
  overflow: auto;
}

.modal-body pre {
  background: #f8fafc;
  padding: 15px;
  border-radius: 4px;
  font-size: 12px;
  line-height: 1.4;
  overflow: auto;
}
</style>