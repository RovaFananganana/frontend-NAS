<!-- components/Shared/Breadcrumb.vue -->
<template>
  <nav class="breadcrumb-nav" role="navigation" aria-label="Fil d'Ariane">
    <ol class="breadcrumb-list flex items-center space-x-2 text-sm">
      <li 
        v-for="(item, index) in breadcrumbItems" 
        :key="item.path"
        class="breadcrumb-item flex items-center"
      >
        <!-- Separator -->
        <i 
          v-if="index > 0" 
          class="fas fa-chevron-right text-xs text-base-content/40 mx-2" 
          aria-hidden="true"
        ></i>
        
        <!-- Breadcrumb link or current page -->
        <router-link
          v-if="!isCurrentRoute(item.path)"
          :to="item.path"
          class="breadcrumb-link text-primary hover:text-primary-focus transition-colors"
          :aria-label="`Naviguer vers ${item.name}`"
        >
          {{ item.name }}
        </router-link>
        
        <span 
          v-else
          class="breadcrumb-current text-base-content font-medium"
          aria-current="page"
        >
          {{ item.name }}
        </span>
      </li>
    </ol>
  </nav>
</template>

<script setup>
import { useBreadcrumb } from '@/composables/useBreadcrumb.js'

const { breadcrumbItems, isCurrentRoute } = useBreadcrumb()
</script>

<style scoped>
.breadcrumb-nav {
  @apply py-2;
}

.breadcrumb-list {
  @apply flex-wrap;
}

.breadcrumb-item {
  @apply flex items-center;
}

.breadcrumb-link {
  @apply hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded px-1;
}

.breadcrumb-current {
  @apply px-1;
}

/* Responsive design */
@media (max-width: 640px) {
  .breadcrumb-nav {
    @apply text-xs;
  }
  
  .breadcrumb-item {
    @apply max-w-24 truncate;
  }
}
</style>