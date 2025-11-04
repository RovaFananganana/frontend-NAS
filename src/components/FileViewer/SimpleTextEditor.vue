<template>
  <div class="simple-text-editor h-full flex flex-col">
    <!-- File Session Manager -->
    <FileSessionManager
      ref="sessionManager"
      :file-path="filePath"
      :mode="mode"
      :auto-open="true"
      @session-opened="handleSessionOpened"
      @session-closed="handleSessionClosed"
      @content-loaded="handleContentLoaded"
      @error="handleError"
    />

    <!-- Editor Toolbar -->
    <div class="bg-base-200 border-b border-base-300 p-2 flex items-center justify-between">
      <div class="flex items-center space-x-2">
        <span class="text-sm font-medium">{{ fileName }}</span>
        <span v-if="isReadOnly" class="badge badge-warning badge-sm">
          <i class="fas fa-lock mr-1"></i>
          Lecture seule
        </span>
      </div>
      
      <div class="flex items-center space-x-2">
        <!-- Save Button -->
        <button
          v-if="!isReadOnly"
          @click="handleSave"
          :disabled="!hasChanges || isSaving"
          class="btn btn-sm btn-primary"
          :class="{ 'loading': isSaving }"
        >
          <i v-if="!isSaving" class="fas fa-save mr-1"></i>
          {{ isSaving ? 'Sauvegarde...' : 'Sauvegarder' }}
        </button>
        
        <!-- Close Button -->
        <button
          @click="handleClose"
          class="btn btn-sm btn-ghost"
        >
          <i class="fas fa-times"></i>
        </button>
      </div>
    </div>

    <!-- Text Editor Area -->
    <div class="flex-1 relative">
      <textarea
        v-model="editorContent"
        :readonly="isReadOnly"
        class="w-full h-full p-4 font-mono text-sm bg-base-100 resize-none focus:outline-none"
        :class="{ 'cursor-not-allowed opacity-70': isReadOnly }"
        placeholder="Chargement du contenu..."
        @input="handleContentChange"
      ></textarea>
    </div>

    <!-- Status Bar -->
    <div class="bg-base-200 border-t border-base-300 px-4 py-2 flex items-center justify-between text-xs">
      <div class="flex items-center space-x-4">
        <span>Lignes: {{ lineCount }}</span>
        <span>Caractères: {{ characterCount }}</span>
        <span v-if="hasChanges" class="text-warning">
          <i class="fas fa-circle mr-1"></i>
          Modifications non sauvegardées
        </span>
      </div>
      
      <div class="text-base-content/60">
        {{ statusMessage }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useStore } from 'vuex'
import FileSessionManager from './FileSessionManager.vue'

const props = defineProps({
  filePath: {
    type: String,
    required: true
  },
  mode: {
    type: String,
    default: 'edit'
  }
})

const emit = defineEmits(['close', 'saved'])

const store = useStore()
const sessionManager = ref(null)

// State
const editorContent = ref('')
const originalContent = ref('')
const isReadOnly = ref(false)
const isSaving = ref(false)
const statusMessage = ref('Prêt')

// Computed
const fileName = computed(() => {
  const parts = props.filePath.split('/')
  return parts[parts.length - 1]
})

const hasChanges = computed(() => {
  return editorContent.value !== originalContent.value
})

const lineCount = computed(() => {
  return editorContent.value.split('\n').length
})

const characterCount = computed(() => {
  return editorContent.value.length
})

// Methods
const handleSessionOpened = (data) => {
  statusMessage.value = 'Session ouverte'
  isReadOnly.value = data.readOnly || props.mode === 'view'
}

const handleSessionClosed = () => {
  statusMessage.value = 'Session fermée'
}

const handleContentLoaded = async (blob) => {
  try {
    // Convert blob to text
    const text = await blob.text()
    editorContent.value = text
    originalContent.value = text
    statusMessage.value = 'Contenu chargé'
  } catch (error) {
    console.error('Error loading content:', error)
    store.dispatch('showError', 'Erreur lors du chargement du contenu')
  }
}

const handleContentChange = () => {
  if (hasChanges.value) {
    statusMessage.value = 'Modifications en cours...'
  }
}

const handleSave = async () => {
  if (!sessionManager.value || isReadOnly.value) return
  
  isSaving.value = true
  statusMessage.value = 'Sauvegarde en cours...'
  
  try {
    const success = await sessionManager.value.saveFile(editorContent.value)
    
    if (success) {
      originalContent.value = editorContent.value
      statusMessage.value = 'Sauvegardé avec succès'
      store.dispatch('showSuccess', 'Fichier sauvegardé')
      emit('saved')
    } else {
      statusMessage.value = 'Erreur de sauvegarde'
      store.dispatch('showError', 'Erreur lors de la sauvegarde')
    }
  } catch (error) {
    console.error('Save error:', error)
    statusMessage.value = 'Erreur de sauvegarde'
    store.dispatch('showError', 'Erreur lors de la sauvegarde')
  } finally {
    isSaving.value = false
  }
}

const handleClose = async () => {
  if (hasChanges.value && !isReadOnly.value) {
    const confirmed = confirm('Vous avez des modifications non sauvegardées. Voulez-vous sauvegarder avant de fermer?')
    
    if (confirmed) {
      await handleSave()
    }
  }
  
  if (sessionManager.value) {
    await sessionManager.value.closeSession()
  }
  
  emit('close')
}

const handleError = (error) => {
  statusMessage.value = `Erreur: ${error}`
  store.dispatch('showError', error)
}

// Keyboard shortcuts
const handleKeyDown = (event) => {
  // Ctrl+S to save
  if ((event.ctrlKey || event.metaKey) && event.key === 's') {
    event.preventDefault()
    if (!isReadOnly.value && hasChanges.value) {
      handleSave()
    }
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})
</script>

<script>
import { onMounted, onUnmounted } from 'vue'
</script>

<style scoped>
.simple-text-editor {
  background: hsl(var(--base-100));
}

textarea {
  font-family: 'Courier New', Courier, monospace;
  line-height: 1.5;
}

textarea:focus {
  outline: none;
}
</style>
