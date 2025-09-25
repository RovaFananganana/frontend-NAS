<template>
  <div class="tree-node">
    <!-- Node content -->
    <div 
      class="flex items-center p-1 rounded hover:bg-base-200 cursor-pointer transition-colors text-sm"
      :class="{ 
        'bg-primary text-primary-content': isSelected,
        'bg-base-200': isSelected && !isHighlighted
      }"
      :style="{ paddingLeft: (level * 16 + 8) + 'px' }"
      @click="handleClick"
    >
      <!-- Expand/collapse button -->
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
      
      <!-- Folder icon -->
      <i class="fas fa-folder text-primary mr-2"></i>
      
      <!-- Folder name -->
      <span class="truncate flex-1" :title="node.name">{{ node.name }}</span>
    </div>
    
    <!-- Child nodes -->
    <template v-if="isExpanded && node.children && Array.isArray(node.children) && node.children.length > 0">
      <TreeNode
        v-for="child in node.children"
        :key="`${child.path}-${level}`"
        :node="child"
        :selected-path="selectedPath"
        :expanded-paths="expandedPaths"
        :level="level + 1"
        @select="$emit('select', $event)"
        @expand="(path, expanded) => $emit('expand', path, expanded)"
      />
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'

// Recursive import for child nodes
import TreeNode from './TreeNode.vue'

const props = defineProps({
  node: {
    type: Object,
    required: true
  },
  selectedPath: {
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

const emit = defineEmits(['select', 'expand'])

// Computed properties
const isExpanded = computed(() => {
  return props.expandedPaths && props.expandedPaths.has && props.expandedPaths.has(props.node.path)
})

const isSelected = computed(() => {
  const normalizePath = (path) => path.replace(/\/+/g, '/').replace(/\/$/, '') || '/'
  return normalizePath(props.node.path) === normalizePath(props.selectedPath)
})

const isHighlighted = computed(() => {
  return isSelected.value
})

// Event handlers
const handleClick = () => {
  if (props.node && props.node.path) {
    emit('select', props.node.path)
  }
}

const toggleExpanded = () => {
  if (props.node && props.node.path) {
    const newExpanded = !isExpanded.value
    emit('expand', props.node.path, newExpanded)
  }
}
</script>

<style scoped>
.tree-node {
  user-select: none;
}
</style>