<template>
  <div class="pdf-annotation-tools">
    <!-- Annotation Toolbar -->
    <div class="annotation-toolbar flex items-center space-x-2 p-2 border-b border-base-300 bg-base-100">
      <!-- Tool Selection -->
      <div class="flex items-center space-x-1">
        <button
          @click="setTool('select')"
          :class="{ 'btn-active': currentTool === 'select' }"
          class="btn btn-sm btn-ghost"
          title="Sélection"
        >
          <i class="fas fa-mouse-pointer"></i>
        </button>
        
        <button
          @click="setTool('highlight')"
          :class="{ 'btn-active': currentTool === 'highlight' }"
          class="btn btn-sm btn-ghost"
          title="Surligner"
        >
          <i class="fas fa-highlighter"></i>
        </button>
        
        <button
          @click="setTool('comment')"
          :class="{ 'btn-active': currentTool === 'comment' }"
          class="btn btn-sm btn-ghost"
          title="Commentaire"
        >
          <i class="fas fa-comment"></i>
        </button>
        
        <button
          @click="setTool('note')"
          :class="{ 'btn-active': currentTool === 'note' }"
          class="btn btn-sm btn-ghost"
          title="Note"
        >
          <i class="fas fa-sticky-note"></i>
        </button>
      </div>

      <!-- Color Picker -->
      <div class="flex items-center space-x-1" v-if="currentTool !== 'select'">
        <span class="text-sm text-base-content/70">Couleur:</span>
        <div class="flex space-x-1">
          <button
            v-for="color in annotationColors"
            :key="color.name"
            @click="setColor(color.value)"
            :class="{ 'ring-2 ring-primary': currentColor === color.value }"
            class="w-6 h-6 rounded border border-base-300"
            :style="{ backgroundColor: color.value }"
            :title="color.name"
          ></button>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex items-center space-x-1 ml-auto">
        <button
          @click="clearAllAnnotations"
          :disabled="annotations.length === 0"
          class="btn btn-sm btn-ghost text-error"
          title="Effacer toutes les annotations"
        >
          <i class="fas fa-eraser"></i>
        </button>
        
        <button
          @click="saveAnnotations"
          :disabled="!hasUnsavedAnnotations"
          class="btn btn-sm btn-primary"
          title="Sauvegarder les annotations"
        >
          <i class="fas fa-save"></i>
          Sauvegarder
        </button>
      </div>
    </div>

    <!-- Annotation Overlay -->
    <div
      ref="annotationOverlay"
      class="annotation-overlay absolute inset-0 pointer-events-none"
      :class="{ 'pointer-events-auto': currentTool !== 'select' }"
      @mousedown="startAnnotation"
      @mousemove="updateAnnotation"
      @mouseup="endAnnotation"
      @click="handleClick"
    >
      <!-- Render existing annotations -->
      <div
        v-for="annotation in visibleAnnotations"
        :key="annotation.id"
        class="annotation absolute"
        :class="[
          `annotation-${annotation.type}`,
          { 'annotation-selected': selectedAnnotation?.id === annotation.id }
        ]"
        :style="getAnnotationStyle(annotation)"
        @click.stop="selectAnnotation(annotation)"
      >
        <!-- Highlight annotation -->
        <div
          v-if="annotation.type === 'highlight'"
          class="highlight-overlay"
          :style="{ backgroundColor: annotation.color, opacity: 0.3 }"
        ></div>
        
        <!-- Comment annotation -->
        <div
          v-else-if="annotation.type === 'comment'"
          class="comment-marker"
          :style="{ backgroundColor: annotation.color }"
        >
          <i class="fas fa-comment text-white text-xs"></i>
        </div>
        
        <!-- Note annotation -->
        <div
          v-else-if="annotation.type === 'note'"
          class="note-marker"
          :style="{ backgroundColor: annotation.color }"
        >
          <i class="fas fa-sticky-note text-white text-xs"></i>
        </div>
      </div>

      <!-- Current annotation being drawn -->
      <div
        v-if="currentAnnotation"
        class="annotation-preview absolute"
        :style="getCurrentAnnotationStyle()"
      >
        <div
          v-if="currentTool === 'highlight'"
          class="highlight-overlay"
          :style="{ backgroundColor: currentColor, opacity: 0.3 }"
        ></div>
      </div>
    </div>

    <!-- Annotation Details Panel -->
    <div
      v-if="selectedAnnotation"
      class="annotation-details absolute top-4 right-4 bg-base-100 border border-base-300 rounded-lg shadow-lg p-4 w-80 z-10"
    >
      <div class="flex items-center justify-between mb-3">
        <h3 class="font-semibold">
          {{ getAnnotationTypeLabel(selectedAnnotation.type) }}
        </h3>
        <button
          @click="deleteAnnotation(selectedAnnotation)"
          class="btn btn-sm btn-ghost text-error"
          title="Supprimer l'annotation"
        >
          <i class="fas fa-trash"></i>
        </button>
      </div>
      
      <div class="space-y-3">
        <!-- Content -->
        <div v-if="selectedAnnotation.type === 'comment' || selectedAnnotation.type === 'note'">
          <label class="block text-sm font-medium mb-1">Contenu:</label>
          <textarea
            v-model="selectedAnnotation.content"
            @input="markAnnotationAsModified"
            class="textarea textarea-bordered w-full h-20 text-sm"
            placeholder="Saisissez votre commentaire..."
          ></textarea>
        </div>
        
        <!-- Color -->
        <div>
          <label class="block text-sm font-medium mb-1">Couleur:</label>
          <div class="flex space-x-1">
            <button
              v-for="color in annotationColors"
              :key="color.name"
              @click="updateAnnotationColor(selectedAnnotation, color.value)"
              :class="{ 'ring-2 ring-primary': selectedAnnotation.color === color.value }"
              class="w-6 h-6 rounded border border-base-300"
              :style="{ backgroundColor: color.value }"
              :title="color.name"
            ></button>
          </div>
        </div>
        
        <!-- Metadata -->
        <div class="text-xs text-base-content/70">
          <div>Page: {{ selectedAnnotation.page }}</div>
          <div>Créé: {{ formatDate(selectedAnnotation.createdAt) }}</div>
          <div v-if="selectedAnnotation.modifiedAt">
            Modifié: {{ formatDate(selectedAnnotation.modifiedAt) }}
          </div>
        </div>
      </div>
      
      <div class="flex justify-end space-x-2 mt-4">
        <button
          @click="selectedAnnotation = null"
          class="btn btn-sm btn-ghost"
        >
          Fermer
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

// Props
const props = defineProps({
  pdfUrl: {
    type: String,
    required: true
  },
  currentPage: {
    type: Number,
    default: 1
  },
  scale: {
    type: Number,
    default: 1.0
  },
  canvasElement: {
    type: HTMLCanvasElement,
    default: null
  }
})

// Emits
const emit = defineEmits([
  'annotations-changed',
  'annotation-selected',
  'save-annotations'
])

// Refs
const annotationOverlay = ref(null)

// State
const currentTool = ref('select')
const currentColor = ref('#ffff00')
const annotations = ref([])
const selectedAnnotation = ref(null)
const currentAnnotation = ref(null)
const isDrawing = ref(false)
const hasUnsavedAnnotations = ref(false)

// Annotation colors
const annotationColors = [
  { name: 'Jaune', value: '#ffff00' },
  { name: 'Vert', value: '#00ff00' },
  { name: 'Bleu', value: '#0080ff' },
  { name: 'Rouge', value: '#ff0000' },
  { name: 'Orange', value: '#ff8000' },
  { name: 'Rose', value: '#ff00ff' },
  { name: 'Violet', value: '#8000ff' }
]

// Computed
const visibleAnnotations = computed(() => {
  return annotations.value.filter(annotation => 
    annotation.page === props.currentPage
  )
})

// Methods
const setTool = (tool) => {
  currentTool.value = tool
  selectedAnnotation.value = null
}

const setColor = (color) => {
  currentColor.value = color
}

const startAnnotation = (event) => {
  if (currentTool.value === 'select') return
  
  const rect = annotationOverlay.value.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top
  
  if (currentTool.value === 'highlight') {
    isDrawing.value = true
    currentAnnotation.value = {
      type: 'highlight',
      page: props.currentPage,
      startX: x,
      startY: y,
      endX: x,
      endY: y,
      color: currentColor.value
    }
  }
}

const updateAnnotation = (event) => {
  if (!isDrawing.value || !currentAnnotation.value) return
  
  const rect = annotationOverlay.value.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top
  
  if (currentAnnotation.value.type === 'highlight') {
    currentAnnotation.value.endX = x
    currentAnnotation.value.endY = y
  }
}

const endAnnotation = (event) => {
  if (!isDrawing.value || !currentAnnotation.value) return
  
  // Finalize the annotation
  const annotation = {
    ...currentAnnotation.value,
    id: generateAnnotationId(),
    createdAt: new Date().toISOString()
  }
  
  // Add minimum size check for highlights
  if (annotation.type === 'highlight') {
    const width = Math.abs(annotation.endX - annotation.startX)
    const height = Math.abs(annotation.endY - annotation.startY)
    
    if (width < 10 && height < 10) {
      // Too small, don't create annotation
      currentAnnotation.value = null
      isDrawing.value = false
      return
    }
  }
  
  annotations.value.push(annotation)
  hasUnsavedAnnotations.value = true
  
  // Reset drawing state
  currentAnnotation.value = null
  isDrawing.value = false
  
  emit('annotations-changed', annotations.value)
}

const handleClick = (event) => {
  if (currentTool.value === 'comment' || currentTool.value === 'note') {
    const rect = annotationOverlay.value.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    
    const annotation = {
      id: generateAnnotationId(),
      type: currentTool.value,
      page: props.currentPage,
      x: x,
      y: y,
      color: currentColor.value,
      content: '',
      createdAt: new Date().toISOString()
    }
    
    annotations.value.push(annotation)
    selectedAnnotation.value = annotation
    hasUnsavedAnnotations.value = true
    
    emit('annotations-changed', annotations.value)
  }
}

const selectAnnotation = (annotation) => {
  selectedAnnotation.value = annotation
  emit('annotation-selected', annotation)
}

const deleteAnnotation = (annotation) => {
  const index = annotations.value.findIndex(a => a.id === annotation.id)
  if (index !== -1) {
    annotations.value.splice(index, 1)
    selectedAnnotation.value = null
    hasUnsavedAnnotations.value = true
    emit('annotations-changed', annotations.value)
  }
}

const updateAnnotationColor = (annotation, color) => {
  annotation.color = color
  annotation.modifiedAt = new Date().toISOString()
  hasUnsavedAnnotations.value = true
  emit('annotations-changed', annotations.value)
}

const markAnnotationAsModified = () => {
  if (selectedAnnotation.value) {
    selectedAnnotation.value.modifiedAt = new Date().toISOString()
    hasUnsavedAnnotations.value = true
    emit('annotations-changed', annotations.value)
  }
}

const clearAllAnnotations = () => {
  if (confirm('Êtes-vous sûr de vouloir effacer toutes les annotations ?')) {
    annotations.value = []
    selectedAnnotation.value = null
    hasUnsavedAnnotations.value = true
    emit('annotations-changed', annotations.value)
  }
}

const saveAnnotations = () => {
  emit('save-annotations', annotations.value)
  hasUnsavedAnnotations.value = false
}

const getAnnotationStyle = (annotation) => {
  const style = {}
  
  if (annotation.type === 'highlight') {
    style.left = `${Math.min(annotation.startX, annotation.endX)}px`
    style.top = `${Math.min(annotation.startY, annotation.endY)}px`
    style.width = `${Math.abs(annotation.endX - annotation.startX)}px`
    style.height = `${Math.abs(annotation.endY - annotation.startY)}px`
  } else {
    style.left = `${annotation.x - 10}px`
    style.top = `${annotation.y - 10}px`
    style.width = '20px'
    style.height = '20px'
  }
  
  return style
}

const getCurrentAnnotationStyle = () => {
  if (!currentAnnotation.value) return {}
  
  const annotation = currentAnnotation.value
  const style = {}
  
  if (annotation.type === 'highlight') {
    style.left = `${Math.min(annotation.startX, annotation.endX)}px`
    style.top = `${Math.min(annotation.startY, annotation.endY)}px`
    style.width = `${Math.abs(annotation.endX - annotation.startX)}px`
    style.height = `${Math.abs(annotation.endY - annotation.startY)}px`
  }
  
  return style
}

const getAnnotationTypeLabel = (type) => {
  const labels = {
    highlight: 'Surlignage',
    comment: 'Commentaire',
    note: 'Note'
  }
  return labels[type] || type
}

const generateAnnotationId = () => {
  return `annotation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Load annotations from storage
const loadAnnotations = () => {
  try {
    const stored = localStorage.getItem(`pdf_annotations_${props.pdfUrl}`)
    if (stored) {
      annotations.value = JSON.parse(stored)
    }
  } catch (error) {
    console.warn('Failed to load annotations:', error)
  }
}

// Save annotations to storage
const persistAnnotations = () => {
  try {
    localStorage.setItem(
      `pdf_annotations_${props.pdfUrl}`,
      JSON.stringify(annotations.value)
    )
  } catch (error) {
    console.warn('Failed to save annotations:', error)
  }
}

// Watchers
watch(() => props.pdfUrl, () => {
  loadAnnotations()
}, { immediate: true })

watch(annotations, () => {
  persistAnnotations()
}, { deep: true })

// Lifecycle
onMounted(() => {
  loadAnnotations()
})
</script>

<style scoped>
.annotation-overlay {
  cursor: crosshair;
}

.annotation-overlay.pointer-events-none {
  cursor: default;
}

.annotation {
  border: 2px solid transparent;
  border-radius: 2px;
}

.annotation-selected {
  border-color: #0080ff;
  box-shadow: 0 0 0 2px rgba(0, 128, 255, 0.3);
}

.annotation-highlight {
  pointer-events: auto;
}

.annotation-comment,
.annotation-note {
  pointer-events: auto;
  cursor: pointer;
}

.highlight-overlay {
  width: 100%;
  height: 100%;
  border-radius: 2px;
}

.comment-marker,
.note-marker {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.comment-marker:hover,
.note-marker:hover {
  transform: scale(1.1);
}

.annotation-details {
  max-height: 400px;
  overflow-y: auto;
}

/* Prevent text selection while drawing */
.annotation-overlay.pointer-events-auto {
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}
</style>