<!-- components/Shared/PropertiesModal.vue -->
<template>
  <div class="modal modal-open">
    <div class="modal-box max-w-2xl">
      <h3 class="font-bold text-lg mb-4">
        <i class="fas fa-info-circle mr-2"></i>
        Propriétés - {{ item?.name }}
      </h3>

      <!-- Item preview -->
      <div class="bg-base-200 p-6 rounded-lg mb-6 text-center">
        <div class="text-6xl mb-4">
          <i :class="getItemIcon(item)" :style="{ color: getItemColor(item) }"></i>
        </div>
        <h4 class="text-xl font-bold mb-2">{{ item?.name }}</h4>
        <p class="text-sm opacity-70">{{ item?.is_directory ? 'Dossier' : getFileType(item?.name) }}</p>
      </div>

      <!-- Properties tabs -->
      <div class="tabs tabs-bordered mb-4">
        <button class="tab" :class="{ 'tab-active': activeTab === 'general' }" @click="activeTab = 'general'">
          <i class="fas fa-info mr-2"></i>
          Général
        </button>
        <button class="tab" :class="{ 'tab-active': activeTab === 'permissions' }" @click="activeTab = 'permissions'">
          <i class="fas fa-shield-alt mr-2"></i>
          Permissions
        </button>
        <button v-if="!item?.is_directory" class="tab" :class="{ 'tab-active': activeTab === 'details' }"
          @click="activeTab = 'details'">
          <i class="fas fa-list mr-2"></i>
          Détails
        </button>
      </div>

      <!-- General tab -->
      <div v-if="activeTab === 'general'" class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Basic info -->
          <div class="space-y-3">
            <div>
              <label class="text-sm font-semibold opacity-70">Nom</label>
              <p class="font-mono bg-base-100 p-2 rounded border">{{ item?.name }}</p>
            </div>

            <div>
              <label class="text-sm font-semibold opacity-70">Chemin</label>
              <p class="font-mono bg-base-100 p-2 rounded border text-sm">{{ item?.path }}</p>
            </div>

            <div>
              <label class="text-sm font-semibold opacity-70">Type</label>
              <p class="bg-base-100 p-2 rounded border">
                {{ item?.is_directory ? 'Dossier' : getFileType(item?.name) }}
              </p>
            </div>
          </div>

          <!-- Size and dates -->
          <div class="space-y-3">
            <div v-if="!item?.is_directory">
              <label class="text-sm font-semibold opacity-70">Taille</label>
              <p class="bg-base-100 p-2 rounded border">{{ formatBytes(item?.size) }}</p>
            </div>

            <div>
              <label class="text-sm font-semibold opacity-70">Créé le</label>
              <p class="bg-base-100 p-2 rounded border">{{ formatDate(item?.created) }}</p>
            </div>

            <div>
              <label class="text-sm font-semibold opacity-70">Modifié le</label>
              <p class="bg-base-100 p-2 rounded border">{{ formatDate(item?.modified) }}</p>
            </div>
          </div>
        </div>

        <!-- Path breakdown -->
        <div>
          <label class="text-sm font-semibold opacity-70">Arborescence</label>
          <div class="bg-base-100 p-3 rounded border">
            <nav class="text-sm breadcrumbs">
              <ul>
                <li><i class="fas fa-home"></i></li>
                <li v-for="(segment, index) in pathSegments" :key="index">
                  {{ segment }}
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </div>

      <!-- Permissions tab -->
      <div v-if="activeTab === 'permissions'" class="space-y-4">
        <div class="alert alert-info">
          <i class="fas fa-info-circle"></i>
          <div>
            <h4 class="font-bold">Permissions NAS</h4>
            <p>Les permissions sont gérées par l'administrateur système.</p>
          </div>
        </div>

        <!-- Current user permissions -->
        <div class="card bg-base-100 border border-base-300">
          <div class="card-body p-4">
            <h5 class="card-title text-base">Vos permissions</h5>
            <div class="grid grid-cols-2 gap-4">
              <div class="flex items-center gap-2">
                <i class="fas fa-eye" :class="canRead ? 'text-success' : 'text-error'"></i>
                <span>Lecture : {{ canRead ? 'Autorisée' : 'Refusée' }}</span>
              </div>
              <div class="flex items-center gap-2">
                <i class="fas fa-edit" :class="canWrite ? 'text-success' : 'text-error'"></i>
                <span>Écriture : {{ canWrite ? 'Autorisée' : 'Refusée' }}</span>
              </div>
              <div class="flex items-center gap-2">
                <i class="fas fa-trash" :class="canDelete ? 'text-success' : 'text-error'"></i>
                <span>Suppression : {{ canDelete ? 'Autorisée' : 'Refusée' }}</span>
              </div>
              <div class="flex items-center gap-2">
                <i class="fas fa-share" :class="canShare ? 'text-success' : 'text-error'"></i>
                <span>Partage : {{ canShare ? 'Autorisé' : 'Refusé' }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Permissions -->
        <div class="card bg-base-100 border border-base-300">
          <div class="card-body p-4">
            <h5 class="card-title text-base">Permissions</h5>

            <div v-if="itemPermissions.length > 0" class="space-y-3">
              <div v-for="perm in itemPermissions" :key="perm.id"
                class="border border-base-200 rounded p-3 bg-base-200">
                <div class="flex items-center justify-between mb-2">
                  <div class="flex items-center gap-2">
                    <i class="fas"
                      :class="perm.target_type === 'user' ? 'fa-user text-primary' : 'fa-users text-secondary'"></i>
                    <div>
                      <div class="font-medium text-sm">{{ perm.target_name }}</div>
                      <div class="text-xs text-base-content/50">
                        {{ perm.target_type === 'user' ? 'Utilisateur' : 'Groupe' }}
                      </div>
                    </div>
                  </div>
                </div>
                <div class="flex gap-2 flex-wrap">
                  <span v-if="perm.can_read" class="badge badge-success badge-sm">Lecture</span>
                  <span v-else class="badge badge-outline badge-sm">Lecture</span>
                  <span v-if="perm.can_write" class="badge badge-warning badge-sm">Écriture</span>
                  <span v-else class="badge badge-outline badge-sm">Écriture</span>
                  <span v-if="perm.can_delete" class="badge badge-error badge-sm">Suppression</span>
                  <span v-else class="badge badge-outline badge-sm">Suppression</span>
                  <span v-if="perm.can_share" class="badge badge-info badge-sm">Partage</span>
                  <span v-else class="badge badge-outline badge-sm">Partage</span>
                </div>
              </div>
            </div>

            <div v-else class="text-center py-6 text-base-content/50">
              <i class="fas fa-lock text-2xl mb-2"></i>
              <p class="text-sm">Aucune permission spécifique définie</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Details tab (files only) -->
      <div v-if="activeTab === 'details' && !item?.is_directory" class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- File details -->
          <div class="space-y-3">
            <div>
              <label class="text-sm font-semibold opacity-70">Extension</label>
              <p class="bg-base-100 p-2 rounded border">{{ getFileExtension(item?.name) }}</p>
            </div>

            <div>
              <label class="text-sm font-semibold opacity-70">Type MIME</label>
              <p class="bg-base-100 p-2 rounded border font-mono text-sm">{{ getMimeType(item?.name) }}</p>
            </div>
          </div>

          <!-- File stats -->
          <div class="space-y-3">
            <div>
              <label class="text-sm font-semibold opacity-70">Taille en octets</label>
              <p class="bg-base-100 p-2 rounded border font-mono">{{ item?.size?.toLocaleString() || '0' }}</p>
            </div>

            <div>
              <label class="text-sm font-semibold opacity-70">Taille lisible</label>
              <p class="bg-base-100 p-2 rounded border">{{ formatBytes(item?.size) }}</p>
            </div>
          </div>
        </div>

        <!-- File actions -->
        <div class="card bg-base-100 border border-base-300">
          <div class="card-body p-4">
            <h5 class="card-title text-base">Actions disponibles</h5>
            <div class="flex flex-wrap gap-2">
              <button class="btn btn-sm btn-outline" @click="downloadFile">
                <i class="fas fa-download mr-1"></i>
                Télécharger
              </button>
              <button v-if="canWrite" class="btn btn-sm btn-outline" @click="renameFile">
                <i class="fas fa-edit mr-1"></i>
                Renommer
              </button>
              <button class="btn btn-sm btn-outline" @click="copyPath">
                <i class="fas fa-copy mr-1"></i>
                Copier le chemin
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="modal-action">
        <button @click="$emit('close')" class="btn btn-primary">
          Fermer
        </button>
      </div>
    </div>
  </div>

  <!-- Status Modals -->
  <StatusModals :success-modal="successModal" :error-modal="errorModal" @close-success="closeSuccessModal"
    @close-error="closeErrorModal" />
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { usePermissions } from '@/composables/usePermissions'
import { useModals } from '@/composables/useModals'
import StatusModals from './StatusModals.vue'

const props = defineProps({
  item: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close'])

// Use permissions composable
const { loadPermissions } = usePermissions()

// Use modals composable
const {
  successModal,
  errorModal,
  showSuccessModal,
  closeSuccessModal,
  showErrorModal,
  closeErrorModal
} = useModals()

// State
const activeTab = ref('general')

// Computed
const pathSegments = computed(() => {
  if (!props.item?.path) return []
  return props.item.path.split('/').filter(Boolean)
})

const itemPermissions = computed(() => {
  if (!props.item) return []

  // Si le fichier/dossier a une propriété permissions, l'utiliser
  if (props.item.permissions && Array.isArray(props.item.permissions)) {
    return props.item.permissions
  }

  // Sinon, retourner un tableau vide
  return []
})


// Real permissions from API
const canRead = ref(false)
const canWrite = ref(false)
const canDelete = ref(false)
const canShare = ref(false)



// Methods
const downloadFile = async () => {
  if (props.item.is_directory) {
    return // Don't download directories
  }

  try {
    const { nasAPI, NASAPIError } = await import('@/services/nasAPI.js')
    const { useStore } = await import('vuex')
    const store = useStore()

    store.dispatch('showInfo', `Téléchargement de ${props.item.name} en cours...`)

    const blob = await nasAPI.downloadFile(props.item.path)

    // Create download link
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = props.item.name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    showSuccessModal('Téléchargement terminé', `Le fichier "${props.item.name}" a été téléchargé avec succès`)
    emit('close')
  } catch (err) {
    console.error('Error downloading file:', err)

    if (err.status === 403) {
      showErrorModal('Permission refusée', 'Vous n\'avez pas la permission de télécharger ce fichier')
    } else if (err.status === 404) {
      showErrorModal('Fichier introuvable', 'Le fichier demandé n\'existe plus sur le serveur')
    } else {
      showErrorModal('Erreur de téléchargement', `Une erreur s'est produite : ${err.message}`)
    }
  }
}

const renameFile = () => {
  // Open rename modal
  emit('close')
}

const copyPath = async () => {
  try {
    await navigator.clipboard.writeText(props.item.path)
    // Show success message
  } catch (err) {
    console.error('Failed to copy path:', err)
  }
}

const loadItemPermissions = async () => {
  try {
    if (!props.item || !props.item.path) return

    // Charger les permissions réelles de l'utilisateur pour cet item
    const permissions = await loadPermissions(props.item.path)

    if (permissions) {
      canRead.value = permissions.can_read || false
      canWrite.value = permissions.can_write || false
      canDelete.value = permissions.can_delete || false
      canShare.value = permissions.can_share || false

      console.log('Permissions utilisateur chargées:', permissions)
    }
  } catch (error) {
    console.error('Erreur lors du chargement des permissions:', error)
    // Les permissions restent à false si erreur
    canRead.value = false
    canWrite.value = false
    canDelete.value = false
    canShare.value = false
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

const formatDate = (date) => {
  if (!date) return 'Non disponible'
  return new Date(date).toLocaleString('fr-FR')
}

const getFileType = (filename) => {
  if (!filename) return 'Fichier'

  const ext = filename.split('.').pop()?.toLowerCase()
  const typeMap = {
    'pdf': 'Document PDF',
    'doc': 'Document Word',
    'docx': 'Document Word',
    'xls': 'Feuille Excel',
    'xlsx': 'Feuille Excel',
    'ppt': 'Présentation PowerPoint',
    'pptx': 'Présentation PowerPoint',
    'jpg': 'Image JPEG',
    'jpeg': 'Image JPEG',
    'png': 'Image PNG',
    'gif': 'Image GIF',
    'bmp': 'Image Bitmap',
    'svg': 'Image vectorielle',
    'mp4': 'Vidéo MP4',
    'avi': 'Vidéo AVI',
    'mov': 'Vidéo QuickTime',
    'mkv': 'Vidéo Matroska',
    'mp3': 'Audio MP3',
    'wav': 'Audio WAV',
    'flac': 'Audio FLAC',
    'zip': 'Archive ZIP',
    'rar': 'Archive RAR',
    '7z': 'Archive 7-Zip',
    'tar': 'Archive TAR',
    'txt': 'Fichier texte',
    'md': 'Document Markdown',
    'js': 'Script JavaScript',
    'ts': 'Script TypeScript',
    'html': 'Page HTML',
    'css': 'Feuille de style CSS',
    'py': 'Script Python',
    'json': 'Données JSON',
    'xml': 'Document XML',
    'yml': 'Configuration YAML',
    'yaml': 'Configuration YAML'
  }

  return typeMap[ext] || `Fichier ${ext?.toUpperCase() || 'inconnu'}`
}

const getFileExtension = (filename) => {
  if (!filename) return 'Aucune'
  const ext = filename.split('.').pop()
  return ext ? `.${ext}` : 'Aucune'
}

const getMimeType = (filename) => {
  if (!filename) return 'application/octet-stream'

  const ext = filename.split('.').pop()?.toLowerCase()
  const mimeMap = {
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'bmp': 'image/bmp',
    'svg': 'image/svg+xml',
    'mp4': 'video/mp4',
    'avi': 'video/x-msvideo',
    'mov': 'video/quicktime',
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    'zip': 'application/zip',
    'rar': 'application/x-rar-compressed',
    'txt': 'text/plain',
    'html': 'text/html',
    'css': 'text/css',
    'js': 'text/javascript',
    'json': 'application/json',
    'xml': 'application/xml'
  }

  return mimeMap[ext] || 'application/octet-stream'
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



onMounted(() => {
  loadItemPermissions()
})

</script>