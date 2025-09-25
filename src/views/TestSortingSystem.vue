<template>
  <div class="container mx-auto p-6">
    <h1 class="text-3xl font-bold mb-6">Test du système de tri amélioré</h1>
    
    <div class="mb-4">
      <h2 class="text-xl font-semibold mb-2">Instructions de test :</h2>
      <ul class="list-disc list-inside space-y-1 text-sm">
        <li>Cliquez sur les en-têtes de colonnes pour trier</li>
        <li>Utilisez <kbd class="kbd kbd-sm">Ctrl+Shift+N/S/T/D</kbd> pour trier par Nom/Taille/Type/Date</li>
        <li>Appuyez sur <kbd class="kbd kbd-sm">F1</kbd> ou <kbd class="kbd kbd-sm">?</kbd> pour l'aide</li>
        <li>Observez les animations et indicateurs visuels</li>
      </ul>
    </div>

    <div class="card bg-base-100 shadow-xl">
      <div class="card-body">
        <DetailedListView
          :files="testFiles"
          :loading="loading"
          :error="error"
          @sort-changed="handleSortChanged"
          @file-selected="handleFileSelected"
          @path-selected="handlePathSelected"
        />
      </div>
    </div>

    <div class="mt-6">
      <h3 class="text-lg font-semibold mb-2">Événements :</h3>
      <div class="bg-base-200 p-4 rounded-lg max-h-40 overflow-y-auto">
        <div v-for="(event, index) in events" :key="index" class="text-sm mb-1">
          <span class="font-mono text-xs text-base-content/60">{{ event.timestamp }}</span>
          <span class="ml-2">{{ event.message }}</span>
        </div>
      </div>
    </div>

    <div class="mt-4 flex gap-2">
      <button @click="addRandomFile" class="btn btn-primary btn-sm">
        Ajouter un fichier
      </button>
      <button @click="clearFiles" class="btn btn-secondary btn-sm">
        Vider la liste
      </button>
      <button @click="loadSampleFiles" class="btn btn-accent btn-sm">
        Charger des exemples
      </button>
      <button @click="toggleLoading" class="btn btn-outline btn-sm">
        {{ loading ? 'Arrêter' : 'Simuler' }} chargement
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import DetailedListView from '@/components/Shared/DetailedListView.vue'

// État
const testFiles = ref([])
const loading = ref(false)
const error = ref('')
const events = ref([])

// Données de test
const sampleFiles = [
  {
    name: 'Document.pdf',
    path: '/test/Document.pdf',
    is_directory: false,
    size: 2048576,
    modified_time: '2024-01-15T10:30:00Z',
    file_type: 'pdf'
  },
  {
    name: 'Images',
    path: '/test/Images',
    is_directory: true,
    modified_time: '2024-01-14T15:45:00Z'
  },
  {
    name: 'photo.jpg',
    path: '/test/photo.jpg',
    is_directory: false,
    size: 1536000,
    modified_time: '2024-01-16T08:20:00Z',
    file_type: 'image'
  },
  {
    name: 'script.js',
    path: '/test/script.js',
    is_directory: false,
    size: 4096,
    modified_time: '2024-01-13T12:15:00Z',
    file_type: 'javascript'
  },
  {
    name: 'Projets',
    path: '/test/Projets',
    is_directory: true,
    modified_time: '2024-01-12T09:30:00Z'
  },
  {
    name: 'readme.txt',
    path: '/test/readme.txt',
    is_directory: false,
    size: 1024,
    modified_time: '2024-01-17T14:22:00Z',
    file_type: 'text'
  }
]

const fileTypes = ['pdf', 'image', 'text', 'javascript', 'video', 'audio', 'archive']
const fileExtensions = {
  pdf: '.pdf',
  image: '.jpg',
  text: '.txt',
  javascript: '.js',
  video: '.mp4',
  audio: '.mp3',
  archive: '.zip'
}

// Méthodes
const addEvent = (message) => {
  events.value.unshift({
    timestamp: new Date().toLocaleTimeString(),
    message
  })
  
  // Garder seulement les 20 derniers événements
  if (events.value.length > 20) {
    events.value = events.value.slice(0, 20)
  }
}

const handleSortChanged = (event) => {
  addEvent(`Tri changé: ${event.column} ${event.direction} (précédent: ${event.oldColumn} ${event.oldDirection})`)
}

const handleFileSelected = (event) => {
  const { file, multiSelect, rangeSelect } = event
  let message = `Fichier sélectionné: ${file.name}`
  if (multiSelect) message += ' (multi-sélection)'
  if (rangeSelect) message += ' (sélection par plage)'
  addEvent(message)
}

const handlePathSelected = (path) => {
  addEvent(`Navigation vers: ${path}`)
}

const addRandomFile = () => {
  const randomType = fileTypes[Math.floor(Math.random() * fileTypes.length)]
  const randomName = `fichier_${Date.now()}${fileExtensions[randomType]}`
  const randomSize = Math.floor(Math.random() * 10000000) + 1024
  
  const newFile = {
    name: randomName,
    path: `/test/${randomName}`,
    is_directory: false,
    size: randomSize,
    modified_time: new Date().toISOString(),
    file_type: randomType
  }
  
  testFiles.value.push(newFile)
  addEvent(`Fichier ajouté: ${randomName}`)
}

const clearFiles = () => {
  testFiles.value = []
  addEvent('Liste vidée')
}

const loadSampleFiles = () => {
  testFiles.value = [...sampleFiles]
  addEvent('Fichiers d\'exemple chargés')
}

const toggleLoading = () => {
  loading.value = !loading.value
  addEvent(loading.value ? 'Chargement démarré' : 'Chargement arrêté')
  
  if (loading.value) {
    setTimeout(() => {
      loading.value = false
      addEvent('Chargement terminé automatiquement')
    }, 3000)
  }
}

// Initialisation
onMounted(() => {
  loadSampleFiles()
  addEvent('Page de test initialisée')
})
</script>

<style scoped>
.kbd {
  font-family: 'Courier New', monospace;
  font-size: 0.75rem;
}
</style>