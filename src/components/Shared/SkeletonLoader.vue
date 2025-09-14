<template>
  <div class="skeleton-loader" :class="containerClass">
    <!-- File/Folder List Skeleton -->
    <template v-if="type === 'file-list'">
      <div class="space-y-3">
        <div v-for="i in count" :key="i" class="flex items-center space-x-3 p-3 bg-base-100 rounded-lg">
          <div class="skeleton w-8 h-8 rounded"></div>
          <div class="flex-1 space-y-2">
            <div class="skeleton h-4 w-3/4"></div>
            <div class="skeleton h-3 w-1/2"></div>
          </div>
          <div class="skeleton w-16 h-6 rounded-full"></div>
        </div>
      </div>
    </template>

    <!-- Grid Skeleton -->
    <template v-else-if="type === 'grid'">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div v-for="i in count" :key="i" class="card bg-base-100 p-4">
          <div class="skeleton w-full h-16 mb-3"></div>
          <div class="skeleton h-4 w-3/4 mb-2"></div>
          <div class="skeleton h-3 w-1/2"></div>
        </div>
      </div>
    </template>

    <!-- Table Skeleton -->
    <template v-else-if="type === 'table'">
      <div class="overflow-x-auto">
        <table class="table w-full">
          <thead>
            <tr>
              <th v-for="i in columns" :key="i">
                <div class="skeleton h-4 w-full"></div>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="i in count" :key="i">
              <td v-for="j in columns" :key="j">
                <div class="skeleton h-4 w-full"></div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <!-- Dashboard Stats Skeleton -->
    <template v-else-if="type === 'stats'">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div v-for="i in count" :key="i" class="stat bg-base-100 shadow rounded-lg">
          <div class="stat-figure">
            <div class="skeleton w-8 h-8 rounded-full"></div>
          </div>
          <div class="stat-title">
            <div class="skeleton h-4 w-20"></div>
          </div>
          <div class="stat-value">
            <div class="skeleton h-8 w-16"></div>
          </div>
          <div class="stat-desc">
            <div class="skeleton h-3 w-24"></div>
          </div>
        </div>
      </div>
    </template>

    <!-- Form Skeleton -->
    <template v-else-if="type === 'form'">
      <div class="space-y-4">
        <div v-for="i in count" :key="i" class="form-control">
          <div class="skeleton h-4 w-24 mb-2"></div>
          <div class="skeleton h-12 w-full rounded-lg"></div>
        </div>
        <div class="flex justify-end space-x-2 mt-6">
          <div class="skeleton h-10 w-20 rounded-lg"></div>
          <div class="skeleton h-10 w-24 rounded-lg"></div>
        </div>
      </div>
    </template>

    <!-- Text Content Skeleton -->
    <template v-else-if="type === 'text'">
      <div class="space-y-3">
        <div v-for="i in count" :key="i">
          <div class="skeleton h-4 w-full mb-2"></div>
          <div class="skeleton h-4 w-5/6 mb-2"></div>
          <div class="skeleton h-4 w-4/6"></div>
        </div>
      </div>
    </template>

    <!-- Card Skeleton -->
    <template v-else-if="type === 'card'">
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <div class="skeleton h-6 w-1/3 mb-4"></div>
          <div class="space-y-2">
            <div class="skeleton h-4 w-full"></div>
            <div class="skeleton h-4 w-5/6"></div>
            <div class="skeleton h-4 w-4/6"></div>
          </div>
          <div class="card-actions justify-end mt-4">
            <div class="skeleton h-10 w-20 rounded-lg"></div>
          </div>
        </div>
      </div>
    </template>

    <!-- Custom Skeleton -->
    <template v-else-if="type === 'custom'">
      <slot name="skeleton">
        <div class="skeleton h-20 w-full"></div>
      </slot>
    </template>

    <!-- Default Skeleton -->
    <template v-else>
      <div class="space-y-4">
        <div v-for="i in count" :key="i" class="skeleton h-4 w-full"></div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  type: {
    type: String,
    default: 'default',
    validator: (value) => [
      'default', 'file-list', 'grid', 'table', 'stats', 
      'form', 'text', 'card', 'custom'
    ].includes(value)
  },
  count: {
    type: Number,
    default: 3
  },
  columns: {
    type: Number,
    default: 4
  },
  containerClass: {
    type: String,
    default: ''
  }
})

const animationDelay = computed(() => {
  // Stagger animation for multiple items
  return (index) => `${index * 0.1}s`
})
</script>

<style scoped>
.skeleton {
  @apply bg-gray-200 animate-pulse rounded;
}

.dark .skeleton {
  @apply bg-gray-700;
}

/* Staggered animation */
.skeleton-loader > * {
  animation-delay: var(--delay, 0s);
}

/* Pulse animation */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* Shimmer effect */
.skeleton::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.4),
    transparent
  );
  animation: shimmer 1.5s infinite;
}

.skeleton {
  position: relative;
  overflow: hidden;
}

@keyframes shimmer {
  0% {
    left: -100%;
  }
  100% {
    left: 100%;
  }
}
</style>