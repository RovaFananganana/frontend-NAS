<template>
  <div 
    :class="[
      'view-mode-selector view-mode-selector-enhanced bg-base-100 shadow-sm border border-base-300',
      {
        'rounded-lg p-1': !isMobile,
        'rounded-none p-2 border-x-0': isMobile,
        'touch-optimized': isTouch
      }
    ]"
    role="radiogroup"
    aria-label="Sélection du mode d'affichage"
  >
    <div :class="[
      'flex',
      {
        'gap-1': !isMobile,
        'gap-2 justify-center': isMobile
      }
    ]">
      <button 
        v-for="mode in availableModes"
        :key="mode.id"
        :class="[
          'mode-button btn transition-all focus-visible-only',
          {
            // Tailles selon l'appareil
            'btn-sm': !isTouch,
            'btn-md': isTouch && !isMobile,
            'btn-lg': isTouch && isMobile,
            
            // Effets selon l'appareil
            'hover:scale-105 hover:shadow-sm duration-200': !isMobile,
            'active:scale-95 duration-100': isMobile || isTouch,
            
            // États
            'btn-primary shadow-md': currentMode === mode.id,
            'btn-ghost hover:btn-outline': currentMode !== mode.id && !isMobile,
            'btn-outline': currentMode !== mode.id && isMobile,
            
            // Responsive
            'flex-1 max-w-[120px]': isMobile
          }
        ]"
        :style="{ 
          minHeight: isTouch ? touchSizes.minTouchTarget + 'px' : 'auto',
          minWidth: isTouch ? touchSizes.minTouchTarget + 'px' : 'auto'
        }"
        :title="isMobile ? mode.label : `Basculer vers ${mode.label} (${getShortcutForMode(mode.id)})`"
        :aria-pressed="currentMode === mode.id"
        :aria-label="`Mode d'affichage ${mode.label}${getShortcutForMode(mode.id) ? '. Raccourci: ' + getShortcutForMode(mode.id) : ''}`"
        role="radio"
        :aria-checked="currentMode === mode.id"
        @click="handleModeChange(mode.id)"
      >
        <i :class="[
          mode.icon,
          {
            'text-base': !isTouch,
            'text-lg': isTouch && !isMobile,
            'text-xl': isTouch && isMobile
          }
        ]"></i>
        <span :class="[
          'font-medium',
          {
            'hidden sm:inline ml-2': !isMobile,
            'ml-2': isMobile && !isTouch,
            'ml-1 text-sm': isMobile && isTouch
          }
        ]">{{ mode.label }}</span>
      </button>
    </div>
    
    <!-- Indicateur de raccourci clavier (affiché temporairement) -->
    <div 
      v-if="showShortcutHint"
      class="absolute top-full left-0 mt-1 px-2 py-1 bg-base-300 text-base-content text-xs rounded shadow-lg z-10 animate-fade-in-out"
    >
      {{ shortcutHintText }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useViewMode } from '@/composables/useViewMode.js'
import { useResponsive } from '@/composables/useResponsive.js'
import { VIEW_MODES } from '@/types/viewMode.js'

// Props
const props = defineProps({
  showShortcuts: {
    type: Boolean,
    default: true
  },
  size: {
    type: String,
    default: 'sm',
    validator: (value) => ['xs', 'sm', 'md', 'lg'].includes(value)
  }
})

// Émissions
const emit = defineEmits(['mode-changed'])

// Composables
const {
  currentMode,
  availableModes,
  setCurrentMode
} = useViewMode()

const {
  isMobile,
  isTouch,
  touchSizes
} = useResponsive()

// État local pour les hints de raccourcis
const showShortcutHint = ref(false)
const shortcutHintText = ref('')

// Mapping des raccourcis clavier
const keyboardShortcuts = {
  [VIEW_MODES.TREE]: 'Ctrl+1',
  [VIEW_MODES.DETAILED_LIST]: 'Ctrl+2'
}

// Computed pour obtenir le raccourci d'un mode
const getShortcutForMode = (modeId) => {
  return keyboardShortcuts[modeId] || ''
}

// Gestion du changement de mode
const handleModeChange = (modeId) => {
  const oldMode = currentMode.value
  setCurrentMode(modeId)
  
  // Émettre l'événement de changement
  emit('mode-changed', {
    oldMode,
    newMode: modeId,
    timestamp: Date.now()
  })
  
  // Afficher un hint temporaire
  showShortcutHint.value = true
  shortcutHintText.value = `Mode ${availableModes.value.find(m => m.id === modeId)?.label} activé`
  
  setTimeout(() => {
    showShortcutHint.value = false
  }, 1500)
}

// Gestion des raccourcis clavier
const handleKeydown = (event) => {
  if (!props.showShortcuts) return
  
  const { ctrlKey, key } = event
  
  if (ctrlKey) {
    switch (key) {
      case '1':
        event.preventDefault()
        handleModeChange(VIEW_MODES.TREE)
        break
      case '2':
        event.preventDefault()
        handleModeChange(VIEW_MODES.DETAILED_LIST)
        break
    }
  }
}

// Classes dynamiques pour la taille
const buttonSizeClass = computed(() => {
  const sizeMap = {
    xs: 'btn-xs',
    sm: 'btn-sm',
    md: 'btn-md',
    lg: 'btn-lg'
  }
  return sizeMap[props.size] || 'btn-sm'
})

// Lifecycle hooks
onMounted(() => {
  if (props.showShortcuts) {
    document.addEventListener('keydown', handleKeydown)
  }
})

onUnmounted(() => {
  if (props.showShortcuts) {
    document.removeEventListener('keydown', handleKeydown)
  }
})
</script>

<style scoped>
.view-mode-selector {
  position: relative;
  user-select: none;
}

/* Animation pour les hints de raccourcis */
@keyframes fade-in-out {
  0% { opacity: 0; transform: translateY(-5px); }
  20% { opacity: 1; transform: translateY(0); }
  80% { opacity: 1; transform: translateY(0); }
  100% { opacity: 0; transform: translateY(-5px); }
}

.animate-fade-in-out {
  animation: fade-in-out 1.5s ease-in-out;
}

/* Optimisations tactiles */
.touch-optimized {
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  user-select: none;
}

.touch-optimized .btn {
  touch-action: manipulation;
}

/* Responsive adaptations */
@media (max-width: 640px) {
  .view-mode-selector {
    width: 100%;
    border-radius: 0;
    border-left: none;
    border-right: none;
  }
  
  .view-mode-selector .flex {
    justify-content: center;
    gap: 0.75rem;
  }
  
  .view-mode-selector .btn {
    flex: 1;
    max-width: 140px;
    min-height: 48px; /* Touch target */
  }
}

@media (max-width: 480px) {
  .view-mode-selector .btn {
    max-width: 120px;
    padding: 0.75rem 1rem;
  }
  
  .view-mode-selector .btn span {
    font-size: 0.875rem;
  }
}

/* Améliorations pour les appareils tactiles */
@media (pointer: coarse) {
  .btn {
    min-height: 44px;
    min-width: 44px;
    padding: 0.75rem 1rem;
  }
  
  .btn i {
    font-size: 1.125rem;
  }
}

/* Amélioration de l'accessibilité */
.btn:focus {
  outline: 2px solid hsl(var(--p));
  outline-offset: 2px;
}

/* Hover effects élégants */
.btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.btn:active {
  transform: translateY(0);
}

/* Transition pour le mode actif */
.btn-primary {
  background: linear-gradient(135deg, hsl(var(--p)) 0%, hsl(var(--p)) 100%);
  border: none;
  color: hsl(var(--pc));
}

.btn-primary:hover {
  background: linear-gradient(135deg, hsl(var(--p)) 0%, hsl(var(--pf)) 100%);
}

/* Styles pour les icônes */
.btn i {
  transition: transform 0.2s ease;
}

.btn:hover i {
  transform: scale(1.1);
}

/* Indicateur de focus pour l'accessibilité */
@media (prefers-reduced-motion: no-preference) {
  .btn {
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .btn {
    transition: none;
  }
  
  .animate-fade-in-out {
    animation: none;
  }
}
</style>