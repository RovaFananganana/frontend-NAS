<!-- components/Shared/CreateFolderModal.vue -->
<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>Créer un nouveau dossier</h3>
        <button @click="$emit('close')" class="close-btn">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <form @submit.prevent="createFolder">
        <div class="modal-body">
          <div class="form-group">
            <label for="folderName">Nom du dossier</label>
            <input
              id="folderName"
              v-model="folderName"
              type="text"
              class="form-input"
              :class="{ 'error': error }"
              placeholder="Nom du dossier"
              ref="nameInput"
              @input="validateName"
            />
            <div v-if="error" class="error-message">{{ error }}</div>
          </div>
          
          <div class="form-group">
            <label>Emplacement</label>
            <div class="location-info">
              <i class="fas fa-folder"></i>
              <span>{{ currentPath === '/' ? 'Racine' : currentPath }}</span>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" @click="$emit('close')" class="btn btn-secondary">
            Annuler
          </button>
          <button
            type="submit"
            class="btn btn-primary"
            :disabled="!folderName.trim() || loading || !!error"
          >
            <i v-if="loading" class="fas fa-spinner fa-spin"></i>
            <i v-else class="fas fa-folder-plus"></i>
            {{ loading ? 'Création...' : 'Créer' }}
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
        await synologyAPI.createFolder(props.currentPath, folderName.value.trim())
        emit('created')
        emit('close') // Close modal automatically after successful creation
      } catch (err) {
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