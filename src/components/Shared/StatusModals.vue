<!-- components/Shared/StatusModals.vue -->
<template>
  <!-- Success Modal -->
  <div v-if="successModal.visible" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white p-6 rounded-lg shadow-xl w-96 max-w-md">
      <div class="text-center">
        <div class="w-16 h-16 mx-auto bg-success/20 rounded-full flex items-center justify-center mb-4">
          <i class="fas fa-check text-success text-xl"></i>
        </div>
        <h3 class="font-bold text-lg mb-2">{{ successModal.title }}</h3>
        <p class="text-base-content/70 mb-6">{{ successModal.message }}</p>
        <button class="btn btn-primary" @click="$emit('close-success')">
          <i class="fas fa-thumbs-up mr-2"></i>
          Parfait !
        </button>
      </div>
    </div>
  </div>

  <!-- Error Modal -->
  <div v-if="errorModal.visible" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white p-6 rounded-lg shadow-xl w-96 max-w-md">
      <div class="text-center">
        <div class="w-16 h-16 mx-auto bg-error/20 rounded-full flex items-center justify-center mb-4">
          <i class="fas fa-exclamation-triangle text-error text-xl"></i>
        </div>
        <h3 class="font-bold text-lg mb-2">{{ errorModal.title }}</h3>
        <p class="text-base-content/70 mb-6">{{ errorModal.message }}</p>
        <button class="btn btn-primary" @click="$emit('close-error')">
          <i class="fas fa-times mr-2"></i>
          Fermer
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  successModal: {
    type: Object,
    default: () => ({
      visible: false,
      title: '',
      message: ''
    })
  },
  errorModal: {
    type: Object,
    default: () => ({
      visible: false,
      title: '',
      message: ''
    })
  }
})

defineEmits(['close-success', 'close-error'])
</script>