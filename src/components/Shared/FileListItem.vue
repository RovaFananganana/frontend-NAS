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
    role="row"
    :aria-selected="selected"
    :aria-label="getAriaLabel()"
    @click.stop="handleClick"
    @dblclick.stop="handleDoubleClick"
    @contextmenu.prevent.stop="handleRightClick"
    @keydown="handleKeydown"
  >
    <!-- Colonne Nom avec icône -->
    <td class="px-3 py-2">
      <div class="flex items-center gap-2">
        <!-- Icône de fichier -->
        <div class="flex-shrink-0 relative">
          <i :class="[
            fileIcon, 
            'w-4 h-4',
            fileIconColor
          ]"></i>
          
          <!-- Indicateur favori -->
          <i v-if="isFavorite" 
             class="fas fa-star absolute -top-1 -right-1 w-2 h-2 text-warning"
             title="Favori"
             aria-label="Élément favori"></i>
        </div>
        
        <!-- Nom du fichier -->
        <div class="min-w-0 flex-1">
          <span class="text-sm font-medium truncate block">
            {{ cleanFileName }}
          </span>
          <!-- Afficher le chemin relatif pour les résultats de recherche -->
          <span v-if="file.source && (file.source === 'local' || file.source === 'remote')" 
                class="text-xs text-base-content/50 truncate block">
            {{ file.relative_path || file.path }}
          </span>
        </div>
      </div>
    </td>
    
    <!-- Colonne Taille -->
    <td class="px-3 py-2 text-right">
      <span class="text-sm text-base-content/70 font-mono">
        {{ formattedSize }}
      </span>
    </td>
    
    <!-- Colonne Type -->
    <td class="px-3 py-2 text-center">
      <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-base-200 text-base-content/80">
        {{ fileType }}
      </span>
    </td>
    
    <!-- Colonne Date de modification -->
    <td class="px-3 py-2">
      <span class="text-sm text-base-content/60">
        {{ formattedDate }}
      </span>
    </td>
  </tr>
</template>

<script setup>
import { computed } from 'vue'
import { formatBytes } from '@/utils/fileUtils.js'
import { formatDate } from '@/utils/dateUtils.js'

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

// ============================================
// FORMATAGE DE DATE AMÉLIORÉ
// ============================================

/**
 * Formate une date (alias pour la fonction utilitaire)
 */
const formatPostgresDate = formatDate

// Computed pour la date formatée
const formattedDate = computed(() => {
  // Chercher toutes les propriétés de date possibles
  const dateValue = props.file.modified || 
                   props.file.updated_at || 
                   props.file.modified_time || 
                   props.file.modified_date ||
                   props.file.created
  
  if (!dateValue) {
    // Log de debug pour voir les propriétés disponibles (seulement en mode debug)
    if (import.meta.env.DEV) {
      console.warn('❌ Aucune propriété de date trouvée pour:', props.file.name)
      console.log('📋 Propriétés disponibles:', Object.keys(props.file))
    }
    return 'Date inconnue'
  }
  
  const formatted = formatPostgresDate(dateValue)
  return formatted || 'Format invalide'
})

// ============================================
// TAILLE DES DOSSIERS
// ============================================

// Computed pour la taille formatée
const formattedSize = computed(() => {
  // Pour les dossiers
  if (props.file.is_directory) {
    // Si on a une taille calculée pour le dossier
    if (props.file.size && props.file.size > 0) {
      try {
        return formatBytes(props.file.size)
      } catch (error) {
        console.error('Erreur formatBytes pour dossier:', error)
        return '—'
      }
    }
    // Sinon afficher un tiret
    return '—'
  }
  
  // Pour les fichiers
  const size = props.file.size || 0
  try {
    return formatBytes(size)
  } catch (error) {
    console.error('Erreur formatBytes:', error, 'size:', size)
    return size + ' B'
  }
})

// ============================================
// ICÔNES ET TYPES DE FICHIERS
// ============================================

// Computed optimisé pour l'icône du fichier
const fileIcon = computed(() => {
  if (props.file.icon_info && props.file.icon_info.icon) {
    return props.file.icon_info.icon
  }

  if (props.file.is_directory) {
    return 'fas fa-folder'
  }

  const ext = getFileExtension(props.file.name)?.toLowerCase()
  const iconMap = {
    'pdf': 'fas fa-file-pdf',
    'doc': 'fas fa-file-word', 'docx': 'fas fa-file-word',
    'xls': 'fas fa-file-excel', 'xlsx': 'fas fa-file-excel',
    'ppt': 'fas fa-file-powerpoint', 'pptx': 'fas fa-file-powerpoint',
    'mdb': 'fas fa-database', 'accdb': 'fas fa-database',
    'jpg': 'fas fa-file-image', 'jpeg': 'fas fa-file-image', 'png': 'fas fa-file-image',
    'gif': 'fas fa-file-image', 'svg': 'fas fa-file-image', 'bmp': 'fas fa-file-image',
    'webp': 'fas fa-file-image',
    'mp4': 'fas fa-file-video', 'avi': 'fas fa-file-video', 'mov': 'fas fa-file-video',
    'wmv': 'fas fa-file-video', 'flv': 'fas fa-file-video', 'webm': 'fas fa-file-video',
    'mkv': 'fas fa-file-video',
    'mp3': 'fas fa-file-audio', 'wav': 'fas fa-file-audio', 'flac': 'fas fa-file-audio',
    'ogg': 'fas fa-file-audio', 'aac': 'fas fa-file-audio', 'm4a': 'fas fa-file-audio',
    'zip': 'fas fa-file-archive', 'rar': 'fas fa-file-archive', '7z': 'fas fa-file-archive',
    'tar': 'fas fa-file-archive', 'gz': 'fas fa-file-archive',
    'js': 'fas fa-file-code', 'ts': 'fas fa-file-code', 'html': 'fas fa-file-code',
    'css': 'fas fa-file-code', 'json': 'fas fa-file-code', 'xml': 'fas fa-file-code',
    'py': 'fas fa-file-code', 'php': 'fas fa-file-code', 'java': 'fas fa-file-code',
    'cpp': 'fas fa-file-code', 'c': 'fas fa-file-code', 'vue': 'fas fa-file-code',
    'jsx': 'fas fa-file-code', 'tsx': 'fas fa-file-code',
    'txt': 'fas fa-file-alt', 'md': 'fas fa-file-alt', 'readme': 'fas fa-file-alt'
  }

  return iconMap[ext] || 'fas fa-file'
})

const fileIconColor = computed(() => {
  if (props.file.is_directory) {
    return 'text-blue-500'
  }
  
  const ext = getFileExtension(props.file.name)?.toLowerCase()
  
  // Image files
  if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'bmp', 'webp'].includes(ext)) {
    return 'text-purple-500'
  }
  
  // Video files
  if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'].includes(ext)) {
    return 'text-red-500'
  }
  
  // Audio files
  if (['mp3', 'wav', 'flac', 'ogg', 'aac', 'm4a'].includes(ext)) {
    return 'text-green-500'
  }
  
  // Document files - couleurs spécifiques Microsoft Office
  if (['doc', 'docx', 'txt', 'md'].includes(ext)) {
    return 'text-blue-600' // Word en bleu
  }
  
  // Excel files - vert
  if (['xls', 'xlsx'].includes(ext)) {
    return 'text-green-600'
  }
  
  // PowerPoint files - rouge/orange
  if (['ppt', 'pptx'].includes(ext)) {
    return 'text-red-600'
  }
  
  // Access database files - rouge
  if (['mdb', 'accdb'].includes(ext)) {
    return 'text-red-600'
  }
  
  // PDF files - rouge
  if (['pdf'].includes(ext)) {
    return 'text-red-500'
  }
  
  // Archive files
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
    return 'text-orange-500'
  }
  
  // Code files
  if (['js', 'ts', 'html', 'css', 'json', 'xml', 'py', 'php', 'java', 'cpp', 'c', 'vue', 'jsx', 'tsx'].includes(ext)) {
    return 'text-yellow-500'
  }
  
  // Default for other files
  return 'text-gray-500'
})

const fileType = computed(() => {
  if (props.file.is_directory) {
    return 'Dossier'
  }

  const ext = getFileExtension(props.file.name)?.toLowerCase()
  const typeMap = {
    'pdf': 'PDF',
    'doc': 'Word', 'docx': 'Word',
    'xls': 'Excel', 'xlsx': 'Excel',
    'ppt': 'PowerPoint', 'pptx': 'PowerPoint',
    'jpg': 'Image', 'jpeg': 'Image', 'png': 'Image', 'gif': 'Image',
    'svg': 'Image', 'bmp': 'Image', 'webp': 'Image',
    'mp4': 'Vidéo', 'avi': 'Vidéo', 'mov': 'Vidéo', 'wmv': 'Vidéo',
    'flv': 'Vidéo', 'webm': 'Vidéo', 'mkv': 'Vidéo',
    'mp3': 'Audio', 'wav': 'Audio', 'flac': 'Audio', 'ogg': 'Audio',
    'aac': 'Audio', 'm4a': 'Audio',
    'zip': 'Archive', 'rar': 'Archive', '7z': 'Archive', 'tar': 'Archive', 'gz': 'Archive',
    'js': 'JavaScript', 'ts': 'TypeScript', 'html': 'HTML', 'css': 'CSS',
    'json': 'JSON', 'xml': 'XML', 'py': 'Python', 'php': 'PHP',
    'java': 'Java', 'cpp': 'C++', 'c': 'C', 'vue': 'Vue',
    'jsx': 'React', 'tsx': 'React',
    'txt': 'Texte', 'md': 'Markdown', 'readme': 'Readme'
  }

  return typeMap[ext] || (ext ? ext.toUpperCase() : 'Fichier')
})

const cleanFileName = computed(() => {
  let name = props.file.name || ''
  name = name.replace(/ - dossier$/i, '')
  name = name.replace(/ - fichier$/i, '')
  name = name.replace(/ - folder$/i, '')
  name = name.replace(/ - file$/i, '')
  return name
})

const getFileExtension = (filename) => {
  if (!filename) return ''
  const parts = filename.split('.')
  return parts.length > 1 ? parts.pop() : ''
}

const getAriaLabel = () => {
  const type = props.file.is_directory ? 'Dossier' : 'Fichier'
  const size = props.file.is_directory ? '' : `, taille ${formattedSize.value}`
  const date = formattedDate.value !== 'Date inconnue' ? `, modifié le ${formattedDate.value}` : ''
  const selectedText = props.selected ? ', sélectionné' : ''
  return `${type} ${props.file.name}${size}${date}${selectedText}`
}

// ============================================
// GESTIONNAIRES D'ÉVÉNEMENTS
// ============================================

const handleClick = (event) => {
  console.log('🖱️ Click sur:', props.file.name)
  emit('click', props.file, event)
}

const handleDoubleClick = (event) => {
  console.log('🖱️🖱️ Double-click sur:', props.file.name)
  emit('double-click', props.file, event)
}

const handleRightClick = (event) => {
  console.log('🖱️ Clic droit sur:', props.file.name)
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
/* Largeurs des colonnes */
.file-list-item td:nth-child(1) { width: 40%; min-width: 200px; }
.file-list-item td:nth-child(2) { width: 15%; min-width: 80px; }
.file-list-item td:nth-child(3) { width: 15%; min-width: 100px; }
.file-list-item td:nth-child(4) { width: 30%; min-width: 150px; }

.file-list-item td {
  display: table-cell;
  vertical-align: middle;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-list-item td:first-child > div {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  max-width: 100%;
}

.file-list-item {
  @apply cursor-pointer transition-colors duration-150;
}

.file-list-item:hover {
  @apply bg-base-200/50;
}

.file-list-item.selected {
  @apply bg-base-300 text-base-content;
}

.file-list-item i {
  @apply w-4 h-4 flex-shrink-0;
}

tr:focus {
  @apply outline-none ring-2 ring-primary ring-offset-1;
}

.file-list-item td:first-child .truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 768px) {
  .file-list-item td:nth-child(1) { width: 50%; min-width: 150px; }
  .file-list-item td:nth-child(2) { width: 20%; min-width: 60px; }
  .file-list-item td:nth-child(3) { display: none; }
  .file-list-item td:nth-child(4) { width: 30%; min-width: 100px; }
}

@media (prefers-reduced-motion: reduce) {
  .file-list-item { transition: none; }
}

@media (prefers-contrast: high) {
  .file-list-item:hover {
    background-color: hsl(var(--b2));
    border: 1px solid hsl(var(--bc) / 0.3);
  }
  .file-list-item.selected {
    background-color: hsl(var(--p) / 0.3);
    border: 2px solid hsl(var(--p));
  }
}
</style>