<!-- components/Shared/Sidebar.vue -->
<template>
  <aside class="w-64 bg-base-200 min-h-screen">
    <!-- Logo section -->
    <div class="p-4 border-b border-base-300">
      <div class="flex items-center space-x-3">
        <img 
          src="@/assets/logo.png" 
          alt="Logo de l'entreprise" 
          class="h-10 w-auto"
        />
        <div>
          <h1 class="font-bold text-lg text-base-content">Documents NAS</h1>
        </div>
      </div>
    </div>

    <!-- Navigation -->
    <nav class="p-4">
      <!-- Section Admin -->
      <div v-if="isAdmin" class="space-y-2">
        <div class="text-xs font-semibold text-base-content/60 uppercase tracking-wider mb-3">
          Administration
        </div>
        <ul class="menu p-0 space-y-1">
          <li class="ml-4" v-for="tab in adminTabs" :key="tab.key">
            <a 
              @click="selectTab(tab.key)"
              :class="{ 'active bg-primary text-primary-content': activeTab === tab.key }"
              class="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-base-300 transition-colors cursor-pointer"
            >
              <i :class="tab.icon" class="w-5"></i>
              <span>{{ tab.label }}</span>
            </a>
          </li>
        </ul>
      </div>

      <!-- Section User -->
      <div v-else class="space-y-2">
        <div class="text-xs font-semibold text-base-content/60 uppercase tracking-wider mb-3">
          Navigation
        </div>
        <ul class="menu p-0 space-y-1">
          <li class="ml-4" v-for="tab in userTabs" :key="tab.key">
            <a 
              @click="selectTab(tab.key)"
              :class="{ 'active bg-primary text-primary-content': activeTab === tab.key }"
              class="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-base-300 transition-colors cursor-pointer"
            >
              <i :class="tab.icon" class="w-5"></i>
              <span>{{ tab.label }}</span>
            </a>
          </li>
        </ul>

        <!-- Section Favoris -->
        <div class="mt-6 pt-4 border-t border-base-300">
          <div class="text-xs font-semibold text-base-content/60 uppercase tracking-wider mb-3">
            Favoris
          </div>
          <div class="favorites-container">
            <FavoritesPanel
              ref="favoritesPanel"
              :current-path="currentPath"
              :compact="true"
              @navigate="handleFavoriteNavigation"
              @favorite-added="onFavoriteAdded"
              @favorite-removed="onFavoriteRemoved"
              @error="onFavoritesError"
            />
          </div>
        </div>
      </div>

      <!-- Section utilisateur -->
      <div class="mt-8 pt-4 border-t border-base-300">
        <div class="text-xs font-semibold text-base-content/60 uppercase tracking-wider mb-3">
          Mon compte
        </div>
        <ul class="menu p-0 space-y-1">
          <!-- Mon profil -->
          <li class="ml-4">
            <a 
              @click="openProfileModal"
              :class="{ 'active bg-primary text-primary-content': activeTab === 'profile' }"
              class="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-base-300 transition-colors cursor-pointer"
            >
               <i class="fas fa-user w-5"> </i>
              <span>Mon profil</span>
            </a>
          </li>

          <!-- Thème -->
         <li>
  <div class="dropdown dropdown-right w-full">
    <label 
      tabindex="0" 
      class="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-base-300 transition-colors cursor-pointer w-full"
    >
      <i class="fas fa-palette w-5"></i>
      <span>Thème</span>
      <i class="fas fa-chevron-right ml-auto text-xs"></i>
    </label>
    <div tabindex="0" class="dropdown-content z-[60] card w-64 shadow-xl bg-neutral text-neutral-content ml-2">
      <div class="card-body p-3">
        <h3 class="card-title text-sm mb-3">
          <i class="fas fa-palette mr-2"></i>
          Choisir un thème
        </h3>
        <div class="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
          <button
            v-for="theme in availableThemes"
            :key="theme.value"
            @click="changeTheme(theme.value)"
            class="btn btn-xs justify-start text-left"
            :class="{ 'btn-primary': currentTheme === theme.value, 'btn-ghost': currentTheme !== theme.value }"
          >
            <i :class="theme.icon" class="mr-1 text-xs"></i>
            {{ theme.name }}
          </button>
        </div>
      </div>
    </div>
  </div>
</li>

          <!-- Notifications -->
         <li>
  <div class="dropdown dropdown-right w-full">
    <label 
      tabindex="0" 
      class="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-base-300 transition-colors cursor-pointer w-full"
    >
      <div class="indicator">
        <i class="fas fa-bell w-5"></i>
        <span 
          v-if="$store.state.notifications && $store.state.notifications.length > 0"
          class="badge badge-xs badge-primary indicator-item"
        >
          {{ $store.state.notifications.length }}
        </span>
      </div>
      <span>Notifications</span>
      <i class="fas fa-chevron-right ml-auto text-xs"></i>
    </label>
    <div tabindex="0" class="dropdown-content z-[60] card w-80 shadow-xl bg-base-100 border border-base-200 ml-2">
      <div class="card-body p-3">
        <h3 class="card-title text-sm mb-2">
          <i class="fas fa-bell mr-2"></i>
          Notifications
        </h3>
        <div v-if="!$store.state.notifications || $store.state.notifications.length === 0" class="text-center py-4">
          <i class="fas fa-bell-slash text-xl opacity-30 mb-2"></i>
          <div class="text-xs opacity-60">Aucune notification</div>
        </div>
        <div class="max-h-48 overflow-y-auto">
          <div 
            v-for="notification in ($store.state.notifications || [])" 
            :key="notification.id"
            class="alert alert-sm mb-2 p-2"
            :class="`alert-${notification.type}`"
          >
            <div class="flex-1">
              <div class="font-medium text-xs">{{ notification.title }}</div>
              <div class="text-xs opacity-80">{{ notification.message }}</div>
            </div>
            <button 
              @click="$store.commit('REMOVE_NOTIFICATION', notification.id)"
              class="btn btn-ghost btn-xs"
            >
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</li>

          <!-- Déconnexion -->
          <li class="ml-4">
            <a 
              @click="confirmLogout" 
              class="text-error flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-base-300 transition-colors cursor-pointer"
            >
              <i class="fas fa-sign-out-alt w-5"></i>
              <span>Se déconnecter</span>
            </a>
          </li>
        </ul>
      </div>
    </nav>

    <!-- Modal Déconnexion -->
    <div v-if="showLogoutModal" class="modal modal-open">
      <div class="modal-box">
        <h3 class="font-bold text-lg mb-4">Confirmer la déconnexion</h3>
        <p class="py-4">Êtes-vous sûr de vouloir vous déconnecter ?</p>
        <div class="modal-action">
          <button class="btn" @click="showLogoutModal = false">Annuler</button>
          <button class="btn btn-error" @click="handleLogout">
            <i class="fas fa-sign-out-alt mr-2"></i>
            Se déconnecter
          </button>
        </div>
      </div>
    </div>

    <!-- Modal Profil -->
    <div v-if="showProfileModal" class="modal modal-open">
      <div class="modal-box max-w-lg">
        <h3 class="font-bold text-lg mb-4">Mon profil</h3>
        <div>
          <p><strong>Nom d’utilisateur :</strong> {{ username }}</p>
          <p><strong>Rôle :</strong> {{ userRoleLabel }}</p>
        </div>

        <div class="mt-6">
          <h4 class="font-semibold mb-2">Changer le mot de passe</h4>
          <input v-model="newPassword" type="password" placeholder="Nouveau mot de passe" class="input input-bordered w-full mb-2" />
          <input v-model="confirmPassword" type="password" placeholder="Confirmer le mot de passe" class="input input-bordered w-full mb-2" />
          <button class="btn btn-primary btn-sm" @click="changePassword">
            <i class="fas fa-key mr-2"></i>
            Mettre à jour
          </button>
        </div>

        <div class="modal-action">
          <button class="btn" @click="showProfileModal = false">Fermer</button>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { ref, computed, defineEmits, onMounted } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import FavoritesPanel from './FavoritesPanel.vue'

const store = useStore()
const router = useRouter()
const emit = defineEmits(['tab-changed', 'navigate-to-favorite'])

// Props
const props = defineProps({
  activeTab: {
    type: String,
    required: true
  },
  currentPath: {
    type: String,
    default: '/'
  }
})

// Reactive data
const showLogoutModal = ref(false)
const showProfileModal = ref(false)
const newPassword = ref('')
const confirmPassword = ref('')
const currentTheme = ref('light')
const storageUsage = ref('...')

// Computed properties
const isAdmin = computed(() => store.getters.isAdmin)
const username = computed(() => store.getters.username)
const userRoleLabel = computed(() => isAdmin.value ? 'Administrateur' : 'Utilisateur')

// Themes
import { availableThemes, applyTheme, getCurrentTheme } from '@/utils/themeUtils.js'

// Tabs
const adminTabs = [
  { key: 'dash', label: 'Tableau de bord', icon: 'fas fa-tachometer-alt' },
  { key: 'users', label: 'Utilisateurs', icon: 'fas fa-users' },
  { key: 'groups', label: 'Groupes', icon: 'fas fa-layer-group' },
  { key: 'explorer', label: 'Explorateur', icon: 'fas fa-folder-tree' },
  { key: 'perms', label: 'Permissions', icon: 'fas fa-key' },
  { key: 'logs', label: 'Journaux', icon: 'fas fa-list' }
]

const userTabs = [
  { key: 'files', label: 'Mes fichiers', icon: 'fas fa-folder' },
  { key: 'storage', label: 'Stockage', icon: 'fas fa-hdd' },
  { key: 'logs', label: 'Journal d\'activité', icon: 'fas fa-clock' }
]

// Methods
const selectTab = (tabKey) => emit('tab-changed', tabKey)

const openProfileModal = () => {
  showProfileModal.value = true
}

const changeTheme = (theme) => {
  currentTheme.value = theme
  applyTheme(theme)
  store.dispatch('showSuccess', `Thème "${theme}" appliqué`)
}

const changePassword = async () => {
  if (newPassword.value !== confirmPassword.value) {
    store.dispatch('showError', 'Les mots de passe ne correspondent pas')
    return
  }
  try {
    await store.dispatch('changePassword', { password: newPassword.value })
    store.dispatch('showSuccess', 'Mot de passe mis à jour avec succès')
    newPassword.value = ''
    confirmPassword.value = ''
    showProfileModal.value = false
  } catch (err) {
    store.dispatch('showError', 'Erreur lors du changement de mot de passe')
  }
}

const confirmLogout = () => { showLogoutModal.value = true }
const handleLogout = () => {
  showLogoutModal.value = false
  store.dispatch('logout')
  router.push('/login')
}

// Favorites methods
const handleFavoriteNavigation = (event) => {
  emit('navigate-to-favorite', event)
}

const onFavoriteAdded = (favorite) => {
  store.dispatch('showSuccess', `${favorite.name} ajouté aux favoris`)
}

const onFavoriteRemoved = (favorite) => {
  store.dispatch('showSuccess', `${favorite.name} retiré des favoris`)
}

const onFavoritesError = (error) => {
  store.dispatch('showError', error.message || 'Erreur dans le système de favoris')
}

// Lifecycle
onMounted(async () => {
  const savedTheme = getCurrentTheme()
  currentTheme.value = savedTheme
  applyTheme(savedTheme)

  if (!isAdmin.value) {
    try {
      const usage = await store.dispatch('fetchStorageInfo')
      storageUsage.value = usage || '0/0 MB'
    } catch {
      storageUsage.value = 'Erreur'
    }
  }
})
</script>

<style scoped>
.favorites-container {
  max-height: 300px;
  overflow-y: auto;
}

/* Scrollbar styling for favorites */
.favorites-container::-webkit-scrollbar {
  width: 4px;
}

.favorites-container::-webkit-scrollbar-track {
  background: transparent;
}

.favorites-container::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 2px;
}

.favorites-container::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}
</style>
