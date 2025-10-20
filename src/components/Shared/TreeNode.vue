<template>
  <div 
    :class="[
      'tree-node',
      {
        'selected': selected,
        'focused': focused
      }
    ]"
  >
    <!-- Élément principal -->
    <div
      :class="[
        'tree-item flex items-center py-2 px-3 rounded-lg cursor-pointer transition-all duration-200',
        'hover:bg-base-200',
        {
          'bg-primary/10 border-l-4 border-primary': selected,
          'hover:bg-base-100': !selected,
          'ring-2 ring-primary ring-offset-1': focused
        }
      ]"
      :style="{ paddingLeft: `${level * 20 + 12}px` }"
      @click="handleClick"
      @dblclick="handleDoubleClick"
      @contextmenu="handleRightClick"
      :title="file.name"
    >
      <!-- Bouton d'expansion pour les dossiers -->
      <div v-if="file.is_directory" class="w-4 h-4 mr-2 flex items-center justify-center">
        <button
          @click.stop="toggleExpanded"
          class="w-4 h-4 flex items-center justify-center hover:bg-base-300 rounded"
        >
          <i 
            :class="[
              'fas text-xs transition-transform duration-200',
              expanded ? 'fa-chevron-down' : 'fa-chevron-right'
            ]"
          ></i>
        </button>
      </div>
      <div v-else class="w-6"></div>

      <!-- Icône de type -->
      <div class="w-8 flex justify-center mr-3 relative">
        <i v-if="file.is_directory" :class="[
          expanded ? 'fas fa-folder-open' : 'fas fa-folder',
          'text-blue-500'
        ]"></i>
        <i v-else-if="isImageFile(file.name)" class="fas fa-image text-purple-500"></i>
        <i v-else-if="isVideoFile(file.name)" class="fas fa-video text-red-500"></i>
        <i v-else-if="isAudioFile(file.name)" class="fas fa-music text-green-500"></i>
        <i v-else-if="isDocumentFile(file.name)" class="fas fa-file-alt text-blue-600"></i>
        <i v-else-if="isArchiveFile(file.name)" class="fas fa-file-archive text-orange-500"></i>
        <i v-else-if="isCodeFile(file.name)" class="fas fa-file-code text-yellow-500"></i>
        <i v-else class="fas fa-file text-gray-500"></i>
        
        <!-- Indicateur favori -->
        <i v-if="isFavorite(file.path || file.name)" 
           class="fas fa-star absolute -top-1 -right-1 w-2 h-2 text-warning"
           title="Favori"
           aria-label="Élément favori"></i>
      </div>
      
      <!-- Nom du fichier -->
      <div class="flex-1 min-w-0">
        <div class="font-medium truncate">{{ file.name }}</div>
        <div v-if="!file.is_directory && file.size" class="text-xs text-base-content/50">
          {{ formatFileSize(file.size) }}
        </div>
      </div>

      <!-- Informations supplémentaires -->
      <div class="flex items-center gap-4 text-sm text-base-content/60">
        <!-- Date de modification -->
        <div v-if="file.modified_time" class="hidden sm:block">
          {{ formatDate(file.modified_time) }}
        </div>
        
        <!-- Type de fichier -->
        <div v-if="!file.is_directory" class="hidden md:block">
          {{ getFileType(file) }}
        </div>
        
        <!-- Taille -->
        <div v-if="!file.is_directory && file.size" class="hidden lg:block w-20 text-right">
          {{ formatFileSize(file.size) }}
        </div>
      </div>

      <!-- Indicateur de sélection -->
      <div v-if="selected" 
        class="ml-3 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
        <i class="fas fa-check text-white text-xs"></i>
      </div>
    </div>

    <!-- Enfants (si dossier étendu) -->
    <div v-if="file.is_directory && expanded && children.length > 0" class="tree-children">
      <TreeNode
        v-for="child in children"
        :key="child.path"
        :file="child"
        :selected="props.isSelected(child.path || child.name)"
        :focused="false"
        :level="level + 1"
        :is-selected="props.isSelected"
        @click="(eventData) => $emit('click', eventData)"
        @double-click="(eventData) => $emit('double-click', eventData)"
        @context-menu="(eventData) => $emit('context-menu', eventData)"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { formatBytes, formatDate, getFileType, isImageFile, isVideoFile, isAudioFile, isDocumentFile, isArchiveFile, isCodeFile } from '@/utils/fileUtils.js'

// Props
const props = defineProps({
  file: {
    type: Object,
    required: true
  },
  selected: {
    type: Boolean,
    default: false
  },
  focused: {
    type: Boolean,
    default: false
  },
  level: {
    type: Number,
    default: 0
  },
  isSelected: {
    type: Function,
    default: () => false
  },
  isFavorite: {
    type: Function,
    default: () => false
  }
})

// Émissions
const emit = defineEmits(['click', 'double-click', 'context-menu'])

// État local
const expanded = ref(false)
const children = ref([])

// Computed
const formatFileSize = (size) => formatBytes(size)

// Méthodes
const toggleExpanded = async () => {
  if (!props.file.is_directory) return
  
  expanded.value = !expanded.value
  
  if (expanded.value && children.value.length === 0) {
    // Charger les enfants du dossier
    try {
      const { nasAPI } = await import('@/services/nasAPI.js')
      const response = await nasAPI.browse(props.file.path)
      
      if (response.success && response.items) {
        children.value = response.items
      } else {
        children.value = []
      }
    } catch (error) {
      console.error('Erreur lors du chargement des enfants:', error)
      children.value = []
    }
  }
}

const handleClick = (event) => {
  emit('click', { file: props.file, event })
}

const handleDoubleClick = (event) => {
  if (props.file.is_directory) {
    toggleExpanded()
  }
  emit('double-click', { file: props.file, event })
}

const handleRightClick = (event) => {
  event.preventDefault()
  emit('context-menu', { file: props.file, event })
}
</script>

<style scoped>
.tree-node {
  user-select: none;
}

.tree-item {
  border-left: 4px solid transparent;
}

.tree-item:hover {
  border-left-color: theme('colors.primary');
}

.tree-item.selected {
  border-left-color: theme('colors.primary');
}

.tree-children {
  border-left: 1px solid theme('colors.base-300');
  margin-left: 20px;
}

/* Amélioration de l'accessibilité */
.tree-item:focus {
  outline: none;
  ring: 2px;
  ring-color: theme('colors.primary');
  ring-offset: 1px;
}

/* Réduction des animations si demandé */
@media (prefers-reduced-motion: reduce) {
  .tree-item {
    transition: none;
  }
}
</style>