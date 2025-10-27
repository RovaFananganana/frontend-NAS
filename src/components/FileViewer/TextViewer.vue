<template>
  <div class="text-viewer-container h-full flex flex-col">
    <!-- Header with file info and controls -->
    <div class="flex items-center justify-between p-3 border-b border-base-300 bg-base-50 text-sm">
      <div class="flex items-center space-x-4">
        <div class="flex items-center space-x-2">
          <i class="fas fa-file-alt text-primary"></i>
          <span class="font-medium">{{ metadata?.language || 'Text' }}</span>
        </div>
        <div class="text-base-content/70">
          {{ formatStats() }}
        </div>
        <div v-if="metadata?.encoding" class="text-base-content/70">
          Encodage: {{ metadata.encoding.toUpperCase() }}
        </div>
      </div>
      
      <div class="flex items-center space-x-2">
        <!-- Word wrap toggle -->
        <button
          @click="toggleWordWrap"
          class="btn btn-xs btn-ghost"
          :class="{ 'btn-active': wordWrap }"
          title="Retour à la ligne automatique"
        >
          <i class="fas fa-align-left"></i>
        </button>
        
        <!-- Line numbers toggle -->
        <button
          @click="toggleLineNumbers"
          class="btn btn-xs btn-ghost"
          :class="{ 'btn-active': showLineNumbers }"
          title="Numéros de ligne"
        >
          <i class="fas fa-list-ol"></i>
        </button>
        
        <!-- Theme toggle -->
        <button
          @click="toggleTheme"
          class="btn btn-xs btn-ghost"
          :title="`Thème: ${editorTheme}`"
        >
          <i :class="editorTheme === 'vs-dark' ? 'fas fa-sun' : 'fas fa-moon'"></i>
        </button>
      </div>
    </div>

    <!-- Monaco Editor Container -->
    <div 
      ref="editorContainer" 
      class="flex-1 min-h-0"
      :class="{ 'opacity-50': loading }"
    >
      <!-- Loading overlay -->
      <div 
        v-if="loading" 
        class="absolute inset-0 flex items-center justify-center bg-base-100/80 z-10"
      >
        <div class="text-center">
          <div class="loading loading-spinner loading-lg mb-2"></div>
          <p class="text-sm text-base-content/70">Chargement de l'éditeur...</p>
        </div>
      </div>
    </div>

    <!-- Status bar -->
    <div class="flex items-center justify-between px-3 py-1 border-t border-base-300 bg-base-50 text-xs text-base-content/70">
      <div class="flex items-center space-x-4">
        <span v-if="cursorPosition">
          Ligne {{ cursorPosition.line }}, Colonne {{ cursorPosition.column }}
        </span>
        <span v-if="selectedText">
          Sélection: {{ selectedText.length }} caractères
        </span>
      </div>
      
      <div class="flex items-center space-x-2">
        <span v-if="hasUnsavedChanges" class="text-warning">
          <i class="fas fa-circle text-xs mr-1"></i>
          Non sauvegardé
        </span>
        <span v-if="validationIssues.length > 0" class="text-error">
          <i class="fas fa-exclamation-triangle mr-1"></i>
          {{ validationIssues.length }} erreur(s)
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick, computed } from 'vue'
import * as monaco from 'monaco-editor'

// Props
const props = defineProps({
  content: {
    type: String,
    default: ''
  },
  metadata: {
    type: Object,
    default: () => ({})
  },
  editable: {
    type: Boolean,
    default: false
  },
  mode: {
    type: String,
    default: 'view',
    validator: (value) => ['view', 'edit'].includes(value)
  }
})

// Emits
const emit = defineEmits([
  'content-changed',
  'cursor-changed',
  'selection-changed',
  'validation-changed'
])

// Refs
const editorContainer = ref(null)

// State
const loading = ref(true)
const editor = ref(null)
const wordWrap = ref(true)
const showLineNumbers = ref(true)
const editorTheme = ref('vs')
const cursorPosition = ref({ line: 1, column: 1 })
const selectedText = ref('')
const hasUnsavedChanges = ref(false)
const validationIssues = ref([])

// Computed
const isReadOnly = computed(() => {
  return props.mode === 'view' || !props.editable
})

// Methods
const initializeMonaco = async () => {
  try {
    loading.value = true
    
    await nextTick()
    
    if (!editorContainer.value) {
      throw new Error('Editor container not found')
    }

    // Configure Monaco Editor
    const editorOptions = {
      value: props.content || '',
      language: props.metadata?.language || 'plaintext',
      theme: editorTheme.value,
      readOnly: isReadOnly.value,
      wordWrap: wordWrap.value ? 'on' : 'off',
      lineNumbers: showLineNumbers.value ? 'on' : 'off',
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      automaticLayout: true,
      fontSize: 14,
      lineHeight: 20,
      tabSize: 2,
      insertSpaces: true,
      detectIndentation: true,
      folding: true,
      renderWhitespace: 'selection',
      renderControlCharacters: true,
      contextmenu: true,
      mouseWheelZoom: true,
      smoothScrolling: true,
      cursorBlinking: 'smooth',
      cursorSmoothCaretAnimation: true
    }

    // Create editor instance
    editor.value = monaco.editor.create(editorContainer.value, editorOptions)

    // Set up event listeners
    setupEventListeners()
    
    // Initial validation
    validateContent()
    
    loading.value = false
  } catch (error) {
    console.error('Failed to initialize Monaco Editor:', error)
    loading.value = false
  }
}

const setupEventListeners = () => {
  if (!editor.value) return

  // Content change listener
  editor.value.onDidChangeModelContent(() => {
    const newContent = editor.value.getValue()
    hasUnsavedChanges.value = newContent !== props.content
    emit('content-changed', newContent)
    validateContent()
  })

  // Cursor position change listener
  editor.value.onDidChangeCursorPosition((e) => {
    cursorPosition.value = {
      line: e.position.lineNumber,
      column: e.position.column
    }
    emit('cursor-changed', cursorPosition.value)
  })

  // Selection change listener
  editor.value.onDidChangeCursorSelection((e) => {
    const selection = editor.value.getModel()?.getValueInRange(e.selection) || ''
    selectedText.value = selection
    emit('selection-changed', selection)
  })
}

const validateContent = () => {
  if (!editor.value) return

  const content = editor.value.getValue()
  const language = props.metadata?.language || 'plaintext'
  
  // Clear previous markers
  monaco.editor.setModelMarkers(editor.value.getModel(), 'validation', [])
  
  const issues = []
  
  try {
    // JSON validation
    if (language === 'json' && content.trim()) {
      try {
        JSON.parse(content)
      } catch (error) {
        const match = error.message.match(/position (\d+)/)
        const position = match ? parseInt(match[1]) : 0
        const model = editor.value.getModel()
        const pos = model.getPositionAt(position)
        
        issues.push({
          severity: monaco.MarkerSeverity.Error,
          startLineNumber: pos.lineNumber,
          startColumn: pos.column,
          endLineNumber: pos.lineNumber,
          endColumn: pos.column + 1,
          message: `JSON Error: ${error.message}`
        })
      }
    }
    
    // XML validation
    if (language === 'xml' && content.trim()) {
      try {
        const parser = new DOMParser()
        const doc = parser.parseFromString(content, 'text/xml')
        const errors = doc.getElementsByTagName('parsererror')
        
        if (errors.length > 0) {
          issues.push({
            severity: monaco.MarkerSeverity.Error,
            startLineNumber: 1,
            startColumn: 1,
            endLineNumber: 1,
            endColumn: 1,
            message: 'XML parsing error'
          })
        }
      } catch (error) {
        issues.push({
          severity: monaco.MarkerSeverity.Error,
          startLineNumber: 1,
          startColumn: 1,
          endLineNumber: 1,
          endColumn: 1,
          message: `XML Error: ${error.message}`
        })
      }
    }
    
    // Set markers for issues
    if (issues.length > 0) {
      monaco.editor.setModelMarkers(editor.value.getModel(), 'validation', issues)
    }
    
    validationIssues.value = issues
    emit('validation-changed', issues)
    
  } catch (error) {
    console.error('Validation error:', error)
  }
}

const toggleWordWrap = () => {
  wordWrap.value = !wordWrap.value
  if (editor.value) {
    editor.value.updateOptions({
      wordWrap: wordWrap.value ? 'on' : 'off'
    })
  }
}

const toggleLineNumbers = () => {
  showLineNumbers.value = !showLineNumbers.value
  if (editor.value) {
    editor.value.updateOptions({
      lineNumbers: showLineNumbers.value ? 'on' : 'off'
    })
  }
}

const toggleTheme = () => {
  editorTheme.value = editorTheme.value === 'vs' ? 'vs-dark' : 'vs'
  if (editor.value) {
    monaco.editor.setTheme(editorTheme.value)
  }
}

const formatStats = () => {
  const stats = []
  
  if (props.metadata?.lineCount) {
    stats.push(`${props.metadata.lineCount} lignes`)
  }
  
  if (props.metadata?.wordCount) {
    stats.push(`${props.metadata.wordCount} mots`)
  }
  
  if (props.metadata?.charCount) {
    stats.push(`${props.metadata.charCount} caractères`)
  }
  
  return stats.join(' • ')
}

const getContent = () => {
  return editor.value?.getValue() || ''
}

const setContent = (content) => {
  if (editor.value) {
    editor.value.setValue(content || '')
    hasUnsavedChanges.value = false
  }
}

const focus = () => {
  if (editor.value) {
    editor.value.focus()
  }
}

const resize = () => {
  if (editor.value) {
    editor.value.layout()
  }
}

// Watchers
watch(() => props.content, (newContent) => {
  if (editor.value && editor.value.getValue() !== newContent) {
    setContent(newContent)
  }
})

watch(() => props.metadata?.language, (newLanguage) => {
  if (editor.value && newLanguage) {
    const model = editor.value.getModel()
    if (model) {
      monaco.editor.setModelLanguage(model, newLanguage)
      validateContent()
    }
  }
})

watch(() => isReadOnly.value, (newReadOnly) => {
  if (editor.value) {
    editor.value.updateOptions({ readOnly: newReadOnly })
  }
})

// Lifecycle
onMounted(() => {
  initializeMonaco()
})

onUnmounted(() => {
  if (editor.value) {
    editor.value.dispose()
  }
})

// Expose methods for parent component
defineExpose({
  getContent,
  setContent,
  focus,
  resize,
  hasUnsavedChanges: () => hasUnsavedChanges.value,
  getValidationIssues: () => validationIssues.value
})
</script>

<style scoped>
.text-viewer-container {
  position: relative;
}

/* Monaco Editor container styling */
.text-viewer-container :deep(.monaco-editor) {
  border-radius: 0;
}

.text-viewer-container :deep(.monaco-editor .margin) {
  background-color: transparent;
}

.text-viewer-container :deep(.monaco-editor .monaco-editor-background) {
  background-color: transparent;
}

/* Custom scrollbar for Monaco */
.text-viewer-container :deep(.monaco-scrollable-element > .scrollbar) {
  background: transparent;
}

.text-viewer-container :deep(.monaco-scrollable-element > .scrollbar > .slider) {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}

.text-viewer-container :deep(.monaco-scrollable-element > .scrollbar > .slider:hover) {
  background: rgba(0, 0, 0, 0.3);
}

/* Status bar styling */
.text-viewer-container .border-t {
  border-top: 1px solid oklch(var(--bc) / 0.2);
}
</style>