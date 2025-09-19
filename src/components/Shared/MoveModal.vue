<!-- components/Shared/MoveModal.vue -->
<template>
  <div class="modal modal-open">
    <div class="modal-box max-w-4xl">
      <h3 class="font-bold text-lg mb-4">
        <i class="fas fa-share mr-2"></i>
        Envoyer vers un autre dossier
      </h3>

      <!-- Items to move -->
      <div class="bg-base-200 p-4 rounded-lg mb-4">
        <h4 class="font-semibold mb-2">Éléments à déplacer :</h4>
        <div class="space-y-2">
          <div 
            v-for="item in items" 
            :key="item.path"
            class="flex items-center gap-3"
          >
            <i :class="getItemIcon(item)" :style="{ color: getItemColor(item) }"></i>
            <span>{{ item.name }}</span>
          </div>
        </div>
      </div>

      <!-- Destination selection -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <!-- Folder tree -->
        <div class="border border-base-300 rounded-lg p-4">
          <h4 class="font-semibold mb-3">Choisir le dossier de destination :</h4>
          <div class="max-h-96 overflow-auto">
            <NasFolderTree 
              :current-path="selectedDestination"
              @path-selected="selectDestination"
            />
          </div>
        </div>

        <!-- Quick destinations -->
        <div class="border border-base-300 rounded-lg p-4">
          <h4 class="font-semibold mb-3">Destinations rapides :</h4>
          
          <!-- Recent folders -->
          <div v-if="recentFolders.length > 0" class="mb-4">
            <h5 class="text-sm font-medium mb-2">Dossiers récents :</h5>
            <div class="space-y-1">
              <button
                v-for="folder in recentFolders"
                :key="folder.path"
                @click="selectDestination(folder.path)"
                class="w-full text-left p-2 rounded hover:bg-base-200 text-sm flex items-center gap-2"
                :class="{ 'bg-primary text-primary-content': selectedDestination === folder.path }"
              >
                <i class="fas fa-folder text-primary"></i>
                <span class="truncate">{{ folder.name }}</span>
              </button>
            </div>
          </div>

          <!-- Favorites -->
          <div v-if="favorites.length > 0" class="mb-4">
            <h5 class="text-sm font-medium mb-2">Favoris :</h5>
            <div class="space-y-1">
              <button
                v-for="favorite in favorites"
                :key="favorite.path"
                @click="selectDestination(favorite.path)"
                class="w-full text-left p-2 rounded hover:bg-base-200 text-sm flex items-center gap-2"
                :class="{ 'bg-primary text-primary-content': selectedDestination === favorite.path }"
              >
                <i class="fas fa-star text-yellow-500"></i>
                <span class="truncate">{{ favorite.name }}</span>
              </button>
            </div>
          </div>

          <!-- Common destinations -->
          <div>
            <h5 class="text-sm font-medium mb-2">Destinations communes :</h5>
            <div class="space-y-1">
              <button
                @click="selectDestination('/')"
                class="w-full text-left p-2 rounded hover:bg-base-200 text-sm flex items-center gap-2"
                :class="{ 'bg-primary text-primary-content': selectedDestination === '/' }"
              >
                <i class="fas fa-home text-primary"></i>
                <span>Racine NAS</span>
              </button>
              <button
                v-for="commonFolder in commonFolders"
                :key="commonFolder.path"
                @click="selectDestination(commonFolder.path)"
                class="w-full text-left p-2 rounded hover:bg-base-200 text-sm flex items-center gap-2"
                :class="{ 'bg-primary text-primary-content': selectedDestination === commonFolder.path }"
              >
                <i class="fas fa-folder text-primary"></i>
                <span>{{ commonFolder.name }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Selected destination -->
      <div v-if="selectedDestination" class="mt-4 p-3 bg-primary/10 rounded-lg">
        <div class="flex items-center gap-2">
          <i class="fas fa-arrow-right text-primary"></i>
          <span class="font-medium">Destination sélectionnée :</span>
          <code class="bg-base-200 px-2 py-1 rounded text-sm">{{ selectedDestination }}</code>
        </div>
      </div>

      <!-- Actions -->
      <div class="modal-action">
        <button @click="$emit('close')" class="btn btn-outline">
          Annuler
        </button>
        <button 
          @click="moveItems" 
          :disabled="!selectedDestination || selectedDestination === currentPath || loading"
          class="btn btn-primary"
        >
          <span v-if="loading" class="loading loading-spinner loading-sm mr-2"></span>
          <i v-else class="fas fa-share mr-2"></i>
          Déplacer {{ items.length }} élément{{ items.length > 1 ? 's' : '' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import NasFolderTree from './NasFolderTree.vue'

const props = defineProps({
  items: {
    type: Array,
    required: true
  },
  currentPath: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['close', 'moved'])

// State
const selectedDestination = ref('')
const loading = ref(false)
const recentFolders = ref([])
const favorites = ref([])
const commonFolders = ref([
  { name: 'Documents', path: '/Documents' },
  { name: 'Images', path: '/Images' },
  { name: 'Vidéos', path: '/Videos' },
  { name: 'Archives', path: '/Archives' },
  { name: 'Partage', path: '/Partage' }
])

// Methods
const selectDestination = (path) => {
  selectedDestination.value = path
}

const moveItems = async () => {
  if (!selectedDestination.value || selectedDestination.value === props.currentPath) {
    return
  }

  loading.value = true

  try {
    for (const item of props.items) {
      await moveItem(item, selectedDestination.value)
    }

    // Add to recent folders
    addToRecentFolders(selectedDestination.value)

    emit('moved', {
      items: props.items,
      destination: selectedDestination.value
    })
    emit('close')
  } catch (err) {
    console.error('Error moving items:', err)
    // Handle error - could show toast notification
  } finally {
    loading.value = false
  }
}

const moveItem = async (item, destinationPath) => {
  const response = await fetch('/nas/move', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      source_path: item.path,
      dest_path: destinationPath
    })
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }

  const data = await response.json()

  if (!data.success) {
    throw new Error(data.error || 'Erreur lors du déplacement')
  }
}

const addToRecentFolders = (path) => {
  const folderName = path === '/' ? 'Racine NAS' : path.split('/').pop()
  const folder = { name: folderName, path }
  
  // Remove if already exists
  recentFolders.value = recentFolders.value.filter(f => f.path !== path)
  
  // Add to beginning
  recentFolders.value.unshift(folder)
  
  // Keep only last 5
  recentFolders.value = recentFolders.value.slice(0, 5)
  
  // Save to localStorage
  localStorage.setItem('nas_recent_folders', JSON.stringify(recentFolders.value))
}

const loadRecentFolders = () => {
  try {
    const saved = localStorage.getItem('nas_recent_folders')
    if (saved) {
      recentFolders.value = JSON.parse(saved)
    }
  } catch (err) {
    console.error('Error loading recent folders:', err)
  }
}

const loadFavorites = () => {
  try {
    const saved = localStorage.getItem('nas_favorites')
    if (saved) {
      favorites.value = JSON.parse(saved)
    }
  } catch (err) {
    console.error('Error loading favorites:', err)
  }
}

// Utility functions
const getItemIcon = (item) => {
  if (!item) return 'fas fa-file'
  
  if (item.is_directory) {
    return 'fas fa-folder'
  }
  
  const ext = item.name?.split('.').pop()?.toLowerCase() || ''
  const iconMap = {
    'pdf': 'fas fa-file-pdf',
    'doc': 'fas fa-file-word',
    'docx': 'fas fa-file-word',
    'xls': 'fas fa-file-excel',
    'xlsx': 'fas fa-file-excel',
    'jpg': 'fas fa-file-image',
    'jpeg': 'fas fa-file-image',
    'png': 'fas fa-file-image',
    'gif': 'fas fa-file-image',
    'mp4': 'fas fa-file-video',
    'avi': 'fas fa-file-video',
    'mp3': 'fas fa-file-audio',
    'wav': 'fas fa-file-audio',
    'zip': 'fas fa-file-archive',
    'rar': 'fas fa-file-archive',
    'txt': 'fas fa-file-alt',
    'js': 'fas fa-file-code',
    'html': 'fas fa-file-code',
    'css': 'fas fa-file-code'
  }
  return iconMap[ext] || 'fas fa-file'
}

const getItemColor = (item) => {
  if (!item) return '#6b7280'
  
  if (item.is_directory) {
    return '#3b82f6'
  }
  
  const ext = item.name?.split('.').pop()?.toLowerCase() || ''
  const colorMap = {
    'pdf': '#dc2626',
    'doc': '#2563eb',
    'docx': '#2563eb',
    'xls': '#059669',
    'xlsx': '#059669',
    'jpg': '#7c3aed',
    'jpeg': '#7c3aed',
    'png': '#7c3aed',
    'gif': '#7c3aed',
    'mp4': '#ea580c',
    'avi': '#ea580c',
    'mp3': '#10b981',
    'wav': '#10b981',
    'zip': '#6b7280',
    'rar': '#6b7280',
    'txt': '#374151',
    'js': '#fbbf24',
    'html': '#f97316',
    'css': '#06b6d4'
  }
  return colorMap[ext] || '#6b7280'
}

// Lifecycle
onMounted(() => {
  loadRecentFolders()
  loadFavorites()
})
</script>