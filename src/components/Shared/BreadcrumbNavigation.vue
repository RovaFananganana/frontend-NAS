<template>
  <nav class="breadcrumb-nav" aria-label="Navigation par chemin" role="navigation">
    <ol class="breadcrumb-list flex items-center gap-1 text-sm">
      <!-- Home/Root segment -->
      <li class="breadcrumb-item">
        <button 
          @click="navigateToPath('/')"
          :class="breadcrumbItemClasses(true)"
          :aria-current="currentPath === '/' ? 'page' : undefined"
          title="Aller à la racine"
        >
          <i class="fas fa-home mr-1" aria-hidden="true"></i>
          Racine
        </button>
      </li>
      
      <!-- Path segments -->
      <template v-for="(segment, index) in pathSegments" :key="index">
        <li class="separator" aria-hidden="true">
          <i class="fas fa-chevron-right text-xs opacity-50"></i>
        </li>
        <li class="breadcrumb-item">
          <button 
            @click="navigateToPath(segment.path)"
            :class="breadcrumbItemClasses(index === pathSegments.length - 1)"
            :aria-current="index === pathSegments.length - 1 ? 'page' : undefined"
            :title="`Aller à ${segment.name}`"
          >
            {{ segment.name }}
          </button>
        </li>
      </template>
    </ol>
  </nav>
</template>

<script setup>
import { computed } from 'vue'

// Props
const props = defineProps({
  currentPath: {
    type: String,
    required: true,
    default: '/'
  }
})

// Émissions
const emit = defineEmits(['navigate'])

// Computed properties
const pathSegments = computed(() => {
  if (props.currentPath === '/') return []
  
  const segments = props.currentPath.split('/').filter(Boolean)
  return segments.map((segment, index) => ({
    name: segment,
    path: '/' + segments.slice(0, index + 1).join('/')
  }))
})

// Methods
const navigateToPath = (path) => {
  if (path !== props.currentPath) {
    emit('navigate', path)
  }
}

const breadcrumbItemClasses = (isCurrent) => {
  return [
    'btn btn-ghost btn-xs',
    'hover:bg-base-200 transition-colors duration-150',
    'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1',
    {
      'text-primary font-medium': isCurrent,
      'text-base-content/70 hover:text-base-content': !isCurrent
    }
  ]
}
</script>

<style scoped>
.breadcrumb-nav {
  @apply flex items-center min-h-[2rem];
}

.breadcrumb-list {
  @apply flex items-center flex-wrap gap-1;
  @apply max-w-full overflow-hidden;
}

.breadcrumb-item {
  @apply flex-shrink-0;
}

.breadcrumb-item button {
  @apply max-w-[200px] truncate;
  @apply text-left;
}

.separator {
  @apply flex-shrink-0 px-1;
}

/* Responsive behavior */
@media (max-width: 640px) {
  .breadcrumb-item button {
    @apply max-w-[120px];
  }
}

/* Accessibility improvements */
.breadcrumb-nav:focus-within {
  @apply outline-none;
}

.breadcrumb-item button:focus {
  @apply z-10 relative;
}

/* Long path handling */
.breadcrumb-list {
  @apply overflow-x-auto;
  scrollbar-width: thin;
}

.breadcrumb-list::-webkit-scrollbar {
  height: 4px;
}

.breadcrumb-list::-webkit-scrollbar-track {
  @apply bg-base-200;
}

.breadcrumb-list::-webkit-scrollbar-thumb {
  @apply bg-base-300 rounded;
}

.breadcrumb-list::-webkit-scrollbar-thumb:hover {
  @apply bg-base-400;
}
</style>