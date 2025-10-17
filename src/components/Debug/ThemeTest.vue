<template>
  <div class="p-6 space-y-4">
    <h2 class="text-2xl font-bold text-base-content">Theme Test Component</h2>

    <!-- Background colors test -->
    <div class="grid grid-cols-2 gap-4">
      <div class="p-4 bg-base-100 border border-base-300 rounded-lg">
        <h3 class="font-semibold text-base-content">Base 100 Background</h3>
        <p class="text-base-content opacity-70">This should change with themes</p>
      </div>
      <div class="p-4 bg-base-200 border border-base-300 rounded-lg">
        <h3 class="font-semibold text-base-content">Base 200 Background</h3>
        <p class="text-base-content opacity-70">This should also change</p>
      </div>
    </div>

    <!-- Button colors test -->
    <div class="space-x-2">
      <button class="btn btn-primary">Primary Button</button>
      <button class="btn btn-secondary">Secondary Button</button>
      <button class="btn btn-accent">Accent Button</button>
      <button class="btn btn-neutral">Neutral Button</button>
    </div>

    <!-- Current theme display -->
    <div class="p-4 bg-base-200 rounded-lg">
      <p class="text-base-content">
        Current theme: <span class="font-mono font-bold">{{ currentTheme }}</span>
      </p>
      <p class="text-base-content opacity-70 text-sm">
        If themes are working, colors should change when you switch themes in the sidebar.
      </p>
    </div>

    <!-- Theme switcher -->
    <div class="space-y-4">
      <div class="flex flex-wrap gap-2">
        <button v-for="theme in availableThemes" :key="theme.value" @click="changeTheme(theme.value)" class="btn btn-sm"
          :class="currentTheme === theme.value ? 'btn-primary' : 'btn-outline'">
          <i :class="theme.icon" class="mr-2"></i>
          {{ theme.name }}
        </button>
      </div>

      <!-- Test all themes button -->
      <button @click="testAllThemes" class="btn btn-secondary btn-sm">
        <i class="fas fa-flask mr-2"></i>
        Tester tous les thèmes
      </button>

      <!-- Theme test results -->
      <div v-if="Object.keys(themeTestResults).length > 0" class="p-4 bg-base-200 rounded-lg">
        <h4 class="font-semibold text-base-content mb-2">Résultats des tests de thèmes:</h4>
        <div class="grid grid-cols-2 gap-2 text-sm">
          <div v-for="(result, themeName) in themeTestResults" :key="themeName" class="flex items-center gap-2">
            <span :class="result ? 'text-success' : 'text-error'">
              <i :class="result ? 'fas fa-check' : 'fas fa-times'"></i>
            </span>
            <span class="text-base-content">{{ themeName }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { availableThemes, applyTheme, getCurrentTheme, testThemeApplication } from '@/utils/themeUtils.js'

const currentTheme = ref('light')
const themeTestResults = ref({})

const changeTheme = async (theme) => {
  currentTheme.value = theme
  applyTheme(theme)

  // Test theme after application
  await nextTick()
  setTimeout(() => {
    const testElement = document.querySelector('.btn-primary')
    if (testElement) {
      const style = getComputedStyle(testElement)
      console.log(`Theme "${theme}" - Primary button styles:`, {
        backgroundColor: style.backgroundColor,
        color: style.color,
        borderColor: style.borderColor
      })
    }
  }, 100)
}

const testAllThemes = async () => {
  console.log('Testing all themes...')
  for (const theme of availableThemes) {
    themeTestResults.value[theme.value] = await testThemeApplication(theme.value)
  }
  console.log('Theme test results:', themeTestResults.value)
}

onMounted(() => {
  currentTheme.value = getCurrentTheme()
  // Test themes after component is mounted
  setTimeout(testAllThemes, 500)
})
</script>