<template>
  <nav class="bg-blue-600 text-white shadow-lg">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between h-16">
        <div class="flex items-center">
          <!-- Logo de l'entreprise -->
          <img 
            src="@/assets/logo.png" 
            alt="Logo de l'entreprise" 
            class="h-8 w-auto mr-3"
          />
          <router-link to="/" class="text-xl font-bold">Synology NAS</router-link>
        </div>
        
        <div class="flex items-center space-x-4">
          <span class="text-sm">Bienvenue, {{ user.username }}</span>
          <span class="bg-blue-500 px-2 py-1 rounded text-xs">{{ user.role }}</span>
          <button 
            @click="logout"
            class="bg-blue-700 hover:bg-blue-800 px-3 py-1 rounded text-sm transition-colors"
          >
            Déconnexion
          </button>
        </div>
      </div>
    </div>
  </nav>
</template>

<script>
import { computed } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'

export default {
  name: 'Navbar',
  setup() {
    const store = useStore()
    const router = useRouter()
    
    const user = computed(() => store.state.user || { username: '', role: '' })
    
    const logout = () => {
      store.commit('logout')
      router.push('/login')
    }
    
    return {
      user,
      logout
    }
  }
}
</script>