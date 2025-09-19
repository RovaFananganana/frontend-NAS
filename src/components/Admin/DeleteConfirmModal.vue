<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-base-100 p-6 rounded-lg shadow-xl w-96 max-w-md">
      <h3 class="font-bold text-lg mb-4 flex items-center text-error">
        <i class="fas fa-exclamation-triangle mr-2"></i>
        Confirmer la suppression
      </h3>
      
      <div class="mb-6">
        <p class="mb-4">
          {{ items.length === 1 
            ? `Êtes-vous sûr de vouloir supprimer ${items[0].type === 'folder' ? 'le dossier' : 'le fichier'} suivant ?`
            : `Êtes-vous sûr de vouloir supprimer les ${items.length} éléments suivants ?`
          }}
        </p>
        
        <div class="bg-base-200 p-4 rounded-lg max-h-48 overflow-y-auto">
          <div v-for="item in items" :key="`${item.type}-${item.id}`" class="flex items-center gap-2 mb-2 last:mb-0">
            <i :class="getItemIcon(item)" :style="{ color: getItemColor(item) }"></i>
            <span class="font-medium">{{ item.name }}</span>
            <span class="text-xs text-base-content/70">
              ({{ item.type === 'folder' ? 'Dossier' : getFileType(item.name) }})
            </span>
          </div>
        </div>
        
        <div class="alert alert-warning mt-4">
          <i class="fas fa-exclamation-triangle"></i>
          <span class="text-sm">
            Cette action est irréversible. 
            {{ items.some(item => item.type === 'folder') 
              ? 'Les dossiers et leur contenu seront définitivement supprimés.' 
              : 'Les fichiers seront définitivement supprimés.'
            }}
          </span>
        </div>
      </div>
      
      <div class="flex justify-end gap-2">
        <button type="button" class="btn btn-outline" @click="$emit('close')">
          Annuler
        </button>
        <button 
          class="btn btn-error"
          :disabled="loading"
          @click="deleteItems"
        >
          <span v-if="loading" class="loading loading-spinner loading-sm mr-2"></span>
          <i v-else class="fas fa-trash mr-2"></i>
          Supprimer {{ items.length > 1 ? `(${items.length})` : '' }}
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
    default: () => []
  }
})

const emit = defineEmits(['close', 'confirmed'])

const loading = ref(false)

const deleteItems = async () => {
  loading.value = true
  
  try {
    const deletePromises = props.items.map(async item => {
      const response = await fetch('/nas/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          path: item.path
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Erreur lors de la suppression de ${item.name}`)
      }
      
      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || `Erreur lors de la suppression de ${item.name}`)
      }
      
      return result
    })
    
    await Promise.all(deletePromises)
    
    emit('confirmed')
    emit('close')
  } catch (err) {
    console.error('Error deleting items:', err)
    // You might want to show an error message here
    alert(err.message || 'Erreur lors de la suppression')
  } finally {
    loading.value = false
  }
}

// Utility functions (duplicated from parent for simplicity)
const getItemIcon = (item) => {
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
  const ext = filename?.split('.').pop()?.toLowerCase() || ''
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
</script>