<template>
  <div class="mobile-demo p-4">
    <h2 class="text-2xl font-bold mb-6">Démonstration des adaptations mobiles</h2>
    
    <!-- Informations sur l'appareil -->
    <div class="device-info mb-6 p-4 bg-base-200 rounded-lg">
      <h3 class="text-lg font-semibold mb-3">Informations de l'appareil</h3>
      <div class="grid grid-cols-2 gap-4 text-sm">
        <div>
          <strong>Largeur d'écran:</strong> {{ screenWidth }}px
        </div>
        <div>
          <strong>Hauteur d'écran:</strong> {{ screenHeight }}px
        </div>
        <div>
          <strong>Type d'appareil:</strong> 
          <span :class="deviceTypeClass">{{ deviceType }}</span>
        </div>
        <div>
          <strong>Tactile:</strong> 
          <span :class="isTouch ? 'text-success' : 'text-warning'">
            {{ isTouch ? 'Oui' : 'Non' }}
          </span>
        </div>
      </div>
    </div>

    <!-- Colonnes visibles -->
    <div class="columns-demo mb-6 p-4 bg-base-200 rounded-lg">
      <h3 class="text-lg font-semibold mb-3">Colonnes visibles selon la taille d'écran</h3>
      <div class="grid grid-cols-4 gap-2 text-sm">
        <div v-for="(visible, column) in visibleColumns" :key="column" 
             :class="['p-2 rounded text-center', visible ? 'bg-success text-success-content' : 'bg-error text-error-content']">
          {{ column }}: {{ visible ? 'Visible' : 'Masquée' }}
        </div>
      </div>
    </div>

    <!-- Tailles tactiles -->
    <div class="touch-sizes mb-6 p-4 bg-base-200 rounded-lg">
      <h3 class="text-lg font-semibold mb-3">Tailles tactiles recommandées</h3>
      <div class="grid grid-cols-2 gap-4 text-sm">
        <div>
          <strong>Zone de touch minimale:</strong> {{ touchSizes.minTouchTarget }}px
        </div>
        <div>
          <strong>Hauteur de bouton:</strong> {{ touchSizes.buttonHeight }}px
        </div>
        <div>
          <strong>Taille d'icône:</strong> {{ touchSizes.iconSize }}px
        </div>
        <div>
          <strong>Espacement:</strong> {{ touchSizes.spacing }}px
        </div>
      </div>
    </div>

    <!-- Démonstration du formatage adaptatif -->
    <div class="formatting-demo mb-6 p-4 bg-base-200 rounded-lg">
      <h3 class="text-lg font-semibold mb-3">Formatage adaptatif</h3>
      <div class="space-y-2 text-sm">
        <div>
          <strong>Date ({{ new Date().toISOString() }}):</strong> 
          {{ formattedDate }}
        </div>
        <div>
          <strong>Taille (1536 bytes):</strong> 
          {{ formattedSize }}
        </div>
      </div>
    </div>

    <!-- Boutons de test tactile -->
    <div class="touch-test mb-6 p-4 bg-base-200 rounded-lg">
      <h3 class="text-lg font-semibold mb-3">Test des zones tactiles</h3>
      <div class="flex flex-wrap gap-2">
        <button 
          v-for="size in ['btn-xs', 'btn-sm', 'btn-md', 'btn-lg']" 
          :key="size"
          :class="['btn', size, isTouch ? 'btn-primary' : 'btn-secondary']"
          @click="handleButtonClick(size)"
        >
          {{ size }}
        </button>
      </div>
      <div v-if="lastClicked" class="mt-2 text-sm">
        Dernier bouton cliqué: <strong>{{ lastClicked }}</strong>
      </div>
    </div>

    <!-- Démonstration des gestes -->
    <div 
      ref="gestureArea"
      class="gesture-demo p-4 bg-base-200 rounded-lg border-2 border-dashed border-base-300"
      @touchstart="handleTouchStart"
      @touchmove="handleTouchMove"
      @touchend="handleTouchEnd"
    >
      <h3 class="text-lg font-semibold mb-3">Zone de test des gestes</h3>
      <p class="text-sm mb-4">
        {{ isTouch ? 'Essayez de faire des gestes de swipe dans cette zone' : 'Cette zone est optimisée pour les gestes tactiles' }}
      </p>
      
      <div v-if="gestureInfo.active" class="gesture-info text-sm">
        <div><strong>Geste actif:</strong> {{ gestureInfo.type }}</div>
        <div v-if="gestureInfo.direction"><strong>Direction:</strong> {{ gestureInfo.direction }}</div>
        <div v-if="gestureInfo.distance"><strong>Distance:</strong> {{ Math.round(gestureInfo.distance) }}px</div>
      </div>
      
      <div v-if="lastGesture" class="last-gesture mt-2 text-sm">
        <strong>Dernier geste:</strong> {{ lastGesture.type }} {{ lastGesture.direction }} 
        ({{ Math.round(lastGesture.distance) }}px en {{ lastGesture.duration }}ms)
      </div>
    </div>

    <!-- FileExplorer avec données de test -->
    <div class="file-explorer-demo mt-6">
      <h3 class="text-lg font-semibold mb-3">Explorateur de fichiers adaptatif</h3>
      <FileExplorer 
        :initial-path="'/demo'"
        :auto-load="false"
        @mode-changed="handleModeChanged"
        @file-selected="handleFileSelected"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useResponsive } from '@/composables/useResponsive.js'
import { formatDateForScreen, formatSizeForScreen } from '@/utils/mobileUtils.js'
import FileExplorer from '@/components/Shared/FileExplorer.vue'

// Composable responsive
const {
  screenWidth,
  screenHeight,
  isMobile,
  isTablet,
  isDesktop,
  isTouch,
  visibleColumns,
  touchSizes
} = useResponsive()

// État local
const lastClicked = ref('')
const gestureArea = ref(null)
const gestureInfo = ref({
  active: false,
  type: '',
  direction: '',
  distance: 0
})
const lastGesture = ref(null)

// Variables pour le tracking des gestes
let touchStartX = 0
let touchStartY = 0
let touchStartTime = 0

// Computed
const deviceType = computed(() => {
  if (isMobile.value) return 'Mobile'
  if (isTablet.value) return 'Tablette'
  if (isDesktop.value) return 'Desktop'
  return 'Inconnu'
})

const deviceTypeClass = computed(() => {
  if (isMobile.value) return 'text-primary'
  if (isTablet.value) return 'text-secondary'
  if (isDesktop.value) return 'text-accent'
  return 'text-base-content'
})

const formattedDate = computed(() => {
  return formatDateForScreen(new Date().toISOString(), screenWidth.value)
})

const formattedSize = computed(() => {
  return formatSizeForScreen(1536, screenWidth.value)
})

// Gestionnaires d'événements
const handleButtonClick = (size) => {
  lastClicked.value = size
  console.log('Button clicked:', size)
}

const handleModeChanged = (event) => {
  console.log('Mode changed:', event)
}

const handleFileSelected = (event) => {
  console.log('File selected:', event)
}

// Gestion des gestes tactiles
const handleTouchStart = (event) => {
  if (event.touches.length === 1) {
    const touch = event.touches[0]
    touchStartX = touch.clientX
    touchStartY = touch.clientY
    touchStartTime = Date.now()
    
    gestureInfo.value = {
      active: true,
      type: 'touch',
      direction: '',
      distance: 0
    }
  }
}

const handleTouchMove = (event) => {
  if (event.touches.length === 1 && gestureInfo.value.active) {
    event.preventDefault()
    
    const touch = event.touches[0]
    const deltaX = touch.clientX - touchStartX
    const deltaY = touch.clientY - touchStartY
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
    
    let direction = ''
    if (distance > 20) {
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        direction = deltaX > 0 ? 'droite' : 'gauche'
      } else {
        direction = deltaY > 0 ? 'bas' : 'haut'
      }
    }
    
    gestureInfo.value = {
      active: true,
      type: 'swipe',
      direction,
      distance
    }
  }
}

const handleTouchEnd = (event) => {
  if (gestureInfo.value.active) {
    const duration = Date.now() - touchStartTime
    
    if (gestureInfo.value.type === 'swipe' && gestureInfo.value.distance > 50) {
      lastGesture.value = {
        type: 'swipe',
        direction: gestureInfo.value.direction,
        distance: gestureInfo.value.distance,
        duration
      }
    }
    
    gestureInfo.value = {
      active: false,
      type: '',
      direction: '',
      distance: 0
    }
  }
}

// Lifecycle
onMounted(() => {
  console.log('MobileAdaptationDemo mounted')
})

onUnmounted(() => {
  console.log('MobileAdaptationDemo unmounted')
})
</script>

<style scoped>
.mobile-demo {
  max-width: 100%;
  margin: 0 auto;
}

.gesture-demo {
  min-height: 150px;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
}

.gesture-demo:active {
  background-color: hsl(var(--b3));
}

/* Responsive adaptations */
@media (max-width: 768px) {
  .mobile-demo {
    padding: 1rem;
  }
  
  .grid-cols-4 {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .grid-cols-2 {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .mobile-demo {
    padding: 0.5rem;
  }
  
  .text-2xl {
    font-size: 1.5rem;
  }
  
  .text-lg {
    font-size: 1.125rem;
  }
}

/* Animations pour les gestes */
@keyframes gesture-feedback {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

.gesture-demo.active {
  animation: gesture-feedback 0.2s ease-out;
}
</style>