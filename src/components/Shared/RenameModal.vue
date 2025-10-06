<!-- components/Shared/RenameModal.vue -->
<template>
  <div class="modal modal-open">
    <div class="modal-box relative" :class="{ 'pointer-events-none opacity-75': loading }">
      <h3 class="font-bold text-lg mb-4">
        <i class="fas fa-edit mr-2"></i>
        Renommer {{ item?.is_directory ? 'le dossier' : 'le fichier' }}
      </h3>
      
      <!-- Loading overlay -->
      <div v-if="loading" class="absolute inset-0 bg-base-100 bg-opacity-75 flex items-center justify-center z-50 rounded-lg">
        <div class="flex flex-col items-center gap-2">
          <span class="loading loading-spinner loading-lg"></span>
          <span class="text-sm font-medium">Renommage en cours...</span>
        </div>
      </div>

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
          :class="{ 'input-error': error || !isValid }"
          @keyup.enter="rename"
          @keyup.escape="$emit('close')"
        />
        <label v-if="error || (!isValid && newName.trim())" class="label">
          <span class="label-text-alt text-error">{{ error || validationError }}</span>
        </label>
      </div>

      <!-- Actions -->
      <div class="modal-action">
        <button @click="$emit('close')" class="btn btn-outline" :disabled="loading">
          Annuler
        </button>
        <button 
          @click="rename" 
          :disabled="!isValid || loading || newName.trim() === props.item.name"
          class="btn btn-primary"
        >
          <span v-if="loading" class="loading loading-spinner loading-sm mr-2"></span>
          <i v-else class="fas fa-check mr-2"></i>
          {{ loading ? 'Renommage en cours...' : 'Renommer' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, computed } from 'vue'
import { nasAPI } from '@/services/nasAPI'

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

// Computed validation
const validationResult = computed(() => {
  if (!newName.value.trim()) {
    return { valid: false, error: 'Le nom ne peut pas être vide' }
  }
  return nasAPI.validateFileName(newName.value.trim())
})

const isValid = computed(() => validationResult.value.valid)
const validationError = computed(() => validationResult.value.error)

// Methods
const rename = async () => {
  // Validate before proceeding
  if (!isValid.value) {
    error.value = validationError.value
    return
  }

  const trimmedName = newName.value.trim()
  
  if (trimmedName === props.item.name) {
    emit('close')
    return
  }

  loading.value = true
  error.value = ''

  try {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token')
    
    if (!token) {
      throw new Error('Token d\'authentification manquant')
    }

    const response = await fetch('/nas/rename', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        old_path: props.item.path,
        new_name: trimmedName
      })
    })

    // Gérer les différents codes de statut
    if (!response.ok) {
      let errorMessage = 'Erreur lors du renommage'
      
      try {
        const errorData = await response.json()
        errorMessage = errorData.error || errorData.msg || errorMessage
      } catch (parseError) {
        // Si on ne peut pas parser la réponse JSON
        if (response.status === 401) {
          errorMessage = 'Session expirée, veuillez vous reconnecter'
        } else if (response.status === 403) {
          errorMessage = 'Permissions insuffisantes pour cette opération'
        } else if (response.status === 404) {
          errorMessage = 'L\'élément à renommer n\'existe plus'
        } else if (response.status === 409) {
          errorMessage = 'Un élément avec ce nom existe déjà'
        } else if (response.status === 500) {
          errorMessage = 'Erreur interne du serveur'
        } else {
          errorMessage = `Erreur HTTP ${response.status}: ${response.statusText}`
        }
      }
      
      throw new Error(errorMessage)
    }

    const data = await response.json()

    if (data.success) {
      // Emit success event with updated information
      emit('renamed', {
        oldPath: props.item.path,
        newPath: data.new_path,
        newName: trimmedName
      })
      
      // Auto-close modal on success
      emit('close')
    } else {
      throw new Error(data.error || 'Erreur lors du renommage')
    }
  } catch (err) {
    console.error('Error renaming item:', err)
    
    // Provide user-friendly error messages
    let userMessage = 'Erreur lors du renommage'
    
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      userMessage = 'Erreur de connexion au serveur. Vérifiez votre connexion réseau.'
    } else if (err.message.includes('Token') || err.message.includes('Session')) {
      userMessage = 'Session expirée, veuillez vous reconnecter'
    } else if (err.message.includes('Permission') || err.message.includes('permissions')) {
      userMessage = 'Vous n\'avez pas les permissions nécessaires pour renommer cet élément'
    } else if (err.message.includes('404') || err.message.includes('existe plus')) {
      userMessage = 'L\'élément à renommer n\'existe plus'
    } else if (err.message.includes('409') || err.message.includes('existe déjà')) {
      userMessage = 'Un élément avec ce nom existe déjà'
    } else if (err.message.includes('500') || err.message.includes('serveur')) {
      userMessage = 'Erreur interne du serveur. Veuillez réessayer plus tard.'
    } else if (err.message.includes('CORS')) {
      userMessage = 'Erreur de configuration du serveur (CORS)'
    } else if (err.message) {
      userMessage = err.message
    }
    
    error.value = userMessage
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