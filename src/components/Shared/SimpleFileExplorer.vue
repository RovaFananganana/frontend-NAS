<!-- components/Shared/SimpleFileExplorer.vue -->
<template>
  <div class="h-full flex bg-base-100">
    <!-- Sidebar - Tree Navigation -->
    <div class="w-80 border-r border-base-300 bg-base-50 flex flex-col">
      <!-- Search Bar -->
      <div class="p-4 border-b border-base-300">
        <div class="form-control">
          <div class="input-group">
            <input 
              v-model="searchQuery" 
              type="text" 
              placeholder="Rechercher par nom..." 
              class="input input-bordered input-sm flex-1"
              @input="onSearch"
            />
            <button class="btn btn-sm btn-square" @click="clearSearch" v-if="searchQuery">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- Favorites (for regular users) -->
      <div v-if="!isAdmin && favorites.length > 0" class="p-4 border-b border-base-300">
        <h3 class="text-sm font-semibold text-base-content mb-2">
          <i class="fas fa-star text-yellow-500 mr-2"></i>
          Dossiers favoris
        </h3>
        <div class="space-y-1">
          <button
            v-for="favorite in favorites"
            :key="favorite.path"
            @click="navigateToPath(favorite.path)"
            class="w-full text-left p-2 rounded hover:bg-base-200 text-sm flex items-center"
            :class="{ 'bg-primary text-primary-content': currentPath === favorite.path }"
          >
            <i class="fas fa-folder text-primary mr-2"></i>
            <span class="truncate">{{ favorite.name }}</span>
          </button>
        </div>
      </div>

      <!-- Tree Navigation -->
      <div class="flex-1 overflow-auto p-4">
        <h3 class="text-sm font-semibold text-base-content mb-2">
          <i class="fas fa-sitemap mr-2"></i>
          Arborescence
        </h3>
        <NasFolderTree 
          :current-path="currentPath"
          @path-selected="navigateToPath"
        />
      </div>
    </div>

    <!-- Main Content Area -->
    <div class="flex-1 flex flex-col">
      <!-- Breadcrumb & Controls -->
      <div class="p-4 border-b border-base-300 bg-base-50">
        <!-- Breadcrumb -->
        <nav class="text-sm breadcrumbs mb-3">
          <ul>
            <li>
              <button @click="navigateToPath('/')" class="btn btn-ghost btn-xs">
                <i class="fas fa-home mr-1"></i>
                NAS Root
              </button>
            </li>
            <li v-for="(segment, index) in pathSegments" :key="index">
              <button 
                @click="navigateToPath(getPathUpTo(index))"
                class="btn btn-ghost btn-xs"
              >
                {{ segment }}
              </button>
            </li>
          </ul>
        </nav>

        <!-- Controls -->
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <!-- Sort Options -->
            <div class="dropdown">
              <label tabindex="0" class="btn btn-sm btn-outline">
                <i class="fas fa-sort mr-2"></i>
                Trier par {{ sortLabels[sortBy] }}
              </label>
              <ul tabindex="0" class="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52">
                <li><button @click="setSortBy('name')">
                  <i class="fas fa-font"></i>
                  Nom
                </button></li>
                <li><button @click="setSortBy('modified')">
                  <i class="fas fa-clock"></i>
                  Date de modification
                </button></li>
                <li><button @click="setSortBy('size')">
                  <i class="fas fa-weight-hanging"></i>
                  Taille
                </button></li>
              </ul>
            </div>

            <!-- Sort Order -->
            <button 
              @click="toggleSortOrder" 
              class="btn btn-sm btn-outline"
              :title="sortOrder === 'asc' ? 'Croissant' : 'Décroissant'"
            >
              <i class="fas" :class="sortOrder === 'asc' ? 'fa-sort-up' : 'fa-sort-down'"></i>
            </button>

            <!-- Add to Favorites (for regular users) -->
            <button 
              v-if="!isAdmin && currentPath !== '/'"
              @click="toggleFavorite"
              class="btn btn-sm btn-outline"
              :class="{ 'btn-warning': isFavorite }"
              :title="isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'"
            >
              <i class="fas fa-star" :class="{ 'text-yellow-500': isFavorite }"></i>
            </button>
          </div>

          <!-- Item Count -->
          <div class="text-sm text-base-content opacity-70">
            {{ filteredItems.length }} élément(s)
          </div>
        </div>
      </div>

      <!-- File List -->
      <div class="flex-1 overflow-auto p-4">
        <!-- Loading -->
        <div v-if="loading" class="flex justify-center items-center h-32">
          <span class="loading loading-spinner loading-lg"></span>
        </div>

        <!-- Error -->
        <div v-else-if="error" class="alert alert-error">
          <i class="fas fa-exclamation-triangle"></i>
          <span>{{ error }}</span>
        </div>

        <!-- Empty State -->
        <div v-else-if="filteredItems.length === 0" class="text-center py-12">
          <i class="fas fa-folder-open text-6xl opacity-30 mb-4"></i>
          <p class="text-xl opacity-70 mb-2">
            {{ searchQuery ? 'Aucun résultat' : 'Dossier vide' }}
          </p>
          <p class="opacity-50">
            {{ searchQuery ? `Aucun élément trouvé pour "${searchQuery}"` : 'Ce dossier ne contient aucun fichier' }}
          </p>
        </div>

        <!-- File Grid -->
        <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          <div
            v-for="item in filteredItems"
            :key="item.path"
            @click="selectItem(item)"
            @dblclick="openItem(item)"
            @contextmenu.prevent="showContextMenu($event, item)"
            class="card bg-base-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-base-300"
            :class="{ 'ring-2 ring-primary': selectedItems.has(item.path) }"
          >
            <div class="card-body p-4 text-center">
              <!-- Icon -->
              <div class="text-4xl mb-2">
                <i :class="getItemIcon(item)" :style="{ color: getItemColor(item) }"></i>
              </div>
              
              <!-- Name -->
              <h3 class="card-title text-sm justify-center truncate" :title="item.name">
                {{ item.name }}
              </h3>
              
              <!-- Details -->
              <div class="text-xs opacity-70 mt-1">
                <div v-if="!item.is_directory">{{ formatBytes(item.size) }}</div>
                <div>{{ formatDate(item.modified) }}</div>
              </div>

              <!-- Permissions indicator (for admin) -->
              <div v-if="isAdmin" class="mt-2">
                <button 
                  @click.stop="openPermissions(item)"
                  class="btn btn-xs btn-outline btn-primary"
                  title="Gérer les permissions"
                >
                  <i class="fas fa-shield-alt"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Context Menu -->
    <div 
      v-if="contextMenu.show"
      class="fixed bg-base-100 border border-base-300 shadow-lg rounded-lg py-2 z-50 min-w-52"
      :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }"
      @click.stop
    >
      <!-- Ouvrir -->
      <button 
        v-if="contextMenu.item"
        class="w-full text-left px-4 py-2 hover:bg-base-200 text-sm flex items-center gap-3"
        @click="openItem(contextMenu.item)"
      >
        <i class="fas w-4" :class="contextMenu.item.is_directory ? 'fa-folder-open' : 'fa-eye'"></i>
        {{ contextMenu.item.is_directory ? 'Ouvrir' : 'Prévisualiser' }}
      </button>

      <!-- Télécharger (fichiers seulement) -->
      <button 
        v-if="contextMenu.item && !contextMenu.item.is_directory"
        class="w-full text-left px-4 py-2 hover:bg-base-200 text-sm flex items-center gap-3"
        @click="downloadFile(contextMenu.item)"
      >
        <i class="fas fa-download w-4"></i>
        Télécharger
      </button>

      <div class="divider my-1"></div>

      <!-- Renommer -->
      <button 
        v-if="contextMenu.item && canModifyItem(contextMenu.item)"
        class="w-full text-left px-4 py-2 hover:bg-base-200 text-sm flex items-center gap-3"
        @click="openRenameModal(contextMenu.item)"
      >
        <i class="fas fa-edit w-4"></i>
        Renommer
      </button>

      <!-- Copier -->
      <button 
        v-if="contextMenu.item"
        class="w-full text-left px-4 py-2 hover:bg-base-200 text-sm flex items-center gap-3"
        @click="copyItem(contextMenu.item)"
      >
        <i class="fas fa-copy w-4"></i>
        Copier
      </button>

      <!-- Couper -->
      <button 
        v-if="contextMenu.item && canModifyItem(contextMenu.item)"
        class="w-full text-left px-4 py-2 hover:bg-base-200 text-sm flex items-center gap-3"
        @click="cutItem(contextMenu.item)"
      >
        <i class="fas fa-cut w-4"></i>
        Couper
      </button>

      <!-- Coller -->
      <button 
        v-if="clipboard.items.length > 0 && canModifyCurrentFolder()"
        class="w-full text-left px-4 py-2 hover:bg-base-200 text-sm flex items-center gap-3"
        @click="pasteItems()"
      >
        <i class="fas fa-paste w-4"></i>
        Coller ({{ clipboard.items.length }} élément{{ clipboard.items.length > 1 ? 's' : '' }})
      </button>

      <div class="divider my-1"></div>

      <!-- Envoyer vers / Déplacer -->
      <button 
        v-if="contextMenu.item && canModifyItem(contextMenu.item)"
        class="w-full text-left px-4 py-2 hover:bg-base-200 text-sm flex items-center gap-3"
        @click="openMoveModal(contextMenu.item)"
      >
        <i class="fas fa-share w-4"></i>
        Envoyer vers...
      </button>

      <!-- Permissions (Admin seulement) -->
      <button 
        v-if="contextMenu.item && isAdmin"
        class="w-full text-left px-4 py-2 hover:bg-base-200 text-sm flex items-center gap-3"
        @click="openPermissions(contextMenu.item)"
      >
        <i class="fas fa-shield-alt w-4"></i>
        Permissions
      </button>

      <!-- Favoris (Utilisateurs seulement, dossiers seulement) -->
      <button 
        v-if="contextMenu.item?.is_directory && !isAdmin"
        class="w-full text-left px-4 py-2 hover:bg-base-200 text-sm flex items-center gap-3"
        @click="toggleFavoriteItem(contextMenu.item)"
      >
        <i class="fas fa-star w-4" :class="{ 'text-yellow-500': isItemFavorite(contextMenu.item) }"></i>
        {{ isItemFavorite(contextMenu.item) ? 'Retirer des favoris' : 'Ajouter aux favoris' }}
      </button>

      <div v-if="canModifyItem(contextMenu.item)" class="divider my-1"></div>

      <!-- Supprimer -->
      <button 
        v-if="contextMenu.item && canModifyItem(contextMenu.item)"
        class="w-full text-left px-4 py-2 hover:bg-base-200 text-sm text-error flex items-center gap-3"
        @click="confirmDelete(contextMenu.item)"
      >
        <i class="fas fa-trash w-4"></i>
        Supprimer
      </button>

      <!-- Propriétés -->
      <div class="divider my-1"></div>
      <button 
        v-if="contextMenu.item"
        class="w-full text-left px-4 py-2 hover:bg-base-200 text-sm flex items-center gap-3"
        @click="showProperties(contextMenu.item)"
      >
        <i class="fas fa-info-circle w-4"></i>
        Propriétés
      </button>
    </div>

    <!-- Permissions Modal -->
    <PermissionModal 
      v-if="showPermissionModal"
      :item="selectedItemForPermissions"
      @close="showPermissionModal = false"
      @updated="onPermissionsUpdated"
    />

    <!-- Rename Modal -->
    <RenameModal 
      v-if="showRenameModal"
      :item="itemToRename"
      @close="showRenameModal = false"
      @renamed="onItemRenamed"
    />

    <!-- Move Modal -->
    <MoveModal 
      v-if="showMoveModal"
      :items="itemsToMove"
      :current-path="currentPath"
      @close="showMoveModal = false"
      @moved="onItemsMoved"
    />

    <!-- Delete Confirmation Modal -->
    <DeleteConfirmModal 
      v-if="showDeleteModal"
      :items="itemsToDelete"
      @close="showDeleteModal = false"
      @confirmed="onItemsDeleted"
    />

    <!-- Properties Modal -->
    <PropertiesModal 
      v-if="showPropertiesModal"
      :item="selectedItemForProperties"
      @close="showPropertiesModal = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useStore } from 'vuex'
import NasFolderTree from './NasFolderTree.vue'
import PermissionModal from './PermissionModal.vue'
import RenameModal from './RenameModal.vue'
import MoveModal from './MoveModal.vue'
import DeleteConfirmModal from './DeleteConfirmModal.vue'
import PropertiesModal from './PropertiesModal.vue'

// API helper for NAS calls
const nasAPI = {
  async browse(path) {
    const response = await fetch(`/nas/browse?path=${encodeURIComponent(path)}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    return response.json()
  },
  
  async download(filePath) {
    const response = await fetch(`/nas/download/${encodeURIComponent(filePath)}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    return response.blob()
  }
}

const store = useStore()

// Props
const props = defineProps({
  userRole: {
    type: String,
    default: 'user'
  }
})

// State
const currentPath = ref('/')
const items = ref([])
const loading = ref(false)
const error = ref('')
const searchQuery = ref('')
const selectedItems = ref(new Set())
const sortBy = ref('name')
const sortOrder = ref('asc')
const favorites = ref([])

// Clipboard for copy/paste
const clipboard = ref({
  items: [],
  operation: null // 'copy' or 'cut'
})

// Modals
const showPermissionModal = ref(false)
const showRenameModal = ref(false)
const showMoveModal = ref(false)
const showDeleteModal = ref(false)
const showPropertiesModal = ref(false)
const selectedItemForPermissions = ref(null)
const selectedItemForProperties = ref(null)
const itemToRename = ref(null)
const itemsToMove = ref([])
const itemsToDelete = ref([])

// Context menu
const contextMenu = ref({
  show: false,
  x: 0,
  y: 0,
  item: null
})

// Computed
const isAdmin = computed(() => props.userRole === 'admin')

const pathSegments = computed(() => {
  return currentPath.value === '/' ? [] : currentPath.value.split('/').filter(Boolean)
})

const sortLabels = computed(() => ({
  name: 'nom',
  modified: 'date',
  size: 'taille'
}))

const filteredItems = computed(() => {
  let filtered = items.value.slice()

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(item => 
      item.name.toLowerCase().includes(query)
    )
  }

  // Sort
  filtered.sort((a, b) => {
    // Directories first
    if (a.is_directory !== b.is_directory) {
      return a.is_directory ? -1 : 1
    }

    let valueA = a[sortBy.value]
    let valueB = b[sortBy.value]

    if (sortBy.value === 'size') {
      valueA = a.is_directory ? 0 : (a.size || 0)
      valueB = b.is_directory ? 0 : (b.size || 0)
    }

    if (typeof valueA === 'string') {
      valueA = valueA.toLowerCase()
      valueB = valueB.toLowerCase()
    }

    const result = valueA < valueB ? -1 : valueA > valueB ? 1 : 0
    return sortOrder.value === 'asc' ? result : -result
  })

  return filtered
})

const isFavorite = computed(() => {
  return favorites.value.some(fav => fav.path === currentPath.value)
})

// Methods
const navigateToPath = async (path) => {
  currentPath.value = path
  selectedItems.value.clear()
  await loadDirectory(path)
}

const loadDirectory = async (path = '/') => {
  loading.value = true
  error.value = ''
  
  try {
    const data = await nasAPI.browse(path)
    
    if (data.success) {
      items.value = data.items || []
    } else {
      throw new Error(data.error || 'Failed to load directory')
    }
  } catch (err) {
    console.error('Error loading directory:', err)
    error.value = err.message || 'Erreur lors du chargement du répertoire'
    items.value = []
  } finally {
    loading.value = false
  }
}

const getPathUpTo = (index) => {
  const segments = pathSegments.value.slice(0, index + 1)
  return segments.length === 0 ? '/' : '/' + segments.join('/')
}

const setSortBy = (field) => {
  sortBy.value = field
}

const toggleSortOrder = () => {
  sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
}

const selectItem = (item) => {
  selectedItems.value.clear()
  selectedItems.value.add(item.path)
}

const openItem = (item) => {
  if (item.is_directory) {
    navigateToPath(item.path)
  } else {
    // Preview file or download
    downloadFile(item)
  }
}

const downloadFile = async (item) => {
  try {
    const blob = await nasAPI.download(item.path)
    
    // Create download link
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = item.name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    
    store.dispatch('showSuccess', `Téléchargement de ${item.name} démarré`)
  } catch (err) {
    console.error('Error downloading file:', err)
    store.dispatch('showError', `Erreur lors du téléchargement: ${err.message}`)
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

const openPermissions = (item) => {
  selectedItemForPermissions.value = item
  showPermissionModal.value = true
  contextMenu.value.show = false
}

const onPermissionsUpdated = () => {
  // Refresh current directory
  loadDirectory(currentPath.value)
}

// Permission checks
const canModifyItem = (item) => {
  if (isAdmin.value) return true
  // TODO: Check user permissions for this item
  return true // Placeholder
}

const canModifyCurrentFolder = () => {
  if (isAdmin.value) return true
  // TODO: Check user permissions for current folder
  return true // Placeholder
}

// Copy/Cut/Paste operations
const copyItem = (item) => {
  clipboard.value = {
    items: [item],
    operation: 'copy'
  }
  store.dispatch('showSuccess', `${item.name} copié dans le presse-papiers`)
  contextMenu.value.show = false
}

const cutItem = (item) => {
  clipboard.value = {
    items: [item],
    operation: 'cut'
  }
  store.dispatch('showSuccess', `${item.name} coupé dans le presse-papiers`)
  contextMenu.value.show = false
}

const pasteItems = async () => {
  if (clipboard.value.items.length === 0) return
  
  try {
    for (const item of clipboard.value.items) {
      if (clipboard.value.operation === 'copy') {
        await copyItemToPath(item, currentPath.value)
      } else if (clipboard.value.operation === 'cut') {
        await moveItemToPath(item, currentPath.value)
      }
    }
    
    if (clipboard.value.operation === 'cut') {
      clipboard.value = { items: [], operation: null }
    }
    
    await loadDirectory(currentPath.value)
    store.dispatch('showSuccess', 'Éléments collés avec succès')
  } catch (err) {
    console.error('Error pasting items:', err)
    store.dispatch('showError', `Erreur lors du collage: ${err.message}`)
  }
  
  contextMenu.value.show = false
}

const copyItemToPath = async (item, targetPath) => {
  // TODO: Implement copy operation via API
  console.log('Copy item:', item.path, 'to:', targetPath)
}

const moveItemToPath = async (item, targetPath) => {
  // TODO: Implement move operation via API
  console.log('Move item:', item.path, 'to:', targetPath)
}

// Modal operations
const openRenameModal = (item) => {
  itemToRename.value = item
  showRenameModal.value = true
  contextMenu.value.show = false
}

const openMoveModal = (item) => {
  itemsToMove.value = [item]
  showMoveModal.value = true
  contextMenu.value.show = false
}

const confirmDelete = (item) => {
  itemsToDelete.value = [item]
  showDeleteModal.value = true
  contextMenu.value.show = false
}

const showProperties = (item) => {
  selectedItemForProperties.value = item
  showPropertiesModal.value = true
  contextMenu.value.show = false
}

// Modal event handlers
const onItemRenamed = () => {
  loadDirectory(currentPath.value)
  store.dispatch('showSuccess', 'Élément renommé avec succès')
}

const onItemsMoved = () => {
  loadDirectory(currentPath.value)
  store.dispatch('showSuccess', 'Éléments déplacés avec succès')
}

const onItemsDeleted = () => {
  loadDirectory(currentPath.value)
  store.dispatch('showSuccess', 'Éléments supprimés avec succès')
}

const toggleFavorite = () => {
  const currentFolder = {
    name: pathSegments.value[pathSegments.value.length - 1] || 'NAS Root',
    path: currentPath.value
  }

  if (isFavorite.value) {
    favorites.value = favorites.value.filter(fav => fav.path !== currentPath.value)
  } else {
    favorites.value.push(currentFolder)
  }

  // TODO: Save favorites to backend
  saveFavorites()
}

const toggleFavoriteItem = (item) => {
  if (isItemFavorite(item)) {
    favorites.value = favorites.value.filter(fav => fav.path !== item.path)
  } else {
    favorites.value.push({
      name: item.name,
      path: item.path
    })
  }
  
  saveFavorites()
  contextMenu.value.show = false
}

const isItemFavorite = (item) => {
  return favorites.value.some(fav => fav.path === item.path)
}

const saveFavorites = () => {
  // TODO: Save to backend
  localStorage.setItem('nas_favorites', JSON.stringify(favorites.value))
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

const onSearch = () => {
  // Search is handled by computed property
}

const clearSearch = () => {
  searchQuery.value = ''
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
  return new Date(date).toLocaleDateString('fr-FR')
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
    'jpg': '#7c3aed', // purple
    'jpeg': '#7c3aed',
    'png': '#7c3aed',
    'gif': '#7c3aed',
    'mp4': '#ea580c', // orange
    'avi': '#ea580c',
    'mp3': '#10b981', // emerald
    'wav': '#10b981',
    'zip': '#6b7280', // gray
    'rar': '#6b7280',
    'txt': '#374151', // gray-700
    'js': '#fbbf24', // amber
    'html': '#f97316', // orange
    'css': '#06b6d4' // cyan
  }
  return colorMap[ext] || '#6b7280'
}

// Lifecycle
onMounted(() => {
  loadFavorites()
  loadDirectory('/')
})
</script>

<style scoped>
/* Custom scrollbar for tree */
.overflow-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-auto::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}

.overflow-auto::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}
</style>