<template>
  <div id="app">
    <!-- Notification globale -->
    <Notification 
      v-if="notification.show" 
      :message="notification.message" 
      :type="notification.type" 
      @close="hideNotification" 
    />
    
    <!-- Route principale -->
    <router-view />
  </div>
</template>

<script>
import { ref, onMounted, provide } from 'vue'
import { useStore } from 'vuex'
import Notification from './components/Shared/Notification.vue'

export default {
  name: 'App',
  components: { Notification },
  setup() {
    const store = useStore()
    const notification = ref({
      show: false,
      message: '',
      type: 'info'
    })

    const showNotification = (message, type = 'info') => {
      notification.value = { show: true, message, type }
      setTimeout(() => hideNotification(), 5000)
    }

    const hideNotification = () => {
      notification.value.show = false
    }

    provide('showNotification', showNotification)

    onMounted(async () => {
      if (store.state.token) {
        try {
          await store.dispatch('fetchUser')
        } catch (error) {
          console.error('Erreur lors du chargement des informations utilisateur:', error)
          store.commit('logout')
        }
      }
    })

    return {
      notification,
      hideNotification
    }
  }
}
</script>


<style>
/* Styles globaux */
#app {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

::selection {
  background-color: #3b82f6;
  color: white;
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
</style>