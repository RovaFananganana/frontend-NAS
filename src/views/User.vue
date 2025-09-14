<!-- views/User.vue -->
<template>
  <div class="flex h-screen bg-base-100">
    <!-- Sidebar -->
    <Sidebar 
      :activeTab="activeTab" 
      @tab-changed="handleTabChange"
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
        <component :is="currentComponent" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

import Navbar from '../components/Shared/Navbar.vue'
import Sidebar from '../components/Shared/Sidebar.vue'

// Import User components
import ProfileEditor from '@/components/User/ProfileEditor.vue'
import FileBrowser from '@/components/User/FileBrowser.vue'
import EnhancedFileBrowser from '@/components/User/EnhancedFileBrowser.vue'
import StorageInfo from '@/components/User/StorageInfo.vue'
import ActivityLogs from '@/components/User/ActivityLogs.vue'

// Tabs configuration
const tabs = [
  { key: 'files', label: 'Mes fichiers', comp: EnhancedFileBrowser },
  { key: 'storage', label: 'Informations de stockage', comp: StorageInfo },
  { key: 'logs', label: 'Journal d\'activité', comp: ActivityLogs },
  { key: 'profile', label: 'Mon profil', comp: ProfileEditor },
]

// Reactive data
const activeTab = ref('files')

// Computed properties
const currentComponent = computed(() => {
  const tab = tabs.find(t => t.key === activeTab.value)
  return tab ? tab.comp : EnhancedFileBrowser
})

const currentTabLabel = computed(() => {
  const tab = tabs.find(t => t.key === activeTab.value)
  return tab ? tab.label : 'Mes fichiers'
})

// Methods
const handleTabChange = (tabKey) => {
  activeTab.value = tabKey
}
</script>

<style scoped>
/* Styles personnalisés si nécessaire */
</style>