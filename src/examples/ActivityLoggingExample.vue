<template>
  <div class="activity-logging-example">
    <h3>Exemple d'Intégration du Logging d'Activité</h3>
    
    <div class="example-section">
      <h4>Actions de Test</h4>
      <div class="action-buttons">
        <button @click="simulateFileDownload" class="btn-action">
          <i class="fas fa-download"></i>
          Simuler Téléchargement
        </button>
        <button @click="simulateFolderOpen" class="btn-action">
          <i class="fas fa-folder-open"></i>
          Simuler Ouverture Dossier
        </button>
        <button @click="simulateFileUpload" class="btn-action">
          <i class="fas fa-upload"></i>
          Simuler Upload
        </button>
        <button @click="simulateError" class="btn-action error">
          <i class="fas fa-exclamation-triangle"></i>
          Simuler Erreur
        </button>
      </div>
    </div>

    <div class="example-section">
      <h4>Logs d'Activité Récents ({{ recentLogs.length }})</h4>
      <div class="logs-preview">
        <div 
          v-for="log in recentLogs.slice(0, 5)" 
          :key="log.id"
          class="log-entry"
          :class="getLogClass(log)"
        >
          <div class="log-icon">
            <i :class="getLogIcon(log.operation)"></i>
          </div>
          <div class="log-content">
            <div class="log-operation">{{ getOperationLabel(log.operation) }}</div>
            <div class="log-details">
              <span class="log-path">{{ log.path || log.source_path || 'N/A' }}</span>
              <span class="log-time">{{ formatTime(log.timestamp) }}</span>
            </div>
          </div>
          <div class="log-duration" v-if="log.timing?.duration_ms">
            {{ log.timing.duration_ms.toFixed(0) }}ms
          </div>
        </div>
        <div v-if="recentLogs.length === 0" class="no-logs">
          Aucun log d'activité récent
        </div>
      </div>
    </div>

    <div class="example-section">
      <h4>Statistiques en Temps Réel</h4>
      <div class="stats-display">
        <div class="stat-card">
          <div class="stat-value">{{ stats.total_activities }}</div>
          <div class="stat-label">Total Activités</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ stats.downloads }}</div>
          <div class="stat-label">Téléchargements</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ stats.uploads }}</div>
          <div class="stat-label">Uploads</div>
        </div>
        <div class="stat-card error" v-if="stats.errors > 0">
          <div class="stat-value">{{ stats.errors }}</div>
          <div class="stat-label">Erreurs</div>
        </div>
      </div>
    </div>

    <div class="example-section">
      <h4>Code d'Exemple</h4>
      <pre class="code-example"><code>// Importer le composable
import { useActivityLogger } from '@/composables/useActivityLogger'

// Dans votre composant
const { 
  logFileDownload, 
  logFolderOpen, 
  logFileUpload, 
  logError,
  getActivityStats 
} = useActivityLogger()

// Logger un téléchargement
const downloadFile = async (filePath) => {
  const startTime = performance.now()
  
  try {
    const result = await nasAPI.downloadFile(filePath)
    
    // Logger le succès
    logFileDownload(filePath, {
      size: result.size,
      mime_type: result.type
    }, {
      duration_ms: performance.now() - startTime
    })
    
    return result
  } catch (error) {
    // Logger l'erreur
    logError('FILE_DOWNLOAD', filePath, error)
    throw error
  }
}

// Logger l'ouverture d'un dossier
const openFolder = async (folderPath) => {
  const startTime = performance.now()
  
  try {
    const result = await nasAPI.browse(folderPath)
    
    logFolderOpen(folderPath, {
      duration_ms: performance.now() - startTime,
      items_count: result.items?.length || 0
    })
    
    return result
  } catch (error) {
    logError('FOLDER_OPEN', folderPath, error, { isFolder: true })
    throw error
  }
}</code></pre>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'
import { useActivityLogger } from '@/composables/useActivityLogger'

export default {
  name: 'ActivityLoggingExample',
  setup() {
    const { 
      logFileDownload, 
      logFolderOpen, 
      logFileUpload, 
      logError,
      getActivityStats,
      getActivityLogs
    } = useActivityLogger()

    // Computed properties
    const recentLogs = computed(() => getActivityLogs())
    const stats = computed(() => getActivityStats(1)) // Stats de la dernière heure

    // Methods
    const simulateFileDownload = () => {
      const filePath = `/documents/example-file-${Date.now()}.pdf`
      logFileDownload(filePath, {
        size: Math.floor(Math.random() * 10000000), // Taille aléatoire
        mime_type: 'application/pdf'
      }, {
        duration_ms: Math.floor(Math.random() * 2000) + 100, // Durée aléatoire
        download_speed_mbps: Math.random() * 50 + 5
      })
    }

    const simulateFolderOpen = () => {
      const folderPath = `/documents/folder-${Date.now()}`
      logFolderOpen(folderPath, {
        duration_ms: Math.floor(Math.random() * 500) + 50,
        items_count: Math.floor(Math.random() * 20) + 1
      })
    }

    const simulateFileUpload = () => {
      const filePath = `/uploads/uploaded-file-${Date.now()}.jpg`
      logFileUpload(filePath, {
        size: Math.floor(Math.random() * 5000000),
        mime_type: 'image/jpeg',
        overwrite: Math.random() > 0.8
      }, {
        duration_ms: Math.floor(Math.random() * 3000) + 200,
        upload_speed_mbps: Math.random() * 30 + 2
      })
    }

    const simulateError = () => {
      const filePath = `/error/problematic-file-${Date.now()}.txt`
      const error = new Error('Simulation d\'erreur de permission')
      error.code = 'PERMISSION_DENIED'
      error.status = 403
      
      logError('FILE_READ', filePath, error, { isFolder: false })
    }

    const getLogClass = (log) => {
      if (log.operation === 'ERROR') return 'log-error'
      if (log.operation.includes('DOWNLOAD')) return 'log-download'
      if (log.operation.includes('UPLOAD')) return 'log-upload'
      if (log.operation.includes('OPEN')) return 'log-open'
      return 'log-default'
    }

    const getLogIcon = (operation) => {
      const iconMap = {
        'FILE_DOWNLOAD': 'fas fa-download',
        'FILE_UPLOAD': 'fas fa-upload',
        'FOLDER_OPEN': 'fas fa-folder-open',
        'FILE_READ': 'fas fa-eye',
        'ERROR': 'fas fa-exclamation-triangle'
      }
      return iconMap[operation] || 'fas fa-file'
    }

    const getOperationLabel = (operation) => {
      const labelMap = {
        'FILE_DOWNLOAD': 'Téléchargement',
        'FILE_UPLOAD': 'Upload',
        'FOLDER_OPEN': 'Ouverture dossier',
        'FILE_READ': 'Lecture fichier',
        'ERROR': 'Erreur'
      }
      return labelMap[operation] || operation
    }

    const formatTime = (timestamp) => {
      return new Date(timestamp).toLocaleTimeString('fr-FR')
    }

    return {
      recentLogs,
      stats,
      simulateFileDownload,
      simulateFolderOpen,
      simulateFileUpload,
      simulateError,
      getLogClass,
      getLogIcon,
      getOperationLabel,
      formatTime
    }
  }
}
</script>

<style scoped>
.activity-logging-example {
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.example-section {
  margin-bottom: 30px;
}

.example-section h4 {
  margin-bottom: 15px;
  color: #374151;
  font-weight: 600;
}

.action-buttons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.btn-action {
  padding: 10px 16px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-action:hover {
  background: #f3f4f6;
  border-color: #9ca3af;
}

.btn-action.error {
  border-color: #fca5a5;
  color: #dc2626;
}

.btn-action.error:hover {
  background: #fef2f2;
}

.logs-preview {
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  max-height: 300px;
  overflow-y: auto;
}

.log-entry {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-bottom: 1px solid #f3f4f6;
}

.log-entry:last-child {
  border-bottom: none;
}

.log-error { background: #fef2f2; }
.log-download { background: #eff6ff; }
.log-upload { background: #f0fdf4; }
.log-open { background: #fefce8; }

.log-icon {
  width: 20px;
  text-align: center;
}

.log-error .log-icon { color: #dc2626; }
.log-download .log-icon { color: #2563eb; }
.log-upload .log-icon { color: #059669; }
.log-open .log-icon { color: #d97706; }

.log-content {
  flex: 1;
}

.log-operation {
  font-weight: 500;
  color: #374151;
}

.log-details {
  display: flex;
  gap: 15px;
  font-size: 12px;
  color: #6b7280;
  margin-top: 2px;
}

.log-path {
  font-family: monospace;
}

.log-duration {
  font-size: 12px;
  color: #6b7280;
  font-family: monospace;
}

.no-logs {
  padding: 20px;
  text-align: center;
  color: #6b7280;
}

.stats-display {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 15px;
}

.stat-card {
  padding: 15px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  text-align: center;
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

.code-example {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 20px;
  overflow-x: auto;
  font-size: 14px;
  line-height: 1.5;
}

.code-example code {
  color: #374151;
}
</style>