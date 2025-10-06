<template>
  <tr 
    :class="[
      'file-list-item cursor-pointer transition-colors duration-150 border-b border-base-300/30',
      {
        'hover:bg-base-200/50': !selected,
        'bg-base-300 text-base-content': selected,
        'bg-base-300/70': selected && focused
      }
    ]"
    :tabindex="focused ? 0 : -1"
    role="gridcell"
    :aria-selected="selected"
    :aria-label="getAriaLabel()"
    @click="handleClick"
    @dblclick="handleDoubleClick"
    @contextmenu="handleRightClick"
    @keydown="handleKeydown"
  >
    <!-- Colonne Nom avec icône -->
    <td class="flex items-center gap-2 px-3 py-2">
      <!-- Icône de fichier -->
      <div class="flex-shrink-0 relative">
        <i :class="[
          fileIcon, 
          'w-4 h-4 text-base-content/70',
          {
            'text-blue-600': file.is_directory,
            'text-base-content/60': !file.is_directory
          }
        ]"></i>
        
        <!-- Indicateur favori -->
        <i v-if="isFavorite" 
           class="fas fa-star absolute -top-1 -right-1 w-2 h-2 text-warning"
           title="Favori"
           aria-label="Élément favori"></i>
      </div>
      
      <!-- Nom du fichier seulement -->
      <span class="text-sm font-medium truncate min-w-0 flex-1">
        {{ cleanFileName }}
      </span>
    </td>
    
    <!-- Colonne Taille -->
    <td class="px-3 py-2 text-right">
      <span class="text-sm text-base-content/70 font-mono">
        {{ formattedSize || '—' }}
      </span>
    </td>
    
    <!-- Colonne Type -->
    <td class="px-3 py-2 text-center">
      <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-base-200 text-base-content/80">
        {{ fileType || 'Inconnu' }}
      </span>
    </td>
    
    <!-- Colonne Date de modification -->
    <td class="px-3 py-2">
      <span class="text-sm text-base-content/60">
        {{ formattedDate || 'Date inconnue' }}
      </span>
    </td>
  </tr>
</template>

<script setup>
import { computed } from 'vue'
import { formatBytes, formatDate } from '@/utils/fileUtils.js'

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
  visibleColumns: {
    type: Array,
    default: () => []
  },
  isFavorite: {
    type: Boolean,
    default: false
  }
})

// Émissions
const emit = defineEmits(['click', 'double-click', 'context-menu'])

// Computed pour l'icône du fichier (16px comme requis)
const fileIcon = computed(() => {
  if (props.file.is_directory) {
    return 'fas fa-folder'
  }

  const ext = getFileExtension(props.file.name)?.toLowerCase()
  const iconMap = {
    // Documents
    'pdf': 'fas fa-file-pdf',
    'doc': 'fas fa-file-word',
    'docx': 'fas fa-file-word',
    'xls': 'fas fa-file-excel',
    'xlsx': 'fas fa-file-excel',
    'ppt': 'fas fa-file-powerpoint',
    'pptx': 'fas fa-file-powerpoint',
    
    // Images
    'jpg': 'fas fa-file-image',
    'jpeg': 'fas fa-file-image',
    'png': 'fas fa-file-image',
    'gif': 'fas fa-file-image',
    'svg': 'fas fa-file-image',
    'bmp': 'fas fa-file-image',
    'webp': 'fas fa-file-image',
    
    // Vidéos
    'mp4': 'fas fa-file-video',
    'avi': 'fas fa-file-video',
    'mov': 'fas fa-file-video',
    'wmv': 'fas fa-file-video',
    'flv': 'fas fa-file-video',
    'webm': 'fas fa-file-video',
    'mkv': 'fas fa-file-video',
    
    // Audio
    'mp3': 'fas fa-file-audio',
    'wav': 'fas fa-file-audio',
    'flac': 'fas fa-file-audio',
    'ogg': 'fas fa-file-audio',
    'aac': 'fas fa-file-audio',
    'm4a': 'fas fa-file-audio',
    
    // Archives
    'zip': 'fas fa-file-archive',
    'rar': 'fas fa-file-archive',
    '7z': 'fas fa-file-archive',
    'tar': 'fas fa-file-archive',
    'gz': 'fas fa-file-archive',
    
    // Code
    'js': 'fas fa-file-code',
    'ts': 'fas fa-file-code',
    'html': 'fas fa-file-code',
    'css': 'fas fa-file-code',
    'json': 'fas fa-file-code',
    'xml': 'fas fa-file-code',
    'py': 'fas fa-file-code',
    'php': 'fas fa-file-code',
    'java': 'fas fa-file-code',
    'cpp': 'fas fa-file-code',
    'c': 'fas fa-file-code',
    'vue': 'fas fa-file-code',
    'jsx': 'fas fa-file-code',
    'tsx': 'fas fa-file-code',
    
    // Texte
    'txt': 'fas fa-file-alt',
    'md': 'fas fa-file-alt',
    'readme': 'fas fa-file-alt'
  }

  return iconMap[ext] || 'fas fa-file'
})

// Computed pour le type de fichier
const fileType = computed(() => {
  if (props.file.is_directory) {
    return 'Dossier'
  }

  const ext = getFileExtension(props.file.name)?.toLowerCase()
  const typeMap = {
    // Documents
    'pdf': 'PDF',
    'doc': 'Word',
    'docx': 'Word',
    'xls': 'Excel',
    'xlsx': 'Excel',
    'ppt': 'PowerPoint',
    'pptx': 'PowerPoint',
    
    // Images
    'jpg': 'Image',
    'jpeg': 'Image',
    'png': 'Image',
    'gif': 'Image',
    'svg': 'Image',
    'bmp': 'Image',
    'webp': 'Image',
    
    // Vidéos
    'mp4': 'Vidéo',
    'avi': 'Vidéo',
    'mov': 'Vidéo',
    'wmv': 'Vidéo',
    'flv': 'Vidéo',
    'webm': 'Vidéo',
    'mkv': 'Vidéo',
    
    // Audio
    'mp3': 'Audio',
    'wav': 'Audio',
    'flac': 'Audio',
    'ogg': 'Audio',
    'aac': 'Audio',
    'm4a': 'Audio',
    
    // Archives
    'zip': 'Archive',
    'rar': 'Archive',
    '7z': 'Archive',
    'tar': 'Archive',
    'gz': 'Archive',
    
    // Code
    'js': 'JavaScript',
    'ts': 'TypeScript',
    'html': 'HTML',
    'css': 'CSS',
    'json': 'JSON',
    'xml': 'XML',
    'py': 'Python',
    'php': 'PHP',
    'java': 'Java',
    'cpp': 'C++',
    'c': 'C',
    'vue': 'Vue',
    'jsx': 'React',
    'tsx': 'React',
    
    // Texte
    'txt': 'Texte',
    'md': 'Markdown',
    'readme': 'Readme'
  }

  return typeMap[ext] || (ext ? ext.toUpperCase() : 'Fichier')
})

// Computed pour la taille formatée (compact et lisible)
const formattedSize = computed(() => {
  if (props.file.is_directory) {
    return '—'
  }
  
  // S'assurer que la taille est affichée même si elle est 0
  const size = props.file.size || 0
  try {
    return formatBytes(size)
  } catch (error) {
    console.error('Erreur formatBytes:', error, 'size:', size)
    return size + ' B'
  }
})

// Computed pour la date formatée (compact et lisible)
const formattedDate = computed(() => {
  try {
    const result = formatDate(props.file.modified_time)
    return result || 'Date inconnue'
  } catch (error) {
    console.error('Erreur formatDate:', error, 'date:', props.file.modified_time)
    return 'Date inconnue'
  }
})

// Computed pour nettoyer le nom du fichier
const cleanFileName = computed(() => {
  let name = props.file.name || ''
  
  // Debug complet pour voir toutes les données
  console.log('FileListItem - Debug complet:', {
    name: name,
    size: props.file.size,
    modified_time: props.file.modified_time,
    is_directory: props.file.is_directory,
    fullFile: props.file,
    formattedSize: formatBytes(props.file.size || 0),
    formattedDate: formatDate(props.file.modified_time)
  })
  
  // Nettoyer les suffixes ajoutés automatiquement
  name = name.replace(/ - dossier$/i, '')
  name = name.replace(/ - fichier$/i, '')
  name = name.replace(/ - folder$/i, '')
  name = name.replace(/ - file$/i, '')
  
  return name
})

// Computed pour déterminer si une colonne doit être affichée
const shouldShowColumn = (columnKey) => {
  return props.visibleColumns.some(col => col.key === columnKey)
}

// Utilitaire pour extraire l'extension
const getFileExtension = (filename) => {
  if (!filename) return ''
  const parts = filename.split('.')
  return parts.length > 1 ? parts.pop() : ''
}

// Génère un label accessible pour le fichier
const getAriaLabel = () => {
  const type = props.file.is_directory ? 'Dossier' : 'Fichier'
  const size = props.file.is_directory ? '' : `, taille ${formattedSize.value}`
  const date = props.file.modified_time ? `, modifié le ${formattedDate.value}` : ''
  const selectedText = props.selected ? ', sélectionné' : ''
  
  return `${type} ${props.file.name}${size}${date}${selectedText}`
}

// Gestionnaires d'événements simplifiés
const handleClick = (event) => {
  emit('click', props.file, event)
}

const handleDoubleClick = (event) => {
  emit('double-click', props.file, event)
}

const handleRightClick = (event) => {
  event.preventDefault()
  emit('context-menu', props.file, event)
}

const handleKeydown = (event) => {
  switch (event.key) {
    case 'Enter':
      event.preventDefault()
      handleDoubleClick(event)
      break
    case ' ':
      event.preventDefault()
      handleClick(event)
      break
  }
}
</script>

<style scoped>
/* Styles simples et propres pour l'affichage des listes */
.file-list-item {
  @apply flex items-center gap-2 px-3 py-2 text-sm;
  @apply hover:bg-base-200 cursor-pointer;
  @apply transition-colors duration-150;
}

.file-list-item.selected {
  @apply bg-base-300 text-base-content;
}

/* Icônes de taille appropriée (16px) */
.file-list-item i {
  @apply w-4 h-4 flex-shrink-0;
}

/* Amélioration de l'accessibilité */
tr:focus {
  @apply outline-none ring-2 ring-primary ring-offset-1;
}

/* Réduction des animations si demandé */
@media (prefers-reduced-motion: reduce) {
  .file-list-item {
    transition: none;
  }
}
</style>