<!-- views/User.vue -->
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
      <Navbar 
        :page-title="currentTabLabel"
        class="border-b border-base-300" 
      />

      <!-- Page content -->
      <div class="flex-1 overflow-auto">
        <!-- Dynamic component -->
        <component 
          :is="currentComponent" 
          :user-role="'user'" 
          :external-path="activeTab === 'files' ? currentPath : null"
          @navigate="handleTabChange"
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

// Import User components
import UserDashboard from '@/components/User/UserDashboard.vue'
import ProfileEditor from '@/components/User/ProfileEditor.vue'
import FileExplorer from '@/components/Shared/FileExplorer.vue'
import StorageInfo from '@/components/User/StorageInfo.vue'
import ActivityLogs from '@/components/User/ActivityLogs.vue'

// Tabs configuration
const tabs = [
  { key: 'dashboard', label: 'Dashboard', comp: UserDashboard },
  { key: 'files', label: 'Mes fichiers', comp: FileExplorer },
  { key: 'storage', label: 'Informations de stockage', comp: StorageInfo },
  { key: 'logs', label: 'Journal d\'activité', comp: ActivityLogs },
  { key: 'profile', label: 'Mon profil', comp: ProfileEditor },
]

// Reactive data
const activeTab = ref('dashboard')
const currentPath = ref('/')

// Computed properties
const currentComponent = computed(() => {
  const tab = tabs.find(t => t.key === activeTab.value)
  return tab ? tab.comp : UserDashboard
})

const currentTabLabel = computed(() => {
  const tab = tabs.find(t => t.key === activeTab.value)
  return tab ? tab.label : 'Dashboard'
})

// Methods
const handleTabChange = (tabKey) => {
  activeTab.value = tabKey
}

const handlePathChanged = (event) => {
  currentPath.value = event.newPath
}

const handleFavoriteNavigation = (event) => {
  // Switch to files tab and navigate to the favorite path
  activeTab.value = 'files'
  currentPath.value = event.path
  
  // If the FileExplorer component is available, navigate to the path
  // This will be handled by the FileExplorer component when it receives the path change
}
</script>

<style scoped>
/* Styles personnalisés si nécessaire */
</style>