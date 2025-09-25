<!-- components/Shared/PermissionModal.vue -->
<template>
  <div class="modal modal-open">
    <div class="modal-box max-w-4xl">
      <h3 class="font-bold text-lg mb-4">
        <i class="fas fa-shield-alt mr-2"></i>
        Gestion des permissions - {{ item?.name }}
      </h3>

      <!-- Admin restriction message -->
      <div v-if="!isAdmin" class="alert alert-warning mb-6">
        <i class="fas fa-exclamation-triangle"></i>
        <div>
          <h4 class="font-bold">Accès restreint</h4>
          <p>La gestion des permissions est réservée aux administrateurs.</p>
        </div>
      </div>

      <!-- Item Info -->
      <div class="bg-base-200 p-4 rounded-lg mb-6">
        <div class="flex items-center gap-3">
          <i :class="getItemIcon(item)" :style="{ color: getItemColor(item) }" class="text-2xl"></i>
          <div>
            <h4 class="font-semibold">{{ item?.name }}</h4>
            <p class="text-sm opacity-70">{{ item?.path }}</p>
            <p class="text-xs opacity-50">
              {{ item?.is_directory ? 'Dossier' : 'Fichier' }} 
              <span v-if="!item?.is_directory">- {{ formatBytes(item?.size) }}</span>
            </p>
          </div>
        </div>
      </div>

      <!-- Permissions Tabs -->
      <div v-if="isAdmin" class="tabs tabs-bordered mb-4">
        <button 
          class="tab"
          :class="{ 'tab-active': activeTab === 'users' }"
          @click="activeTab = 'users'"
        >
          <i class="fas fa-user mr-2"></i>
          Utilisateurs
        </button>
        <button 
          class="tab"
          :class="{ 'tab-active': activeTab === 'groups' }"
          @click="activeTab = 'groups'"
        >
          <i class="fas fa-users mr-2"></i>
          Groupes
        </button>
      </div>

      <!-- Users Tab -->
      <div v-if="isAdmin && activeTab === 'users'" class="space-y-4">
        <!-- Add User Permission -->
        <div class="card bg-base-100 border border-base-300">
          <div class="card-body p-4">
            <h5 class="card-title text-base">Ajouter une permission utilisateur</h5>
            <div class="flex gap-2">
              <select v-model="selectedUserId" class="select select-bordered select-sm flex-1">
                <option value="">Sélectionner un utilisateur</option>
                <option v-for="user in availableUsers" :key="user.id" :value="user.id">
                  {{ user.username }} ({{ user.email }})
                </option>
              </select>
              <button 
                @click="addUserPermission" 
                :disabled="!selectedUserId"
                class="btn btn-primary btn-sm"
              >
                <i class="fas fa-plus mr-1"></i>
                Ajouter
              </button>
            </div>
          </div>
        </div>

        <!-- User Permissions List -->
        <div class="space-y-2">
          <div 
            v-for="permission in userPermissions" 
            :key="permission.id"
            class="card bg-base-100 border border-base-300"
          >
            <div class="card-body p-4">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="avatar placeholder">
                    <div class="bg-primary text-primary-content rounded-full w-8">
                      <span class="text-xs">{{ permission.user?.username?.charAt(0).toUpperCase() }}</span>
                    </div>
                  </div>
                  <div>
                    <h6 class="font-semibold">{{ permission.user?.username }}</h6>
                    <p class="text-sm opacity-70">{{ permission.user?.email }}</p>
                  </div>
                </div>

                <div class="flex items-center gap-4">
                  <!-- Permission Checkboxes -->
                  <div class="flex gap-4">
                    <label class="label cursor-pointer gap-2">
                      <input 
                        type="checkbox" 
                        v-model="permission.can_read"
                        @change="updatePermission(permission)"
                        class="checkbox checkbox-sm"
                      />
                      <span class="label-text text-sm">Lecture</span>
                    </label>
                    <label class="label cursor-pointer gap-2">
                      <input 
                        type="checkbox" 
                        v-model="permission.can_write"
                        @change="updatePermission(permission)"
                        class="checkbox checkbox-sm"
                      />
                      <span class="label-text text-sm">Écriture</span>
                    </label>
                    <label class="label cursor-pointer gap-2">
                      <input 
                        type="checkbox" 
                        v-model="permission.can_delete"
                        @change="updatePermission(permission)"
                        class="checkbox checkbox-sm"
                      />
                      <span class="label-text text-sm">Suppression</span>
                    </label>
                    <label class="label cursor-pointer gap-2">
                      <input 
                        type="checkbox" 
                        v-model="permission.can_share"
                        @change="updatePermission(permission)"
                        class="checkbox checkbox-sm"
                      />
                      <span class="label-text text-sm">Partage</span>
                    </label>
                  </div>

                  <!-- Remove Button -->
                  <button 
                    @click="removePermission(permission)"
                    class="btn btn-error btn-sm btn-outline"
                  >
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Groups Tab -->
      <div v-if="isAdmin && activeTab === 'groups'" class="space-y-4">
        <!-- Add Group Permission -->
        <div class="card bg-base-100 border border-base-300">
          <div class="card-body p-4">
            <h5 class="card-title text-base">Ajouter une permission groupe</h5>
            <div class="flex gap-2">
              <select v-model="selectedGroupId" class="select select-bordered select-sm flex-1">
                <option value="">Sélectionner un groupe</option>
                <option v-for="group in availableGroups" :key="group.id" :value="group.id">
                  {{ group.name }}
                </option>
              </select>
              <button 
                @click="addGroupPermission" 
                :disabled="!selectedGroupId"
                class="btn btn-primary btn-sm"
              >
                <i class="fas fa-plus mr-1"></i>
                Ajouter
              </button>
            </div>
          </div>
        </div>

        <!-- Group Permissions List -->
        <div class="space-y-2">
          <div 
            v-for="permission in groupPermissions" 
            :key="permission.id"
            class="card bg-base-100 border border-base-300"
          >
            <div class="card-body p-4">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="avatar placeholder">
                    <div class="bg-secondary text-secondary-content rounded-full w-8">
                      <i class="fas fa-users text-xs"></i>
                    </div>
                  </div>
                  <div>
                    <h6 class="font-semibold">{{ permission.group?.name }}</h6>
                    <p class="text-sm opacity-70">{{ permission.group?.members?.length || 0 }} membre(s)</p>
                  </div>
                </div>

                <div class="flex items-center gap-4">
                  <!-- Permission Checkboxes -->
                  <div class="flex gap-4">
                    <label class="label cursor-pointer gap-2">
                      <input 
                        type="checkbox" 
                        v-model="permission.can_read"
                        @change="updatePermission(permission)"
                        class="checkbox checkbox-sm"
                      />
                      <span class="label-text text-sm">Lecture</span>
                    </label>
                    <label class="label cursor-pointer gap-2">
                      <input 
                        type="checkbox" 
                        v-model="permission.can_write"
                        @change="updatePermission(permission)"
                        class="checkbox checkbox-sm"
                      />
                      <span class="label-text text-sm">Écriture</span>
                    </label>
                    <label class="label cursor-pointer gap-2">
                      <input 
                        type="checkbox" 
                        v-model="permission.can_delete"
                        @change="updatePermission(permission)"
                        class="checkbox checkbox-sm"
                      />
                      <span class="label-text text-sm">Suppression</span>
                    </label>
                    <label class="label cursor-pointer gap-2">
                      <input 
                        type="checkbox" 
                        v-model="permission.can_share"
                        @change="updatePermission(permission)"
                        class="checkbox checkbox-sm"
                      />
                      <span class="label-text text-sm">Partage</span>
                    </label>
                  </div>

                  <!-- Remove Button -->
                  <button 
                    @click="removePermission(permission)"
                    class="btn btn-error btn-sm btn-outline"
                  >
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="isAdmin && ((activeTab === 'users' && userPermissions.length === 0) || (activeTab === 'groups' && groupPermissions.length === 0))" 
           class="text-center py-8">
        <i class="fas fa-shield-alt text-4xl opacity-30 mb-4"></i>
        <p class="text-lg opacity-70">Aucune permission définie</p>
        <p class="opacity-50">Ajoutez des permissions pour contrôler l'accès à cet élément</p>
      </div>

      <!-- Modal Actions -->
      <div class="modal-action">
        <button @click="closeModal" class="btn btn-outline">
          Fermer
        </button>
      </div>
    </div>

    <!-- Confirmation Modal -->
    <div v-if="confirmationModal.visible" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white p-6 rounded-lg shadow-xl w-96 max-w-md">
        <h3 class="font-bold text-lg mb-4 flex items-center">
          <i class="fas fa-exclamation-triangle text-warning mr-2"></i>
          Confirmer l'action
        </h3>
        <div class="mb-6">
          <p class="mb-4">{{ getConfirmationMessage() }}</p>
          <div v-if="confirmationModal.permission" class="bg-base-200 p-4 rounded-lg">
            <div class="font-semibold mb-2">
              <i :class="['fas', 'mr-2', confirmationModal.permission.user_id ? 'fa-user' : 'fa-users']"></i>
              {{ getPermissionTargetName(confirmationModal.permission) }}
            </div>
            <div v-if="confirmationModal.type !== 'remove'" class="flex gap-2 flex-wrap">
              <span v-if="confirmationModal.permission.can_read" class="badge badge-success">Lecture</span>
              <span v-if="confirmationModal.permission.can_write" class="badge badge-warning">Écriture</span>
              <span v-if="confirmationModal.permission.can_delete" class="badge badge-error">Suppression</span>
              <span v-if="confirmationModal.permission.can_share" class="badge badge-info">Partage</span>
            </div>
          </div>
        </div>
        <div class="flex justify-end gap-2">
          <button class="btn btn-outline" @click="closeConfirmationModal">Annuler</button>
          <button class="btn btn-primary" @click="executeConfirmedAction">
            <i class="fas fa-check mr-2"></i>
            Confirmer
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { adminAPI, permissionAPI } from '@/services/api'
import { useStore } from 'vuex'

const props = defineProps({
  item: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close', 'updated'])

const store = useStore()

// State
const activeTab = ref('users')
const userPermissions = ref([])
const groupPermissions = ref([])
const availableUsers = ref([])
const availableGroups = ref([])
const selectedUserId = ref('')
const selectedGroupId = ref('')
const loading = ref(false)

// Admin check
const isAdmin = computed(() => store.getters.isAdmin)

// Confirmation modal state
const confirmationModal = ref({
  visible: false,
  type: '', // 'add', 'update', 'remove'
  permission: null,
  action: null
})

// Methods
const loadPermissions = async () => {
  if (!props.item || !isAdmin.value) return
  
  loading.value = true
  try {
    const endpoint = props.item.is_directory ? 'folders' : 'files'
    const itemId = encodeURIComponent(props.item.path || props.item.id)
    const response = await permissionAPI[`get${props.item.is_directory ? 'Folder' : 'File'}Permissions`](itemId)
    
    userPermissions.value = response.data.user_permissions || []
    groupPermissions.value = response.data.group_permissions || []
  } catch (error) {
    console.error('Error loading permissions:', error)
    store.dispatch('showError', 'Erreur lors du chargement des permissions')
  } finally {
    loading.value = false
  }
}

const loadAvailableUsersAndGroups = async () => {
  if (!isAdmin.value) return
  
  try {
    const [usersResponse, groupsResponse] = await Promise.all([
      adminAPI.getUsers(),
      adminAPI.getGroups()
    ])
    
    availableUsers.value = usersResponse.data || []
    availableGroups.value = groupsResponse.data || []
  } catch (error) {
    console.error('Error loading users and groups:', error)
    store.dispatch('showError', 'Erreur lors du chargement des utilisateurs et groupes')
  }
}

const addUserPermission = async () => {
  if (!selectedUserId.value || !isAdmin.value) return
  
  const permissions = {
    can_read: true,
    can_write: false,
    can_delete: false,
    can_share: false
  }
  
  const user = availableUsers.value.find(u => u.id === selectedUserId.value)
  
  confirmationModal.value = {
    visible: true,
    type: 'add',
    permission: {
      ...permissions,
      user_id: selectedUserId.value,
      target_name: user?.username || 'Utilisateur inconnu'
    },
    action: async () => {
      try {
        const endpoint = props.item.is_directory ? 'setFolderUserPermission' : 'setFileUserPermission'
        const itemId = encodeURIComponent(props.item.path || props.item.id)
        await permissionAPI[endpoint](itemId, selectedUserId.value, permissions)
        
        selectedUserId.value = ''
        await loadPermissions()
        emit('updated')
        
        store.dispatch('showSuccess', `Permission ajoutée avec succès pour ${user?.username}`)
      } catch (error) {
        console.error('Error adding user permission:', error)
        store.dispatch('showError', 'Erreur lors de l\'ajout de la permission')
      }
    }
  }
}

const addGroupPermission = async () => {
  if (!selectedGroupId.value || !isAdmin.value) return
  
  const permissions = {
    can_read: true,
    can_write: false,
    can_delete: false,
    can_share: false
  }
  
  const group = availableGroups.value.find(g => g.id === selectedGroupId.value)
  
  confirmationModal.value = {
    visible: true,
    type: 'add',
    permission: {
      ...permissions,
      group_id: selectedGroupId.value,
      target_name: group?.name || 'Groupe inconnu'
    },
    action: async () => {
      try {
        const endpoint = props.item.is_directory ? 'setFolderGroupPermission' : 'setFileGroupPermission'
        const itemId = encodeURIComponent(props.item.path || props.item.id)
        await permissionAPI[endpoint](itemId, selectedGroupId.value, permissions)
        
        selectedGroupId.value = ''
        await loadPermissions()
        emit('updated')
        
        store.dispatch('showSuccess', `Permission ajoutée avec succès pour le groupe ${group?.name}`)
      } catch (error) {
        console.error('Error adding group permission:', error)
        store.dispatch('showError', 'Erreur lors de l\'ajout de la permission')
      }
    }
  }
}

const updatePermission = async (permission) => {
  if (!isAdmin.value) return
  
  confirmationModal.value = {
    visible: true,
    type: 'update',
    permission: { ...permission },
    action: async () => {
      try {
        const permissions = {
          can_read: permission.can_read,
          can_write: permission.can_write,
          can_delete: permission.can_delete,
          can_share: permission.can_share
        }
        
        if (permission.user_id) {
          const endpoint = props.item.is_directory ? 'setFolderUserPermission' : 'setFileUserPermission'
          const itemId = encodeURIComponent(props.item.path || props.item.id)
          await permissionAPI[endpoint](itemId, permission.user_id, permissions)
        } else if (permission.group_id) {
          const endpoint = props.item.is_directory ? 'setFolderGroupPermission' : 'setFileGroupPermission'
          const itemId = encodeURIComponent(props.item.path || props.item.id)
          await permissionAPI[endpoint](itemId, permission.group_id, permissions)
        }
        
        await loadPermissions()
        emit('updated')
        
        const targetName = getPermissionTargetName(permission)
        store.dispatch('showSuccess', `Permissions mises à jour pour ${targetName}`)
      } catch (error) {
        console.error('Error updating permission:', error)
        store.dispatch('showError', 'Erreur lors de la mise à jour des permissions')
      }
    }
  }
}

const removePermission = async (permission) => {
  if (!isAdmin.value) return
  
  confirmationModal.value = {
    visible: true,
    type: 'remove',
    permission: { ...permission },
    action: async () => {
      try {
        const endpoint = props.item.is_directory ? 'deleteFolderPermission' : 'deleteFilePermission'
        const itemId = encodeURIComponent(props.item.path || props.item.id)
        await permissionAPI[endpoint](itemId, permission.id)
        
        await loadPermissions()
        emit('updated')
        
        const targetName = getPermissionTargetName(permission)
        store.dispatch('showSuccess', `Permission supprimée pour ${targetName}`)
      } catch (error) {
        console.error('Error removing permission:', error)
        store.dispatch('showError', 'Erreur lors de la suppression de la permission')
      }
    }
  }
}

// Modal management
const closeModal = () => {
  emit('close')
}

const closeConfirmationModal = () => {
  confirmationModal.value.visible = false
}

const executeConfirmedAction = async () => {
  if (confirmationModal.value.action) {
    await confirmationModal.value.action()
  }
  closeConfirmationModal()
}

const getConfirmationMessage = () => {
  switch (confirmationModal.value.type) {
    case 'add':
      return 'Voulez-vous ajouter cette permission ?'
    case 'update':
      return 'Voulez-vous modifier cette permission ?'
    case 'remove':
      return 'Voulez-vous supprimer cette permission ?'
    default:
      return 'Voulez-vous confirmer cette action ?'
  }
}

const getPermissionTargetName = (permission) => {
  if (permission.user) return permission.user.username
  if (permission.group) return permission.group.name
  if (permission.target_name) return permission.target_name
  return permission.user_id ? 'Utilisateur' : 'Groupe'
}

// Utility functions
const formatBytes = (bytes) => {
  if (!bytes || bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const getItemIcon = (item) => {
  if (!item) return 'fas fa-file'
  
  if (item.is_directory) {
    return 'fas fa-folder'
  }
  
  const ext = item.name?.split('.').pop()?.toLowerCase() || ''
  const iconMap = {
    'pdf': 'fas fa-file-pdf',
    'doc': 'fas fa-file-word',
    'docx': 'fas fa-file-word',
    'xls': 'fas fa-file-excel',
    'xlsx': 'fas fa-file-excel',
    'jpg': 'fas fa-file-image',
    'jpeg': 'fas fa-file-image',
    'png': 'fas fa-file-image',
    'gif': 'fas fa-file-image',
    'mp4': 'fas fa-file-video',
    'avi': 'fas fa-file-video',
    'mp3': 'fas fa-file-audio',
    'wav': 'fas fa-file-audio',
    'zip': 'fas fa-file-archive',
    'rar': 'fas fa-file-archive',
    'txt': 'fas fa-file-alt',
    'js': 'fas fa-file-code',
    'html': 'fas fa-file-code',
    'css': 'fas fa-file-code'
  }
  return iconMap[ext] || 'fas fa-file'
}

const getItemColor = (item) => {
  if (!item) return '#6b7280'
  
  if (item.is_directory) {
    return '#3b82f6'
  }
  
  const ext = item.name?.split('.').pop()?.toLowerCase() || ''
  const colorMap = {
    'pdf': '#dc2626',
    'doc': '#2563eb',
    'docx': '#2563eb',
    'xls': '#059669',
    'xlsx': '#059669',
    'jpg': '#7c3aed',
    'jpeg': '#7c3aed',
    'png': '#7c3aed',
    'gif': '#7c3aed',
    'mp4': '#ea580c',
    'avi': '#ea580c',
    'mp3': '#10b981',
    'wav': '#10b981',
    'zip': '#6b7280',
    'rar': '#6b7280',
    'txt': '#374151',
    'js': '#fbbf24',
    'html': '#f97316',
    'css': '#06b6d4'
  }
  return colorMap[ext] || '#6b7280'
}

// Lifecycle
onMounted(() => {
  if (isAdmin.value) {
    loadPermissions()
    loadAvailableUsersAndGroups()
  }
})
</script>