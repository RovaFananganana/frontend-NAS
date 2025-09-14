<template>
  <section class="p-4 space-y-4">
    <!-- Header with breadcrumbs and actions -->
    <header class="flex items-center justify-between">
      <div class="flex-1">
        <nav class="text-sm text-gray-500 mt-1 flex items-center">
          <span v-for="(b, i) in breadcrumbs" :key="b.path" class="flex items-center">
            <button 
              class="underline hover:text-gray-700 transition-colors" 
              @click="goToBreadcrumb(i)"
            >
              {{ b.name || '/' }}
            </button>
            <i v-if="i < breadcrumbs.length - 1" class="fas fa-chevron-right mx-2 text-xs"></i>
          </span>
        </nav>
      </div>

      <div class="flex items-center gap-2">
        <!-- View toggle -->
        <div class="btn-group">
          <button 
            class="btn btn-sm"
            :class="{ 'btn-active': view === 'grid' }"
            @click="view = 'grid'"
          >
            <i class="fas fa-th"></i>
          </button>
          <button 
            class="btn btn-sm"
            :class="{ 'btn-active': view === 'list' }"
            @click="view = 'list'"
          >
            <i class="fas fa-list"></i>
          </button>
        </div>

        <!-- Actions -->
        <button class="btn btn-sm btn-primary" @click="openNew(true)">
          <i class="fas fa-folder-plus mr-2"></i>
          New Folder
        </button>
        <FileUpload @uploaded="handleFileUploaded" />
      </div>
    </header>

    <!-- Filters and search -->
    <div class="flex items-center gap-4 flex-wrap">
      <div class="flex-1 min-w-64">
        <div class="relative">
          <input 
            v-model="filter" 
            placeholder="Search files and folders..." 
            class="input input-bordered w-full pl-10" 
            @input="applyFilter"
          />
          <i class="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
        </div>
      </div>
      
      <div class="flex items-center gap-4">
        <!-- Filters -->
        <label class="flex items-center gap-2 text-sm">
          <input type="checkbox" v-model="showFavoritesOnly" class="checkbox checkbox-sm" /> 
          Favorites only
        </label>
        
        <select v-model="sortBy" class="select select-bordered select-sm">
          <option value="name">Sort by Name</option>
          <option value="date">Sort by Date</option>
          <option value="size">Sort by Size</option>
          <option value="type">Sort by Type</option>
        </select>

        <button 
          class="btn btn-sm btn-outline"
          @click="sortOrder = sortOrder === 'asc' ? 'desc' : 'asc'"
        >
          <i class="fas" :class="sortOrder === 'asc' ? 'fa-sort-up' : 'fa-sort-down'"></i>
        </button>
      </div>
    </div>

    <!-- Bulk actions bar -->
    <div v-if="selectedItems.size > 0" class="alert alert-info">
      <div class="flex items-center justify-between w-full">
        <span>
          <i class="fas fa-check-circle mr-2"></i>
          {{ selectedItems.size }} item(s) selected
        </span>
        <div class="flex gap-2">
          <button class="btn btn-sm btn-error" @click="bulkDelete">
            <i class="fas fa-trash mr-2"></i>
            Delete Selected
          </button>
          <button class="btn btn-sm btn-warning" @click="bulkMove">
            <i class="fas fa-arrows-alt mr-2"></i>
            Move Selected
          </button>
          <button class="btn btn-sm btn-outline" @click="clearSelection">
            <i class="fas fa-times mr-2"></i>
            Clear Selection
          </button>
        </div>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="space-y-4">
      <div v-for="i in 6" :key="i" class="skeleton h-16 w-full"></div>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="alert alert-error">
      <i class="fas fa-exclamation-triangle"></i>
      <span>{{ error }}</span>
      <button class="btn btn-sm btn-outline" @click="load">
        <i class="fas fa-refresh mr-2"></i>
        Retry
      </button>
    </div>

    <!-- Empty state -->
    <div v-else-if="displayed.length === 0" class="text-center py-12">
      <i class="fas fa-folder-open text-6xl text-gray-300 mb-4"></i>
      <h3 class="text-lg font-semibold text-gray-600 mb-2">No files or folders</h3>
      <p class="text-gray-500 mb-4">
        {{ filter ? 'No items match your search criteria' : 'This folder is empty' }}
      </p>
      <button v-if="!filter" class="btn btn-primary" @click="openNew(true)">
        <i class="fas fa-plus mr-2"></i>
        Create your first folder
      </button>
    </div>

    <!-- Grid view -->
    <div v-else-if="view === 'grid'" class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      <div 
        v-for="item in paginatedItems" 
        :key="item.id" 
        class="card bg-base-100 shadow hover:shadow-lg transition-shadow cursor-pointer"
        :class="{ 'ring-2 ring-primary': selectedItems.has(item.id) }"
        @click="handleItemClick(item, $event)"
        @dblclick="openItem(item)"
      >
        <div class="card-body p-4">
          <!-- Selection checkbox -->
          <div class="absolute top-2 left-2">
            <input 
              type="checkbox" 
              class="checkbox checkbox-sm"
              :checked="selectedItems.has(item.id)"
              @click.stop="toggleSelection(item.id)"
            />
          </div>

          <!-- Favorite button -->
          <div class="absolute top-2 right-2">
            <button 
              class="btn btn-ghost btn-xs"
              @click.stop="toggleFavorite(item)"
            >
              <i class="fas fa-star" :class="isFavorite(item) ? 'text-yellow-400' : 'text-gray-300'"></i>
            </button>
          </div>

          <!-- Item icon and info -->
          <div class="text-center mt-4">
            <div class="text-3xl mb-2">
              <i class="fas" :class="getItemIcon(item)"></i>
            </div>
            <div class="font-medium text-sm truncate" :title="item.name">
              {{ item.name }}
            </div>
            <div class="text-xs text-gray-500 mt-1">
              {{ item.type === 'folder' ? 'Folder' : formatFileSize(item.size) }}
            </div>
            <div class="text-xs text-gray-400">
              {{ formatDate(item.updated_at || item.created_at) }}
            </div>
          </div>

          <!-- Actions dropdown -->
          <div class="dropdown dropdown-end absolute bottom-2 right-2">
            <button 
              tabindex="0" 
              class="btn btn-ghost btn-xs"
              @click.stop
            >
              <i class="fas fa-ellipsis-v"></i>
            </button>
            <ul tabindex="0" class="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52 z-10">
              <li><a @click="openRename(item)"><i class="fas fa-edit mr-2"></i>Rename</a></li>
              <li><a @click="downloadItem(item)"><i class="fas fa-download mr-2"></i>Download</a></li>
              <li><a @click="shareItem(item)"><i class="fas fa-share mr-2"></i>Share</a></li>
              <li><hr class="my-1"></li>
              <li><a @click="confirmDelete(item)" class="text-error"><i class="fas fa-trash mr-2"></i>Delete</a></li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- List view with virtual scrolling -->
    <div v-else class="bg-base-100 rounded-lg border overflow-hidden">
      <!-- Header -->
      <div class="grid grid-cols-12 gap-2 bg-base-200 p-3 text-sm font-medium text-base-content border-b">
        <div class="col-span-1">
          <input 
            type="checkbox" 
            class="checkbox checkbox-sm"
            :checked="allSelected"
            :indeterminate="someSelected"
            @change="toggleSelectAll"
          />
        </div>
        <div class="col-span-5">Name</div>
        <div class="col-span-2">Type</div>
        <div class="col-span-2">Size</div>
        <div class="col-span-1">Date</div>
        <div class="col-span-1 text-right">Actions</div>
      </div>

      <!-- Virtual scrolled content -->
      <div 
        ref="listContainer"
        class="overflow-auto"
        style="height: 400px;"
        @scroll="handleScroll"
      >
        <div :style="{ height: `${totalHeight}px`, position: 'relative' }">
          <div 
            v-for="(item, index) in visibleItems" 
            :key="item.id"
            class="grid grid-cols-12 gap-2 items-center p-3 border-b hover:bg-gray-50 transition-colors"
            :class="{ 'bg-primary bg-opacity-10': selectedItems.has(item.id) }"
            :style="{ 
              position: 'absolute', 
              top: `${(startIndex + index) * itemHeight}px`,
              width: '100%',
              height: `${itemHeight}px`
            }"
            @click="handleItemClick(item, $event)"
            @dblclick="openItem(item)"
          >
            <div class="col-span-1">
              <input 
                type="checkbox" 
                class="checkbox checkbox-sm"
                :checked="selectedItems.has(item.id)"
                @click.stop="toggleSelection(item.id)"
              />
            </div>
            <div class="col-span-5 flex items-center">
              <i class="fas mr-3" :class="getItemIcon(item)"></i>
              <span class="truncate" :title="item.name">{{ item.name }}</span>
              <button 
                class="btn btn-ghost btn-xs ml-2"
                @click.stop="toggleFavorite(item)"
              >
                <i class="fas fa-star" :class="isFavorite(item) ? 'text-yellow-400' : 'text-gray-300'"></i>
              </button>
            </div>
            <div class="col-span-2 text-sm opacity-70">
              {{ item.type === 'folder' ? 'Folder' : getFileType(item.name) }}
            </div>
            <div class="col-span-2 text-sm opacity-70">
              {{ item.type === 'folder' ? '—' : formatFileSize(item.size) }}
            </div>
            <div class="col-span-1 text-sm opacity-70">
              {{ formatDate(item.updated_at || item.created_at) }}
            </div>
            <div class="col-span-1 text-right">
              <div class="dropdown dropdown-end">
                <button 
                  tabindex="0" 
                  class="btn btn-ghost btn-xs"
                  @click.stop
                >
                  <i class="fas fa-ellipsis-v"></i>
                </button>
                <ul tabindex="0" class="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52 z-10">
                  <li><a @click="openRename(item)"><i class="fas fa-edit mr-2"></i>Rename</a></li>
                  <li><a @click="downloadItem(item)"><i class="fas fa-download mr-2"></i>Download</a></li>
                  <li><a @click="shareItem(item)"><i class="fas fa-share mr-2"></i>Share</a></li>
                  <li><hr class="my-1"></li>
                  <li><a @click="confirmDelete(item)" class="text-error"><i class="fas fa-trash mr-2"></i>Delete</a></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Pagination for grid view -->
    <div v-if="view === 'grid' && totalPages > 1" class="flex justify-center">
      <div class="btn-group">
        <button 
          class="btn btn-sm"
          :disabled="currentPage === 1"
          @click="currentPage = 1"
        >
          <i class="fas fa-angle-double-left"></i>
        </button>
        <button 
          class="btn btn-sm"
          :disabled="currentPage === 1"
          @click="currentPage--"
        >
          <i class="fas fa-angle-left"></i>
        </button>
        <span class="btn btn-sm btn-disabled">
          {{ currentPage }} / {{ totalPages }}
        </span>
        <button 
          class="btn btn-sm"
          :disabled="currentPage === totalPages"
          @click="currentPage++"
        >
          <i class="fas fa-angle-right"></i>
        </button>
        <button 
          class="btn btn-sm"
          :disabled="currentPage === totalPages"
          @click="currentPage = totalPages"
        >
          <i class="fas fa-angle-double-right"></i>
        </button>
      </div>
    </div>

    <!-- Modals -->
    <NewItemModal 
      v-model:visible="newModalVisible"
      :is-folder="newIsFolder"
      :current-path="currentPath"
      @created="handleItemCreated"
    />

    <RenameModal
      v-model:visible="renameModalVisible"
      :item="renameTarget"
      @renamed="handleItemRenamed"
    />

    <DeleteConfirmModal
      v-model:visible="deleteModalVisible"
      :items="itemsToDelete"
      @deleted="handleItemsDeleted"
    />

    <ShareModal
      v-model:visible="shareModalVisible"
      :item="shareTargetItem"
      @shared="handleItemShared"
    />

    <MoveModal
      v-model:visible="moveModalVisible"
      :items="Array.from(selectedItems)"
      @moved="handleItemsMoved"
    />
  </section>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useStore } from 'vuex'
import { userAPI } from '@/services/api'
import { createCachedApiCall, PerformanceMonitor } from '@/services/performance'
import FileUpload from '../Shared/FileUpload.vue'
import NewItemModal from '../Shared/NewItemModal.vue'
import RenameModal from '../Shared/RenameModal.vue'
import DeleteConfirmModal from '../Shared/DeleteConfirmModal.vue'
import ShareModal from '../Shared/ShareModal.vue'
import MoveModal from '../Shared/MoveModal.vue'

const store = useStore()

// Reactive data
const view = ref('grid')
const currentPath = ref('/')
const items = ref([])
const filter = ref('')
const showFavoritesOnly = ref(false)
const sortBy = ref('name')
const sortOrder = ref('asc')
const favorites = ref(new Set())
const selectedItems = ref(new Set())
const error = ref('')
const loading = ref(false)

// Pagination
const currentPage = ref(1)
const itemsPerPage = ref(24)

// Virtual scrolling
const listContainer = ref(null)
const itemHeight = 60
const visibleCount = ref(10)
const startIndex = ref(0)

// Modal states
const newModalVisible = ref(false)
const newIsFolder = ref(true)
const renameModalVisible = ref(false)
const renameTarget = ref(null)
const deleteModalVisible = ref(false)
const itemsToDelete = ref([])
const shareModalVisible = ref(false)
const shareTargetItem = ref(null)
const moveModalVisible = ref(false)

// Cached API calls
const cachedGetFolders = createCachedApiCall(
  userAPI.getFolders,
  (parentId) => `folders-${parentId || 'root'}`
)

const cachedGetFiles = createCachedApiCall(
  userAPI.getFiles,
  (folderId) => `files-${folderId || 'root'}`
)

// Computed properties
const breadcrumbs = computed(() => {
  const parts = currentPath.value === '/' ? [''] : currentPath.value.split('/').filter(Boolean)
  const acc = []
  let p = ''
  acc.push({ name: 'Home', path: '/' })
  for (const part of parts) {
    p = p === '/' ? `/${part}` : `${p}/${part}`
    acc.push({ name: part, path: p })
  }
  return acc
})

const filteredAndSorted = computed(() => {
  let list = items.value.slice()
  
  // Apply filters
  if (filter.value) {
    const q = filter.value.toLowerCase()
    list = list.filter(i => (i.name || '').toLowerCase().includes(q))
  }
  
  if (showFavoritesOnly.value) {
    list = list.filter(i => favorites.value.has(i.id))
  }
  
  // Apply sorting
  list.sort((a, b) => {
    let aVal, bVal
    
    switch (sortBy.value) {
      case 'name':
        aVal = a.name?.toLowerCase() || ''
        bVal = b.name?.toLowerCase() || ''
        break
      case 'date':
        aVal = new Date(a.updated_at || a.created_at || 0)
        bVal = new Date(b.updated_at || b.created_at || 0)
        break
      case 'size':
        aVal = a.size || 0
        bVal = b.size || 0
        break
      case 'type':
        aVal = a.type || ''
        bVal = b.type || ''
        break
      default:
        return 0
    }
    
    let result = 0
    if (aVal < bVal) result = -1
    else if (aVal > bVal) result = 1
    
    return sortOrder.value === 'desc' ? -result : result
  })
  
  return list
})

const displayed = computed(() => filteredAndSorted.value)

const totalPages = computed(() => {
  return Math.ceil(displayed.value.length / itemsPerPage.value)
})

const paginatedItems = computed(() => {
  if (view.value === 'list') return displayed.value
  
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return displayed.value.slice(start, end)
})

// Virtual scrolling computed properties
const totalHeight = computed(() => displayed.value.length * itemHeight)

const visibleItems = computed(() => {
  const end = Math.min(startIndex.value + visibleCount.value, displayed.value.length)
  return displayed.value.slice(startIndex.value, end)
})

// Selection computed properties
const allSelected = computed(() => {
  return displayed.value.length > 0 && displayed.value.every(item => selectedItems.value.has(item.id))
})

const someSelected = computed(() => {
  return displayed.value.some(item => selectedItems.value.has(item.id)) && !allSelected.value
})

// Methods
const load = async () => {
  const monitor = PerformanceMonitor.start('FileBrowser.load')
  
  loading.value = true
  error.value = ''
  
  try {
    const [foldersResponse, filesResponse] = await Promise.all([
      cachedGetFolders(currentPath.value === '/' ? null : currentPath.value),
      cachedGetFiles(currentPath.value === '/' ? null : currentPath.value)
    ])
    
    const folders = (foldersResponse.data || []).map(f => ({ ...f, type: 'folder' }))
    const files = (filesResponse.data || []).map(f => ({ ...f, type: 'file' }))
    
    items.value = [...folders, ...files]
    
    // Load favorites from localStorage
    const savedFavorites = JSON.parse(localStorage.getItem('favorites') || '[]')
    favorites.value = new Set(savedFavorites)
    
    // Clear selection when navigating
    selectedItems.value.clear()
    
  } catch (err) {
    console.error('Error loading files:', err)
    error.value = err?.response?.data?.message || err?.message || 'Failed to load files'
    store.dispatch('showError', error.value)
  } finally {
    loading.value = false
    monitor.end()
  }
}

const handleScroll = () => {
  if (!listContainer.value) return
  
  const scrollTop = listContainer.value.scrollTop
  const containerHeight = listContainer.value.clientHeight
  
  startIndex.value = Math.floor(scrollTop / itemHeight)
  visibleCount.value = Math.ceil(containerHeight / itemHeight) + 2 // Buffer
}

const goToBreadcrumb = (index) => {
  const breadcrumb = breadcrumbs.value[index]
  if (breadcrumb) {
    currentPath.value = breadcrumb.path
    load()
  }
}

const openItem = async (item) => {
  if (item.type === 'folder') {
    currentPath.value = item.path || (currentPath.value === '/' ? `/${item.name}` : `${currentPath.value}/${item.name}`)
    await load()
  } else {
    downloadItem(item)
  }
}

const handleItemClick = (item, event) => {
  if (event.ctrlKey || event.metaKey) {
    toggleSelection(item.id)
  } else if (event.shiftKey && selectedItems.value.size > 0) {
    // Shift+click for range selection
    const lastSelected = Array.from(selectedItems.value).pop()
    const lastIndex = displayed.value.findIndex(i => i.id === lastSelected)
    const currentIndex = displayed.value.findIndex(i => i.id === item.id)
    
    const start = Math.min(lastIndex, currentIndex)
    const end = Math.max(lastIndex, currentIndex)
    
    for (let i = start; i <= end; i++) {
      selectedItems.value.add(displayed.value[i].id)
    }
  } else {
    // Single selection
    selectedItems.value.clear()
    selectedItems.value.add(item.id)
  }
}

const toggleSelection = (itemId) => {
  if (selectedItems.value.has(itemId)) {
    selectedItems.value.delete(itemId)
  } else {
    selectedItems.value.add(itemId)
  }
}

const toggleSelectAll = () => {
  if (allSelected.value) {
    selectedItems.value.clear()
  } else {
    displayed.value.forEach(item => selectedItems.value.add(item.id))
  }
}

const clearSelection = () => {
  selectedItems.value.clear()
}

const toggleFavorite = (item) => {
  if (favorites.value.has(item.id)) {
    favorites.value.delete(item.id)
  } else {
    favorites.value.add(item.id)
  }
  
  // Persist to localStorage
  localStorage.setItem('favorites', JSON.stringify(Array.from(favorites.value)))
}

const isFavorite = (item) => {
  return favorites.value.has(item.id)
}

const getItemIcon = (item) => {
  if (item.type === 'folder') {
    return 'fa-folder text-blue-500'
  }
  
  const ext = item.name?.split('.').pop()?.toLowerCase()
  const iconMap = {
    'pdf': 'fa-file-pdf text-red-500',
    'doc': 'fa-file-word text-blue-600',
    'docx': 'fa-file-word text-blue-600',
    'xls': 'fa-file-excel text-green-600',
    'xlsx': 'fa-file-excel text-green-600',
    'ppt': 'fa-file-powerpoint text-orange-500',
    'pptx': 'fa-file-powerpoint text-orange-500',
    'jpg': 'fa-file-image text-purple-500',
    'jpeg': 'fa-file-image text-purple-500',
    'png': 'fa-file-image text-purple-500',
    'gif': 'fa-file-image text-purple-500',
    'mp4': 'fa-file-video text-red-600',
    'avi': 'fa-file-video text-red-600',
    'mov': 'fa-file-video text-red-600',
    'mp3': 'fa-file-audio text-green-500',
    'wav': 'fa-file-audio text-green-500',
    'zip': 'fa-file-archive text-yellow-600',
    'rar': 'fa-file-archive text-yellow-600',
    'txt': 'fa-file-alt text-gray-500',
    'js': 'fa-file-code text-yellow-500',
    'html': 'fa-file-code text-orange-500',
    'css': 'fa-file-code text-blue-500',
    'py': 'fa-file-code text-green-500'
  }
  
  return iconMap[ext] || 'fa-file text-gray-400'
}

const getFileType = (filename) => {
  const ext = filename?.split('.').pop()?.toLowerCase()
  return ext ? ext.toUpperCase() : 'File'
}

const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
}

const formatDate = (dateString) => {
  if (!dateString) return '—'
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

const applyFilter = () => {
  currentPage.value = 1 // Reset to first page when filtering
}

// Modal handlers
const openNew = (isFolder) => {
  newIsFolder.value = isFolder
  newModalVisible.value = true
}

const openRename = (item) => {
  renameTarget.value = item
  renameModalVisible.value = true
}

const confirmDelete = (item) => {
  itemsToDelete.value = [item]
  deleteModalVisible.value = true
}

const shareItem = (item) => {
  shareTargetItem.value = item
  shareModalVisible.value = true
}

const downloadItem = (item) => {
  if (item.type === 'file') {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001"
    window.open(`${API_BASE_URL}/api/files/${item.id}/download`, '_blank')
  }
}

// Bulk operations
const bulkDelete = () => {
  const items = displayed.value.filter(item => selectedItems.value.has(item.id))
  itemsToDelete.value = items
  deleteModalVisible.value = true
}

const bulkMove = () => {
  moveModalVisible.value = true
}

// Event handlers
const handleFileUploaded = () => {
  load()
  store.dispatch('showSuccess', 'File uploaded successfully')
}

const handleItemCreated = () => {
  load()
  store.dispatch('showSuccess', 'Item created successfully')
}

const handleItemRenamed = () => {
  load()
  store.dispatch('showSuccess', 'Item renamed successfully')
}

const handleItemsDeleted = () => {
  load()
  selectedItems.value.clear()
  store.dispatch('showSuccess', 'Items deleted successfully')
}

const handleItemShared = () => {
  store.dispatch('showSuccess', 'Item shared successfully')
}

const handleItemsMoved = () => {
  load()
  selectedItems.value.clear()
  store.dispatch('showSuccess', 'Items moved successfully')
}

// Watchers
watch(currentPath, () => {
  currentPage.value = 1
})

watch(view, () => {
  if (view.value === 'list') {
    nextTick(() => {
      handleScroll()
    })
  }
})

// Lifecycle
onMounted(() => {
  load()
  
  // Setup virtual scrolling
  if (listContainer.value) {
    handleScroll()
  }
})
</script>

<style scoped>
.skeleton {
  @apply animate-pulse bg-gray-200 rounded;
}

/* Smooth transitions */
.card {
  transition: all 0.2s ease;
}

.card:hover {
  transform: translateY(-2px);
}

/* Selection styles */
.ring-2 {
  @apply ring-primary ring-opacity-50;
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  @apply bg-base-200;
}

::-webkit-scrollbar-thumb {
  @apply bg-base-300 rounded;
}

::-webkit-scrollbar-thumb:hover {
  @apply bg-gray-400;
}
</style>