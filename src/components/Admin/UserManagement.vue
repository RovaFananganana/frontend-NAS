<template>
  <div class="p-6">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold text-gray-800">Gestion des utilisateurs</h1>
      <button 
        @click="showCreateModal = true"
        class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center transition-colors"
      >
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
        </svg>
        Nouvel utilisateur
      </button>
    </div>

    <!-- Tableau des utilisateurs -->
    <div class="bg-white shadow-md rounded-lg overflow-hidden">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rôle</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quota</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Groupes</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="user in users" :key="user.id">
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm font-medium text-gray-900">{{ user.username }}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm text-gray-500">{{ user.email || 'N/A' }}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full" 
                :class="user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'">
                {{ user.role }}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ user.quota_mb }} MB
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              <span v-for="(group, index) in user.groups" :key="index" class="mr-1 bg-gray-200 px-2 py-1 rounded text-xs">
                {{ group }}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
              <button @click="editUser(user)" class="text-blue-600 hover:text-blue-900 mr-3">Modifier</button>
              <button @click="confirmDelete(user)" class="text-red-600 hover:text-red-900">Supprimer</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal de création/édition -->
    <Modal :show="showCreateModal || showEditModal" @close="closeModal">
      <template #header>
        <h3 class="text-lg font-medium text-gray-900">
          {{ isEditing ? 'Modifier l\'utilisateur' : 'Créer un utilisateur' }}
        </h3>
      </template>
      
      <form @submit.prevent="saveUser">
        <div class="space-y-4">
          <div>
            <label for="username" class="block text-sm font-medium text-gray-700">Nom d'utilisateur</label>
            <input 
              type="text" 
              id="username" 
              v-model="currentUser.username" 
              required
              class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
          </div>
          
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700">Email</label>
            <input 
              type="email" 
              id="email" 
              v-model="currentUser.email" 
              class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
          </div>
          
          <div>
            <label for="password" class="block text-sm font-medium text-gray-700">
              {{ isEditing ? 'Nouveau mot de passe (laisser vide pour ne pas changer)' : 'Mot de passe' }}
            </label>
            <input 
              type="password" 
              id="password" 
              v-model="currentUser.password" 
              :required="!isEditing"
              class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
          </div>
          
          <div>
            <label for="role" class="block text-sm font-medium text-gray-700">Rôle</label>
            <select 
              id="role" 
              v-model="currentUser.role" 
              required
              class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="SIMPLE_USER">Utilisateur simple</option>
              <option value="ADMIN">Administrateur</option>
            </select>
          </div>
          
          <div>
            <label for="quota" class="block text-sm font-medium text-gray-700">Quota (MB)</label>
            <input 
              type="number" 
              id="quota" 
              v-model.number="currentUser.quota_mb" 
              required
              min="1"
              class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
          </div>
        </div>
        
        <div class="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
          <button 
            type="submit" 
            class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:col-start-2 sm:text-sm"
          >
            {{ isEditing ? 'Modifier' : 'Créer' }}
          </button>
          <button 
            type="button" 
            @click="closeModal"
            class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:col-start-1 sm:text-sm"
          >
            Annuler
          </button>
        </div>
      </form>
    </Modal>

    <!-- Modal de confirmation de suppression -->
    <Modal :show="showDeleteModal" @close="showDeleteModal = false">
      <template #header>
        <h3 class="text-lg font-medium text-gray-900">Confirmer la suppression</h3>
      </template>
      
      <p class="text-sm text-gray-500">
        Êtes-vous sûr de vouloir supprimer l'utilisateur "{{ currentUser.username }}" ? Cette action est irréversible.
      </p>
      
      <div class="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
        <button 
          @click="deleteUser" 
          class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:col-start-2 sm:text-sm"
        >
          Supprimer
        </button>
        <button 
          @click="showDeleteModal = false" 
          class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:col-start-1 sm:text-sm"
        >
          Annuler
        </button>
      </div>
    </Modal>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import Modal from '../Shared/Modal.vue'
import { adminAPI } from '../../services/api'

export default {
  name: 'UserManagement',
  components: {
    Modal
  },
  setup() {
    const users = ref([])
    const showCreateModal = ref(false)
    const showEditModal = ref(false)
    const showDeleteModal = ref(false)
    const isEditing = ref(false)
    const currentUser = ref({
      id: null,
      username: '',
      email: '',
      password: '',
      role: 'SIMPLE_USER',
      quota_mb: 2048
    })

    const loadUsers = async () => {
      try {
        users.value = await adminAPI.getUsers()
      } catch (error) {
        console.error('Erreur lors du chargement des utilisateurs:', error)
      }
    }

    const editUser = (user) => {
      currentUser.value = { ...user, password: '' }
      isEditing.value = true
      showEditModal.value = true
    }

    const confirmDelete = (user) => {
      currentUser.value = { ...user }
      showDeleteModal.value = true
    }

    const saveUser = async () => {
      try {
        if (isEditing.value) {
          await adminAPI.updateUser(currentUser.value.id, currentUser.value)
        } else {
          await adminAPI.createUser(currentUser.value)
        }
        
        closeModal()
        loadUsers()
      } catch (error) {
        console.error('Erreur lors de la sauvegarde:', error)
      }
    }

    const deleteUser = async () => {
      try {
        await adminAPI.deleteUser(currentUser.value.id)
        showDeleteModal.value = false
        loadUsers()
      } catch (error) {
        console.error('Erreur lors de la suppression:', error)
      }
    }

    const closeModal = () => {
      showCreateModal.value = false
      showEditModal.value = false
      currentUser.value = {
        id: null,
        username: '',
        email: '',
        password: '',
        role: 'SIMPLE_USER',
        quota_mb: 2048
      }
      isEditing.value = false
    }

    onMounted(() => {
      loadUsers()
    })

    return {
      users,
      showCreateModal,
      showEditModal,
      showDeleteModal,
      isEditing,
      currentUser,
      editUser,
      confirmDelete,
      saveUser,
      deleteUser,
      closeModal
    }
  }
}
</script>