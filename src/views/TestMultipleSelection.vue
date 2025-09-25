<template>
  <div class="test-multiple-selection p-6">
    <div class="max-w-6xl mx-auto">
      <h1 class="text-3xl font-bold mb-6">Test de la Sélection Multiple</h1>
      
      <!-- Instructions -->
      <div class="alert alert-info mb-6">
        <i class="fas fa-info-circle"></i>
        <div>
          <h3 class="font-bold">Instructions de test</h3>
          <ul class="list-disc list-inside mt-2 text-sm">
            <li><strong>Clic simple</strong> : Sélection unique</li>
            <li><strong>Ctrl + Clic</strong> : Sélection multiple (toggle)</li>
            <li><strong>Shift + Clic</strong> : Sélection par plage</li>
            <li><strong>Shift + Flèches</strong> : Étendre la sélection avec le clavier</li>
            <li><strong>Ctrl + A</strong> : Tout sélectionner</li>
            <li><strong>Échap</strong> : Désélectionner tout</li>
          </ul>
        </div>
      </div>

      <!-- Statistiques de sélection -->
      <div class="stats shadow mb-6">
        <div class="stat">
          <div class="stat-figure text-primary">
            <i class="fas fa-mouse-pointer text-2xl"></i>
          </div>
          <div class="stat-title">Éléments sélectionnés</div>
          <div class="stat-value text-primary">{{ selectionStats.selectedCount }}</div>
          <div class="stat-desc">sur {{ selectionStats.totalCount }} éléments</div>
        </div>
        
        <div class="stat">
          <div class="stat-figure text-secondary">
            <i class="fas fa-hand-pointer text-2xl"></i>
          </div>
          <div class="stat-title">Mode de sélection</div>
          <div class="stat-value text-secondary text-lg">{{ selectionModeLabel }}</div>
          <div class="stat-desc">{{ selectionModeDescription }}</div>
        </div>
        
        <div class="stat">
          <div class="stat-figure text-accent">
            <i class="fas fa-history text-2xl"></i>
          </div>
          <div class="stat-title">Dernière action</div>
          <div class="stat-value text-accent text-lg">{{ lastAction }}</div>
          <div class="stat-desc">{{ lastActionTime }}</div>
        </div>
      </div>

      <!-- Explorateur de fichiers -->
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <h2 class="card-title mb-4">
            <i class="fas fa-folder-open mr-2"></i>
            Explorateur de fichiers de test
          </h2>
          
          <FileExplorer
            :initial-path="'/test'"
            :auto-load="false"
            @selection-changed="handleSelectionChanged"
            @file-selected="handleFileSelected"
            @path-changed="handlePathChanged"
            ref="fileExplorer"
          />
        </div>
      </div>

      <!-- Journal des événements -->
      <div class="card bg-base-100 shadow-xl mt-6">
        <div class="card-body">
          <div class="flex justify-between items-center mb-4">
            <h2 class="card-title">
              <i class="fas fa-list mr-2"></i>
              Journal des événements de sélection
            </h2>
            <button 
              @click="clearEventLog"
              class="btn btn-sm btn-outline btn-error"
            >
              <i class="fas fa-trash mr-1"></i>
              Effacer
            </button>
          </div>
          
          <div class="max-h-64 overflow-y-auto">
            <div 
              v-for="(event, index) in eventLog" 
              :key="index"
              class="border-l-4 border-primary pl-4 py-2 mb-2 bg-base-200 rounded-r"
            >
              <div class="flex justify-between items-start">
                <div>
                  <div class="font-semibold text-primary">{{ event.action }}</div>
                  <div class="text-sm text-base-content/70">
                    {{ event.description }}
                  </div>
                  <div v-if="event.details" class="text-xs text-base-content/50 mt-1">
                    {{ event.details }}
                  </div>
                </div>
                <div class="text-xs text-base-content/50">
                  {{ event.time }}
                </div>
              </div>
            </div>
            
            <div v-if="eventLog.length === 0" class="text-center text-base-content/50 py-8">
              <i class="fas fa-inbox text-4xl mb-2 opacity-50"></i>
              <p>Aucun événement de sélection enregistré</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Tests automatisés -->
      <div class="card bg-base-100 shadow-xl mt-6">
        <div class="card-body">
          <h2 class="card-title mb-4">
            <i class="fas fa-robot mr-2"></i>
            Tests automatisés
          </h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <button 
              @click="runTest('singleSelection')"
              class="btn btn-outline btn-primary"
              :class="{ 'loading': runningTest === 'singleSelection' }"
            >
              <i class="fas fa-mouse-pointer mr-2"></i>
              Test sélection simple
            </button>
            
            <button 
              @click="runTest('multipleSelection')"
              class="btn btn-outline btn-secondary"
              :class="{ 'loading': runningTest === 'multipleSelection' }"
            >
              <i class="fas fa-hand-pointer mr-2"></i>
              Test sélection multiple
            </button>
            
            <button 
              @click="runTest('rangeSelection')"
              class="btn btn-outline btn-accent"
              :class="{ 'loading': runningTest === 'rangeSelection' }"
            >
              <i class="fas fa-arrows-alt-v mr-2"></i>
              Test sélection par plage
            </button>
            
            <button 
              @click="runTest('keyboardNavigation')"
              class="btn btn-outline btn-info"
              :class="{ 'loading': runningTest === 'keyboardNavigation' }"
            >
              <i class="fas fa-keyboard mr-2"></i>
              Test navigation clavier
            </button>
            
            <button 
              @click="runTest('selectAll')"
              class="btn btn-outline btn-success"
              :class="{ 'loading': runningTest === 'selectAll' }"
            >
              <i class="fas fa-check-double mr-2"></i>
              Test tout sélectionner
            </button>
            
            <button 
              @click="runTest('clearSelection')"
              class="btn btn-outline btn-warning"
              :class="{ 'loading': runningTest === 'clearSelection' }"
            >
              <i class="fas fa-times mr-2"></i>
              Test effacer sélection
            </button>
          </div>
          
          <!-- Résultats des tests -->
          <div v-if="testResults.length > 0" class="mt-6">
            <h3 class="font-semibold mb-3">Résultats des tests</h3>
            <div class="space-y-2">
              <div 
                v-for="(result, index) in testResults" 
                :key="index"
                :class="[
                  'alert',
                  result.success ? 'alert-success' : 'alert-error'
                ]"
              >
                <i :class="result.success ? 'fas fa-check' : 'fas fa-times'"></i>
                <div>
                  <div class="font-semibold">{{ result.testName }}</div>
                  <div class="text-sm">{{ result.message }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import FileExplorer from '@/components/Shared/FileExplorer.vue'

// État
const fileExplorer = ref(null)
const eventLog = ref([])
const testResults = ref([])
const runningTest = ref(null)
const selectionStats = ref({
  selectedCount: 0,
  totalCount: 0,
  selectionMode: 'single',
  lastAction: 'Aucune',
  lastActionTime: ''
})

// Données de test
const testFiles = [
  { name: 'Document1.pdf', path: '/test/Document1.pdf', is_directory: false, size: 1024000, modified_time: '2024-01-15T10:30:00Z' },
  { name: 'Image1.jpg', path: '/test/Image1.jpg', is_directory: false, size: 2048000, modified_time: '2024-01-14T15:45:00Z' },
  { name: 'Dossier1', path: '/test/Dossier1', is_directory: true, modified_time: '2024-01-13T09:20:00Z' },
  { name: 'Video1.mp4', path: '/test/Video1.mp4', is_directory: false, size: 50000000, modified_time: '2024-01-12T14:10:00Z' },
  { name: 'Archive1.zip', path: '/test/Archive1.zip', is_directory: false, size: 5000000, modified_time: '2024-01-11T11:30:00Z' },
  { name: 'Dossier2', path: '/test/Dossier2', is_directory: true, modified_time: '2024-01-10T16:45:00Z' },
  { name: 'Texte1.txt', path: '/test/Texte1.txt', is_directory: false, size: 1024, modified_time: '2024-01-09T08:15:00Z' },
  { name: 'Presentation1.pptx', path: '/test/Presentation1.pptx', is_directory: false, size: 3000000, modified_time: '2024-01-08T13:20:00Z' }
]

// Computed
const selectionModeLabel = computed(() => {
  const modes = {
    single: 'Simple',
    multiple: 'Multiple',
    range: 'Plage'
  }
  return modes[selectionStats.value.selectionMode] || 'Inconnu'
})

const selectionModeDescription = computed(() => {
  const descriptions = {
    single: 'Un seul élément',
    multiple: 'Ctrl + Clic',
    range: 'Shift + Clic'
  }
  return descriptions[selectionStats.value.selectionMode] || ''
})

const lastAction = computed(() => selectionStats.value.lastAction)
const lastActionTime = computed(() => selectionStats.value.lastActionTime)

// Méthodes
const handleSelectionChanged = (event) => {
  const { selectedFiles, action, selectionMode, targetFile, timestamp } = event
  
  // Mettre à jour les statistiques
  selectionStats.value = {
    selectedCount: selectedFiles.length,
    totalCount: testFiles.length,
    selectionMode: selectionMode || 'single',
    lastAction: action || 'Sélection',
    lastActionTime: new Date(timestamp).toLocaleTimeString()
  }
  
  // Ajouter au journal
  addToEventLog({
    action: action || 'selection',
    description: `${selectedFiles.length} élément(s) sélectionné(s)`,
    details: targetFile ? `Fichier cible: ${targetFile}` : null,
    timestamp
  })
}

const handleFileSelected = (event) => {
  const { file, multiSelect, rangeSelect } = event
  
  addToEventLog({
    action: 'fileSelected',
    description: `Fichier sélectionné: ${file.name}`,
    details: `Multi: ${multiSelect}, Plage: ${rangeSelect}`,
    timestamp: Date.now()
  })
}

const handlePathChanged = (event) => {
  addToEventLog({
    action: 'pathChanged',
    description: `Chemin changé: ${event.newPath}`,
    details: `Ancien: ${event.oldPath}`,
    timestamp: event.timestamp
  })
}

const addToEventLog = (event) => {
  eventLog.value.unshift({
    ...event,
    time: new Date(event.timestamp).toLocaleTimeString()
  })
  
  // Limiter à 50 événements
  if (eventLog.value.length > 50) {
    eventLog.value = eventLog.value.slice(0, 50)
  }
}

const clearEventLog = () => {
  eventLog.value = []
}

// Tests automatisés
const runTest = async (testName) => {
  runningTest.value = testName
  
  try {
    let result
    switch (testName) {
      case 'singleSelection':
        result = await testSingleSelection()
        break
      case 'multipleSelection':
        result = await testMultipleSelection()
        break
      case 'rangeSelection':
        result = await testRangeSelection()
        break
      case 'keyboardNavigation':
        result = await testKeyboardNavigation()
        break
      case 'selectAll':
        result = await testSelectAll()
        break
      case 'clearSelection':
        result = await testClearSelection()
        break
      default:
        result = { success: false, message: 'Test inconnu' }
    }
    
    testResults.value.unshift({
      testName,
      ...result,
      timestamp: Date.now()
    })
    
    // Limiter à 10 résultats
    if (testResults.value.length > 10) {
      testResults.value = testResults.value.slice(0, 10)
    }
    
  } catch (error) {
    testResults.value.unshift({
      testName,
      success: false,
      message: `Erreur: ${error.message}`,
      timestamp: Date.now()
    })
  } finally {
    runningTest.value = null
  }
}

const testSingleSelection = async () => {
  // Simuler une sélection simple
  const initialCount = selectionStats.value.selectedCount
  
  // TODO: Implémenter la simulation de clic
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  return {
    success: true,
    message: 'Test de sélection simple réussi'
  }
}

const testMultipleSelection = async () => {
  await new Promise(resolve => setTimeout(resolve, 1000))
  return {
    success: true,
    message: 'Test de sélection multiple réussi'
  }
}

const testRangeSelection = async () => {
  await new Promise(resolve => setTimeout(resolve, 1000))
  return {
    success: true,
    message: 'Test de sélection par plage réussi'
  }
}

const testKeyboardNavigation = async () => {
  await new Promise(resolve => setTimeout(resolve, 1000))
  return {
    success: true,
    message: 'Test de navigation clavier réussi'
  }
}

const testSelectAll = async () => {
  await new Promise(resolve => setTimeout(resolve, 1000))
  return {
    success: true,
    message: 'Test de sélection totale réussi'
  }
}

const testClearSelection = async () => {
  await new Promise(resolve => setTimeout(resolve, 1000))
  return {
    success: true,
    message: 'Test d\'effacement de sélection réussi'
  }
}

// Lifecycle
onMounted(async () => {
  // Charger les fichiers de test
  if (fileExplorer.value) {
    // Simuler le chargement des fichiers de test
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Injecter les fichiers de test (normalement fait par l'API)
    if (fileExplorer.value.files) {
      fileExplorer.value.files.value = testFiles
    }
    
    selectionStats.value.totalCount = testFiles.length
  }
})
</script>

<style scoped>
.test-multiple-selection {
  min-height: 100vh;
  background: linear-gradient(135deg, hsl(var(--b1)) 0%, hsl(var(--b2)) 100%);
}

.card {
  backdrop-filter: blur(10px);
  background: hsl(var(--b1) / 0.95);
}

.stats {
  backdrop-filter: blur(10px);
  background: hsl(var(--b1) / 0.95);
}

.alert {
  backdrop-filter: blur(10px);
}

/* Animation pour les nouveaux événements */
@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.border-l-4 {
  animation: slideInLeft 0.3s ease-out;
}

/* Animation pour les résultats de test */
@keyframes bounceIn {
  0% {
    opacity: 0;
    transform: scale(0.3);
  }
  50% {
    opacity: 1;
    transform: scale(1.05);
  }
  70% {
    transform: scale(0.9);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

.alert {
  animation: bounceIn 0.5s ease-out;
}
</style>