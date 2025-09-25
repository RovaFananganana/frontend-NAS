<template>
  <div class="performance-test-view p-6">
    <div class="max-w-6xl mx-auto">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-base-content mb-2">
          Tests de Performance - Modes d'Affichage
        </h1>
        <p class="text-base-content/70">
          Testez les performances avec différents volumes de données et optimisations
        </p>
      </div>

      <!-- Contrôles de test -->
      <div class="card bg-base-100 shadow-xl mb-6">
        <div class="card-body">
          <h2 class="card-title">Configuration des Tests</h2>
          
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <!-- Nombre d'éléments -->
            <div class="form-control">
              <label class="label">
                <span class="label-text">Nombre d'éléments</span>
              </label>
              <select v-model="selectedSize" class="select select-bordered">
                <option v-for="size in testSizes" :key="size" :value="size">
                  {{ size }} éléments
                </option>
              </select>
            </div>

            <!-- Mode d'affichage -->
            <div class="form-control">
              <label class="label">
                <span class="label-text">Mode d'affichage</span>
              </label>
              <select v-model="selectedMode" class="select select-bordered">
                <option value="standard">Standard</option>
                <option value="optimized">Optimisé</option>
                <option value="virtualized">Virtualisé</option>
              </select>
            </div>

            <!-- Options -->
            <div class="form-control">
              <label class="label">
                <span class="label-text">Options</span>
              </label>
              <div class="flex flex-col gap-2">
                <label class="cursor-pointer label justify-start">
                  <input 
                    v-model="showPerformanceInfo" 
                    type="checkbox" 
                    class="checkbox checkbox-sm mr-2"
                  >
                  <span class="label-text">Infos performance</span>
                </label>
                <label class="cursor-pointer label justify-start">
                  <input 
                    v-model="enableAnimations" 
                    type="checkbox" 
                    class="checkbox checkbox-sm mr-2"
                  >
                  <span class="label-text">Animations</span>
                </label>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex flex-wrap gap-2">
            <button 
              @click="generateTestData"
              class="btn btn-primary"
              :class="{ 'loading': generating }"
            >
              <i v-if="!generating" class="fas fa-database mr-2"></i>
              {{ generating ? 'Génération...' : 'Générer Données' }}
            </button>
            
            <button 
              @click="runBenchmark"
              class="btn btn-secondary"
              :class="{ 'loading': benchmarking }"
              :disabled="!testFiles.length"
            >
              <i v-if="!benchmarking" class="fas fa-stopwatch mr-2"></i>
              {{ benchmarking ? 'Test en cours...' : 'Lancer Benchmark' }}
            </button>
            
            <button 
              @click="clearData"
              class="btn btn-outline"
              :disabled="!testFiles.length"
            >
              <i class="fas fa-trash mr-2"></i>
              Vider
            </button>
            
            <button 
              @click="exportResults"
              class="btn btn-outline"
              :disabled="!benchmarkResults"
            >
              <i class="fas fa-download mr-2"></i>
              Exporter
            </button>
          </div>
        </div>
      </div>

      <!-- Métriques en temps réel -->
      <div v-if="showPerformanceInfo" class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div class="stat bg-base-100 shadow rounded-lg">
          <div class="stat-title">FPS</div>
          <div class="stat-value text-primary">{{ currentMetrics.fps }}</div>
          <div class="stat-desc">{{ currentMetrics.fps >= 60 ? 'Excellent' : currentMetrics.fps >= 30 ? 'Bon' : 'Lent' }}</div>
        </div>
        
        <div class="stat bg-base-100 shadow rounded-lg">
          <div class="stat-title">Mémoire</div>
          <div class="stat-value text-secondary">{{ currentMetrics.memory }}MB</div>
          <div class="stat-desc">{{ currentMetrics.memory < 50 ? 'Faible' : currentMetrics.memory < 100 ? 'Modérée' : 'Élevée' }}</div>
        </div>
        
        <div class="stat bg-base-100 shadow rounded-lg">
          <div class="stat-title">Éléments</div>
          <div class="stat-value">{{ testFiles.length }}</div>
          <div class="stat-desc">{{ selectedMode }}</div>
        </div>
        
        <div class="stat bg-base-100 shadow rounded-lg">
          <div class="stat-title">Rendu</div>
          <div class="stat-value text-accent">{{ currentMetrics.renderTime }}ms</div>
          <div class="stat-desc">{{ currentMetrics.renderTime < 16 ? 'Fluide' : currentMetrics.renderTime < 33 ? 'Acceptable' : 'Lent' }}</div>
        </div>
      </div>

      <!-- Résultats de benchmark -->
      <div v-if="benchmarkResults" class="card bg-base-100 shadow-xl mb-6">
        <div class="card-body">
          <h2 class="card-title">Résultats du Benchmark</h2>
          
          <div class="overflow-x-auto">
            <table class="table table-sm">
              <thead>
                <tr>
                  <th>Test</th>
                  <th>Durée (ms)</th>
                  <th>Mémoire (MB)</th>
                  <th>FPS Moyen</th>
                  <th>Score</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="result in benchmarkResults" :key="result.name">
                  <td>{{ result.name }}</td>
                  <td>{{ result.duration.toFixed(2) }}</td>
                  <td>{{ (result.memoryDelta / 1024 / 1024).toFixed(2) }}</td>
                  <td>{{ result.avgFps || 'N/A' }}</td>
                  <td>
                    <div class="badge" :class="getScoreBadgeClass(result.score)">
                      {{ result.score || 'N/A' }}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Composant de test -->
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <div class="flex justify-between items-center mb-4">
            <h2 class="card-title">
              Aperçu - {{ selectedMode }} ({{ testFiles.length }} éléments)
            </h2>
            <div class="text-sm text-base-content/60">
              Temps de rendu: {{ lastRenderTime }}ms
            </div>
          </div>
          
          <!-- Composant d'affichage dynamique -->
          <div class="border border-base-300 rounded-lg overflow-hidden">
            <component 
              :is="currentComponent"
              :files="testFiles"
              :loading="generating"
              :show-performance-info="showPerformanceInfo"
              :container-height="400"
              :virtualization-threshold="100"
              @file-selected="handleFileSelected"
              @file-double-click="handleFileDoubleClick"
              @sort-changed="handleSortChanged"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { usePerformanceOptimization } from '@/composables/usePerformanceOptimization.js'
import { 
  generateTestFiles, 
  measurePerformance, 
  runPerformanceTestSuite 
} from '@/utils/performanceTest.js'

// Composants
import DetailedListView from '@/components/Shared/DetailedListView.vue'
import OptimizedDetailedListView from '@/components/Shared/OptimizedDetailedListView.vue'
import VirtualizedDetailedListView from '@/components/Shared/VirtualizedDetailedListView.vue'

// Composable de performance
const {
  isPerformanceMode,
  frameRate,
  performanceMetrics,
  measurePerformance: measureFramePerformance,
  enablePerformanceMode,
  disablePerformanceMode
} = usePerformanceOptimization()

// État réactif
const selectedSize = ref(1000)
const selectedMode = ref('optimized')
const showPerformanceInfo = ref(true)
const enableAnimations = ref(true)
const testFiles = ref([])
const generating = ref(false)
const benchmarking = ref(false)
const benchmarkResults = ref(null)
const lastRenderTime = ref(0)

// Configuration
const testSizes = [100, 500, 1000, 2000, 5000, 10000]

// Métriques en temps réel
const currentMetrics = ref({
  fps: 60,
  memory: 0,
  renderTime: 0
})

// Computed
const currentComponent = computed(() => {
  const componentMap = {
    standard: DetailedListView,
    optimized: OptimizedDetailedListView,
    virtualized: VirtualizedDetailedListView
  }
  return componentMap[selectedMode.value] || OptimizedDetailedListView
})

// Méthodes
const generateTestData = async () => {
  generating.value = true
  
  try {
    const { result, metrics } = await measurePerformance(
      () => generateTestFiles(selectedSize.value, {
        includeDirectories: true,
        directoryRatio: 0.3,
        fileTypes: ['txt', 'pdf', 'jpg', 'png', 'mp4', 'doc', 'xls', 'zip', 'js', 'css', 'html', 'json', 'py', 'vue'],
        sizeRange: { min: 1024, max: 50 * 1024 * 1024 }
      }),
      `generate-${selectedSize.value}-files`
    )
    
    testFiles.value = result
    lastRenderTime.value = metrics.duration
    
  } catch (error) {
    console.error('Erreur lors de la génération:', error)
  } finally {
    generating.value = false
  }
}

const runBenchmark = async () => {
  if (!testFiles.value.length) return
  
  benchmarking.value = true
  
  try {
    const components = {
      render: (data) => {
        // Simuler le rendu
        return new Promise(resolve => {
          setTimeout(() => {
            resolve(data.length)
          }, Math.random() * 10)
        })
      },
      sort: (data, column) => {
        return [...data].sort((a, b) => {
          const aVal = a[column] || ''
          const bVal = b[column] || ''
          return aVal.toString().localeCompare(bVal.toString())
        })
      },
      virtualScroll: (data, startIndex, count) => {
        return data.slice(startIndex, startIndex + count)
      }
    }
    
    const results = await runPerformanceTestSuite(components, {
      testSizes: [testFiles.value.length],
      includeVirtualization: selectedMode.value === 'virtualized',
      includeSorting: true,
      includeRendering: true
    })
    
    // Transformer les résultats pour l'affichage
    const formattedResults = []
    
    if (results.results.rendering) {
      results.results.rendering.forEach(result => {
        formattedResults.push({
          name: `Rendu ${result.size} éléments`,
          duration: result.duration,
          memoryDelta: result.memoryDelta,
          score: calculateScore(result.duration, result.memoryDelta)
        })
      })
    }
    
    if (results.results.sorting) {
      results.results.sorting.forEach(sizeResult => {
        Object.entries(sizeResult.sorts).forEach(([sortType, metrics]) => {
          formattedResults.push({
            name: `Tri ${sortType} (${sizeResult.size})`,
            duration: metrics.duration,
            memoryDelta: metrics.memoryDelta,
            score: calculateScore(metrics.duration, metrics.memoryDelta)
          })
        })
      })
    }
    
    benchmarkResults.value = formattedResults
    
  } catch (error) {
    console.error('Erreur lors du benchmark:', error)
  } finally {
    benchmarking.value = false
  }
}

const calculateScore = (duration, memoryDelta) => {
  // Score basé sur la durée et l'utilisation mémoire
  const timeScore = Math.max(0, 100 - (duration / 10))
  const memoryScore = Math.max(0, 100 - (memoryDelta / 1024 / 1024))
  return Math.round((timeScore + memoryScore) / 2)
}

const getScoreBadgeClass = (score) => {
  if (score >= 80) return 'badge-success'
  if (score >= 60) return 'badge-warning'
  return 'badge-error'
}

const clearData = () => {
  testFiles.value = []
  benchmarkResults.value = null
  lastRenderTime.value = 0
}

const exportResults = () => {
  if (!benchmarkResults.value) return
  
  const data = {
    timestamp: new Date().toISOString(),
    configuration: {
      size: selectedSize.value,
      mode: selectedMode.value,
      animations: enableAnimations.value
    },
    results: benchmarkResults.value,
    metrics: currentMetrics.value
  }
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `performance-test-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
}

// Gestionnaires d'événements
const handleFileSelected = (event) => {
  console.log('Fichier sélectionné:', event.file.name)
}

const handleFileDoubleClick = (event) => {
  console.log('Fichier double-cliqué:', event.file.name)
}

const handleSortChanged = (event) => {
  console.log('Tri changé:', event.column, event.direction)
}

// Surveillance des métriques
let metricsInterval = null

const updateMetrics = () => {
  currentMetrics.value = {
    fps: frameRate.value,
    memory: performanceMetrics.value.memory || 0,
    renderTime: lastRenderTime.value
  }
}

// Watchers
watch(enableAnimations, (enabled) => {
  if (enabled) {
    disablePerformanceMode()
  } else {
    enablePerformanceMode()
  }
})

watch(selectedMode, () => {
  if (testFiles.value.length > 0) {
    // Re-mesurer les performances après changement de mode
    setTimeout(() => {
      measureFramePerformance()
    }, 100)
  }
})

// Lifecycle
onMounted(() => {
  // Générer des données initiales
  generateTestData()
  
  // Démarrer la surveillance des métriques
  metricsInterval = setInterval(updateMetrics, 1000)
})

onUnmounted(() => {
  if (metricsInterval) {
    clearInterval(metricsInterval)
  }
})
</script>

<style scoped>
.performance-test-view {
  min-height: 100vh;
  background: hsl(var(--b2));
}

.stat {
  padding: 1rem;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: bold;
}

.table th {
  background: hsl(var(--b3));
  font-weight: 600;
}

.badge {
  font-size: 0.75rem;
  font-weight: 600;
}

/* Animations pour les métriques */
.stat-value {
  transition: all 0.3s ease;
}

.stat-value:hover {
  transform: scale(1.05);
}

/* Responsive */
@media (max-width: 768px) {
  .grid-cols-4 {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .grid-cols-3 {
    grid-template-columns: 1fr;
  }
}
</style>