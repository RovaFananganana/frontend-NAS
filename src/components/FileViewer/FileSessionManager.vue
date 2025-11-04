<template>
  <div class="file-session-manager">
    <!-- Sync Status Indicator -->
    <div 
      v-if="isSessionActive" 
      class="fixed bottom-4 right-4 z-50"
      role="status"
      aria-live="polite"
    >
      <div class="bg-base-200 shadow-lg rounded-lg p-3 flex items-center space-x-3 border border-base-300">
        <!-- Sync Status Icon -->
        <div class="flex-shrink-0">
          <i 
            v-if="isSyncing" 
            class="fas fa-sync-alt fa-spin text-primary"
            aria-hidden="true"
          ></i>
          <i 
            v-else-if="hasUnsavedChanges" 
            class="fas fa-circle text-warning animate-pulse"
            aria-hidden="true"
          ></i>
          <i 
            v-else 
            class="fas fa-check-circle text-success"
            aria-hidden="true"
          ></i>
        </div>
        
        <!-- Status Text -->
        <div class="text-sm">
          <div class="font-medium">
            {{ syncStatusText }}
          </div>
          <div v-if="sessionInfo" class="text-xs text-base-content/60">
            {{ sessionInfo.file_name }}
          </div>
        </div>
        
        <!-- Manual Sync Button -->
        <button
          v-if="hasUnsavedChanges && !isSyncing"
          @click="handleManualSync"
          class="btn btn-xs btn-primary"
          :aria-label="'Synchroniser maintenant'"
          title="Synchroniser maintenant (Ctrl+S)"
        >
          <i class="fas fa-cloud-upload-alt"></i>
        </button>
      </div>
    </div>

    <!-- Lock Warning Modal -->
    <div v-if="showLockWarning" class="modal modal-open">
      <div class="modal-box">
        <h3 class="font-bold text-lg mb-4">
          <i class="fas fa-lock text-warning mr-2"></i>
          Fichier verrouillé
        </h3>
        
        <div class="space-y-3">
          <p>
            Ce fichier est actuellement en cours d'édition par 
            <strong>{{ lockInfo?.locked_by_username }}</strong>.
          </p>
          
          <div class="bg-base-200 p-3 rounded-lg text-sm">
            <div class="flex justify-between mb-1">
              <span class="text-base-content/70">Verrouillé depuis:</span>
              <span>{{ formatDate(lockInfo?.locked_at) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-base-content/70">Expire à:</span>
              <span>{{ formatDate(lockInfo?.expires_at) }}</span>
            </div>
          </div>
          
          <p class="text-sm text-base-content/70">
            Vous pouvez ouvrir le fichier en mode lecture seule ou attendre que l'autre utilisateur le ferme.
          </p>
        </div>
        
        <div class="modal-action">
          <button 
            @click="openReadOnly" 
            class="btn btn-primary"
          >
            <i class="fas fa-eye mr-2"></i>
            Ouvrir en lecture seule
          </button>
          <button 
            @click="closeLockWarning" 
            class="btn"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, watch } from 'vue'
import { useFileSession } from '@/composables/useFileSession'
import { useStore } from 'vuex'

const props = defineProps({
  filePath: {
    type: String,
    required: true
  },
  mode: {
    type: String,
    default: 'edit',
    validator: (value) => ['edit', 'view'].includes(value)
  },
  autoOpen: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['session-opened', 'session-closed', 'content-loaded', 'content-updated', 'error'])

const store = useStore()
const {
  sessionId,
  sessionInfo,
  isLoading,
  isSyncing,
  error,
  fileContent,
  hasUnsavedChanges,
  isSessionActive,
  isModified,
  syncPending,
  openFile,
  loadContent,
  updateContent,
  syncToNas,
  closeSession,
  saveFile
} = useFileSession()

// Local state
const showLockWarning = ref(false)
const lockInfo = ref(null)

// Computed
const syncStatusText = computed(() => {
  if (isSyncing.value) return 'Synchronisation...'
  if (hasUnsavedChanges.value) return 'Modifications non sauvegardées'
  if (isModified.value) return 'Synchronisé'
  return 'Aucune modification'
})

// Methods
const handleOpenFile = async () => {
  const result = await openFile(props.filePath, props.mode)
  
  if (result.success) {
    emit('session-opened', {
      sessionId: result.sessionId,
      sessionInfo: sessionInfo.value
    })
    
    // Emit content loaded
    if (fileContent.value) {
      emit('content-loaded', fileContent.value)
    }
  } else {
    // Check if file is locked
    if (result.lockInfo) {
      lockInfo.value = result.lockInfo
      showLockWarning.value = true
    }
    
    emit('error', result.error)
  }
}

const handleManualSync = async () => {
  const success = await syncToNas()
  if (success) {
    emit('content-updated')
  }
}

const handleCloseSession = async () => {
  const success = await closeSession(true)
  if (success) {
    emit('session-closed')
  }
}

const handleUpdateContent = async (content) => {
  const success = await updateContent(content)
  if (success) {
    emit('content-updated')
  }
  return success
}

const handleSaveFile = async (content) => {
  const success = await saveFile(content)
  if (success) {
    emit('content-updated')
  }
  return success
}

const openReadOnly = async () => {
  showLockWarning.value = false
  // Open in view mode instead
  const result = await openFile(props.filePath, 'view')
  
  if (result.success) {
    emit('session-opened', {
      sessionId: result.sessionId,
      sessionInfo: sessionInfo.value,
      readOnly: true
    })
    
    if (fileContent.value) {
      emit('content-loaded', fileContent.value)
    }
  }
}

const closeLockWarning = () => {
  showLockWarning.value = false
  emit('error', 'Ouverture annulée')
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

// Watch for errors
watch(error, (newError) => {
  if (newError) {
    emit('error', newError)
  }
})

// Auto-open if requested
if (props.autoOpen) {
  handleOpenFile()
}

// Keyboard shortcut for manual sync (Ctrl+S)
const handleKeyDown = (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key === 's') {
    event.preventDefault()
    if (hasUnsavedChanges.value && !isSyncing.value) {
      handleManualSync()
    }
  }
}

// Add keyboard listener
onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
  // Close session on unmount
  if (isSessionActive.value) {
    handleCloseSession()
  }
})

// Expose methods to parent
defineExpose({
  openFile: handleOpenFile,
  closeSession: handleCloseSession,
  updateContent: handleUpdateContent,
  saveFile: handleSaveFile,
  syncToNas: handleManualSync,
  sessionId,
  sessionInfo,
  isLoading,
  isSyncing,
  hasUnsavedChanges,
  fileContent
})
</script>

<script>
import { ref, onMounted, onUnmounted } from 'vue'
</script>

<style scoped>
.file-session-manager {
  position: relative;
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
</style>
