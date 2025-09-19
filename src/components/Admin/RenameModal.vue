<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-base-100 p-6 rounded-lg shadow-xl w-96 max-w-md">
      <h3 class="font-bold text-lg mb-4">
        Renommer {{ item?.type === 'folder' ? 'le dossier' : 'le fichier' }}
      </h3>
      
      <form @submit.prevent="renameItem">
        <div class="form-control mb-4">
          <label class="label">
            <span class="label-text">Nouveau nom</span>
          </label>
          <input 
            v-model="newName"
            type="text" 
            placeholder="Nouveau nom"
            class="input input-bordered w-full"
            :class="{ 'input-error': error }"
            ref="nameInput"
            @input="clearError"
          />
          <label v-if="error" class="label">
            <span class="label-text-alt text-error">{{ error }}</span>
          </label>
        </div>
        
        <div class="form-control mb-4">
          <label class="label">
            <span class="label-text">Type</span>
          </label>
          <div class="flex items-center gap-2">
            <i :class="getItemIcon(item)" :style="{ color: getItemColor(item) }"></i>
            <span>{{ item?.type === 'folder' ? 'Dossier' : getFileType(item?.name) }}</span>
          </div>
        </div>
        
        <div class="flex justify-end gap-2">
          <button type="button" class="btn btn-outline" @click="$emit('close')">
            Annuler
          </button>
          <button 
            type="submit" 
            class="btn btn-primary"
            :disabled="!newName.trim() || newName === item?.name || loading"
          >
            <span v-if="loading" class="loading loading-spinner loading-sm mr-2"></span>
            Renommer
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted, watch } from 'vue'

const props = defineProps({
  item: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close', 'renamed'])

const newName = ref('')
const loading = ref(false)
const error = ref('')
const nameInput = ref(null)

const renameItem = async () => {
  if (!newName.value.trim()) {
    error.value = 'Le nom est requis'
    return
  }
  
  if (newName.value === props.item?.name) {
    error.value = 'Le nouveau nom doit être différent'
    return
  }
  
  // Validate name
  const invalidChars = /[<>:"/\\|?*]/
  if (invalidChars.test(newName.value)) {
    error.value = 'Le nom contient des caractères non autorisés'
    return
  }
  
  loading.value = true
  error.value = ''
  
  try {
    const response = await fetch('/nas/rename', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        old_path: props.item.path,
        new_name: newName.value.trim()
      })
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Erreur lors du renommage')
    }
    
    const result = await response.json()
    if (!result.success) {
      throw new Error(result.error || 'Erreur lors du renommage')
    }
    
    emit('renamed')
    emit('close')
  } catch (err) {
    console.error('Error renaming item:', err)
    error.value = err.message || 'Erreur lors du renommage'
  } finally {
    loading.value = false
  }
}

const clearError = () => {
  error.value = ''
}

// Utility functions (duplicated from parent for simplicity)
const getItemIcon = (item) => {
  if (!item) return 'fas fa-file'
  if (item.type === 'folder') return 'fas fa-folder'
  
  const ext = item.name?.split('.').pop()?.toLowerCase() || ''
  const iconMap = {
    'pdf': 'fas fa-file-pdf',
    'doc': 'fas fa-file-word',
    'docx': 'fas fa-file-word',
    'jpg': 'fas fa-file-image',
    'jpeg': 'fas fa-file-image',
    'png': 'fas fa-file-image',
    'mp4': 'fas fa-file-video',
    'mp3': 'fas fa-file-audio',
    'zip': 'fas fa-file-archive',
    'txt': 'fas fa-file-alt',
    'js': 'fas fa-file-code',
    'html': 'fas fa-file-code'
  }
  return iconMap[ext] || 'fas fa-file'
}

const getItemColor = (item) => {
  if (!item) return '#6b7280'
  if (item.type === 'folder') return '#3b82f6'
  
  const ext = item.name?.split('.').pop()?.toLowerCase() || ''
  const colorMap = {
    'pdf': '#dc2626',
    'doc': '#2563eb',
    'docx': '#2563eb',
    'jpg': '#7c3aed',
    'jpeg': '#7c3aed',
    'png': '#7c3aed',
    'mp4': '#dc2626',
    'mp3': '#059669',
    'zip': '#6b7280',
    'txt': '#374151',
    'js': '#f59e0b',
    'html': '#f59e0b'
  }
  return colorMap[ext] || '#6b7280'
}

const getFileType = (filename) => {
  if (!filename) return 'Fichier'
  const ext = filename.split('.').pop()?.toLowerCase() || ''
  const typeMap = {
    'pdf': 'PDF',
    'doc': 'Word',
    'docx': 'Word',
    'jpg': 'Image',
    'jpeg': 'Image',
    'png': 'Image',
    'mp4': 'Vidéo',
    'mp3': 'Audio',
    'zip': 'Archive',
    'txt': 'Texte',
    'js': 'JavaScript',
    'html': 'HTML'
  }
  return typeMap[ext] || ext.toUpperCase() || 'Fichier'
}

watch(() => props.item, (newItem) => {
  if (newItem) {
    newName.value = newItem.name
  }
}, { immediate: true })

onMounted(() => {
  nextTick(() => {
    nameInput.value?.focus()
    nameInput.value?.select()
  })
})
</script>