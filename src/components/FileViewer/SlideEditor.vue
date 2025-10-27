<template>
  <div class="slide-editor h-full flex flex-col bg-gray-100">
    <!-- Editor Header -->
    <div class="editor-header flex items-center justify-between p-4 border-b bg-white">
      <div class="slide-info">
        <h3 class="text-lg font-semibold text-gray-800">
          Édition - Diapositive {{ slideNumber }}
        </h3>
        <div class="text-sm text-gray-600">
          {{ presentationTitle }}
        </div>
      </div>
      
      <!-- Editor Actions -->
      <div class="editor-actions flex items-center space-x-2">
        <button 
          @click="previewSlide"
          class="btn btn-sm btn-outline"
          title="Aperçu"
        >
          <i class="fas fa-eye"></i>
          Aperçu
        </button>
        <button 
          @click="saveSlide"
          class="btn btn-sm btn-primary"
          :disabled="!hasChanges"
          title="Sauvegarder"
        >
          <i class="fas fa-save"></i>
          Sauvegarder
        </button>
        <button 
          @click="cancelEdit"
          class="btn btn-sm btn-ghost"
          title="Annuler"
        >
          <i class="fas fa-times"></i>
          Annuler
        </button>
      </div>
    </div>

    <!-- Editor Content -->
    <div class="editor-content flex-1 flex min-h-0">
      <!-- Slide Preview -->
      <div class="slide-preview w-1/2 p-4 bg-gray-50">
        <div class="preview-container">
          <h4 class="text-sm font-semibold text-gray-700 mb-2">Aperçu</h4>
          <div 
            class="slide-preview-card bg-white rounded-lg shadow-lg p-6"
            :style="{ aspectRatio: '16/9' }"
          >
            <h1 
              v-if="editedSlide.title"
              class="slide-title text-2xl font-bold text-gray-800 mb-4"
            >
              {{ editedSlide.title }}
            </h1>
            <div class="slide-content text-gray-700 leading-relaxed">
              <div v-html="formatSlideContent(editedSlide.content)"></div>
            </div>
            <div 
              v-if="editedSlide.footer"
              class="slide-footer mt-4 pt-4 border-t text-sm text-gray-500"
            >
              {{ editedSlide.footer }}
            </div>
          </div>
        </div>
      </div>

      <!-- Editor Form -->
      <div class="slide-editor-form w-1/2 p-4 bg-white">
        <h4 class="text-sm font-semibold text-gray-700 mb-4">Édition</h4>
        
        <div class="form-fields space-y-4">
          <!-- Slide Title -->
          <div class="form-field">
            <label class="label">
              <span class="label-text font-medium">Titre de la diapositive</span>
            </label>
            <input
              v-model="editedSlide.title"
              type="text"
              class="input input-bordered w-full"
              placeholder="Entrez le titre de la diapositive"
              @input="markAsChanged"
            />
          </div>

          <!-- Slide Content -->
          <div class="form-field">
            <label class="label">
              <span class="label-text font-medium">Contenu</span>
            </label>
            <textarea
              v-model="editedSlide.content"
              class="textarea textarea-bordered w-full h-40"
              placeholder="Entrez le contenu de la diapositive"
              @input="markAsChanged"
            ></textarea>
            <div class="label">
              <span class="label-text-alt text-gray-500">
                Vous pouvez utiliser du HTML basique pour la mise en forme
              </span>
            </div>
          </div>

          <!-- Slide Notes -->
          <div class="form-field">
            <label class="label">
              <span class="label-text font-medium">Notes du présentateur</span>
            </label>
            <textarea
              v-model="editedSlide.notes"
              class="textarea textarea-bordered w-full h-24"
              placeholder="Notes pour le présentateur (optionnel)"
              @input="markAsChanged"
            ></textarea>
          </div>

          <!-- Slide Footer -->
          <div class="form-field">
            <label class="label">
              <span class="label-text font-medium">Pied de page</span>
            </label>
            <input
              v-model="editedSlide.footer"
              type="text"
              class="input input-bordered w-full"
              placeholder="Pied de page (optionnel)"
              @input="markAsChanged"
            />
          </div>

          <!-- Slide Options -->
          <div class="form-field">
            <label class="label">
              <span class="label-text font-medium">Options</span>
            </label>
            <div class="form-control">
              <label class="label cursor-pointer">
                <span class="label-text">Contient des images</span>
                <input 
                  v-model="editedSlide.hasImages"
                  type="checkbox" 
                  class="checkbox checkbox-primary"
                  @change="markAsChanged"
                />
              </label>
            </div>
            <div class="form-control">
              <label class="label cursor-pointer">
                <span class="label-text">Contient des animations</span>
                <input 
                  v-model="editedSlide.hasAnimations"
                  type="checkbox" 
                  class="checkbox checkbox-primary"
                  @change="markAsChanged"
                />
              </label>
            </div>
          </div>
        </div>

        <!-- Editor Help -->
        <div class="editor-help mt-6 p-3 bg-blue-50 rounded-lg">
          <h5 class="text-sm font-semibold text-blue-800 mb-2">
            <i class="fas fa-info-circle mr-1"></i>
            Aide à l'édition
          </h5>
          <ul class="text-xs text-blue-700 space-y-1">
            <li>• Utilisez <code>&lt;b&gt;</code> pour le texte en gras</li>
            <li>• Utilisez <code>&lt;i&gt;</code> pour le texte en italique</li>
            <li>• Utilisez <code>&lt;br&gt;</code> pour les sauts de ligne</li>
            <li>• Utilisez <code>&lt;ul&gt;&lt;li&gt;</code> pour les listes</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Editor Footer -->
    <div class="editor-footer flex items-center justify-between p-4 border-t bg-gray-50">
      <div class="editor-status text-sm text-gray-600">
        <span v-if="hasChanges" class="text-orange-600">
          <i class="fas fa-circle text-xs mr-1"></i>
          Modifications non sauvegardées
        </span>
        <span v-else class="text-green-600">
          <i class="fas fa-check-circle mr-1"></i>
          Sauvegardé
        </span>
      </div>
      
      <div class="editor-shortcuts text-xs text-gray-500">
        Ctrl+S: Sauvegarder • Échap: Annuler
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SlideEditor',
  props: {
    slideData: {
      type: Object,
      required: true
    },
    slideNumber: {
      type: Number,
      required: true
    },
    presentationTitle: {
      type: String,
      default: 'Présentation'
    }
  },
  emits: ['save', 'cancel', 'preview'],
  data() {
    return {
      editedSlide: {},
      originalSlide: {},
      hasChanges: false
    }
  },
  watch: {
    slideData: {
      handler(newData) {
        if (newData) {
          this.initializeEditor()
        }
      },
      immediate: true
    }
  },
  methods: {
    initializeEditor() {
      // Deep copy the slide data
      this.originalSlide = JSON.parse(JSON.stringify(this.slideData))
      this.editedSlide = JSON.parse(JSON.stringify(this.slideData))
      this.hasChanges = false
    },
    
    markAsChanged() {
      this.hasChanges = true
    },
    
    formatSlideContent(content) {
      if (!content) return ''
      
      // Basic HTML formatting
      return content
        .replace(/\n/g, '<br>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
    },
    
    saveSlide() {
      if (!this.hasChanges) return
      
      this.$emit('save', {
        slideNumber: this.slideNumber,
        originalSlide: this.originalSlide,
        editedSlide: { ...this.editedSlide }
      })
      
      this.hasChanges = false
      this.originalSlide = JSON.parse(JSON.stringify(this.editedSlide))
    },
    
    cancelEdit() {
      if (this.hasChanges) {
        if (confirm('Vous avez des modifications non sauvegardées. Voulez-vous vraiment annuler ?')) {
          this.editedSlide = JSON.parse(JSON.stringify(this.originalSlide))
          this.hasChanges = false
          this.$emit('cancel')
        }
      } else {
        this.$emit('cancel')
      }
    },
    
    previewSlide() {
      this.$emit('preview', {
        slideNumber: this.slideNumber,
        slideData: { ...this.editedSlide }
      })
    },
    
    handleKeydown(event) {
      if (event.ctrlKey && event.key === 's') {
        event.preventDefault()
        this.saveSlide()
      } else if (event.key === 'Escape') {
        event.preventDefault()
        this.cancelEdit()
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
.slide-editor {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.slide-preview-card {
  min-height: 300px;
  max-height: 400px;
  overflow: hidden;
}

.slide-title {
  line-height: 1.2;
}

.form-field {
  margin-bottom: 1rem;
}

.editor-help code {
  background-color: rgba(59, 130, 246, 0.1);
  padding: 2px 4px;
  border-radius: 3px;
  font-size: 0.75rem;
}

/* Custom scrollbar for textareas */
.textarea::-webkit-scrollbar {
  width: 8px;
}

.textarea::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 4px;
}

.textarea::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

.textarea::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>