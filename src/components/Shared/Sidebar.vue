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
          <p class="text-xs text-base-content/60">Synology NAS</p>
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
          <li v-for="tab in adminTabs" :key="tab.key">
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
          <li v-for="tab in userTabs" :key="tab.key">
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

      <!-- Section utilisateur (en bas) -->
      <div class="mt-8 pt-4 border-t border-base-300">
        <div class="text-xs font-semibold text-base-content/60 uppercase tracking-wider mb-3">
          Mon compte
        </div>
        <ul class="menu p-0 space-y-1">
          <li v-if="!isAdmin">
            <a 
              @click="selectTab('profile')"
              :class="{ 'active bg-primary text-primary-content': activeTab === 'profile' }"
              class="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-base-300 transition-colors cursor-pointer"
            >
              <i class="fas fa-user w-5"></i>
              <span>Mon profil</span>
            </a>
          </li>
          <li>
            <a 
              @click="showSettings"
              class="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-base-300 transition-colors cursor-pointer"
            >
              <i class="fas fa-cog w-5"></i>
              <span>Paramètres</span>
            </a>
          </li>
        </ul>
      </div>
    </nav>

    <!-- User info at bottom -->
    <div class="absolute bottom-0 left-0 right-0 p-4 bg-base-300 border-t border-base-200">
      <div class="flex items-center space-x-3">
        <div class="avatar">
          <div class="w-10 rounded-full bg-primary text-primary-content flex items-center justify-center">
            {{ userInitial }}
          </div>
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium truncate text-base-content">{{ username }}</p>
          <p class="text-xs text-base-content/60">{{ userRoleLabel }}</p>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { computed, defineEmits } from 'vue'
import { useStore } from 'vuex'

const store = useStore()
const emit = defineEmits(['tab-changed'])

// Props
const props = defineProps({
  activeTab: {
    type: String,
    required: true
  }
})

// Computed properties
const isAdmin = computed(() => store.getters.isAdmin)
const username = computed(() => store.getters.username)
const userInitial = computed(() => username.value.charAt(0).toUpperCase())
const userRoleLabel = computed(() => isAdmin.value ? 'Administrateur' : 'Utilisateur')

// Tabs configuration
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
const selectTab = (tabKey) => {
  emit('tab-changed', tabKey)
}

const showSettings = () => {
  store.dispatch('showInfo', 'Paramètres à venir...')
}
</script>

<style scoped>
aside {
  position: relative;
  padding-bottom: 5rem; /* Espace pour l'info utilisateur */
}

.menu li > a {
  transition: all 0.2s ease;
}

.menu li > a:hover:not(.active) {
  background-color: var(--fallback-b3, oklch(var(--b3)));
}

.menu li > a.active {
  background-color: var(--fallback-p, oklch(var(--p)));
  color: var(--fallback-pc, oklch(var(--pc)));
}
</style>