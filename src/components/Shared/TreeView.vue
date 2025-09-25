<template>
  <div class="tree-view">
    <!-- Root folder -->
    <div 
      class="flex items-center p-2 rounded hover:bg-base-200 cursor-pointer transition-colors"
      :class="{ 
        'bg-primary text-primary-content': selectedPath === '/',
        'bg-base-200': selectedPath === '/' && !isSelected('/')
      }"
      @click="selectFolder('/')"
    >
      <i class="fas fa-hdd text-primary mr-2"></i>
      <span class="font-medium">NAS Root</span>
    </div>
    
    <!-- Loading indicator for root -->
    <div v-if="loading && !treeData.length" class="flex justify-center py-4">
      <div class="loading loading-spinner loading-sm"></div>
    </div>
    
    <!-- Error message -->
    <div v-else-if="error" class="text-error text-sm p-2">
      {{ error }}
    </div>
    
    <!-- Tree nodes -->
    <TreeNode
      v-for="node in treeData"
      :key="node.path"
      :node="node"
      :selected-path="selectedPath"
      :expanded-paths="expandedPaths"
      :level="0"
      @select="selectFolder"
      @expand="handleNodeExpanded"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import TreeNode from './TreeNode.vue'
import { nasAPI } from '@/services/nasAPI.js'

const props = defineProps({
  selectedPath: {
    type: String,
    default: '/'
  }
})

const emit = defineEmits(['folder-selected'])

const treeData = ref([])
const expandedPaths = ref(new Set())
const loading = ref(false)
const error = ref('')

// Utility functions
const normalizePath = (path) => {
  return path.replace(/\/+/g, '/').replace(/\/$/, '') || '/'
}

const joinPaths = (...parts) => {
  return normalizePath(parts.join('/'))
}

const isSelected = (path) => {
  return normalizePath(path) === normalizePath(props.selectedPath)
}

// Build tree structure from directory items
const buildTreeStructure = (items, basePath = '/') => {
  const tree = []
  
  // Filter only directories and sort them
  const directories = items
    .filter(item => item.is_directory)
    .sort((a, b) => a.name.localeCompare(b.name))
  
  for (const dir of directories) {
    const nodePath = joinPaths(basePath, dir.name)
    const node = {
      name: dir.name,
      path: nodePath,
      type: 'directory',
      is_directory: true,
      children: [],
      loaded: false,
      loading: false,
      hasChildren: true // Assume directories might have children
    }
    tree.push(node)
  }
  
  return tree
}

// Load directory contents
const loadDirectoryContents = async (path = '/') => {
  try {
    const data = await nasAPI.browse(path)
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to load directory')
    }
    
    return data.items || []
  } catch (err) {
    console.error('Error loading directory:', err)
    throw err
  }
}

// Load tree data for root or specific path
const loadTreeData = async (path = '/') => {
  if (path === '/' && treeData.value.length > 0) return
  
  loading.value = true
  error.value = ''
  
  try {
    const items = await loadDirectoryContents(path)
    
    if (path === '/') {
      // Root level
      treeData.value = buildTreeStructure(items, path)
    } else {
      // Update specific node
      updateNodeChildren(treeData.value, path, items)
    }
    
  } catch (err) {
    console.error('Error loading tree data:', err)
    error.value = err.message || 'Failed to load folder tree'
  } finally {
    loading.value = false
  }
}

// Update children of a specific node
const updateNodeChildren = (nodes, targetPath, items) => {
  for (const node of nodes) {
    if (node.path === targetPath) {
      node.children = buildTreeStructure(items, targetPath)
      node.loaded = true
      node.loading = false
      node.hasChildren = node.children.length > 0
      return true
    } else if (node.children && node.children.length > 0) {
      if (updateNodeChildren(node.children, targetPath, items)) {
        return true
      }
    }
  }
  return false
}

// Find node by path
const findNodeByPath = (nodes, targetPath) => {
  for (const node of nodes) {
    if (node.path === targetPath) {
      return node
    }
    if (node.children && node.children.length > 0) {
      const found = findNodeByPath(node.children, targetPath)
      if (found) return found
    }
  }
  return null
}

// Handle node expansion
const handleNodeExpanded = async (path, expanded) => {
  if (expanded) {
    expandedPaths.value.add(path)
    // Load children if not already loaded
    const node = findNodeByPath(treeData.value, path)
    if (node && !node.loaded && !node.loading) {
      node.loading = true
      await loadTreeData(path)
    }
  } else {
    expandedPaths.value.delete(path)
  }
}

// Handle folder selection
const selectFolder = (path) => {
  emit('folder-selected', normalizePath(path))
}

// Expand path to show selected folder
const expandToPath = (path) => {
  if (path === '/') return
  
  const pathSegments = path.split('/').filter(Boolean)
  let currentPath = ''
  
  for (const segment of pathSegments) {
    currentPath = joinPaths(currentPath, segment)
    expandedPaths.value.add(currentPath)
    
    // Load this level if not already loaded
    const node = findNodeByPath(treeData.value, currentPath)
    if (node && !node.loaded && !node.loading) {
      loadTreeData(currentPath)
    }
  }
}

// Initialize component
onMounted(async () => {
  await loadTreeData()
  
  // Expand to selected path if provided
  if (props.selectedPath && props.selectedPath !== '/') {
    expandToPath(props.selectedPath)
  }
})

// Expose methods for parent components
defineExpose({
  expandToPath,
  loadTreeData
})
</script>

<style scoped>
.tree-view {
  user-select: none;
  max-height: 400px;
  overflow-y: auto;
}

.tree-view::-webkit-scrollbar {
  width: 6px;
}

.tree-view::-webkit-scrollbar-track {
  background: transparent;
}

.tree-view::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.tree-view::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>