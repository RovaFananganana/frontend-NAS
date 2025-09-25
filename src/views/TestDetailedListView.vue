<template>
  <div class="container mx-auto p-4">
    <h1 class="text-2xl font-bold mb-6">Test DetailedListView Component</h1>
    
    <!-- Controls -->
    <div class="mb-4 flex gap-4 items-center">
      <button 
        @click="toggleLoading" 
        class="btn btn-sm btn-outline"
      >
        {{ loading ? 'Stop Loading' : 'Show Loading' }}
      </button>
      
      <button 
        @click="toggleError" 
        class="btn btn-sm btn-outline"
      >
        {{ error ? 'Clear Error' : 'Show Error' }}
      </button>
      
      <button 
        @click="toggleEmpty" 
        class="btn btn-sm btn-outline"
      >
        {{ files.length === 0 ? 'Add Files' : 'Clear Files' }}
      </button>
    </div>
    
    <!-- ViewModeSelector -->
    <div class="mb-4">
      <ViewModeSelector @mode-changed="handleModeChange" />
    </div>
    
    <!-- DetailedListView -->
    <div class="bg-base-200 p-4 rounded-lg">
      <DetailedListView
        :files="files"
        :loading="loading"
        :error="error"
        :current-path="currentPath"
        @file-selected="handleFileSelected"
        @file-double-click="handleFileDoubleClick"
        @path-selected="handlePathSelected"
        @sort-changed="handleSortChanged"
      />
    </div>
    
    <!-- Event Log -->
    <div class="mt-6">
      <h2 class="text-lg font-semibold mb-2">Event Log</h2>
      <div class="bg-base-100 p-4 rounded-lg max-h-64 overflow-y-auto">
        <div 
          v-for="(event, index) in eventLog" 
          :key="index"
          class="text-sm mb-1 font-mono"
        >
          <span class="text-primary">{{ event.timestamp }}</span>
          <span class="text-secondary ml-2">{{ event.type }}</span>
          <span class="ml-2">{{ event.data }}</span>
        </div>
        <div v-if="eventLog.length === 0" class="text-base-content/60 text-sm">
          No events yet...
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import DetailedListView from '@/components/Shared/DetailedListView.vue'
import ViewModeSelector from '@/components/Shared/ViewModeSelector.vue'

// État local
const loading = ref(false)
const error = ref('')
const currentPath = ref('/test')
const eventLog = ref([])

// Données de test
const sampleFiles = [
  {
    name: 'Documents',
    path: '/test/Documents',
    is_directory: true,
    modified_time: '2024-01-15T10:30:00Z'
  },
  {
    name: 'presentation.pptx',
    path: '/test/presentation.pptx',
    is_directory: false,
    size: 2048576,
    modified_time: '2024-01-14T15:45:00Z'
  },
  {
    name: 'report.pdf',
    path: '/test/report.pdf',
    is_directory: false,
    size: 1024000,
    modified_time: '2024-01-16T08:20:00Z'
  },
  {
    name: 'script.js',
    path: '/test/script.js',
    is_directory: false,
    size: 4096,
    modified_time: '2024-01-13T12:15:00Z'
  },
  {
    name: 'image.png',
    path: '/test/image.png',
    is_directory: false,
    size: 512000,
    modified_time: '2024-01-17T09:30:00Z'
  },
  {
    name: 'video.mp4',
    path: '/test/video.mp4',
    is_directory: false,
    size: 10485760,
    modified_time: '2024-01-12T14:20:00Z'
  },
  {
    name: 'archive.zip',
    path: '/test/archive.zip',
    is_directory: false,
    size: 3145728,
    modified_time: '2024-01-11T16:45:00Z'
  },
  {
    name: 'README.md',
    path: '/test/README.md',
    is_directory: false,
    size: 2048,
    modified_time: '2024-01-18T11:10:00Z'
  }
]

const files = ref([...sampleFiles])

// Utilitaire pour logger les événements
const logEvent = (type, data) => {
  const timestamp = new Date().toLocaleTimeString()
  eventLog.value.unshift({
    timestamp,
    type,
    data: typeof data === 'object' ? JSON.stringify(data, null, 2) : String(data)
  })
  
  // Garder seulement les 20 derniers événements
  if (eventLog.value.length > 20) {
    eventLog.value = eventLog.value.slice(0, 20)
  }
}

// Gestionnaires d'événements
const handleFileSelected = (event) => {
  logEvent('FILE_SELECTED', {
    file: event.file.name,
    multiSelect: event.multiSelect,
    rangeSelect: event.rangeSelect
  })
}

const handleFileDoubleClick = (event) => {
  logEvent('FILE_DOUBLE_CLICK', {
    file: event.file.name,
    isDirectory: event.file.is_directory
  })
}

const handlePathSelected = (path) => {
  currentPath.value = path
  logEvent('PATH_SELECTED', path)
}

const handleSortChanged = (event) => {
  logEvent('SORT_CHANGED', {
    column: event.column,
    direction: event.direction
  })
}

const handleModeChange = (event) => {
  logEvent('MODE_CHANGED', {
    oldMode: event.oldMode,
    newMode: event.newMode
  })
}

// Contrôles de test
const toggleLoading = () => {
  loading.value = !loading.value
  if (loading.value) {
    error.value = ''
  }
}

const toggleError = () => {
  if (error.value) {
    error.value = ''
  } else {
    error.value = 'Erreur de test : Impossible de charger les fichiers'
    loading.value = false
  }
}

const toggleEmpty = () => {
  if (files.value.length === 0) {
    files.value = [...sampleFiles]
  } else {
    files.value = []
  }
  loading.value = false
  error.value = ''
}
</script>

<style scoped>
.container {
  max-width: 1200px;
}

/* Animation pour les événements */
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.event-log > div:first-child {
  animation: slideIn 0.3s ease-out;
}
</style>