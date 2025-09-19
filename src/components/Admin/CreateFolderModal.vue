<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-base-100 p-6 rounded-lg shadow-xl w-96 max-w-md">
      <h3 class="font-bold text-lg mb-4">Créer un nouveau dossier</h3>
      
      <form @submit.prevent="createFolder">
        <div class="form-control mb-4">
          <label class="label">
            <span class="label-text">Nom du dossier</span>
          </label>
          <input 
            v-model="folderName"
            type="text" 
            placeholder="Nom du dossier"
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
            <span class="label-text">Emplacement</span>
          </label>
          <div class="input input-bordered bg-base-200 text-base-content/70">
            {{ currentPath || 'Racine' }}
          </div>
        </div>
        
        <div class="flex justify-end gap-2">
          <button type="button" class="btn btn-outline" @click="$emit('close')">
            Annuler
          </button>
          <button 
            type="submit" 
            class="btn btn-primary"
            :disabled="!folderName.trim() || loading"
          >
            <span v-if="loading" class="loading loading-spinner loading-sm mr-2"></span>
            Créer
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted } from 'vue'

const props = defineProps({
  currentPath: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['close', 'created'])

const folderName = ref('')
const loading = ref(false)
const error = ref('')
const nameInput = ref(null)

const createFolder = async () => {
  if (!folderName.value.trim()) {
    error.value = 'Le nom du dossier est requis'
    return
  }
  
  // Validate folder name
  const invalidChars = /[<>:"/\\|?*]/
  if (invalidChars.test(folderName.value)) {
    error.value = 'Le nom contient des caractères non autorisés'
    return
  }
  
  loading.value = true
  error.value = ''
  
  try {
    const response = await fetch('/nas/create-folder', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        name: folderName.value.trim(),
        parent_path: props.currentPath || '/'
      })
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Erreur lors de la création du dossier')
    }
    
    const result = await response.json()
    if (!result.success) {
      throw new Error(result.error || 'Erreur lors de la création du dossier')
    }
    
    emit('created')
    emit('close')
  } catch (err) {
    console.error('Error creating folder:', err)
    error.value = err.message || 'Erreur lors de la création du dossier'
  } finally {
    loading.value = false
  }
}

const clearError = () => {
  error.value = ''
}

onMounted(() => {
  nextTick(() => {
    nameInput.value?.focus()
  })
})
</script>