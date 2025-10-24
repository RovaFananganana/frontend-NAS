// composables/useModals.js

import { ref } from 'vue'

export function useModals() {
  // Success modal state
  const successModal = ref({
    visible: false,
    title: '',
    message: ''
  })

  // Error modal state
  const errorModal = ref({
    visible: false,
    title: '',
    message: ''
  })

  // Success modal methods
  const showSuccessModal = (title, message) => {
    successModal.value = {
      visible: true,
      title,
      message
    }
  }

  const closeSuccessModal = () => {
    successModal.value.visible = false
  }

  // Error modal methods
  const showErrorModal = (title, message) => {
    errorModal.value = {
      visible: true,
      title,
      message
    }
  }

  const closeErrorModal = () => {
    errorModal.value.visible = false
  }

  // Close all modals
  const closeAllModals = () => {
    closeSuccessModal()
    closeErrorModal()
  }

  return {
    // State
    successModal,
    errorModal,
    
    // Methods
    showSuccessModal,
    closeSuccessModal,
    showErrorModal,
    closeErrorModal,
    closeAllModals
  }
}