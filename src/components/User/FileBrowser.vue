<template>
  <section class="p-4 space-y-4">
    <header class="flex items-center justify-between">
      <div>
       <nav class="text-sm text-gray-500 mt-1">
          <span v-for="(b, i) in breadcrumbs" :key="b.path">
            <button class="underline" @click="goToBreadcrumb(i)">{{ b.name || '/' }}</button>
            <span v-if="i < breadcrumbs.length - 1"> / </span>
          </span>
        </nav>
      </div>

      <div class="flex items-center gap-2">
        <button class="btn" @click="toggleView">
          {{ view === 'grid' ? 'Liste' : 'Grille' }}
        </button>
        <button class="btn" @click="openNew(true)">Nouveau dossier</button>
        <button class="btn" @click="openNew(false)">Nouveau fichier (placeholder)</button>
        <FileUpload @uploaded="fetchFiles" />
      </div>
    </header>

    <div class="flex items-center gap-4">
      <input 
        v-model="filter" 
        placeholder="Rechercher..." 
        class="input w-60" 
        @input="debouncedFilter"
      />
      <label class="flex items-center gap-2 text-sm">
        <input type="checkbox" v-model="showFavoritesOnly" /> Favoris
      </label>
      <div class="flex items-center gap-2 text-sm">
        <span>{{ displayed.length }} éléments</span>
        <span v-if="selectedItems.size > 0" class="badge badge-primary">
          {{ selectedItems.size }} sélectionnés
        </span>
      </div>
    </div>

    <!-- Bulk Actions -->
    <div v-if="selectedItems.size > 0" class="flex items-center gap-2 p-3 bg-base-200 rounded-lg">
      <span class="text-sm font-medium">Actions groupées:</span>
      <button class="btn btn-sm btn-error" @click="bulkDelete">
        <i class="fas fa-trash mr-1"></i>
        Supprimer ({{ selectedItems.size }})
      </button>
      <button class="btn btn-sm btn-outline" @click="clearSelection">
        Désélectionner tout
      </button>
    </div>

    <div v-if="error" class="alert alert-error">{{ error }}</div>

    <!-- Loading State -->
    <SkeletonLoader 
      v-if="loading && items.length === 0" 
      :type="view === 'grid' ? 'grid' : 'file-list'"
      :count="8"
    />

    <!-- Grid view with Virtual Scrolling -->
    <div v-else-if="view === 'grid'" class="grid-container">
      <VirtualList
        :items="displayed"
        :item-height="120"
        :container-height="600"
        :has-more="hasMore"
        :loading="loadingMore"
        @load-more="loadMore"
      >
        <template #default="{ item }">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 p-2">
            <div 
              class="card p-3 bg-white rounded-lg border cursor-pointer transition-all hover:shadow-md"
              :class="{ 'ring-2 ring-primary': selectedItems.has(item.id) }"
              @click="toggleSelection(item)"
              @dblclick="openItem(item)"
            >
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <div class="flex items-center gap-2 mb-2">
                    <i 
                      :class="getItemIcon(item)" 
                      class="text-lg"
                      :style="{ color: getItemColor(item) }"
                    ></i>
                    <span class="text-sm text-gray-500">
                      {{ item.type === 'folder' ? 'Dossier' : 'Fichier' }}
                    </span>
                  </div>
                  <div class="font-medium truncate" :title="item.name">{{ item.name }}</div>
                  <div class="text-xs text-gray-400 mt-1">
                    {{ item.size ? human(item.size) : '' }}
                  </div>
                  <div class="text-xs text-gray-400">
                    {{ formatDate(item.updated_at || item.created_at) }}
                  </div>
                </div>
                <div class="flex flex-col gap-1 items-end">
                  <button 
                    class="text-sm hover:text-yellow-500 transition-colors" 
                    @click.stop="toggleFavorite(item)"
                  >
                    {{ isFavorite(item) ? '★' : '☆' }}
                  </button>
                  <div class="dropdown dropdown-end">
                    <button class="btn btn-xs btn-ghost" @click.stop>⋯</button>
                    <div class="dropdown-content card p-2 mt-2 shadow-lg z-10">
                      <button class="w-full text-left p-1 hover:bg-gray-100 rounded" @click="openRename(item)">
                        <i class="fas fa-edit mr-2"></i>Renommer
                      </button>
                      <button class="w-full text-left p-1 hover:bg-gray-100 rounded" @click="confirmDelete(item)">
                        <i class="fas fa-trash mr-2"></i>Supprimer
                      </button>
                      <button class="w-full text-left p-1 hover:bg-gray-100 rounded" @click="openShare(item)">
                        <i class="fas fa-share mr-2"></i>Partager
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </VirtualList>
    </div>

    <!-- List view with Virtual Scrolling -->
    <div v-else class="bg-white rounded-lg border overflow-hidden">
      <div class="grid grid-cols-7 gap-2 bg-gray-50 p-3 text-sm text-gray-500 font-medium">
        <div class="flex items-center">
          <input 
            type="checkbox" 
            :checked="allSelected" 
            @change="toggleSelectAll"
            class="mr-2"
          />
          Nom
        </div>
        <div>Type</div>
        <div>Taille</div>
        <div>Date</div>
        <div>Favori</div>
        <div>Propriétaire</div>
        <div class="text-right">Actions</div>
      </div>
      
      <VirtualList
        :items="displayed"
        :item-height="60"
        :container-height="500"
        :has-more="hasMore"
        :loading="loadingMore"
        @load-more="loadMore"
      >
        <template #default="{ item }">
          <div 
            class="grid grid-cols-7 gap-2 items-center p-3 border-t hover:bg-gray-50 transition-colors cursor-pointer"
            :class="{ 'bg-blue-50': selectedItems.has(item.id) }"
            @click="toggleSelection(item)"
            @dblclick="openItem(item)"
          >
            <div class="flex items-center">
              <input 
                type="checkbox" 
                :checked="selectedItems.has(item.id)"
                @change="toggleSelection(item)"
                @click.stop
                class="mr-3"
              />
              <i 
                :class="getItemIcon(item)" 
                class="mr-2"
                :style="{ color: getItemColor(item) }"
              ></i>
              <span class="truncate" :title="item.name">{{ item.name }}</span>
            </div>
            <div>
              <span class="badge badge-sm badge-outline">{{ item.type }}</span>
            </div>
            <div>{{ item.size ? human(item.size) : '—' }}</div>
            <div class="text-sm">{{ formatDate(item.updated_at || item.created_at) }}</div>
            <div>
              <button 
                @click.stop="toggleFavorite(item)"
                class="hover:text-yellow-500 transition-colors"
              >
                {{ isFavorite(item) ? '★' : '☆' }}
              </button>
            </div>
            <div class="text-sm">{{ item.owner_name || 'Vous' }}</div>
            <div class="text-right">
              <div class="flex gap-1 justify-end">
                <button 
                  class="btn btn-xs btn-ghost" 
                  @click.stop="openRename(item)"
                  :title="'Renommer ' + item.name"
                >
                  <i class="fas fa-edit"></i>
                </button>
                <button 
                  class="btn btn-xs btn-ghost text-error" 
                  @click.stop="confirmDelete(item)"
                  :title="'Supprimer ' + item.name"
                >
                  <i class="fas fa-trash"></i>
                </button>
                <button 
                  class="btn btn-xs btn-ghost" 
                  @click.stop="openShare(item)"
                  :title="'Partager ' + item.name"
                >
                  <i class="fas fa-share"></i>
                </button>
              </div>
            </div>
          </div>
        </template>
      </VirtualList>
    </div>

    <!-- New item modal -->
    <Modal
      :visible="newModalVisible"
      :title="newIsFolder ? 'Nouveau dossier' : 'Nouveau fichier (placeholder)'"
      show-confirm
      @close="newModalVisible = false"
      @confirm="createNew"
    >
      <input v-model="newName" placeholder="Nom" class="border p-2 w-full mb-2" />
      <div v-if="!newIsFolder" class="text-sm text-gray-500">Pour les fichiers, le téléversement est géré via l'upload existant.</div>
    </Modal>

    <!-- Rename modal -->
    <Modal
      :visible="renameModalVisible"
      title="Renommer"
      show-confirm
      @close="renameModalVisible = false"
      @confirm="renameConfirm"
    >
      <input v-model="renameValue" placeholder="Nouveau nom" class="border p-2 w-full" />
    </Modal>

    <!-- Confirm delete -->
    <Modal
      :visible="deleteModalVisible"
      title="Confirmer la suppression"
      show-confirm
      @close="deleteModalVisible = false"
      @confirm="deleteConfirm"
    >
      <p>Voulez-vous supprimer <strong>{{ toDelete?.name }}</strong> ?</p>
    </Modal>

    <!-- Share modal -->
    <Modal
      :visible="shareModalVisible"
      title="Partager"
      show-confirm
      @close="shareModalVisible = false"
      @confirm="shareConfirm"
    >
      <div class="mb-2">
        <label class="text-sm">Partager avec (utilisateur id ou email)</label>
        <input v-model="shareTarget" placeholder="ex : user@example.com ou 12" class="border p-2 w-full" />
      </div>
      <div class="mb-2">
        <label class="text-sm">Permissions</label>
        <select v-model="sharePermission" class="border p-2 w-full">
          <option value="read">Lecture</option>
          <option value="write">Lecture / écriture</option>
        </select>
      </div>
      <div class="text-xs text-gray-500">Note: l'API de partage doit exister côté backend (POST /files/share) — sinon adapte l'URL.</div>
    </Modal>
  </section>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import Modal from '@/components/Shared/Modal.vue'
import VirtualList from '@/components/Shared/VirtualList.vue'
import SkeletonLoader from '@/components/Shared/SkeletonLoader.vue'
import { userAPI } from '@/services/api'
import FileUpload from '../Shared/FileUpload.vue'
import api from '@/services/api'
// Removed non-existent imports

const { trackUserInteraction, trackComponentRender } = usePerformanceTracking()
const { handleAsyncError } = useErrorHandler()

const view = ref('grid') // 'grid' | 'list'
const currentPath = ref('/') // string path representation
const items = ref([]) // files + folders
const allItems = ref([]) // All loaded items for client-side filtering
const filter = ref('')
const showFavoritesOnly = ref(false)
const favorites = ref(new Set())
const error = ref('')
const loading = ref(false)
const loadingMore = ref(false)
const hasMore = ref(false)
const selectedItems = ref(new Set())
const currentPage = ref(1)
const itemsPerPage = ref(50)


// modals state
const newModalVisible = ref(false)
const newIsFolder = ref(true)
const newName = ref('')

const renameModalVisible = ref(false)
const renameValue = ref('')
const renameTarget = ref(null)

const deleteModalVisible = ref(false)
const toDelete = ref(null)

const shareModalVisible = ref(false)
const shareTarget = ref('')
const sharePermission = ref('read')
const shareTargetItem = ref(null)


// breadcrumbs
const breadcrumbs = computed(() => {
  const parts = currentPath.value === '/' ? [''] : currentPath.value.split('/').filter(Boolean)
  const acc = []
  let p = ''
  acc.push({ name: '/', path: '/' })
  for (const part of parts) {
    p = p === '/' ? `/${part}` : `${p}/${part}`
    acc.push({ name: part, path: p })
  }
  return acc
})

// Computed properties with performance optimizations
const displayed = computed(() => {
  const startTime = Date.now()
  
  let list = allItems.value.slice()
  
  // Apply filters
  if (filter.value) {
    const q = filter.value.toLowerCase()
    list = list.filter(i => (i.name || '').toLowerCase().includes(q))
  }
  
  if (showFavoritesOnly.value) {
    list = list.filter(i => favorites.value.has(i.id))
  }
  
  // Sort: folders first, then by name
  list.sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === 'folder' ? -1 : 1
    }
    return (a.name || '').localeCompare(b.name || '')
  })
  
  trackComponentRender('FileBrowser.displayed', startTime, {
    itemCount: list.length,
    hasFilter: !!filter.value,
    showFavoritesOnly: showFavoritesOnly.value
  })
  
  return list
})

const allSelected = computed(() => {
  return displayed.value.length > 0 && displayed.value.every(item => selectedItems.value.has(item.id))
})

// Debounced filter function
const debouncedFilter = debounce(() => {
  trackUserInteraction('filter_files', Date.now(), {
    filterLength: filter.value.length,
    resultCount: displayed.value.length
  })
}, 300)

function toggleView() {
  const startTime = Date.now()
  view.value = view.value === 'grid' ? 'list' : 'grid'
  trackUserInteraction('toggle_view', startTime, { newView: view.value })
}

// Selection methods
function toggleSelection(item) {
  if (selectedItems.value.has(item.id)) {
    selectedItems.value.delete(item.id)
  } else {
    selectedItems.value.add(item.id)
  }
  trackUserInteraction('toggle_selection', Date.now(), {
    itemId: item.id,
    selected: selectedItems.value.has(item.id),
    totalSelected: selectedItems.value.size
  })
}

function toggleSelectAll() {
  if (allSelected.value) {
    clearSelection()
  } else {
    displayed.value.forEach(item => selectedItems.value.add(item.id))
  }
  trackUserInteraction('toggle_select_all', Date.now(), {
    totalSelected: selectedItems.value.size
  })
}

function clearSelection() {
  selectedItems.value.clear()
}

// Bulk operations
async function bulkDelete() {
  if (selectedItems.value.size === 0) return
  
  const confirmed = confirm(`Êtes-vous sûr de vouloir supprimer ${selectedItems.value.size} éléments ?`)
  if (!confirmed) return
  
  const startTime = Date.now()
  loading.value = true
  
  try {
    const deletePromises = Array.from(selectedItems.value).map(async (itemId) => {
      const item = allItems.value.find(i => i.id === itemId)
      if (!item) return
      
      if (item.type === 'folder') {
        return userAPI.deleteFolder(item.id)
      } else {
        return userAPI.deleteFile(item.id)
      }
    })
    
    await Promise.all(deletePromises)
    
    // Remove deleted items from local state
    allItems.value = allItems.value.filter(item => !selectedItems.value.has(item.id))
    clearSelection()
    
    trackUserInteraction('bulk_delete', startTime, {
      itemCount: deletePromises.length,
      success: true
    })
    
    // Show success message
    alert(`${deletePromises.length} éléments supprimés avec succès`)
    
  } catch (error) {
    handleAsyncError(() => Promise.reject(error), {
      operation: 'bulk_delete',
      itemCount: selectedItems.value.size
    })
  } finally {
    loading.value = false
  }
}

// Performance optimized item icon and color
function getItemIcon(item) {
  if (item.type === 'folder') {
    return 'fas fa-folder'
  }
  
  const extension = item.name?.split('.').pop()?.toLowerCase()
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
    'mp4': 'fas fa-file-video',
    'avi': 'fas fa-file-video',
    'mov': 'fas fa-file-video',
    'mp3': 'fas fa-file-audio',
    'wav': 'fas fa-file-audio',
    'zip': 'fas fa-file-archive',
    'rar': 'fas fa-file-archive',
    'txt': 'fas fa-file-alt',
    'js': 'fas fa-file-code',
    'html': 'fas fa-file-code',
    'css': 'fas fa-file-code',
    'py': 'fas fa-file-code'
  }
  
  return iconMap[extension] || 'fas fa-file'
}

function getItemColor(item) {
  if (item.type === 'folder') {
    return '#3b82f6' // blue
  }
  
  const extension = item.name?.split('.').pop()?.toLowerCase()
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
    'mp4': '#dc2626', // red
    'avi': '#dc2626',
    'mov': '#dc2626',
    'mp3': '#059669', // green
    'wav': '#059669',
    'zip': '#6b7280', // gray
    'rar': '#6b7280',
    'txt': '#374151', // dark gray
    'js': '#f59e0b', // yellow
    'html': '#f59e0b',
    'css': '#f59e0b',
    'py': '#059669' // green
  }
  
  return colorMap[extension] || '#6b7280'
}

// Load more items for infinite scrolling
async function loadMore() {
  if (loadingMore.value || !hasMore.value) return
  
  loadingMore.value = true
  currentPage.value++
  
  try {
    await handleAsyncError(async () => {
      const folderResponse = await userAPI.getFolders(currentPath.value === '/' ? null : currentPath.value, {
        page: currentPage.value,
        per_page: itemsPerPage.value
      })
      
      const fileResponse = await userAPI.getFiles(currentPath.value === '/' ? null : currentPath.value, {
        page: currentPage.value,
        per_page: itemsPerPage.value
      })
      
      const newFolders = (folderResponse.data || []).map(f => ({ ...f, type: 'folder' }))
      const newFiles = (fileResponse.data || []).map(f => ({ ...f, type: 'file' }))
      const newItems = [...newFolders, ...newFiles]
      
      if (newItems.length < itemsPerPage.value) {
        hasMore.value = false
      }
      
      allItems.value.push(...newItems)
    }, {
      operation: 'load_more_items',
      page: currentPage.value
    })
  } finally {
    loadingMore.value = false
  }
}

function human(v) {
  if (v === 0) return '0 B'
  if (!v) return '—'
  const i = Math.floor(Math.log(v) / Math.log(1024))
  const sizes = ['B','KB','MB','GB','TB']
  return `${(v / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`
}

function formatDate(v) {
  if (!v) return '—'
  return new Date(v).toLocaleString()
}

function applyFilter() {
  // computed displayed handles filter
}

function isFavorite(item) {
  return favorites.value.has(item.id)
}
function toggleFavorite(item) {
  if (favorites.value.has(item.id)) favorites.value.delete(item.id)
  else favorites.value.add(item.id)
  // optionally persist to server/localStorage
  localStorage.setItem('favorites', JSON.stringify(Array.from(favorites.value)))
}

function openNew(isFolder) {
  newIsFolder.value = isFolder
  newName.value = ''
  newModalVisible.value = true
}

function openRename(item) {
  renameTarget.value = item
  renameValue.value = item.name
  renameModalVisible.value = true
}

async function renameConfirm() {
  if (!renameTarget.value) return
  try {
    // try using userAPI.updateFolder or generic endpoint
    if (renameTarget.value.type === 'folder') {
      await userAPI.updateFolder(renameTarget.value.id, renameValue.value)
    } else {
      // generic file rename - assuming there's an endpoint; fallback to api.put
      await api.put(`/files/files/${renameTarget.value.id}`, { name: renameValue.value })
    }
    renameModalVisible.value = false
    await load()
  } catch (e) {
    alert(e?.response?.data?.message || e?.message || 'Erreur renommage')
  }
}

function confirmDelete(item) {
  toDelete.value = item
  deleteModalVisible.value = true
}

async function deleteConfirm() {
  if (!toDelete.value) return
  try {
    if (toDelete.value.type === 'folder') {
      await userAPI.deleteFolder(toDelete.value.id)
    } else {
      await userAPI.deleteFile(toDelete.value.id)
    }
    deleteModalVisible.value = false
    await load()
  } catch (e) {
    alert(e?.response?.data?.message || e?.message || 'Erreur suppression')
  }
}

function openShare(item) {
  shareTargetItem.value = item
  shareTarget.value = ''
  sharePermission.value = 'read'
  shareModalVisible.value = true
}

async function shareConfirm() {
  if (!shareTargetItem.value) return
  try {
    // best-effort: POST /files/share
    await api.post('/files/share', {
      item_id: shareTargetItem.value.id,
      item_type: shareTargetItem.value.type,
      target: shareTarget,
      permission: sharePermission,
    })
    shareModalVisible.value = false
    alert('Partage demandé (vérifie l\'API backend si nécessaire)')
  } catch (e) {
    alert(e?.response?.data?.message || e?.message || 'Erreur partage')
  }
}

async function createNew() {
  if (!newName.value) return alert('Donne un nom')
  try {
    if (newIsFolder.value) {
      // create folder under current path
      await userAPI.createFolder(newName.value, currentPath.value === '/' ? null : currentPath.value)
    } else {
      // placeholder: real upload should use file.upload endpoint
      await api.post('/files/upload', {
        name: newName.value,
        folder_path: currentPath.value,
      })
    }
    newModalVisible.value = false
    await load()
  } catch (e) {
    alert(e?.response?.data?.message || e?.message || 'Erreur création')
  }
}

function goToBreadcrumb(index) {
  const b = breadcrumbs.value[index]
  if (b) {
    currentPath.value = b.path
    load()
  }
}

async function openItem(item) {
  if (item.type === 'folder') {
    // assume folder path in item.path
    currentPath.value = item.path || (currentPath.value === '/' ? `/${item.name}` : `${currentPath.value}/${item.name}`)
    await load()
  } else {
    // open file (download or preview)
    window.open(`/files/${item.id}/download`, '_blank')
  }
}

async function load() {
  const startTime = Date.now()
  loading.value = true
  error.value = ''
  currentPage.value = 1
  hasMore.value = true
  
  try {
    await handleAsyncError(async () => {
      // Load initial batch with pagination
      const [folderResponse, fileResponse] = await Promise.all([
        userAPI.getFolders(currentPath.value === '/' ? null : currentPath.value, {
          page: 1,
          per_page: itemsPerPage.value
        }),
        userAPI.getFiles(currentPath.value === '/' ? null : currentPath.value, {
          page: 1,
          per_page: itemsPerPage.value
        })
      ])
      
      const folders = (folderResponse.data || []).map(f => ({ ...f, type: 'folder' }))
      const files = (fileResponse.data || []).map(f => ({ ...f, type: 'file' }))
      const newItems = [...folders, ...files]
      
      // Check if there are more items to load
      if (newItems.length < itemsPerPage.value) {
        hasMore.value = false
      }
      
      allItems.value = newItems
      
      // Load favorites from localStorage with error handling
      try {
        const favoritesData = localStorage.getItem('favorites')
        const fav = favoritesData ? JSON.parse(favoritesData) : []
        favorites.value = new Set(Array.isArray(fav) ? fav : [])
      } catch (favError) {
        console.warn('Failed to load favorites from localStorage:', favError)
        favorites.value = new Set()
      }
      
      // Clear selection when navigating
      clearSelection()
      
      trackUserInteraction('load_directory', startTime, {
        path: currentPath.value,
        itemCount: newItems.length,
        folderCount: folders.length,
        fileCount: files.length
      })
      
    }, {
      operation: 'load_directory',
      path: currentPath.value,
      retryFunction: () => load()
    })
    
  } catch (e) {
    error.value = e?.response?.data?.message || e?.message || 'Erreur lors du chargement'
  } finally {
    loading.value = false
  }
}

// Optimized fetchFiles function for file upload callback
async function fetchFiles() {
  await load()
}

onMounted(load)
</script>

<style scoped>
.input { @apply border rounded px-3 py-2; }
.btn { @apply px-3 py-2 rounded border bg-white hover:bg-gray-50; }
.btn-sm { @apply px-2 py-1 rounded border text-sm; }
.card { @apply rounded-lg shadow-sm; }
.alert-error { @apply bg-red-50 border border-red-200 text-red-700 p-2 rounded; }

/* simple dropdown (for illustration) */
.dropdown { position: relative; }
.dropdown-content { position: absolute; right: 0; display: flex; flex-direction: column; gap: 4px; z-index: 30; background: white; border: 1px solid #e5e7eb; border-radius: 6px; padding: 6px; min-width: 160px; }
</style>
