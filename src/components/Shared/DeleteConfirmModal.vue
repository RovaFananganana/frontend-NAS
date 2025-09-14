<template>
  <Modal
    :visible="visible"
    title="Confirm Deletion"
    show-confirm
    confirm-text="Delete"
    confirm-class="btn-error"
    @close="$emit('update:visible', false)"
    @confirm="deleteItems"
  >
    <div class="space-y-4">
      <div class="alert alert-warning">
        <i class="fas fa-exclamation-triangle"></i>
        <div>
          <h3 class="font-bold">This action cannot be undone!</h3>
          <div class="text-xs">The following items will be permanently deleted.</div>
        </div>
      </div>

      <div v-if="items && items.length > 0">
        <h4 class="font-semibold mb-2">
          Items to delete ({{ items.length }}):
        </h4>
        <div class="max-h-48 overflow-y-auto space-y-2">
          <div 
            v-for="item in items" 
            :key="item.id"
            class="flex items-center p-2 bg-base-200 rounded"
          >
            <i class="fas mr-3" :class="getItemIcon(item)"></i>
            <span class="flex-1">{{ item.name }}</span>
            <span class="text-xs text-base-content/70">{{ item.type }}</span>
          </div>
        </div>
      </div>

      <div class="form-control">
        <label class="label cursor-pointer">
          <span class="label-text">I understand this action is permanent</span>
          <input 
            v-model="confirmUnderstood" 
            type="checkbox" 
            class="checkbox checkbox-error" 
          />
        </label>
      </div>
    </div>
  </Modal>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { userAPI } from '@/services/api'
import { useStore } from 'vuex'
import Modal from './Modal.vue'

const props = defineProps({
  visible: Boolean,
  items: Array
})

const emit = defineEmits(['update:visible', 'deleted'])

const store = useStore()
const confirmUnderstood = ref(false)
const deleting = ref(false)

const canDelete = computed(() => {
  return confirmUnderstood.value && props.items && props.items.length > 0
})

const deleteItems = async () => {
  if (!canDelete.value || deleting.value) return

  deleting.value = true

  try {
    const deletePromises = props.items.map(item => {
      if (item.type === 'folder') {
        return userAPI.deleteFolder(item.id)
      } else {
        return userAPI.deleteFile(item.id)
      }
    })

    await Promise.all(deletePromises)

    emit('deleted')
    emit('update:visible', false)
    
  } catch (error) {
    console.error('Error deleting items:', error)
    const message = error.response?.data?.message || error.message || 'Failed to delete items'
    store.dispatch('showError', message)
  } finally {
    deleting.value = false
  }
}

const getItemIcon = (item) => {
  if (item.type === 'folder') {
    return 'fa-folder text-blue-500'
  }
  
  const ext = item.name?.split('.').pop()?.toLowerCase()
  const iconMap = {
    'pdf': 'fa-file-pdf text-red-500',
    'doc': 'fa-file-word text-blue-600',
    'docx': 'fa-file-word text-blue-600',
    'jpg': 'fa-file-image text-purple-500',
    'jpeg': 'fa-file-image text-purple-500',
    'png': 'fa-file-image text-purple-500',
    'mp4': 'fa-file-video text-red-600',
    'mp3': 'fa-file-audio text-green-500',
    'zip': 'fa-file-archive text-yellow-600',
    'txt': 'fa-file-alt text-gray-500',
    'js': 'fa-file-code text-yellow-500'
  }
  
  return iconMap[ext] || 'fa-file text-gray-400'
}

// Reset confirmation when modal opens/closes
watch(() => props.visible, (newVal) => {
  if (!newVal) {
    confirmUnderstood.value = false
  }
})
</script>