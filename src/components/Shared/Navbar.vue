<!-- components/Shared/Navbar.vue -->
<template>
  <div class="navbar bg-base-100 border-b border-base-200 px-4 sticky top-0 z-40">
    <!-- Mobile menu button -->
    <div class="navbar-start">
      <button 
        @click="$store.commit('TOGGLE_SIDEBAR')"
        class="btn btn-ghost btn-circle lg:hidden"
      >
        <i class="fas fa-bars text-lg"></i>
      </button>
      
      <!-- Logo pour desktop -->
      <div class="hidden lg:flex items-center">
        <img src="@/assets/logo.png" alt="Logo" class="w-8 h-8 mr-3">
        <h1 class="text-xl font-bold text-primary">{{ appName }}</h1>
      </div>
    </div>

    <!-- Center - Page title pour mobile -->
    <div class="navbar-center lg:hidden">
      <h2 class="text-lg font-semibold">{{ pageTitle }}</h2>
    </div>

    <!-- End - User menu -->
    <div class="navbar-end flex items-center gap-2">
      <!-- Theme Selector -->
      <div class="dropdown dropdown-end">
        <label tabindex="0" class="btn btn-ghost btn-circle" title="Changer le thème">
          <i class="fas fa-palette text-lg"></i>
        </label>
        <div tabindex="0" class="dropdown-content z-[1] card compact w-64 shadow-2xl bg-base-100 border border-base-200">
          <div class="card-body">
            <h3 class="card-title text-sm mb-3">
              <i class="fas fa-palette mr-2"></i>
              Choisir un thème
            </h3>
            <div class="grid grid-cols-2 gap-2">
              <button
                v-for="theme in availableThemes"
                :key="theme.value"
                @click="changeTheme(theme.value)"
                class="btn btn-sm justify-start"
                :class="{ 'btn-primary': currentTheme === theme.value, 'btn-ghost': currentTheme !== theme.value }"
              >
                <i :class="theme.icon" class="mr-2"></i>
                {{ theme.name }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Notifications -->
      <div class="dropdown dropdown-end">
        <label tabindex="0" class="btn btn-ghost btn-circle">
          <div class="indicator">
            <i class="fas fa-bell text-lg"></i>
            <span 
              v-if="$store.state.notifications.length > 0"
              class="badge badge-sm badge-primary indicator-item"
            >
              {{ $store.state.notifications.length }}
            </span>
          </div>
        </label>
        <div tabindex="0" class="dropdown-content z-[1] card compact w-80 shadow-2xl bg-base-100 border border-base-200">
          <div class="card-body">
            <h3 class="card-title text-sm mb-3">
              <i class="fas fa-bell mr-2"></i>
              Notifications
            </h3>
            <div v-if="$store.state.notifications.length === 0" class="text-center py-4">
              <i class="fas fa-bell-slash text-2xl opacity-30 mb-2"></i>
              <div class="text-sm opacity-60">Aucune notification</div>
            </div>
            <div 
              v-for="notification in $store.state.notifications" 
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

      <!-- User menu -->
      <div class="dropdown dropdown-end">
        <label tabindex="0" class="btn btn-ghost flex items-center gap-2">
          <div class="avatar">
            <div class="w-8 rounded-full bg-primary text-primary-content flex items-center justify-center">
              {{ userInitial }}
            </div>
          </div>
          <div class="hidden md:block text-left">
            <div class="text-sm font-medium">{{ $store.getters.username }}</div>
            <div class="text-xs opacity-60">{{ userRoleLabel }}</div>
          </div>
          <i class="fas fa-chevron-down text-xs opacity-60"></i>
        </label>
        
        <ul tabindex="0" class="menu menu-sm dropdown-content z-[1] p-2 shadow-2xl bg-base-100 rounded-box w-64 border border-base-200">
          <!-- User Info Header -->
          <li class="menu-title px-4 py-2">
            <div class="flex items-center space-x-3">
              <div class="avatar">
                <div class="w-10 rounded-full bg-primary text-primary-content flex items-center justify-center">
                  {{ userInitial }}
                </div>
              </div>
              <div>
                <div class="font-semibold">{{ $store.getters.username }}</div>
                <div class="text-xs opacity-60">{{ $store.getters.userEmail || 'Pas d\'email' }}</div>
                <div class="badge badge-xs mt-1" :class="$store.getters.isAdmin ? 'badge-primary' : 'badge-secondary'">
                  {{ userRoleLabel }}
                </div>
              </div>
            </div>
          </li>
          
          <div class="divider my-1"></div>
          
          <!-- Menu Items -->
          <li>
            <a @click="openProfile" class="flex items-center gap-3">
              <i class="fas fa-user text-primary"></i>
              <span>Mon profil</span>
            </a>
          </li>
          
          <li>
            <a @click="openSettings" class="flex items-center gap-3">
              <i class="fas fa-cog text-info"></i>
              <span>Paramètres</span>
            </a>
          </li>
          
          <li>
            <a @click="openHelp" class="flex items-center gap-3">
              <i class="fas fa-question-circle text-warning"></i>
              <span>Aide & Support</span>
            </a>
          </li>
          
          <div class="divider my-1"></div>
          
          <!-- Storage Info (pour les utilisateurs non-admin) -->
          <li v-if="!$store.getters.isAdmin">
            <div class="flex items-center justify-between p-2">
              <div class="flex items-center gap-2">
                <i class="fas fa-hdd text-accent"></i>
                <span class="text-xs">Stockage</span>
              </div>
              <div class="text-xs opacity-70">{{ storageUsage }}</div>
            </div>
          </li>
          
          <div v-if="!$store.getters.isAdmin" class="divider my-1"></div>
          
          <!-- Logout -->
          <li>
            <a @click="confirmLogout" class="text-error flex items-center gap-3">
              <i class="fas fa-sign-out-alt"></i>
              <span>Se déconnecter</span>
            </a>
          </li>
        </ul>
      </div>
    </div>

    <!-- Logout Confirmation Modal -->
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'

const store = useStore()
const router = useRouter()

const props = defineProps({
  pageTitle: {
    type: String,
    default: 'Tableau de bord'
  }
})

// Reactive data
const showLogoutModal = ref(false)
const currentTheme = ref('light')
const storageUsage = ref('0/0 MB')

const appName = 'Documents NAS'

// Available themes
const availableThemes = [
  { name: 'Clair', value: 'light', icon: 'fas fa-sun' },
  { name: 'Sombre', value: 'dark', icon: 'fas fa-moon' },
  { name: 'Cupcake', value: 'cupcake', icon: 'fas fa-heart' },
  { name: 'Bumblebee', value: 'bumblebee', icon: 'fas fa-star' },
  { name: 'Emerald', value: 'emerald', icon: 'fas fa-leaf' },
  { name: 'Corporate', value: 'corporate', icon: 'fas fa-building' },
  { name: 'Synthwave', value: 'synthwave', icon: 'fas fa-music' },
  { name: 'Retro', value: 'retro', icon: 'fas fa-tv' },
  { name: 'Cyberpunk', value: 'cyberpunk', icon: 'fas fa-robot' },
  { name: 'Valentine', value: 'valentine', icon: 'fas fa-heart' },
  { name: 'Halloween', value: 'halloween', icon: 'fas fa-ghost' },
  { name: 'Garden', value: 'garden', icon: 'fas fa-seedling' }
]

// Computed properties
const userInitial = computed(() => {
  return store.getters.username.charAt(0).toUpperCase()
})

const userRoleLabel = computed(() => {
  return store.getters.isAdmin ? 'Administrateur' : 'Utilisateur'
})

// Methods
const changeTheme = (theme) => {
  currentTheme.value = theme
  document.documentElement.setAttribute('data-theme', theme)
  localStorage.setItem('theme', theme)
  store.dispatch('showSuccess', `Thème "${getThemeName(theme)}" appliqué`)
}

const getThemeName = (value) => {
  const theme = availableThemes.find(t => t.value === value)
  return theme ? theme.name : value
}

const loadStorageInfo = async () => {
  if (!store.getters.isAdmin) {
    try {
      // Charger les informations de stockage pour les utilisateurs simples
      // Vous pouvez appeler votre API ici
      storageUsage.value = '150/2048 MB' // Exemple
    } catch (error) {
      console.error('Error loading storage info:', error)
    }
  }
}

const confirmLogout = () => {
  showLogoutModal.value = true
}

const handleLogout = () => {
  showLogoutModal.value = false
  store.dispatch('logout')
  router.push('/login')
}

const openProfile = () => {
  // Émettre un événement pour ouvrir le modal de profil ou naviguer
  store.dispatch('showInfo', 'Fonction profil à implémenter')
}

const openSettings = () => {
  store.dispatch('showInfo', 'Fonction paramètres à implémenter')
}

const openHelp = () => {
  store.dispatch('showInfo', 'Fonction aide à implémenter')
}

// Lifecycle
onMounted(() => {
  // Charger le thème sauvegardé
  const savedTheme = localStorage.getItem('theme') || 'light'
  currentTheme.value = savedTheme
  document.documentElement.setAttribute('data-theme', savedTheme)
  
  // Charger les infos de stockage
  loadStorageInfo()
})
</script>

<style scoped>
.navbar {
  min-height: 4rem;
}

.dropdown-content {
  max-height: 400px;
  overflow-y: auto;
}

.menu-title {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--fallback-bc, oklch(var(--bc)/0.6));
  margin-bottom: 0.5rem;
  padding-left: 1rem;
  padding-right: 1rem;
}

.avatar {
  flex-shrink: 0;
}

/* Animation pour le dropdown */
.dropdown[open] .dropdown-content {
  animation: dropdown-open 0.2s ease-out;
}

@keyframes dropdown-open {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Amélioration visuelle des notifications */
.alert-sm {
  padding: 0.5rem;
  min-height: auto;
}

.alert-success {
  --alert-bg: oklch(var(--su) / 0.2);
  --alert-bg-active: oklch(var(--su) / 0.25);
}

.alert-error {
  --alert-bg: oklch(var(--er) / 0.2);
  --alert-bg-active: oklch(var(--er) / 0.25);
}

.alert-warning {
  --alert-bg: oklch(var(--wa) / 0.2);
  --alert-bg-active: oklch(var(--wa) / 0.25);
}

.alert-info {
  --alert-bg: oklch(var(--in) / 0.2);
  --alert-bg-active: oklch(var(--in) / 0.25);
}
</style>