<template>
  
  <aside class="w-64 bg-gray-100 min-h-screen p-4">
    <!-- Logo dans le sidebar -->
    <div class="mb-6 p-4 bg-white rounded-lg shadow-sm">
      <img 
        src="@/assets/logo.png" 
        alt="Logo de l'entreprise" 
        class="h-10 w-auto mx-auto"
      />
      <p class="text-center text-sm text-gray-600 mt-2">Synology NAS</p>
    </div>
    <nav>
      <ul class="space-y-2">
    
        <template v-if="isAdmin">
          <li>
            <router-link 
              to="/admin/dashboard" 
              class="block px-4 py-2 rounded hover:bg-blue-100 text-gray-700 hover:text-blue-600 transition-colors"
              active-class="bg-blue-100 text-blue-600"
            >
              Tableau de bord
            </router-link>
          </li>
          <li>
            <router-link 
              to="/admin/users" 
              class="block px-4 py-2 rounded hover:bg-blue-100 text-gray-700 hover:text-blue-600 transition-colors"
              active-class="bg-blue-100 text-blue-600"
            >
              Utilisateurs
            </router-link>
          </li>
          <li>
            <router-link 
              to="/admin/groups" 
              class="block px-4 py-2 rounded hover:bg-blue-100 text-gray-700 hover:text-blue-600 transition-colors"
              active-class="bg-blue-100 text-blue-600"
            >
              Groupes
            </router-link>
          </li>
          <li>
            <router-link 
              to="/admin/files" 
              class="block px-4 py-2 rounded hover:bg-blue-100 text-gray-700 hover:text-blue-600 transition-colors"
              active-class="bg-blue-100 text-blue-600"
            >
              Fichiers
            </router-link>
          </li>
          <li>
            <router-link 
              to="/admin/logs" 
              class="block px-4 py-2 rounded hover:bg-blue-100 text-gray-700 hover:text-blue-600 transition-colors"
              active-class="bg-blue-100 text-blue-600"
            >
              Logs d'accès
            </router-link>
          </li>
        </template>
        <template v-else>
          <li>
            <router-link 
              to="/user/files" 
              class="block px-4 py-2 rounded hover:bg-blue-100 text-gray-700 hover:text-blue-600 transition-colors"
              active-class="bg-blue-100 text-blue-600"
            >
              Mes fichiers
            </router-link>
          </li>
          <li>
            <router-link 
              to="/user/storage" 
              class="block px-4 py-2 rounded hover:bg-blue-100 text-gray-700 hover:text-blue-600 transition-colors"
              active-class="bg-blue-100 text-blue-600"
            >
              Stockage
            </router-link>
          </li>
          <li>
            <router-link 
              to="/user/activity" 
              class="block px-4 py-2 rounded hover:bg-blue-100 text-gray-700 hover:text-blue-600 transition-colors"
              active-class="bg-blue-100 text-blue-600"
            >
              Activité
            </router-link>
          </li>
          <li>
            <router-link 
              to="/user/profile" 
              class="block px-4 py-2 rounded hover:bg-blue-100 text-gray-700 hover:text-blue-600 transition-colors"
              active-class="bg-blue-100 text-blue-600"
            >
              Profil
            </router-link>
          </li>
        </template>
      </ul>
    </nav>
  </aside>
</template>

<script>
import { computed } from 'vue'
import { useStore } from 'vuex'

export default {
  name: 'Sidebar',
  setup() {
    const store = useStore()
    const isAdmin = computed(() => store.state.isAdmin)
    
    return {
      isAdmin
    }
  }
}
</script>