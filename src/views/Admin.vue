<template>
  <div class="p-4 space-y-4">
    <nav class="flex gap-2">
      <button v-for="t in tabs" :key="t.key"
              :class="['px-3 py-2 rounded border', t.key===tab && 'bg-gray-100']"
              @click="tab=t.key">{{ t.label }}</button>
    </nav>

    <component :is="current" />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

import Dashboard from '@/components/Admin/Dashboard.vue'
import UserManagement from '@/components/Admin/UserManagement.vue'
import GroupManagement from '@/components/Admin/GroupManagement.vue'
import FileExplorer from '@/components/Admin/FileExplorer.vue'
import PermissionManager from '@/components/Admin/PermissionManager.vue'
import AccessLogs from '@/components/Admin/AccessLogs.vue'

const tabs = [
  { key: 'dash', label: 'Tableau de bord', comp: Dashboard },
  { key: 'users', label: 'Utilisateurs', comp: UserManagement },
  { key: 'groups', label: 'Groupes', comp: GroupManagement },
  { key: 'explorer', label: 'Explorateur', comp: FileExplorer },
  { key: 'perms', label: 'Permissions', comp: PermissionManager },
  { key: 'logs', label: 'Journaux', comp: AccessLogs },
]
const tab = ref('dash')
const current = computed(() => tabs.find(t => t.key === tab.value)?.comp || Dashboard)
</script>
