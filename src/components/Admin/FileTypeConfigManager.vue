<!-- components/Admin/FileTypeConfigManager.vue -->
<template>
  <div class="p-6">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-3xl font-bold">Configuration des Types de Fichiers</h1>
        <p class="text-base-content/70 mt-1">
          Gérez les types de fichiers supportés et leurs paramètres
        </p>
      </div>
      <div class="flex gap-2">
        <button 
          class="btn btn-secondary btn-sm"
          @click="initializeDefaults"
          :disabled="loading"
        >
          <i class="fas fa-cog mr-2"></i>
          Initialiser par défaut
        </button>
        <button 
          class="btn btn-primary btn-sm"
          @click="showCreateModal = true"
        >
          <i class="fas fa-plus mr-2"></i>
          Nouveau Type
        </button>
      </div>
    </div>

    <!-- Error Alert -->
    <div v-if="error" class="alert alert-error mb-6">
      <i class="fas fa-exclamation-triangle"></i>
      <span>{{ error }}</span>
    </div>

    <!-- Success Alert -->
    <div v-if="successMessage" class="alert alert-success mb-6">
      <i class="fas fa-check-circle"></i>
      <span>{{ successMessage }}</span>
    </div>

    <!-- Loading State -->
    <div v-if="loading && configs.length === 0" class="flex justify-center items-center py-12">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <!-- Stats Cards -->
    <div v-else class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div class="stat bg-base-100 shadow rounded-lg">
        <div class="stat-figure text-primary">
          <i class="fas fa-file text-2xl"></i>
        </div>
        <div class="stat-title">Types Totaux</div>
        <div class="stat-value text-primary">{{ configs.length }}</div>
      </div>
      
      <div class="stat bg-base-100 shadow rounded-lg">
        <div class="stat-figure text-success">
          <i class="fas fa-eye text-2xl"></i>
        </div>
        <div class="stat-title">Visualisables</div>
        <div class="stat-value text-success">{{ viewableCount }}</div>
      </div>
      
      <div class="stat bg-base-100 shadow rounded-lg">
        <div class="stat-figure text-info">
          <i class="fas fa-edit text-2xl"></i>
        </div>
        <div class="stat-title">Éditables</div>
        <div class="stat-value text-info">{{ editableCount }}</div>
      </div>
      
      <div class="stat bg-base-100 shadow rounded-lg">
        <div class="stat-figure text-warning">
          <i class="fas fa-toggle-on text-2xl"></i>
        </div>
        <div class="stat-title">Activés</div>
        <div class="stat-value text-warning">{{ enabledCount }}</div>
      </div>
    </div>

    <!-- Configurations Table -->
    <div class="card bg-base-100 shadow-xl">
      <div class="card-body">
        <div class="overflow-x-auto">
          <table class="table table-zebra w-full">
            <thead>
              <tr>
                <th>Type</th>
                <th>Extensions</th>
                <th>Handler</th>
                <th>Taille Max</th>
                <th>Capacités</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="config in configs" :key="config.id">
                <td>
                  <div class="flex items-center gap-3">
                    <i :class="config.icon_class" class="text-lg"></i>
                    <div>
                      <div class="font-bold">{{ config.display_name }}</div>
                      <div class="text-sm opacity-50">{{ config.type_name }}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div class="flex flex-wrap gap-1">
                    <span 
                      v-for="ext in config.extensions.slice(0, 3)" 
                      :key="ext"
                      class="badge badge-outline badge-xs"
                    >
                      .{{ ext }}
                    </span>
                    <span 
                      v-if="config.extensions.length > 3"
                      class="badge badge-ghost badge-xs"
                    >
                      +{{ config.extensions.length - 3 }}
                    </span>
                  </div>
                </td>
                <td>
                  <span class="badge badge-secondary">{{ config.handler_name }}</span>
                </td>
                <td>{{ config.max_size_mb }}MB</td>
                <td>
                  <div class="flex gap-1">
                    <span 
                      v-if="config.is_viewable"
                      class="badge badge-success badge-xs"
                    >
                      Vue
                    </span>
                    <span 
                      v-if="config.is_editable"
                      class="badge badge-info badge-xs"
                    >
                      Édition
                    </span>
                  </div>
                </td>
                <td>
                  <div class="form-control">
                    <label class="label cursor-pointer">
                      <input 
                        type="checkbox" 
                        class="toggle toggle-success"
                        :checked="config.is_enabled"
                        @change="toggleConfig(config.id)"
                        :disabled="loading"
                      />
                    </label>
                  </div>
                </td>
                <td>
                  <div class="flex gap-1">
                    <button 
                      class="btn btn-ghost btn-xs"
                      @click="editConfig(config)"
                      :disabled="loading"
                    >
                      <i class="fas fa-edit"></i>
                    </button>
                    <button 
                      class="btn btn-ghost btn-xs text-error"
                      @click="confirmDelete(config)"
                      :disabled="loading"
                    >
                      <i class="fas fa-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <div v-if="showCreateModal || showEditModal" class="modal modal-open">
      <div class="modal-box max-w-4xl">
        <h3 class="font-bold text-lg mb-4">
          {{ showEditModal ? 'Modifier' : 'Créer' }} une Configuration
        </h3>
        
        <form @submit.prevent="saveConfig" class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Basic Info -->
            <div class="form-control">
              <label class="label">
                <span class="label-text">Nom du Type *</span>
              </label>
              <input 
                type="text" 
                class="input input-bordered"
                v-model="formData.type_name"
                :disabled="showEditModal"
                required
              />
            </div>
            
            <div class="form-control">
              <label class="label">
                <span class="label-text">Nom d'Affichage *</span>
              </label>
              <input 
                type="text" 
                class="input input-bordered"
                v-model="formData.display_name"
                required
              />
            </div>
            
            <div class="form-control">
              <label class="label">
                <span class="label-text">Handler *</span>
              </label>
              <select class="select select-bordered" v-model="formData.handler_name" required>
                <option value="">Sélectionner un handler</option>
                <option value="TextHandler">TextHandler</option>
                <option value="ImageHandler">ImageHandler</option>
                <option value="VideoHandler">VideoHandler</option>
                <option value="AudioHandler">AudioHandler</option>
                <option value="PDFHandler">PDFHandler</option>
                <option value="DocumentHandler">DocumentHandler</option>
              </select>
            </div>
            
            <div class="form-control">
              <label class="label">
                <span class="label-text">Icône CSS</span>
              </label>
              <input 
                type="text" 
                class="input input-bordered"
                v-model="formData.icon_class"
                placeholder="fas fa-file"
              />
            </div>
            
            <div class="form-control">
              <label class="label">
                <span class="label-text">Taille Max (MB)</span>
              </label>
              <input 
                type="number" 
                class="input input-bordered"
                v-model.number="formData.max_size_mb"
                min="1"
                max="5000"
              />
            </div>
          </div>
          
          <!-- Capabilities -->
          <div class="flex gap-4">
            <div class="form-control">
              <label class="label cursor-pointer">
                <span class="label-text">Visualisable</span>
                <input 
                  type="checkbox" 
                  class="checkbox"
                  v-model="formData.is_viewable"
                />
              </label>
            </div>
            
            <div class="form-control">
              <label class="label cursor-pointer">
                <span class="label-text">Éditable</span>
                <input 
                  type="checkbox" 
                  class="checkbox"
                  v-model="formData.is_editable"
                />
              </label>
            </div>
            
            <div class="form-control">
              <label class="label cursor-pointer">
                <span class="label-text">Activé</span>
                <input 
                  type="checkbox" 
                  class="checkbox"
                  v-model="formData.is_enabled"
                />
              </label>
            </div>
          </div>
          
          <!-- MIME Types -->
          <div class="form-control">
            <label class="label">
              <span class="label-text">Types MIME (un par ligne) *</span>
            </label>
            <textarea 
              class="textarea textarea-bordered h-24"
              v-model="mimeTypesText"
              placeholder="text/plain&#10;application/json"
              required
            ></textarea>
          </div>
          
          <!-- Extensions -->
          <div class="form-control">
            <label class="label">
              <span class="label-text">Extensions (un par ligne) *</span>
            </label>
            <textarea 
              class="textarea textarea-bordered h-24"
              v-model="extensionsText"
              placeholder="txt&#10;json"
              required
            ></textarea>
          </div>
          
          <!-- Settings JSON -->
          <div class="form-control">
            <label class="label">
              <span class="label-text">Paramètres (JSON)</span>
            </label>
            <textarea 
              class="textarea textarea-bordered h-32"
              v-model="settingsText"
              placeholder='{"encoding": "utf-8", "line_numbers": true}'
            ></textarea>
          </div>
          
          <div class="modal-action">
            <button type="button" class="btn" @click="closeModal">Annuler</button>
            <button type="submit" class="btn btn-primary" :disabled="loading">
              {{ loading ? 'Sauvegarde...' : 'Sauvegarder' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="modal modal-open">
      <div class="modal-box">
        <h3 class="font-bold text-lg">Confirmer la Suppression</h3>
        <p class="py-4">
          Êtes-vous sûr de vouloir supprimer la configuration 
          <strong>{{ configToDelete?.display_name }}</strong> ?
          Cette action est irréversible.
        </p>
        <div class="modal-action">
          <button class="btn" @click="showDeleteModal = false">Annuler</button>
          <button class="btn btn-error" @click="deleteConfig" :disabled="loading">
            Supprimer
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import { fileTypeConfigAPI } from '@/services/fileTypeConfigAPI'

const store = useStore()

// Reactive data
const configs = ref([])
const loading = ref(false)
const error = ref('')
const successMessage = ref('')

// Modal states
const showCreateModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const configToDelete = ref(null)

// Form data
const formData = ref({
  type_name: '',
  display_name: '',
  handler_name: '',
  icon_class: 'fas fa-file',
  is_viewable: true,
  is_editable: false,
  is_enabled: true,
  max_size_mb: 100,
  mime_types: [],
  extensions: [],
  settings: {}
})

const mimeTypesText = ref('')
const extensionsText = ref('')
const settingsText = ref('')

// Computed properties
const viewableCount = computed(() => configs.value.filter(c => c.is_viewable).length)
const editableCount = computed(() => configs.value.filter(c => c.is_editable).length)
const enabledCount = computed(() => configs.value.filter(c => c.is_enabled).length)

// Methods
const loadConfigs = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const data = await fileTypeConfigAPI.getAllConfigs()

    // Normalize response: backend may return { configs: [...] } or an array directly
    let list = []
    if (Array.isArray(data)) {
      list = data
    } else if (data && Array.isArray(data.configs)) {
      list = data.configs
    } else if (data && Array.isArray(data.items)) {
      list = data.items
    } else {
      // If the API returned a single object, wrap it for safety
      list = data ? [data] : []
    }

    // Ensure every config has expected fields to avoid template runtime errors
    configs.value = list.map(c => ({
      id: c.id,
      display_name: c.display_name || c.name || c.displayName || 'Type',
      type_name: c.type_name || c.type || c.typeName || '',
      icon_class: c.icon_class || c.icon || 'fas fa-file',
      extensions: Array.isArray(c.extensions) ? c.extensions : (typeof c.extensions === 'string' ? c.extensions.split(',').map(s => s.trim()).filter(Boolean) : (c.extensions || [])),
      mime_types: Array.isArray(c.mime_types) ? c.mime_types : (c.mime_types || []),
      handler_name: c.handler_name || c.handler || '',
      max_size_mb: c.max_size_mb || c.max_size || 100,
      is_viewable: !!c.is_viewable,
      is_editable: !!c.is_editable,
      is_enabled: c.is_enabled === undefined ? true : !!c.is_enabled,
      settings: c.settings || {}
    }))
  } catch (err) {
    error.value = 'Erreur lors du chargement des configurations'
    console.error('Error loading configs:', err)
  } finally {
    loading.value = false
  }
}

const initializeDefaults = async () => {
  loading.value = true
  error.value = ''
  
  try {
    await fileTypeConfigAPI.initializeDefaults()
    successMessage.value = 'Configurations par défaut initialisées avec succès'
    setTimeout(() => { successMessage.value = '' }, 3000)
    await loadConfigs()
  } catch (err) {
    error.value = 'Erreur lors de l\'initialisation des configurations par défaut'
    console.error('Error initializing defaults:', err)
  } finally {
    loading.value = false
  }
}

const editConfig = (config) => {
  formData.value = { ...config }
  mimeTypesText.value = (config.mime_types || []).join('\n')
  extensionsText.value = (config.extensions || []).join('\n')
  settingsText.value = JSON.stringify(config.settings || {}, null, 2)
  showEditModal.value = true
}

const closeModal = () => {
  showCreateModal.value = false
  showEditModal.value = false
  resetForm()
}

const resetForm = () => {
  formData.value = {
    type_name: '',
    display_name: '',
    handler_name: '',
    icon_class: 'fas fa-file',
    is_viewable: true,
    is_editable: false,
    is_enabled: true,
    max_size_mb: 100,
    mime_types: [],
    extensions: [],
    settings: {}
  }
  mimeTypesText.value = ''
  extensionsText.value = ''
  settingsText.value = ''
}

const saveConfig = async () => {
  loading.value = true
  error.value = ''
  
  try {
    // Parse text inputs
    const mimeTypes = mimeTypesText.value.split('\n').map(s => s.trim()).filter(s => s)
    const extensions = extensionsText.value.split('\n').map(s => s.trim()).filter(s => s)
    let settings = {}
    
    if (settingsText.value.trim()) {
      try {
        settings = JSON.parse(settingsText.value)
      } catch (e) {
        error.value = 'Format JSON invalide dans les paramètres'
        return
      }
    }
    
    const configData = {
      ...formData.value,
      mime_types: mimeTypes,
      extensions: extensions,
      settings: settings
    }
    
    if (showEditModal.value) {
      await fileTypeConfigAPI.updateConfig(formData.value.id, configData)
      successMessage.value = 'Configuration mise à jour avec succès'
    } else {
      await fileTypeConfigAPI.createConfig(configData)
      successMessage.value = 'Configuration créée avec succès'
    }
    
    setTimeout(() => { successMessage.value = '' }, 3000)
    closeModal()
    await loadConfigs()
  } catch (err) {
    error.value = err.response?.data?.error || 'Erreur lors de la sauvegarde'
    console.error('Error saving config:', err)
  } finally {
    loading.value = false
  }
}

const toggleConfig = async (configId) => {
  loading.value = true
  error.value = ''
  
  try {
    await fileTypeConfigAPI.toggleConfig(configId)
    await loadConfigs()
  } catch (err) {
    error.value = 'Erreur lors du changement de statut'
    console.error('Error toggling config:', err)
  } finally {
    loading.value = false
  }
}

const confirmDelete = (config) => {
  configToDelete.value = config
  showDeleteModal.value = true
}

const deleteConfig = async () => {
  if (!configToDelete.value) return
  
  loading.value = true
  error.value = ''
  
  try {
    await fileTypeConfigAPI.deleteConfig(configToDelete.value.id)
    successMessage.value = 'Configuration supprimée avec succès'
    setTimeout(() => { successMessage.value = '' }, 3000)
    showDeleteModal.value = false
    configToDelete.value = null
    await loadConfigs()
  } catch (err) {
    error.value = 'Erreur lors de la suppression'
    console.error('Error deleting config:', err)
  } finally {
    loading.value = false
  }
}

// Lifecycle
onMounted(() => {
  loadConfigs()
})
</script>

<style scoped>
.stat {
  @apply border border-base-300;
}

.card {
  @apply border border-base-300;
}
</style>