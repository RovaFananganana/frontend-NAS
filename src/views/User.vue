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
          :key="activeTab === 'files' ? `files-${componentKey}` : activeTab"
          @navigate="handleTabChange"
          @path-changed="handlePathChanged"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'

import Navbar from '../components/Shared/Navbar.vue'
import Sidebar from '../components/Shared/Sidebar.vue'

// Import User components
import ProfileEditor from '@/components/User/ProfileEditor.vue'
import FileExplorer from '@/components/Shared/FileExplorer.vue'
import StorageInfo from '@/components/User/StorageInfo.vue'
import ActivityLogs from '@/components/User/ActivityLogs.vue'

// Tabs configuration
const tabs = [
  { key: 'files', label: 'Mes fichiers', comp: FileExplorer },
  { key: 'storage', label: 'Informations de stockage', comp: StorageInfo },
  { key: 'logs', label: 'Journal d\'activité', comp: ActivityLogs },
  { key: 'profile', label: 'Mon profil', comp: ProfileEditor },
]

// Reactive data
const activeTab = ref('files') // Commencer directement sur les fichiers au lieu du dashboard
const currentPath = ref('/')

// Clé pour forcer le re-render du composant FileExplorer
const componentKey = ref(0)

// Computed properties
const currentComponent = computed(() => {
  const tab = tabs.find(t => t.key === activeTab.value)
  return tab ? tab.comp : FileExplorer
})

const currentTabLabel = computed(() => {
  const tab = tabs.find(t => t.key === activeTab.value)
  return tab ? tab.label : 'Mes fichiers'
})

// Methods
const handleTabChange = (tabKey) => {
  console.log('🔄 User.vue: Tab changed to:', tabKey)
  activeTab.value = tabKey
  
  // Si on clique sur "Mes fichiers", remettre le chemin à la racine
  if (tabKey === 'files') {
    console.log('✅ User.vue: Resetting path to root for "Mes fichiers"')
    currentPath.value = '/'
    // Forcer le re-render pour s'assurer que le changement est pris en compte
    componentKey.value++
  }
}

const handlePathChanged = (event) => {
  console.log('🔄 User.vue: Path changed from', event.oldPath, 'to', event.newPath)
  currentPath.value = event.newPath
}

const handleFavoriteNavigation = (event) => {
  console.log('🔄 User.vue: Handling favorite navigation to:', event.path)
  
  // Les favoris ne fonctionnent que dans le contexte FileExplorer
  // On doit basculer vers l'onglet "files" et mettre à jour le chemin
  activeTab.value = 'files'
  
  // Utiliser nextTick pour s'assurer que le composant FileExplorer est monté
  // avant de changer le chemin
  nextTick(() => {
    currentPath.value = event.path
    // Forcer le re-render du composant pour s'assurer que le changement est pris en compte
    componentKey.value++
    console.log('✅ User.vue: Path updated to:', event.path, 'componentKey:', componentKey.value)
  })
}
</script>

<style scoped>
/* Styles personnalisés si nécessaire */
</style>