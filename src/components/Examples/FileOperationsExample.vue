<template>
  <div class="p-6 max-w-4xl mx-auto">
    <h2 class="text-2xl font-bold mb-6">File Operations Example</h2>
    
    <!-- Operation Status -->
    <div v-if="hasOperation" class="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <div class="flex items-center justify-between">
        <div>
          <span class="file-operation-indicator" :class="isCopyOperation ? 'copy' : 'cut'">
            <i :class="isCopyOperation ? 'fas fa-copy' : 'fas fa-cut'" class="mr-1"></i>
            {{ getOperationDescription() }}
          </span>
          <span class="text-sm text-gray-500 ml-2">{{ getOperationAge() }}</span>
        </div>
        <button @click="clear" class="btn-secondary text-sm">
          <i class="fas fa-times mr-1"></i>
          Annuler
        </button>
      </div>
    </div>

    <!-- Mock File List -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Source Folder -->
      <div class="border rounded-lg p-4">
        <h3 class="text-lg font-semibold mb-3 flex items-center">
          <i class="fas fa-folder text-blue-500 mr-2"></i>
          Dossier Source (/documents)
        </h3>
        <div class="space-y-2">
          <div 
            v-for="file in sourceFiles" 
            :key="file.path"
            class="flex items-center justify-between p-3 border rounded hover:bg-gray-50 file-operation-feedback"
            :class="getItemIndicatorClass(file)"
          >
            <div class="flex items-center">
              <i :class="file.type === 'folder' ? 'fas fa-folder text-blue-500' : 'fas fa-file text-gray-500'" class="mr-3"></i>
              <span>{{ file.name }}</span>
            </div>
            <div class="flex space-x-2">
              <button @click="copyFile(file)" class="text-blue-600 hover:text-blue-800" title="Copier">
                <i class="fas fa-copy"></i>
              </button>
              <button @click="cutFile(file)" class="text-orange-600 hover:text-orange-800" title="Couper">
                <i class="fas fa-cut"></i>
              </button>
            </div>
          </div>
        </div>
        
        <!-- Bulk Operations -->
        <div class="mt-4 pt-4 border-t">
          <div class="flex space-x-2">
            <button @click="copyAllFiles" class="btn-secondary text-sm">
              <i class="fas fa-copy mr-1"></i>
              Copier tout
            </button>
            <button @click="cutAllFiles" class="btn-secondary text-sm">
              <i class="fas fa-cut mr-1"></i>
              Couper tout
            </button>
          </div>
        </div>
      </div>

      <!-- Destination Folder -->
      <div class="border rounded-lg p-4">
        <h3 class="text-lg font-semibold mb-3 flex items-center">
          <i class="fas fa-folder text-green-500 mr-2"></i>
          Dossier Destination (/backup)
        </h3>
        
        <!-- Paste Button -->
        <div class="mb-4">
          <button 
            @click="pasteFiles"
            :disabled="!canPaste"
            :class="canPaste ? 'btn-primary' : 'btn-secondary opacity-50 cursor-not-allowed'"
            class="w-full"
          >
            <i class="fas fa-paste mr-2"></i>
            {{ canPaste ? 'Coller ici' : 'Aucune opération en attente' }}
          </button>
        </div>

        <!-- Destination Files -->
        <div class="space-y-2">
          <div 
            v-for="file in destinationFiles" 
            :key="file.path"
            class="flex items-center p-3 border rounded bg-gray-50"
          >
            <i :class="file.type === 'folder' ? 'fas fa-folder text-green-500' : 'fas fa-file text-gray-500'" class="mr-3"></i>
            <span>{{ file.name }}</span>
          </div>
          <div v-if="destinationFiles.length === 0" class="text-gray-500 text-center py-8">
            Dossier vide
          </div>
        </div>
      </div>
    </div>

    <!-- Debug Information -->
    <div class="mt-6 p-4 bg-gray-50 border rounded-lg">
      <h4 class="font-semibold mb-2">Debug Information</h4>
      <div class="text-sm space-y-1">
        <div><strong>Has Operation:</strong> {{ hasOperation }}</div>
        <div><strong>Operation Type:</strong> {{ isCopyOperation ? 'Copy' : isCutOperation ? 'Cut' : 'None' }}</div>
        <div><strong>Items Count:</strong> {{ operationCount }}</div>
        <div><strong>Source Folder:</strong> {{ sourceFolder || 'None' }}</div>
        <div><strong>Can Paste to Destination:</strong> {{ canPasteToDestination('/backup') }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useFileOperations } from '@/composables/useFileOperations.js'

// Mock data
const sourceFiles = ref([
  { name: 'document.pdf', path: '/documents/document.pdf', type: 'file' },
  { name: 'presentation.pptx', path: '/documents/presentation.pptx', type: 'file' },
  { name: 'images', path: '/documents/images', type: 'folder' },
  { name: 'report.docx', path: '/documents/report.docx', type: 'file' }
])

const destinationFiles = ref([
  { name: 'old_backup.zip', path: '/backup/old_backup.zip', type: 'file' }
])

// Use the composable
const {
  hasOperation,
  isCopyOperation,
  isCutOperation,
  operationCount,
  sourceFolder,
  copy,
  cut,
  paste,
  clear,
  getItemIndicatorClass,
  getOperationDescription,
  canPasteToDestination,
  getOperationAge
} = useFileOperations()

// Computed properties
const canPaste = computed(() => hasOperation.value && canPasteToDestination('/backup'))

// Methods
function copyFile(file) {
  copy([file], '/documents')
}

function cutFile(file) {
  cut([file], '/documents')
}

function copyAllFiles() {
  copy(sourceFiles.value, '/documents')
}

function cutAllFiles() {
  cut(sourceFiles.value, '/documents')
}

async function pasteFiles() {
  if (!canPaste.value) return
  
  try {
    const result = await paste('/backup')
    if (result.success) {
      // Simulate adding files to destination (in real app, this would refresh from server)
      console.log('Paste operation completed:', result)
    }
  } catch (error) {
    console.error('Paste failed:', error)
  }
}
</script>

<style scoped>
/* Component-specific styles if needed */
</style>