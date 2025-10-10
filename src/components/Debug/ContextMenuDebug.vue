<template>
  <div class="card bg-base-100 shadow-xl">
    <div class="card-body">
      <h2 class="card-title text-info">
        <i class="fas fa-mouse-pointer"></i>
        Debug Menu Contextuel
      </h2>
      
      <div class="space-y-4">
        <!-- Zone de test -->
        <div class="alert alert-info">
          <div>
            <h3 class="font-bold">Zone de test</h3>
            <div class="text-sm">
              Faites un clic droit dans la zone ci-dessous pour tester le menu contextuel
            </div>
          </div>
        </div>

        <!-- Zone de test du menu contextuel -->
        <div 
          class="bg-base-200 p-8 rounded-lg border-2 border-dashed border-base-300 text-center cursor-pointer"
          @contextmenu="showTestContextMenu"
        >
          <i class="fas fa-mouse-pointer text-4xl text-base-content/40 mb-2"></i>
          <p class="text-base-content/60">Clic droit ici pour tester le menu</p>
        </div>

        <!-- État du menu -->
        <div>
          <h3 class="font-bold mb-2">État du menu</h3>
          <div class="bg-base-300 p-3 rounded">
            <div class="text-sm space-y-1">
              <div><strong>Menu visible:</strong> {{ contextMenu.show ? 'Oui' : 'Non' }}</div>
              <div><strong>Position:</strong> x={{ contextMenu.x }}, y={{ contextMenu.y }}</div>
              <div><strong>Mode d'affichage actuel:</strong> {{ currentViewMode }}</div>
              <div><strong>Sous-menu visible:</strong> {{ showViewModeSubmenu ? 'Oui' : 'Non' }}</div>
            </div>
          </div>
        </div>

        <!-- Actions de test -->
        <div class="divider">Actions de test</div>
        <div class="flex gap-2">
          <button @click="testViewModeChange('DETAILED_LIST')" class="btn btn-sm btn-primary">
            <i class="fas fa-list"></i>
            Test Liste
          </button>
          <button @click="testViewModeChange('TREE')" class="btn btn-sm btn-success">
            <i class="fas fa-sitemap"></i>
            Test Arbre
          </button>
          <button @click="testViewModeChange('MOSAIC')" class="btn btn-sm btn-warning">
            <i class="fas fa-th"></i>
            Test Mosaïque
          </button>
        </div>
      </div>
    </div>

    <!-- Menu contextuel de test -->
    <ContextMenu 
      v-if="contextMenu.show" 
      :show="contextMenu.show" 
      :x="contextMenu.x" 
      :y="contextMenu.y"
      :item="null"
      :permissions="{ can_read: true, can_write: true, can_delete: true }"
      :current-view-mode="currentViewMode"
      @view-mode-changed="handleViewModeChange"
      @create-folder="handleCreateFolder"
      @create-file="handleCreateFile"
    />
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import ContextMenu from '@/components/Shared/ContextMenu.vue'

// État local
const contextMenu = ref({
  show: false,
  x: 0,
  y: 0
})

const currentViewMode = ref('DETAILED_LIST')
const showViewModeSubmenu = ref(false)

// Méthodes
const showTestContextMenu = (event) => {
  event.preventDefault()
  
  contextMenu.value = {
    show: true,
    x: event.clientX,
    y: event.clientY
  }
  
  console.log('🎯 Context menu shown at:', event.clientX, event.clientY)
  
  // Fermer le menu quand on clique ailleurs
  nextTick(() => {
    const hideMenu = () => {
      contextMenu.value.show = false
      document.removeEventListener('click', hideMenu)
    }
    document.addEventListener('click', hideMenu)
  })
}

const handleViewModeChange = (mode) => {
  console.log('🔄 View mode changed to:', mode)
  currentViewMode.value = mode
  contextMenu.value.show = false
}

const testViewModeChange = (mode) => {
  console.log('🧪 Test view mode change to:', mode)
  currentViewMode.value = mode
}

const handleCreateFolder = () => {
  console.log('📁 Create folder clicked')
  contextMenu.value.show = false
}

const handleCreateFile = () => {
  console.log('📄 Create file clicked')
  contextMenu.value.show = false
}
</script>