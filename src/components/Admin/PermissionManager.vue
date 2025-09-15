<template>
  <div class="p-6 space-y-6">
    <!-- Header with actions -->
    <div class="flex items-center justify-between">
      <h2 class="text-2xl font-bold flex items-center">
        <i class="fas fa-shield-alt mr-3 text-primary"></i>
        Permission Management
      </h2>
      <div class="flex gap-2">
        <button 
          class="btn btn-sm btn-outline"
          @click="refreshPermissions"
          :disabled="loading"
        >
          <i class="fas fa-sync-alt mr-2" :class="{ 'animate-spin': loading }"></i>
          Refresh
        </button>
        <button 
          class="btn btn-sm btn-primary"
          @click="openBulkPermissionModal"
        >
          <i class="fas fa-users-cog mr-2"></i>
          Bulk Permissions
        </button>
      </div>
    </div>

    <!-- Filters and search -->
    <div class="flex items-center gap-4 flex-wrap">
      <div class="flex-1 min-w-64">
        <div class="relative">
          <input 
            v-model="searchQuery" 
            placeholder="Search folders, users, or groups..." 
            class="input input-bordered w-full pl-10"
          />
          <i class="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
        </div>
      </div>
      
      <select v-model="filterType" class="select select-bordered">
        <option value="all">All Resources</option>
        <option value="folders">Folders Only</option>
        <option value="files">Files Only</option>
      </select>

      <select v-model="filterPermission" class="select select-bordered">
        <option value="all">All Permissions</option>
        <option value="read">Read Access</option>
        <option value="write">Write Access</option>
        <option value="delete">Delete Access</option>
        <option value="share">Share Access</option>
      </select>
    </div>

    <!-- Loading state -->
    <div v-if="loading && folders.length === 0" class="space-y-4">
      <div v-for="i in 5" :key="i" class="skeleton h-16 w-full"></div>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="alert alert-error">
      <i class="fas fa-exclamation-triangle"></i>
      <span>{{ error }}</span>
      <button class="btn btn-sm btn-outline" @click="loadFolders">
        <i class="fas fa-refresh mr-2"></i>
        Retry
      </button>
    </div>

    <!-- Empty state -->
    <div v-else-if="filteredFolders.length === 0" class="text-center py-12">
      <i class="fas fa-folder-open text-6xl text-gray-300 mb-4"></i>
      <h3 class="text-lg font-semibold text-gray-600 mb-2">No folders found</h3>
      <p class="text-gray-500">
        {{ searchQuery ? 'No folders match your search criteria' : 'No folders have been created yet' }}
      </p>
    </div>

    <!-- Permission cards view -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      <div 
        v-for="folder in paginatedFolders" 
        :key="folder.id"
        class="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow"
      >
        <div class="card-body">
          <!-- Folder header -->
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center">
              <i class="fas fa-folder text-primary text-xl mr-3"></i>
              <div>
                <h3 class="font-semibold text-lg">{{ folder.name }}</h3>
                <p class="text-sm text-base-content/70">{{ folder.permissions.length }} permission(s)</p>
              </div>
            </div>
            <div class="dropdown dropdown-end">
              <button tabindex="0" class="btn btn-ghost btn-sm">
                <i class="fas fa-ellipsis-v"></i>
              </button>
              <ul tabindex="0" class="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52">
                <li><a @click="openAddPermissionModal(folder)"><i class="fas fa-plus mr-2"></i>Add Permission</a></li>
                <li><a @click="viewFolderDetails(folder)"><i class="fas fa-eye mr-2"></i>View Details</a></li>
                <li><a @click="exportFolderPermissions(folder)"><i class="fas fa-download mr-2"></i>Export</a></li>
              </ul>
            </div>
          </div>

          <!-- Permissions list -->
          <div class="space-y-3 max-h-64 overflow-y-auto">
            <div 
              v-for="perm in folder.permissions" 
              :key="perm.id"
              class="flex items-center justify-between p-3 bg-base-200 rounded-lg"
            >
              <div class="flex items-center flex-1">
                <div class="avatar placeholder mr-3">
                  <div class="bg-neutral-focus text-neutral-content rounded-full w-8">
                    <i class="fas" :class="perm.target_type === 'user' ? 'fa-user' : 'fa-users'"></i>
                  </div>
                </div>
                <div class="flex-1">
                  <div class="font-medium">{{ perm.target_name }}</div>
                  <div class="text-xs text-base-content/70">{{ perm.target_type }}</div>
                </div>
              </div>

              <!-- Permission badges -->
              <div class="flex gap-1 mr-3">
                <button
                  :class="['badge badge-xs cursor-pointer transition-colors', 
                          perm.can_read ? 'badge-success' : 'badge-outline hover:badge-success']"
                  @click="toggleRight(folder, perm, 'can_read')"
                  :title="perm.can_read ? 'Remove read access' : 'Grant read access'"
                >
                  R
                </button>
                <button
                  :class="['badge badge-xs cursor-pointer transition-colors', 
                          perm.can_write ? 'badge-warning' : 'badge-outline hover:badge-warning']"
                  @click="toggleRight(folder, perm, 'can_write')"
                  :title="perm.can_write ? 'Remove write access' : 'Grant write access'"
                >
                  W
                </button>
                <button
                  :class="['badge badge-xs cursor-pointer transition-colors', 
                          perm.can_delete ? 'badge-error' : 'badge-outline hover:badge-error']"
                  @click="toggleRight(folder, perm, 'can_delete')"
                  :title="perm.can_delete ? 'Remove delete access' : 'Grant delete access'"
                >
                  D
                </button>
                <button
                  :class="['badge badge-xs cursor-pointer transition-colors', 
                          perm.can_share ? 'badge-info' : 'badge-outline hover:badge-info']"
                  @click="toggleRight(folder, perm, 'can_share')"
                  :title="perm.can_share ? 'Remove share access' : 'Grant share access'"
                >
                  S
                </button>
              </div>

              <!-- Actions -->
              <div class="dropdown dropdown-end">
                <button tabindex="0" class="btn btn-ghost btn-xs">
                  <i class="fas fa-cog"></i>
                </button>
                <ul tabindex="0" class="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-48">
                  <li><a @click="editPermission(folder, perm)"><i class="fas fa-edit mr-2"></i>Edit</a></li>
                  <li><a @click="duplicatePermission(folder, perm)"><i class="fas fa-copy mr-2"></i>Duplicate</a></li>
                  <li><hr class="my-1"></li>
                  <li><a @click="removePermission(folder, perm)" class="text-error"><i class="fas fa-trash mr-2"></i>Remove</a></li>
                </ul>
              </div>
            </div>

            <!-- Empty permissions state -->
            <div v-if="folder.permissions.length === 0" class="text-center py-6 text-base-content/50">
              <i class="fas fa-lock text-2xl mb-2"></i>
              <p class="text-sm">No permissions set</p>
              <button 
                class="btn btn-xs btn-primary mt-2"
                @click="openAddPermissionModal(folder)"
              >
                Add Permission
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="flex justify-center">
      <div class="btn-group">
        <button 
          class="btn btn-sm"
          :disabled="currentPage === 1"
          @click="currentPage = 1"
        >
          <i class="fas fa-angle-double-left"></i>
        </button>
        <button 
          class="btn btn-sm"
          :disabled="currentPage === 1"
          @click="currentPage--"
        >
          <i class="fas fa-angle-left"></i>
        </button>
        <span class="btn btn-sm btn-disabled">
          {{ currentPage }} / {{ totalPages }}
        </span>
        <button 
          class="btn btn-sm"
          :disabled="currentPage === totalPages"
          @click="currentPage++"
        >
          <i class="fas fa-angle-right"></i>
        </button>
        <button 
          class="btn btn-sm"
          :disabled="currentPage === totalPages"
          @click="currentPage = totalPages"
        >
          <i class="fas fa-angle-double-right"></i>
        </button>
      </div>
    </div>

    <!-- Modal pour ajouter/modifier une permission -->
    <div v-if="modal.visible" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white p-6 rounded-lg shadow-xl w-96 max-w-md">
        <h3 class="font-bold text-lg mb-4">
          {{ modal.editing ? 'Modifier' : 'Ajouter' }} permission pour {{ modal.folder?.name }}
        </h3>
        <div class="flex flex-col gap-4 mb-6">
          <label class="form-control">
            <div class="label">
              <span class="label-text">Type:</span>
            </div>
            <select v-model="modal.targetType" class="select select-bordered w-full" :disabled="modal.editing" @change="onTargetTypeChange">
              <option value="user">Utilisateur</option>
              <option value="group">Groupe</option>
            </select>
          </label>
          
          <label class="form-control">
            <div class="label">
              <span class="label-text">{{ modal.targetType === 'user' ? 'Utilisateur' : 'Groupe' }}:</span>
            </div>
            <select v-model="modal.targetId" class="select select-bordered w-full" :disabled="modal.editing">
              <option value="">-- Sélectionner --</option>
              <option 
                v-for="item in availableTargets" 
                :key="item.id" 
                :value="item.id"
              >
                {{ item.name }}
              </option>
            </select>
          </label>
          
          <div class="form-control">
            <div class="label">
              <span class="label-text">Permissions:</span>
            </div>
            <div class="flex flex-col gap-2">
              <label class="cursor-pointer label justify-start gap-3">
                <input type="checkbox" v-model="modal.permissions.can_read" class="checkbox checkbox-success" />
                <span class="label-text">Lecture</span>
              </label>
              <label class="cursor-pointer label justify-start gap-3">
                <input type="checkbox" v-model="modal.permissions.can_write" class="checkbox checkbox-warning" />
                <span class="label-text">Écriture</span>
              </label>
              <label class="cursor-pointer label justify-start gap-3">
                <input type="checkbox" v-model="modal.permissions.can_delete" class="checkbox checkbox-error" />
                <span class="label-text">Suppression</span>
              </label>
              <label class="cursor-pointer label justify-start gap-3">
                <input type="checkbox" v-model="modal.permissions.can_share" class="checkbox checkbox-info" />
                <span class="label-text">Partage</span>
              </label>
            </div>
          </div>
        </div>
        <div class="flex justify-end gap-2">
          <button class="btn btn-outline" @click="closeModal">Annuler</button>
          <button class="btn btn-primary" @click="showConfirmationModal" :disabled="!modal.targetId">
            {{ modal.editing ? 'Enregistrer' : 'Ajouter' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de confirmation -->
    <div v-if="confirmationModal.visible" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white p-6 rounded-lg shadow-xl w-96 max-w-md">
        <h3 class="font-bold text-lg mb-4 flex items-center">
          <i class="fas fa-exclamation-triangle text-warning mr-2"></i>
          Confirmer l'ajout de permission
        </h3>
        <div class="mb-6">
          <p class="mb-4">Vous êtes sur le point d'ajouter les permissions suivantes :</p>
          <div class="bg-base-200 p-4 rounded-lg">
            <div class="font-semibold mb-2">
              <i class="fas fa-folder mr-2"></i>{{ modal.folder?.name }}
            </div>
            <div class="mb-2">
              <i class="fas mr-2" :class="modal.targetType === 'user' ? 'fa-user' : 'fa-users'"></i>
              {{ getTargetName() }} ({{ modal.targetType === 'user' ? 'Utilisateur' : 'Groupe' }})
            </div>
            <div class="flex gap-2 flex-wrap">
              <span v-if="modal.permissions.can_read" class="badge badge-success">Lecture</span>
              <span v-if="modal.permissions.can_write" class="badge badge-warning">Écriture</span>
              <span v-if="modal.permissions.can_delete" class="badge badge-error">Suppression</span>
              <span v-if="modal.permissions.can_share" class="badge badge-info">Partage</span>
              <span v-if="!hasAnyPermission" class="badge badge-outline">Aucune permission</span>
            </div>
          </div>
        </div>
        <div class="flex justify-end gap-2">
          <button class="btn btn-outline" @click="closeConfirmationModal">Annuler</button>
          <button class="btn btn-primary" @click="confirmSavePermission">
            <i class="fas fa-check mr-2"></i>
            Confirmer
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
          <h3 class="font-bold text-lg mb-2">Permission ajoutée avec succès !</h3>
          <p class="text-base-content/70 mb-6">
            La permission a été accordée à {{ successModal.targetName }} pour le dossier {{ successModal.folderName }}.
          </p>
          <button class="btn btn-primary" @click="closeSuccessModal">
            <i class="fas fa-thumbs-up mr-2"></i>
            Parfait !
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { permissionAPI } from '@/services/api'
import { useStore } from 'vuex'
import { createCachedApiCall, permissionCache, PerformanceMonitor } from '@/services/performance'

const store = useStore()

// Reactive data
const folders = ref([])
const users = ref([])
const groups = ref([])
const loading = ref(false)
const error = ref('')

// Filters and search
const searchQuery = ref('')
const filterType = ref('all')
const filterPermission = ref('all')

// Pagination
const currentPage = ref(1)
const itemsPerPage = ref(9)

// Cached API calls
const cachedGetAllResources = createCachedApiCall(
  permissionAPI.getAllResources,
  () => 'all-resources',
  permissionCache
)

const cachedGetFolderPermissions = createCachedApiCall(
  permissionAPI.getFolderPermissions,
  (folderId) => `folder-permissions-${folderId}`,
  permissionCache
)

// Modal state
const modal = ref({
  visible: false,
  editing: false,
  folder: null,
  targetType: 'user',
  targetId: '',
  permissions: { can_read: false, can_write: false, can_delete: false, can_share: false }
})

const confirmationModal = ref({
  visible: false
})

const successModal = ref({
  visible: false,
  targetName: '',
  folderName: ''
})

const bulkModal = ref({
  visible: false,
  selectedFolders: [],
  targetType: 'user',
  targetId: '',
  permissions: { can_read: false, can_write: false, can_delete: false, can_share: false }
})

// Computed properties
const filteredFolders = computed(() => {
  let filtered = folders.value

  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(folder => {
      const folderMatch = folder.name.toLowerCase().includes(query)
      const permissionMatch = folder.permissions.some(p => 
        p.target_name.toLowerCase().includes(query)
      )
      return folderMatch || permissionMatch
    })
  }

  // Apply type filter
  if (filterType.value !== 'all') {
    // This would be extended for files when file permissions are added
    filtered = filtered.filter(folder => folder.type === filterType.value || filterType.value === 'folders')
  }

  // Apply permission filter
  if (filterPermission.value !== 'all') {
    filtered = filtered.filter(folder => 
      folder.permissions.some(p => p[`can_${filterPermission.value}`])
    )
  }

  return filtered
})

const totalPages = computed(() => {
  return Math.ceil(filteredFolders.value.length / itemsPerPage.value)
})

const paginatedFolders = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredFolders.value.slice(start, end)
})

const availableTargets = computed(() => {
  if (modal.value.targetType === 'user') {
    return users.value.map(u => ({ id: u.id, name: u.username }))
  } else {
    return groups.value.map(g => ({ id: g.id, name: g.name }))
  }
})

const hasAnyPermission = computed(() => {
  return modal.value.permissions.can_read || 
         modal.value.permissions.can_write || 
         modal.value.permissions.can_delete || 
         modal.value.permissions.can_share
})

// Methods
const loadFolders = async () => {
  const monitor = PerformanceMonitor.start('PermissionManager.loadFolders')
  
  loading.value = true
  error.value = ''
  
  try {
    const res = await cachedGetAllResources()
    
    folders.value = res.data.folders.map(f => ({
      id: f.id,
      name: f.name,
      type: 'folder',
      permissions: (f.permissions || []).map(p => ({
        id: p.id,
        target_name: p.target_name,
        target_type: p.type,
        can_read: p.can_read,
        can_write: p.can_write,
        can_delete: p.can_delete,
        can_share: p.can_share
      }))
    }))
    
    users.value = res.data.users || []
    groups.value = res.data.groups || []
    
  } catch (err) {
    console.error('Error loading folders:', err)
    error.value = 'Failed to load folders and permissions'
    store.dispatch('showError', error.value)
  } finally {
    loading.value = false
    monitor.end()
  }
}

const refreshPermissions = async () => {
  // Clear cache and reload
  permissionCache.clear()
  await loadFolders()
  store.dispatch('showSuccess', 'Permissions refreshed')
}

// Toggle droit
const toggleRight = async (folder, perm, right) => {
  const payload = { [right]: !perm[right] }
  try {
    if (perm.target_type === 'user') {
      await permissionAPI.setFolderUserPermission(folder.id, perm.id, payload)
    } else {
      await permissionAPI.setFolderGroupPermission(folder.id, perm.id, payload)
    }
    perm[right] = !perm[right]
    store.dispatch('showSuccess', `Permission ${right} mise à jour pour ${perm.target_name}`)
  } catch (err) {
    console.error(err)
    store.dispatch('showError', 'Impossible de modifier la permission')
  }
}

// Supprimer permission
const removePermission = async (folder, perm) => {
  try {
    await permissionAPI.deleteFolderPermission(folder.id, perm.id)
    folder.permissions = folder.permissions.filter(p => p.id !== perm.id)
    store.dispatch('showSuccess', `Permission supprimée pour ${perm.target_name}`)
  } catch (err) {
    console.error(err)
    store.dispatch('showError', 'Impossible de supprimer la permission')
  }
}

// Modal methods
const openAddPermissionModal = (folder) => {
  modal.value.visible = true
  modal.value.editing = false
  modal.value.folder = folder
  modal.value.targetType = 'user'
  modal.value.targetId = ''
  modal.value.permissions = { can_read: false, can_write: false, can_delete: false, can_share: false }
}

const editPermission = (folder, perm) => {
  modal.value.visible = true
  modal.value.editing = true
  modal.value.folder = folder
  modal.value.targetType = perm.target_type
  modal.value.targetId = perm.target_id
  modal.value.permissions = { 
    can_read: perm.can_read,
    can_write: perm.can_write,
    can_delete: perm.can_delete,
    can_share: perm.can_share
  }
  modal.value.editingId = perm.id
}

const closeModal = () => {
  modal.value.visible = false
}

const onTargetTypeChange = () => {
  modal.value.targetId = ''
}

const getTargetName = () => {
  if (modal.value.targetType === 'user') {
    const user = users.value.find(u => u.id === modal.value.targetId)
    return user ? user.username : ''
  } else {
    const group = groups.value.find(g => g.id === modal.value.targetId)
    return group ? group.name : ''
  }
}

const showConfirmationModal = () => {
  if (!modal.value.targetId) return
  confirmationModal.value.visible = true
}

const closeConfirmationModal = () => {
  confirmationModal.value.visible = false
}

const closeSuccessModal = () => {
  successModal.value.visible = false
  closeModal()
  loadFolders()
}

const confirmSavePermission = async () => {
  try {
    if (modal.value.editing) {
      // Modification
      const permId = modal.value.editingId
      if (modal.value.targetType === 'user') {
        await permissionAPI.setFolderUserPermission(modal.value.folder.id, permId, modal.value.permissions)
      } else {
        await permissionAPI.setFolderGroupPermission(modal.value.folder.id, permId, modal.value.permissions)
      }
      store.dispatch('showSuccess', 'Permission modifiée')
      closeConfirmationModal()
      closeModal()
      loadFolders()
    } else {
      // Ajout
      const targetId = modal.value.targetId
      if (modal.value.targetType === 'user') {
        await permissionAPI.setFolderUserPermission(modal.value.folder.id, targetId, modal.value.permissions)
      } else {
        await permissionAPI.setFolderGroupPermission(modal.value.folder.id, targetId, modal.value.permissions)
      }
      
      // Show success modal
      successModal.value.visible = true
      successModal.value.targetName = getTargetName()
      successModal.value.folderName = modal.value.folder.name
      closeConfirmationModal()
    }
  } catch (err) {
    console.error(err)
    store.dispatch('showError', 'Impossible de sauvegarder la permission')
    closeConfirmationModal()
  }
}

// Additional methods for the enhanced UI
const openBulkPermissionModal = () => {
  bulkModal.value.visible = true
  bulkModal.value.selectedFolders = []
  bulkModal.value.targetType = 'user'
  bulkModal.value.targetId = ''
  bulkModal.value.permissions = { can_read: false, can_write: false, can_delete: false, can_share: false }
}

const viewFolderDetails = (folder) => {
  // Navigate to folder details view or open details modal
  console.log('View folder details:', folder)
  store.dispatch('showInfo', `Viewing details for ${folder.name}`)
}

const exportFolderPermissions = (folder) => {
  // Export folder permissions to CSV or JSON
  const permissions = folder.permissions.map(p => ({
    folder: folder.name,
    target: p.target_name,
    type: p.target_type,
    read: p.can_read,
    write: p.can_write,
    delete: p.can_delete,
    share: p.can_share
  }))
  
  const dataStr = JSON.stringify(permissions, null, 2)
  const dataBlob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(dataBlob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = `${folder.name}_permissions.json`
  link.click()
  
  URL.revokeObjectURL(url)
  store.dispatch('showSuccess', `Permissions exported for ${folder.name}`)
}

const duplicatePermission = (folder, perm) => {
  // Open modal with pre-filled permission data for duplication
  modal.value.visible = true
  modal.value.editing = false
  modal.value.folder = folder
  modal.value.targetType = perm.target_type
  modal.value.targetId = '' // Clear ID for new target
  modal.value.permissions = { 
    can_read: perm.can_read,
    can_write: perm.can_write,
    can_delete: perm.can_delete,
    can_share: perm.can_share
  }
}

// Watchers
watch(searchQuery, () => {
  currentPage.value = 1 // Reset to first page when searching
})

onMounted(() => loadFolders())
</script>
