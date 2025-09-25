<template>
  <div 
    v-if="show" 
    class="keyboard-shortcuts-help fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    role="dialog"
    aria-modal="true"
    aria-labelledby="shortcuts-title"
    aria-describedby="shortcuts-description"
    @click="$emit('close')"
    @keydown.escape="$emit('close')"
  >
    <div 
      class="bg-base-100 rounded-lg shadow-xl border border-base-300 p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto focus:outline-none"
      @click.stop
      tabindex="-1"
      ref="dialogContent"
    >
      <div class="flex items-center justify-between mb-4">
        <h3 id="shortcuts-title" class="text-lg font-semibold text-base-content">Raccourcis clavier</h3>
        <button 
          @click="$emit('close')"
          class="btn btn-sm btn-circle btn-ghost"
          aria-label="Fermer l'aide des raccourcis clavier"
          title="Fermer (Échap)"
        >
          <i class="fas fa-times" aria-hidden="true"></i>
        </button>
      </div>
      
      <p id="shortcuts-description" class="text-sm text-base-content/70 mb-4">
        Utilisez ces raccourcis clavier pour naviguer plus efficacement dans l'explorateur de fichiers.
      </p>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Tri -->
        <div class="space-y-3">
          <h4 class="font-medium text-base-content/80 border-b border-base-300 pb-1">
            <i class="fas fa-sort mr-2"></i>
            Tri
          </h4>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between items-center">
              <span class="text-base-content/70">Trier par nom</span>
              <div class="flex gap-1">
                <kbd class="kbd kbd-sm">Ctrl</kbd>
                <kbd class="kbd kbd-sm">Shift</kbd>
                <kbd class="kbd kbd-sm">N</kbd>
              </div>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-base-content/70">Trier par taille</span>
              <div class="flex gap-1">
                <kbd class="kbd kbd-sm">Ctrl</kbd>
                <kbd class="kbd kbd-sm">Shift</kbd>
                <kbd class="kbd kbd-sm">S</kbd>
              </div>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-base-content/70">Trier par type</span>
              <div class="flex gap-1">
                <kbd class="kbd kbd-sm">Ctrl</kbd>
                <kbd class="kbd kbd-sm">Shift</kbd>
                <kbd class="kbd kbd-sm">T</kbd>
              </div>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-base-content/70">Trier par date</span>
              <div class="flex gap-1">
                <kbd class="kbd kbd-sm">Ctrl</kbd>
                <kbd class="kbd kbd-sm">Shift</kbd>
                <kbd class="kbd kbd-sm">D</kbd>
              </div>
            </div>
          </div>
        </div>

        <!-- Navigation -->
        <div class="space-y-3">
          <h4 class="font-medium text-base-content/80 border-b border-base-300 pb-1">
            <i class="fas fa-arrows-alt mr-2"></i>
            Navigation
          </h4>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between items-center">
              <span class="text-base-content/70">Élément suivant</span>
              <kbd class="kbd kbd-sm">↓</kbd>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-base-content/70">Élément précédent</span>
              <kbd class="kbd kbd-sm">↑</kbd>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-base-content/70">Premier élément</span>
              <kbd class="kbd kbd-sm">Home</kbd>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-base-content/70">Dernier élément</span>
              <kbd class="kbd kbd-sm">End</kbd>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-base-content/70">Page suivante</span>
              <kbd class="kbd kbd-sm">Page↓</kbd>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-base-content/70">Page précédente</span>
              <kbd class="kbd kbd-sm">Page↑</kbd>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-base-content/70">Ouvrir sélection</span>
              <kbd class="kbd kbd-sm">Entrée</kbd>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-base-content/70">Dossier parent</span>
              <kbd class="kbd kbd-sm">Retour</kbd>
            </div>
          </div>
        </div>

        <!-- Sélection -->
        <div class="space-y-3">
          <h4 class="font-medium text-base-content/80 border-b border-base-300 pb-1">
            <i class="fas fa-check-square mr-2"></i>
            Sélection
          </h4>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between items-center">
              <span class="text-base-content/70">Tout sélectionner</span>
              <div class="flex gap-1">
                <kbd class="kbd kbd-sm">Ctrl</kbd>
                <kbd class="kbd kbd-sm">A</kbd>
              </div>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-base-content/70">Tout désélectionner</span>
              <div class="flex gap-1">
                <kbd class="kbd kbd-sm">Ctrl</kbd>
                <kbd class="kbd kbd-sm">D</kbd>
              </div>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-base-content/70">Basculer sélection</span>
              <kbd class="kbd kbd-sm">Espace</kbd>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-base-content/70">Étendre vers le haut</span>
              <div class="flex gap-1">
                <kbd class="kbd kbd-sm">Shift</kbd>
                <kbd class="kbd kbd-sm">↑</kbd>
              </div>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-base-content/70">Étendre vers le bas</span>
              <div class="flex gap-1">
                <kbd class="kbd kbd-sm">Shift</kbd>
                <kbd class="kbd kbd-sm">↓</kbd>
              </div>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-base-content/70">Sélection multiple</span>
              <div class="flex gap-1">
                <kbd class="kbd kbd-sm">Ctrl</kbd>
                <span class="text-xs">+ Clic</span>
              </div>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-base-content/70">Sélection par plage</span>
              <div class="flex gap-1">
                <kbd class="kbd kbd-sm">Shift</kbd>
                <span class="text-xs">+ Clic</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="space-y-3">
          <h4 class="font-medium text-base-content/80 border-b border-base-300 pb-1">
            <i class="fas fa-cogs mr-2"></i>
            Actions
          </h4>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between items-center">
              <span class="text-base-content/70">Actualiser</span>
              <kbd class="kbd kbd-sm">F5</kbd>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-base-content/70">Renommer</span>
              <kbd class="kbd kbd-sm">F2</kbd>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-base-content/70">Supprimer</span>
              <kbd class="kbd kbd-sm">Suppr</kbd>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-base-content/70">Copier</span>
              <div class="flex gap-1">
                <kbd class="kbd kbd-sm">Ctrl</kbd>
                <kbd class="kbd kbd-sm">C</kbd>
              </div>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-base-content/70">Coller</span>
              <div class="flex gap-1">
                <kbd class="kbd kbd-sm">Ctrl</kbd>
                <kbd class="kbd kbd-sm">V</kbd>
              </div>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-base-content/70">Couper</span>
              <div class="flex gap-1">
                <kbd class="kbd kbd-sm">Ctrl</kbd>
                <kbd class="kbd kbd-sm">X</kbd>
              </div>
            </div>
          </div>
        </div>

        <!-- Modes d'affichage -->
        <div class="space-y-3">
          <h4 class="font-medium text-base-content/80 border-b border-base-300 pb-1">
            <i class="fas fa-eye mr-2"></i>
            Modes d'affichage
          </h4>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between items-center">
              <span class="text-base-content/70">Mode arbre</span>
              <div class="flex gap-1">
                <kbd class="kbd kbd-sm">Ctrl</kbd>
                <kbd class="kbd kbd-sm">1</kbd>
              </div>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-base-content/70">Liste détaillée</span>
              <div class="flex gap-1">
                <kbd class="kbd kbd-sm">Ctrl</kbd>
                <kbd class="kbd kbd-sm">2</kbd>
              </div>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-base-content/70">Aide</span>
              <kbd class="kbd kbd-sm">F1</kbd>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-base-content/70">Aide alternative</span>
              <kbd class="kbd kbd-sm">?</kbd>
            </div>
          </div>
        </div>

        <!-- Recherche et navigation rapide -->
        <div class="space-y-3">
          <h4 class="font-medium text-base-content/80 border-b border-base-300 pb-1">
            <i class="fas fa-search mr-2"></i>
            Recherche et navigation
          </h4>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between items-center">
              <span class="text-base-content/70">Rechercher</span>
              <div class="flex gap-1">
                <kbd class="kbd kbd-sm">Ctrl</kbd>
                <kbd class="kbd kbd-sm">F</kbd>
              </div>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-base-content/70">Focus explorateur</span>
              <div class="flex gap-1">
                <kbd class="kbd kbd-sm">Ctrl</kbd>
                <kbd class="kbd kbd-sm">Shift</kbd>
                <kbd class="kbd kbd-sm">E</kbd>
              </div>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-base-content/70">Dossier parent (Alt)</span>
              <div class="flex gap-1">
                <kbd class="kbd kbd-sm">Alt</kbd>
                <kbd class="kbd kbd-sm">↑</kbd>
              </div>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-base-content/70">Annuler/Fermer</span>
              <kbd class="kbd kbd-sm">Échap</kbd>
            </div>
          </div>
        </div>
      </div>

      <div class="mt-6 pt-4 border-t border-base-300">
        <p class="text-xs text-base-content/60 text-center">
          Appuyez sur <kbd class="kbd kbd-xs">Échap</kbd> ou cliquez à l'extérieur pour fermer
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick, onMounted, onUnmounted } from 'vue'

// Props
const props = defineProps({
  show: {
    type: Boolean,
    default: false
  }
})

// Émissions
const emit = defineEmits(['close'])

// Refs
const dialogContent = ref(null)

// État pour la gestion du focus
let previousActiveElement = null

// Gestion du focus pour l'accessibilité
const manageFocus = async (show) => {
  if (show) {
    // Sauvegarder l'élément actif avant d'ouvrir le dialog
    previousActiveElement = document.activeElement
    
    // Attendre le prochain tick pour que le DOM soit mis à jour
    await nextTick()
    
    // Donner le focus au contenu du dialog
    if (dialogContent.value) {
      dialogContent.value.focus()
    }
  } else {
    // Restaurer le focus à l'élément précédent
    if (previousActiveElement && typeof previousActiveElement.focus === 'function') {
      previousActiveElement.focus()
    }
    previousActiveElement = null
  }
}

// Gestion des touches clavier pour l'accessibilité
const handleKeydown = (event) => {
  if (!props.show) return
  
  // Fermer avec Escape
  if (event.key === 'Escape') {
    event.preventDefault()
    emit('close')
    return
  }
  
  // Gestion du focus trap (Tab et Shift+Tab)
  if (event.key === 'Tab') {
    const focusableElements = dialogContent.value?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    
    if (focusableElements && focusableElements.length > 0) {
      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]
      
      if (event.shiftKey) {
        // Shift+Tab - aller vers l'élément précédent
        if (document.activeElement === firstElement) {
          event.preventDefault()
          lastElement.focus()
        }
      } else {
        // Tab - aller vers l'élément suivant
        if (document.activeElement === lastElement) {
          event.preventDefault()
          firstElement.focus()
        }
      }
    }
  }
}

// Watcher pour gérer le focus quand la prop show change
watch(() => props.show, manageFocus)

// Lifecycle hooks
onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  
  // Nettoyer la référence au focus précédent
  previousActiveElement = null
})
</script>

<style scoped>
/* Animation d'entrée */
.keyboard-shortcuts-help {
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.keyboard-shortcuts-help > div {
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Amélioration des kbd */
.kbd {
  font-family: 'Courier New', monospace;
  font-weight: 600;
}

/* Responsive */
@media (max-width: 768px) {
  .keyboard-shortcuts-help > div {
    margin: 1rem;
    max-height: 90vh;
  }
  
  .grid-cols-1.md\\:grid-cols-2 {
    grid-template-columns: 1fr;
  }
}
</style>