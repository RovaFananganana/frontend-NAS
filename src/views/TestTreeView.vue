<!-- Test view for TreeView functionality -->
<template>
  <div class="p-8">
    <h1 class="text-2xl font-bold mb-4">TreeView Test</h1>
    
    <div class="grid grid-cols-2 gap-8">
      <!-- TreeView Test -->
      <div class="border border-base-300 rounded-lg p-4">
        <h2 class="text-lg font-semibold mb-4">New TreeView Component</h2>
        <div class="max-h-96 overflow-auto">
          <TreeView 
            :selected-path="currentPath"
            @folder-selected="onPathSelected"
          />
        </div>
      </div>
      
      <!-- Current Path Display -->
      <div class="border border-base-300 rounded-lg p-4">
        <h2 class="text-lg font-semibold mb-4">Current Path</h2>
        <div class="bg-base-200 p-4 rounded">
          <code>{{ currentPath }}</code>
        </div>
        
        <h3 class="text-md font-semibold mt-4 mb-2">Path History</h3>
        <div class="space-y-1">
          <div 
            v-for="(path, index) in pathHistory" 
            :key="index"
            class="text-sm bg-base-100 p-2 rounded"
          >
            {{ path }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import TreeView from '@/components/Shared/TreeView.vue'

const currentPath = ref('/')
const pathHistory = ref(['/'])

const onPathSelected = (path) => {
  console.log('Path selected:', path)
  currentPath.value = path
  pathHistory.value.unshift(path)
  
  // Keep only last 10 paths
  if (pathHistory.value.length > 10) {
    pathHistory.value = pathHistory.value.slice(0, 10)
  }
}
</script>