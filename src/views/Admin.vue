<!-- views/Admin.vue -->
<template>
  <div class="flex h-screen bg-base-100">
    <!-- Sidebar -->
    <Sidebar 
      :activeTab="activeTab" 
      :currentPath="currentPath"
      @tab-changed="handleTabChange" 
      @navigate-to-favorite="handleFavoriteNavigation"
      class="border-r border-base-300" 
    />

    <!-- Main content -->
    <div class="flex-1 flex flex-col">
      <!-- Navbar -->
      <Navbar :page-title="currentTabLabel" class="border-b border-base-300" />

      <!-- Page content -->
      <div class="flex-1 overflow-auto">
        <!-- Dynamic component -->
        <component 
          :is="currentComponent" 
          :user-role="'admin'" 
          :external-path="activeTab === 'explorer' ? currentPath : null"
          @path-changed="handlePathChanged"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

import Navbar from '../components/Shared/Navbar.vue'
import Sidebar from '../components/Shared/Sidebar.vue'

// Import Admin components
import Dashboard from '@/components/Admin/Dashboard.vue'
import UserManagement from '@/components/Admin/UserManagement.vue'
import GroupManagement from '@/components/Admin/GroupManagement.vue'
import FileExplorer from '@/components/Shared/FileExplorer.vue'
import PermissionManager from '@/components/Admin/PermissionManager.vue'
import AccessLogs from '@/components/Admin/AccessLogs.vue'

// Tabs configuration
const tabs = [
  { key: 'dash', label: 'Tableau de bord', comp: Dashboard },
  { key: 'users', label: 'Gestion des utilisateurs', comp: UserManagement },
  { key: 'groups', label: 'Gestion des groupes', comp: GroupManagement },
  { key: 'explorer', label: 'Explorateur de fichiers', comp: FileExplorer },
  { key: 'perms', label: 'Gestionnaire de permissions', comp: PermissionManager },
  { key: 'logs', label: 'Journaux d\'accès', comp: AccessLogs },
]

// Reactive data
const activeTab = ref('dash')
const currentPath = ref('/')

// Computed properties
const currentComponent = computed(() => {
  const tab = tabs.find(t => t.key === activeTab.value)
  return tab ? tab.comp : Dashboard
})

const currentTabLabel = computed(() => {
  const tab = tabs.find(t => t.key === activeTab.value)
  return tab ? tab.label : 'Tableau de bord'
})

// Methods
const handleTabChange = (tabKey) => {
  activeTab.value = tabKey
}

const handlePathChanged = (event) => {
  currentPath.value = event.newPath
}

const handleFavoriteNavigation = (event) => {
  // Switch to explorer tab and navigate to the favorite path
  activeTab.value = 'explorer'
  currentPath.value = event.path
}
</script>

<style scoped>
/* Styles personnalisés si nécessaire */
</style>