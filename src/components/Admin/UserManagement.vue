<!-- components/Admin/UserManagement.vue -->
<template>
  <div class="p-6">
    <!-- Top bar : Search + Role Filter + New User Button -->
    <div class="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
      <div class="flex flex-1 gap-2">
        <div class="form-control flex-1">
          <div class="input-group">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Rechercher par nom ou email..."
              class="input input-bordered w-full"
            >
          </div>
        </div>

        <select v-model="roleFilter" class="select select-bordered w-40">
          <option value="">Tous les rôles</option>
          <option value="ADMIN">Administrateurs</option>
          <option value="SIMPLE_USER">Utilisateurs simples</option>
        </select>
      </div>

      <div>
        <button
          class="btn btn-primary btn-circle"
          @click="openCreateModal"
          title="Nouvel utilisateur"
        >
          <i class="fas fa-plus"></i>
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center py-12">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <!-- Users Table -->
    <div v-else class="card bg-base-100 shadow-xl">
      <div class="card-body p-0">
        <div class="overflow-x-auto">
          <table class="table table-zebra w-full">
            <thead>
              <tr>
                <th>Utilisateur</th>
                <th>Email</th>
                <th>Rôle</th>
                <th>Quota</th>
                <th>Groupes</th>
                <th>Créé le</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in filteredUsers" :key="user.id">
                <td>
                  <div>
                    <div class="font-bold text-primary">{{ user.username }}</div>
                    <div class="text-sm opacity-50">#{{ user.id }}</div>
                  </div>
                </td>
                <td>{{ user.email || 'Non défini' }}</td>
                <td>
                  <div class="badge" :class="user.role === 'ADMIN' ? 'badge-primary' : 'badge-secondary'">
                    {{ user.role === 'ADMIN' ? 'Admin' : 'Utilisateur' }}
                  </div>
                </td>
                <td>{{ user.quota_mb || 2048 }} MB</td>
                <td>
                  <div class="flex flex-wrap gap-1">
                    <div
                      v-for="group in user.groups?.slice(0, 2) || []"
                      :key="group"
                      class="badge badge-outline badge-xs"
                    >
                      {{ group }}
                    </div>
                    <div
                      v-if="user.groups?.length > 2"
                      class="badge badge-outline badge-xs"
                    >
                      +{{ user.groups.length - 2 }}
                    </div>
                  </div>
                </td>
                <td>{{ formatDate(user.created_at) }}</td>
                <td>
                  <div class="flex gap-2">
                    <button
                      class="btn btn-ghost btn-xs"
                      @click="openEditModal(user)"
                      :title="'Modifier ' + user.username"
                    >
                      <i class="fas fa-edit"></i>
                    </button>
                    <button
                      class="btn btn-ghost btn-xs text-error"
                      @click="confirmDeleteUser(user)"
                      :title="'Supprimer ' + user.username"
                    >
                      <i class="fas fa-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Empty State -->
        <div v-if="filteredUsers.length === 0 && !loading" class="text-center py-12">
          <i class="fas fa-users text-6xl opacity-30 mb-4"></i>
          <p class="text-xl opacity-70 mb-2">Aucun utilisateur trouvé</p>
          <p class="opacity-50">{{ searchQuery ? 'Essayez de modifier votre recherche' : 'Créez votre premier utilisateur' }}</p>
        </div>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <div v-if="showModal" class="modal modal-open">
      <div class="modal-box max-w-2xl">
        <h3 class="font-bold text-lg mb-4">
          {{ editingUser ? 'Modifier l\'utilisateur' : 'Créer un utilisateur' }}
        </h3>

        <form @submit.prevent="saveUser" class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Username -->
            <div class="form-control">
              <label class="label">
                <span class="label-text">Nom d'utilisateur *</span>
              </label>
              <input
                v-model="userForm.username"
                type="text"
                class="input input-bordered"
                :class="{ 'input-error': errors.username }"
                required
              >
              <label v-if="errors.username" class="label">
                <span class="label-text-alt text-error">{{ errors.username }}</span>
              </label>
            </div>

            <!-- Email -->
            <div class="form-control">
              <label class="label">
                <span class="label-text">Email</span>
              </label>
              <input
                v-model="userForm.email"
                type="email"
                class="input input-bordered"
                :class="{ 'input-error': errors.email }"
              >
              <label v-if="errors.email" class="label">
                <span class="label-text-alt text-error">{{ errors.email }}</span>
              </label>
            </div>

            <!-- Password -->
            <div class="form-control">
              <label class="label">
                <span class="label-text">
                  {{ editingUser ? 'Nouveau mot de passe (optionnel)' : 'Mot de passe *' }}
                </span>
              </label>
              <div class="input-group">
                <input
                  v-model="userForm.password"
                  :type="showPassword ? 'text' : 'password'"
                  class="input input-bordered flex-1"
                  :class="{ 'input-error': errors.password }"
                  :required="!editingUser"
                >
                <button
                  type="button"
                  class="btn btn-square"
                  @click="showPassword = !showPassword"
                >
                  <i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                </button>
              </div>
              <label v-if="errors.password" class="label">
                <span class="label-text-alt text-error">{{ errors.password }}</span>
              </label>
            </div>

            <!-- Role -->
            <div class="form-control">
              <label class="label">
                <span class="label-text">Rôle</span>
              </label>
              <select v-model="userForm.role" class="select select-bordered">
                <option value="SIMPLE_USER">Utilisateur simple</option>
                <option value="ADMIN">Administrateur</option>
              </select>
            </div>

            <!-- Quota -->
            <div class="form-control md:col-span-2">
              <label class="label">
                <span class="label-text">Quota de stockage (MB)</span>
              </label>
              <input
                v-model.number="userForm.quota_mb"
                type="number"
                min="1"
                class="input input-bordered"
              >
            </div>
          </div>

          <div class="modal-action">
            <button type="button" class="btn" @click="closeModal">Annuler</button>
            <button
              type="submit"
              class="btn btn-primary"
              :disabled="saving"
            >
              <span v-if="saving" class="loading loading-spinner loading-xs mr-2"></span>
              {{ editingUser ? 'Modifier' : 'Créer' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="userToDelete" class="modal modal-open">
      <div class="modal-box">
        <h3 class="font-bold text-lg">Confirmer la suppression</h3>
        <p class="py-4">
          Êtes-vous sûr de vouloir supprimer l'utilisateur <strong>{{ userToDelete.username }}</strong> ?
          Cette action est irréversible.
        </p>
        <div class="modal-action">
          <button class="btn" @click="userToDelete = null">Annuler</button>
          <button
            class="btn btn-error"
            @click="deleteUser"
            :disabled="deleting"
          >
            <span v-if="deleting" class="loading loading-spinner loading-xs mr-2"></span>
            Supprimer
          </button>
        </div>
      </div>
    </div>

    <!-- === Notification Modal === -->
    <div v-if="notificationModal.show" class="modal modal-open">
      <div class="modal-box text-center">
        <h3
          class="font-bold text-lg mb-4"
          :class="notificationModal.type === 'success' ? 'text-green-600' : 'text-red-600'"
        >
          {{ notificationModal.type === 'success' ? 'Succès' : 'Erreur' }}
        </h3>
        <p class="mb-4">{{ notificationModal.message }}</p>
        <div class="modal-action justify-center">
          <button class="btn btn-primary" @click="closeNotificationModal">OK</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { adminAPI } from '@/services/api'

// === Reactive State ===
const users = ref([])
const loading = ref(false)
const saving = ref(false)
const deleting = ref(false)
const showModal = ref(false)
const showPassword = ref(false)
const editingUser = ref(null)
const userToDelete = ref(null)
const searchQuery = ref('')
const roleFilter = ref('')

const userForm = ref({
  username: '',
  email: '',
  password: '',
  role: 'SIMPLE_USER',
  quota_mb: 2048
})

const errors = ref({})

// === Notification Modal ===
const notificationModal = ref({
  show: false,
  message: '',
  type: 'success'
})

const showNotificationModal = (message, type = 'success') => {
  notificationModal.value = { show: true, message, type }
}

const closeNotificationModal = () => {
  notificationModal.value.show = false
}

// === Computed ===
const filteredUsers = computed(() => {
  let filtered = users.value
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(user =>
      user.username.toLowerCase().includes(query) ||
      (user.email && user.email.toLowerCase().includes(query))
    )
  }
  if (roleFilter.value) {
    filtered = filtered.filter(user => user.role === roleFilter.value)
  }
  return filtered
})

const formatDate = (dateString) => {
  return new Intl.DateTimeFormat('fr-FR', { year: 'numeric', month: 'short', day: 'numeric' })
    .format(new Date(dateString))
}

// === Load Users ===
const loadUsers = async () => {
  loading.value = true
  try {
    const response = await adminAPI.getUsers()
    users.value = response.data || []
  } catch (error) {
    console.error('Error loading users:', error)
    showNotificationModal('Erreur lors du chargement des utilisateurs', 'error')
  } finally {
    loading.value = false
  }
}

// === Modals ===
const openCreateModal = () => {
  editingUser.value = null
  userForm.value = { username: '', email: '', password: '', role: 'SIMPLE_USER', quota_mb: 2048 }
  errors.value = {}
  showModal.value = true
}

const openEditModal = (user) => {
  editingUser.value = user
  userForm.value = {
    username: user.username,
    email: user.email || '',
    password: '',
    role: user.role,
    quota_mb: user.quota_mb || 2048
  }
  errors.value = {}
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  editingUser.value = null
  showPassword.value = false
  errors.value = {}
}

// === Validation ===
const validateForm = () => {
  errors.value = {}
  if (!userForm.value.username.trim()) errors.value.username = 'Le nom d\'utilisateur est requis'
  if (!editingUser.value && !userForm.value.password) errors.value.password = 'Le mot de passe est requis'
  if (userForm.value.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userForm.value.email)) {
    errors.value.email = 'Format d\'email invalide'
  }
  return Object.keys(errors.value).length === 0
}

// === Save User ===
const saveUser = async () => {
  if (!validateForm()) return
  saving.value = true
  try {
    const userData = { username: userForm.value.username, role: userForm.value.role, quota_mb: userForm.value.quota_mb }
    if (userForm.value.email) userData.email = userForm.value.email
    if (!editingUser.value || userForm.value.password) userData.password = userForm.value.password

    if (editingUser.value) {
      await adminAPI.updateUser(editingUser.value.id, userData)
      showNotificationModal('Utilisateur modifié avec succès', 'success')
    } else {
      await adminAPI.createUser(userData)
      showNotificationModal('Utilisateur créé avec succès', 'success')
    }

    await loadUsers()
    closeModal()
  } catch (error) {
    console.error('Error saving user:', error)
    const message = error.response?.data?.msg || 'Erreur lors de la sauvegarde'
    showNotificationModal(message, 'error')
  } finally {
    saving.value = false
  }
}

// === Delete User ===
const confirmDeleteUser = (user) => { userToDelete.value = user }
const deleteUser = async () => {
  if (!userToDelete.value) return
  deleting.value = true
  try {
    await adminAPI.deleteUser(userToDelete.value.id)
    await loadUsers()
    userToDelete.value = null
    showNotificationModal('Utilisateur supprimé avec succès', 'success')
  } catch (error) {
    console.error('Error deleting user:', error)
    const message = error.response?.data?.msg || 'Erreur lors de la suppression'
    showNotificationModal(message, 'error')
  } finally {
    deleting.value = false
  }
}

// === Lifecycle ===
onMounted(() => { loadUsers() })
</script>

<style scoped>
.table th {
  position: sticky;
  top: 0;
  z-index: 10;
}
</style>
