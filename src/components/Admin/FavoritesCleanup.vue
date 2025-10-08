<template>
  <div class="card bg-base-100 shadow-xl">
    <div class="card-body">
      <h2 class="card-title text-error">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        Nettoyage des Favoris
      </h2>
      
      <div class="alert alert-warning">
        <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <div>
          <h3 class="font-bold">Problème détecté !</h3>
          <div class="text-sm">
            Des favoris s'ajoutent automatiquement (AIMtest, echange IL, administration, finance, TWR) 
            à cause de données résiduelles dans le localStorage.
          </div>
        </div>
      </div>

      <div class="space-y-4">
        <!-- Debug localStorage -->
        <div class="form-control">
          <label class="label">
            <span class="label-text">Favoris actuels dans localStorage</span>
          </label>
          <div class="bg-base-200 p-4 rounded-lg">
            <div v-if="localStorageFavorites.length === 0" class="text-base-content/60">
              Aucun favori dans localStorage
            </div>
            <div v-else>
              <div v-for="(fav, index) in localStorageFavorites" :key="index" class="flex justify-between items-center py-1">
                <span class="font-mono text-sm">{{ fav.path }}</span>
                <span class="text-xs text-base-content/60">{{ fav.name }}</span>
              </div>
            </div>
          </div>
          <div class="label">
            <button @click="refreshLocalStorageDebug" class="label-text-alt link">
              🔄 Actualiser
            </button>
          </div>
        </div>

        <!-- Actions de nettoyage -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button 
            @click="cleanupProblematic" 
            class="btn btn-warning"
            :disabled="loading"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Nettoyer favoris problématiques
          </button>

          <button 
            @click="clearAllLocalStorage" 
            class="btn btn-error"
            :disabled="loading"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Vider tout localStorage
          </button>
        </div>

        <!-- Nettoyage backend -->
        <div class="divider">Nettoyage Backend</div>
        
        <div class="alert alert-info">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-6 h-6">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <div>
            <div class="font-bold">Nettoyage des favoris orphelins</div>
            <div class="text-sm">Supprime les favoris qui pointent vers des dossiers inexistants sur le NAS</div>
          </div>
        </div>

        <button 
          @click="cleanupBackendFavorites" 
          class="btn btn-primary w-full"
          :disabled="loading"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Nettoyer favoris backend orphelins
        </button>
      </div>

      <!-- Résultats -->
      <div v-if="result" class="mt-4">
        <div :class="['alert', result.success ? 'alert-success' : 'alert-error']">
          <div>
            <div class="font-bold">{{ result.title }}</div>
            <div class="text-sm">{{ result.message }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { 
  clearAllLocalStorageFavorites, 
  debugLocalStorageFavorites, 
  cleanupProblematicFavorites,
  PROBLEMATIC_FAVORITES 
} from '@/utils/favoritesCleanup.js'
import useFavorites from '@/composables/useFavorites.js'

const { cleanupFavorites } = useFavorites()

const loading = ref(false)
const result = ref(null)
const localStorageFavorites = ref([])

const refreshLocalStorageDebug = () => {
  localStorageFavorites.value = debugLocalStorageFavorites()
}

const cleanupProblematic = async () => {
  loading.value = true
  result.value = null
  
  try {
    const removedCount = cleanupProblematicFavorites()
    refreshLocalStorageDebug()
    
    result.value = {
      success: true,
      title: 'Nettoyage réussi',
      message: `${removedCount} favoris problématiques supprimés du localStorage`
    }
  } catch (err) {
    result.value = {
      success: false,
      title: 'Erreur de nettoyage',
      message: err.message
    }
  } finally {
    loading.value = false
  }
}

const clearAllLocalStorage = async () => {
  loading.value = true
  result.value = null
  
  try {
    const success = clearAllLocalStorageFavorites()
    refreshLocalStorageDebug()
    
    result.value = {
      success,
      title: success ? 'localStorage vidé' : 'Erreur',
      message: success ? 'Tous les favoris du localStorage ont été supprimés' : 'Impossible de vider le localStorage'
    }
  } catch (err) {
    result.value = {
      success: false,
      title: 'Erreur',
      message: err.message
    }
  } finally {
    loading.value = false
  }
}

const cleanupBackendFavorites = async () => {
  loading.value = true
  result.value = null
  
  try {
    const cleanedCount = await cleanupFavorites()
    
    result.value = {
      success: true,
      title: 'Nettoyage backend réussi',
      message: `${cleanedCount} favoris orphelins supprimés du backend`
    }
  } catch (err) {
    result.value = {
      success: false,
      title: 'Erreur nettoyage backend',
      message: err.message
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  refreshLocalStorageDebug()
})
</script>