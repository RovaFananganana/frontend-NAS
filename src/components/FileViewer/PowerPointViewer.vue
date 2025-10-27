<template>
  <div class="powerpoint-viewer h-full flex flex-col bg-gray-900">
    <!-- PowerPoint Header -->
    <div class="powerpoint-header flex items-center justify-between p-4 border-b border-gray-700 bg-gray-800">
      <div class="presentation-info text-white">
        <h3 class="text-lg font-semibold">
          {{ presentationData?.metadata?.filename || 'Présentation' }}
        </h3>
        <div class="text-sm text-gray-300 mt-1">
          {{ presentationData?.metadata?.slideCount }} diapositive(s)
          <span v-if="presentationData?.metadata?.hasNotes" class="ml-2">
            <i class="fas fa-sticky-note"></i> Notes
          </span>
          <span v-if="presentationData?.metadata?.hasAnimations" class="ml-2">
            <i class="fas fa-magic"></i> Animations
          </span>
        </div>
      </div>
      
      <!-- PowerPoint Controls -->
      <div class="powerpoint-controls flex items-center space-x-2">
        <!-- View Mode Toggle -->
        <div class="view-mode-toggle flex bg-gray-700 rounded-lg p-1">
          <button 
            @click="setViewMode('slide')"
            :class="['btn btn-sm', viewMode === 'slide' ? 'btn-primary' : 'btn-ghost text-white']"
            title="Vue diapositive"
          >
            <i class="fas fa-desktop"></i>
          </button>
          <button 
            @click="setViewMode('thumbnail')"
            :class="['btn btn-sm', viewMode === 'thumbnail' ? 'btn-primary' : 'btn-ghost text-white']"
            title="Vue miniatures"
          >
            <i class="fas fa-th"></i>
          </button>
          <button 
            @click="setViewMode('notes')"
            :class="['btn btn-sm', viewMode === 'notes' ? 'btn-primary' : 'btn-ghost text-white']"
            title="Vue notes"
            :disabled="!presentationData?.metadata?.hasNotes"
          >
            <i class="fas fa-sticky-note"></i>
          </button>
        </div>
        
        <!-- Edit Slide Button -->
        <button 
          v-if="presentationData?.editable && currentSlideData && viewMode === 'slide'"
          @click="editCurrentSlide"
          class="btn btn-sm btn-outline text-white border-white hover:bg-white hover:text-gray-800"
          title="Éditer la diapositive"
        >
          <i class="fas fa-edit"></i>
          Éditer
        </button>
        
        <!-- Fullscreen Toggle -->
        <button 
          @click="toggleFullscreen"
          class="btn btn-sm btn-ghost text-white"
          title="Plein écran (F11)"
        >
          <i class="fas fa-expand"></i>
        </button>
        
        <!-- Presentation Mode -->
        <button 
          @click="startPresentation"
          class="btn btn-sm btn-primary"
          title="Mode présentation (F5)"
        >
          <i class="fas fa-play"></i>
          Présenter
        </button>
      </div>
    </div>

    <!-- Main Content Area -->
    <div class="presentation-content flex-1 flex min-h-0">
      <!-- Slide Editor Mode -->
      <SlideEditor
        v-if="isEditingSlide"
        :slide-data="currentSlideData"
        :slide-number="currentSlide + 1"
        :presentation-title="presentationData?.metadata?.filename || 'Présentation'"
        @save="handleSlideSave"
        @cancel="exitSlideEditor"
        @preview="handleSlidePreview"
        class="flex-1"
      />
      
      <!-- Slide View Mode -->
      <div 
        v-else-if="viewMode === 'slide'"
        class="slide-view flex-1 flex flex-col"
      >
        <!-- Slide Navigation -->
        <div class="slide-navigation flex items-center justify-between p-4 bg-gray-800 text-white">
          <button
            @click="previousSlide"
            :disabled="currentSlide <= 0"
            class="btn btn-sm btn-ghost text-white"
            title="Diapositive précédente (←)"
          >
            <i class="fas fa-chevron-left"></i>
            Précédent
          </button>
          
          <div class="slide-counter flex items-center space-x-4">
            <span class="text-sm">
              Diapositive {{ currentSlide + 1 }} sur {{ presentationData?.metadata?.slideCount || 0 }}
            </span>
            <div class="slide-progress">
              <progress 
                class="progress progress-primary w-32" 
                :value="currentSlide + 1" 
                :max="presentationData?.metadata?.slideCount || 1"
              ></progress>
            </div>
          </div>
          
          <button
            @click="nextSlide"
            :disabled="currentSlide >= (presentationData?.metadata?.slideCount || 1) - 1"
            class="btn btn-sm btn-ghost text-white"
            title="Diapositive suivante (→)"
          >
            Suivant
            <i class="fas fa-chevron-right"></i>
          </button>
        </div>
        
        <!-- Slide Content -->
        <div class="slide-content flex-1 flex items-center justify-center p-8 bg-gray-900">
          <div 
            v-if="currentSlideData"
            class="slide bg-white shadow-2xl rounded-lg overflow-hidden"
            :style="{ 
              width: slideWidth + 'px',
              height: slideHeight + 'px',
              transform: `scale(${slideScale})`
            }"
          >
            <div class="slide-inner p-8 h-full flex flex-col">
              <!-- Slide Title -->
              <h1 
                v-if="currentSlideData.title"
                class="slide-title text-3xl font-bold text-gray-800 mb-6"
              >
                {{ currentSlideData.title }}
              </h1>
              
              <!-- Slide Content -->
              <div class="slide-body flex-1 text-gray-700 text-lg leading-relaxed">
                <div v-if="currentSlideData.content" class="slide-text">
                  {{ currentSlideData.content }}
                </div>
                
                <!-- Placeholder for images, charts, etc. -->
                <div v-if="currentSlideData.hasImages" class="slide-media mt-4">
                  <div class="placeholder-image bg-gray-200 rounded-lg p-8 text-center">
                    <i class="fas fa-image text-4xl text-gray-400 mb-2"></i>
                    <p class="text-gray-500">Images et médias</p>
                  </div>
                </div>
              </div>
              
              <!-- Slide Footer -->
              <div v-if="currentSlideData.footer" class="slide-footer mt-6 text-sm text-gray-500">
                {{ currentSlideData.footer }}
              </div>
            </div>
          </div>
          
          <!-- No Slide Data -->
          <div v-else class="no-slide text-center text-white">
            <i class="fas fa-presentation text-6xl mb-4 text-gray-500"></i>
            <p class="text-xl">Aucune diapositive à afficher</p>
          </div>
        </div>
      </div>

      <!-- Thumbnail View Mode -->
      <div 
        v-else-if="viewMode === 'thumbnail'"
        class="thumbnail-view flex-1 p-6 bg-gray-900 overflow-auto"
      >
        <div class="thumbnails-grid grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          <div
            v-for="(slide, index) in presentationData?.content || []"
            :key="index"
            @click="selectSlide(index)"
            :class="[
              'thumbnail-slide cursor-pointer rounded-lg overflow-hidden transition-all duration-200',
              currentSlide === index 
                ? 'ring-4 ring-blue-500 transform scale-105' 
                : 'hover:ring-2 hover:ring-gray-400 hover:transform hover:scale-102'
            ]"
          >
            <div class="thumbnail-content bg-white aspect-video p-4 flex flex-col">
              <div class="thumbnail-title text-xs font-semibold text-gray-800 mb-2 truncate">
                {{ slide.title || `Diapositive ${index + 1}` }}
              </div>
              <div class="thumbnail-body flex-1 text-xs text-gray-600 overflow-hidden">
                {{ slide.content || 'Contenu de la diapositive' }}
              </div>
            </div>
            <div class="thumbnail-footer bg-gray-100 px-2 py-1 text-xs text-center text-gray-600">
              {{ index + 1 }}
            </div>
          </div>
        </div>
      </div>

      <!-- Notes View Mode -->
      <div 
        v-else-if="viewMode === 'notes'"
        class="notes-view flex-1 flex"
      >
        <!-- Slide Preview -->
        <div class="slide-preview w-1/2 p-4 bg-gray-800">
          <div class="preview-slide bg-white rounded-lg shadow-lg aspect-video p-4">
            <div v-if="currentSlideData" class="h-full flex flex-col">
              <h2 class="text-lg font-bold text-gray-800 mb-2">
                {{ currentSlideData.title || `Diapositive ${currentSlide + 1}` }}
              </h2>
              <div class="flex-1 text-sm text-gray-600">
                {{ currentSlideData.content }}
              </div>
            </div>
          </div>
        </div>
        
        <!-- Notes Panel -->
        <div class="notes-panel w-1/2 p-4 bg-gray-900 text-white">
          <h3 class="text-lg font-semibold mb-4">Notes du présentateur</h3>
          <div class="notes-content bg-gray-800 rounded-lg p-4 h-full overflow-auto">
            <div v-if="currentSlideData?.notes" class="notes-text">
              {{ currentSlideData.notes }}
            </div>
            <div v-else class="no-notes text-gray-400 italic">
              Aucune note pour cette diapositive
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Presentation Mode Overlay -->
    <div 
      v-if="isPresentationMode"
      class="presentation-overlay fixed inset-0 bg-black z-50 flex items-center justify-center"
      @keydown.esc="exitPresentation"
      @keydown.left="previousSlide"
      @keydown.right="nextSlide"
      @keydown.f5.prevent="exitPresentation"
      tabindex="0"
      ref="presentationOverlay"
    >
      <!-- Full Screen Slide -->
      <div 
        class="presentation-slide bg-white rounded-lg shadow-2xl"
        :style="{ 
          width: fullscreenSlideWidth + 'px',
          height: fullscreenSlideHeight + 'px'
        }"
      >
        <div v-if="currentSlideData" class="slide-inner p-12 h-full flex flex-col">
          <h1 
            v-if="currentSlideData.title"
            class="slide-title text-5xl font-bold text-gray-800 mb-8"
          >
            {{ currentSlideData.title }}
          </h1>
          
          <div class="slide-body flex-1 text-gray-700 text-2xl leading-relaxed">
            {{ currentSlideData.content }}
          </div>
        </div>
      </div>
      
      <!-- Presentation Controls -->
      <div class="presentation-controls absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-4 bg-black bg-opacity-50 rounded-lg px-4 py-2">
        <button
          @click="previousSlide"
          :disabled="currentSlide <= 0"
          class="btn btn-sm btn-ghost text-white"
        >
          <i class="fas fa-chevron-left"></i>
        </button>
        
        <span class="text-white text-sm">
          {{ currentSlide + 1 }} / {{ presentationData?.metadata?.slideCount || 0 }}
        </span>
        
        <button
          @click="nextSlide"
          :disabled="currentSlide >= (presentationData?.metadata?.slideCount || 1) - 1"
          class="btn btn-sm btn-ghost text-white"
        >
          <i class="fas fa-chevron-right"></i>
        </button>
        
        <button
          @click="exitPresentation"
          class="btn btn-sm btn-ghost text-white ml-4"
        >
          <i class="fas fa-times"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import SlideEditor from './SlideEditor.vue'

export default {
  name: 'PowerPointViewer',
  components: {
    SlideEditor
  },
  props: {
    presentationData: {
      type: Object,
      default: null
    }
  },
  emits: ['slide-changed', 'presentation-started', 'presentation-ended', 'slide-saved', 'error'],
  data() {
    return {
      currentSlide: 0,
      viewMode: 'slide', // 'slide', 'thumbnail', 'notes'
      isPresentationMode: false,
      isEditingSlide: false,
      slideWidth: 800,
      slideHeight: 600,
      slideScale: 1.0
    }
  },
  computed: {
    currentSlideData() {
      if (this.presentationData?.content && this.currentSlide >= 0) {
        return this.presentationData.content[this.currentSlide]
      }
      return null
    },
    fullscreenSlideWidth() {
      const aspectRatio = 16 / 9
      const maxWidth = window.innerWidth * 0.9
      const maxHeight = window.innerHeight * 0.8
      
      if (maxWidth / aspectRatio <= maxHeight) {
        return maxWidth
      } else {
        return maxHeight * aspectRatio
      }
    },
    fullscreenSlideHeight() {
      return this.fullscreenSlideWidth / (16 / 9)
    }
  },
  watch: {
    presentationData: {
      handler(newData) {
        if (newData) {
          this.initializePresentation()
        }
      },
      immediate: true
    },
    currentSlide(newSlide) {
      this.$emit('slide-changed', {
        slideIndex: newSlide,
        slideData: this.currentSlideData
      })
    }
  },
  methods: {
    initializePresentation() {
      if (!this.presentationData) return
      
      this.currentSlide = 0
      this.viewMode = 'slide'
      this.isPresentationMode = false
      this.isEditingSlide = false
      this.calculateSlideScale()
    },
    
    // Slide Navigation
    nextSlide() {
      if (this.currentSlide < (this.presentationData?.metadata?.slideCount || 1) - 1) {
        this.currentSlide++
      }
    },
    
    previousSlide() {
      if (this.currentSlide > 0) {
        this.currentSlide--
      }
    },
    
    selectSlide(index) {
      if (index >= 0 && index < (this.presentationData?.metadata?.slideCount || 0)) {
        this.currentSlide = index
        if (this.viewMode === 'thumbnail') {
          this.setViewMode('slide')
        }
      }
    },
    
    // View Mode Management
    setViewMode(mode) {
      this.viewMode = mode
      if (mode === 'slide') {
        this.$nextTick(() => {
          this.calculateSlideScale()
        })
      }
    },
    
    // Presentation Mode
    startPresentation() {
      this.isPresentationMode = true
      this.$emit('presentation-started')
      
      this.$nextTick(() => {
        if (this.$refs.presentationOverlay) {
          this.$refs.presentationOverlay.focus()
        }
      })
    },
    
    exitPresentation() {
      this.isPresentationMode = false
      this.$emit('presentation-ended')
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
    
    // Slide Scaling
    calculateSlideScale() {
      this.$nextTick(() => {
        const container = this.$el.querySelector('.slide-content')
        if (!container) return
        
        const containerWidth = container.clientWidth - 64 // padding
        const containerHeight = container.clientHeight - 64 // padding
        
        const scaleX = containerWidth / this.slideWidth
        const scaleY = containerHeight / this.slideHeight
        
        this.slideScale = Math.min(scaleX, scaleY, 1.0)
      })
    },
    
    // Slide Editing
    editCurrentSlide() {
      if (!this.currentSlideData || !this.presentationData?.editable) return
      this.isEditingSlide = true
    },
    
    exitSlideEditor() {
      this.isEditingSlide = false
    },
    
    handleSlideSave(saveData) {
      // Update the slide data in the presentation
      if (this.presentationData?.content && saveData.slideNumber > 0) {
        const slideIndex = saveData.slideNumber - 1
        if (this.presentationData.content[slideIndex]) {
          // Update the slide with new data
          Object.assign(this.presentationData.content[slideIndex], saveData.editedSlide)
          
          // Emit save event
          this.$emit('slide-saved', {
            slideIndex: slideIndex,
            slideNumber: saveData.slideNumber,
            originalSlide: saveData.originalSlide,
            editedSlide: saveData.editedSlide,
            presentationData: this.presentationData
          })
        }
      }
      
      this.isEditingSlide = false
    },
    
    handleSlidePreview(previewData) {
      // Could show a preview modal or update the current view temporarily
      console.log('Slide preview requested:', previewData)
    },

    // Keyboard Navigation
    handleKeydown(event) {
      // Don't handle keyboard shortcuts when editing
      if (this.isEditingSlide) return
      
      if (this.isPresentationMode) {
        switch (event.key) {
          case 'Escape':
            this.exitPresentation()
            break
          case 'ArrowLeft':
          case 'ArrowUp':
          case 'PageUp':
            event.preventDefault()
            this.previousSlide()
            break
          case 'ArrowRight':
          case 'ArrowDown':
          case 'PageDown':
          case ' ':
            event.preventDefault()
            this.nextSlide()
            break
          case 'Home':
            event.preventDefault()
            this.currentSlide = 0
            break
          case 'End':
            event.preventDefault()
            this.currentSlide = (this.presentationData?.metadata?.slideCount || 1) - 1
            break
        }
      } else {
        switch (event.key) {
          case 'F5':
            event.preventDefault()
            this.startPresentation()
            break
          case 'F11':
            event.preventDefault()
            this.toggleFullscreen()
            break
          case 'ArrowLeft':
            if (!event.ctrlKey && !event.altKey) {
              event.preventDefault()
              this.previousSlide()
            }
            break
          case 'ArrowRight':
            if (!event.ctrlKey && !event.altKey) {
              event.preventDefault()
              this.nextSlide()
            }
            break
          case 'e':
            if (event.ctrlKey) {
              event.preventDefault()
              this.editCurrentSlide()
            }
            break
        }
      }
    }
  },
  mounted() {
    document.addEventListener('keydown', this.handleKeydown)
    window.addEventListener('resize', this.calculateSlideScale)
  },
  beforeUnmount() {
    document.removeEventListener('keydown', this.handleKeydown)
    window.removeEventListener('resize', this.calculateSlideScale)
  }
}
</script>

<style scoped>
.powerpoint-viewer {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.slide {
  aspect-ratio: 16/9;
  transition: transform 0.3s ease;
}

.slide-title {
  line-height: 1.2;
}

.slide-body {
  line-height: 1.6;
}

.thumbnail-slide {
  transition: all 0.2s ease;
}

.thumbnail-slide:hover {
  transform: translateY(-2px);
}

.presentation-overlay {
  backdrop-filter: blur(10px);
}

.presentation-slide {
  aspect-ratio: 16/9;
  max-width: 90vw;
  max-height: 80vh;
}

.presentation-controls {
  backdrop-filter: blur(10px);
}

/* Custom scrollbar for notes panel */
.notes-content::-webkit-scrollbar {
  width: 8px;
}

.notes-content::-webkit-scrollbar-track {
  background: #374151;
  border-radius: 4px;
}

.notes-content::-webkit-scrollbar-thumb {
  background: #6b7280;
  border-radius: 4px;
}

.notes-content::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}

/* Animation for slide transitions */
.slide-content {
  transition: opacity 0.3s ease;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .thumbnails-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .notes-view {
    flex-direction: column;
  }
  
  .slide-preview,
  .notes-panel {
    width: 100%;
  }
  
  .slide-preview {
    height: 40%;
  }
  
  .notes-panel {
    height: 60%;
  }
}
</style>