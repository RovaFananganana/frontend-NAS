<template>
  <div 
    v-if="hasSelection"
    class="selection-indicator bg-primary/10 border border-primary/20 rounded-lg p-3 mb-4"
  >
    <div class="flex items-center justify-between">
      <!-- Informations de sélection -->
      <div class="flex items-center space-x-3">
        <div class="flex items-center space-x-2">
          <div class="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
            <i class="fas fa-check text-white text-xs"></i>
          </div>
          <span class="font-medium text-primary">
            {{ selectedCount }} {{ selectedCount === 1 ? 'élément sélectionné' : 'éléments sélectionnés' }}
          </span>
        </div>
        
        <!-- Mode de sélection simplifié -->
        <div v-if="selectionMode !== 'single'" class="text-sm text-primary/70">
          <i class="fas fa-check-square mr-1"></i>
          Mode sélection
        </div>
      </div>
      
      <!-- Actions de sélection -->
      <div class="flex items-center space-x-2">
        <button
          @click="$emit('select-all')"
          class="btn btn-xs btn-outline btn-primary tooltip tooltip-bottom"
          data-tip="Tout sélectionner (Ctrl+A)"
        >
          <i class="fas fa-check-double mr-1"></i>
          Tout
        </button>
        
        <button
          @click="$emit('invert-selection')"
          class="btn btn-xs btn-outline btn-primary tooltip tooltip-bottom"
          data-tip="Inverser la sélection"
        >
          <i class="fas fa-exchange-alt mr-1"></i>
          Inverser
        </button>
        
        <button
          @click="$emit('clear-selection')"
          class="btn btn-xs btn-outline btn-error tooltip tooltip-bottom"
          data-tip="Désélectionner tout (Échap)"
        >
          <i class="fas fa-times mr-1"></i>
          Effacer
        </button>
      </div>
    </div>
    
    <!-- Barre de progression pour la sélection partielle -->
    <div v-if="showProgress && totalCount > 0" class="mt-2">
      <div class="flex items-center justify-between text-xs text-primary/70 mb-1">
        <span>Progression de sélection</span>
        <span>{{ Math.round((selectedCount / totalCount) * 100) }}%</span>
      </div>
      <div class="w-full bg-primary/20 rounded-full h-1.5">
        <div 
          class="bg-primary h-1.5 rounded-full transition-all duration-300"
          :style="{ width: `${(selectedCount / totalCount) * 100}%` }"
        ></div>
      </div>
    </div>
    
    <!-- Raccourcis clavier supprimés pour simplifier l'interface -->
  </div>
</template>

<script setup>
import { computed } from 'vue'

// Props
const props = defineProps({
  selectedCount: {
    type: Number,
    default: 0
  },
  totalCount: {
    type: Number,
    default: 0
  },
  selectionMode: {
    type: String,
    default: 'single',
    validator: (value) => ['single', 'multiple', 'range'].includes(value)
  },
  showProgress: {
    type: Boolean,
    default: false
  },
  showShortcuts: {
    type: Boolean,
    default: false
  }
})

// Émissions
defineEmits([
  'select-all',
  'invert-selection', 
  'clear-selection'
])

// Computed
const hasSelection = computed(() => props.selectedCount > 0)
</script>

<style scoped>
.selection-indicator {
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.kbd {
  background-color: hsl(var(--b3));
  border: 1px solid hsl(var(--bc) / 0.2);
  color: hsl(var(--bc));
  font-size: 0.75rem;
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace;
}

/* Animation pour la barre de progression */
.bg-primary {
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Responsive */
@media (max-width: 640px) {
  .selection-indicator .grid-cols-2 {
    grid-template-columns: 1fr;
  }
  
  .selection-indicator .flex {
    flex-wrap: wrap;
    gap: 0.5rem;
  }
}
</style>