<template>
  <div class="p-6 space-y-4">
    <h2 class="text-2xl font-bold text-base-content">Simple Theme Test</h2>
    
    <!-- Theme buttons -->
    <div class="flex flex-wrap gap-2">
      <button 
        v-for="theme in themes"
        :key="theme"
        @click="setTheme(theme)"
        class="btn btn-sm"
        :class="currentTheme === theme ? 'btn-primary' : 'btn-outline'"
      >
        {{ theme }}
      </button>
    </div>

    <!-- Test elements -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <h3 class="card-title text-primary">Primary Colors</h3>
          <p class="text-base-content">Base content text</p>
          <div class="flex gap-2">
            <div class="w-8 h-8 bg-primary rounded"></div>
            <div class="w-8 h-8 bg-secondary rounded"></div>
            <div class="w-8 h-8 bg-accent rounded"></div>
          </div>
        </div>
      </div>

      <div class="card bg-base-200 shadow-xl">
        <div class="card-body">
          <h3 class="card-title text-secondary">Background Colors</h3>
          <p class="text-base-content">This card uses base-200</p>
          <div class="flex gap-2">
            <div class="w-8 h-8 bg-base-100 border rounded"></div>
            <div class="w-8 h-8 bg-base-200 border rounded"></div>
            <div class="w-8 h-8 bg-base-300 border rounded"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Current theme info -->
    <div class="alert alert-info">
      <span>Current theme: <strong>{{ currentTheme }}</strong></span>
    </div>

    <!-- CSS Variables display -->
    <div class="card bg-base-100 shadow-xl">
      <div class="card-body">
        <h3 class="card-title">CSS Variables (for debugging)</h3>
        <div class="grid grid-cols-2 gap-2 text-sm font-mono">
          <div>--color-primary: <span class="text-primary">■</span></div>
          <div>--color-secondary: <span class="text-secondary">■</span></div>
          <div>--color-accent: <span class="text-accent">■</span></div>
          <div>--color-base-100: <span class="bg-base-100 border px-2">base-100</span></div>
          <div>--color-base-200: <span class="bg-base-200 border px-2">base-200</span></div>
          <div>--color-base-300: <span class="bg-base-300 border px-2">base-300</span></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const themes = ['light', 'dark', 'valentine', 'retro', 'aqua']
const currentTheme = ref('light')

const setTheme = (theme) => {
  currentTheme.value = theme
  document.documentElement.setAttribute('data-theme', theme)
  localStorage.setItem('theme', theme)
  
  console.log(`Theme set to: ${theme}`)
  
  // Log computed styles for debugging
  setTimeout(() => {
    const root = document.documentElement
    const styles = getComputedStyle(root)
    console.log('CSS Variables after theme change:', {
      primary: styles.getPropertyValue('--color-primary'),
      secondary: styles.getPropertyValue('--color-secondary'),
      accent: styles.getPropertyValue('--color-accent'),
      'base-100': styles.getPropertyValue('--color-base-100'),
      'base-200': styles.getPropertyValue('--color-base-200'),
      'base-300': styles.getPropertyValue('--color-base-300'),
    })
  }, 100)
}

onMounted(() => {
  const savedTheme = localStorage.getItem('theme') || 'light'
  setTheme(savedTheme)
})
</script>