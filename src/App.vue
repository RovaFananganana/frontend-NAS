<template>
  <div id="app">
    <!-- Route principale -->
    <router-view />
  </div>
</template>

<script>
import { initializeTheme } from './utils/themeUtils'
initializeTheme()
import { onMounted } from 'vue'
import { useStore } from 'vuex'
import TokenService from '@/services/tokenService'

export default {
  name: 'App',
  setup() {
    const store = useStore()
    
    onMounted(async () => {
      console.log('🚀 App.vue mounted')
      
      // Check if we have a token but no user data
      if (TokenService.hasToken() && !store.state.user) {
        console.log('🔄 Token exists but no user data, fetching user...')
        try {
          await store.dispatch('fetchCurrentUser')
          console.log('✅ User data fetched successfully')
        } catch (error) {
          console.error('❌ Error fetching user data:', error)
          console.log('🧹 Clearing invalid token...')
          store.dispatch('logout')
        }
      }
    })

    return {}
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