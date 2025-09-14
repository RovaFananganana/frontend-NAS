<template>
  <Modal
    :visible="visible"
    :title="isFolder ? 'Create New Folder' : 'Create New File'"
    show-confirm
    @close="$emit('update:visible', false)"
    @confirm="createItem"
  >
    <div class="space-y-4">
      <div>
        <label class="label">
          <span class="label-text">{{ isFolder ? 'Folder' : 'File' }} Name</span>
        </label>
        <input 
          v-model="itemName" 
          type="text"
          :placeholder="`Enter ${isFolder ? 'folder' : 'file'} name`"
          class="input input-bordered w-full"
          @keyup.enter="createItem"
          ref="nameInput"
        />
      </div>

      <div v-if="!isFolder" class="alert alert-info">
        <i class="fas fa-info-circle"></i>
        <span>For files, use the upload button to add actual files. This creates an empty placeholder.</span>
      </div>

      <div v-if="isFolder">
        <label class="label">
          <span class="label-text">Description (Optional)</span>
        </label>
        <textarea 
          v-model="description"
          placeholder="Enter folder description"
          class="textarea textarea-bordered w-full"
          rows="3"
        ></textarea>
      </div>
    </div>
  </Modal>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'
import { userAPI } from '@/services/api'
import { useStore } from 'vuex'
import Modal from './Modal.vue'

const props = defineProps({
  visible: Boolean,
  isFolder: Boolean,
  currentPath: String
})

const emit = defineEmits(['update:visible', 'created'])

const store = useStore()
const itemName = ref('')
const description = ref('')
const nameInput = ref(null)

const createItem = async () => {
  if (!itemName.value.trim()) {
    store.dispatch('showError', 'Please enter a name')
    return
  }

  try {
    if (props.isFolder) {
      await userAPI.createFolder(itemName.value.trim(), {
        parent_path: props.currentPath === '/' ? null : props.currentPath,
        description: description.value.trim() || null
      })
    } else {
      // For files, this would create a placeholder - in real implementation
      // you might want to redirect to upload or create empty file
      store.dispatch('showInfo', 'Use the upload button to add actual files')
      emit('update:visible', false)
      return
    }

    // Reset form
    itemName.value = ''
    description.value = ''
    
    emit('created')
    emit('update:visible', false)
    
  } catch (error) {
    console.error('Error creating item:', error)
    const message = error.response?.data?.message || error.message || 'Failed to create item'
    store.dispatch('showError', message)
  }
}

// Focus input when modal opens
watch(() => props.visible, (newVal) => {
  if (newVal) {
    nextTick(() => {
      nameInput.value?.focus()
    })
  }
})
</script>