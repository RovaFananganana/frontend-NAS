<template>
  <Modal
    :visible="visible"
    title="Share Item"
    show-confirm
    confirm-text="Share"
    @close="$emit('update:visible', false)"
    @confirm="shareItem"
  >
    <div class="space-y-4">
      <div v-if="item" class="alert alert-info">
        <i class="fas fa-share"></i>
        <span>Sharing: <strong>{{ item.name }}</strong></span>
      </div>

      <div class="form-control">
        <label class="label">
          <span class="label-text">Share with</span>
        </label>
        <div class="flex gap-2">
          <select v-model="shareType" class="select select-bordered">
            <option value="user">User</option>
            <option value="group">Group</option>
            <option value="email">Email</option>
          </select>
          <input 
            v-model="shareTarget" 
            type="text"
            :placeholder="getPlaceholder()"
            class="input input-bordered flex-1"
          />
        </div>
      </div>

      <div class="form-control">
        <label class="label">
          <span class="label-text">Permission Level</span>
        </label>
        <select v-model="permissionLevel" class="select select-bordered w-full">
          <option value="read">View Only</option>
          <option value="write">Can Edit</option>
          <option value="full">Full Access</option>
        </select>
      </div>

      <div class="form-control">
        <label class="label">
          <span class="label-text">Expiration (Optional)</span>
        </label>
        <input 
          v-model="expirationDate" 
          type="datetime-local"
          class="input input-bordered w-full"
        />
      </div>

      <div class="form-control">
        <label class="label cursor-pointer">
          <span class="label-text">Send notification email</span>
          <input 
            v-model="sendNotification" 
            type="checkbox" 
            class="checkbox" 
          />
        </label>
      </div>

      <div class="form-control">
        <label class="label">
          <span class="label-text">Message (Optional)</span>
        </label>
        <textarea 
          v-model="message"
          placeholder="Add a message for the recipient"
          class="textarea textarea-bordered"
          rows="3"
        ></textarea>
      </div>

      <!-- Current shares -->
      <div v-if="currentShares.length > 0" class="divider">Current Shares</div>
      <div v-if="currentShares.length > 0" class="space-y-2 max-h-32 overflow-y-auto">
        <div 
          v-for="share in currentShares" 
          :key="share.id"
          class="flex items-center justify-between p-2 bg-base-200 rounded"
        >
          <div class="flex items-center">
            <i class="fas mr-2" :class="share.type === 'user' ? 'fa-user' : 'fa-users'"></i>
            <span>{{ share.name }}</span>
            <span class="badge badge-sm ml-2">{{ share.permission }}</span>
          </div>
          <button 
            class="btn btn-ghost btn-xs text-error"
            @click="removeShare(share)"
          >
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>
    </div>
  </Modal>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useStore } from 'vuex'
import Modal from './Modal.vue'

const props = defineProps({
  visible: Boolean,
  item: Object
})

const emit = defineEmits(['update:visible', 'shared'])

const store = useStore()

// Form data
const shareType = ref('user')
const shareTarget = ref('')
const permissionLevel = ref('read')
const expirationDate = ref('')
const sendNotification = ref(true)
const message = ref('')
const currentShares = ref([])

const shareItem = async () => {
  if (!shareTarget.value.trim()) {
    store.dispatch('showError', 'Please specify who to share with')
    return
  }

  if (!props.item) {
    store.dispatch('showError', 'No item selected')
    return
  }

  try {
    const shareData = {
      item_id: props.item.id,
      item_type: props.item.type,
      share_type: shareType.value,
      target: shareTarget.value.trim(),
      permission_level: permissionLevel.value,
      expiration_date: expirationDate.value || null,
      send_notification: sendNotification.value,
      message: message.value.trim() || null
    }

    // This would call your sharing API endpoint
    // await shareAPI.createShare(shareData)
    
    // For now, simulate the API call
    console.log('Sharing item:', shareData)
    
    // Reset form
    resetForm()
    
    emit('shared')
    emit('update:visible', false)
    
    store.dispatch('showSuccess', `${props.item.name} shared successfully`)
    
  } catch (error) {
    console.error('Error sharing item:', error)
    const message = error.response?.data?.message || error.message || 'Failed to share item'
    store.dispatch('showError', message)
  }
}

const removeShare = async (share) => {
  try {
    // This would call your API to remove the share
    // await shareAPI.removeShare(share.id)
    
    currentShares.value = currentShares.value.filter(s => s.id !== share.id)
    store.dispatch('showSuccess', 'Share removed')
    
  } catch (error) {
    console.error('Error removing share:', error)
    store.dispatch('showError', 'Failed to remove share')
  }
}

const getPlaceholder = () => {
  switch (shareType.value) {
    case 'user':
      return 'Enter username'
    case 'group':
      return 'Enter group name'
    case 'email':
      return 'Enter email address'
    default:
      return 'Enter target'
  }
}

const resetForm = () => {
  shareType.value = 'user'
  shareTarget.value = ''
  permissionLevel.value = 'read'
  expirationDate.value = ''
  sendNotification.value = true
  message.value = ''
}

const loadCurrentShares = async () => {
  if (!props.item) return
  
  try {
    // This would load existing shares for the item
    // const response = await shareAPI.getItemShares(props.item.id)
    // currentShares.value = response.data
    
    // For now, simulate some existing shares
    currentShares.value = [
      { id: 1, name: 'john.doe', type: 'user', permission: 'read' },
      { id: 2, name: 'editors', type: 'group', permission: 'write' }
    ]
  } catch (error) {
    console.error('Error loading current shares:', error)
  }
}

// Load current shares when modal opens
watch(() => props.visible, (newVal) => {
  if (newVal) {
    loadCurrentShares()
  } else {
    resetForm()
  }
})
</script>