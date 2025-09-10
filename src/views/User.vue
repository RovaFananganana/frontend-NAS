<template>
  <div class="flex h-screen bg-base-100">
    <!-- Sidebar -->
    <Sidebar class="w-64 border-r" />

    <!-- Main content -->
    <div class="flex-1 flex flex-col">
      <!-- Navbar -->
      <Navbar class="w-full border-b" />

      <!-- Page content -->
      <div class="flex-1 overflow-auto p-6 space-y-4">
        <!-- Tabs -->
        <nav class="flex gap-2 mb-4">
          <button
            v-for="t in tabs"
            :key="t.key"
            :class="['px-3 py-2 rounded border', t.key === tab && 'bg-gray-100']"
            @click="tab = t.key"
          >
            {{ t.label }}
          </button>
        </nav>

        <!-- Dynamic component -->
        <component :is="current" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

import Navbar from '../components/Shared/Navbar.vue'
import Sidebar from '../components/Shared/Sidebar.vue'

import ProfileEditor from '@/components/User/ProfileEditor.vue'
import FileBrowser from '@/components/User/FileBrowser.vue'
import StorageInfo from '@/components/User/StorageInfo.vue'
import ActivityLogs from '@/components/User/ActivityLogs.vue'

const tabs = [
  { key: 'files', label: 'Mes fichiers', comp: FileBrowser },
  { key: 'profile', label: 'Mon profil', comp: ProfileEditor },
  { key: 'storage', label: 'Stockage', comp: StorageInfo },
  { key: 'logs', label: 'Journal d’activité', comp: ActivityLogs },
]

const tab = ref('files')
const current = computed(() => tabs.find(t => t.key === tab.value)?.comp || FileBrowser)
</script>
