<template>
  <div class="activity-logs-viewer">
    <div class="header">
      <h3>Journaux d'Activité des Fichiers</h3>
      <div class="controls">
        <button @click="refreshLogs" :disabled="loading" class="btn-refresh">
          <i class="fas fa-sync-alt" :class="{ 'fa-spin': loading }"></i>
          Actualiser
        </button>
        <button @click="clearLogs" class="btn-clear">
          <i class="fas fa-trash"></i>
          Vider
        </button>
        <button @click="exportLogs" class="btn-export">
          <i class="fas fa-download"></i>
          Exporter
        </button>
      </div>
    </div>

    <!-- Statistiques d'activité -->
    <div class="stats-section">
      <h4>Statistiques (dernière heure)</h4>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">{{ recentStats.total_activities }}</div>
          <div class="stat-label">Total Activités</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ recentStats.file_operations }}</div>
          <div class="stat-label">Opérations Fichiers</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ recentStats.folder_operations }}</div>
          <div class="stat-label">Opérations Dossiers</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ recentStats.downloads }}</div>
          <div class="stat-label">Téléchargements</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ recentStats.uploads }}</div>
          <div class="stat-label">Uploads</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ recentStats.deletes }}</div>
          <div class="stat-label">Suppressions</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ recentStats.copies }}</div>
          <div class="stat-label">Copies</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ recentStats.moves }}</div>
          <div class="stat-label">Déplacements</div>
        </div>
        <div class="stat-card error" v-if="recentStats.errors > 0">
          <div class="stat-value">{{ recentStats.errors }}</div>
          <div class="stat-label">Erreurs</div>
        </div>
      </div>
    </div>

    <!-- Filtres -->
    <div class="filters-section">
      <h4>Filtres</h4>
      <div class="filters-grid">
        <div class="filter-group">
          <label>Opération:</label>
          <select v-model="filters.operation">
            <option value="">Toutes les opérations</option>
            <option value="FOLDER_OPEN">Ouverture dossier</option>
            <option value="FILE_READ">Lecture fichier</option>
            <option value="FILE_DOWNLOAD">Téléchargement</option>
            <option value="FILE_UPLOAD">Upload</option>
            <option value="FILE_DELETE">Suppression fichier</option>
            <option value="FOLDER_DELETE">Suppression dossier</option>
            <option value="FILE_COPY">Copie fichier</option>
            <option value="FOLDER_COPY">Copie dossier</option>
            <option value="FILE_MOVE">Déplacement fichier</option>
            <option value="FOLDER_MOVE">Déplacement dossier</option>
            <option value="FILE_RENAME">Renommage fichier</option>
            <option value="FOLDER_RENAME">Renommage dossier</option>
            <option value="ERROR">Erreurs</option>
          </select>
        </div>
        <div class="filter-group">
          <label>Type:</label>
          <select v-model="filters.type">
            <option value="">Tous les types</option>
            <option value="file">Fichiers</option>
            <option value="folder">Dossiers</option>
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

    <!-- Tableau des logs -->
    <div class="logs-section">
      <h4>Journaux d'Activité ({{ filteredLogs.length }} entrées)</h4>
      <div class="logs-table-container">
        <table class="logs-table">
          <thead>
            <tr>
              <th>Heure</th>
              <th>Opération</th>
              <th>Type</th>
              <th>Chemin</th>
              <th>Utilisateur</th>
              <th>Durée</th>
              <th>Taille</th>
              <th>Détails</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in paginatedLogs" :key="log.id" 
                :class="getLogRowClass(log)">
              <td class="timestamp">{{ formatTimestamp(log.timestamp) }}</td>
              <td class="operation">
                <span :class="getOperationClass(log.operation)">
                  <i :class="getOperationIcon(log.operation)"></i>
                  {{ getOperationLabel(log.operation) }}
                </span>
              </td>
              <td class="type">
                <span :class="getTypeClass(log.type)">
                  <i :class="getTypeIcon(log.type)"></i>
                  {{ log.type || '-' }}
                </span>
              </td>
              <td class="path" :title="getFullPath(log)">{{ getDisplayPath(log) }}</td>
              <td class="user">{{ log.username || log.user_id || '-' }}</td>
              <td class="duration">
                <span v-if="log.timing?.duration_ms">
                  {{ log.timing.duration_ms.toFixed(0) }}ms
                </span>
                <span v-else>-</span>
              </td>
              <td class="size">
                <span v-if="log.file_info?.size_human">
                  {{ log.file_info.size_human }}
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
        <span class="page-info">Page {{ currentPage }} sur {{ totalPages }}</span>
        <button @click="currentPage++" :disabled="currentPage === totalPages" class="btn-page">
          <i class="fas fa-chevron-right"></i>
        </button>
      </div>
    </div>

    <!-- Modal détails du log -->
    <div v-if="selectedLog" class="modal-overlay" @click="closeLogDetails">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h4>Détails de l'Activité</h4>
          <button @click="closeLogDetails" class="btn-close">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="detail-section">
            <h5>Informations générales</h5>
            <div class="detail-grid">
              <div class="detail-item">
                <strong>Opération:</strong> {{ getOperationLabel(selectedLog.operation) }}
              </div>
              <div class="detail-item">
                <strong>Type:</strong> {{ selectedLog.type || 'N/A' }}
              </div>
              <div class="detail-item">
                <strong>Utilisateur:</strong> {{ selectedLog.username || selectedLog.user_id || 'N/A' }}
              </div>
              <div class="detail-item">
                <strong>Heure:</strong> {{ formatTimestamp(selectedLog.timestamp) }}
              </div>
            </div>
          </div>

          <div class="detail-section" v-if="selectedLog.path || selectedLog.source_path">
            <h5>Chemins</h5>
            <div class="detail-grid">
              <div class="detail-item" v-if="selectedLog.path">
                <strong>Chemin:</strong> {{ selectedLog.path }}
              </div>
              <div class="detail-item" v-if="selectedLog.source_path">
                <strong>Source:</strong> {{ selectedLog.source_path }}
              </div>
              <div class="detail-item" v-if="selectedLog.destination_path">
                <strong>Destination:</strong> {{ selectedLog.destination_path }}
              </div>
            </div>
          </div>

          <div class="detail-section" v-if="selectedLog.file_info">
            <h5>Informations fichier</h5>
            <div class="detail-grid">
              <div class="detail-item" v-if="selectedLog.file_info.size_human">
                <strong>Taille:</strong> {{ selectedLog.file_info.size_human }}
              </div>
              <div class="detail-item" v-if="selectedLog.file_info.extension">
                <strong>Extension:</strong> {{ selectedLog.file_info.extension }}
              </div>
              <div class="detail-item" v-if="selectedLog.file_info.mime_type">
                <strong>Type MIME:</strong> {{ selectedLog.file_info.mime_type }}
              </div>
            </div>
          </div>

          <div class="detail-section" v-if="selectedLog.timing">
            <h5>Performance</h5>
            <div class="detail-grid">
              <div class="detail-item" v-if="selectedLog.timing.duration_ms">
                <strong>Durée:</strong> {{ selectedLog.timing.duration_ms.toFixed(2) }}ms
              </div>
              <div class="detail-item" v-if="selectedLog.timing.download_speed_mbps">
                <strong>Vitesse téléchargement:</strong> {{ selectedLog.timing.download_speed_mbps.toFixed(2) }} MB/s
              </div>
              <div class="detail-item" v-if="selectedLog.timing.upload_speed_mbps">
                <strong>Vitesse upload:</strong> {{ selectedLog.timing.upload_speed_mbps.toFixed(2) }} MB/s
              </div>
            </div>
          </div>

          <div class="detail-section" v-if="selectedLog.error_message">
            <h5>Erreur</h5>
            <div class="error-details">
              <div><strong>Message:</strong> {{ selectedLog.error_message }}</div>
              <div v-if="selectedLog.error_code"><strong>Code:</strong> {{ selectedLog.error_code }}</div>
              <div v-if="selectedLog.error_status"><strong>Status:</strong> {{ selectedLog.error_status }}</div>
            </div>
          </div>

          <div class="detail-section">
            <h5>Données brutes</h5>
            <pre class="raw-data">{{ JSON.stringify(selectedLog, null, 2) }}</pre>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import { useActivityLogger } from '@/composables/useActivityLogger'

export default {
  name: 'ActivityLogsViewer',
  setup() {
    const { 
      getActivityLogs, 
      getActivityStats, 
      exportActivityLogs,
      clearActivityLogs,
      activityLogs,
      recentStats
    } = useActivityLogger()

    const loading = ref(false)
    const selectedLog = ref(null)
    const currentPage = ref(1)
    const pageSize = ref(50)

    const filters = ref({
      operation: '',
      type: '',
      path: '',
      since: ''
    })

    // Computed properties
    const filteredLogs = computed(() => {
      return getActivityLogs(filters.value)
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
        await new Promise(resolve => setTimeout(resolve, 500))
      } finally {
        loading.value = false
      }
    }

    const clearLogs = () => {
      if (confirm('Êtes-vous sûr de vouloir vider tous les logs d\'activité ?')) {
        clearActivityLogs()
      }
    }

    const exportLogs = () => {
      const data = exportActivityLogs('json')
      const blob = new Blob([data], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `activity-logs-${new Date().toISOString().split('T')[0]}.json`
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

    const formatTimestamp = (timestamp) => {
      return new Date(timestamp).toLocaleString('fr-FR')
    }

    const getLogRowClass = (log) => {
      if (log.operation === 'ERROR') return 'log-error'
      if (log.operation.includes('DELETE')) return 'log-delete'
      if (log.operation.includes('UPLOAD') || log.operation.includes('CREATE')) return 'log-create'
      if (log.operation.includes('DOWNLOAD')) return 'log-download'
      return ''
    }

    const getOperationClass = (operation) => {
      if (operation === 'ERROR') return 'operation-error'
      if (operation.includes('DELETE')) return 'operation-delete'
      if (operation.includes('UPLOAD') || operation.includes('CREATE')) return 'operation-create'
      if (operation.includes('DOWNLOAD')) return 'operation-download'
      if (operation.includes('COPY') || operation.includes('MOVE')) return 'operation-modify'
      return 'operation-info'
    }

    const getOperationIcon = (operation) => {
      const iconMap = {
        'FOLDER_OPEN': 'fas fa-folder-open',
        'FILE_READ': 'fas fa-eye',
        'FILE_DOWNLOAD': 'fas fa-download',
        'FILE_UPLOAD': 'fas fa-upload',
        'FILE_DELETE': 'fas fa-trash',
        'FOLDER_DELETE': 'fas fa-trash',
        'FILE_COPY': 'fas fa-copy',
        'FOLDER_COPY': 'fas fa-copy',
        'FILE_MOVE': 'fas fa-arrows-alt',
        'FOLDER_MOVE': 'fas fa-arrows-alt',
        'FILE_RENAME': 'fas fa-edit',
        'FOLDER_RENAME': 'fas fa-edit',
        'FILE_CREATE': 'fas fa-plus',
        'FOLDER_CREATE': 'fas fa-plus',
        'ERROR': 'fas fa-exclamation-triangle'
      }
      return iconMap[operation] || 'fas fa-file'
    }

    const getOperationLabel = (operation) => {
      const labelMap = {
        'FOLDER_OPEN': 'Ouverture dossier',
        'FILE_READ': 'Lecture fichier',
        'FILE_DOWNLOAD': 'Téléchargement',
        'FILE_UPLOAD': 'Upload',
        'FILE_DELETE': 'Suppression fichier',
        'FOLDER_DELETE': 'Suppression dossier',
        'FILE_COPY': 'Copie fichier',
        'FOLDER_COPY': 'Copie dossier',
        'FILE_MOVE': 'Déplacement fichier',
        'FOLDER_MOVE': 'Déplacement dossier',
        'FILE_RENAME': 'Renommage fichier',
        'FOLDER_RENAME': 'Renommage dossier',
        'FILE_CREATE': 'Création fichier',
        'FOLDER_CREATE': 'Création dossier',
        'ERROR': 'Erreur'
      }
      return labelMap[operation] || operation
    }

    const getTypeClass = (type) => {
      return type === 'file' ? 'type-file' : 'type-folder'
    }

    const getTypeIcon = (type) => {
      return type === 'file' ? 'fas fa-file' : 'fas fa-folder'
    }

    const getDisplayPath = (log) => {
      const path = log.path || log.source_path || ''
      if (path.length > 50) {
        return '...' + path.slice(-47)
      }
      return path
    }

    const getFullPath = (log) => {
      return log.path || log.source_path || ''
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
      recentStats,
      filteredLogs,
      totalPages,
      paginatedLogs,
      refreshLogs,
      clearLogs,
      exportLogs,
      showLogDetails,
      closeLogDetails,
      formatTimestamp,
      getLogRowClass,
      getOperationClass,
      getOperationIcon,
      getOperationLabel,
      getTypeClass,
      getTypeIcon,
      getDisplayPath,
      getFullPath
    }
  }
}
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

.stats-section, .filters-section, .logs-section {
  margin-bottom: 20px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 15px;
  margin-top: 10px;
}

.stat-card {
  padding: 15px;
  background: #f8fafc;
  border-radius: 6px;
  text-align: center;
  border: 1px solid #e2e8f0;
}

.stat-card.error {
  background: #fef2f2;
  border-color: #fecaca;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #1e40af;
}

.stat-card.error .stat-value {
  color: #dc2626;
}

.stat-label {
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

.logs-table td {
  padding: 8px;
  border-bottom: 1px solid #f3f4f6;
  font-size: 14px;
}

.logs-table tr:hover {
  background: #f8fafc;
}

.log-error { background: #fef2f2 !important; }
.log-delete { background: #fef2f2 !important; }
.log-create { background: #f0fdf4 !important; }
.log-download { background: #eff6ff !important; }

.operation-error { color: #dc2626; font-weight: 500; }
.operation-delete { color: #dc2626; font-weight: 500; }
.operation-create { color: #059669; font-weight: 500; }
.operation-download { color: #2563eb; font-weight: 500; }
.operation-modify { color: #d97706; font-weight: 500; }
.operation-info { color: #6b7280; }

.type-file { color: #6b7280; }
.type-folder { color: #3b82f6; }

.timestamp {
  font-family: monospace;
  font-size: 12px;
  color: #6b7280;
}

.path {
  font-family: monospace;
  font-size: 12px;
  max-width: 200px;
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

.detail-section {
  margin-bottom: 20px;
}

.detail-section h5 {
  margin-bottom: 10px;
  color: #374151;
  font-weight: 600;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 10px;
}

.detail-item {
  padding: 8px;
  background: #f8fafc;
  border-radius: 4px;
  font-size: 14px;
}

.error-details {
  background: #fef2f2;
  padding: 15px;
  border-radius: 4px;
  border: 1px solid #fecaca;
}

.error-details div {
  margin-bottom: 5px;
}

.raw-data {
  background: #f8fafc;
  padding: 15px;
  border-radius: 4px;
  font-size: 12px;
  line-height: 1.4;
  overflow: auto;
  max-height: 300px;
}
</style>