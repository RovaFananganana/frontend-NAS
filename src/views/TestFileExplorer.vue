<template>
  <div class="test-file-explorer p-6">
    <div class="mb-6">
      <h1 class="text-2xl font-bold mb-2">Test FileExplorer Component</h1>
      <p class="text-base-content/70">
        Test du composant FileExplorer principal avec intégration API NAS
      </p>
    </div>

    <!-- Contrôles de test -->
    <div class="mb-6 p-4 bg-base-200 rounded-lg">
      <h2 class="text-lg font-semibold mb-3">Contrôles de test</h2>
      
      <div class="flex flex-wrap gap-4 items-center">
        <div class="form-control">
          <label class="label">
            <span class="label-text">Chemin initial:</span>
          </label>
          <input 
            v-model="testPath"
            type="text" 
            class="input input-bordered input-sm w-64"
            placeholder="/chemin/vers/dossier"
          />
        </div>
        
        <button 
          @click="navigateToPath"
          class="btn btn-primary btn-sm"
        >
          <i class="fas fa-folder-open mr-1"></i>
          Naviguer
        </button>
        
        <button 
          @click="refreshExplorer"
          class="btn btn-secondary btn-sm"
        >
          <i class="fas fa-redo mr-1"></i>
          Actualiser
        </button>
        
        <button 
          @click="clearSelection"
          class="btn btn-outline btn-sm"
        >
          <i class="fas fa-times mr-1"></i>
          Vider sélection
        </button>
      </div>
    </div>

    <!-- Informations de debug -->
    <div class="mb-6 p-4 bg-info/10 rounded-lg">
      <h2 class="text-lg font-semibold mb-3">Informations de debug</h2>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <div>
          <strong>Chemin actuel:</strong>
          <code class="block mt-1 p-2 bg-base-300 rounded">{{ currentPath }}</code>
        </div>
        
        <div>
          <strong>Nombre de fichiers:</strong>
          <code class="block mt-1 p-2 bg-base-300 rounded">{{ fileCount }}</code>
        </div>
        
        <div>
          <strong>Fichiers sélectionnés:</strong>
          <code class="block mt-1 p-2 bg-base-300 rounded">{{ selectedCount }}</code>
        </div>
      </div>
      
      <div v-if="selectedFiles.length > 0" class="mt-4">
        <strong>Sélection actuelle:</strong>
        <ul class="mt-2 space-y-1">
          <li 
            v-for="file in selectedFiles" 
            :key="file"
            class="text-xs bg-primary/10 px-2 py-1 rounded inline-block mr-2 mb-1"
          >
            {{ file }}
          </li>
        </ul>
      </div>
    </div>

    <!-- Log des événements -->
    <div class="mb-6 p-4 bg-warning/10 rounded-lg">
      <h2 class="text-lg font-semibold mb-3">Log des événements</h2>
      
      <div class="max-h-32 overflow-y-auto">
        <div 
          v-for="(event, index) in eventLog" 
          :key="index"
          class="text-xs mb-1 p-2 bg-base-300 rounded"
        >
          <span class="font-mono text-primary">{{ event.timestamp }}</span>
          <span class="font-semibold ml-2">{{ event.type }}</span>
          <span class="ml-2 text-base-content/70">{{ event.details }}</span>
        </div>
      </div>
      
      <button 
        @click="clearEventLog"
        class="btn btn-xs btn-outline mt-2"
      >
        Vider le log
      </button>
    </div>

    <!-- Composant FileExplorer -->
    <div class="border border-base-300 rounded-lg p-4">
      <FileExplorer
        ref="fileExplorerRef"
        :initial-path="initialPath"
        :show-mode-selector="true"
        :auto-load="true"
        @path-changed="onPathChanged"
        @file-selected="onFileSelected"
        @file-double-click="onFileDoubleClick"
        @mode-changed="onModeChanged"
        @sort-changed="onSortChanged"
        @selection-changed="onSelectionChanged"
        @error="onError"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import FileExplorer from '@/components/Shared/FileExplorer.vue'

// État du test
const fileExplorerRef = ref(null)
const initialPath = ref('/')
const testPath = ref('/')
const eventLog = ref([])

// Computed pour les informations de debug
const currentPath = computed(() => fileExplorerRef.value?.currentPath || '/')
const fileCount = computed(() => fileExplorerRef.value?.files?.length || 0)
const selectedCount = computed(() => fileExplorerRef.value?.selectedCount || 0)
const selectedFiles = computed(() => fileExplorerRef.value?.selectedFiles || [])

// Méthodes de contrôle
const navigateToPath = () => {
  if (fileExplorerRef.value && testPath.value) {
    fileExplorerRef.value.goToPath(testPath.value)
  }
}

const refreshExplorer = () => {
  if (fileExplorerRef.value) {
    fileExplorerRef.value.refresh()
  }
}

const clearSelection = () => {
  if (fileExplorerRef.value) {
    fileExplorerRef.value.clearSelection()
  }
}

const clearEventLog = () => {
  eventLog.value = []
}

// Utilitaire pour ajouter un événement au log
const addEvent = (type, details) => {
  const timestamp = new Date().toLocaleTimeString()
  eventLog.value.unshift({
    timestamp,
    type,
    details
  })
  
  // Limiter le log à 50 événements
  if (eventLog.value.length > 50) {
    eventLog.value = eventLog.value.slice(0, 50)
  }
}

// Gestionnaires d'événements
const onPathChanged = (event) => {
  addEvent('PATH_CHANGED', `${event.oldPath} → ${event.newPath}`)
  testPath.value = event.newPath
}

const onFileSelected = (event) => {
  addEvent('FILE_SELECTED', `${event.file.name} (${event.selectionCount} sélectionnés)`)
}

const onFileDoubleClick = (event) => {
  addEvent('FILE_DOUBLE_CLICK', `${event.file.name} ${event.file.is_directory ? '(dossier)' : '(fichier)'}`)
}

const onModeChanged = (event) => {
  addEvent('MODE_CHANGED', `${event.oldMode} → ${event.newMode}`)
}

const onSortChanged = (event) => {
  addEvent('SORT_CHANGED', `${event.column} ${event.direction}`)
}

const onSelectionChanged = (event) => {
  addEvent('SELECTION_CHANGED', `${event.action} - ${event.selectedFiles.length} fichiers`)
}

const onError = (event) => {
  addEvent('ERROR', `${event.error.message} (${event.path})`)
}
</script>

<style scoped>
.test-file-explorer {
  max-width: 1200px;
  margin: 0 auto;
}

code {
  font-family: 'Courier New', monospace;
  font-size: 0.875rem;
}

.form-control .label {
  padding: 0;
  margin-bottom: 0.25rem;
}

.form-control .input {
  margin-top: 0;
}

/* Amélioration de la lisibilité du log */
.max-h-32 {
  scrollbar-width: thin;
  scrollbar-color: hsl(var(--bc) / 0.2) transparent;
}

.max-h-32::-webkit-scrollbar {
  width: 6px;
}

.max-h-32::-webkit-scrollbar-track {
  background: transparent;
}

.max-h-32::-webkit-scrollbar-thumb {
  background-color: hsl(var(--bc) / 0.2);
  border-radius: 3px;
}
</style>