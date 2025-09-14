<template>
  <Modal
    :visible="visible"
    title="Rename Item"
    show-confirm
    @close="$emit('update:visible', false)"
    @confirm="renameItem"
  >
    <div class="space-y-4">
      <div>
        <label class="label">
          <span class="label-text">New Name</span>
        </label>
        <input 
          v-model="newName" 
          type="text"
          placeholder="Enter new name"
          class="input input-bordered w-full"
          @keyup.enter="renameItem"
          ref="nameInput"
        />
      </div>

      <div v-if="item" class="alert alert-info">
        <i class="fas fa-info-circle"></i>
        <span>Renaming: <strong>{{ item.name }}</strong></span>
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
  item: Object
})

const emit = defineEmits(['update:visible', 'renamed'])

const store = useStore()
const newName = ref('')
const nameInput = ref(null)

const renameItem = async () => {
  if (!newName.value.trim()) {
    store.dispatch('showError', 'Please enter a name')
    return
  }

  if (!props.item) {
    store.dispatch('showError', 'No item selected')
    return
  }

  try {
    if (props.item.type === 'folder') {
      await userAPI.updateFolder(props.item.id, newName.value.trim())
    } else {
      // For files, you might need a different API endpoint
      await userAPI.updateFile(props.item.id, { name: newName.value.trim() })
    }

    emit('renamed')
    emit('update:visible', false)
    
  } catch (error) {
    console.error('Error renaming item:', error)
    const message = error.response?.data?.message || error.message || 'Failed to rename item'
    store.dispatch('showError', message)
  }
}

// Set current name when modal opens
watch(() => props.visible, (newVal) => {
  if (newVal && props.item) {
    newName.value = props.item.name || ''
    nextTick(() => {
      nameInput.value?.focus()
      nameInput.value?.select()
    })
  }
})
</script>