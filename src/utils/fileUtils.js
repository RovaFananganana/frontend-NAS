// utils/fileUtils.js

/**
 * Formate la taille des fichiers en unités lisibles (B, KB, MB, GB, TB)
 * @param {number} bytes - Taille en bytes
 * @param {number} decimals - Nombre de décimales (défaut: 2)
 * @returns {string} Taille formatée
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0 || bytes === null || bytes === undefined) return '0 B'
  if (typeof bytes !== 'number' || bytes < 0) return 'N/A'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  if (i >= sizes.length) return 'Très volumineux'
  
  const value = bytes / Math.pow(k, i)
  const decimals = i === 0 ? 0 : (value < 10 ? 2 : 1)
  
  return parseFloat(value.toFixed(decimals)) + ' ' + sizes[i]
}

// Alias pour compatibilité
export const formatBytes = formatFileSize

/**
 * Formate les dates avec localisation française
 * @param {string|Date} date - Date à formater
 * @param {string} format - Format de sortie ('full', 'short', 'relative')
 * @returns {string} Date formatée
 */
export const formatDate = (date, format = 'full') => {
  if (!date) return ''
  
  try {
    const dateObj = new Date(date)
    if (isNaN(dateObj.getTime())) return ''
    
    const now = new Date()
    const diffMs = now - dateObj
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    // Format relatif pour les dates récentes
    if (format === 'relative' || (format === 'full' && diffDays < 7)) {
      if (diffDays === 0) {
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
        const diffMinutes = Math.floor(diffMs / (1000 * 60))
        
        if (diffHours === 0) {
          if (diffMinutes < 1) return 'À l\'instant'
          if (diffMinutes === 1) return 'Il y a 1 minute'
          return `Il y a ${diffMinutes} minutes`
        }
        if (diffHours === 1) return 'Il y a 1 heure'
        return `Il y a ${diffHours} heures`
      }
      if (diffDays === 1) return 'Hier'
      if (diffDays < 7) return `Il y a ${diffDays} jours`
    }
    
    // Format court
    if (format === 'short') {
      return dateObj.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit'
      })
    }
    
    // Format complet
    return dateObj.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch (error) {
    console.warn('Error formatting date:', error)
    return ''
  }
}

/**
 * Détecte le type de fichier basé sur l'extension
 * @param {string} filename - Nom du fichier
 * @returns {object} Objet contenant le type, la catégorie et les métadonnées
 */
export const detectFileType = (filename) => {
  if (!filename) return { type: 'unknown', category: 'other', extension: '' }
  
  const extension = filename.split('.').pop()?.toLowerCase() || ''
  
  const typeMap = {
    // Documents
    'pdf': { type: 'pdf', category: 'document', label: 'Document PDF' },
    'doc': { type: 'word', category: 'document', label: 'Document Word' },
    'docx': { type: 'word', category: 'document', label: 'Document Word' },
    'odt': { type: 'word', category: 'document', label: 'Document OpenOffice' },
    'rtf': { type: 'word', category: 'document', label: 'Document RTF' },
    
    // Tableurs
    'xls': { type: 'excel', category: 'spreadsheet', label: 'Tableur Excel' },
    'xlsx': { type: 'excel', category: 'spreadsheet', label: 'Tableur Excel' },
    'ods': { type: 'excel', category: 'spreadsheet', label: 'Tableur OpenOffice' },
    'csv': { type: 'excel', category: 'spreadsheet', label: 'Fichier CSV' },
    
    // Présentations
    'ppt': { type: 'powerpoint', category: 'presentation', label: 'Présentation PowerPoint' },
    'pptx': { type: 'powerpoint', category: 'presentation', label: 'Présentation PowerPoint' },
    'odp': { type: 'powerpoint', category: 'presentation', label: 'Présentation OpenOffice' },
    
    // Images
    'jpg': { type: 'image', category: 'image', label: 'Image JPEG' },
    'jpeg': { type: 'image', category: 'image', label: 'Image JPEG' },
    'png': { type: 'image', category: 'image', label: 'Image PNG' },
    'gif': { type: 'image', category: 'image', label: 'Image GIF' },
    'svg': { type: 'image', category: 'image', label: 'Image SVG' },
    'bmp': { type: 'image', category: 'image', label: 'Image BMP' },
    'webp': { type: 'image', category: 'image', label: 'Image WebP' },
    'tiff': { type: 'image', category: 'image', label: 'Image TIFF' },
    'ico': { type: 'image', category: 'image', label: 'Icône' },
    
    // Vidéos
    'mp4': { type: 'video', category: 'video', label: 'Vidéo MP4' },
    'avi': { type: 'video', category: 'video', label: 'Vidéo AVI' },
    'mov': { type: 'video', category: 'video', label: 'Vidéo QuickTime' },
    'wmv': { type: 'video', category: 'video', label: 'Vidéo WMV' },
    'flv': { type: 'video', category: 'video', label: 'Vidéo Flash' },
    'webm': { type: 'video', category: 'video', label: 'Vidéo WebM' },
    'mkv': { type: 'video', category: 'video', label: 'Vidéo MKV' },
    'm4v': { type: 'video', category: 'video', label: 'Vidéo M4V' },
    
    // Audio
    'mp3': { type: 'audio', category: 'audio', label: 'Audio MP3' },
    'wav': { type: 'audio', category: 'audio', label: 'Audio WAV' },
    'flac': { type: 'audio', category: 'audio', label: 'Audio FLAC' },
    'ogg': { type: 'audio', category: 'audio', label: 'Audio OGG' },
    'aac': { type: 'audio', category: 'audio', label: 'Audio AAC' },
    'm4a': { type: 'audio', category: 'audio', label: 'Audio M4A' },
    'wma': { type: 'audio', category: 'audio', label: 'Audio WMA' },
    
    // Archives
    'zip': { type: 'archive', category: 'archive', label: 'Archive ZIP' },
    'rar': { type: 'archive', category: 'archive', label: 'Archive RAR' },
    '7z': { type: 'archive', category: 'archive', label: 'Archive 7-Zip' },
    'tar': { type: 'archive', category: 'archive', label: 'Archive TAR' },
    'gz': { type: 'archive', category: 'archive', label: 'Archive GZ' },
    'bz2': { type: 'archive', category: 'archive', label: 'Archive BZ2' },
    
    // Code
    'js': { type: 'code', category: 'code', label: 'JavaScript' },
    'ts': { type: 'code', category: 'code', label: 'TypeScript' },
    'html': { type: 'code', category: 'code', label: 'HTML' },
    'css': { type: 'code', category: 'code', label: 'CSS' },
    'scss': { type: 'code', category: 'code', label: 'SCSS' },
    'less': { type: 'code', category: 'code', label: 'LESS' },
    'json': { type: 'code', category: 'code', label: 'JSON' },
    'xml': { type: 'code', category: 'code', label: 'XML' },
    'py': { type: 'code', category: 'code', label: 'Python' },
    'php': { type: 'code', category: 'code', label: 'PHP' },
    'java': { type: 'code', category: 'code', label: 'Java' },
    'cpp': { type: 'code', category: 'code', label: 'C++' },
    'c': { type: 'code', category: 'code', label: 'C' },
    'cs': { type: 'code', category: 'code', label: 'C#' },
    'rb': { type: 'code', category: 'code', label: 'Ruby' },
    'go': { type: 'code', category: 'code', label: 'Go' },
    'rs': { type: 'code', category: 'code', label: 'Rust' },
    'vue': { type: 'code', category: 'code', label: 'Vue.js' },
    'jsx': { type: 'code', category: 'code', label: 'React JSX' },
    'tsx': { type: 'code', category: 'code', label: 'React TSX' },
    
    // Texte
    'txt': { type: 'text', category: 'text', label: 'Fichier texte' },
    'md': { type: 'text', category: 'text', label: 'Markdown' },
    'log': { type: 'text', category: 'text', label: 'Fichier log' },
    'ini': { type: 'text', category: 'text', label: 'Fichier INI' },
    'cfg': { type: 'text', category: 'text', label: 'Configuration' },
    'conf': { type: 'text', category: 'text', label: 'Configuration' },
    'yml': { type: 'text', category: 'text', label: 'YAML' },
    'yaml': { type: 'text', category: 'text', label: 'YAML' },
    
    // Exécutables
    'exe': { type: 'executable', category: 'executable', label: 'Exécutable Windows' },
    'msi': { type: 'executable', category: 'executable', label: 'Installateur Windows' },
    'deb': { type: 'executable', category: 'executable', label: 'Package Debian' },
    'rpm': { type: 'executable', category: 'executable', label: 'Package RPM' },
    'dmg': { type: 'executable', category: 'executable', label: 'Image disque macOS' },
    'app': { type: 'executable', category: 'executable', label: 'Application macOS' },
    
    // Polices
    'ttf': { type: 'font', category: 'font', label: 'Police TrueType' },
    'otf': { type: 'font', category: 'font', label: 'Police OpenType' },
    'woff': { type: 'font', category: 'font', label: 'Police Web' },
    'woff2': { type: 'font', category: 'font', label: 'Police Web 2' }
  }
  
  const fileInfo = typeMap[extension] || { type: 'unknown', category: 'other', label: 'Fichier' }
  
  return {
    ...fileInfo,
    extension: extension
  }
}

/**
 * Obtient l'icône et la couleur appropriées pour un fichier
 * @param {object} item - Objet fichier avec name, is_directory, etc.
 * @returns {object} Objet contenant icon, color, bgColor
 */
export const getFileIcon = (item) => {
  // Dossier
  if (item.is_directory || item.type === 'folder') {
    return {
      icon: 'fas fa-folder',
      color: 'text-blue-500',
      bgColor: 'from-blue-400 to-blue-600',
      textColor: 'text-white'
    }
  }

  const fileType = detectFileType(item.name)
  
  const iconMap = {
    // Documents
    'pdf': {
      icon: 'fas fa-file-pdf',
      color: 'text-red-500',
      bgColor: 'from-red-400 to-red-600',
      textColor: 'text-white'
    },
    'word': {
      icon: 'fas fa-file-word',
      color: 'text-blue-600',
      bgColor: 'from-blue-500 to-blue-700',
      textColor: 'text-white'
    },
    'excel': {
      icon: 'fas fa-file-excel',
      color: 'text-green-600',
      bgColor: 'from-green-500 to-green-700',
      textColor: 'text-white'
    },
    'powerpoint': {
      icon: 'fas fa-file-powerpoint',
      color: 'text-orange-600',
      bgColor: 'from-orange-500 to-orange-700',
      textColor: 'text-white'
    },
    
    // Médias
    'image': {
      icon: 'fas fa-file-image',
      color: 'text-purple-500',
      bgColor: 'from-purple-400 to-purple-600',
      textColor: 'text-white'
    },
    'video': {
      icon: 'fas fa-file-video',
      color: 'text-red-600',
      bgColor: 'from-red-500 to-red-700',
      textColor: 'text-white'
    },
    'audio': {
      icon: 'fas fa-file-audio',
      color: 'text-green-500',
      bgColor: 'from-green-400 to-green-600',
      textColor: 'text-white'
    },
    
    // Archives
    'archive': {
      icon: 'fas fa-file-archive',
      color: 'text-gray-600',
      bgColor: 'from-gray-500 to-gray-700',
      textColor: 'text-white'
    },
    
    // Code
    'code': {
      icon: 'fas fa-file-code',
      color: 'text-yellow-500',
      bgColor: 'from-yellow-400 to-yellow-600',
      textColor: 'text-gray-900'
    },
    
    // Texte
    'text': {
      icon: 'fas fa-file-alt',
      color: 'text-gray-500',
      bgColor: 'from-gray-400 to-gray-600',
      textColor: 'text-white'
    },
    
    // Exécutables
    'executable': {
      icon: 'fas fa-cog',
      color: 'text-indigo-600',
      bgColor: 'from-indigo-500 to-indigo-700',
      textColor: 'text-white'
    },
    
    // Polices
    'font': {
      icon: 'fas fa-font',
      color: 'text-pink-500',
      bgColor: 'from-pink-400 to-pink-600',
      textColor: 'text-white'
    }
  }

  return iconMap[fileType.type] || {
    icon: 'fas fa-file',
    color: 'text-gray-500',
    bgColor: 'from-gray-400 to-gray-600',
    textColor: 'text-white'
  }
}

/**
 * Obtient le type de fichier formaté pour l'affichage
 * @param {object} item - Objet fichier
 * @returns {string} Type formaté
 */
export const getFileType = (item) => {
  if (item.is_directory || item.type === 'folder') {
    return 'Dossier'
  }
  
  const fileType = detectFileType(item.name)
  return fileType.label
}

/**
 * Obtient le type MIME d'un fichier basé sur son extension
 * @param {string} filename - Nom du fichier
 * @returns {string} Type MIME
 */
export const getMimeType = (filename) => {
  const ext = filename.split('.').pop()?.toLowerCase()
  const mimeMap = {
    // Documents
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'odt': 'application/vnd.oasis.opendocument.text',
    'rtf': 'application/rtf',
    
    // Tableurs
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'ods': 'application/vnd.oasis.opendocument.spreadsheet',
    'csv': 'text/csv',
    
    // Présentations
    'ppt': 'application/vnd.ms-powerpoint',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'odp': 'application/vnd.oasis.opendocument.presentation',
    
    // Images
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'svg': 'image/svg+xml',
    'bmp': 'image/bmp',
    'webp': 'image/webp',
    'tiff': 'image/tiff',
    'ico': 'image/x-icon',
    
    // Vidéos
    'mp4': 'video/mp4',
    'avi': 'video/x-msvideo',
    'mov': 'video/quicktime',
    'wmv': 'video/x-ms-wmv',
    'flv': 'video/x-flv',
    'webm': 'video/webm',
    'mkv': 'video/x-matroska',
    'm4v': 'video/x-m4v',
    
    // Audio
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    'flac': 'audio/flac',
    'ogg': 'audio/ogg',
    'aac': 'audio/aac',
    'm4a': 'audio/mp4',
    'wma': 'audio/x-ms-wma',
    
    // Archives
    'zip': 'application/zip',
    'rar': 'application/vnd.rar',
    '7z': 'application/x-7z-compressed',
    'tar': 'application/x-tar',
    'gz': 'application/gzip',
    'bz2': 'application/x-bzip2',
    
    // Code et texte
    'txt': 'text/plain',
    'html': 'text/html',
    'css': 'text/css',
    'js': 'application/javascript',
    'ts': 'application/typescript',
    'json': 'application/json',
    'xml': 'application/xml',
    'md': 'text/markdown',
    'py': 'text/x-python',
    'php': 'application/x-httpd-php',
    'java': 'text/x-java-source',
    'cpp': 'text/x-c++src',
    'c': 'text/x-csrc',
    'cs': 'text/x-csharp',
    'rb': 'text/x-ruby',
    'go': 'text/x-go',
    'rs': 'text/x-rust',
    'vue': 'text/x-vue',
    'jsx': 'text/jsx',
    'tsx': 'text/tsx',
    'yml': 'application/x-yaml',
    'yaml': 'application/x-yaml',
    
    // Polices
    'ttf': 'font/ttf',
    'otf': 'font/otf',
    'woff': 'font/woff',
    'woff2': 'font/woff2'
  }
  
  return mimeMap[ext] || 'application/octet-stream'
}

/**
 * Vérifie si un fichier est une image
 * @param {string} filename - Nom du fichier
 * @returns {boolean}
 */
export const isImageFile = (filename) => {
  const ext = filename.split('.').pop()?.toLowerCase()
  return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'tiff', 'ico'].includes(ext)
}

/**
 * Vérifie si un fichier est une vidéo
 * @param {string} filename - Nom du fichier
 * @returns {boolean}
 */
export const isVideoFile = (filename) => {
  const ext = filename.split('.').pop()?.toLowerCase()
  return ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv', 'm4v'].includes(ext)
}

/**
 * Vérifie si un fichier est un fichier audio
 * @param {string} filename - Nom du fichier
 * @returns {boolean}
 */
export const isAudioFile = (filename) => {
  const ext = filename.split('.').pop()?.toLowerCase()
  return ['mp3', 'wav', 'flac', 'ogg', 'aac', 'm4a', 'wma'].includes(ext)
}

/**
 * Vérifie si un fichier est un fichier texte
 * @param {string} filename - Nom du fichier
 * @returns {boolean}
 */
export const isTextFile = (filename) => {
  const ext = filename.split('.').pop()?.toLowerCase()
  return ['txt', 'md', 'json', 'xml', 'html', 'css', 'js', 'ts', 'py', 'php', 'java', 'cpp', 'c', 'cs', 'rb', 'go', 'rs', 'vue', 'jsx', 'tsx', 'yml', 'yaml', 'log', 'ini', 'cfg', 'conf'].includes(ext)
}

/**
 * Vérifie si un fichier est un document
 * @param {string} filename - Nom du fichier
 * @returns {boolean}
 */
export const isDocumentFile = (filename) => {
  const ext = filename.split('.').pop()?.toLowerCase()
  return ['pdf', 'doc', 'docx', 'odt', 'rtf', 'xls', 'xlsx', 'ods', 'csv', 'ppt', 'pptx', 'odp'].includes(ext)
}

/**
 * Vérifie si un fichier est une archive
 * @param {string} filename - Nom du fichier
 * @returns {boolean}
 */
export const isArchiveFile = (filename) => {
  const ext = filename.split('.').pop()?.toLowerCase()
  return ['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].includes(ext)
}

/**
 * Vérifie si un fichier est un fichier de code
 * @param {string} filename - Nom du fichier
 * @returns {boolean}
 */
export const isCodeFile = (filename) => {
  const ext = filename.split('.').pop()?.toLowerCase()
  return ['js', 'ts', 'html', 'css', 'scss', 'less', 'json', 'xml', 'py', 'php', 'java', 'cpp', 'c', 'cs', 'rb', 'go', 'rs', 'vue', 'jsx', 'tsx'].includes(ext)
}

/**
 * Vérifie si un fichier est exécutable
 * @param {string} filename - Nom du fichier
 * @returns {boolean}
 */
export const isExecutableFile = (filename) => {
  const ext = filename.split('.').pop()?.toLowerCase()
  return ['exe', 'msi', 'deb', 'rpm', 'dmg', 'app'].includes(ext)
}

/**
 * Obtient une couleur de fond dégradée pour un type de fichier
 * @param {string} filename - Nom du fichier
 * @returns {string} Classes CSS pour le dégradé
 */
export const getFileIconBackground = (filename) => {
  const fileType = detectFileType(filename)
  const iconInfo = getFileIcon({ name: filename, is_directory: false })
  return iconInfo.bgColor
}

/**
 * Formate un nom de fichier pour l'affichage (tronque si trop long)
 * @param {string} filename - Nom du fichier
 * @param {number} maxLength - Longueur maximale (défaut: 30)
 * @returns {string} Nom formaté
 */
export const formatFileName = (filename, maxLength = 30) => {
  if (!filename || filename.length <= maxLength) return filename
  
  const extension = filename.split('.').pop()
  const nameWithoutExt = filename.substring(0, filename.lastIndexOf('.'))
  
  if (nameWithoutExt.length <= maxLength - extension.length - 4) {
    return filename
  }
  
  const truncatedName = nameWithoutExt.substring(0, maxLength - extension.length - 4)
  return `${truncatedName}...${extension}`
}

/**
 * Obtient une description courte du fichier
 * @param {object} item - Objet fichier
 * @returns {string} Description
 */
export const getFileDescription = (item) => {
  if (item.is_directory) return 'Dossier'
  
  const fileType = detectFileType(item.name)
  const size = item.size ? ` • ${formatFileSize(item.size)}` : ''
  
  return `${fileType.label}${size}`
}

/**
 * Trie un tableau de fichiers selon différents critères
 * @param {Array} files - Tableau de fichiers
 * @param {string} sortBy - Critère de tri ('name', 'size', 'type', 'modified')
 * @param {string} sortOrder - Ordre ('asc', 'desc')
 * @returns {Array} Tableau trié
 */
export const sortFiles = (files, sortBy = 'name', sortOrder = 'asc') => {
  const sorted = [...files].sort((a, b) => {
    // Les dossiers en premier
    if (a.is_directory && !b.is_directory) return -1
    if (!a.is_directory && b.is_directory) return 1
    
    let comparison = 0
    
    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name, 'fr', { numeric: true, sensitivity: 'base' })
        break
      case 'size':
        comparison = (a.size || 0) - (b.size || 0)
        break
      case 'type':
        const typeA = getFileType(a)
        const typeB = getFileType(b)
        comparison = typeA.localeCompare(typeB, 'fr')
        break
      case 'modified':
        const dateA = new Date(a.modified_time || 0)
        const dateB = new Date(b.modified_time || 0)
        comparison = dateA - dateB
        break
      default:
        comparison = a.name.localeCompare(b.name, 'fr', { numeric: true, sensitivity: 'base' })
    }
    
    return sortOrder === 'desc' ? -comparison : comparison
  })
  
  return sorted
}

/**
 * Filtre les fichiers selon un terme de recherche
 * @param {Array} files - Tableau de fichiers
 * @param {string} searchTerm - Terme de recherche
 * @returns {Array} Fichiers filtrés
 */
export const filterFiles = (files, searchTerm) => {
  if (!searchTerm) return files
  
  const term = searchTerm.toLowerCase()
  return files.filter(file => 
    file.name.toLowerCase().includes(term) ||
    getFileType(file).toLowerCase().includes(term)
  )
}

// Fonction de debounce
export const debounce = (func, wait) => {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// Export par défaut avec toutes les fonctions principales
export default {
  // Formatage
  formatFileSize,
  formatBytes,
  formatDate,
  formatFileName,
  
  // Détection de type
  detectFileType,
  getFileType,
  getFileIcon,
  getFileIconBackground,
  getFileDescription,
  getMimeType,
  
  // Vérifications de type
  isImageFile,
  isVideoFile,
  isAudioFile,
  isTextFile,
  isDocumentFile,
  isArchiveFile,
  isCodeFile,
  isExecutableFile,
  
  // Utilitaires
  sortFiles,
  filterFiles,
  debounce
}