<!-- components/Shared/DeleteConfirmModal.vue -->
<template>
  <div class="modal modal-open">
    <div class="modal-box">
      <h3 class="font-bold text-lg mb-4 text-error">
        <i class="fas fa-exclamation-triangle mr-2"></i>
        Confirmer la suppression
      </h3>

      <!-- Warning message -->
      <div class="alert alert-warning mb-4">
        <i class="fas fa-exclamation-triangle"></i>
        <div>
          <h4 class="font-bold">Attention !</h4>
          <p>Cette action est irréversible. Les éléments seront définitivement supprimés du NAS.</p>
        </div>
      </div>

      <!-- Items to delete -->
      <div class="bg-base-200 p-4 rounded-lg mb-4">
        <h4 class="font-semibold mb-2">
          {{ items.length === 1 ? 'Élément à supprimer :' : `${items.length} éléments à supprimer :` }}
        </h4>
        <div class="space-y-2 max-h-48 overflow-auto">
          <div 
            v-for="item in items" 
            :key="item.path"
            class="flex items-center gap-3 p-2 bg-base-100 rounded"
          >
            <i :class="getItemIcon(item)" :style="{ color: getItemColor(item) }"></i>
            <div class="flex-1">
              <div class="font-medium">{{ item.name }}</div>
              <div class="text-sm opacity-70">{{ item.path }}</div>
              <div v-if="!item.is_directory" class="text-xs opacity-50">
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

      <!-- Actions -->
      <div class="modal-action">
        <button @click="$emit('close')" class="btn btn-outline">
          Annuler
        </button>
        <button 
          @click="deleteItems" 
          :disabled="(items.length > 1 && !confirmMultiple) || loading"
          class="btn btn-error"
        >
          <span v-if="loading" class="loading loading-spinner loading-sm mr-2"></span>
          <i v-else class="fas fa-trash mr-2"></i>
          Supprimer {{ items.length > 1 ? `${items.length} éléments` : '' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  items: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['close', 'confirmed'])

// State
const loading = ref(false)
const confirmMultiple = ref(false)

// Methods
const deleteItems = async () => {
  loading.value = true

  try {
    for (const item of props.items) {
      await deleteItem(item)
    }

    emit('confirmed', props.items)
    emit('close')
  } catch (err) {
    console.error('Error deleting items:', err)
    // Handle error - could show toast notification
  } finally {
    loading.value = false
  }
}

const deleteItem = async (item) => {
  const response = await fetch('/nas/delete', {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      path: item.path
    })
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }

  const data = await response.json()

  if (!data.success) {
    throw new Error(data.error || 'Erreur lors de la suppression')
  }
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