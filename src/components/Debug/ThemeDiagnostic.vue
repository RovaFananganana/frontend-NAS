<template>
  <div class="p-6 space-y-6">
    <h2 class="text-2xl font-bold">Diagnostic des Thèmes DaisyUI</h2>
    
    <!-- Theme Selector -->
    <div class="card bg-base-100 shadow-xl">
      <div class="card-body">
        <h3 class="card-title">Sélecteur de Thème</h3>
        <div class="flex flex-wrap gap-2">
          <button 
            v-for="theme in availableThemes"
            :key="theme.value"
            @click="changeTheme(theme.value)"
            class="btn btn-sm"
            :class="currentTheme === theme.value ? 'btn-primary' : 'btn-outline'"
          >
            {{ theme.name }}
          </button>
        </div>
        <p class="text-sm opacity-70">Thème actuel: {{ currentTheme }}</p>
      </div>
    </div>

    <!-- CSS Variables Check -->
    <div class="card bg-base-100 shadow-xl">
      <div class="card-body">
        <h3 class="card-title">Variables CSS Détectées</h3>
        <div class="overflow-x-auto">
          <table class="table table-sm">
            <thead>
              <tr>
                <th>Variable</th>
                <th>Valeur</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(value, variable) in cssVariables" :key="variable">
                <td class="font-mono text-xs">{{ variable }}</td>
                <td class="font-mono text-xs">{{ value || 'Non définie' }}</td>
                <td>
                  <span v-if="value" class="badge badge-success badge-sm">✓</span>
                  <span v-else class="badge badge-error badge-sm">✗</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <button @click="refreshVariables" class="btn btn-sm btn-secondary mt-2">
          Actualiser les Variables
        </button>
      </div>
    </div>

    <!-- Visual Test -->
    <div class="card bg-base-100 shadow-xl">
      <div class="card-body">
        <h3 class="card-title">Test Visuel des Couleurs</h3>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <!-- Primary -->
          <div class="text-center">
            <div class="w-16 h-16 bg-primary rounded-lg mx-auto mb-2"></div>
            <p class="text-sm font-semibold">Primary</p>
            <p class="text-xs opacity-70 font-mono">{{ getComputedColor('primary') }}</p>
          </div>
          
          <!-- Secondary -->
          <div class="text-center">
            <div class="w-16 h-16 bg-secondary rounded-lg mx-auto mb-2"></div>
            <p class="text-sm font-semibold">Secondary</p>
            <p class="text-xs opacity-70 font-mono">{{ getComputedColor('secondary') }}</p>
          </div>
          
          <!-- Accent -->
          <div class="text-center">
            <div class="w-16 h-16 bg-accent rounded-lg mx-auto mb-2"></div>
            <p class="text-sm font-semibold">Accent</p>
            <p class="text-xs opacity-70 font-mono">{{ getComputedColor('accent') }}</p>
          </div>
          
          <!-- Neutral -->
          <div class="text-center">
            <div class="w-16 h-16 bg-neutral rounded-lg mx-auto mb-2"></div>
            <p class="text-sm font-semibold">Neutral</p>
            <p class="text-xs opacity-70 font-mono">{{ getComputedColor('neutral') }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Component Test -->
    <div class="card bg-base-100 shadow-xl">
      <div class="card-body">
        <h3 class="card-title">Test des Composants</h3>
        <div class="space-y-4">
          <!-- Buttons -->
          <div class="flex flex-wrap gap-2">
            <button class="btn btn-primary">Primary</button>
            <button class="btn btn-secondary">Secondary</button>
            <button class="btn btn-accent">Accent</button>
            <button class="btn btn-neutral">Neutral</button>
          </div>
          
          <!-- Alerts -->
          <div class="space-y-2">
            <div class="alert alert-info">
              <span>Info alert</span>
            </div>
            <div class="alert alert-success">
              <span>Success alert</span>
            </div>
            <div class="alert alert-warning">
              <span>Warning alert</span>
            </div>
            <div class="alert alert-error">
              <span>Error alert</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="card bg-base-100 shadow-xl">
      <div class="card-body">
        <h3 class="card-title">Actions de Diagnostic</h3>
        <div class="flex flex-wrap gap-2">
          <button @click="forceRefresh" class="btn btn-warning">
            Forcer le Refresh
          </button>
          <button @click="testAllThemes" class="btn btn-info">
            Tester Tous les Thèmes
          </button>
          <button @click="logDiagnostic" class="btn btn-secondary">
            Log Diagnostic Complet
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { 
  availableThemes, 
  applyTheme, 
  getCurrentTheme, 
  getCurrentThemeVariables,
  forceThemeRefresh,
  testThemeApplication 
} from '@/utils/themeUtils.js'

const currentTheme = ref('light')
const cssVariables = ref({})

const changeTheme = async (theme) => {
  currentTheme.value = theme
  applyTheme(theme)
  
  await nextTick()
  setTimeout(() => {
    refreshVariables()
  }, 100)
}

const refreshVariables = () => {
  cssVariables.value = getCurrentThemeVariables()
}

const getComputedColor = (colorName) => {
  const element = document.createElement('div')
  element.className = `bg-${colorName}`
  element.style.position = 'absolute'
  element.style.visibility = 'hidden'
  document.body.appendChild(element)
  
  const color = getComputedStyle(element).backgroundColor
  document.body.removeChild(element)
  
  return color
}

const forceRefresh = () => {
  forceThemeRefresh()
  setTimeout(refreshVariables, 200)
}

const testAllThemes = async () => {
  console.log('=== Test de tous les thèmes ===')
  for (const theme of availableThemes) {
    const result = await testThemeApplication(theme.value)
    console.log(`${theme.name} (${theme.value}):`, result ? '✓' : '✗')
  }
}

const logDiagnostic = () => {
  console.log('=== DIAGNOSTIC COMPLET DES THÈMES ===')
  console.log('Thème actuel:', currentTheme.value)
  console.log('data-theme attribute:', document.documentElement.getAttribute('data-theme'))
  console.log('Variables CSS:', cssVariables.value)
  
  // Test des couleurs calculées
  const colors = ['primary', 'secondary', 'accent', 'neutral']
  colors.forEach(color => {
    console.log(`Couleur ${color}:`, getComputedColor(color))
  })
}

onMounted(() => {
  currentTheme.value = getCurrentTheme()
  refreshVariables()
})
</script>