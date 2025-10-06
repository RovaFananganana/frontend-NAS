<template>
  <div v-if="show" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" @click.self="$emit('close')">
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
            {{ items.length === 1 ? 'Élément à supprimer :' : `${items.length} éléments à supprimer :` }}
          </p>
          <div class="max-h-32 overflow-auto">
            <div v-for="item in items" :key="item.path || item.name" class="text-sm py-1">
              <i :class="item.is_directory ? 'fas fa-folder text-blue-500' : 'fas fa-file text-gray-500'" class="mr-2"></i>
              {{ item.name }}
            </div>
          </div>
        </div>
      </div>

      <div v-if="errorMessage" class="mb-4 p-3 bg-red-100 border border-red-300 rounded text-red-700 text-sm">
        {{ errorMessage }}
      </div>

      <div v-if="items.length > 1" class="mb-4">
        <label class="flex items-center gap-2 cursor-pointer">
          <input v-model="confirmMultiple" type="checkbox" class="rounded">
          <span class="text-sm">Je confirme vouloir supprimer ces {{ items.length }} éléments</span>
        </label>
      </div>

      <div class="flex justify-end gap-3">
        <button 
          @click="$emit('close')" 
          :disabled="loading"
          class="px-4 py-2 text-gray-600 bg-gray-200 hover:bg-gray-300 rounded disabled:opacity-50"
        >
          Annuler
        </button>
        <button 
          @click="handleDelete" 
          :disabled="(items.length > 1 && !confirmMultiple) || loading"
          class="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded disabled:opacity-50"
        >
          {{ loading ? 'Suppression...' : 'Supprimer' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useStore } from 'vuex'

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

const isAdmin = computed(() => store.getters.isAdmin)

const handleDelete = async () => {
  if (props.items.length > 1 && !confirmMultiple.value) return
  
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
      emit('close')
    }
  } catch (err) {
    errorMessage.value = `Erreur: ${err.message}`
  } finally {
    loading.value = false
  }
}

const deleteItem = async (item) => {
  const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5001'
  const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
  
  const response = await fetch(`${baseURL}/nas/delete`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      path: item.path,
      recursive: isAdmin.value
    })
  })

  if (!response.ok) {
    let errorMessage = `Erreur ${response.status}`
    
    try {
      const errorData = await response.json()
      errorMessage = errorData.error || errorMessage
    } catch (e) {
      // Ignore parse errors
    }
    
    throw new Error(errorMessage)
  }

  const data = await response.json()
  
  if (!data.success) {
    throw new Error(data.error || 'Erreur lors de la suppression')
  }

  return data
}
</script>