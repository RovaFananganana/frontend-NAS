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
        <TreeView 
          :selected-path="currentPath"
          @folder-selected="navigateToPath"
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
        v-if="contextMenu.item && canDeleteItem(contextMenu.item)"
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
import { usePermissions } from '@/composables/usePermissions.js'
import TreeView from './TreeView.vue'
import ContextMenu from './ContextMenu.vue'
import PermissionModal from './PermissionModal.vue'
import RenameModal from './RenameModal.vue'
import MoveModal from './MoveModal.vue'
import DeleteConfirmModal from './DeleteConfirmModal.vue'
import PropertiesModal from './PropertiesModal.vue'

import { nasAPI, NASAPIError } from '@/services/nasAPI.js'

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
      throw new NASAPIError(data.error || 'Failed to load directory')
    }
  } catch (err) {
    console.error('Error loading directory:', err)
    if (err instanceof NASAPIError) {
      error.value = err.message
      if (err.status === 403) {
        store.dispatch('showError', 'Accès refusé à ce répertoire')
      } else if (err.status === 404) {
        store.dispatch('showError', 'Répertoire introuvable')
      }
    } else {
      error.value = 'Erreur lors du chargement du répertoire'
    }
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
    store.dispatch('showInfo', `Téléchargement de ${item.name} en cours...`)
    
    const blob = await nasAPI.downloadFile(item.path)
    
    // Create download link
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = item.name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    
    store.dispatch('showSuccess', `Téléchargement de ${item.name} terminé`)
  } catch (err) {
    console.error('Error downloading file:', err)
    if (err instanceof NASAPIError) {
      if (err.status === 403) {
        store.dispatch('showError', 'Permission refusée pour télécharger ce fichier')
      } else if (err.status === 404) {
        store.dispatch('showError', 'Fichier introuvable')
      } else {
        store.dispatch('showError', `Erreur de téléchargement: ${err.message}`)
      }
    } else {
      store.dispatch('showError', `Erreur lors du téléchargement: ${err.message}`)
    }
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

// Permission system
const { 
  isAdmin: isUserAdmin, 
  canPerformAction, 
  getPermissionErrorMessage, 
  loadPermissions 
} = usePermissions()

// Permission state
const contextMenuPermissions = ref({
  can_read: false,
  can_write: false,
  can_delete: false,
  can_share: false,
  can_modify: false
})

// Load permissions for context menu item
const loadContextMenuPermissions = async (item) => {
  if (!item) {
    contextMenuPermissions.value = {
      can_read: false,
      can_write: false,
      can_delete: false,
      can_share: false,
      can_modify: false
    }
    return
  }

  try {
    const permissions = await loadPermissions(item.path)
    contextMenuPermissions.value = permissions || {
      can_read: false,
      can_write: false,
      can_delete: false,
      can_share: false,
      can_modify: false
    }
  } catch (error) {
    console.error('Error loading context menu permissions:', error)
    contextMenuPermissions.value = {
      can_read: false,
      can_write: false,
      can_delete: false,
      can_share: false,
      can_modify: false
    }
  }
}

// Legacy permission functions for backward compatibility
const canModifyItem = async (item) => {
  if (!item) return false
  return await canPerformAction(item.path, 'write')
}

const canDeleteItem = async (item) => {
  if (!item) return false
  return await canPerformAction(item.path, 'delete')
}

const canModifyCurrentFolder = async () => {
  return await canPerformAction(currentPath.value, 'write')
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
  try {
    const result = await nasAPI.copyItem(item.path, targetPath)
    if (result.success) {
      store.dispatch('showSuccess', `${item.name} copié avec succès`)
    } else {
      throw new Error(result.error || 'Copy failed')
    }
  } catch (error) {
    console.error('Copy error:', error)
    store.dispatch('showError', `Erreur lors de la copie: ${error.message}`)
    throw error
  }
}

const moveItemToPath = async (item, targetPath) => {
  try {
    const result = await nasAPI.moveItem(item.path, targetPath)
    if (result.success) {
      store.dispatch('showSuccess', `${item.name} déplacé avec succès`)
    } else {
      throw new Error(result.error || 'Move failed')
    }
  } catch (error) {
    console.error('Move error:', error)
    store.dispatch('showError', `Erreur lors du déplacement: ${error.message}`)
    throw error
  }
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
const onItemRenamed = async (renameData) => {
  try {
    // renameData is an object: {oldPath, newPath, newName}
    console.log('Rename data received:', renameData)
    
    // The rename has already been completed by the modal, just refresh the view
    await loadDirectory(currentPath.value)
    store.dispatch('showSuccess', `Élément renommé avec succès: ${renameData.newName}`)
  } catch (error) {
    console.error('Rename error:', error)
    store.dispatch('showError', `Erreur lors du renommage: ${error.message}`)
  }
}

const onItemsMoved = () => {
  loadDirectory(currentPath.value)
  store.dispatch('showSuccess', 'Éléments déplacés avec succès')
}

const onItemsDeleted = async (items) => {
  try {
    for (const item of items) {
      const result = await nasAPI.deleteItem(item.path)
      if (!result.success) {
        throw new Error(result.error || `Failed to delete ${item.name}`)
      }
    }
    
    await loadDirectory(currentPath.value)
    store.dispatch('showSuccess', `${items.length} élément(s) supprimé(s) avec succès`)
  } catch (error) {
    console.error('Delete error:', error)
    store.dispatch('showError', `Erreur lors de la suppression: ${error.message}`)
  }
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
  return nasAPI.formatFileSize(bytes)
}

const formatDate = (date) => {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('fr-FR')
}

const getItemIcon = (item) => {
  return nasAPI.getFileIcon(item.name, item.is_directory)
}

const getItemColor = (item) => {
  return nasAPI.getFileColor(item.name, item.is_directory)
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