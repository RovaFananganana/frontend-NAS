<template>
  <Modal
    :visible="visible"
    title="Move Items"
    show-confirm
    confirm-text="Move"
    @close="$emit('update:visible', false)"
    @confirm="moveItems"
  >
    <div class="space-y-4">
      <div v-if="items && items.length > 0" class="alert alert-info">
        <i class="fas fa-arrows-alt"></i>
        <span>Moving {{ items.length }} item(s)</span>
      </div>

      <!-- Destination folder selection -->
      <div class="form-control">
        <label class="label">
          <span class="label-text">Destination Folder</span>
        </label>
        
        <!-- Breadcrumb navigation -->
        <div class="flex items-center gap-2 mb-2 text-sm">
          <button 
            class="btn btn-xs btn-ghost"
            @click="navigateToFolder(null)"
          >
            <i class="fas fa-home mr-1"></i>
            Root
          </button>
          <span v-for="(folder, index) in currentPath" :key="folder.id" class="flex items-center">
            <i class="fas fa-chevron-right mx-1 text-xs"></i>
            <button 
              class="btn btn-xs btn-ghost"
              @click="navigateToFolder(folder)"
            >
              {{ folder.name }}
            </button>
          </span>
        </div>

        <!-- Folder list -->
        <div class="border rounded-lg max-h-64 overflow-y-auto">
          <div v-if="loading" class="p-4 text-center">
            <span class="loading loading-spinner loading-sm"></span>
            Loading folders...
          </div>
          
          <div v-else-if="availableFolders.length === 0" class="p-4 text-center text-base-content/70">
            <i class="fas fa-folder-open text-2xl mb-2"></i>
            <p>No folders available</p>
          </div>
          
          <div v-else class="divide-y">
            <button
              v-for="folder in availableFolders"
              :key="folder.id"
              class="w-full p-3 text-left hover:bg-base-200 transition-colors flex items-center"
              :class="{ 'bg-primary/10': selectedDestination?.id === folder.id }"
              @click="selectDestination(folder)"
              @dblclick="navigateToFolder(folder)"
            >
              <i class="fas fa-folder text-blue-500 mr-3"></i>
              <span class="flex-1">{{ folder.name }}</span>
              <i class="fas fa-chevron-right text-xs text-base-content/50"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- Selected destination -->
      <div v-if="selectedDestination" class="alert alert-success">
        <i class="fas fa-check-circle"></i>
        <span>
          Moving to: <strong>{{ getDestinationPath() }}</strong>
        </span>
      </div>

      <!-- Items being moved -->
      <div class="form-control">
        <label class="label">
          <span class="label-text">Items to move</span>
        </label>
        <div class="max-h-32 overflow-y-auto space-y-1">
          <div 
            v-for="item in itemsToMove" 
            :key="item.id"
            class="flex items-center p-2 bg-base-200 rounded text-sm"
          >
            <i class="fas mr-2" :class="getItemIcon(item)"></i>
            <span>{{ item.name }}</span>
          </div>
        </div>
      </div>

      <!-- Options -->
      <div class="form-control">
        <label class="label cursor-pointer">
          <span class="label-text">Keep original permissions</span>
          <input 
            v-model="keepPermissions" 
            type="checkbox" 
            class="checkbox" 
          />
        </label>
      </div>
    </div>
  </Modal>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { userAPI } from '@/services/api'
import { useStore } from 'vuex'
import Modal from './Modal.vue'

const props = defineProps({
  visible: Boolean,
  items: Array
})

const emit = defineEmits(['update:visible', 'moved'])

const store = useStore()

// State
const loading = ref(false)
const availableFolders = ref([])
const currentPath = ref([])
const selectedDestination = ref(null)
const keepPermissions = ref(true)

// Computed
const itemsToMove = computed(() => {
  if (!props.items) return []
  
  // Get actual item objects from IDs if needed
  return props.items.map(item => {
    if (typeof item === 'string' || typeof item === 'number') {
      // If we only have IDs, we'd need to fetch the items
      return { id: item, name: `Item ${item}`, type: 'unknown' }
    }
    return item
  })
})

// Methods
const loadFolders = async (parentId = null) => {
  loading.value = true
  
  try {
    const response = await userAPI.getFolders(parentId)
    availableFolders.value = response.data || []
    
    // Filter out items that are being moved to prevent moving into themselves
    const movingIds = new Set(itemsToMove.value.map(item => item.id))
    availableFolders.value = availableFolders.value.filter(folder => 
      !movingIds.has(folder.id)
    )
    
  } catch (error) {
    console.error('Error loading folders:', error)
    store.dispatch('showError', 'Failed to load folders')
  } finally {
    loading.value = false
  }
}

const navigateToFolder = async (folder) => {
  if (folder) {
    // Add to path
    const existingIndex = currentPath.value.findIndex(f => f.id === folder.id)
    if (existingIndex >= 0) {
      // Navigate to existing folder in path
      currentPath.value = currentPath.value.slice(0, existingIndex + 1)
    } else {
      // Add new folder to path
      currentPath.value.push(folder)
    }
    await loadFolders(folder.id)
  } else {
    // Navigate to root
    currentPath.value = []
    await loadFolders(null)
  }
  
  // Clear selection when navigating
  selectedDestination.value = null
}

const selectDestination = (folder) => {
  selectedDestination.value = folder
}

const getDestinationPath = () => {
  if (!selectedDestination.value) return ''
  
  const pathNames = currentPath.value.map(f => f.name)
  pathNames.push(selectedDestination.value.name)
  
  return pathNames.length > 0 ? `/${pathNames.join('/')}` : '/Root'
}

const moveItems = async () => {
  if (!selectedDestination.value) {
    store.dispatch('showError', 'Please select a destination folder')
    return
  }

  if (!itemsToMove.value.length) {
    store.dispatch('showError', 'No items to move')
    return
  }

  try {
    const movePromises = itemsToMove.value.map(item => {
      const moveData = {
        destination_folder_id: selectedDestination.value.id,
        keep_permissions: keepPermissions.value
      }

      if (item.type === 'folder') {
        return userAPI.moveFolder(item.id, moveData)
      } else {
        return userAPI.moveFile(item.id, moveData)
      }
    })

    await Promise.all(movePromises)

    emit('moved')
    emit('update:visible', false)
    
  } catch (error) {
    console.error('Error moving items:', error)
    const message = error.response?.data?.message || error.message || 'Failed to move items'
    store.dispatch('showError', message)
  }
}

const getItemIcon = (item) => {
  if (item.type === 'folder') {
    return 'fa-folder text-blue-500'
  }
  return 'fa-file text-gray-400'
}

const resetModal = () => {
  currentPath.value = []
  selectedDestination.value = null
  keepPermissions.value = true
  availableFolders.value = []
}

// Watch for modal visibility changes
watch(() => props.visible, (newVal) => {
  if (newVal) {
    resetModal()
    loadFolders()
  }
})
</script>