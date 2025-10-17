<!-- components/Shared/NotificationModal.vue -->
<template>
  <div v-if="show" class="modal modal-open">
    <div class="modal-box text-center">
      <h3 class="font-bold text-lg mb-4" :class="titleClass">
        {{ title }}
      </h3>
      <p class="mb-4">{{ message }}</p>
      <div class="modal-action justify-center">
        <button class="btn btn-primary" @click="closeModal">OK</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    default: 'info',
    validator: (value) => ['success', 'error', 'warning', 'info'].includes(value)
  }
})

const emit = defineEmits(['close'])

const title = computed(() => {
  const titles = {
    success: 'Succès',
    error: 'Erreur',
    warning: 'Attention',
    info: 'Information'
  }
  return titles[props.type] || 'Information'
})

const titleClass = computed(() => {
  const classes = {
    success: 'text-green-600',
    error: 'text-red-600',
    warning: 'text-yellow-600',
    info: 'text-blue-600'
  }
  return classes[props.type] || 'text-blue-600'
})

const closeModal = () => {
  emit('close')
}
</script>