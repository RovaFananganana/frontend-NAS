<!-- src/components/Admin/FileExplorerNAS.vue -->
<template>
  <div class="h-full flex flex-col bg-base-100">
    <!-- Toolbar -->
    <div class="flex items-center gap-2 p-2 border-b border-base-300 bg-base-50">
      <!-- Navigation buttons -->
      <div class="flex items-center gap-1">
        <button 
          class="btn btn-sm btn-ghost" 
          :disabled="!canGoBack"
          @click="goBack"
          title="Précédent"
        >
          <i class="fas fa-arrow-left"></i>
        </button>
        <button 
          class="btn btn-sm btn-ghost" 
          :disabled="!canGoForward"
          @click="goForward"
          title="Suivant"
        >
          <i class="fas fa-arrow-right"></i>
        </button>
        <button 
          class="btn btn-sm btn-ghost" 
          @click="goUp"
          :disabled="currentPath === '/'"
          title="Dossier parent"
        >
          <i class="fas fa-arrow-up"></i>
        </button>
        <button 
          class="btn btn-sm btn-ghost" 
          @click="refresh"
          title="Actualiser"
        >
          <i class="fas fa-sync-alt" :class="{ 'animate-spin': loading }"></i>
        </button>
      </div>

      <div class="divider divider-horizontal mx-0"></div>

      <!-- View options -->
      <div class="flex items-center gap-1">
        <button 
          class="btn btn-sm btn-ghost" 
          :class="{ 'btn-active': viewMode === 'grid' }"
          @click="setViewMode('grid')"
          title="Grandes icônes"
        >
          <i class="fas fa-th-large"></i>
        </button>
        <button 
          class="btn btn-sm btn-ghost" 
          :class="{ 'btn-active': viewMode === 'list' }"
          @click="setViewMode('list')"
          title="Liste"
        >
          <i class="fas fa-list"></i>
        </button>
        <button 
          class="btn btn-sm btn-ghost" 
          :class="{ 'btn-active': viewMode === 'details' }"
          @click="setViewMode('details')"
          title="Détails"
        >
          <i class="fas fa-th-list"></i>
        </button>
      </div>

      <div class="divider divider-horizontal mx-0"></div>

      <!-- Actions -->
      <div class="flex items-center gap-1">
        <button 
          class="btn btn-sm btn-primary" 
          @click="openCreateFolderModal"
          title="Nouveau dossier"
        >
          <i class="fas fa-folder-plus mr-1"></i>
          Nouveau dossier
        </button>
        
        <!-- Upload avec progress -->
        <div class="dropdown">
          <button class="btn btn-sm btn-secondary" tabindex="0">
            <i class="fas fa-upload mr-1"></i>
            Upload
          </button>
          <div class="dropdown-content card compact w-64 p-2 shadow bg-base-100 z-[1]">
            <input 
              ref="fileInput"
              type="file" 
              multiple 
              class="file-input file-input-bordered file-input-sm w-full"
              @change="handleFileUpload"
            />
            <div v-if="uploadProgress.length > 0" class="mt-2 space-y-1">
              <div v-for="upload in uploadProgress" :key="upload.id" class="text-xs">
                <div class="flex justify-between">
                  <span class="truncate flex-1">{{ upload.name }}</span>
                  <span>{{ upload.progress }}%</span>
                </div>
                <div class="progress progress-primary progress-xs">
                  <div class="progress-bar" :style="{ width: upload.progress + '%' }"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <button 
          class="btn btn-sm btn-outline" 
          @click="syncWithNAS"
          :disabled="syncing"
          title="Synchroniser avec NAS"
        >
          <i class="fas fa-sync" :class="{ 'animate-spin': syncing }"></i>
          Sync NAS
        </button>
      </div>

      <div class="flex-1"></div>

      <!-- Search -->
      <div class="flex items-center gap-2">
        <div class="form-control">
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="Rechercher..." 
            class="input input-sm input-bordered w-64"
            @input="onSearch"
          />
        </div>
      </div>
    </div>

    <!-- Address Bar -->
    <div class="flex items-center gap-2 p-2 bg-base-50 border-b border-base-300">
      <i class="fas fa-hdd text-primary"></i>
      <div class="flex-1 flex items-center gap-1 text-sm">
        <button 
          class="btn btn-xs btn-ghost text-primary hover:bg-primary hover:text-primary-content"
          @click="navigateToPath('/')"
        >
          <i class="fas fa-home mr-1"></i>
          NAS Root
        </button>
        <template v-if="pathSegments.length > 0">
          <template v-for="(segment, index) in pathSegments" :key="index">
            <i class="fas fa-chevron-right text-xs opacity-50"></i>
            <button 
              class="btn btn-xs btn-ghost text-primary hover:bg-primary hover:text-primary-content"
              @click="navigateToPath(getPathUpTo(index))"
            >
              {{ segment }}
            </button>
          </template>
        </template>
      </div>
      
      <!-- Status indicators -->
      <div class="flex items-center gap-2 text-xs">
        <div class="badge badge-outline" v-if="nasConnected">
          <i class="fas fa-wifi text-success mr-1"></i>
          NAS Connecté
        </div>
        <div class="badge badge-error" v-else>
          <i class="fas fa-wifi-slash text-error mr-1"></i>
          NAS Déconnecté
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="flex-1 flex overflow-hidden">
      <!-- Sidebar Tree -->
      <div class="w-64 border-r border-base-300 bg-base-50 overflow-auto">
        <div class="p-2">
          <div class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Arborescence NAS
          </div>
          <NASFolderTree 
            :current-path="currentPath"
            @path-selected="navigateToPath"
          />
        </div>
      </div>

      <!-- File/Folder List -->
      <div class="flex-1 flex flex-col overflow-hidden">
        <!-- Loading indicator -->
        <div v-if="loading" class="flex-1 flex items-center justify-center">
          <div class="text-center">
            <div class="loading loading-spinner loading-lg mb-4"></div>
            <p class="text-gray-500">Chargement du contenu NAS...</p>
          </div>
        </div>

        <!-- Error state -->
        <div v-else-if="error" class="flex-1 flex items-center justify-center">
          <div class="text-center">
            <i class="fas fa-exclamation-triangle text-4xl text-error mb-4"></i>
            <p class="text-error mb-2">{{ error }}</p>
            <div class="space-x-2">
              <button class="btn btn-sm btn-outline btn-error" @click="refresh">
                Réessayer
              </button>
              <button class="btn btn-sm btn-outline" @click="checkNASConnection">
                Vérifier la connexion
              </button>
            </div>
          </div>
        </div>

        <!-- Content -->
        <div v-else class="flex-1 overflow-auto">
          <!-- Grid View -->
          <div v-if="viewMode === 'grid'" class="p-4">
            <div class="grid grid-cols-6 gap-4">
              <div
                v-for="item in filteredItems"
                :key="item.path"
                class="flex flex-col items-center p-3 rounded-lg hover:bg-base-200 cursor-pointer transition-colors"
                :class="{ 
                  'bg-primary text-primary-content': selectedItems.has(item.path),
                  'opacity-50': item.uploading 
                }"
                @click="selectItem(item)"
                @dblclick="openItem(item)"
                @contextmenu.prevent="showContextMenu($event, item)"
              >
                <div class="text-4xl mb-2 relative">
                  <i :class="getItemIcon(item)" :style="{ color: getItemColor(item) }"></i>
                  <div v-if="item.uploading" class="absolute inset-0 flex items-center justify-center">
                    <div class="loading loading-spinner loading-xs"></div>
                  </div>
                </div>
                <div class="text-sm text-center truncate w-full" :title="item.name">
                  {{ item.name }}
                </div>
                <div v-if="item.type === 'file'" class="text-xs text-gray-400">
                  {{ formatBytes(item.size) }}
                </div>
              </div>
            </div>
          </div>

          <!-- List View -->
          <div v-else-if="viewMode === 'list'" class="p-4">
            <div class="space-y-1">
              <div
                v-for="item in filteredItems"
                :key="item.path"
                class="flex items-center gap-3 p-2 rounded hover:bg-base-200 cursor-pointer transition-colors"
                :class="{ 
                  'bg-primary text-primary-content': selectedItems.has(item.path),
                  'opacity-50': item.uploading 
                }"
                @click="selectItem(item)"
                @dblclick="openItem(item)"
                @contextmenu.prevent="showContextMenu($event, item)"
              >
                <div class="text-lg relative">
                  <i :class="getItemIcon(item)" :style="{ color: getItemColor(item) }"></i>
                  <div v-if="item.uploading" class="absolute -top-1 -right-1">
                    <div class="loading loading-spinner loading-xs"></div>
                  </div>
                </div>
                <div class="flex-1 truncate">{{ item.name }}</div>
                <div class="text-xs text-gray-500">
                  {{ item.type === 'file' ? formatBytes(item.size) : 'Dossier' }}
                </div>
                <div class="text-xs text-gray-400">
                  {{ formatDate(item.modified) }}
                </div>
              </div>
            </div>
          </div>

          <!-- Details View -->
          <div v-else class="overflow-auto">
            <table class="table table-zebra w-full">
              <thead class="sticky top-0 z-10">
                <tr>
                  <th class="w-8">
                    <input 
                      type="checkbox" 
                      :checked="allSelected" 
                      @change="toggleSelectAll"
                      class="checkbox checkbox-sm"
                    />
                  </th>
                  <th class="cursor-pointer hover:bg-base-200" @click="sortBy('name')">
                    Nom 
                    <i v-if="sortField === 'name'" :class="sortOrder === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down'"></i>
                  </th>
                  <th class="cursor-pointer hover:bg-base-200" @click="sortBy('type')">
                    Type
                    <i v-if="sortField === 'type'" :class="sortOrder === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down'"></i>
                  </th>
                  <th class="cursor-pointer hover:bg-base-200" @click="sortBy('size')">
                    Taille
                    <i v-if="sortField === 'size'" :class="sortOrder === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down'"></i>
                  </th>
                  <th class="cursor-pointer hover:bg-base-200" @click="sortBy('modified')">
                    Date de modification
                    <i v-if="sortField === 'modified'" :class="sortOrder === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down'"></i>
                  </th>
                  <th>Permissions</th>
                  <th class="w-24">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="item in filteredItems"
                  :key="item.path"
                  class="hover cursor-pointer"
                  :class="{ 
                    'bg-primary text-primary-content': selectedItems.has(item.path),
                    'opacity-50': item.uploading 
                  }"
                  @click="selectItem(item)"
                  @dblclick="openItem(item)"
                  @contextmenu.prevent="showContextMenu($event, item)"
                >
                  <td>
                    <input 
                      type="checkbox" 
                      :checked="selectedItems.has(item.path)"
                      @click.stop="toggleItemSelection(item)"
                      class="checkbox checkbox-sm"
                    />
                  </td>
                  <td>
                    <div class="flex items-center gap-2">
                      <div class="relative">
                        <i :class="getItemIcon(item)" :style="{ color: getItemColor(item) }"></i>
                        <div v-if="item.uploading" class="absolute -top-1 -right-1">
                          <div class="loading loading-spinner loading-xs"></div>
                        </div>
                      </div>
                      <span class="font-medium">{{ item.name }}</span>
                    </div>
                  </td>
                  <td>
                    <div class="badge badge-sm">{{ item.is_directory ? 'Dossier' : 'Fichier' }}</div>
                  </td>
                  <td>{{ !item.is_directory ? formatBytes(item.size) : '—' }}</td>
                  <td>{{ formatDate(item.modified) }}</td>
                  <td>
                    <div class="badge badge-outline badge-xs">RW</div>
                  </td>
                  <td>
                    <div class="flex gap-1">
                      <button
                        class="btn btn-xs btn-ghost"
                        @click.stop="openRenameModal(item)"
                        title="Renommer"
                        :disabled="item.uploading"
                      >
                        <i class="fas fa-edit"></i>
                      </button>
                      <button
                        class="btn btn-xs btn-ghost text-error"
                        @click.stop="confirmDelete(item)"
                        title="Supprimer"
                        :disabled="item.uploading"
                      >
                        <i class="fas fa-trash"></i>
                      </button>
                      <button
                        v-if="!item.is_directory"
                        class="btn btn-xs btn-ghost"
                        @click.stop="downloadFile(item)"
                        title="Télécharger"
                      >
                        <i class="fas fa-download"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Empty state -->
          <div v-if="filteredItems.length === 0 && !loading" class="flex-1 flex items-center justify-center">
            <div class="text-center">
              <i class="fas fa-folder-open text-6xl opacity-30 mb-4"></i>
              <p class="text-xl opacity-70 mb-2">Dossier vide</p>
              <p class="opacity-50">Aucun fichier ou dossier trouvé dans ce répertoire NAS</p>
            </div>
          </div>
        </div>

        <!-- Status bar -->
        <div class="border-t border-base-300 p-2 bg-base-50 text-xs text-gray-500 flex items-center justify-between">
          <div class="flex items-center gap-4">
            <span>{{ filteredItems.length }} élément(s)</span>
            <span v-if="selectedItems.size > 0">{{ selectedItems.size }} sélectionné(s)</span>
            <span v-if="totalSize > 0">Total: {{ formatBytes(totalSize) }}</span>
          </div>
          <div class="flex items-center gap-2">
            <span v-if="lastSync">Dernière sync: {{ formatDate(lastSync) }}</span>
            <div class="flex items-center gap-1">
              <div 
                class="w-2 h-2 rounded-full" 
                :class="nasConnected ? 'bg-success' : 'bg-error'"
              ></div>
              <span>{{ nasConnected ? 'Connecté' : 'Déconnecté' }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Context Menu -->
    <div 
      v-if="contextMenu.show"
      class="fixed bg-base-100 border border-base-300 shadow-lg rounded-lg py-2 z-50"
      :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }"
    >
      <button 
        class="w-full text-left px-4 py-2 hover:bg-base-200 text-sm"
        @click="openItem(contextMenu.item)"
      >
        <i :class="contextMenu.item?.is_directory ? 'fas fa-folder-open' : 'fas fa-eye'" class="mr-2"></i>
        {{ contextMenu.item?.is_directory ? 'Ouvrir' : 'Prévisualiser' }}
      </button>
      <button 
        v-if="!contextMenu.item?.is_directory"
        class="w-full text-left px-4 py-2 hover:bg-base-200 text-sm"
        @click="downloadFile(contextMenu.item)"
      >
        <i class="fas fa-download mr-2"></i>
        Télécharger
      </button>
      <button 
        class="w-full text-left px-4 py-2 hover:bg-base-200 text-sm"
        @click="openRenameModal(contextMenu.item)"
      >
        <i class="fas fa-edit mr-2"></i>
        Renommer
      </button>
      <div class="divider my-1"></div>
      <button 
        class="w-full text-left px-4 py-2 hover:bg-base-200 text-sm text-error"
        @click="confirmDelete(contextMenu.item)"
      >
        <i class="fas fa-trash mr-2"></i>
        Supprimer
      </button>
    </div>

    <!-- Modals -->
    <CreateFolderNASModal 
      v-if="showCreateModal"
      :current-path="currentPath"
      @close="showCreateModal = false"
      @created="onFolderCreated"
    />

    <RenameNASModal 
      v-if="showRenameModal"
      :item="itemToRename"
      @close="showRenameModal = false"
      @renamed="onItemRenamed"
    />

    <DeleteConfirmNASModal 
      v-if="showDeleteModal"
      :item="itemToDelete"
      @close="showDeleteModal = false"
      @confirmed="onItemDeleted"
    />

    <!-- File Preview Modal -->
    <FilePreviewModal 
      v-if="showPreviewModal"
      :item="previewItem"
      @close="showPreviewModal = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick, onUnmounted } from 'vue'
import { useStore } from 'vuex'
import { useSynologyAPI, NasPathUtils } from '@/services/useSynologyAPI'

// Import components
import NASFolderTree from '../Shared/NASFolderTree.vue'
import CreateFolderNASModal from '../Shared/CreateFolderModal.vue'
import RenameNASModal from '../Shared/RenameModal.vue'
import DeleteConfirmNASModal from '../Shared/DeleteConfirmModal.vue'
import FilePreviewModal from '../Shared/FilePreviewModal.vue'

const store = useStore()

// Instance de l'API Synology
const synologyAPI = useSynologyAPI()

// State
const currentPath = ref('/')
const items = ref([])
const loading = ref(false)
const error = ref('')
const selectedItems = ref(new Set())
const viewMode = ref('details')
const sortField = ref('name')
const sortOrder = ref('asc')
const searchQuery = ref('')
const nasConnected = ref(true)
const syncing = ref(false)
const lastSync = ref(null)

// Upload state
const uploadProgress = ref([])
const fileInput = ref(null)

// Navigation history
const navigationHistory = ref([])
const currentHistoryIndex = ref(-1)

// Modals
const showCreateModal = ref(false)
const showRenameModal = ref(false)
const showDeleteModal = ref(false)
const showPreviewModal = ref(false)
const itemToRename = ref(null)
const itemToDelete = ref(null)
const previewItem = ref(null)

// Context menu
const contextMenu = ref({
  show: false,
  x: 0,
  y: 0,
  item: null
})

// Computed properties
const pathSegments = computed(() => {
  return currentPath.value === '/' ? [] : currentPath.value.split('/').filter(Boolean)
})

const filteredItems = computed(() => {
  let filtered = items.value.slice()

  // Filter by search
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(item => 
      item.name.toLowerCase().includes(query)
    )
  }

  // Sort items
  filtered.sort((a, b) => {
    // Directories first
    if (a.is_directory !== b.is_directory) {
      return a.is_directory ? -1 : 1
    }

    let valueA = a[sortField.value]
    let valueB = b[sortField.value]

    if (sortField.value === 'size') {
      valueA = !a.is_directory ? (a.size || 0) : 0
      valueB = !b.is_directory ? (b.size || 0) : 0
    }

    if (typeof valueA === 'string') {
      valueA = valueA.toLowerCase()
      valueB = valueB.toLowerCase()
    }

    if (valueA < valueB) return sortOrder.value === 'asc' ? -1 : 1
    if (valueA > valueB) return sortOrder.value === 'asc' ? 1 : -1
    return 0
  })

  return filtered
})

const totalSize = computed(() => {
  return items.value
    .filter(item => !item.is_directory)
    .reduce((total, file) => total + (file.size || 0), 0)
})

const allSelected = computed(() => {
  return filteredItems.value.length > 0 && 
         filteredItems.value.every(item => selectedItems.value.has(item.path))
})

const canGoBack = computed(() => currentHistoryIndex.value > 0)
const canGoForward = computed(() => currentHistoryIndex.value < navigationHistory.value.length - 1)

// Methods
const loadDirectory = async (path = '/') => {
  loading.value = true
  error.value = ''
  
  try {
    const response = await synologyAPI.listDirectory(path)
    items.value = response.items || []
    currentPath.value = path
    nasConnected.value = true
  } catch (err) {
    console.error('Error loading directory:', err)
    error.value = err.response?.data?.error || err.message || 'Erreur lors du chargement du répertoire NAS'
    nasConnected.value = false
    items.value = []
  } finally {
    loading.value = false
  }
}

const navigateToPath = (path) => {
  if (currentHistoryIndex.value < navigationHistory.value.length - 1) {
    navigationHistory.value = navigationHistory.value.slice(0, currentHistoryIndex.value + 1)
  }
  navigationHistory.value.push(path)
  currentHistoryIndex.value = navigationHistory.value.length - 1

  selectedItems.value.clear()
  loadDirectory(path)
}

const getPathUpTo = (index) => {
  const segments = pathSegments.value.slice(0, index + 1)
  return segments.length === 0 ? '/' : '/' + segments.join('/')
}

const goBack = () => {
  if (canGoBack.value) {
    currentHistoryIndex.value--
    const path = navigationHistory.value[currentHistoryIndex.value]
    selectedItems.value.clear()
    loadDirectory(path)
  }
}

const goForward = () => {
  if (canGoForward.value) {
    currentHistoryIndex.value++
    const path = navigationHistory.value[currentHistoryIndex.value]
    selectedItems.value.clear()
    loadDirectory(path)
  }
}

const goUp = () => {
  if (currentPath.value !== '/') {
    const segments = currentPath.value.split('/').filter(Boolean)
    const parentPath = segments.length > 1 ? '/' + segments.slice(0, -1).join('/') : '/'
    navigateToPath(parentPath)
  }
}

const refresh = () => {
  loadDirectory(currentPath.value)
}

const setViewMode = (mode) => {
  viewMode.value = mode
}

const sortBy = (field) => {
  if (sortField.value === field) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortField.value = field
    sortOrder.value = 'asc'
  }
}

const selectItem = (item) => {
  selectedItems.value.clear()
  selectedItems.value.add(item.path)
}

const toggleItemSelection = (item) => {
  if (selectedItems.value.has(item.path)) {
    selectedItems.value.delete(item.path)
  } else {
    selectedItems.value.add(item.path)
  }
}

const toggleSelectAll = () => {
  if (allSelected.value) {
    selectedItems.value.clear()
  } else {
    filteredItems.value.forEach(item => selectedItems.value.add(item.path))
  }
}

const openItem = (item) => {
  if (item.is_directory) {
    navigateToPath(item.path)
  } else {
    previewItem.value = item
    showPreviewModal.value = true
  }
}

const showContextMenu = (event, item) => {
  contextMenu.value = {
    show: true,
    x: event.clientX,
    y: event.clientY,
    item
  }

  nextTick(() => {
    const hideMenu = () => {
      contextMenu.value.show = false
      document.removeEventListener('click', hideMenu)
    }
    document.addEventListener('click', hideMenu)
  })
}

const handleFileUpload = async (event) => {
  const files = Array.from(event.target.files)
  if (files.length === 0) return

  for (const file of files) {
    const uploadId = Date.now() + Math.random()
    
    uploadProgress.value.push({
      id: uploadId,
      name: file.name,
      progress: 0
    })

    try {
      await synologyAPI.uploadFile(file, currentPath.value, (progress) => {
        const upload = uploadProgress.value.find(u => u.id === uploadId)
        if (upload) {
          upload.progress = progress
        }
      })

      uploadProgress.value = uploadProgress.value.filter(u => u.id !== uploadId)
      refresh()

    } catch (error) {
      console.error('Upload error:', error)
      store.dispatch('showError', `Erreur upload ${file.name}: ${error.message}`)
      uploadProgress.value = uploadProgress.value.filter(u => u.id !== uploadId)
    }
  }

  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const downloadFile = async (item) => {
  try {
    const downloadUrl = synologyAPI.getDownloadUrl(item.path)
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = item.name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

  } catch (error) {
    console.error('Download error:', error)
    store.dispatch('showError', `Erreur téléchargement: ${error.message}`)
  }
}

const syncWithNAS = async () => {
  syncing.value = true
  try {
    await synologyAPI.fullSync()
    lastSync.value = new Date()
    refresh()
    store.dispatch('showSuccess', 'Synchronisation NAS terminée')
  } catch (error) {
    console.error('Sync error:', error)
    store.dispatch('showError', `Erreur de synchronisation: ${error.message}`)
  } finally {
    syncing.value = false
  }
}

const checkNASConnection = async () => {
  try {
    await synologyAPI.testConnection()
    nasConnected.value = true
    store.dispatch('showSuccess', 'Connexion NAS OK')
  } catch (error) {
    nasConnected.value = false
    store.dispatch('showError', 'Connexion NAS échouée')
  }
}

const onSearch = () => {
  // Search is handled by computed property
}

const openCreateFolderModal = () => {
  showCreateModal.value = true
}

const openRenameModal = (item) => {
  itemToRename.value = item
  showRenameModal.value = true
  contextMenu.value.show = false
}

const confirmDelete = (item) => {
  itemToDelete.value = item
  showDeleteModal.value = true
  contextMenu.value.show = false
}

const onFolderCreated = () => {
  refresh()
}

const onItemRenamed = () => {
  refresh()
}

const onItemDeleted = () => {
  refresh()
}

// Utility functions
const formatBytes = (bytes) => {
  if (!bytes || bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatDate = (date) => {
  if (!date) return '—'
  return new Date(date).toLocaleString('fr-FR')
}

const getItemIcon = (item) => {
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
    'ppt': 'fas fa-file-powerpoint',
    'pptx': 'fas fa-file-powerpoint',
    'jpg': 'fas fa-file-image',
    'jpeg': 'fas fa-file-image',
    'png': 'fas fa-file-image',
    'gif': 'fas fa-file-image',
    'bmp': 'fas fa-file-image',
    'svg': 'fas fa-file-image',
    'mp4': 'fas fa-file-video',
    'avi': 'fas fa-file-video',
    'mov': 'fas fa-file-video',
    'mkv': 'fas fa-file-video',
    'mp3': 'fas fa-file-audio',
    'wav': 'fas fa-file-audio',
    'flac': 'fas fa-file-audio',
    'zip': 'fas fa-file-archive',
    'rar': 'fas fa-file-archive',
    '7z': 'fas fa-file-archive',
    'tar': 'fas fa-file-archive',
    'txt': 'fas fa-file-alt',
    'md': 'fas fa-file-alt',
    'js': 'fas fa-file-code',
    'ts': 'fas fa-file-code',
    'html': 'fas fa-file-code',
    'css': 'fas fa-file-code',
    'py': 'fas fa-file-code',
    'json': 'fas fa-file-code',
    'xml': 'fas fa-file-code',
    'yml': 'fas fa-file-code',
    'yaml': 'fas fa-file-code'
  }
  return iconMap[ext] || 'fas fa-file'
}

const getItemColor = (item) => {
  if (item.is_directory) {
    return '#3b82f6' // blue
  }
  
  const ext = item.name?.split('.').pop()?.toLowerCase() || ''
  const colorMap = {
    'pdf': '#dc2626', // red
    'doc': '#2563eb', // blue
    'docx': '#2563eb',
    'xls': '#059669', // green
    'xlsx': '#059669',
    'ppt': '#ea580c', // orange
    'pptx': '#ea580c',
    'jpg': '#7c3aed', // purple
    'jpeg': '#7c3aed',
    'png': '#7c3aed',
    'gif': '#7c3aed',
    'bmp': '#7c3aed',
    'svg': '#7c3aed',
    'mp4': '#dc2626', // red
    'avi': '#dc2626',
    'mov': '#dc2626',
    'mkv': '#dc2626',
    'mp3': '#059669', // green
    'wav': '#059669',
    'flac': '#059669',
    'zip': '#6b7280', // gray
    'rar': '#6b7280',
    '7z': '#6b7280',
    'tar': '#6b7280',
    'txt': '#374151', // dark gray
    'md': '#374151',
    'js': '#f59e0b', // yellow
    'ts': '#f59e0b',
    'html': '#f59e0b',
    'css': '#f59e0b',
    'py': '#059669',
    'json': '#f59e0b',
    'xml': '#f59e0b',
    'yml': '#6366f1',
    'yaml': '#6366f1'
  }
  
  return colorMap[ext] || '#6b7280'
}

// Auto-refresh every 30 seconds when connected
let refreshInterval = null

const startAutoRefresh = () => {
  stopAutoRefresh()
  refreshInterval = setInterval(() => {
    if (nasConnected.value && !loading.value) {
      refresh()
    }
  }, 30000) // 30 seconds
}

const stopAutoRefresh = () => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
    refreshInterval = null
  }
}

// Lifecycle
onMounted(() => {
  loadDirectory()
  // Initialize navigation history
  navigationHistory.value = ['/']
  currentHistoryIndex.value = 0
  
  // Start auto-refresh
  startAutoRefresh()
  
  // Check NAS connection periodically
  const connectionCheck = setInterval(checkNASConnection, 60000) // Every minute
  
  onUnmounted(() => {
    stopAutoRefresh()
    clearInterval(connectionCheck)
  })
})

// Watch for path changes
watch(currentPath, (newPath) => {
  // You could update browser URL here if needed
  // history.replaceState(null, '', `/admin/files?path=${encodeURIComponent(newPath)}`)
})
</script>