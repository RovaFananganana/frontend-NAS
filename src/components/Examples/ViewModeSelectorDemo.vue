<template>
  <div class="view-mode-selector-demo p-6 max-w-2xl mx-auto">
    <h2 class="text-2xl font-bold mb-6">Démonstration ViewModeSelector</h2>
    
    <!-- Composant principal -->
    <div class="mb-8">
      <h3 class="text-lg font-semibold mb-4">Sélecteur de Mode</h3>
      <ViewModeSelector 
        @mode-changed="handleModeChange"
        class="mb-4"
      />
      
      <div class="bg-base-200 rounded-lg p-4">
        <div class="text-sm">
          <strong>Mode actuel:</strong> {{ currentViewMode.label }}
        </div>
        <div class="text-sm mt-1">
          <strong>Icône:</strong> <i :class="currentViewMode.icon"></i> {{ currentViewMode.icon }}
        </div>
      </div>
    </div>
    
    <!-- Test des raccourcis -->
    <div class="mb-8">
      <h3 class="text-lg font-semibold mb-4">Raccourcis Clavier</h3>
      <div class="bg-info/10 border border-info/20 rounded-lg p-4">
        <div class="flex items-center gap-4 mb-2">
          <kbd class="kbd kbd-sm">Ctrl + 1</kbd>
          <span>Mode Arbre</span>
        </div>
        <div class="flex items-center gap-4">
          <kbd class="kbd kbd-sm">Ctrl + 2</kbd>
          <span>Mode Liste Détaillée</span>
        </div>
      </div>
    </div>
    
    <!-- Historique des changements -->
    <div class="mb-8">
      <h3 class="text-lg font-semibold mb-4">Historique des Changements</h3>
      <div class="bg-base-300 rounded-lg p-4 max-h-48 overflow-y-auto">
        <div v-if="changeHistory.length === 0" class="text-center text-base-content/50 py-4">
          Aucun changement enregistré
        </div>
        <div 
          v-for="(change, index) in changeHistory" 
          :key="index"
          class="mb-2 p-2 bg-base-100 rounded text-sm"
        >
          <div class="font-medium">
            {{ change.oldMode }} → {{ change.newMode }}
          </div>
          <div class="text-xs text-base-content/70">
            {{ formatTime(change.timestamp) }}
          </div>
        </div>
      </div>
      <button 
        @click="clearHistory"
        class="btn btn-sm btn-outline mt-2"
        :disabled="changeHistory.length === 0"
      >
        Vider l'historique
      </button>
    </div>
    
    <!-- Simulation de contenu selon le mode -->
    <div class="mb-8">
      <h3 class="text-lg font-semibold mb-4">Aperçu du Mode Actuel</h3>
      <div class="border border-base-300 rounded-lg p-4">
        <div v-if="currentMode === 'tree'" class="space-y-2">
          <div class="flex items-center text-sm">
            <i class="fas fa-hdd text-primary mr-2"></i>
            <span>NAS Root</span>
          </div>
          <div class="ml-4 space-y-1">
            <div class="flex items-center text-sm">
              <i class="fas fa-folder text-yellow-500 mr-2"></i>
              <span>Documents</span>
            </div>
            <div class="flex items-center text-sm">
              <i class="fas fa-folder text-yellow-500 mr-2"></i>
              <span>Photos</span>
            </div>
            <div class="flex items-center text-sm">
              <i class="fas fa-folder text-yellow-500 mr-2"></i>
              <span>Musique</span>
            </div>
          </div>
        </div>
        
        <div v-else-if="currentMode === 'detailed-list'" class="space-y-2">
          <div class="grid grid-cols-4 gap-4 text-sm font-semibold border-b border-base-300 pb-2">
            <div>Nom</div>
            <div>Taille</div>
            <div>Type</div>
            <div>Modifié</div>
          </div>
          <div class="grid grid-cols-4 gap-4 text-sm">
            <div class="flex items-center">
              <i class="fas fa-folder text-yellow-500 mr-2"></i>
              Documents
            </div>
            <div>-</div>
            <div>Dossier</div>
            <div>12/03/2024</div>
          </div>
          <div class="grid grid-cols-4 gap-4 text-sm">
            <div class="flex items-center">
              <i class="fas fa-file-pdf text-red-500 mr-2"></i>
              rapport.pdf
            </div>
            <div>2.1 MB</div>
            <div>PDF</div>
            <div>11/03/2024</div>
          </div>
          <div class="grid grid-cols-4 gap-4 text-sm">
            <div class="flex items-center">
              <i class="fas fa-image text-green-500 mr-2"></i>
              photo.jpg
            </div>
            <div>1.5 MB</div>
            <div>Image</div>
            <div>10/03/2024</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import ViewModeSelector from '../Shared/ViewModeSelector.vue'
import { useViewMode } from '@/composables/useViewMode.js'

// Composable pour l'état des modes
const {
  currentMode,
  currentViewMode
} = useViewMode()

// État local
const changeHistory = ref([])

// Gestionnaire d'événements
const handleModeChange = (event) => {
  changeHistory.value.unshift({
    oldMode: event.oldMode,
    newMode: event.newMode,
    timestamp: event.timestamp
  })
  
  // Limiter l'historique à 5 entrées
  if (changeHistory.value.length > 5) {
    changeHistory.value = changeHistory.value.slice(0, 5)
  }
}

// Utilitaires
const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString('fr-FR')
}

const clearHistory = () => {
  changeHistory.value = []
}
</script>

<style scoped>
.view-mode-selector-demo {
  font-family: system-ui, -apple-system, sans-serif;
}

.grid {
  align-items: center;
}

.kbd {
  font-family: ui-monospace, monospace;
}
</style>