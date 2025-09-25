<template>
  <div class="view-mode-selector-test p-6 max-w-4xl mx-auto">
    <h2 class="text-2xl font-bold mb-6">Test du ViewModeSelector</h2>
    
    <!-- Test du composant principal -->
    <div class="mb-8">
      <h3 class="text-lg font-semibold mb-4">Sélecteur de Mode Standard</h3>
      <ViewModeSelector 
        @mode-changed="handleModeChange"
      />
      <div class="mt-2 text-sm text-base-content/70">
        Mode actuel: <span class="font-medium">{{ currentViewMode.label }}</span>
      </div>
    </div>
    
    <!-- Test des différentes tailles -->
    <div class="mb-8">
      <h3 class="text-lg font-semibold mb-4">Différentes Tailles</h3>
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium mb-2">Extra Small (xs)</label>
          <ViewModeSelector size="xs" @mode-changed="handleModeChange" />
        </div>
        <div>
          <label class="block text-sm font-medium mb-2">Small (sm) - Défaut</label>
          <ViewModeSelector size="sm" @mode-changed="handleModeChange" />
        </div>
        <div>
          <label class="block text-sm font-medium mb-2">Medium (md)</label>
          <ViewModeSelector size="md" @mode-changed="handleModeChange" />
        </div>
        <div>
          <label class="block text-sm font-medium mb-2">Large (lg)</label>
          <ViewModeSelector size="lg" @mode-changed="handleModeChange" />
        </div>
      </div>
    </div>
    
    <!-- Test sans raccourcis -->
    <div class="mb-8">
      <h3 class="text-lg font-semibold mb-4">Sans Raccourcis Clavier</h3>
      <ViewModeSelector 
        :show-shortcuts="false"
        @mode-changed="handleModeChange"
      />
      <div class="mt-2 text-sm text-base-content/70">
        Les raccourcis Ctrl+1 et Ctrl+2 sont désactivés pour ce sélecteur
      </div>
    </div>
    
    <!-- Informations sur les raccourcis -->
    <div class="mb-8">
      <h3 class="text-lg font-semibold mb-4">Raccourcis Clavier Disponibles</h3>
      <div class="bg-base-200 rounded-lg p-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="flex items-center justify-between">
            <span>Mode Arbre</span>
            <kbd class="kbd kbd-sm">Ctrl + 1</kbd>
          </div>
          <div class="flex items-center justify-between">
            <span>Mode Liste Détaillée</span>
            <kbd class="kbd kbd-sm">Ctrl + 2</kbd>
          </div>
        </div>
        <div class="mt-4 text-sm text-base-content/70">
          Essayez les raccourcis clavier pour changer de mode rapidement !
        </div>
      </div>
    </div>
    
    <!-- Test de responsivité -->
    <div class="mb-8">
      <h3 class="text-lg font-semibold mb-4">Test de Responsivité</h3>
      <div class="border border-base-300 rounded-lg p-4">
        <div class="mb-4">
          <label class="block text-sm font-medium mb-2">Largeur simulée:</label>
          <input 
            type="range" 
            min="320" 
            max="1200" 
            v-model="simulatedWidth"
            class="range range-primary w-full"
          />
          <div class="text-sm text-center mt-1">{{ simulatedWidth }}px</div>
        </div>
        
        <div 
          :style="{ width: simulatedWidth + 'px' }"
          class="border border-dashed border-base-300 p-4 mx-auto"
        >
          <ViewModeSelector @mode-changed="handleModeChange" />
        </div>
      </div>
    </div>
    
    <!-- Journal des événements -->
    <div class="mb-8">
      <h3 class="text-lg font-semibold mb-4">Journal des Événements</h3>
      <div class="bg-base-300 rounded-lg p-4 max-h-64 overflow-y-auto">
        <div v-if="eventLog.length === 0" class="text-base-content/50 text-center py-4">
          Aucun événement enregistré
        </div>
        <div 
          v-for="(event, index) in eventLog" 
          :key="index"
          class="mb-2 p-2 bg-base-100 rounded text-sm"
        >
          <div class="font-medium">
            Changement de mode: {{ event.oldMode }} → {{ event.newMode }}
          </div>
          <div class="text-base-content/70 text-xs">
            {{ formatTimestamp(event.timestamp) }}
          </div>
        </div>
      </div>
      <button 
        @click="clearEventLog"
        class="btn btn-sm btn-outline mt-2"
      >
        Vider le journal
      </button>
    </div>
    
    <!-- État actuel du store -->
    <div class="mb-8">
      <h3 class="text-lg font-semibold mb-4">État Actuel du Store</h3>
      <div class="bg-base-300 rounded-lg p-4">
        <pre class="text-sm">{{ JSON.stringify(storeState, null, 2) }}</pre>
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
  sortColumn,
  sortDirection,
  selectedFiles,
  columnVisibility,
  currentViewMode,
  availableModes
} = useViewMode()

// État local pour les tests
const simulatedWidth = ref(800)
const eventLog = ref([])

// État du store pour debug
const storeState = computed(() => ({
  currentMode: currentMode.value,
  sortColumn: sortColumn.value,
  sortDirection: sortDirection.value,
  selectedFiles: selectedFiles.value,
  columnVisibility: columnVisibility.value
}))

// Gestionnaire d'événements
const handleModeChange = (event) => {
  eventLog.value.unshift(event)
  
  // Limiter le journal à 10 entrées
  if (eventLog.value.length > 10) {
    eventLog.value = eventLog.value.slice(0, 10)
  }
}

// Utilitaires
const formatTimestamp = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString('fr-FR')
}

const clearEventLog = () => {
  eventLog.value = []
}
</script>

<style scoped>
.view-mode-selector-test {
  font-family: system-ui, -apple-system, sans-serif;
}

pre {
  white-space: pre-wrap;
  word-wrap: break-word;
}

/* Styles pour la simulation de responsivité */
.range {
  background: hsl(var(--b3));
}

.range::-webkit-slider-thumb {
  background: hsl(var(--p));
}

.range::-moz-range-thumb {
  background: hsl(var(--p));
  border: none;
}
</style>