<!-- components/Admin/GroupManagement.vue -->
<template>
  <div class="p-6">
    <!-- <h1 class="text-3xl font-bold mb-6">Gestion des groupes</h1> -->

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Left Column: Groups List -->
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <div class="flex items-center justify-between mb-4">
            <h2 class="card-title">Groupes</h2>
            <button class="btn btn-primary btn-sm" @click="openCreateGroupModal">
              <i class="fas fa-plus mr-2"></i>
              Nouveau groupe
            </button>
          </div>

          <!-- Loading State -->
          <div v-if="loadingGroups" class="flex justify-center py-8">
            <span class="loading loading-spinner loading-lg"></span>
          </div>

          <!-- Groups List -->
          <div v-else-if="groups.length > 0" class="space-y-2">
            <div
              v-for="group in groups"
              :key="group.id"
              class="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-base-200"
              :class="{ 'bg-primary text-primary-content': selectedGroup?.id === group.id }"
              @click="selectGroup(group)"
            >
              <div>
                <div class="font-semibold">{{ group.name }}</div>
                <div class="text-sm opacity-70">
                  {{ group.users?.length || 0 }} membre(s)
                </div>
              </div>
              <div class="dropdown dropdown-end">
                <label tabindex="0" class="btn btn-ghost btn-xs">
                  <i class="fas fa-ellipsis-v"></i>
                </label>
                <ul tabindex="0" class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
                  <li>
                    <a @click="editGroup(group)" class="text-info">
                      <i class="fas fa-edit mr-2"></i>
                      Modifier
                    </a>
                  </li>
                  <li>
                    <a @click="confirmDeleteGroup(group)" class="text-error">
                      <i class="fas fa-trash mr-2"></i>
                      Supprimer
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div v-else class="text-center py-8">
            <i class="fas fa-layer-group text-6xl opacity-30 mb-4"></i>
            <p class="text-xl opacity-70 mb-2">Aucun groupe</p>
            <p class="opacity-50">Créez votre premier groupe</p>
          </div>
        </div>
      </div>

      <!-- Right Column: Group Members -->
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <h2 class="card-title mb-4">
            {{ selectedGroup ? `Membres de "${selectedGroup.name}"` : 'Sélectionnez un groupe' }}
          </h2>

          <div v-if="!selectedGroup" class="text-center py-8">
            <i class="fas fa-users text-6xl opacity-30 mb-4"></i>
            <p class="opacity-70">Sélectionnez un groupe pour voir ses membres</p>
          </div>

          <div v-else>
            <!-- Add User to Group -->
            <div class="flex gap-2 mb-4">
              <select v-model="selectedUserId" class="select select-bordered flex-1">
                <option value="">Sélectionner un utilisateur...</option>
                <option
                  v-for="user in availableUsers"
                  :key="user.id"
                  :value="user.id"
                >
                  {{ user.username }} ({{ user.email || 'Pas d\'email' }})
                </option>
              </select>
              <button
                class="btn btn-primary"
                @click="addUserToGroup"
                :disabled="!selectedUserId || addingUser"
              >
                <span v-if="addingUser" class="loading loading-spinner loading-xs mr-2"></span>
                Ajouter
              </button>
            </div>

            <!-- Members List -->
            <div v-if="groupMembers.length > 0" class="space-y-2">
              <div
                v-for="member in groupMembers"
                :key="member.id"
                class="flex items-center justify-between p-3 border rounded-lg"
              >
                <div class="flex items-center space-x-3">
                  <div class="avatar">
                    <div class="mask mask-squircle w-10 h-10 bg-primary text-primary-content flex items-center justify-center">
                      {{ member.username.charAt(0).toUpperCase() }}
                    </div>
                  </div>
                  <div>
                    <div class="font-semibold">{{ member.username }}</div>
                    <div class="text-sm opacity-70">{{ member.email || 'Pas d\'email' }}</div>
                  </div>
                </div>
                <button
                  class="btn btn-ghost btn-xs text-error"
                  @click="removeUserFromGroup(member)"
                  :disabled="removingUser"
                >
                  <i class="fas fa-times"></i>
                </button>
              </div>
            </div>

            <!-- Empty Members State -->
            <div v-else class="text-center py-8">
              <i class="fas fa-user-friends text-4xl opacity-30 mb-4"></i>
              <p class="opacity-70">Aucun membre dans ce groupe</p>
              <p class="text-sm opacity-50">Ajoutez des utilisateurs ci-dessus</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create/Edit Group Modal -->
    <div v-if="showGroupModal" class="modal modal-open">
      <div class="modal-box">
        <h3 class="font-bold text-lg mb-4">
          {{ editingGroup ? 'Modifier le groupe' : 'Créer un groupe' }}
        </h3>

        <form @submit.prevent="saveGroup">
          <div class="form-control">
            <label class="label">
              <span class="label-text">Nom du groupe *</span>
            </label>
            <input
              v-model="groupForm.name"
              type="text"
              class="input input-bordered"
              :class="{ 'input-error': groupError }"
              required
              autocomplete="off"
            >
            <label v-if="groupError" class="label">
              <span class="label-text-alt text-error">{{ groupError }}</span>
            </label>
          </div>

          <div class="modal-action">
            <button type="button" class="btn" @click="closeGroupModal">Annuler</button>
            <button
              type="submit"
              class="btn btn-primary"
              :disabled="savingGroup"
            >
              <span v-if="savingGroup" class="loading loading-spinner loading-xs mr-2"></span>
              {{ editingGroup ? 'Modifier' : 'Créer' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete Group Confirmation -->
    <div v-if="groupToDelete" class="modal modal-open">
      <div class="modal-box">
        <h3 class="font-bold text-lg">Confirmer la suppression</h3>
        <p class="py-4">
          Êtes-vous sûr de vouloir supprimer le groupe <strong>"{{ groupToDelete.name }}"</strong> ?
          Cette action est irréversible.
        </p>
        <div class="modal-action">
          <button class="btn" @click="groupToDelete = null">Annuler</button>
          <button
            class="btn btn-error"
            @click="deleteGroup"
            :disabled="deletingGroup"
          >
            <span v-if="deletingGroup" class="loading loading-spinner loading-xs mr-2"></span>
            Supprimer
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de succès -->
    <div v-if="successModal.visible" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white p-6 rounded-lg shadow-xl w-96 max-w-md">
        <div class="text-center">
          <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-success text-success-content mb-4">
            <i class="fas fa-check text-xl"></i>
          </div>
          <h3 class="font-bold text-lg mb-2">{{ successModal.title }}</h3>
          <p class="text-base-content/70 mb-6">
            {{ successModal.message }}
          </p>
          <button class="btn btn-primary" @click="closeSuccessModal">
            <i class="fas fa-thumbs-up mr-2"></i>
            Parfait !
          </button>
        </div>
      </div>
    </div>

    <!-- Modal d'erreur -->
    <div v-if="errorModal.visible" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white p-6 rounded-lg shadow-xl w-96 max-w-md">
        <div class="text-center">
          <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-error text-error-content mb-4">
            <i class="fas fa-exclamation-triangle text-xl"></i>
          </div>
          <h3 class="font-bold text-lg mb-2">{{ errorModal.title }}</h3>
          <p class="text-base-content/70 mb-6">
            {{ errorModal.message }}
          </p>
          <button class="btn btn-primary" @click="closeErrorModal">
            <i class="fas fa-times mr-2"></i>
            Fermer
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { adminAPI } from '@/services/api'
import { useStore } from 'vuex'

const store = useStore()

// Reactive data
const groups = ref([])
const users = ref([])
const selectedGroup = ref(null)
const selectedUserId = ref('')
const loadingGroups = ref(false)
const addingUser = ref(false)
const removingUser = ref(false)
const savingGroup = ref(false)
const deletingGroup = ref(false)

// Modal states
const showGroupModal = ref(false)
const editingGroup = ref(null)
const groupToDelete = ref(null)
const groupForm = ref({ name: '' })
const groupError = ref('')

// Modals de succès et d'erreur
const successModal = ref({
  visible: false,
  title: '',
  message: ''
})

const errorModal = ref({
  visible: false,
  title: '',
  message: ''
})

// Computed properties
const groupMembers = computed(() => {
  if (!selectedGroup.value) return []
  return selectedGroup.value.users || []
})

const availableUsers = computed(() => {
  const memberIds = new Set(groupMembers.value.map(member => member.id))
  return users.value.filter(user => !memberIds.has(user.id))
})

// Methods
const loadGroups = async () => {
  loadingGroups.value = true
  try {
    const response = await adminAPI.getGroups()
    groups.value = response.data || []
  } catch (error) {
    console.error('Error loading groups:', error)
    showErrorModal(
      'Erreur de chargement',
      'Impossible de charger la liste des groupes. Veuillez réessayer.'
    )
  } finally {
    loadingGroups.value = false
  }
}

const loadUsers = async () => {
  try {
    const response = await adminAPI.getUsers()
    users.value = response.data || []
  } catch (error) {
    console.error('Error loading users:', error)
    showErrorModal(
      'Erreur de chargement',
      'Impossible de charger la liste des utilisateurs. Veuillez réessayer.'
    )
  }
}

const selectGroup = (group) => {
  selectedGroup.value = group
  selectedUserId.value = ''
}

const openCreateGroupModal = () => {
  editingGroup.value = null
  groupForm.value = { name: '' }
  groupError.value = ''
  showGroupModal.value = true
}

const editGroup = (group) => {
  editingGroup.value = group
  groupForm.value = { name: group.name }
  groupError.value = ''
  showGroupModal.value = true
}

const closeGroupModal = () => {
  showGroupModal.value = false
  editingGroup.value = null
  groupError.value = ''
}

const saveGroup = async () => {
  if (!groupForm.value.name.trim()) {
    groupError.value = 'Le nom du groupe est requis'
    return
  }

  savingGroup.value = true
  try {
    if (editingGroup.value) {
      await adminAPI.updateGroup(editingGroup.value.id, groupForm.value.name)
      await loadGroups()
      closeGroupModal()
      showSuccessModal(
        'Groupe modifié avec succès !',
        `Le groupe "${groupForm.value.name}" a été modifié avec succès.`
      )
    } else {
      await adminAPI.createGroup(groupForm.value.name)
      await loadGroups()
      closeGroupModal()
      showSuccessModal(
        'Groupe créé avec succès !',
        `Le groupe "${groupForm.value.name}" a été créé avec succès.`
      )
    }
  } catch (error) {
    console.error('Error saving group:', error)
    const message = error.response?.data?.msg || 'Erreur lors de la sauvegarde'
    groupError.value = message
  } finally {
    savingGroup.value = false
  }
}

const confirmDeleteGroup = (group) => {
  groupToDelete.value = group
}

const deleteGroup = async () => {
  if (!groupToDelete.value) return

  deletingGroup.value = true
  try {
    const groupName = groupToDelete.value.name
    await adminAPI.deleteGroup(groupToDelete.value.id)
    await loadGroups()
    
    // Reset selection if deleted group was selected
    if (selectedGroup.value?.id === groupToDelete.value.id) {
      selectedGroup.value = null
    }
    
    groupToDelete.value = null
    showSuccessModal(
      'Groupe supprimé avec succès !',
      `Le groupe "${groupName}" a été supprimé définitivement.`
    )
  } catch (error) {
    console.error('Error deleting group:', error)
    const message = error.response?.data?.msg || 'Erreur lors de la suppression'
    showErrorModal(
      'Erreur de suppression',
      `Impossible de supprimer le groupe : ${message}`
    )
  } finally {
    deletingGroup.value = false
  }
}

const addUserToGroup = async () => {
  if (!selectedUserId.value || !selectedGroup.value) return

  addingUser.value = true
  try {
    const user = users.value.find(u => u.id === selectedUserId.value)
    await adminAPI.addUserToGroup(selectedGroup.value.id, selectedUserId.value)
    
    // Add user to local group data
    if (user && selectedGroup.value.users) {
      selectedGroup.value.users.push(user)
    }
    
    selectedUserId.value = ''
    showSuccessModal(
      'Utilisateur ajouté avec succès !',
      `${user?.username || 'L\'utilisateur'} a été ajouté au groupe "${selectedGroup.value.name}".`
    )
  } catch (error) {
    console.error('Error adding user to group:', error)
    const message = error.response?.data?.msg || 'Erreur lors de l\'ajout'
    showErrorModal(
      'Erreur d\'ajout',
      `Impossible d'ajouter l'utilisateur au groupe : ${message}`
    )
  } finally {
    addingUser.value = false
  }
}

const removeUserFromGroup = async (user) => {
  if (!selectedGroup.value) return

  removingUser.value = true
  try {
    await adminAPI.removeUserFromGroup(selectedGroup.value.id, user.id)
    
    // Remove user from local group data
    if (selectedGroup.value.users) {
      selectedGroup.value.users = selectedGroup.value.users.filter(u => u.id !== user.id)
    }
    
    showSuccessModal(
      'Utilisateur retiré avec succès !',
      `${user.username} a été retiré du groupe "${selectedGroup.value.name}".`
    )
  } catch (error) {
    console.error('Error removing user from group:', error)
    const message = error.response?.data?.msg || 'Erreur lors du retrait'
    showErrorModal(
      'Erreur de retrait',
      `Impossible de retirer l'utilisateur du groupe : ${message}`
    )
  } finally {
    removingUser.value = false
  }
}

// Méthodes pour les modals de succès et d'erreur
const showSuccessModal = (title, message) => {
  successModal.value = {
    visible: true,
    title,
    message
  }
}

const closeSuccessModal = () => {
  successModal.value.visible = false
}

const showErrorModal = (title, message) => {
  errorModal.value = {
    visible: true,
    title,
    message
  }
}

const closeErrorModal = () => {
  errorModal.value.visible = false
}

// Lifecycle
onMounted(async () => {
  await Promise.all([loadGroups(), loadUsers()])
})
</script>

<style scoped>
.dropdown-content {
  @apply border border-base-300;
}
</style>