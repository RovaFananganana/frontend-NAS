<template>
  <div v-if="show" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" @click.self="closeModal">
    <div class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4" @click.stop>
      <div class="flex items-center mb-4">
        <i class="fas fa-exclamation-triangle text-red-500 text-xl mr-3"></i>
        <h3 class="font-bold text-lg">Confirmer la suppression</h3>
      </div>

      <div class="mb-4">
        <p class="text-sm text-gray-600 dark:text-gray-300 mb-3">
          Cette action est irréversible. Les éléments seront définitivement supprimés.
        </p>
        
        <div class="bg-gray-100 dark:bg-gray-700 p-3 rounded">
          <p class="font-medium text-sm mb-2">
            {{ itemCount === 1 ? 'Élément à supprimer :' : `${itemCount} éléments à supprimer :` }}
          </p>
          <div class="max-h-32 overflow-auto">
            <div v-for="item in items" :key="getItemKey(item)" class="text-sm py-1">
              <i :class="getItemIcon(item)" class="mr-2"></i>
              {{ item.name }}
            </div>
          </div>
        </div>
      </div>

      <div v-if="errorMessage" class="mb-4 p-3 bg-red-100 border border-red-300 rounded text-red-700 text-sm">
        {{ errorMessage }}
      </div>

      <div v-if="itemCount > 1" class="mb-4">
        <label class="flex items-center gap-2 cursor-pointer">
          <input v-model="confirmMultiple" type="checkbox" class="rounded">
          <span class="text-sm">Je confirme vouloir supprimer ces {{ itemCount }} éléments</span>
        </label>
      </div>

      <div class="flex justify-end gap-3">
        <button 
          @click="closeModal" 
          :disabled="loading"
          class="px-4 py-2 text-gray-600 bg-gray-200 hover:bg-gray-300 rounded disabled:opacity-50"
        >
          Annuler
        </button>
        <button 
          @click="handleDelete" 
          :disabled="isDeleteDisabled"
          class="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded disabled:opacity-50"
        >
          {{ loading ? 'Suppression...' : 'Supprimer' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import axios from 'axios'
import { ref, computed } from 'vue'
import { useStore } from 'vuex'
import TokenService from '@/services/tokenService.js'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  items: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['close', 'confirmed'])

const store = useStore()
const loading = ref(false)
const confirmMultiple = ref(false)
const errorMessage = ref('')

// Computed properties
const isAdmin = computed(() => store.getters.isAdmin)
const itemCount = computed(() => props.items?.length || 0)
const isDeleteDisabled = computed(() => {
  return (itemCount.value > 1 && !confirmMultiple.value) || loading.value
})

// Methods
const closeModal = () => {
  errorMessage.value = ''
  emit('close')
}

const getItemKey = (item) => {
  return item?.path || item?.name || Math.random().toString()
}

const getItemIcon = (item) => {
  if (!item) return 'fas fa-file text-gray-500'
  return item.is_directory ? 'fas fa-folder text-blue-500' : 'fas fa-file text-gray-500'
}

const handleDelete = async () => {
  if (isDeleteDisabled.value) return
  
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

    const failedDeletions = results.filter(r => !r.success)
    
    if (failedDeletions.length > 0) {
      const failedNames = failedDeletions.map(f => f.item.name).join(', ')
      errorMessage.value = `Échec pour: ${failedNames}. ${failedDeletions[0].error}`
      
      const successfulItems = results.filter(r => r.success).map(r => r.item)
      if (successfulItems.length > 0) {
        emit('confirmed', successfulItems)
      }
    } else {
      emit('confirmed', props.items)
      closeModal()
    }
  } catch (err) {
    errorMessage.value = `Erreur: ${err.message}`
  } finally {
    loading.value = false
  }
}

const deleteItem = async (item) => {
  if (!item || !item.path) {
    throw new Error('Élément invalide')
  }

  const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5001'
  const token = TokenService.getToken()

  if (!token) {
    throw new Error('Token d\'authentification manquant')
  }

  try {
    const response = await axios.delete(`${baseURL}/nas/delete`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      data: {
        path: item.path,
        recursive: isAdmin.value
      }
    })

    if (!response.data?.success) {
      throw new Error(response.data?.error || 'Erreur lors de la suppression')
    }

    return response.data
  } catch (error) {
    console.error('Erreur API delete:', error.response?.data || error.message)
    throw new Error(error.response?.data?.error || error.message)
  }
}

</script>