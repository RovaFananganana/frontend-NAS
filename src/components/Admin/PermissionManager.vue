<!-- components/Admin/PermissionManager.vue -->
<template>
  <div class="p-6">
    <!-- Matrice des permissions -->
    <div class="card bg-base-100 shadow-xl">
      <div class="card-body">
        <!-- <h2 class="card-title mb-4">
          <i class="fas fa-table mr-2"></i>
          Matrice des permissions
        </h2> -->

        <div class="overflow-x-auto">
          <table class="table table-zebra w-full">
            <thead>
              <tr>
                <th>Dossiers/Fichiers</th>
                <th>Utilisateurs</th>
                <!-- <th>Rôle</th> -->
                <th>Groupes</th>
                <th>Droits</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in users" :key="user.id">
                <!-- Identité utilisateur -->
                <td>
                  <div class="flex items-center space-x-3">
                    <div class="avatar">
                      <div class="mask mask-squircle w-8 h-8 bg-primary text-primary-content flex items-center justify-center">
                        {{ user.username.charAt(0).toUpperCase() }}
                      </div>
                    </div>
                    <div>
                      <div class="font-semibold">{{ user.username }}</div>
                      <div class="text-xs opacity-70">{{ user.email || 'Pas d\'email' }}</div>
                    </div>
                  </div>
                </td>

                <!-- Rôle -->
                <!-- <td>
                  <div class="badge" :class="user.role === 'ADMIN' ? 'badge-primary' : 'badge-secondary'">
                    {{ user.role === 'ADMIN' ? 'Admin' : 'Utilisateur' }}
                  </div>
                </td> -->

                <!-- Groupes -->
                <td>
                  <div class="flex flex-wrap gap-1">
                    <span v-for="group in getUserGroups(user)" :key="group.id" class="badge badge-outline badge-xs">
                      {{ group.name }}
                    </span>
                    <span v-if="getUserGroups(user).length === 0" class="text-xs opacity-50">
                      Aucun groupe
                    </span>
                  </div>
                </td>

                <!-- Cibles (dossiers/fichiers) -->
                <td>
                  <div class="flex flex-col gap-1">
                    <div v-for="perm in getUserPermissions(user)" :key="perm.target_id" class="text-xs flex items-center gap-2">
                      <i :class="perm.is_folder ? 'fas fa-folder' : 'fas fa-file'" />
                      {{ perm.target_name }}
                    </div>
                    <span v-if="getUserPermissions(user).length === 0" class="text-xs opacity-50">
                      Aucun
                    </span>
                  </div>
                </td>

                <!-- Permissions -->
                <td>
                  <div class="flex flex-wrap gap-1">
                    <div v-if="user.role === 'ADMIN'" class="badge badge-error badge-xs">
                      Accès total
                    </div>
                    <div
                      v-for="perm in getUserPermissions(user)"
                      :key="'perm-' + perm.id"
                      class="badge badge-info badge-xs cursor-pointer"
                      @click="togglePermission(user, perm)"
                      :title="'Cliquer pour modifier la permission'"
                    >
                      {{ formatPermission(perm.permission) }}
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { adminAPI } from '@/services/api'
import { useStore } from 'vuex'

const store = useStore()
const users = ref([])
const groups = ref([])
const permissions = ref([]) // Permissions récupérées via API
const loading = ref(false)

const loadData = async () => {
  loading.value = true
  try {
    const [usersRes, groupsRes, permsRes] = await Promise.all([
      adminAPI.getUsers(),
      adminAPI.getGroups(),
      adminAPI.getPermissions(), // <-- endpoint backend à prévoir
    ])
    users.value = usersRes.data || []
    groups.value = groupsRes.data || []
    permissions.value = permsRes.data || []
  } catch (err) {
    console.error('Erreur chargement:', err)
    store.dispatch('showError', 'Erreur lors du chargement des données')
  } finally {
    loading.value = false
  }
}

const getUserGroups = (user) => {
  return groups.value.filter(g => user.groups?.includes(g.name))
}

const getUserPermissions = (user) => {
  return permissions.value.filter(p => p.user_id === user.id)
}

const togglePermission = async (user, perm) => {
  try {
    const updated = await adminAPI.togglePermission(user.id, perm.id)
    const index = permissions.value.findIndex(p => p.id === perm.id)
    if (index !== -1) permissions.value[index] = updated.data
    store.dispatch('showSuccess', 'Permission mise à jour')
  } catch (err) {
    console.error('Erreur modification permission:', err)
    store.dispatch('showError', 'Impossible de modifier la permission')
  }
}

const formatPermission = (perm) => {
  switch (perm) {
    case 'read': return 'Lecture'
    case 'write': return 'Écriture'
    case 'delete': return 'Suppression'
    default: return perm
  }
}

onMounted(() => {
  loadData()
})
</script>
