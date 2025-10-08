<template>
  <div class="card bg-base-100 shadow-xl">
    <div class="card-body">
      <h2 class="card-title text-info">
        <i class="fas fa-bug"></i>
        Debug Navigation Favoris
      </h2>
      
      <div class="space-y-4">
        <!-- État actuel -->
        <div class="alert alert-info">
          <div>
            <h3 class="font-bold">État actuel</h3>
            <div class="text-sm space-y-1">
              <div><strong>Onglet actif:</strong> {{ activeTab }}</div>
              <div><strong>Chemin actuel:</strong> {{ currentPath }}</div>
              <div><strong>Nombre de favoris:</strong> {{ favorites?.length || 0 }}</div>
            </div>
          </div>
        </div>

        <!-- Liste des favoris avec boutons de test -->
        <div v-if="favorites && favorites.length > 0">
          <h3 class="font-bold mb-2">Favoris disponibles</h3>
          <div class="space-y-2">
            <div v-for="favorite in favorites" :key="favorite.item_path" 
                 class="flex items-center justify-between p-2 bg-base-200 rounded">
              <div class="flex items-center gap-2">
                <i class="fas fa-folder text-primary"></i>
                <span class="font-mono text-sm">{{ favorite.item_path }}</span>
                <span class="text-xs text-base-content/60">({{ favorite.item_name }})</span>
              </div>
              <button @click="testNavigateToFavorite(favorite)" 
                      class="btn btn-xs btn-primary">
                <i class="fas fa-arrow-right"></i>
                Tester
              </button>
            </div>
          </div>
        </div>

        <!-- Logs de navigation -->
        <div>
          <h3 class="font-bold mb-2">Logs de navigation</h3>
          <div class="bg-base-300 p-3 rounded max-h-40 overflow-y-auto">
            <div v-if="navigationLogs.length === 0" class="text-base-content/60 text-sm">
              Aucun log de navigation
            </div>
            <div v-else class="space-y-1">
              <div v-for="(log, index) in navigationLogs" :key="index" 
                   class="text-xs font-mono">
                <span class="text-base-content/60">{{ log.timestamp }}</span>
                <span :class="getLogColor(log.type)">{{ log.message }}</span>
              </div>
            </div>
          </div>
          <button @click="clearLogs" class="btn btn-xs btn-ghost mt-2">
            <i class="fas fa-trash"></i>
            Vider les logs
          </button>
        </div>

        <!-- Actions de test -->
        <div class="divider">Actions de test</div>
        <div class="grid grid-cols-2 gap-2">
          <button @click="testAddFavorite" class="btn btn-sm btn-success">
            <i class="fas fa-plus"></i>
            Ajouter favori test
          </button>
          <button @click="testRemoveAllFavorites" class="btn btn-sm btn-error">
            <i class="fas fa-trash"></i>
            Supprimer tous
          </button>
          <button @click="testNavigateToRoot" class="btn btn-sm btn-info">
            <i class="fas fa-home"></i>
            Aller à la racine
          </button>
          <button @click="refreshFavorites" class="btn btn-sm btn-warning">
            <i class="fas fa-refresh"></i>
            Actualiser favoris
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useFavorites } from '@/composables/useFavorites.js'

// Props
const props = defineProps({
  activeTab: String,
  currentPath: String
})

// Émissions
const emit = defineEmits(['navigate-to-favorite'])

// Composable favoris
const {
  favorites,
  loading,
  addFavorite,
  removeFavorite,
  loadFavorites
} = useFavorites()

// État local
const navigationLogs = ref([])

// Méthodes utilitaires
const addLog = (message, type = 'info') => {
  const timestamp = new Date().toLocaleTimeString()
  navigationLogs.value.push({
    timestamp,
    message,
    type
  })
  
  // Garder seulement les 50 derniers logs
  if (navigationLogs.value.length > 50) {
    navigationLogs.value = navigationLogs.value.slice(-50)
  }
}

const getLogColor = (type) => {
  const colors = {
    info: 'text-info',
    success: 'text-success',
    error: 'text-error',
    warning: 'text-warning'
  }
  return colors[type] || 'text-base-content'
}

const clearLogs = () => {
  navigationLogs.value = []
}

// Méthodes de test
const testNavigateToFavorite = (favorite) => {
  addLog(`🔄 Test navigation vers: ${favorite.item_path}`, 'info')
  
  // Émettre l'événement de navigation
  emit('navigate-to-favorite', {
    path: favorite.item_path,
    source: 'debug-test',
    favorite: favorite
  })
  
  addLog(`✅ Événement navigate-to-favorite émis`, 'success')
}

const testAddFavorite = async () => {
  try {
    addLog('🔄 Test ajout favori: /test-debug', 'info')
    
    const success = await addFavorite('/test-debug', 'Test Debug', 'folder')
    
    if (success) {
      addLog('✅ Favori test ajouté avec succès', 'success')
    } else {
      addLog('⚠️ Favori déjà existant ou erreur', 'warning')
    }
  } catch (error) {
    addLog(`❌ Erreur ajout favori: ${error.message}`, 'error')
  }
}

const testRemoveAllFavorites = async () => {
  try {
    addLog('🔄 Test suppression de tous les favoris', 'warning')
    
    const favoritesToRemove = [...(favorites.value || [])]
    
    for (const favorite of favoritesToRemove) {
      await removeFavorite(favorite.item_path)
      addLog(`🗑️ Supprimé: ${favorite.item_name}`, 'warning')
    }
    
    addLog('✅ Tous les favoris supprimés', 'success')
  } catch (error) {
    addLog(`❌ Erreur suppression: ${error.message}`, 'error')
  }
}

const testNavigateToRoot = () => {
  addLog('🔄 Test navigation vers racine', 'info')
  
  emit('navigate-to-favorite', {
    path: '/',
    source: 'debug-root-test'
  })
  
  addLog('✅ Navigation vers racine émise', 'success')
}

const refreshFavorites = async () => {
  try {
    addLog('🔄 Actualisation des favoris', 'info')
    await loadFavorites()
    addLog(`✅ Favoris actualisés: ${favorites.value?.length || 0} favoris`, 'success')
  } catch (error) {
    addLog(`❌ Erreur actualisation: ${error.message}`, 'error')
  }
}

// Lifecycle
onMounted(() => {
  addLog('🚀 Composant de debug monté', 'info')
  addLog(`📊 État initial: ${favorites.value?.length || 0} favoris`, 'info')
})
</script>