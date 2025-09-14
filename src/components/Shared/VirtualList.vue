<template>
  <div 
    ref="containerRef"
    class="virtual-list-container"
    :style="{ height: containerHeight + 'px' }"
    @scroll="handleScroll"
  >
    <!-- Spacer for items before visible area -->
    <div :style="{ height: offsetY + 'px' }"></div>
    
    <!-- Visible items -->
    <div
      v-for="item in visibleItems"
      :key="getItemKey(item)"
      :style="{ height: itemHeight + 'px' }"
      class="virtual-list-item"
    >
      <slot :item="item" :index="item.index">
        {{ item }}
      </slot>
    </div>
    
    <!-- Spacer for items after visible area -->
    <div :style="{ height: (totalHeight - offsetY - visibleHeight) + 'px' }"></div>
    
    <!-- Loading indicator -->
    <div v-if="loading" class="flex justify-center p-4">
      <span class="loading loading-spinner loading-md"></span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'

const props = defineProps({
  items: {
    type: Array,
    required: true
  },
  itemHeight: {
    type: Number,
    default: 50
  },
  containerHeight: {
    type: Number,
    default: 400
  },
  buffer: {
    type: Number,
    default: 5
  },
  keyField: {
    type: String,
    default: 'id'
  },
  loading: {
    type: Boolean,
    default: false
  },
  hasMore: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['load-more', 'scroll'])

// Refs
const containerRef = ref(null)
const scrollTop = ref(0)

// Computed properties
const totalHeight = computed(() => props.items.length * props.itemHeight)

const visibleCount = computed(() => 
  Math.ceil(props.containerHeight / props.itemHeight) + props.buffer * 2
)

const startIndex = computed(() => 
  Math.max(0, Math.floor(scrollTop.value / props.itemHeight) - props.buffer)
)

const endIndex = computed(() => 
  Math.min(props.items.length, startIndex.value + visibleCount.value)
)

const visibleItems = computed(() => {
  return props.items.slice(startIndex.value, endIndex.value).map((item, index) => ({
    ...item,
    index: startIndex.value + index
  }))
})

const offsetY = computed(() => startIndex.value * props.itemHeight)

const visibleHeight = computed(() => 
  (endIndex.value - startIndex.value) * props.itemHeight
)

// Methods
const handleScroll = (event) => {
  scrollTop.value = event.target.scrollTop
  
  emit('scroll', {
    scrollTop: scrollTop.value,
    scrollHeight: event.target.scrollHeight,
    clientHeight: event.target.clientHeight
  })
  
  // Check if we need to load more items
  if (props.hasMore && !props.loading) {
    const scrollBottom = scrollTop.value + props.containerHeight
    const threshold = totalHeight.value - props.itemHeight * 3 // Load when 3 items from bottom
    
    if (scrollBottom >= threshold) {
      emit('load-more')
    }
  }
}

const getItemKey = (item) => {
  return item[props.keyField] || item.index
}

const scrollToIndex = (index) => {
  if (containerRef.value) {
    const targetScrollTop = index * props.itemHeight
    containerRef.value.scrollTop = targetScrollTop
  }
}

const scrollToTop = () => {
  if (containerRef.value) {
    containerRef.value.scrollTop = 0
  }
}

const scrollToBottom = () => {
  if (containerRef.value) {
    containerRef.value.scrollTop = totalHeight.value
  }
}

// Watch for items changes and maintain scroll position if needed
watch(() => props.items.length, (newLength, oldLength) => {
  // If items were added at the beginning, adjust scroll position
  if (newLength > oldLength && startIndex.value === 0) {
    nextTick(() => {
      const addedItems = newLength - oldLength
      scrollTop.value += addedItems * props.itemHeight
    })
  }
})

// Expose methods
defineExpose({
  scrollToIndex,
  scrollToTop,
  scrollToBottom
})
</script>

<style scoped>
.virtual-list-container {
  overflow-y: auto;
  overflow-x: hidden;
}

.virtual-list-item {
  display: flex;
  align-items: center;
  box-sizing: border-box;
}

/* Smooth scrolling */
.virtual-list-container {
  scroll-behavior: smooth;
}

/* Custom scrollbar */
.virtual-list-container::-webkit-scrollbar {
  width: 8px;
}

.virtual-list-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.virtual-list-container::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.virtual-list-container::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>