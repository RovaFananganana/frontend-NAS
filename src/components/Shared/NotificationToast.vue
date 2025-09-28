<template>
  <div class="toast toast-top toast-end z-[9999]">
    <div 
      v-for="notification in notifications" 
      :key="notification.id"
      :class="[
        'alert',
        'shadow-lg',
        'border',
        'min-w-80',
        'max-w-96',
        getNotificationClass(notification.type)
      ]"
      role="alert"
      aria-live="polite"
    >
      <div class="flex items-start w-full">
        <!-- Icône -->
        <div class="flex-shrink-0 mr-3">
          <i :class="getIconClass(notification.type)"></i>
        </div>
        
        <!-- Contenu -->
        <div class="flex-1 min-w-0">
          <div v-if="notification.title" class="font-semibold text-sm mb-1">
            {{ notification.title }}
          </div>
          <div class="text-sm break-words">
            {{ notification.message }}
          </div>
        </div>
        
        <!-- Bouton fermer -->
        <button 
          @click="removeNotification(notification.id)"
          class="btn btn-ghost btn-xs ml-2 flex-shrink-0"
          aria-label="Fermer la notification"
        >
          <i class="fas fa-times"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useStore } from 'vuex'

const store = useStore()

// Computed
const notifications = computed(() => store.state.notifications || [])

// Methods
const removeNotification = (id) => {
  store.commit('REMOVE_NOTIFICATION', id)
}

const getNotificationClass = (type) => {
  const classes = {
    success: 'alert-success border-success/20 bg-success/10',
    error: 'alert-error border-error/20 bg-error/10',
    warning: 'alert-warning border-warning/20 bg-warning/10',
    info: 'alert-info border-info/20 bg-info/10'
  }
  return classes[type] || classes.info
}

const getIconClass = (type) => {
  const icons = {
    success: 'fas fa-check-circle text-success',
    error: 'fas fa-exclamation-circle text-error',
    warning: 'fas fa-exclamation-triangle text-warning',
    info: 'fas fa-info-circle text-info'
  }
  return icons[type] || icons.info
}
</script>

<style scoped>
.toast {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 9999;
  pointer-events: none;
}

.toast .alert {
  pointer-events: auto;
  margin-bottom: 0.5rem;
  animation: slideInRight 0.3s ease-out;
  backdrop-filter: blur(10px);
}

.toast .alert:last-child {
  margin-bottom: 0;
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* Animation de sortie */
.toast .alert.removing {
  animation: slideOutRight 0.3s ease-in forwards;
}

@keyframes slideOutRight {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
}

/* Styles pour différents types de notifications */
.alert-success {
  --tw-border-opacity: 0.2;
  --tw-bg-opacity: 0.1;
}

.alert-error {
  --tw-border-opacity: 0.2;
  --tw-bg-opacity: 0.1;
}

.alert-warning {
  --tw-border-opacity: 0.2;
  --tw-bg-opacity: 0.1;
}

.alert-info {
  --tw-border-opacity: 0.2;
  --tw-bg-opacity: 0.1;
}

/* Assurer que les notifications sont au-dessus de tout */
.toast {
  z-index: 9999 !important;
}

/* Responsive design */
@media (max-width: 640px) {
  .toast {
    top: 0.5rem;
    right: 0.5rem;
    left: 0.5rem;
  }
  
  .toast .alert {
    min-width: auto;
    max-width: none;
  }
}
</style>