<!-- components/User/widgets/ActivitySummary.vue -->
<template>
  <div class="activity-summary">
    <div class="widget-header">
      <h3 class="widget-title">
        <i class="fas fa-history mr-2"></i>
        Activité récente
      </h3>
    </div>
    
    <div class="widget-content">
      <div v-if="loading" class="loading-state">
        <div class="flex items-center justify-center py-8">
          <span class="loading loading-spinner loading-md"></span>
          <span class="ml-2">Chargement...</span>
        </div>
      </div>
      
      <div v-else-if="activities.length === 0" class="empty-state">
        <div class="text-center py-8 opacity-70">
          <i class="fas fa-clock text-4xl mb-4"></i>
          <p>Aucune activité récente</p>
        </div>
      </div>
      
      <div v-else class="activities-list">
        <div 
          v-for="activity in activities.slice(0, 5)" 
          :key="activity.id"
          class="activity-item"
        >
          <div class="activity-icon">
            <i :class="getActivityIcon(activity.action)" :style="{ color: getActivityColor(activity.success) }"></i>
          </div>
          <div class="activity-details">
            <div class="activity-action">{{ formatActivityAction(activity.action) }}</div>
            <div class="activity-resource" v-if="activity.resource">{{ activity.resource }}</div>
            <div class="activity-time">{{ formatTime(activity.created_at) }}</div>
          </div>
          <div class="activity-status">
            <i 
              :class="activity.success ? 'fas fa-check-circle text-success' : 'fas fa-exclamation-circle text-error'"
              :title="activity.success ? 'Succès' : 'Échec'"
            ></i>
          </div>
        </div>
      </div>
      
      <div v-if="activities.length > 5" class="widget-footer">
        <button class="btn btn-sm btn-outline w-full" @click="$emit('view-all')">
          Voir toute l'activité
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  activities: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['view-all'])

// Activity formatting methods
const getActivityIcon = (action) => {
  const iconMap = {
    'login': 'fas fa-sign-in-alt',
    'logout': 'fas fa-sign-out-alt',
    'file_download': 'fas fa-download',
    'file_upload': 'fas fa-upload',
    'file_delete': 'fas fa-trash',
    'file_rename': 'fas fa-edit',
    'folder_create': 'fas fa-folder-plus',
    'folder_delete': 'fas fa-folder-minus',
    'navigation': 'fas fa-folder-open',
    'favorite_add': 'fas fa-star',
    'favorite_remove': 'fas fa-star-o'
  }
  return iconMap[action] || 'fas fa-file'
}

const getActivityColor = (success) => {
  return success ? '#10b981' : '#ef4444'
}

const formatActivityAction = (action) => {
  const actionMap = {
    'login': 'Connexion',
    'logout': 'Déconnexion',
    'file_download': 'Téléchargement',
    'file_upload': 'Upload',
    'file_delete': 'Suppression',
    'file_rename': 'Renommage',
    'folder_create': 'Création de dossier',
    'folder_delete': 'Suppression de dossier',
    'navigation': 'Navigation',
    'favorite_add': 'Ajout aux favoris',
    'favorite_remove': 'Retrait des favoris'
  }
  return actionMap[action] || action
}

const formatTime = (timestamp) => {
  if (!timestamp) return ''
  
  const date = new Date(timestamp)
  const now = new Date()
  const diffInMinutes = Math.floor((now - date) / (1000 * 60))
  
  if (diffInMinutes < 1) return 'À l\'instant'
  if (diffInMinutes < 60) return `Il y a ${diffInMinutes} min`
  
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `Il y a ${diffInHours}h`
  
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) return `Il y a ${diffInDays}j`
  
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short'
  })
}
</script>

<style scoped>
.activity-summary {
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
  display: flex;
  flex-direction: column;
}

.activities-list {
  flex: 1;
  space-y: 0.75rem;
}

.activity-item {
  @apply flex items-center gap-3 p-3 bg-base-200 rounded-lg hover:bg-base-300 transition-colors;
}

.activity-icon {
  @apply flex-shrink-0 w-8 h-8 flex items-center justify-center;
}

.activity-details {
  @apply flex-1 min-w-0;
}

.activity-action {
  @apply font-medium text-base-content;
}

.activity-resource {
  @apply text-sm text-base-content/70 truncate;
}

.activity-time {
  @apply text-xs text-base-content/50;
}

.activity-status {
  @apply flex-shrink-0;
}

.widget-footer {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid oklch(var(--bc) / 0.1);
}

.loading-state,
.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>