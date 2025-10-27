<template>
  <div class="local-app-viewer flex-1 flex flex-col">
    <!-- Header with file info -->
    <div class="bg-base-200 p-4 border-b border-base-300">
      <div class="flex items-center space-x-3">
        <i :class="getFileIcon()" class="text-2xl text-primary"></i>
        <div>
          <h3 class="font-semibold">{{ filename }}</h3>
          <p class="text-sm text-base-content/70">
            Document Office - Ouverture dans l'application locale
          </p>
        </div>
      </div>
    </div>

    <!-- Main content -->
    <div class="flex-1 flex items-center justify-center p-8">
      <div class="text-center max-w-lg">
        <div class="text-6xl mb-6 text-primary">
          <i class="fas fa-external-link-alt"></i>
        </div>
        
        <h2 class="text-2xl font-bold mb-4">Document ouvert localement</h2>
        
        <p class="text-base-content/70 mb-6">
          Ce document a été ouvert dans votre application Office locale. 
          Toutes les modifications seront automatiquement sauvegardées sur le NAS.
        </p>

        <!-- SMB Path info -->
        <div class="bg-base-200 p-4 rounded-lg mb-6">
          <p class="text-sm font-medium mb-2">Chemin d'accès :</p>
          <code class="text-xs bg-base-300 px-2 py-1 rounded">{{ smbPath }}</code>
        </div>

        <!-- Action buttons -->
        <div class="space-y-3">
          <button 
            @click="openAgain" 
            class="btn btn-primary btn-wide"
          >
            <i class="fas fa-external-link-alt mr-2"></i>
            Ouvrir à nouveau
          </button>
          
          <button 
            @click="openInExplorer" 
            class="btn btn-outline btn-wide"
          >
            <i class="fas fa-folder-open mr-2"></i>
            Ouvrir le dossier
          </button>
        </div>

        <!-- Instructions -->
        <div class="mt-8 text-left bg-info/10 p-4 rounded-lg">
          <h4 class="font-semibold mb-2 flex items-center">
            <i class="fas fa-info-circle mr-2 text-info"></i>
            Instructions
          </h4>
          <ul class="text-sm space-y-1 text-base-content/80">
            <li>• Le document s'ouvre directement dans Office</li>
            <li>• Les modifications sont sauvegardées automatiquement</li>
            <li>• Fermez le document dans Office quand vous avez terminé</li>
            <li>• Les autres utilisateurs verront vos modifications en temps réel</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  filename: {
    type: String,
    required: true
  },
  smbPath: {
    type: String,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  metadata: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['close', 'error'])

const getFileIcon = () => {
  if (props.mimeType.includes('word')) {
    return 'fas fa-file-word text-blue-600'
  } else if (props.mimeType.includes('excel') || props.mimeType.includes('spreadsheet')) {
    return 'fas fa-file-excel text-green-600'
  } else if (props.mimeType.includes('powerpoint') || props.mimeType.includes('presentation')) {
    return 'fas fa-file-powerpoint text-orange-600'
  } else {
    return 'fas fa-file-alt text-gray-600'
  }
}

const openAgain = () => {
  try {
    // Try multiple methods to open the file
    window.open(props.smbPath, '_blank')
    
    // Also try protocol handlers
    if (props.mimeType.includes('word')) {
      window.location.href = `ms-word:ofe|u|${encodeURIComponent(props.smbPath)}`
    } else if (props.mimeType.includes('excel') || props.mimeType.includes('spreadsheet')) {
      window.location.href = `ms-excel:ofe|u|${encodeURIComponent(props.smbPath)}`
    } else if (props.mimeType.includes('powerpoint') || props.mimeType.includes('presentation')) {
      window.location.href = `ms-powerpoint:ofe|u|${encodeURIComponent(props.smbPath)}`
    }
  } catch (error) {
    console.error('Error opening document:', error)
    emit('error', error)
  }
}

const openInExplorer = () => {
  try {
    // Extract folder path from SMB path
    const folderPath = props.smbPath.substring(0, props.smbPath.lastIndexOf('/'))
    window.open(folderPath, '_blank')
  } catch (error) {
    console.error('Error opening folder:', error)
    emit('error', error)
  }
}
</script>

<style scoped>
.local-app-viewer {
  background: linear-gradient(135deg, hsl(var(--base-100)) 0%, hsl(var(--base-200)) 100%);
}

code {
  word-break: break-all;
}

.btn-wide {
  min-width: 200px;
}
</style>