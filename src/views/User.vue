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
          @visible-storage-updated="handleVisibleStorageUpdated"
          :visible-bytes="visibleStorageBytes"
          :key="activeTab === 'files' ? `files-${componentKey}` : activeTab"
          @path-changed="handlePathChanged"
          @error="handleFileExplorerError"
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
  // Vérifier si tabKey est une string (clic sur onglet) ou un objet (événement de navigation)
  if (typeof tabKey === 'object') {
    return
  }
  
  activeTab.value = tabKey
  
  // Si on clique sur "Mes fichiers", remettre le chemin à la racine
  if (tabKey === 'files') {
    currentPath.value = '/'
    // Forcer le re-render pour s'assurer que le changement est pris en compte
    componentKey.value++
  }
}

const handlePathChanged = (event) => {
  currentPath.value = event.newPath
}

// Visible storage bytes reported by FileExplorer (sum of visible file sizes)
const visibleStorageBytes = ref(null)

const handleVisibleStorageUpdated = (bytes) => {
  visibleStorageBytes.value = bytes
}

// Debug watcher to help confirm the visible storage flow
import { watch } from 'vue'
watch(visibleStorageBytes, (v) => {
  console.debug('User.vue: visibleStorageBytes updated ->', v)
})

const handleFavoriteNavigation = (event) => {
  // If the favorite indicates an openFile, open that file directly via FileExplorer
  activeTab.value = 'files'

  // Use nextTick to ensure FileExplorer is mounted before interacting with it
  nextTick(() => {
    // If event.openFile is provided (favorite was a file), set externalPath to the parent folder and
    // request opening the file afterwards via emitting a custom prop on FileExplorer
    if (event.openFile) {
      const filePath = event.openFile
      const parent = filePath.split('/').slice(0, -1).join('/') || '/'
      currentPath.value = parent
      componentKey.value++

      // After a short delay to allow FileExplorer to load, emit a navigation event that parents can use
      setTimeout(() => {
        // Emit an event upward to indicate we want to open a file after navigation
        // Parent FileExplorer listens to 'navigate' and should handle opening if openFile is present
        // We reuse the existing 'navigate' contract
        // Note: emit from this view to higher-level components listening
        // Using window event as a simple cross-component signal
        window.dispatchEvent(new CustomEvent('open-file-after-nav', { detail: { path: filePath } }))
      }, 300)
    } else {
      currentPath.value = event.path
      componentKey.value++
    }
  })
}

const handleFileExplorerError = (errorEvent) => {
  // Si c'est une erreur de navigation (breadcrumb, etc.), ne pas rediriger vers la racine
  // Laisser l'utilisateur où il était
  if (errorEvent.source === 'breadcrumb') {
    return
  }
  
  // Pour d'autres types d'erreurs, on peut décider de rediriger vers la racine
  if (errorEvent.path !== '/') {
    currentPath.value = '/'
    componentKey.value++
  }
}
</script>

<style scoped>
/* Styles personnalisés si nécessaire */
</style>