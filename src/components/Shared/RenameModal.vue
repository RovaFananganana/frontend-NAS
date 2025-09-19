<!-- components/Shared/RenameModal.vue -->
<template>
  <div class="modal modal-open">
    <div class="modal-box">
      <h3 class="font-bold text-lg mb-4">
        <i class="fas fa-edit mr-2"></i>
        Renommer {{ item?.is_directory ? 'le dossier' : 'le fichier' }}
      </h3>

      <!-- Current item info -->
      <div class="bg-base-200 p-4 rounded-lg mb-4">
        <div class="flex items-center gap-3">
          <i :class="getItemIcon(item)" :style="{ color: getItemColor(item) }" class="text-2xl"></i>
          <div>
            <h4 class="font-semibold">{{ item?.name }}</h4>
            <p class="text-sm opacity-70">{{ item?.path }}</p>
          </div>
        </div>
      </div>

      <!-- Rename form -->
      <div class="form-control">
        <label class="label">
          <span class="label-text">Nouveau nom</span>
        </label>
        <input 
          ref="nameInput"
          v-model="newName" 
          type="text" 
          class="input input-bordered"
          :class="{ 'input-error': error }"
          @keyup.enter="rename"
          @keyup.escape="$emit('close')"
        />
        <label v-if="error" class="label">
          <span class="label-text-alt text-error">{{ error }}</span>
        </label>
      </div>

      <!-- Actions -->
      <div class="modal-action">
        <button @click="$emit('close')" class="btn btn-outline">
          Annuler
        </button>
        <button 
          @click="rename" 
          :disabled="!newName.trim() || loading"
          class="btn btn-primary"
        >
          <span v-if="loading" class="loading loading-spinner loading-sm mr-2"></span>
          <i v-else class="fas fa-check mr-2"></i>
          Renommer
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'

const props = defineProps({
  item: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close', 'renamed'])

// State
const newName = ref('')
const loading = ref(false)
const error = ref('')
const nameInput = ref(null)

// Methods
const rename = async () => {
  if (!newName.value.trim()) {
    error.value = 'Le nom ne peut pas être vide'
    return
  }

  if (newName.value === props.item.name) {
    emit('close')
    return
  }

  loading.value = true
  error.value = ''

  try {
    const response = await fetch('/nas/rename', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        old_path: props.item.path,
        new_name: newName.value.trim()
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()

    if (data.success) {
      emit('renamed', {
        oldPath: props.item.path,
        newPath: data.new_path,
        newName: newName.value.trim()
      })
      emit('close')
    } else {
      throw new Error(data.error || 'Erreur lors du renommage')
    }
  } catch (err) {
    console.error('Error renaming item:', err)
    error.value = err.message || 'Erreur lors du renommage'
  } finally {
    loading.value = false
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
  if (props.item) {
    newName.value = props.item.name
    
    nextTick(() => {
      if (nameInput.value) {
        nameInput.value.focus()
        
        // Select filename without extension for files
        if (!props.item.is_directory && props.item.name.includes('.')) {
          const lastDotIndex = props.item.name.lastIndexOf('.')
          nameInput.value.setSelectionRange(0, lastDotIndex)
        } else {
          nameInput.value.select()
        }
      }
    })
  }
})
</script>