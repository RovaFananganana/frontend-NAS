<template>
  <div v-if="visible" class="fixed top-4 right-4 z-50 max-w-sm w-full">
    <div 
      class="rounded-lg p-4 shadow-lg border transform transition-all duration-300 ease-in-out"
      :class="notificationClasses"
      role="alert"
      aria-live="polite"
    >
      <div class="flex items-start">
        <div class="flex-shrink-0">
          <!-- Icônes selon le type -->
          <svg v-if="type === 'success'" class="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          <svg v-else-if="type === 'error'" class="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <div class="ml-3 w-0 flex-1 pt-0.5">
          <p class="text-sm font-medium" :class="textClasses">{{ message }}</p>
        </div>
        <div class="ml-4 flex-shrink-0 flex">
          <button 
            @click="closeNotification"
            class="inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            aria-label="Fermer"
          >
            <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'

export default {
  name: 'Notification',
  props: {
    message: {
      type: String,
      required: true
    },
    type: {
      type: String,
      default: 'success',
      validator: (value) => ['success', 'error'].includes(value)
    }
  },
  setup() {
    const visible = ref(true)

    const notificationClasses = computed(() => {
      return 'bg-white border ' + (type === 'success' ? 'border-green-200' : 'border-red-200')
    })

    const textClasses = computed(() => {
      return type === 'success' ? 'text-green-800' : 'text-red-800'
    })

    const closeNotification = () => {
      visible.value = false
    }

    return { visible, notificationClasses, textClasses, closeNotification }
  }
}
</script>
