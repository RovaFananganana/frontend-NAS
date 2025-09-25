<template>
  <tr 
    :data-file-index="index"
    :class="[
      'file-list-item-enhanced group cursor-pointer transition-all border-b border-base-300/30 relative focus-visible-only',
      {
        // Styles desktop
        'hover:bg-gradient-to-r hover:from-base-200/50 hover:to-transparent': !isMobile,
        'hover:shadow-sm hover:scale-[1.01] hover:z-10': !isMobile,
        'duration-150': !isMobile,
        
        // Styles mobile/tactile
        'active:bg-base-200/70 touch-manipulation': isMobile || isTouch,
        'duration-75': isMobile || isTouch,
        'min-h-[44px]': isTouch, // Minimum touch target
        
        // États de sélection
        'bg-primary/15 border-primary/30 shadow-md': selected,
        'hover:bg-primary/5': !selected && !isMobile,
        'active:bg-primary/10': !selected && (isMobile || isTouch),
        'ring-2 ring-primary ring-offset-1 ring-offset-base-100': focused,
        'bg-primary/8 border-primary/15': focused && !selected,
        'bg-gradient-to-r from-primary/20 to-primary/10 border-primary/40': selected && focused
      }
    ]"
    :style="{ minHeight: isTouch ? '44px' : 'auto' }"
    :tabindex="focused ? 0 : -1"
    role="gridcell"
    :aria-selected="selected"
    :aria-label="getAriaLabel()"
    :aria-describedby="`file-${index}-description`"
    @click="handleClick"
    @dblclick="handleDoubleClick"
    @contextmenu="handleRightClick"
    @keydown="handleKeydown"
    @touchstart="handleTouchStart"
    @touchend="handleTouchEnd"
  >
    <!-- Colonne Nom avec icône -->
    <td :class="[
      'flex items-center',
      {
        'py-3': !isTouch,
        'py-4': isTouch,
        'px-2': isMobile,
        'px-4': !isMobile
      }
    ]"
    :style="{ 
      width: getColumnWidth('name'),
      maxWidth: getColumnWidth('name')
    }">
      <!-- Indicateur de sélection -->
      <div 
        v-if="selected" 
        class="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full opacity-80"
      ></div>
      
      <div :class="[
        'flex items-center',
        {
          'space-x-2': isMobile,
          'space-x-3': !isMobile
        }
      ]">
        <!-- Checkbox de sélection (plus visible sur mobile) -->
        <div class="relative">
          <div 
            :class="[
              'rounded border-2 transition-all duration-200 flex items-center justify-center',
              'absolute -left-1 z-10',
              {
                'w-4 h-4 top-2': !isTouch,
                'w-5 h-5 top-3': isTouch, // Plus grand pour le tactile
                'border-primary bg-primary': selected,
                'border-base-300 bg-base-100': !selected,
                'opacity-0 group-hover:opacity-100': !selected && !isMobile && !isTouch,
                'opacity-60': !selected && (isMobile || isTouch), // Toujours visible sur mobile
                'opacity-100': focused || selected
              }
            ]"
          >
            <i v-if="selected" :class="[
              'fas fa-check text-white',
              {
                'text-xs': !isTouch,
                'text-sm': isTouch
              }
            ]"></i>
          </div>
        </div>
        
        <div class="relative">
          <div 
            :class="[
              'file-icon-enhanced rounded-lg flex items-center justify-center',
              'bg-gradient-to-br transition-all duration-200',
              fileIconBg,
              {
                'w-8 h-8': !isTouch,
                'w-10 h-10': isTouch, // Plus grand pour le tactile
                'group-hover:scale-110 group-hover:shadow-md': !isMobile,
                'ring-2 ring-primary/50': selected,
                'opacity-60': fileOperationIndicator?.type === 'cut',
                'ring-2 ring-info/50': fileOperationIndicator?.type === 'copy'
              }
            ]"
            :style="{ 
              '--icon-bg-start': getIconColorStart(), 
              '--icon-bg-end': getIconColorEnd() 
            }"
            :aria-hidden="true"
          >
            <i :class="[
              fileIcon, 
              'text-white',
              {
                'text-sm': !isTouch,
                'text-base': isTouch
              }
            ]"></i>
          </div>
          
          <!-- File operation indicator -->
          <div 
            v-if="fileOperationIndicator"
            :class="[
              'absolute -top-1 -right-1 rounded-full flex items-center justify-center',
              'text-white text-xs font-bold shadow-lg',
              {
                'w-4 h-4': !isTouch,
                'w-5 h-5': isTouch,
                'bg-info': fileOperationIndicator.type === 'copy',
                'bg-warning': fileOperationIndicator.type === 'cut'
              }
            ]"
            :title="fileOperationIndicator.label"
            :aria-label="fileOperationIndicator.label"
          >
            <i :class="[
              fileOperationIndicator.type === 'copy' ? 'fas fa-copy' : 'fas fa-cut',
              {
                'text-xs': !isTouch,
                'text-sm': isTouch
              }
            ]"></i>
          </div>
        </div>
        <div class="min-w-0 flex-1">
          <span :class="[
            'font-medium transition-colors block truncate',
            {
              'text-sm': isMobile,
              'text-base': !isMobile,
              'text-primary font-semibold': selected,
              'text-base-content group-hover:text-primary': !selected && !isMobile,
              'text-base-content': !selected && isMobile
            }
          ]">
            {{ file.name }}
          </span>
          <div v-if="file.description && !isMobile" class="text-xs text-base-content/60 mt-0.5 truncate">
            {{ file.description }}
          </div>
        </div>
      </div>
    </td>
    
    <!-- Colonne Taille -->
    <td v-if="shouldShowColumn('size')" 
    :style="{ 
      width: getColumnWidth('size'),
      maxWidth: getColumnWidth('size')
    }">
      <div :class="[
        'text-base-content/70 font-mono text-right w-full flex items-center justify-end',
        {
          'text-xs': isMobile,
          'text-sm': !isMobile,
          'px-1': isMobile,
          'px-2': !isMobile
        }
      ]">
        {{ formattedSize }}
      </div>
    </td>
    
    <!-- Colonne Type -->
    <td v-if="shouldShowColumn('type')" 
    :style="{ 
      width: getColumnWidth('type'),
      maxWidth: getColumnWidth('type')
    }">
      <div :class="[
        'text-base-content/70 w-full flex items-center justify-center',
        {
          'px-1': isMobile,
          'px-2': !isMobile
        }
      ]">
        <span :class="[
          'inline-flex items-center rounded-full font-medium bg-base-200 text-base-content/80',
          {
            'px-1.5 py-0.5 text-xs': isMobile,
            'px-2 py-1 text-xs': !isMobile
          }
        ]">
          {{ fileType }}
        </span>
      </div>
    </td>
    
    <!-- Colonne Date de modification -->
    <td v-if="shouldShowColumn('date')" 
    :style="{ 
      width: getColumnWidth('date'),
      maxWidth: getColumnWidth('date')
    }">
      <div :class="[
        'text-base-content/60 text-left w-full flex items-center',
        {
          'text-xs': isMobile,
          'text-sm': !isMobile,
          'px-1': isMobile,
          'px-2': !isMobile
        }
      ]">
        {{ formattedDate }}
      </div>
    </td>
    
    <!-- Description cachée pour les lecteurs d'écran -->
    <td class="sr-only">
      <div :id="`file-${index}-description`">
        {{ getAriaLabel() }}
      </div>
    </td>
  </tr>
</template>

<script setup>
import { computed } from 'vue'
import { formatBytes, formatDate } from '@/utils/fileUtils.js'
import { formatDateForScreen, formatSizeForScreen } from '@/utils/mobileUtils.js'

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
  index: {
    type: Number,
    default: 0
  },
  isMobile: {
    type: Boolean,
    default: false
  },
  isTouch: {
    type: Boolean,
    default: false
  },
  visibleColumns: {
    type: Array,
    default: () => []
  },
  fileOperationIndicator: {
    type: Object,
    default: null
  }
})

// Émissions
const emit = defineEmits(['click', 'double-click', 'context-menu'])

// Computed pour l'icône du fichier
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

// Computed pour l'arrière-plan coloré de l'icône
const fileIconBg = computed(() => {
  if (props.file.is_directory) {
    return 'from-blue-500 to-blue-600'
  }

  const ext = getFileExtension(props.file.name)?.toLowerCase()
  const colorMap = {
    // Documents - Rouge
    'pdf': 'from-red-500 to-red-600',
    'doc': 'from-blue-600 to-blue-700',
    'docx': 'from-blue-600 to-blue-700',
    'xls': 'from-green-600 to-green-700',
    'xlsx': 'from-green-600 to-green-700',
    'ppt': 'from-orange-600 to-orange-700',
    'pptx': 'from-orange-600 to-orange-700',
    
    // Images - Violet
    'jpg': 'from-purple-500 to-purple-600',
    'jpeg': 'from-purple-500 to-purple-600',
    'png': 'from-purple-500 to-purple-600',
    'gif': 'from-purple-500 to-purple-600',
    'svg': 'from-purple-500 to-purple-600',
    'bmp': 'from-purple-500 to-purple-600',
    'webp': 'from-purple-500 to-purple-600',
    
    // Vidéos - Rouge foncé
    'mp4': 'from-red-600 to-red-700',
    'avi': 'from-red-600 to-red-700',
    'mov': 'from-red-600 to-red-700',
    'wmv': 'from-red-600 to-red-700',
    'flv': 'from-red-600 to-red-700',
    'webm': 'from-red-600 to-red-700',
    'mkv': 'from-red-600 to-red-700',
    
    // Audio - Vert
    'mp3': 'from-green-500 to-green-600',
    'wav': 'from-green-500 to-green-600',
    'flac': 'from-green-500 to-green-600',
    'ogg': 'from-green-500 to-green-600',
    'aac': 'from-green-500 to-green-600',
    'm4a': 'from-green-500 to-green-600',
    
    // Archives - Gris
    'zip': 'from-gray-600 to-gray-700',
    'rar': 'from-gray-600 to-gray-700',
    '7z': 'from-gray-600 to-gray-700',
    'tar': 'from-gray-600 to-gray-700',
    'gz': 'from-gray-600 to-gray-700',
    
    // Code - Couleurs variées
    'js': 'from-yellow-500 to-yellow-600',
    'ts': 'from-blue-500 to-blue-600',
    'html': 'from-orange-500 to-orange-600',
    'css': 'from-blue-400 to-blue-500',
    'json': 'from-green-500 to-green-600',
    'xml': 'from-orange-400 to-orange-500',
    'py': 'from-yellow-600 to-yellow-700',
    'php': 'from-purple-600 to-purple-700',
    'java': 'from-red-600 to-red-700',
    'cpp': 'from-blue-700 to-blue-800',
    'c': 'from-blue-700 to-blue-800',
    'vue': 'from-green-500 to-green-600',
    'jsx': 'from-cyan-500 to-cyan-600',
    'tsx': 'from-cyan-600 to-cyan-700',
    
    // Texte - Gris clair
    'txt': 'from-gray-500 to-gray-600',
    'md': 'from-gray-500 to-gray-600',
    'readme': 'from-gray-500 to-gray-600'
  }

  return colorMap[ext] || 'from-gray-500 to-gray-600'
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
    'jpg': 'Image JPEG',
    'jpeg': 'Image JPEG',
    'png': 'Image PNG',
    'gif': 'Image GIF',
    'svg': 'Image SVG',
    'bmp': 'Image BMP',
    'webp': 'Image WebP',
    
    // Vidéos
    'mp4': 'Vidéo MP4',
    'avi': 'Vidéo AVI',
    'mov': 'Vidéo MOV',
    'wmv': 'Vidéo WMV',
    'flv': 'Vidéo FLV',
    'webm': 'Vidéo WebM',
    'mkv': 'Vidéo MKV',
    
    // Audio
    'mp3': 'Audio MP3',
    'wav': 'Audio WAV',
    'flac': 'Audio FLAC',
    'ogg': 'Audio OGG',
    'aac': 'Audio AAC',
    'm4a': 'Audio M4A',
    
    // Archives
    'zip': 'Archive ZIP',
    'rar': 'Archive RAR',
    '7z': 'Archive 7Z',
    'tar': 'Archive TAR',
    'gz': 'Archive GZ',
    
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
    'jsx': 'React JSX',
    'tsx': 'React TSX',
    
    // Texte
    'txt': 'Texte',
    'md': 'Markdown',
    'readme': 'Readme'
  }

  return typeMap[ext] || (ext ? ext.toUpperCase() : 'Fichier')
})

// Computed pour la taille formatée selon l'écran
const formattedSize = computed(() => {
  if (props.file.is_directory) {
    return '—'
  }
  
  if (props.isMobile) {
    return formatSizeForScreen(props.file.size || 0, window.innerWidth)
  }
  
  return formatBytes(props.file.size || 0)
})

// Computed pour la date formatée selon l'écran
const formattedDate = computed(() => {
  if (props.isMobile) {
    return formatDateForScreen(props.file.modified_time, window.innerWidth)
  }
  
  return formatDate(props.file.modified_time)
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

// Obtient la couleur de début pour l'icône
const getIconColorStart = () => {
  const colorMap = fileIconBg.value.match(/from-(\w+-\d+)/)
  return colorMap ? `var(--color-${colorMap[1]})` : '#6366f1'
}

// Obtient la couleur de fin pour l'icône
const getIconColorEnd = () => {
  const colorMap = fileIconBg.value.match(/to-(\w+-\d+)/)
  return colorMap ? `var(--color-${colorMap[1]})` : '#4f46e5'
}

// Variables pour la gestion tactile
let touchStartTime = 0
let touchStartX = 0
let touchStartY = 0
let longPressTimer = null

// Gestionnaires d'événements
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

// Gestionnaires tactiles
const handleTouchStart = (event) => {
  if (!props.isTouch) return
  
  touchStartTime = Date.now()
  const touch = event.touches[0]
  touchStartX = touch.clientX
  touchStartY = touch.clientY
  
  // Démarrer le timer pour le long press (menu contextuel)
  longPressTimer = setTimeout(() => {
    // Simuler un clic droit pour le menu contextuel
    const contextEvent = new MouseEvent('contextmenu', {
      bubbles: true,
      cancelable: true,
      clientX: touchStartX,
      clientY: touchStartY
    })
    handleRightClick(contextEvent)
  }, 500) // 500ms pour le long press
}

const handleTouchEnd = (event) => {
  if (!props.isTouch) return
  
  // Annuler le long press
  if (longPressTimer) {
    clearTimeout(longPressTimer)
    longPressTimer = null
  }
  
  const touchDuration = Date.now() - touchStartTime
  const touch = event.changedTouches[0]
  const deltaX = Math.abs(touch.clientX - touchStartX)
  const deltaY = Math.abs(touch.clientY - touchStartY)
  
  // Vérifier si c'est un tap (pas un swipe)
  if (deltaX < 10 && deltaY < 10) {
    if (touchDuration < 300) {
      // Tap court - sélection
      const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        clientX: touch.clientX,
        clientY: touch.clientY
      })
      handleClick(clickEvent)
    }
  }
}

const handleKeydown = (event) => {
  // Gérer les touches spécifiques à l'élément
  switch (event.key) {
    case 'Enter':
    case ' ':
      event.preventDefault()
      if (event.key === 'Enter') {
        handleDoubleClick(event)
      } else {
        handleClick(event)
      }
      break
    case 'ArrowUp':
    case 'ArrowDown':
    case 'Home':
    case 'End':
    case 'PageUp':
    case 'PageDown':
      // Laisser le composable de navigation gérer ces touches
      break
    default:
      // Autres touches sont gérées par le composable global
      break
  }
}

// Méthode pour obtenir la largeur de colonne
const getColumnWidth = (columnKey) => {
  const column = props.visibleColumns.find(col => col.key === columnKey)
  return column ? column.width : 'auto'
}
</script>

<style scoped>
/* Transitions fluides pour les micro-interactions */
tr {
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Effet de survol élégant */
tr:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* Animation de l'icône au survol */
.group:hover .w-8 {
  transform: scale(1.1);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

/* Transition pour la sélection */
tr.bg-primary\/10 {
  background: linear-gradient(135deg, hsl(var(--p) / 0.1) 0%, hsl(var(--p) / 0.05) 100%);
  border-color: hsl(var(--p) / 0.2);
}

/* Amélioration de l'accessibilité */
tr:focus-within,
tr:focus {
  outline: none; /* Utiliser ring au lieu de outline */
}

/* Style pour l'élément focusé par le clavier */
tr.ring-2 {
  position: relative;
  z-index: 10;
}

/* Animation pour le focus */
@keyframes focus-pulse {
  0% { 
    box-shadow: 0 0 0 2px hsl(var(--p) / 0.3);
  }
  50% { 
    box-shadow: 0 0 0 4px hsl(var(--p) / 0.2);
  }
  100% { 
    box-shadow: 0 0 0 2px hsl(var(--p) / 0.3);
  }
}

tr.ring-2:focus {
  animation: focus-pulse 1.5s ease-in-out infinite;
}

/* Optimisations tactiles */
.touch-manipulation {
  touch-action: manipulation;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  user-select: none;
}

/* Amélioration des zones de touch */
@media (pointer: coarse) {
  tr {
    min-height: 44px; /* Minimum touch target */
  }
  
  td {
    padding: 0.75rem 0.5rem;
  }
}

/* Responsive - adaptation progressive */
@media (max-width: 640px) {
  /* Ajustements pour mobile */
  .space-x-3 {
    gap: 0.5rem;
  }
  
  /* Réduire la taille des éléments sur très petit écran */
  .w-10 {
    width: 2rem;
    height: 2rem;
  }
  
  .w-8 {
    width: 1.75rem;
    height: 1.75rem;
  }
}

@media (max-width: 480px) {
  /* Très petit écran - optimisations maximales */
  td {
    padding: 0.5rem 0.25rem;
  }
  
  .space-x-2 {
    gap: 0.375rem;
  }
  
  .w-10 {
    width: 1.75rem;
    height: 1.75rem;
  }
  
  .w-8 {
    width: 1.5rem;
    height: 1.5rem;
  }
}

/* Animation pour les changements d'état */
@keyframes selection-pulse {
  0% { background-color: hsl(var(--p) / 0.1); }
  50% { background-color: hsl(var(--p) / 0.2); }
  100% { background-color: hsl(var(--p) / 0.1); }
}

tr.bg-primary\/10:first-child {
  animation: selection-pulse 0.3s ease-out;
}

/* Amélioration du contraste pour l'accessibilité */
@media (prefers-contrast: high) {
  tr:hover {
    background-color: hsl(var(--b2));
    border-color: hsl(var(--bc) / 0.3);
  }
  
  .text-base-content\/70 {
    color: hsl(var(--bc) / 0.9);
  }
  
  .text-base-content\/60 {
    color: hsl(var(--bc) / 0.8);
  }
}

/* File operation indicators */
.file-operation-copy {
  position: relative;
}

.file-operation-copy::after {
  content: '';
  position: absolute;
  top: -2px;
  right: -2px;
  width: 8px;
  height: 8px;
  background: hsl(var(--in));
  border-radius: 50%;
  border: 2px solid hsl(var(--b1));
}

.file-operation-cut {
  opacity: 0.6;
  position: relative;
}

.file-operation-cut::after {
  content: '';
  position: absolute;
  top: -2px;
  right: -2px;
  width: 8px;
  height: 8px;
  background: hsl(var(--wa));
  border-radius: 50%;
  border: 2px solid hsl(var(--b1));
}

/* Animation for file operation indicators */
@keyframes operation-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.file-operation-copy,
.file-operation-cut {
  animation: operation-pulse 2s ease-in-out infinite;
}

/* Réduction des animations si demandé */
@media (prefers-reduced-motion: reduce) {
  tr,
  .w-8 {
    transition: none;
  }
  
  tr:hover {
    transform: none;
  }
  
  .group:hover .w-8 {
    transform: none;
  }
  
  .file-operation-copy,
  .file-operation-cut {
    animation: none;
  }
}
</style>