<!-- components/Admin/FileExplorer.vue -->
<template>
  <div class="p-6">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <!-- <h1 class="text-3xl font-bold">Explorateur de fichiers</h1> -->
      <button class="btn btn-primary" @click="openCreateFolderModal">
        <i class="fas fa-plus mr-2"></i>
        Nouveau dossier
      </button>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      <div class="stat bg-base-100 shadow rounded-lg">
        <div class="stat-figure text-primary">
          <i class="fas fa-folder text-2xl"></i>
        </div>
        <div class="stat-title">Nombre total Dossiers</div>
        <div class="stat-value text-primary">{{ folders.length }}</div>
      </div>
      
      <div class="stat bg-base-100 shadow rounded-lg">
        <div class="stat-figure text-secondary">
          <i class="fas fa-file text-2xl"></i>
        </div>
        <div class="stat-title">Nombre total de fichiers</div>
        <div class="stat-value text-secondary">{{ files.length }}</div>
        <div class="stat-desc">{{ formatBytes(totalSize) }}</div>
      </div>
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <!-- Folders Section -->
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <h2 class="card-title mb-4">
            <i class="fas fa-folder mr-2"></i>
            Dossiers
          </h2>

          <!-- Loading State -->
          <div v-if="loadingFolders" class="flex justify-center py-8">
            <span class="loading loading-spinner loading-lg"></span>
          </div>

          <!-- Folders Table -->
          <div v-else-if="folders.length > 0" class="overflow-x-auto">
            <table class="table table-zebra w-full">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nom</th>
                  <th>Propriétaire</th>
                  <th>Parent</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="folder in folders" :key="folder.id">
                  <td>
                    <div class="badge badge-outline">#{{ folder.id }}</div>
                  </td>
                  <td>
                    <div class="flex items-center space-x-2">
                      <i class="fas fa-folder text-primary"></i>
                      <span class="font-medium">{{ folder.name }}</span>
                    </div>
                  </td>
                  <td>{{ folder.owner || `ID: ${folder.owner_id}` }}</td>
                  <td>
                    <span v-if="folder.parent_id" class="badge badge-ghost">
                      #{{ folder.parent_id }}
                    </span>
                    <span v-else class="text-gray-500">Racine</span>
                  </td>
                  <td>
                    <div class="flex gap-1">
                      <button
                        class="btn btn-ghost btn-xs text-error"
                        @click="confirmDeleteFolder(folder)"
                        :title="'Supprimer ' + folder.name"
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
          <div v-else class="text-center py-8">
            <i class="fas fa-folder text-6xl opacity-30 mb-4"></i>
            <p class="text-xl opacity-70 mb-2">Aucun dossier</p>
            <p class="opacity-50">Les dossiers créés apparaîtront ici</p>
          </div>
        </div>
      </div>

      <!-- Files Section -->
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <h2 class="card-title mb-4">
            <i class="fas fa-file mr-2"></i>
            Fichiers
          </h2>

          <!-- Loading State -->
          <div v-if="loadingFiles" class="flex justify-center py-8">
            <span class="loading loading-spinner loading-lg"></span>
          </div>

          <!-- Files Table -->
          <div v-else-if="files.length > 0" class="overflow-x-auto">
            <table class="table table-zebra w-full">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nom</th>
                  <th>Taille</th>
                  <th>Propriétaire</th>
                  <th>Dossier</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="file in files" :key="file.id">
                  <td>
                    <div class="badge badge-outline">#{{ file.id }}</div>
                  </td>
                  <td>
                    <div class="flex items-center space-x-2">
                      <i :class="getFileIcon(file.name)" class="text-accent"></i>
                      <span class="font-medium">{{ file.name }}</span>
                    </div>
                  </td>
                  <td>{{ formatBytes(file.size_kb * 1024) }}</td>
                  <td>{{ file.owner || `ID: ${file.owner_id}` }}</td>
                  <td>
                    <span v-if="file.folder_id" class="badge badge-ghost">
                      #{{ file.folder_id }}
                    </span>
                    <span v-else class="text-gray-500">Racine</span>
                    <FileUpload owner-type="admin" :owner-id="selectedUserId" @uploaded="fetchFiles" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Empty State -->
          <div v-else class="text-center py-8">
            <i class="fas fa-file text-6xl opacity-30 mb-4"></i>
            <p class="text-xl opacity-70 mb-2">Aucun fichier</p>
            <p class="opacity-50">Les fichiers uploadés apparaîtront ici</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Folder Modal -->
    <div v-if="showCreateModal" class="modal modal-open">
      <div class="modal-box">
        <h3 class="font-bold text-lg mb-4">Créer un nouveau dossier</h3>

        <form @submit.prevent="createFolder">
          <div class="grid grid-cols-1 gap-4">
            <!-- Folder Name -->
            <div class="form-control">
              <label class="label">
                <span class="label-text">Nom du dossier *</span>
              </label>
              <input
                v-model="folderForm.name"
                type="text"
                class="input input-bordered"
                :class="{ 'input-error': folderError }"
                required
                autocomplete="off"
              >
              <label v-if="folderError" class="label">
                <span class="label-text-alt text-error">{{ folderError }}</span>
              </label>
            </div>

            <!-- Owner -->
            <div class="form-control">
              <label class="label">
                <span class="label-text">Propriétaire *</span>
              </label>
              <select
                v-model="folderForm.owner_id"
                class="select select-bordered"
                required
              >
                <option value="">Sélectionner un utilisateur...</option>
                <option
                  v-for="user in users"
                  :key="user.id"
                  :value="user.id"
                >
                  {{ user.username }} (#{{ user.id }})
                </option>
              </select>
            </div>

            <!-- Parent Folder -->
            <div class="form-control">
              <label class="label">
                <span class="label-text">Dossier parent </span>
              </label>
              <select
                v-model="folderForm.parent_id"
                class="select select-bordered"
              >
                <option value="">Racine</option>
                <option
                  v-for="folder in folders"
                  :key="folder.id"
                  :value="folder.id"
                >
                  {{ folder.name }} (#{{ folder.id }})
                </option>
              </select>
            </div>
          </div>

          <div class="modal-action">
            <button type="button" class="btn" @click="closeCreateModal">Annuler</button>
            <button
              type="submit"
              class="btn btn-primary"
              :disabled="creatingFolder"
            >
              <span v-if="creatingFolder" class="loading loading-spinner loading-xs mr-2"></span>
              Créer
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="folderToDelete" class="modal modal-open">
      <div class="modal-box">
        <h3 class="font-bold text-lg">Confirmer la suppression</h3>
        <p class="py-4">
          Êtes-vous sûr de vouloir supprimer le dossier <strong>"{{ folderToDelete.name }}"</strong> ?
          Cette action est irréversible et supprimera également tous les fichiers contenus.
        </p>
        <div class="modal-action">
          <button class="btn" @click="folderToDelete = null">Annuler</button>
          <button
            class="btn btn-error"
            @click="deleteFolder"
            :disabled="deletingFolder"
          >
            <span v-if="deletingFolder" class="loading loading-spinner loading-xs mr-2"></span>
            Supprimer
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
import FileUpload from '../Shared/FileUpload.vue'

const store = useStore()

// Reactive data
const folders = ref([])
const files = ref([])
const users = ref([])
const loadingFolders = ref(false)
const loadingFiles = ref(false)
const creatingFolder = ref(false)
const deletingFolder = ref(false)
const selectedUserId = ref(null); // ou récupéré depuis le tableau des utilisateurs


// Modal states
const showCreateModal = ref(false)
const folderToDelete = ref(null)
const folderForm = ref({
  name: '',
  owner_id: '',
  parent_id: ''
})
const folderError = ref('')

// Computed properties
const totalSize = computed(() => {
  return files.value.reduce((total, file) => total + (file.size_kb || 0) * 1024, 0)
})

// Methods
const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const getFileIcon = (filename) => {
  const ext = filename.split('.').pop()?.toLowerCase() || ''
  const iconMap = {
    'pdf': 'fas fa-file-pdf',
    'doc': 'fas fa-file-word',
    'docx': 'fas fa-file-word',
    'xls': 'fas fa-file-excel',
    'xlsx': 'fas fa-file-excel',
    'ppt': 'fas fa-file-powerpoint',
    'pptx': 'fas fa-file-powerpoint',
    'jpg': 'fas fa-file-image',
    'jpeg': 'fas fa-file-image',
    'png': 'fas fa-file-image',
    'gif': 'fas fa-file-image',
    'mp4': 'fas fa-file-video',
    'avi': 'fas fa-file-video',
    'mov': 'fas fa-file-video',
    'mp3': 'fas fa-file-audio',
    'wav': 'fas fa-file-audio',
    'zip': 'fas fa-file-archive',
    'rar': 'fas fa-file-archive',
    'txt': 'fas fa-file-alt',
    'js': 'fas fa-file-code',
    'html': 'fas fa-file-code',
    'css': 'fas fa-file-code',
    'json': 'fas fa-file-code'
  }
  return iconMap[ext] || 'fas fa-file'
}

const loadFolders = async () => {
  loadingFolders.value = true
  try {
    const response = await adminAPI.getAllFolders()
    folders.value = response.data || []
  } catch (error) {
    console.error('Error loading folders:', error)
    store.dispatch('showError', 'Erreur lors du chargement des dossiers')
  } finally {
    loadingFolders.value = false
  }
}

const loadFiles = async () => {
  loadingFiles.value = true
  try {
    const response = await adminAPI.getAllFiles()
    files.value = response.data || []
  } catch (error) {
    console.error('Error loading files:', error)
    store.dispatch('showError', 'Erreur lors du chargement des fichiers')
  } finally {
    loadingFiles.value = false
  }
}

const loadUsers = async () => {
  try {
    const response = await adminAPI.getUsers()
    users.value = response.data || []
  } catch (error) {
    console.error('Error loading users:', error)
    store.dispatch('showError', 'Erreur lors du chargement des utilisateurs')
  }
}

const openCreateFolderModal = () => {
  folderForm.value = {
    name: '',
    owner_id: '',
    parent_id: ''
  }
  folderError.value = ''
  showCreateModal.value = true
}

const closeCreateModal = () => {
  showCreateModal.value = false
  folderError.value = ''
}

const createFolder = async () => {
  if (!folderForm.value.name.trim()) {
    folderError.value = 'Le nom du dossier est requis'
    return
  }

  if (!folderForm.value.owner_id) {
    folderError.value = 'Le propriétaire est requis'
    return
  }

  creatingFolder.value = true
  try {
    await adminAPI.createAdminFolder(
      folderForm.value.name,
      folderForm.value.owner_id,
      folderForm.value.parent_id || null
    )
    
    await loadFolders()
    closeCreateModal()
    store.dispatch('showSuccess', 'Dossier créé avec succès')
  } catch (error) {
    console.error('Error creating folder:', error)
    const message = error.response?.data?.msg || 'Erreur lors de la création'
    folderError.value = message
  } finally {
    creatingFolder.value = false
  }
}

const confirmDeleteFolder = (folder) => {
  folderToDelete.value = folder
}

const deleteFolder = async () => {
  if (!folderToDelete.value) return

  deletingFolder.value = true
  try {
    await adminAPI.deleteAdminFolder(folderToDelete.value.id)
    await loadFolders()
    folderToDelete.value = null
    store.dispatch('showSuccess', 'Dossier supprimé avec succès')
  } catch (error) {
    console.error('Error deleting folder:', error)
    const message = error.response?.data?.msg || 'Erreur lors de la suppression'
    store.dispatch('showError', message)
  } finally {
    deletingFolder.value = false
  }
}

// Lifecycle
onMounted(async () => {
  await Promise.all([loadFolders(), loadFiles(), loadUsers()])
})
</script>

<style scoped>
.stat {
  @apply border border-base-300;
}

.table th {
  position: sticky;
  top: 0;
  z-index: 10;
}
</style>