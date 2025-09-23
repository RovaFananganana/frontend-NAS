<!-- src/components/Shared/NASFolderTree.vue -->
<template>
  <div class="nas-folder-tree">
    <div 
      class="flex items-center p-1 rounded hover:bg-base-200 cursor-pointer transition-colors text-sm"
      :class="{ 'bg-primary text-primary-content': currentPath === '/' }"
      @click="$emit('path-selected', '/')"
    >
      <i class="fas fa-hdd text-primary mr-2"></i>
      <span>NAS Root</span>
    </div>
    
    <div v-if="loading && !treeData.length" class="flex justify-center py-4">
      <div class="loading loading-spinner loading-sm"></div>
    </div>
    
    <div v-else-if="error" class="text-error text-xs p-2">
      Erreur de chargement de l'arbre
    </div>
    
    <NasTreeNode
      v-for="node in treeData"
      :key="node.path"
      :node="node"
      :current-path="currentPath"
      :expanded-paths="expandedPaths"
      :level="0"
      @path-selected="$emit('path-selected', $event)"
      @node-expanded="handleNodeExpanded"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import NasTreeNode from './NasTreeNode.vue'

// Utility function for path normalization
const NasPathUtils = {
  join: (...parts) => {
    return parts.join('/').replace(/\/+/g, '/').replace(/\/$/, '') || '/'
  },
  normalize: (path) => {
    return path.replace(/\/+/g, '/').replace(/\/$/, '') || '/'
  }
}

const props = defineProps({
  currentPath: {
    type: String,
    default: '/'
  }
})

const emit = defineEmits(['path-selected'])

const treeData = ref([])
const expandedPaths = ref(new Set())
const loading = ref(false)
const error = ref('')

const buildTreeStructure = (items, basePath = '/') => {
  const tree = []
  
  for (const dir of items) {
    const nodePath = NasPathUtils.join(basePath, dir.name)
    const node = {
      name: dir.name,
      path: nodePath,
      type: 'directory',
      children: [],
      loaded: false,
      loading: false,
      hasChildren: true // Assume directories might have children
    }
    tree.push(node)
  }
  
  return tree.sort((a, b) => a.name.localeCompare(b.name))
}

const loadTreeData = async (path = '/') => {
  if (path === '/' && treeData.value.length > 0) return
  
  loading.value = true
  error.value = ''
  
  try {
    // Use the nasAPI service for consistent error handling
    const { nasAPI } = await import('@/services/nasAPI.js')
    const data = await nasAPI.browse(path)
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to load directory')
    }
    
    if (path === '/') {
      // Root level - filter only directories for tree
      const directories = data.items.filter(item => item.is_directory)
      treeData.value = buildTreeStructure(directories, path)
    } else {
      // Update specific node
      const directories = data.items.filter(item => item.is_directory)
      updateNodeChildren(treeData.value, path, directories)
    }
    
  } catch (err) {
    console.error('Error loading tree data:', err)
    error.value = err.message || 'Failed to load folder tree'
  } finally {
    loading.value = false
  }
}

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

const expandPathToCurrentLocation = () => {
  if (props.currentPath === '/') return
  
  const pathSegments = props.currentPath.split('/').filter(Boolean)
  let currentPath = ''
  
  for (const segment of pathSegments) {
    currentPath = NasPathUtils.join(currentPath, segment)
    expandedPaths.value.add(currentPath)
    
    // Load this level if not already loaded
    const node = findNodeByPath(treeData.value, currentPath)
    if (node && !node.loaded && !node.loading) {
      loadTreeData(currentPath)
    }
  }
}

// Watch for current path changes to expand tree
watch(() => props.currentPath, () => {
  expandPathToCurrentLocation()
}, { immediate: true })

onMounted(() => {
  loadTreeData()
})
</script>

<style scoped>
.nas-folder-tree {
  user-select: none;
}
</style>

