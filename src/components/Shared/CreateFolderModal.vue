<!-- components/Shared/CreateFolderModal.vue -->
<template>
  <div class="modal modal-open">
    <div class="modal-box">
      <h3 class="font-bold text-lg mb-4">Créer un nouveau dossier</h3>
      
      <form @submit.prevent="createFolder">
        <!-- Nom du dossier -->
        <div class="form-control mb-4">
          <label class="label">
            <span class="label-text">Nom du dossier *</span>
          </label>
          <input
            id="folderName"
            ref="nameInput"
            v-model="folderName"
            type="text"
            class="input input-bordered w-full"
            :class="{ 'input-error': error }"
            placeholder="Nom du dossier"
            required
            @input="validateName"
          />
          <label v-if="error" class="label">
            <span class="label-text-alt text-error">{{ error }}</span>
          </label>
        </div>
        
        <!-- Emplacement -->
        <div class="form-control mb-4">
          <label class="label">
            <span class="label-text">Emplacement</span>
          </label>
          <div class="flex items-center gap-2 p-3 bg-base-200 rounded-lg">
            <i class="fas fa-folder text-primary"></i>
            <span class="text-sm">{{ currentPath === '/' ? 'Racine' : currentPath }}</span>
          </div>
        </div>

        <!-- Actions -->
        <div class="modal-action">
          <button 
            type="button" 
            class="btn btn-ghost" 
            @click="$emit('close')"
            :disabled="loading"
          >
            Annuler
          </button>
          <button
            type="submit"
            class="btn btn-primary"
            :disabled="!folderName.trim() || loading || !!error"
          >
            <span v-if="loading" class="loading loading-spinner loading-sm"></span>
            <i v-else class="fas fa-folder-plus mr-2"></i>
            {{ loading ? 'Création...' : 'Créer le dossier' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import { ref, nextTick, onMounted } from 'vue'
import { useSynologyAPI } from '@/services/useSynologyAPI'

export default {
  name: 'CreateFolderModal',
  props: {
    currentPath: {
      type: String,
      default: '/'
    }
  },
  emits: ['close', 'created'],
  setup(props, { emit }) {
    const synologyAPI = useSynologyAPI()
    
    const folderName = ref('')
    const loading = ref(false)
    const error = ref('')
    const nameInput = ref(null)

    const validateName = () => {
      error.value = ''
      
      if (!folderName.value.trim()) {
        return
      }
      
      // Caractères interdits
      const invalidChars = /[<>:"/\\|?*\x00-\x1f]/
      if (invalidChars.test(folderName.value)) {
        error.value = 'Le nom contient des caractères non autorisés'
        return
      }
      
      // Noms réservés Windows
      const reservedNames = ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9', 'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9']
      if (reservedNames.includes(folderName.value.toUpperCase())) {
        error.value = 'Ce nom est réservé par le système'
        return
      }
      
      // Longueur maximale
      if (folderName.value.length > 255) {
        error.value = 'Le nom est trop long (max 255 caractères)'
        return
      }
    }

    const createFolder = async () => {
      validateName()
      if (error.value) return

      loading.value = true
      
      try {
        const result = await synologyAPI.createFolder(props.currentPath, folderName.value.trim())
        
        emit('created', {
          folderName: folderName.value.trim(),
          path: result.path,
          parentPath: props.currentPath
        })
        emit('close') // Close modal automatically after successful creation
      } catch (err) {
        console.error('Error creating folder:', err)
        error.value = err.message || 'Erreur lors de la création'
      } finally {
        loading.value = false
      }
    }

    onMounted(() => {
      nextTick(() => {
        nameInput.value?.focus()
      })
    })

    return {
      folderName,
      loading,
      error,
      nameInput,
      validateName,
      createFolder
    }
  }
}
</script>