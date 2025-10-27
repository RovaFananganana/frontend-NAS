<template>
  <div class="text-editor-container h-full flex flex-col">
    <!-- Editor Toolbar -->
    <div class="flex items-center justify-between p-2 border-b border-base-300 bg-base-100">
      <div class="flex items-center space-x-1">
        <!-- File operations -->
        <div class="flex items-center space-x-1 border-r border-base-300 pr-2 mr-2">
          <button
            @click="handleSave"
            :disabled="!hasUnsavedChanges || isSaving"
            class="btn btn-xs btn-primary"
            title="Sauvegarder (Ctrl+S)"
          >
            <span v-if="isSaving" class="loading loading-spinner loading-xs mr-1"></span>
            <i v-else class="fas fa-save mr-1"></i>
            Sauvegarder
          </button>
          
          <button
            @click="handleUndo"
            :disabled="!canUndo"
            class="btn btn-xs btn-ghost"
            title="Annuler (Ctrl+Z)"
          >
            <i class="fas fa-undo"></i>
          </button>
          
          <button
            @click="handleRedo"
            :disabled="!canRedo"
            class="btn btn-xs btn-ghost"
            title="Rétablir (Ctrl+Y)"
          >
            <i class="fas fa-redo"></i>
          </button>
        </div>

        <!-- Text operations -->
        <div class="flex items-center space-x-1 border-r border-base-300 pr-2 mr-2">
          <button
            @click="handleFind"
            class="btn btn-xs btn-ghost"
            title="Rechercher (Ctrl+F)"
          >
            <i class="fas fa-search"></i>
          </button>
          
          <button
            @click="handleReplace"
            class="btn btn-xs btn-ghost"
            title="Remplacer (Ctrl+H)"
          >
            <i class="fas fa-exchange-alt"></i>
          </button>
          
          <button
            @click="handleGoToLine"
            class="btn btn-xs btn-ghost"
            title="Aller à la ligne (Ctrl+G)"
          >
            <i class="fas fa-crosshairs"></i>
          </button>
        </div>

        <!-- Format operations -->
        <div class="flex items-center space-x-1">
          <button
            @click="formatDocument"
            :disabled="!canFormat"
            class="btn btn-xs btn-ghost"
            title="Formater le document"
          >
            <i class="fas fa-indent"></i>
          </button>
          
          <button
            @click="toggleComments"
            class="btn btn-xs btn-ghost"
            title="Commenter/Décommenter"
          >
            <i class="fas fa-comment"></i>
          </button>
        </div>
      </div>

      <!-- Editor settings -->
      <div class="flex items-center space-x-1">
        <select
          v-model="selectedLanguage"
          @change="changeLanguage"
          class="select select-xs select-bordered"
          title="Langage de programmation"
        >
          <option v-for="lang in availableLanguages" :key="lang.id" :value="lang.id">
            {{ lang.name }}
          </option>
        </select>
        
        <select
          v-model="selectedEncoding"
          @change="changeEncoding"
          class="select select-xs select-bordered"
          title="Encodage du fichier"
        >
          <option value="utf-8">UTF-8</option>
          <option value="utf-16">UTF-16</option>
          <option value="iso-8859-1">ISO-8859-1</option>
        </select>
      </div>
    </div>

    <!-- Monaco Editor with TextViewer -->
    <div class="flex-1 min-h-0 relative">
      <TextViewer
        ref="textViewer"
        :content="content"
        :metadata="editorMetadata"
        :editable="true"
        mode="edit"
        @content-changed="handleContentChange"
        @cursor-changed="handleCursorChange"
        @selection-changed="handleSelectionChange"
        @validation-changed="handleValidationChange"
      />
    </div>

    <!-- Enhanced Status Bar -->
    <div class="flex items-center justify-between px-3 py-1 border-t border-base-300 bg-base-50 text-xs">
      <div class="flex items-center space-x-4">
        <span v-if="cursorInfo">
          Ligne {{ cursorInfo.line }}, Col {{ cursorInfo.column }}
        </span>
        <span v-if="selectionInfo">
          {{ selectionInfo }}
        </span>
        <span v-if="editorMetadata?.lineCount">
          {{ editorMetadata.lineCount }} lignes
        </span>
      </div>
      
      <div class="flex items-center space-x-4">
        <span v-if="validationErrors.length > 0" class="text-error">
          <i class="fas fa-exclamation-triangle mr-1"></i>
          {{ validationErrors.length }} erreur(s)
        </span>
        <span v-if="hasUnsavedChanges" class="text-warning">
          <i class="fas fa-circle text-xs mr-1"></i>
          Modifié
        </span>
        <span class="text-base-content/70">
          {{ selectedEncoding.toUpperCase() }}
        </span>
        <span class="text-base-content/70">
          {{ selectedLanguage.toUpperCase() }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import TextViewer from './TextViewer.vue'
import * as monaco from 'monaco-editor'

// Props
const props = defineProps({
  file: {
    type: Object,
    required: true
  },
  initialContent: {
    type: String,
    default: ''
  },
  metadata: {
    type: Object,
    default: () => ({})
  }
})

// Emits
const emit = defineEmits([
  'save',
  'content-changed',
  'encoding-changed',
  'language-changed'
])

// Refs
const textViewer = ref(null)

// State
const content = ref(props.initialContent)
const hasUnsavedChanges = ref(false)
const isSaving = ref(false)
const cursorInfo = ref(null)
const selectionInfo = ref('')
const validationErrors = ref([])
const selectedLanguage = ref(props.metadata?.language || 'plaintext')
const selectedEncoding = ref(props.metadata?.encoding || 'utf-8')
const canUndo = ref(false)
const canRedo = ref(false)

// Available languages for Monaco Editor
const availableLanguages = ref([
  { id: 'plaintext', name: 'Texte brut' },
  { id: 'javascript', name: 'JavaScript' },
  { id: 'typescript', name: 'TypeScript' },
  { id: 'json', name: 'JSON' },
  { id: 'html', name: 'HTML' },
  { id: 'css', name: 'CSS' },
  { id: 'scss', name: 'SCSS' },
  { id: 'xml', name: 'XML' },
  { id: 'yaml', name: 'YAML' },
  { id: 'markdown', name: 'Markdown' },
  { id: 'python', name: 'Python' },
  { id: 'java', name: 'Java' },
  { id: 'c', name: 'C' },
  { id: 'cpp', name: 'C++' },
  { id: 'csharp', name: 'C#' },
  { id: 'php', name: 'PHP' },
  { id: 'ruby', name: 'Ruby' },
  { id: 'go', name: 'Go' },
  { id: 'rust', name: 'Rust' },
  { id: 'swift', name: 'Swift' },
  { id: 'kotlin', name: 'Kotlin' },
  { id: 'sql', name: 'SQL' },
  { id: 'shell', name: 'Shell' },
  { id: 'powershell', name: 'PowerShell' },
  { id: 'dockerfile', name: 'Dockerfile' }
])

// Computed
const editorMetadata = computed(() => ({
  ...props.metadata,
  language: selectedLanguage.value,
  encoding: selectedEncoding.value
}))

const canFormat = computed(() => {
  const formatableLanguages = ['javascript', 'typescript', 'json', 'html', 'css', 'scss', 'xml']
  return formatableLanguages.includes(selectedLanguage.value)
})

// Methods
const handleContentChange = (newContent) => {
  content.value = newContent
  hasUnsavedChanges.value = newContent !== props.initialContent
  emit('content-changed', newContent)
  
  // Update undo/redo state
  updateUndoRedoState()
}

const handleCursorChange = (cursor) => {
  cursorInfo.value = cursor
}

const handleSelectionChange = (selection) => {
  if (selection && selection.length > 0) {
    const lines = selection.split('\n').length
    const chars = selection.length
    selectionInfo.value = lines > 1 
      ? `${lines} lignes, ${chars} caractères sélectionnés`
      : `${chars} caractères sélectionnés`
  } else {
    selectionInfo.value = ''
  }
}

const handleValidationChange = (issues) => {
  validationErrors.value = issues
}

const handleSave = async () => {
  if (!hasUnsavedChanges.value || isSaving.value) return
  
  isSaving.value = true
  try {
    const currentContent = textViewer.value?.getContent() || content.value
    
    await emit('save', {
      content: currentContent,
      encoding: selectedEncoding.value,
      language: selectedLanguage.value
    })
    
    hasUnsavedChanges.value = false
  } catch (error) {
    console.error('Save error:', error)
    // Error handling will be done by parent component
  } finally {
    isSaving.value = false
  }
}

const handleUndo = () => {
  const editor = getMonacoEditor()
  if (editor) {
    editor.trigger('keyboard', 'undo', null)
  }
}

const handleRedo = () => {
  const editor = getMonacoEditor()
  if (editor) {
    editor.trigger('keyboard', 'redo', null)
  }
}

const handleFind = () => {
  const editor = getMonacoEditor()
  if (editor) {
    editor.trigger('keyboard', 'actions.find', null)
  }
}

const handleReplace = () => {
  const editor = getMonacoEditor()
  if (editor) {
    editor.trigger('keyboard', 'editor.action.startFindReplaceAction', null)
  }
}

const handleGoToLine = () => {
  const editor = getMonacoEditor()
  if (editor) {
    editor.trigger('keyboard', 'editor.action.gotoLine', null)
  }
}

const formatDocument = () => {
  const editor = getMonacoEditor()
  if (editor && canFormat.value) {
    editor.trigger('keyboard', 'editor.action.formatDocument', null)
  }
}

const toggleComments = () => {
  const editor = getMonacoEditor()
  if (editor) {
    editor.trigger('keyboard', 'editor.action.commentLine', null)
  }
}

const changeLanguage = () => {
  emit('language-changed', selectedLanguage.value)
}

const changeEncoding = () => {
  emit('encoding-changed', selectedEncoding.value)
}

const getMonacoEditor = () => {
  // Access Monaco editor instance through TextViewer
  return textViewer.value?.editor || null
}

const updateUndoRedoState = () => {
  const editor = getMonacoEditor()
  if (editor) {
    const model = editor.getModel()
    if (model) {
      canUndo.value = model.canUndo()
      canRedo.value = model.canRedo()
    }
  }
}

// Keyboard shortcuts
const setupKeyboardShortcuts = () => {
  const handleKeyDown = (event) => {
    if (event.ctrlKey || event.metaKey) {
      switch (event.key.toLowerCase()) {
        case 's':
          event.preventDefault()
          handleSave()
          break
        case 'f':
          // Let Monaco handle this
          break
        case 'h':
          // Let Monaco handle this
          break
        case 'g':
          // Let Monaco handle this
          break
      }
    }
  }
  
  document.addEventListener('keydown', handleKeyDown)
  
  return () => {
    document.removeEventListener('keydown', handleKeyDown)
  }
}

// Public methods
const getContent = () => {
  return textViewer.value?.getContent() || content.value
}

const setContent = (newContent) => {
  content.value = newContent
  textViewer.value?.setContent(newContent)
  hasUnsavedChanges.value = false
}

const focus = () => {
  textViewer.value?.focus()
}

const resize = () => {
  textViewer.value?.resize()
}

// Watchers
watch(() => props.initialContent, (newContent) => {
  if (newContent !== content.value) {
    setContent(newContent)
  }
})

watch(() => props.metadata?.language, (newLanguage) => {
  if (newLanguage && newLanguage !== selectedLanguage.value) {
    selectedLanguage.value = newLanguage
  }
})

watch(() => props.metadata?.encoding, (newEncoding) => {
  if (newEncoding && newEncoding !== selectedEncoding.value) {
    selectedEncoding.value = newEncoding
  }
})

// Lifecycle
onMounted(() => {
  const cleanup = setupKeyboardShortcuts()
  
  // Cleanup on unmount
  return cleanup
})

// Expose methods
defineExpose({
  getContent,
  setContent,
  focus,
  resize,
  save: handleSave,
  hasUnsavedChanges: () => hasUnsavedChanges.value,
  getValidationErrors: () => validationErrors.value
})
</script>

<style scoped>
.text-editor-container {
  background: oklch(var(--b1));
}

/* Toolbar styling */
.text-editor-container .border-b {
  border-bottom: 1px solid oklch(var(--bc) / 0.2);
}

/* Status bar styling */
.text-editor-container .border-t {
  border-top: 1px solid oklch(var(--bc) / 0.2);
}

/* Button group separators */
.text-editor-container .border-r {
  border-right: 1px solid oklch(var(--bc) / 0.2);
}

/* Ensure proper button spacing */
.btn-xs {
  min-height: 1.5rem;
  height: 1.5rem;
  padding-left: 0.5rem;
  padding-right: 0.5rem;
}

/* Select styling */
.select-xs {
  min-height: 1.5rem;
  height: 1.5rem;
  font-size: 0.75rem;
  padding: 0.125rem 0.5rem;
}
</style>