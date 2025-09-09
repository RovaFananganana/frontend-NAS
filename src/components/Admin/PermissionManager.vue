<!-- components/Admin/PermissionManager.vue -->
<template>
  <div class="p-6">
    <h1 class="text-3xl font-bold mb-6">Gestionnaire de permissions</h1>
    
    <div class="alert alert-info mb-6">
      <i class="fas fa-info-circle"></i>
      <div>
        <div class="font-bold">Gestion des appartenances</div>
        <div>Gérez l'appartenance des utilisateurs aux groupes pour contrôler leurs permissions.</div>
      </div>
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <!-- Left Column: Users and Group Assignment -->
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <h2 class="card-title mb-4">
            <i class="fas fa-user-plus mr-2"></i>
            Assigner des utilisateurs aux groupes
          </h2>

          <!-- Search Users -->
          <div class="form-control mb-4">
            <input
              v-model="userSearchQuery"
              type="text"
              placeholder="Rechercher un utilisateur..."
              class="input input-bordered"
            >
          </div>

          <!-- Users List -->
          <div v-if="loading" class="flex justify-center py-8">
            <span class="loading loading-spinner loading-lg"></span>
          </div>

          <div v-else class="space-y-3">
            <div
              v-for="user in filteredUsers"
              :key="user.id"
              class="border rounded-lg p-4 hover:bg-base-200 transition-colors"
            >
              <div class="flex items-center justify-between mb-3">
                <div class="flex items-center space-x-3">
                  <div class="avatar">
                    <div class="mask mask-squircle w-10 h-10 bg-primary text-primary-content flex items-center justify-center">
                      {{ user.username.charAt(0).toUpperCase() }}
                    </div>
                  </div>
                  <div>
                    <div class="font-semibold">{{ user.username }}</div>
                    <div class="text-sm opacity-70">{{ user.email || 'Pas d\'email' }}</div>
                  </div>
                </div>
                <div class="badge" :class="user.role === 'ADMIN' ? 'badge-primary' : 'badge-secondary'">
                  {{ user.role === 'ADMIN' ? 'Admin' : 'Utilisateur' }}
                </div>
              </div>

              <!-- Current Groups -->
              <div class="mb-3">
                <div class="text-sm font-medium mb-2">Groupes actuels:</div>
                <div v-if="getUserGroups(user).length > 0" class="flex flex-wrap gap-1">
                  <div
                    v-for="group in getUserGroups(user)"
                    :key="group.id"
                    class="badge badge-success gap-1"
                  >
                    {{ group.name }}
                    <button
                      class="btn btn-ghost btn-xs p-0"
                      @click="removeUserFromGroup(user, group)"
                      :disabled="updatingPermissions"
                    >
                      <i class="fas fa-times"></i>
                    </button>
                  </div>
                </div>
                <div v-else class="text-sm opacity-70">Aucun groupe</div>
              </div>

              <!-- Add to Group -->
              <div class="flex gap-2">
                <select
                  v-model="selectedGroupForUser[user.id]"
                  class="select select-bordered select-sm flex-1"
                >
                  <option value="">Choisir un groupe...</option>
                  <option
                    v-for="group in getAvailableGroupsForUser(user)"
                    :key="group.id"
                    :value="group.id"
                  >
                    {{ group.name }}
                  </option>
                </select>
                <button
                  class="btn btn-primary btn-sm"
                  @click="addUserToGroup(user)"
                  :disabled="!selectedGroupForUser[user.id] || updatingPermissions"
                >
                  <span v-if="updatingPermissions" class="loading loading-spinner loading-xs mr-1"></span>
                  Ajouter
                </button>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div v-if="filteredUsers.length === 0 && !loading" class="text-center py-8">
            <i class="fas fa-users text-4xl opacity-30 mb-4"></i>
            <p class="opacity-70">Aucun utilisateur trouvé</p>
          </div>
        </div>
      </div>

      <!-- Right Column: Groups and Their Members -->
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <h2 class="card-title mb-4">
            <i class="fas fa-layer-group mr-2"></i>
            Aperçu des groupes
          </h2>

          <div v-if="loading" class="flex justify-center py-8">
            <span class="loading loading-spinner loading-lg"></span>
          </div>

          <div v-else class="space-y-4">
            <div
              v-for="group in groups"
              :key="group.id"
              class="collapse collapse-arrow bg-base-200"
            >
              <input type="checkbox" />
              <div class="collapse-title">
                <div class="flex items-center justify-between">
                  <div class="flex items-center space-x-3">
                    <i class="fas fa-layer-group text-primary"></i>
                    <div>
                      <div class="font-semibold">{{ group.name }}</div>
                      <div class="text-sm opacity-70">
                        {{ getGroupMembers(group).length }} membre(s)
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="collapse-content">
                <div class="pt-2">
                  <div v-if="getGroupMembers(group).length > 0" class="space-y-2">
                    <div
                      v-for="member in getGroupMembers(group)"
                      :key="member.id"
                      class="flex items-center justify-between p-2 bg-base-100 rounded"
                    >
                      <div class="flex items-center space-x-2">
                        <div class="avatar">
                          <div class="mask mask-squircle w-8 h-8 bg-secondary text-secondary-content flex items-center justify-center">
                            {{ member.username.charAt(0).toUpperCase() }}
                          </div>
                        </div>
                        <div>
                          <div class="font-medium text-sm">{{ member.username }}</div>
                          <div class="text-xs opacity-70">{{ member.email || 'Pas d\'email' }}</div>
                        </div>
                      </div>
                      <button
                        class="btn btn-ghost btn-xs text-error"
                        @click="removeUserFromGroup(member, group)"
                        :disabled="updatingPermissions"
                        :title="'Retirer ' + member.username + ' du groupe'"
                      >
                        <i class="fas fa-times"></i>
                      </button>
                    </div>
                  </div>
                  <div v-else class="text-center py-4 opacity-70">
                    <i class="fas fa-user-friends text-2xl mb-2"></i>
                    <p class="text-sm">Aucun membre dans ce groupe</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div v-if="groups.length === 0 && !loading" class="text-center py-8">
            <i class="fas fa-layer-group text-4xl opacity-30 mb-4"></i>
            <p class="opacity-70">Aucun groupe disponible</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Permission Matrix -->
    <div class="card bg-base-100 shadow-xl mt-6">
      <div class="card-body">
        <h2 class="card-title mb-4">
          <i class="fas fa-table mr-2"></i>
          Matrice des permissions
        </h2>

        <div class="overflow-x-auto">
          <table class="table table-zebra w-full">
            <thead>
              <tr>
                <th>Utilisateur</th>
                <th>Rôle</th>
                <th>Groupes</th>
                <th>Permissions effectives</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in users" :key="user.id">
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
                <td>
                  <div class="badge" :class="user.role === 'ADMIN' ? 'badge-primary' : 'badge-secondary'">
                    {{ user.role === 'ADMIN' ? 'Admin' : 'Utilisateur' }}
                  </div>
                </td>
                <td>
                  <div class="flex flex-wrap gap-1">
                    <div
                      v-for="group in getUserGroups(user)"
                      :key="group.id"
                      class="badge badge-outline badge-xs"
                    >
                      {{ group.name }}
                    </div>
                    <div v-if="getUserGroups(user).length === 0" class="text-xs opacity-50">
                      Aucun groupe
                    </div>
                  </div>
                </td>
                <td>
                  <div class="flex flex-wrap gap-1">
                    <div v-if="user.role === 'ADMIN'" class="badge badge-error badge-xs">
                      Accès total
                    </div>
                    <div v-else class="badge badge-info badge-xs">
                      Accès limité
                    </div>
                    <div
                      v-for="group in getUserGroups(user)"
                      :key="'perm-' + group.id"
                      class="badge badge-warning badge-xs"
                    >
                      {{ group.name }}
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
import { ref, computed, onMounted, reactive } from 'vue'
import { adminAPI } from '@/services/api'
import { useStore } from 'vuex'

const store = useStore()

// Reactive data
const users = ref([])
const groups = ref([])
const loading = ref(false)
const updatingPermissions = ref(false)
const userSearchQuery = ref('')
const selectedGroupForUser = reactive({})

// Computed properties
const filteredUsers = computed(() => {
  if (!userSearchQuery.value) return users.value

  const query = userSearchQuery.value.toLowerCase()
  return users.value.filter(user =>
    user.username.toLowerCase().includes(query) ||
    (user.email && user.email.toLowerCase().includes(query))
  )
})

// Methods
const loadData = async () => {
  loading.value = true
  try {
    const [usersResponse, groupsResponse] = await Promise.all([
      adminAPI.getUsers(),
      adminAPI.getGroups()
    ])
    
    users.value = usersResponse.data || []
    groups.value = groupsResponse.data || []
  } catch (error) {
    console.error('Error loading data:', error)
    store.dispatch('showError', 'Erreur lors du chargement des données')
  } finally {
    loading.value = false
  }
}

const getUserGroups = (user) => {
  // Retourner les groupes auxquels appartient l'utilisateur
  // En supposant que l'API retourne user.groups ou qu'on doit croiser les données
  return user.groups?.map(groupName => {
    return groups.value.find(g => g.name === groupName)
  }).filter(Boolean) || []
}

const getGroupMembers = (group) => {
  // Retourner les membres du groupe
  return group.users || []
}

const getAvailableGroupsForUser = (user) => {
  const userGroupIds = new Set(getUserGroups(user).map(g => g.id))
  return groups.value.filter(group => !userGroupIds.has(group.id))
}

const addUserToGroup = async (user) => {
  const groupId = selectedGroupForUser[user.id]
  if (!groupId) return

  updatingPermissions.value = true
  try {
    await adminAPI.addUserToGroup(groupId, user.id)
    
    // Mettre à jour les données locales
    const group = groups.value.find(g => g.id === groupId)
    if (group) {
      if (!group.users) group.users = []
      group.users.push(user)
    }
    
    // Mettre à jour les groupes de l'utilisateur
    if (!user.groups) user.groups = []
    user.groups.push(group.name)
    
    selectedGroupForUser[user.id] = ''
    store.dispatch('showSuccess', `${user.username} ajouté au groupe ${group.name}`)
  } catch (error) {
    console.error('Error adding user to group:', error)
    const message = error.response?.data?.msg || 'Erreur lors de l\'ajout'
    store.dispatch('showError', message)
  } finally {
    updatingPermissions.value = false
  }
}

const removeUserFromGroup = async (user, group) => {
  updatingPermissions.value = true
  try {
    await adminAPI.removeUserFromGroup(group.id, user.id)
    
    // Mettre à jour les données locales
    if (group.users) {
      group.users = group.users.filter(u => u.id !== user.id)
    }
    
    // Mettre à jour les groupes de l'utilisateur
    if (user.groups) {
      user.groups = user.groups.filter(groupName => groupName !== group.name)
    }
    
    store.dispatch('showSuccess', `${user.username} retiré du groupe ${group.name}`)
  } catch (error) {
    console.error('Error removing user from group:', error)
    const message = error.response?.data?.msg || 'Erreur lors du retrait'
    store.dispatch('showError', message)
  } finally {
    updatingPermissions.value = false
  }
}

// Lifecycle
onMounted(() => {
  loadData()
})
</script>

<style scoped>
.collapse-title {
  min-height: auto;
  padding: 1rem;
}

.collapse-content {
  padding: 0 1rem 1rem 1rem;
}
</style>