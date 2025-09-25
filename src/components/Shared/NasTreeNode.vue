<!-- src/components/Shared/NasTreeNode.vue -->
<template>
  <div class="nas-tree-node">
    <div 
      class="flex items-center p-1 rounded hover:bg-base-200 cursor-pointer transition-colors text-sm"
      :class="{ 'bg-primary text-primary-content': currentPath === node.path }"
      :style="{ paddingLeft: (level * 16 + 8) + 'px' }"
      @click="handleClick"
      @contextmenu="handleRightClick"
    >
      <button 
        v-if="node.hasChildren || node.children.length > 0"
        class="w-4 h-4 flex items-center justify-center mr-1 hover:bg-base-300 rounded"
        @click.stop="toggleExpanded"
        :disabled="node.loading"
      >
        <div v-if="node.loading" class="loading loading-spinner loading-xs"></div>
        <i 
          v-else
          class="fas text-xs transition-transform"
          :class="isExpanded ? 'fa-chevron-down' : 'fa-chevron-right'"
        ></i>
      </button>
      <div v-else class="w-4 mr-1"></div>
      
      <i class="fas fa-folder text-primary mr-2"></i>
      <span class="truncate flex-1" :title="node.name">{{ node.name }}</span>
    </div>
    
    <template v-if="isExpanded && node.children && Array.isArray(node.children) && node.children.length > 0">
      <NasTreeNode
        v-for="child in node.children"
        :key="`${child.path}-${level}`"
        :node="child"
        :current-path="currentPath"
        :expanded-paths="expandedPaths"
        :level="level + 1"
        @path-selected="$emit('path-selected', $event)"
        @node-expanded="(path, expanded) => $emit('node-expanded', path, expanded)"
        @context-menu="(event, node) => $emit('context-menu', event, node)"
      />
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'

// Import récursif pour les sous-nœuds
import NasTreeNode from './NasTreeNode.vue'

const props = defineProps({
  node: {
    type: Object,
    required: true
  },
  currentPath: {
    type: String,
    required: true
  },
  expandedPaths: {
    type: Set,
    required: true
  },
  level: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['path-selected', 'node-expanded', 'context-menu'])

const isExpanded = computed(() => {
  return props.expandedPaths && props.expandedPaths.has && props.expandedPaths.has(props.node.path)
})

const handleClick = () => {
  if (props.node && props.node.path) {
    emit('path-selected', props.node.path)
  }
}

const toggleExpanded = () => {
  if (props.node && props.node.path) {
    const newExpanded = !isExpanded.value
    emit('node-expanded', props.node.path, newExpanded)
  }
}

const handleRightClick = (event) => {
  event.preventDefault()
  if (props.node) {
    emit('context-menu', event, props.node)
  }
}
</script>

<style scoped>
.nas-tree-node {
  user-select: none;
}
</style>