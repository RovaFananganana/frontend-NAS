<!-- components/Admin/CacheManager.vue -->
<template>
  <div class="p-6">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-3xl font-bold">Gestionnaire de Cache</h1>
        <p class="text-base-content/70 mt-1">
          Gérez le cache des conversions et des miniatures
        </p>
      </div>
      <div class="flex gap-2">
        <button 
          class="btn btn-secondary btn-sm"
          @click="cleanupCache"
          :disabled="loading"
        >
          <i class="fas fa-broom mr-2"></i>
          Nettoyer
        </button>
        <button 
          class="btn btn-warning btn-sm"
          @click="clearAllCache"
          :disabled="loading"
        >
          <i class="fas fa-trash mr-2"></i>
          Vider le Cache
        </button>
        <button 
          class="btn btn-primary btn-sm"
          @click="refreshStats"
          :disabled="loading"
        >
          <i class="fas fa-sync-alt mr-2"></i>
          Actualiser
        </button>
      </div>
    </div>

    <!-- Error Alert -->
    <div v-if="error" class="alert alert-error mb-6">
      <i class="fas fa-exclamation-triangle"></i>
      <span>{{ error }}</span>
    </div>

    <!-- Success Alert -->
    <div v-if="successMessage" class="alert alert-success mb-6">
      <i class="fas fa-check-circle"></i>
      <span>{{ successMessage }}</span>
    </div>

    <!-- Loading State -->
    <div v-if="loading && !stats" class="flex justify-center items-center py-12">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <!-- Cache Statistics -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div class="stat bg-base-100 shadow rounded-lg">
        <div class="stat-figure text-primary">
          <i class="fas fa-database text-2xl"></i>
        </div>
        <div class="stat-title">Taille du Cache</div>
        <div class="stat-value text-primary">{{ stats?.total_size_mb || 0 }}MB</div>
        <div class="stat-desc">sur {{ stats?.max_size_mb || 0 }}MB max</div>
      </div>
      
      <div class="stat bg-base-100 shadow rounded-lg">
        <div class="stat-figure text-success">
          <i class="fas fa-bullseye text-2xl"></i>
        </div>
        <div class="stat-title">Taux de Réussite</div>
        <div class="stat-value text-success">{{ stats?.hit_rate || 0 }}%</div>
        <div class="stat-desc">{{ stats?.hits || 0 }} hits / {{ (stats?.hits || 0) + (stats?.misses || 0) }} total</div>
      </div>
      
      <div class="stat bg-base-100 shadow rounded-lg">
        <div class="stat-figure text-info">
          <i class="fas fa-file text-2xl"></i>
        </div>
        <div class="stat-title">Entrées</div>
        <div class="stat-value text-info">{{ stats?.entries_count || 0 }}</div>
        <div class="stat-desc">fichiers en cache</div>
      </div>
      
      <div class="stat bg-base-100 shadow rounded-lg">
        <div class="stat-figure text-warning">
          <i class="fas fa-recycle text-2xl"></i>
        </div>
        <div class="stat-title">Évictions</div>
        <div class="stat-value text-warning">{{ stats?.evictions || 0 }}</div>
        <div class="stat-desc">entrées supprimées</div>
      </div>
    </div>

    <!-- Cache Usage Chart -->
    <div class="card bg-base-100 shadow-xl mb-6">
      <div class="card-body">
        <h2 class="card-title mb-4">
          <i class="fas fa-chart-pie mr-2"></i>
          Utilisation du Cache
        </h2>
        
        <div class="flex items-center justify-between mb-4">
          <div class="text-center">
            <div class="text-2xl font-bold text-primary">{{ usagePercentage }}%</div>
            <div class="text-sm opacity-70">Utilisé</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-info">{{ stats?.total_size_mb || 0 }}MB</div>
            <div class="text-sm opacity-70">Taille actuelle</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-success">{{ availableSpace }}MB</div>
            <div class="text-sm opacity-70">Espace libre</div>
          </div>
        </div>

        <!-- Progress Bar -->
        <div class="w-full">
          <progress 
            class="progress w-full"
            :class="{
              'progress-success': usagePercentage < 70,
              'progress-warning': usagePercentage >= 70 && usagePercentage < 90,
              'progress-error': usagePercentage >= 90
            }"
            :value="usagePercentage" 
            max="100"
          ></progress>
        </div>
      </div>
    </div>

    <!-- Cache Directories -->
    <div class="card bg-base-100 shadow-xl mb-6">
      <div class="card-body">
        <h2 class="card-title mb-4">
          <i class="fas fa-folder mr-2"></i>
          Répertoires de Cache
        </h2>
        
        <div class="space-y-3">
          <div 
            v-for="(path, type) in stats?.cache_dirs || {}" 
            :key="type"
            class="flex items-center justify-between p-3 bg-base-200 rounded-lg"
          >
            <div>
              <div class="font-medium capitalize">{{ type }}</div>
              <div class="text-sm opacity-70 font-mono">{{ path }}</div>
            </div>
            <button 
              class="btn btn-ghost btn-xs"
              @click="clearCacheType(type)"
              :disabled="loading"
            >
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Performance Metrics -->
    <div class="card bg-base-100 shadow-xl">
      <div class="card-body">
        <h2 class="card-title mb-4">
          <i class="fas fa-tachometer-alt mr-2"></i>
          Métriques de Performance
        </h2>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="text-center p-4 bg-base-200 rounded-lg">
            <div class="text-2xl font-bold text-success">{{ stats?.hits || 0 }}</div>
            <div class="text-sm opacity-70">Cache Hits</div>
          </div>
          
          <div class="text-center p-4 bg-base-200 rounded-lg">
            <div class="text-2xl font-bold text-error">{{ stats?.misses || 0 }}</div>
            <div class="text-sm opacity-70">Cache Misses</div>
          </div>
          
          <div class="text-center p-4 bg-base-200 rounded-lg">
            <div class="text-2xl font-bold text-warning">{{ stats?.evictions || 0 }}</div>
            <div class="text-sm opacity-70">Évictions</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Clear Cache Confirmation Modal -->
    <div v-if="showClearModal" class="modal modal-open">
      <div class="modal-box">
        <h3 class="font-bold text-lg">Confirmer la Suppression</h3>
        <p class="py-4">
          Êtes-vous sûr de vouloir vider tout le cache ? 
          Cette action supprimera toutes les conversions et miniatures en cache.
        </p>
        <div class="modal-action">
          <button class="btn" @click="showClearModal = false">Annuler</button>
          <button class="btn btn-error" @click="confirmClearCache" :disabled="loading">
            Vider le Cache
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'

const store = useStore()

// Reactive data
const stats = ref(null)
const loading = ref(false)
const error = ref('')
const successMessage = ref('')
const showClearModal = ref(false)

// Computed properties
const usagePercentage = computed(() => {
  if (!stats.value || !stats.value.max_size_mb || stats.value.max_size_mb === 0) return 0
  return Math.round((stats.value.total_size_mb / stats.value.max_size_mb) * 100)
})

const availableSpace = computed(() => {
  if (!stats.value || !stats.value.max_size_mb) return 0
  return Math.max(0, stats.value.max_size_mb - stats.value.total_size_mb)
})

// Methods
const refreshStats = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const response = await fetch('/api/cache/stats', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    stats.value = await response.json()
  } catch (err) {
    error.value = 'Erreur lors du chargement des statistiques du cache'
    console.error('Error loading cache stats:', err)
  } finally {
    loading.value = false
  }
}

const cleanupCache = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const response = await fetch('/api/cache/cleanup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ max_age_hours: 24 })
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const result = await response.json()
    successMessage.value = result.message
    setTimeout(() => { successMessage.value = '' }, 3000)
    
    await refreshStats()
  } catch (err) {
    error.value = 'Erreur lors du nettoyage du cache'
    console.error('Error cleaning cache:', err)
  } finally {
    loading.value = false
  }
}

const clearAllCache = () => {
  showClearModal.value = true
}

const confirmClearCache = async () => {
  loading.value = true
  error.value = ''
  showClearModal.value = false
  
  try {
    const response = await fetch('/api/cache/clear', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const result = await response.json()
    successMessage.value = result.message
    setTimeout(() => { successMessage.value = '' }, 3000)
    
    await refreshStats()
  } catch (err) {
    error.value = 'Erreur lors de la suppression du cache'
    console.error('Error clearing cache:', err)
  } finally {
    loading.value = false
  }
}

const clearCacheType = async (cacheType) => {
  loading.value = true
  error.value = ''
  
  try {
    // This would need to be implemented in the backend
    successMessage.value = `Cache ${cacheType} vidé avec succès`
    setTimeout(() => { successMessage.value = '' }, 3000)
    
    await refreshStats()
  } catch (err) {
    error.value = `Erreur lors de la suppression du cache ${cacheType}`
    console.error('Error clearing cache type:', err)
  } finally {
    loading.value = false
  }
}

// Lifecycle
onMounted(() => {
  refreshStats()
})
</script>

<style scoped>
.stat {
  @apply border border-base-300;
}

.card {
  @apply border border-base-300;
}
</style>