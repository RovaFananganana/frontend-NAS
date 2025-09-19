// utils/fileUtils.js
export const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export const getFileIcon = (item) => {
  if (item.type === 'folder') {
    return 'fas fa-folder text-blue-500'
  }

  const ext = item.extension?.toLowerCase()
  const iconMap = {
    'pdf': 'fas fa-file-pdf text-red-500',
    'doc': 'fas fa-file-word text-blue-600',
    'docx': 'fas fa-file-word text-blue-600',
    'xls': 'fas fa-file-excel text-green-600',
    'xlsx': 'fas fa-file-excel text-green-600',
    'ppt': 'fas fa-file-powerpoint text-orange-600',
    'pptx': 'fas fa-file-powerpoint text-orange-600',
    'jpg': 'fas fa-file-image text-purple-500',
    'jpeg': 'fas fa-file-image text-purple-500',
    'png': 'fas fa-file-image text-purple-500',
    'gif': 'fas fa-file-image text-purple-500',
    'svg': 'fas fa-file-image text-purple-500',
    'mp4': 'fas fa-file-video text-red-600',
    'avi': 'fas fa-file-video text-red-600',
    'mov': 'fas fa-file-video text-red-600',
    'mp3': 'fas fa-file-audio text-green-500',
    'wav': 'fas fa-file-audio text-green-500',
    'zip': 'fas fa-file-archive text-gray-600',
    'rar': 'fas fa-file-archive text-gray-600',
    '7z': 'fas fa-file-archive text-gray-600',
    'txt': 'fas fa-file-alt text-gray-500',
    'md': 'fas fa-file-alt text-gray-500',
    'js': 'fas fa-file-code text-yellow-500',
    'ts': 'fas fa-file-code text-blue-500',
    'html': 'fas fa-file-code text-orange-500',
    'css': 'fas fa-file-code text-blue-400',
    'json': 'fas fa-file-code text-green-500',
    'xml': 'fas fa-file-code text-orange-400',
    'py': 'fas fa-file-code text-yellow-600',
    'php': 'fas fa-file-code text-purple-600',
    'java': 'fas fa-file-code text-red-600',
    'cpp': 'fas fa-file-code text-blue-700',
    'c': 'fas fa-file-code text-blue-700'
  }

  return iconMap[ext] || 'fas fa-file text-gray-500'
}

export const getMimeType = (filename) => {
  const ext = filename.split('.').pop()?.toLowerCase()
  const mimeMap = {
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'ppt': 'application/vnd.ms-powerpoint',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'svg': 'image/svg+xml',
    'mp4': 'video/mp4',
    'avi': 'video/avi',
    'mov': 'video/quicktime',
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    'zip': 'application/zip',
    'rar': 'application/x-rar-compressed',
    'txt': 'text/plain',
    'html': 'text/html',
    'css': 'text/css',
    'js': 'application/javascript',
    'json': 'application/json'
  }
  
  return mimeMap[ext] || 'application/octet-stream'
}

export const isImageFile = (filename) => {
  const ext = filename.split('.').pop()?.toLowerCase()
  return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(ext)
}

export const isVideoFile = (filename) => {
  const ext = filename.split('.').pop()?.toLowerCase()
  return ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'].includes(ext)
}

export const isAudioFile = (filename) => {
  const ext = filename.split('.').pop()?.toLowerCase()
  return ['mp3', 'wav', 'flac', 'ogg', 'aac', 'm4a'].includes(ext)
}

export const isTextFile = (filename) => {
  const ext = filename.split('.').pop()?.toLowerCase()
  return ['txt', 'md', 'json', 'xml', 'html', 'css', 'js', 'py', 'php', 'java', 'cpp', 'c'].includes(ext)
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