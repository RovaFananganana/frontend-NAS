<!-- components/User/widgets/QuickActions.vue -->
<template>
  <div class="quick-actions-widget">
    <div class="widget-header">
      <h3 class="widget-title">
        <i class="fas fa-bolt mr-2"></i>
        Actions rapides
      </h3>
    </div>
    
    <div class="widget-content">
      <div class="actions-grid">
        <button 
          v-for="action in quickActions" 
          :key="action.key"
          @click="handleAction(action.key)"
          class="action-button"
          :class="action.class"
        >
          <div class="action-icon">
            <i :class="action.icon"></i>
          </div>
          <div class="action-content">
            <div class="action-title">{{ action.title }}</div>
            <div class="action-description">{{ action.description }}</div>
          </div>
          <div class="action-arrow">
            <i class="fas fa-chevron-right"></i>
          </div>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const emit = defineEmits(['navigate'])

// Quick actions configuration
const quickActions = ref([
  {
    key: 'files',
    title: 'Mes fichiers',
    description: 'Parcourir et gérer vos fichiers',
    icon: 'fas fa-folder-open',
    class: 'btn-primary'
  },
  {
    key: 'upload',
    title: 'Upload',
    description: 'Téléverser de nouveaux fichiers',
    icon: 'fas fa-upload',
    class: 'btn-secondary'
  },
  {
    key: 'storage',
    title: 'Stockage',
    description: 'Voir les informations de stockage',
    icon: 'fas fa-chart-pie',
    class: 'btn-accent'
  },
  {
    key: 'logs',
    title: 'Journal',
    description: 'Consulter l\'historique d\'activité',
    icon: 'fas fa-history',
    class: 'btn-info'
  },
  {
    key: 'favorites',
    title: 'Favoris',
    description: 'Accéder aux dossiers favoris',
    icon: 'fas fa-star',
    class: 'btn-warning'
  },
  {
    key: 'search',
    title: 'Rechercher',
    description: 'Rechercher dans vos fichiers',
    icon: 'fas fa-search',
    class: 'btn-ghost'
  }
])

// Methods
const handleAction = (actionKey) => {
  switch (actionKey) {
    case 'files':
      emit('navigate', 'files')
      break
    case 'upload':
      // TODO: Implement upload modal or navigate to upload page
      emit('navigate', 'files') // For now, navigate to files
      break
    case 'storage':
      emit('navigate', 'storage')
      break
    case 'logs':
      emit('navigate', 'logs')
      break
    case 'favorites':
      // TODO: Implement favorites navigation
      emit('navigate', 'files')
      break
    case 'search':
      // TODO: Implement search functionality
      emit('navigate', 'files')
      break
    default:
      console.log('Unknown action:', actionKey)
  }
}
</script>

<style scoped>
.quick-actions-widget {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.widget-header {
  margin-bottom: 1rem;
}

.widget-title {
  @apply text-lg font-semibold text-base-content flex items-center;
}

.widget-content {
  flex: 1;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 0.75rem;
}

.action-button {
  @apply btn btn-outline w-full h-auto p-4 flex items-center justify-start gap-3 hover:scale-105 transition-all duration-200;
  min-height: 4rem;
}

.action-icon {
  @apply flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg bg-base-200;
  font-size: 1.25rem;
}

.action-content {
  @apply flex-1 text-left;
}

.action-title {
  @apply font-semibold text-base-content;
}

.action-description {
  @apply text-sm text-base-content/70 mt-1;
}

.action-arrow {
  @apply flex-shrink-0 text-base-content/50;
}

/* Button color variations */
.action-button.btn-primary .action-icon {
  @apply bg-primary/20 text-primary;
}

.action-button.btn-secondary .action-icon {
  @apply bg-secondary/20 text-secondary;
}

.action-button.btn-accent .action-icon {
  @apply bg-accent/20 text-accent;
}

.action-button.btn-info .action-icon {
  @apply bg-info/20 text-info;
}

.action-button.btn-warning .action-icon {
  @apply bg-warning/20 text-warning;
}

.action-button.btn-ghost .action-icon {
  @apply bg-base-300 text-base-content;
}

/* Hover effects */
.action-button:hover .action-icon {
  @apply scale-110;
}

.action-button:hover .action-arrow {
  @apply translate-x-1;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .actions-grid {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }
  
  .action-button {
    padding: 1rem;
    min-height: 3.5rem;
  }
  
  .action-icon {
    width: 2rem;
    height: 2rem;
    font-size: 1rem;
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .actions-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>