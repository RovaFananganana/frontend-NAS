<template>
  <div :class="[
    'favorites-panel flex flex-col',
    compact ? 'bg-transparent' : 'bg-base-100 border-r border-base-300 h-full'
  ]">
    <!-- En-tête du panneau -->
    <div v-if="!compact" class="favorites-header p-4 border-b border-base-300">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold text-base-content flex items-center gap-2">
          <i class="fas fa-star text-warning" aria-hidden="true"></i>
          Favoris
        </h3>
        <div class="flex items-center gap-1">
          <button @click="showImportExport = !showImportExport" class="btn btn-xs btn-ghost tooltip tooltip-bottom"
            data-tip="Import/Export"
            :aria-label="showImportExport ? 'Masquer import/export' : 'Afficher import/export'">
            <i class="fas fa-cog" aria-hidden="true"></i>
          </button>
          <button @click="refresh" class="btn btn-xs btn-ghost tooltip tooltip-bottom" data-tip="Actualiser"
            aria-label="Actualiser les favoris">
            <i class="fas fa-redo" :class="{ 'animate-spin': refreshing }" aria-hidden="true"></i>
          </button>
        </div>
      </div>

      <!-- Panneau d'import/export -->
      <div v-if="showImportExport" class="mt-3 p-3 bg-base-200 rounded-lg">
        <div class="flex gap-2 mb-2">
          <button @click="exportFavorites" class="btn btn-xs btn-outline flex-1"
            :disabled="!favorites || favorites.length === 0">
            <i class="fas fa-download mr-1" aria-hidden="true"></i>
            Exporter
          </button>
          <label class="btn btn-xs btn-outline flex-1 cursor-pointer">
            <i class="fas fa-upload mr-1" aria-hidden="true"></i>
            Importer
            <input ref="importInput" type="file" accept=".json" class="hidden" @change="importFavorites" />
          </label>
        </div>
        <button v-if="favorites && favorites.length > 0" @click="confirmClearAll"
          class="btn btn-xs btn-error btn-outline w-full">
          <i class="fas fa-trash mr-1" aria-hidden="true"></i>
          Tout supprimer
        </button>
      </div>
    </div>

    <!-- Liste des favoris -->
    <div :class="[
      'favorites-content flex-1 overflow-y-auto',
      compact ? 'max-h-48' : ''
    ]">
      <!-- État vide -->
      <div v-if="!favorites || favorites.length === 0" :class="[
        'empty-state text-center text-base-content/60',
        compact ? 'p-2' : 'p-4'
      ]">
        <!-- Debug info -->
        <div v-if="compact" class="text-xs text-red-500 mb-2">
          Debug: {{ favorites?.length || 0 }} favoris
        </div>
        <i :class="[
          'fas fa-star mb-3 opacity-30',
          compact ? 'text-2xl' : 'text-4xl'
        ]" aria-hidden="true"></i>
        <p :class="compact ? 'text-xs mb-1' : 'text-sm mb-2'">Aucun favori</p>
        <p class="text-xs" v-if="!compact">
          Clic droit sur un dossier pour l'ajouter aux favoris
        </p>
      </div>

      <!-- Liste des favoris -->
      <ul v-else :class="[
        'favorites-list space-y-1',
        compact ? 'p-0' : 'p-2'
      ]" role="list">
        <li v-for="favorite in (favorites || [])" :key="favorite.item_path" class="favorite-item group ml-4" role="listitem"
          @contextmenu="showFavoriteContextMenu($event, favorite)">
          <!-- Style harmonisé avec les éléments de navigation de la sidebar -->
          <div class="flex items-center">
            <button @click="navigateToFavorite(favorite)" :class="[
              'favorite-button flex-1 flex items-center text-left rounded-lg transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset',
              compact ? 'gap-2 px-3 py-2' : 'gap-3 px-3 py-2',
              // Style actif unifié avec les éléments de navigation
              props.isFavoriteSelected(favorite.item_path) ? '!bg-primary !text-primary-content' : 'hover:bg-base-300'
            ]" :title="`Naviguer vers ${favorite.item_path}`"
              :aria-label="`Naviguer vers le dossier favori ${favorite.item_name}`">
              <i class="fas fa-folder w-5" aria-hidden="true"></i>
              <span :class="[
                'truncate',
                compact ? 'text-xs' : 'text-sm'
              ]">{{ favorite.item_name }}</span>
            </button>

            <!-- Bouton de suppression (visible au hover) -->
            <button @click="removeFavoriteLocal(favorite)" :class="[
              'remove-favorite text-base-content/40 hover:text-error opacity-0 group-hover:opacity-100 transition-all duration-150 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-error focus:ring-inset rounded',
              compact ? 'p-1 ml-1' : 'p-2 ml-2'
            ]" :title="`Retirer ${favorite.item_name} des favoris`" :aria-label="`Retirer ${favorite.item_name} des favoris`">
              <i class="fas fa-times text-xs" aria-hidden="true"></i>
            </button>
          </div>
        </li>
      </ul>
    </div>

    <!-- Pied du panneau avec statistiques -->
    <div v-if="favorites && favorites.length > 0 && !compact"
      class="favorites-footer p-3 border-t border-base-300 text-xs text-base-content/60">
      {{ favorites.length }} favori{{ favorites.length > 1 ? 's' : '' }}
      <span v-if="maxFavorites > 0">
        / {{ maxFavorites }} max
      </span>
    </div>
  </div>

  <!-- Modal de confirmation pour supprimer tous les favoris -->
  <div v-if="showClearConfirm" class="modal modal-open">
    <div class="modal-box">
      <h3 class="font-bold text-lg mb-4">Confirmer la suppression</h3>
      <p class="mb-6">
        Êtes-vous sûr de vouloir supprimer tous les favoris ? Cette action est irréversible.
      </p>
      <div class="modal-action">
        <button @click="showClearConfirm = false" class="btn btn-ghost">
          Annuler
        </button>
        <button @click="clearAllFavorites" class="btn btn-error">
          Supprimer tout
        </button>
      </div>
    </div>
  </div>

    <!-- Menu contextuel pour les favoris -->
    <div v-if="contextMenu.show"
      class="fixed bg-base-100 border border-base-300 shadow-lg rounded-lg py-2 z-50 min-w-48"
      :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }" @click.stop>
      <button class="w-full text-left px-4 py-2 hover:bg-base-200 text-sm flex items-center gap-3"
        @click="navigateToFavorite(contextMenu.favorite)">
        <i class="fas fa-folder-open w-4"></i>
        Ouvrir le dossier
      </button>

      <div class="divider my-1"></div>

      <button class="w-full text-left px-4 py-2 hover:bg-base-200 text-sm flex items-center gap-3 text-error"
        @click="removeFavoriteFromContext">
        <i class="fas fa-star w-4"></i>
        Retirer des favoris
      </button>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useFavorites } from '@/composables/useFavorites.js'

// Props
const props = defineProps({
  currentPath: {
    type: String,
    default: '/'
  },
  compact: {
    type: Boolean,
    default: false
  },
  isFavoriteSelected: {
    type: Function,
    default: () => () => false
  }
})

// Émissions
const emit = defineEmits([
  'navigate',
  'favorite-added',
  'favorite-removed',
  'error'
])

// Store pour vérifier l'authentification
import { useStore } from 'vuex'
const store = useStore()

// Composable pour les favoris
const {
  favorites,
  loading: refreshing,
  isFavorite,
  addFavorite,
  removeFavorite: removeFavoriteFromBackend,
  loadFavorites: loadFavoritesFromBackend,
  exportFavorites: exportFavoritesData,
  getFavoritesStats
} = useFavorites()

// Watch for changes in favorites to ensure reactivity
import { watch } from 'vue'
watch(favorites, (newFavorites) => {
  console.log('🔄 FavoritesPanel: Favorites updated, count:', newFavorites?.length || 0)
}, { deep: true })

// État réactif
const showImportExport = ref(false)
const showClearConfirm = ref(false)
const importInput = ref(null)

// Menu contextuel
const contextMenu = ref({
  show: false,
  x: 0,
  y: 0,
  favorite: null
})

// Notification système removed

// Computed
const maxFavorites = computed(() => 50) // Limite par défaut

// Méthodes
const refresh = async () => {
  try {
    await loadFavoritesFromBackend()
    console.log('Favoris actualisés', 'success')
  } catch (error) {
    console.error('Erreur lors du chargement des favoris:', error)
    console.log('Erreur lors du chargement des favoris', 'error')
  }
}

const navigateToFavorite = (favorite) => {
  try {
    console.log('🔄 Navigating to favorite:', favorite)

    // If the favorite is a file, navigate to its parent folder (open location)
    let targetPath = favorite.item_path || favorite.path || '/'
    if (favorite.item_type === 'file' || favorite.type === 'file') {
      const parts = (targetPath || '').split('/')
      parts.pop()
      targetPath = parts.join('/') || '/'
    }

    emit('navigate', {
      path: targetPath,
      source: 'favorite',
      favorite: favorite,
      openFile: (favorite.item_type === 'file' || favorite.type === 'file') ? (favorite.item_path || favorite.path) : null
    })

    console.log(`Navigation vers ${targetPath} (from favorite ${favorite.item_name})`, 'info')
  } catch (error) {
    console.error('Erreur lors de la navigation:', error)
    console.log('Erreur lors de la navigation', 'error')
  }
}

const removeFavoriteLocal = async (favorite) => {
  try {
    await removeFavoriteFromBackend(favorite.item_path || favorite.path)
    emit('favorite-removed', favorite)
    console.log(`${favorite.item_name || favorite.name} retiré des favoris`, 'success')
  } catch (error) {
    console.error('Erreur lors de la suppression du favori:', error)
    console.log('Erreur lors de la suppression du favori', 'error')
    emit('error', error)
  }
}

const exportFavorites = () => {
  try {
    const jsonData = JSON.stringify(favorites.value, null, 2)
    const blob = new Blob([jsonData], { type: 'application/json' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = `favoris-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    URL.revokeObjectURL(url)
    console.log('Favoris exportés avec succès', 'success')
  } catch (error) {
    console.error('Erreur lors de l\'export:', error)
    console.log('Erreur lors de l\'export des favoris', 'error')
  }
}

const importFavorites = (event) => {
  const file = event.target.files[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      // Import temporairement désactivé - nécessite implémentation backend
      console.log('Import temporairement indisponible', 'warning')
    } catch (error) {
      console.error('Erreur lors de l\'import:', error)
      console.log('Format de fichier invalide', 'error')
    }
  }
  reader.readAsText(file)

  // Reset input
  if (importInput.value) {
    importInput.value.value = ''
  }
}

const confirmClearAll = () => {
  showClearConfirm.value = true
}

const clearAllFavorites = async () => {
  try {
    // Clear all temporairement désactivé - nécessite implémentation backend
    const success = false
    if (success) {
      await loadFavoritesFromBackend()
      console.log('Tous les favoris ont été supprimés', 'success')
    } else {
      console.log('Erreur lors de la suppression', 'error')
    }
  } catch (error) {
    console.error('Erreur lors de la suppression:', error)
    console.log('Erreur lors de la suppression', 'error')
  } finally {
    showClearConfirm.value = false
  }
}

// showNotification function removed

// Écouteur d'événements pour les changements de favoris
let unsubscribeFavoritesChanged = null

// Méthodes publiques exposées
const addCurrentPathToFavorites = async (name = null) => {
  try {
    const folderName = name || props.currentPath.split('/').pop() || 'Racine'
    const success = await addFavorite(props.currentPath, folderName, 'folder')

    if (success) {
      // Les favoris se rechargent automatiquement via le composable
      emit('favorite-added', {
        path: props.currentPath,
        name: folderName
      })
      console.log(`${folderName} ajouté aux favoris`, 'success')
      return true
    } else {
      console.log('Ce dossier est déjà dans les favoris', 'info')
      return false
    }
  } catch (error) {
    console.error('Erreur lors de l\'ajout aux favoris:', error)
    console.log('Erreur lors de l\'ajout aux favoris', 'error')
    return false
  }
}

const isCurrentPathFavorite = () => {
  return isFavorite(props.currentPath)
}

// Méthodes pour le menu contextuel
const showFavoriteContextMenu = (event, favorite) => {
  event.preventDefault()
  contextMenu.value = {
    show: true,
    x: event.clientX,
    y: event.clientY,
    favorite
  }

  // Fermer le menu quand on clique ailleurs
  const hideMenu = () => {
    contextMenu.value.show = false
    document.removeEventListener('click', hideMenu)
  }
  setTimeout(() => {
    document.addEventListener('click', hideMenu)
  }, 0)
}

const removeFavoriteFromContext = async () => {
  if (contextMenu.value.favorite) {
    await removeFavoriteLocal(contextMenu.value.favorite)
  }
  contextMenu.value.show = false
}

// Exposer les méthodes pour utilisation par le parent
defineExpose({
  addCurrentPathToFavorites,
  isCurrentPathFavorite,
  refresh: loadFavoritesFromBackend
})

// Listen for global favorite changes
const handleGlobalFavoriteChange = () => {
  console.log('🔄 Global favorite change detected, refreshing...')
  loadFavoritesFromBackend()
}

// Lifecycle hooks
onMounted(async () => {
  console.log('🔄 FavoritesPanel mounted')
  console.log('🔐 Is authenticated:', store.getters.isAuthenticated)
  console.log('🎫 Has token:', !!store.getters.authToken)

  if (store.getters.isAuthenticated) {
    console.log('✅ User is authenticated, loading favorites...')
    try {
      await loadFavoritesFromBackend()
      console.log('✅ Favorites loaded in FavoritesPanel:', favorites.value?.length || 0)
      console.log('🔍 Favorites data:', favorites.value)
    } catch (error) {
      console.error('❌ Error loading favorites in FavoritesPanel:', error)
    }
  } else {
    console.log('❌ User not authenticated, skipping favorites loading')
  }

  // Listen for custom events that indicate favorites have changed
  window.addEventListener('favorites-changed', handleGlobalFavoriteChange)
})

onUnmounted(() => {
  // Nettoyer l'écouteur d'événements
  if (unsubscribeFavoritesChanged) {
    unsubscribeFavoritesChanged()
  }

  // Remove global event listener
  window.removeEventListener('favorites-changed', handleGlobalFavoriteChange)
})
</script>

<style scoped>
.favorites-panel:not(.compact) {
  min-width: 250px;
  max-width: 350px;
}

.favorites-panel.compact {
  width: 100%;
}

.favorite-item:hover .remove-favorite {
  opacity: 1;
}

.favorite-button:focus,
.remove-favorite:focus {
  z-index: 10;
}

/* Animation pour les notifications */
.toast {
  animation: slideInRight 0.3s ease-out;
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }

  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* Amélioration de l'accessibilité */
.favorite-button:focus-visible,
.remove-favorite:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 2px;
}

/* Responsive design */
@media (max-width: 768px) {
  .favorites-panel {
    min-width: 200px;
    max-width: 280px;
  }

  .favorite-button {
    padding: 0.5rem;
  }

  .favorites-header h3 {
    font-size: 1rem;
  }
}
</style>
