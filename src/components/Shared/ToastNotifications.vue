<!-- components/Shared/ToastNotifications.vue -->
<template>
  <div class="toast-container">
    <transition-group name="toast" tag="div">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="toast"
        :class="[`toast-${toast.type}`]"
        @click="removeToast(toast.id)"
      >
        <div class="toast-content">
          <i :class="getIcon(toast.type)"></i>
          <span class="toast-message">{{ toast.message }}</span>
        </div>
        <button class="toast-close" @click.stop="removeToast(toast.id)">
          <i class="fas fa-times"></i>
        </button>
      </div>
    </transition-group>
  </div>
</template>

<script>
import { useToast } from '@/services/useToast'

export default {
  name: 'ToastNotifications',
  setup() {
    const { toasts, remove } = useToast()

    const getIcon = (type) => {
      const icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        warning: 'fas fa-exclamation-triangle',
        info: 'fas fa-info-circle'
      }
      return icons[type] || icons.info
    }

    const removeToast = (id) => {
      remove(id)
    }

    return {
      toasts,
      getIcon,
      removeToast
    }
  }
}
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  max-width: 400px;
}

.toast {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  margin-bottom: 8px;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(8px);
  border: 1px solid transparent;
}

.toast:hover {
  transform: translateX(-4px);
}

.toast-content {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.toast-message {
  font-size: 14px;
  line-height: 1.4;
}

.toast-close {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 3px;
  margin-left: 8px;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.toast-close:hover {
  opacity: 1;
}

/* Toast types */
.toast-success {
  background: rgba(34, 197, 94, 0.9);
  color: white;
  border-color: #16a34a;
}

.toast-error {
  background: rgba(239, 68, 68, 0.9);
  color: white;
  border-color: #dc2626;
}

.toast-warning {
  background: rgba(245, 158, 11, 0.9);
  color: white;
  border-color: #d97706;
}

.toast-info {
  background: rgba(59, 130, 246, 0.9);
  color: white;
  border-color: #2563eb;
}

/* Animations */
.toast-enter-active {
  transition: all 0.3s ease-out;
}

.toast-leave-active {
  transition: all 0.3s ease-in;
}

.toast-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.toast-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

@media (max-width: 768px) {
  .toast-container {
    right: 10px;
    left: 10px;
    max-width: none;
  }
  
  .toast {
    margin-bottom: 6px;
  }
}
</style>