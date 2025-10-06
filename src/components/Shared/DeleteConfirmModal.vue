<!-- components/Shared/DeleteConfirmModal.vue -->
<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
      <h3 class="font-bold text-lg mb-4 text-red-600">
        <i class="fas fa-exclamation-triangle mr-2"></i>
        Confirmer la suppression
      </h3>

      <!-- Warning message -->
      <div class="bg-yellow-100 dark:bg-yellow-900 border border-yellow-400 text-yellow-700 dark:text-yellow-300 px-4 py-3 rounded mb-4">
        <div class="flex">
          <i class="fas fa-exclamation-triangle mr-2"></i>
          <div>
            <h4 class="font-bold">Attention !</h4>
            <p class="text-sm">Cette action est irréversible. Les éléments seront définitivement supprimés du NAS.</p>
          </div>
        </div>
      </div>

      <!-- Error message -->
      <div v-if="errorMessage" class="bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-300 px-4 py-3 rounded mb-4">
        <div class="flex">
          <i class="fas fa-exclamation-circle mr-2"></i>
          <div>
            <h4 class="font-bold">Erreur</h4>
            <p class="text-sm">{{ errorMessage }}</p>
          </div>
        </div>
      </div>

      <!-- Items to delete -->
      <div class="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg mb-4">
        <h4 class="font-semibold mb-2">
          {{ items.length === 1 ? 'Élément à supprimer :' : `${items.length} éléments à supprimer :` }}
        </h4>
        <div class="space-y-2 max-h-48 overflow-auto">
          <div 
            v-for="item in items" 
            :key="item.path || item.name"
            class="flex items-center gap-3 p-2 bg-white dark:bg-gray-600 rounded"
          >
            <i :class="getItemIcon(item)" :style="{ color: getItemColor(item) }"></i>
            <div class="flex-1">
              <div class="font-medium">{{ item.name }}</div>
              <div class="text-sm opacity-70">{{ item.path }}</div>
              <div v-if="!item.is_directory && item.size" class="text-xs opacity-50">
                {{ formatBytes(item.size) }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Confirmation checkbox for multiple items -->
      <div v-if="items.length > 1" class="form-control mb-4">
        <label class="label cursor-pointer justify-start gap-3">
          <input 
            v-model="confirmMultiple" 
            type="checkbox" 
            class="checkbox checkbox-error" 
          />
          <span class="label-text">
            Je confirme vouloir supprimer ces {{ items.length }} éléments
          </span>
        </label>
      </div>

      <!-- Confirmation checkbox for multiple items -->
      <div v-if="items.length > 1" class="mb-4">
        <label class="flex items-center gap-3 cursor-pointer">
          <input 
            v-model="confirmMultiple" 
            type="checkbox" 
            class="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500" 
          />
          <span class="text-sm">
            Je confirme vouloir supprimer ces {{ items.length }} éléments
          </span>
        </label>
      </div>

      <!-- Actions -->
      <div class="flex justify-end gap-3">
        <button 
          @click="closeModal" 
          :disabled="loading"
          class="px-4 py-2 text-gray-600 bg-gray-200 hover:bg-gray-300 rounded-lg disabled:opacity-50"
        >
          Annuler
        </button>
        <button 
          @click="deleteItems" 
          :disabled="(items.length > 1 && !confirmMultiple) || loading"
          class="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50 flex items-center gap-2"
        >
          <span v-if="loading" class="animate-spin">⏳</span>
          <i v-else class="fas fa-trash"></i>
          {{ loading ? 'Suppression...' : `Supprimer${items.length > 1 ? ` ${items.length} éléments` : ''}` }}
        </button>
      </div>
    </div>
  </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useStore } from 'vuex'

const props = defineProps({
  items: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['close', 'confirmed'])

// Store
const store = useStore()

// State
const loading = ref(false)
const confirmMultiple = ref(false)
const errorMessage = ref('')

// Computed
const isAdmin = computed(() => store.getters.isAdmin)
const canDelete = computed(() => {
  // Admin can delete everything
  if (isAdmin.value) return true
  
  // For regular users, we'll let the backend handle permission validation
  // This could be enhanced with more granular frontend permission checking
  return true
})

// Methods
const closeModal = () => {
  errorMessage.value = ''
  emit('close')
}

const deleteItems = async () => {
  if (!canDelete.value) {
    errorMessage.value = 'Vous n\'avez pas les permissions nécessaires pour supprimer ces éléments.'
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    const results = []
    
    for (const item of props.items) {
      try {
        const result = await deleteItem(item)
        results.push({ item, success: true, result })
      } catch (error) {
        results.push({ item, success: false, error: error.message })
      }
    }

    // Check if any deletions failed
    const failedDeletions = results.filter(r => !r.success)
    
    if (failedDeletions.length > 0) {
      // Show error for failed deletions
      const failedNames = failedDeletions.map(f => f.item.name).join(', ')
      errorMessage.value = `Échec de suppression pour: ${failedNames}. ${failedDeletions[0].error}`
      
      // If some succeeded, still emit the successful ones
      const successfulItems = results.filter(r => r.success).map(r => r.item)
      if (successfulItems.length > 0) {
        emit('confirmed', successfulItems)
      }
    } else {
      // All deletions successful
      emit('confirmed', props.items)
      closeModal()
    }
  } catch (err) {
    console.error('Error deleting items:', err)
    errorMessage.value = `Erreur lors de la suppression: ${err.message}`
  } finally {
    loading.value = false
  }
}

const deleteItem = async (item) => {
  const baseURL = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5001')
  const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
  
  const response = await fetch(`${baseURL}/nas/delete`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      path: item.path,
      recursive: store.getters.isAdmin  // Allow recursive deletion for admins
    })
  })

  if (!response.ok) {
    let errorMessage = `Erreur serveur (${response.status}): ${response.statusText}`
    
    try {
      const errorData = await response.json()
      errorMessage = errorData.error || errorMessage
      console.error('Delete error details:', errorData)
    } catch (parseError) {
      console.error('Could not parse error response:', parseError)
    }
    
    if (response.status === 403) {
      throw new Error('Permission de suppression refusée')
    } else if (response.status === 404) {
      throw new Error('Élément introuvable')
    } else if (response.status === 422) {
      throw new Error(`Erreur de traitement: ${errorMessage}`)
    } else {
      throw new Error(errorMessage)
    }
  }

  const data = await response.json()

  if (!data.success) {
    throw new Error(data.error || 'Erreur lors de la suppression')
  }

  return data
}

// Utility functions
const formatBytes = (bytes) => {
  if (!bytes || bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

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
</script>