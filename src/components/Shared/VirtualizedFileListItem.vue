<template>
  <tr 
    :data-file-index="index"
    :class="[
      'group cursor-pointer border-b border-base-300/30 relative',
      {
        'bg-primary/15 border-primary/30 shadow-md': selected,
        'ring-2 ring-primary ring-offset-1 ring-offset-base-100': focused,
        'bg-primary/8 border-primary/15': focused && !selected,
        'bg-gradient-to-r from-primary/20 to-primary/10 border-primary/40': selected && focused
      },
      // Optimisations conditionnelles
      {
        'hover:bg-gradient-to-r hover:from-base-200/50 hover:to-transparent': !performanceMode,
        'hover:shadow-sm hover:scale-[1.01] hover:z-10': !performanceMode,
        'hover:bg-primary/5': !selected && !performanceMode,
        'hover:bg-base-200/30': performanceMode
      }
    ]"
    :style="{ 
      height: `${itemHeight}px`,
      transitionDuration: transitionDuration,
      ...optimizedStyles
    }"
    :tabindex="focused ? 0 : -1"
    @click="handleClick"
    @dblclick="handleDoubleClick"
    @contextmenu="handleRightClick"
    @keydown="handleKeydown"
  >
    <!-- Colonne Nom avec icône -->
    <td class="flex items-center py-3">
      <!-- Indicateur de sélection -->
      <div 
        v-if="selected" 
        class="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full opacity-80"
      ></div>
      
      <div class="flex items-center space-x-3">
        <!-- Checkbox de sélection (optimisé) -->
        <div class="relative">
          <div 
            :class="[
              'w-4 h-4 rounded border-2 flex items-center justify-center',
              'absolute -left-1 top-2 z-10',
              {
                'border-primary bg-primary': selected,
                'border-base-300 bg-base-100': !selected,
                'opacity-0 group-hover:opacity-100': !selected && !performanceMode,
                'opacity-100': focused || performanceMode
              }
            ]"
            :style="{ 
              transitionDuration: performanceMode ? '0ms' : transitionDuration 
            }"
          >
            <i v-if="selected" class="fas fa-check text-white text-xs"></i>
          </div>
        </div>
        
        <!-- Icône de fichier optimisée -->
        <div 
          :class="[
            'w-8 h-8 rounded-lg flex items-center justify-center',
            'bg-gradient-to-br',
            fileIconBg,
            {
              'group-hover:scale-110 group-hover:shadow-md': !performanceMode,
              'ring-2 ring-primary/50': selected
            }
          ]"
          :style="{ 
            transitionDuration: performanceMode ? '0ms' : transitionDuration,
            ...optimizedStyles
          }"
        >
          <i :class="[fileIcon, 'text-white text-sm']"></i>
        </div>
        
        <!-- Nom du fichier -->
        <div>
          <span 
            :class="[
              'font-medium',
              {
                'text-primary font-semibold': selected,
                'text-base-content group-hover:text-primary': !selected && !performanceMode,
                'text-base-content': performanceMode
              }
            ]"
            :style="{ 
              transitionDuration: performanceMode ? '0ms' : transitionDuration 
            }"
          >
            {{ file.name }}
          </span>
          <div v-if="file.description && !performanceMode" class="text-xs text-base-content/60 mt-0.5">
            {{ file.description }}
          </div>
        </div>
      </div>
    </td>
    
    <!-- Colonne Taille -->
    <td class="text-base-content/70 font-mono text-sm text-right">
      {{ formattedSize }}
    </td>
    
    <!-- Colonne Type -->
    <td class="text-base-content/70">
      <span 
        :class="[
          'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
          performanceMode ? 'bg-base-200 text-base-content/80' : 'bg-base-200 text-base-content/80'
        ]"
      >
        {{ fileType }}
      </span>
    </td>
    
    <!-- Colonne Date de modification -->
    <td class="text-base-content/60 text-sm">
      {{ formattedDate }}
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
  index: {
    type: Number,
    default: 0
  },
  itemHeight: {
    type: Number,
    default: 48
  },
  performanceMode: {
    type: Boolean,
    default: false
  },
  transitionDuration: {
    type: String,
    default: '150ms'
  },
  animationDuration: {
    type: String,
    default: '300ms'
  },
  optimizedStyles: {
    type: Object,
    default: () => ({})
  }
})

// Émissions
const emit = defineEmits(['click', 'double-click', 'context-menu'])

// Cache pour les calculs coûteux
const fileExtensionCache = new Map()
const iconCache = new Map()
const colorCache = new Map()

// Utilitaire optimisé pour extraire l'extension
const getFileExtension = (filename) => {
  if (!filename) return ''
  
  if (fileExtensionCache.has(filename)) {
    return fileExtensionCache.get(filename)
  }
  
  const parts = filename.split('.')
  const ext = parts.length > 1 ? parts.pop().toLowerCase() : ''
  
  fileExtensionCache.set(filename, ext)
  return ext
}

// Computed optimisés avec mise en cache
const fileIcon = computed(() => {
  const cacheKey = `${props.file.is_directory}-${props.file.name}`
  
  if (iconCache.has(cacheKey)) {
    return iconCache.get(cacheKey)
  }
  
  let icon
  
  if (props.file.is_directory) {
    icon = 'fas fa-folder'
  } else {
    const ext = getFileExtension(props.file.name)
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
    
    icon = iconMap[ext] || 'fas fa-file'
  }
  
  iconCache.set(cacheKey, icon)
  return icon
})

const fileIconBg = computed(() => {
  const cacheKey = `bg-${props.file.is_directory}-${props.file.name}`
  
  if (colorCache.has(cacheKey)) {
    return colorCache.get(cacheKey)
  }
  
  let color
  
  if (props.file.is_directory) {
    color = 'from-blue-500 to-blue-600'
  } else {
    const ext = getFileExtension(props.file.name)
    const colorMap = {
      // Documents
      'pdf': 'from-red-500 to-red-600',
      'doc': 'from-blue-600 to-blue-700',
      'docx': 'from-blue-600 to-blue-700',
      'xls': 'from-green-600 to-green-700',
      'xlsx': 'from-green-600 to-green-700',
      'ppt': 'from-orange-600 to-orange-700',
      'pptx': 'from-orange-600 to-orange-700',
      
      // Images
      'jpg': 'from-purple-500 to-purple-600',
      'jpeg': 'from-purple-500 to-purple-600',
      'png': 'from-purple-500 to-purple-600',
      'gif': 'from-purple-500 to-purple-600',
      'svg': 'from-purple-500 to-purple-600',
      'bmp': 'from-purple-500 to-purple-600',
      'webp': 'from-purple-500 to-purple-600',
      
      // Vidéos
      'mp4': 'from-red-600 to-red-700',
      'avi': 'from-red-600 to-red-700',
      'mov': 'from-red-600 to-red-700',
      'wmv': 'from-red-600 to-red-700',
      'flv': 'from-red-600 to-red-700',
      'webm': 'from-red-600 to-red-700',
      'mkv': 'from-red-600 to-red-700',
      
      // Audio
      'mp3': 'from-green-500 to-green-600',
      'wav': 'from-green-500 to-green-600',
      'flac': 'from-green-500 to-green-600',
      'ogg': 'from-green-500 to-green-600',
      'aac': 'from-green-500 to-green-600',
      'm4a': 'from-green-500 to-green-600',
      
      // Archives
      'zip': 'from-gray-600 to-gray-700',
      'rar': 'from-gray-600 to-gray-700',
      '7z': 'from-gray-600 to-gray-700',
      'tar': 'from-gray-600 to-gray-700',
      'gz': 'from-gray-600 to-gray-700',
      
      // Code
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
      
      // Texte
      'txt': 'from-gray-500 to-gray-600',
      'md': 'from-gray-500 to-gray-600',
      'readme': 'from-gray-500 to-gray-600'
    }
    
    color = colorMap[ext] || 'from-gray-500 to-gray-600'
  }
  
  colorCache.set(cacheKey, color)
  return color
})

const fileType = computed(() => {
  if (props.file.is_directory) {
    return 'Dossier'
  }

  const ext = getFileExtension(props.file.name)
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
    'jpg': 'JPEG',
    'jpeg': 'JPEG',
    'png': 'PNG',
    'gif': 'GIF',
    'svg': 'SVG',
    'bmp': 'BMP',
    'webp': 'WebP',
    
    // Vidéos
    'mp4': 'MP4',
    'avi': 'AVI',
    'mov': 'MOV',
    'wmv': 'WMV',
    'flv': 'FLV',
    'webm': 'WebM',
    'mkv': 'MKV',
    
    // Audio
    'mp3': 'MP3',
    'wav': 'WAV',
    'flac': 'FLAC',
    'ogg': 'OGG',
    'aac': 'AAC',
    'm4a': 'M4A',
    
    // Archives
    'zip': 'ZIP',
    'rar': 'RAR',
    '7z': '7Z',
    'tar': 'TAR',
    'gz': 'GZ',
    
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
    'jsx': 'JSX',
    'tsx': 'TSX',
    
    // Texte
    'txt': 'Texte',
    'md': 'Markdown',
    'readme': 'Readme'
  }

  return typeMap[ext] || (ext ? ext.toUpperCase() : 'Fichier')
})

// Cache pour les formatages
const formatCache = new Map()

const formattedSize = computed(() => {
  if (props.file.is_directory) {
    return '—'
  }
  
  const cacheKey = `size-${props.file.size}`
  if (formatCache.has(cacheKey)) {
    return formatCache.get(cacheKey)
  }
  
  const formatted = formatBytes(props.file.size || 0)
  formatCache.set(cacheKey, formatted)
  return formatted
})

const formattedDate = computed(() => {
  const cacheKey = `date-${props.file.modified_time}`
  if (formatCache.has(cacheKey)) {
    return formatCache.get(cacheKey)
  }
  
  const formatted = formatDate(props.file.modified_time)
  formatCache.set(cacheKey, formatted)
  return formatted
})

// Gestionnaires d'événements optimisés
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
      break
  }
}

// Nettoyage du cache si nécessaire (éviter les fuites mémoire)
const cleanupCache = () => {
  if (fileExtensionCache.size > 1000) {
    fileExtensionCache.clear()
  }
  if (iconCache.size > 1000) {
    iconCache.clear()
  }
  if (colorCache.size > 1000) {
    colorCache.clear()
  }
  if (formatCache.size > 1000) {
    formatCache.clear()
  }
}

// Nettoyage périodique du cache
let cleanupInterval = null
if (typeof window !== 'undefined') {
  cleanupInterval = setInterval(cleanupCache, 60000) // Toutes les minutes
}

// Nettoyage à la destruction du composant
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    if (cleanupInterval) {
      clearInterval(cleanupInterval)
    }
  })
}
</script>

<style scoped>
/* Optimisations de base */
tr {
  contain: layout style;
  will-change: auto;
}

/* Transitions fluides conditionnelles */
tr:not(.performance-mode) {
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
}

tr:not(.performance-mode):hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* Animation de l'icône au survol (seulement si pas en mode performance) */
tr:not(.performance-mode) .group:hover .w-8 {
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
  outline: none;
}

tr.ring-2 {
  position: relative;
  z-index: 10;
}

/* Animation pour le focus (seulement si pas en mode performance) */
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

tr:not(.performance-mode).ring-2:focus {
  animation: focus-pulse 1.5s ease-in-out infinite;
}

/* Responsive - masquer certaines colonnes sur mobile */
@media (max-width: 640px) {
  td:nth-child(3) {
    display: none;
  }
}

@media (max-width: 480px) {
  td:nth-child(4) {
    display: none;
  }
  
  .space-x-3 {
    gap: 0.5rem;
  }
  
  .w-8 {
    width: 1.5rem;
    height: 1.5rem;
  }
}

/* Mode performance - désactiver toutes les animations */
:global(.performance-mode) tr,
:global(.performance-mode) .w-8,
:global(.performance-mode) .group:hover .w-8 {
  transition: none !important;
  animation: none !important;
  transform: none !important;
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

/* Réduction des animations si demandé */
@media (prefers-reduced-motion: reduce) {
  tr,
  .w-8 {
    transition: none !important;
    animation: none !important;
  }
  
  tr:hover {
    transform: none !important;
  }
  
  .group:hover .w-8 {
    transform: none !important;
  }
}
</style>