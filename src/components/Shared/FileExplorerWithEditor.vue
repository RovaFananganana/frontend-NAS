<template>
  <div class="file-explorer-with-editor">
    <!-- Original FileExplorer -->
    <FileExplorer
      v-bind="$attrs"
      @file-double-click="handleFileDoubleClick"
    />

    <!-- Text Editor Modal -->
    <TextEditorModal
      v-if="fileToEdit"
      :is-open="showTextEditor"
      :file="fileToEdit"
      :mode="textEditorMode"
      @close="closeTextEditor"
      @saved="handleTextEditorSaved"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useStore } from 'vuex'
import FileExplorer from './FileExplorer.vue'
import TextEditorModal from '@/components/FileViewer/TextEditorModal.vue'

const store = useStore()

// Text Editor State
const showTextEditor = ref(false)
const fileToEdit = ref(null)
const textEditorMode = ref('edit')

const handleFileDoubleClick = (event) => {
  const { file } = event
  
  // Check if it's a text file
  const textExtensions = ['.txt', '.md', '.json', '.xml', '.csv', '.log', '.ini', '.conf', '.yaml', '.yml']
  const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()
  
  if (textExtensions.includes(fileExtension)) {
    // Open with new editor system
    console.log('📝 Opening text file with new editor system:', file.path)
    fileToEdit.value = file
    textEditorMode.value = 'edit'
    showTextEditor.value = true
    event.stopPropagation()
    event.preventDefault()
  }
  // For other files, let FileExplorer handle it normally
}

const closeTextEditor = () => {
  showTextEditor.value = false
  fileToEdit.value = null
}

const handleTextEditorSaved = () => {
  store.dispatch('showSuccess', 'Fichier sauvegardé avec succès!')
}
</script>
