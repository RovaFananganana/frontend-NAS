<template>
  <div class="fixed top-4 right-4 z-50 max-w-sm w-full">
    <div 
      class="rounded-lg p-4 shadow-lg border transform transition-all duration-300 ease-in-out"
      :class="notificationClasses"
      role="alert"
      aria-live="polite"
    >
      <div class="flex items-start">
        <div class="flex-shrink-0">
          <svg 
            v-if="type === 'success'" 
            class="h-6 w-6 text-green-400" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          <svg 
            v-else-if="type === 'error'" 
            class="h-6 w-6 text-red-400" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
          <svg 
            v-else-if="type === 'warning'" 
            class="h-6 w-6 text-yellow-400" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <svg 
            v-else 
            class="h-6 w-6 text-blue-400" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div class="ml-3 w-0 flex-1 pt-0.5">
          <p class="text-sm font-medium" :class="textClasses">
            {{ message }}
          </p>
        </div>
        <div class="ml-4 flex-shrink-0 flex">
          <button 
            @click="$emit('close')"
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
import { computed } from 'vue'

export default {
  name: 'Notification',
  props: {
    message: {
      type: String,
      required: true
    },
    type: {
      type: String,
      default: 'info',
      validator: (value) => ['info', 'success', 'warning', 'error'].includes(value)
    }
  },
  emits: ['close'],
  setup(props) {
    const notificationClasses = computed(() => {
      const baseClasses = 'bg-white'
      switch (props.type) {
        case 'success':
          return `${baseClasses} border-green-200`
        case 'error':
          return `${baseClasses} border-red-200`
        case 'warning':
          return `${baseClasses} border-yellow-200`
        default:
          return `${baseClasses} border-blue-200`
      }
    })

    const textClasses = computed(() => {
      switch (props.type) {
        case 'success':
          return 'text-green-800'
        case 'error':
          return 'text-red-800'
        case 'warning':
          return 'text-yellow-800'
        default:
          return 'text-blue-800'
      }
    })

    return {
      notificationClasses,
      textClasses
    }
  }
}
</script>