<template>
  <div class="document-viewer h-full flex flex-col bg-white">
    <!-- Document Header -->
    <div class="document-header flex items-center justify-between p-4 border-b bg-gray-50">
      <div class="document-info">
        <h3 class="text-lg font-semibold text-gray-800">
          {{ documentData?.metadata?.filename || 'Document' }}
        </h3>
        <div class="text-sm text-gray-600 mt-1">
          <span v-if="documentData?.metadata?.documentType === 'word'">
            {{ documentData.metadata.wordCount }} mots, 
            {{ documentData.metadata.charCount }} caractères,
            {{ documentData.metadata.paragraphCount }} paragraphes
          </span>
          <span v-else-if="documentData?.metadata?.documentType === 'excel'">
            {{ documentData.metadata.sheetCount }} feuille(s),
            {{ documentData.metadata.totalCells }} cellules
          </span>
          <span v-else-if="documentData?.metadata?.documentType === 'powerpoint'">
            {{ documentData.metadata.slideCount }} diapositive(s)
          </span>
        </div>
      </div>
      
      <!-- Document Controls -->
      <div class="document-controls flex items-center space-x-2">
        <!-- Zoom Controls -->
        <div class="zoom-controls flex items-center space-x-1">
          <button 
            @click="zoomOut"
            :disabled="zoomLevel <= 0.5"
            class="btn btn-sm btn-ghost"
            title="Zoom arrière"
          >
            <i class="fas fa-search-minus"></i>
          </button>
          <span class="text-sm text-gray-600 min-w-[60px] text-center">
            {{ Math.round(zoomLevel * 100) }}%
          </span>
          <button 
            @click="zoomIn"
            :disabled="zoomLevel >= 2.0"
            class="btn btn-sm btn-ghost"
            title="Zoom avant"
          >
            <i class="fas fa-search-plus"></i>
          </button>
        </div>
        
        <!-- Edit Mode Toggle (for Word documents) -->
        <button 
          v-if="documentData?.editable && documentData?.metadata?.documentType === 'word'"
          @click="toggleEditMode"
          :class="['btn btn-sm', isEditMode ? 'btn-primary' : 'btn-outline']"
          title="Mode édition"
        >
          <i class="fas fa-edit"></i>
          {{ isEditMode ? 'Lecture' : 'Édition' }}
        </button>
        
        <!-- Fullscreen Toggle -->
        <button 
          @click="toggleFullscreen"
          class="btn btn-sm btn-ghost"
          title="Plein écran"
        >
          <i class="fas fa-expand"></i>
        </button>
      </div>
    </div>

    <!-- Document Content Area -->
    <div class="document-content flex-1 overflow-hidden">
      <!-- Word Document Content -->
      <div 
        v-if="documentData?.type === 'word'"
        class="word-document h-full overflow-auto"
      >
        <div 
          class="document-page mx-auto bg-white shadow-lg"
          :style="{ 
            transform: `scale(${zoomLevel})`,
            transformOrigin: 'top center',
            width: '210mm',
            minHeight: '297mm',
            padding: '25mm',
            margin: '20px auto'
          }"
        >
          <!-- Editable Content -->
          <div 
            v-if="isEditMode"
            ref="editableContent"
            contenteditable="true"
            @input="onContentChange"
            @blur="onContentBlur"
            class="editable-content outline-none"
            v-html="editableHtml"
          ></div>
          
          <!-- Read-only Content -->
          <div 
            v-else
            class="readonly-content"
            v-html="documentData.content"
          ></div>
        </div>
      </div>

      <!-- Excel Document Content -->
      <ExcelViewer
        v-if="documentData?.type === 'excel'"
        :excel-data="documentData"
        @save="handleExcelSave"
        @export="handleExcelExport"
        @error="handleExcelError"
        class="flex-1"
      />

      <!-- PowerPoint Document Content -->
      <PowerPointViewer
        v-if="documentData?.type === 'powerpoint'"
        :presentation-data="documentData"
        @slide-changed="handleSlideChanged"
        @presentation-started="handlePresentationStarted"
        @presentation-ended="handlePresentationEnded"
        @slide-saved="handlePowerPointSlideSave"
        @error="handlePowerPointError"
        class="flex-1"
      />

      <!-- Error State -->
      <div 
        v-else-if="documentData?.error"
        class="error-state flex items-center justify-center h-full"
      >
        <div class="text-center">
          <i class="fas fa-exclamation-triangle text-4xl text-red-500 mb-4"></i>
          <h3 class="text-lg font-semibold text-gray-800 mb-2">Erreur de chargement</h3>
          <p class="text-gray-600">{{ documentData.error }}</p>
        </div>
      </div>

      <!-- Loading State -->
      <div 
        v-else-if="!documentData"
        class="loading-state flex items-center justify-center h-full"
      >
        <div class="text-center">
          <div class="loading loading-spinner loading-lg text-primary mb-4"></div>
          <p class="text-gray-600">Chargement du document...</p>
        </div>
      </div>
    </div>

    <!-- Document Footer (for Word documents in edit mode) -->
    <div 
      v-if="isEditMode && documentData?.type === 'word' && hasUnsavedChanges"
      class="document-footer flex items-center justify-between p-4 border-t bg-yellow-50"
    >
      <div class="flex items-center text-sm text-yellow-700">
        <i class="fas fa-exclamation-circle mr-2"></i>
        Modifications non sauvegardées
      </div>
      <div class="flex space-x-2">
        <button 
          @click="discardChanges"
          class="btn btn-sm btn-ghost"
        >
          Annuler
        </button>
        <button 
          @click="saveChanges"
          class="btn btn-sm btn-primary"
        >
          Sauvegarder
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import ExcelViewer from './ExcelViewer.vue'
import PowerPointViewer from './PowerPointViewer.vue'

export default {
  name: 'DocumentViewer',
  components: {
    ExcelViewer,
    PowerPointViewer
  },
  props: {
    documentData: {
      type: Object,
      default: null
    }
  },
  emits: ['save', 'error'],
  data() {
    return {
      zoomLevel: 1.0,
      isEditMode: false,
      hasUnsavedChanges: false,
      editableHtml: '',
      activeSheet: null,
      currentSlide: 0
    }
  },
  computed: {
    currentSheetData() {
      if (this.documentData?.type === 'excel' && this.activeSheet) {
        return this.documentData.content[this.activeSheet]
      }
      return null
    },
    currentSlideData() {
      if (this.documentData?.type === 'powerpoint' && this.documentData.content) {
        return this.documentData.content[this.currentSlide]
      }
      return null
    }
  },
  watch: {
    documentData: {
      handler(newData) {
        if (newData) {
          this.initializeDocument()
        }
      },
      immediate: true
    }
  },
  methods: {
    initializeDocument() {
      if (!this.documentData) return
      
      // Initialize based on document type
      if (this.documentData.type === 'word') {
        this.editableHtml = this.documentData.content
        this.isEditMode = false
      } else if (this.documentData.type === 'excel') {
        this.activeSheet = this.documentData.activeSheet || this.documentData.metadata.sheetNames[0]
      } else if (this.documentData.type === 'powerpoint') {
        this.currentSlide = 0
      }
      
      this.hasUnsavedChanges = false
    },
    
    // Zoom Controls
    zoomIn() {
      if (this.zoomLevel < 2.0) {
        this.zoomLevel = Math.min(2.0, this.zoomLevel + 0.1)
      }
    },
    zoomOut() {
      if (this.zoomLevel > 0.5) {
        this.zoomLevel = Math.max(0.5, this.zoomLevel - 0.1)
      }
    },
    
    // Edit Mode (Word documents)
    toggleEditMode() {
      if (this.hasUnsavedChanges) {
        if (confirm('Vous avez des modifications non sauvegardées. Voulez-vous les perdre ?')) {
          this.discardChanges()
        } else {
          return
        }
      }
      
      this.isEditMode = !this.isEditMode
      if (this.isEditMode) {
        this.editableHtml = this.documentData.content
      }
    },
    
    onContentChange() {
      this.hasUnsavedChanges = true
    },
    
    onContentBlur() {
      // Auto-save could be implemented here
    },
    
    saveChanges() {
      if (this.$refs.editableContent) {
        const newContent = this.$refs.editableContent.innerHTML
        this.$emit('save', {
          type: 'word',
          content: newContent,
          originalFile: this.documentData
        })
        this.hasUnsavedChanges = false
      }
    },
    
    discardChanges() {
      this.editableHtml = this.documentData.content
      this.hasUnsavedChanges = false
      this.isEditMode = false
    },
    
    // Excel Sheet Navigation
    setActiveSheet(sheetName) {
      this.activeSheet = sheetName
    },
    
    // Excel Handling Methods
    handleExcelSave(saveData) {
      this.$emit('save', {
        type: 'excel',
        sheetName: saveData.sheetName,
        cellReference: saveData.cellReference,
        oldValue: saveData.oldValue,
        newValue: saveData.newValue,
        row: saveData.row,
        col: saveData.col,
        originalFile: this.documentData
      })
    },
    
    handleExcelExport(exportData) {
      // Handle Excel export functionality
      console.log('Excel export requested:', exportData)
      // This could trigger a download or send to a conversion service
    },
    
    handleExcelError(error) {
      console.error('Excel viewer error:', error)
      this.$emit('error', error)
    },
    
    // PowerPoint Handling Methods
    handleSlideChanged(slideData) {
      console.log('Slide changed:', slideData)
      // Update current slide tracking if needed
    },
    
    handlePresentationStarted() {
      console.log('Presentation mode started')
      // Could emit event or update parent state
    },
    
    handlePresentationEnded() {
      console.log('Presentation mode ended')
      // Could emit event or update parent state
    },
    
    handlePowerPointSlideSave(saveData) {
      this.$emit('save', {
        type: 'powerpoint',
        slideIndex: saveData.slideIndex,
        slideNumber: saveData.slideNumber,
        originalSlide: saveData.originalSlide,
        editedSlide: saveData.editedSlide,
        presentationData: saveData.presentationData,
        originalFile: this.documentData
      })
    },
    
    handlePowerPointError(error) {
      console.error('PowerPoint viewer error:', error)
      this.$emit('error', error)
    },
    
    // PowerPoint Slide Navigation
    nextSlide() {
      if (this.currentSlide < this.documentData.metadata.slideCount - 1) {
        this.currentSlide++
      }
    },
    
    previousSlide() {
      if (this.currentSlide > 0) {
        this.currentSlide--
      }
    },
    
    // Fullscreen
    toggleFullscreen() {
      const element = this.$el
      if (!document.fullscreenElement) {
        element.requestFullscreen().catch(err => {
          console.error('Error attempting to enable fullscreen:', err)
        })
      } else {
        document.exitFullscreen()
      }
    },
    
    // Keyboard shortcuts
    handleKeydown(event) {
      // Zoom shortcuts
      if (event.ctrlKey || event.metaKey) {
        if (event.key === '=' || event.key === '+') {
          event.preventDefault()
          this.zoomIn()
        } else if (event.key === '-') {
          event.preventDefault()
          this.zoomOut()
        } else if (event.key === '0') {
          event.preventDefault()
          this.zoomLevel = 1.0
        }
      }
      
      // Navigation shortcuts for PowerPoint
      if (this.documentData?.type === 'powerpoint') {
        if (event.key === 'ArrowLeft') {
          event.preventDefault()
          this.previousSlide()
        } else if (event.key === 'ArrowRight') {
          event.preventDefault()
          this.nextSlide()
        }
      }
      
      // Save shortcut for Word documents
      if (this.isEditMode && (event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault()
        this.saveChanges()
      }
    }
  },
  mounted() {
    document.addEventListener('keydown', this.handleKeydown)
  },
  beforeUnmount() {
    document.removeEventListener('keydown', this.handleKeydown)
  }
}
</script>

<style scoped>
.document-viewer {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.document-page {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.editable-content {
  min-height: 200px;
  line-height: 1.6;
}

.editable-content:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

.sheet-tab {
  transition: all 0.2s ease;
}

.sheet-tab:hover {
  background-color: #f3f4f6;
}

.slide {
  aspect-ratio: 16/9;
  max-height: 70vh;
}

/* Custom styles for Excel tables */
:deep(table) {
  border-collapse: collapse;
  width: 100%;
  font-size: 12px;
}

:deep(table td),
:deep(table th) {
  border: 1px solid #d1d5db;
  padding: 4px 8px;
  text-align: left;
}

:deep(table th) {
  background-color: #f3f4f6;
  font-weight: 600;
}

/* Custom styles for Word document content */
:deep(.readonly-content),
:deep(.editable-content) {
  line-height: 1.6;
  color: #374151;
}

:deep(.readonly-content h1),
:deep(.editable-content h1) {
  font-size: 2em;
  font-weight: bold;
  margin: 1em 0 0.5em 0;
}

:deep(.readonly-content h2),
:deep(.editable-content h2) {
  font-size: 1.5em;
  font-weight: bold;
  margin: 1em 0 0.5em 0;
}

:deep(.readonly-content p),
:deep(.editable-content p) {
  margin: 0.5em 0;
}

:deep(.readonly-content ul),
:deep(.editable-content ul),
:deep(.readonly-content ol),
:deep(.editable-content ol) {
  margin: 0.5em 0;
  padding-left: 2em;
}
</style>