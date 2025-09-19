<!-- components/Shared/PermissionModal.vue -->
<template>
  <div class="modal modal-open">
    <div class="modal-box max-w-4xl">
      <h3 class="font-bold text-lg mb-4">
        <i class="fas fa-shield-alt mr-2"></i>
        Gestion des permissions - {{ item?.name }}
      </h3>

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
      <div class="tabs tabs-bordered mb-4">
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
      <div v-if="activeTab === 'users'" class="space-y-4">
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
      <div v-if="activeTab === 'groups'" class="space-y-4">
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
      <div v-if="(activeTab === 'users' && userPermissions.length === 0) || (activeTab === 'groups' && groupPermissions.length === 0)" 
           class="text-center py-8">
        <i class="fas fa-shield-alt text-4xl opacity-30 mb-4"></i>
        <p class="text-lg opacity-70">Aucune permission définie</p>
        <p class="opacity-50">Ajoutez des permissions pour contrôler l'accès à cet élément</p>
      </div>

      <!-- Modal Actions -->
      <div class="modal-action">
        <button @click="$emit('close')" class="btn btn-outline">
          Fermer
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { adminAPI, permissionAPI } from '@/services/api'

const props = defineProps({
  item: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close', 'updated'])

// State
const activeTab = ref('users')
const userPermissions = ref([])
const groupPermissions = ref([])
const availableUsers = ref([])
const availableGroups = ref([])
const selectedUserId = ref('')
const selectedGroupId = ref('')
const loading = ref(false)

// Methods
const loadPermissions = async () => {
  if (!props.item) return
  
  loading.value = true
  try {
    const endpoint = props.item.is_directory ? 'folders' : 'files'
    const response = await permissionAPI[`get${props.item.is_directory ? 'Folder' : 'File'}Permissions`](props.item.id)
    
    userPermissions.value = response.data.user_permissions || []
    groupPermissions.value = response.data.group_permissions || []
  } catch (error) {
    console.error('Error loading permissions:', error)
  } finally {
    loading.value = false
  }
}

const loadAvailableUsersAndGroups = async () => {
  try {
    const [usersResponse, groupsResponse] = await Promise.all([
      adminAPI.getUsers(),
      adminAPI.getGroups()
    ])
    
    availableUsers.value = usersResponse.data || []
    availableGroups.value = groupsResponse.data || []
  } catch (error) {
    console.error('Error loading users and groups:', error)
  }
}

const addUserPermission = async () => {
  if (!selectedUserId.value) return
  
  try {
    const permissions = {
      can_read: true,
      can_write: false,
      can_delete: false,
      can_share: false
    }
    
    const endpoint = props.item.is_directory ? 'setFolderUserPermission' : 'setFileUserPermission'
    await permissionAPI[endpoint](props.item.id, selectedUserId.value, permissions)
    
    selectedUserId.value = ''
    await loadPermissions()
    emit('updated')
  } catch (error) {
    console.error('Error adding user permission:', error)
  }
}

const addGroupPermission = async () => {
  if (!selectedGroupId.value) return
  
  try {
    const permissions = {
      can_read: true,
      can_write: false,
      can_delete: false,
      can_share: false
    }
    
    const endpoint = props.item.is_directory ? 'setFolderGroupPermission' : 'setFileGroupPermission'
    await permissionAPI[endpoint](props.item.id, selectedGroupId.value, permissions)
    
    selectedGroupId.value = ''
    await loadPermissions()
    emit('updated')
  } catch (error) {
    console.error('Error adding group permission:', error)
  }
}

const updatePermission = async (permission) => {
  try {
    const permissions = {
      can_read: permission.can_read,
      can_write: permission.can_write,
      can_delete: permission.can_delete,
      can_share: permission.can_share
    }
    
    if (permission.user_id) {
      const endpoint = props.item.is_directory ? 'setFolderUserPermission' : 'setFileUserPermission'
      await permissionAPI[endpoint](props.item.id, permission.user_id, permissions)
    } else if (permission.group_id) {
      const endpoint = props.item.is_directory ? 'setFolderGroupPermission' : 'setFileGroupPermission'
      await permissionAPI[endpoint](props.item.id, permission.group_id, permissions)
    }
    
    emit('updated')
  } catch (error) {
    console.error('Error updating permission:', error)
  }
}

const removePermission = async (permission) => {
  try {
    const endpoint = props.item.is_directory ? 'deleteFolderPermission' : 'deleteFilePermission'
    await permissionAPI[endpoint](props.item.id, permission.id)
    
    await loadPermissions()
    emit('updated')
  } catch (error) {
    console.error('Error removing permission:', error)
  }
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
  loadPermissions()
  loadAvailableUsersAndGroups()
})
</script>