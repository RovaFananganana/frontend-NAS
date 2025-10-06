<template>
  <div class="file-explorer-minimal">
    <h2>Explorateur de fichiers (version minimale)</h2>
    
    <!-- Test simple sans composants externes -->
    <div v-if="loading">Chargement...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else>
      <p>Chemin actuel: {{ currentPath }}</p>
      <p>Nombre de fichiers: {{ files.length }}</p>
      
      <!-- Liste simple des fichiers -->
      <ul>
        <li v-for="file in files" :key="file.path || file.name">
          {{ file.name }} {{ file.is_directory ? '(dossier)' : '(fichier)' }}
        </li>
      </ul>
    </div>
    
    <!-- Test modal simple -->
    <div v-if="showTestModal" class="modal modal-open">
      <div class="modal-box">
        <h3>Test Modal</h3>
        <p>Ceci est un test pour vérifier les erreurs DOM</p>
        <button @click="showTestModal = false" class="btn">Fermer</button>
      </div>
    </div>
    
    <button @click="showTestModal = true" class="btn btn-primary">Test Modal</button>
  </div>
</template>

<script setup>
import { ref } from 'vue'

// Props
const props = defineProps({
  initialPath: {
    type: String,
    default: '/'
  }
})

// État simple
const currentPath = ref(props.initialPath)
const files = ref([])
const loading = ref(false)
const error = ref('')
const showTestModal = ref(false)

// Test simple
files.value = [
  { name: 'test1.txt', path: '/test1.txt', is_directory: false },
  { name: 'dossier1', path: '/dossier1', is_directory: true }
]
</script>

<style scoped>
.file-explorer-minimal {
  padding: 1rem;
}

.error {
  color: red;
  padding: 1rem;
  background: #fee;
  border: 1px solid red;
  border-radius: 4px;
}
</style>