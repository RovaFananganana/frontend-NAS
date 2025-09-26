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
    <div class="flex flex-wrap gap-2">
      <button 
        v-for="theme in availableThemes"
        :key="theme.value"
        @click="changeTheme(theme.value)"
        class="btn btn-sm"
        :class="currentTheme === theme.value ? 'btn-primary' : 'btn-outline'"
      >
        <i :class="theme.icon" class="mr-2"></i>
        {{ theme.name }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { availableThemes, applyTheme, getCurrentTheme } from '@/utils/themeUtils.js'

const currentTheme = ref('light')

const changeTheme = (theme) => {
  currentTheme.value = theme
  applyTheme(theme)
}

onMounted(() => {
  currentTheme.value = getCurrentTheme()
})
</script>