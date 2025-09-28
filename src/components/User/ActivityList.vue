<template>
  <div class="activity-list">
    <!-- Loading State -->
    <div v-if="loading && activities.length === 0" class="loading-state">
      <div class="loading-spinner">
        <i class="fas fa-spinner fa-spin text-2xl text-blue-600"></i>
      </div>
      <p class="loading-text">Chargement des activités...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="!loading && activities.length === 0" class="empty-state">
      <div class="empty-icon">
        <i class="fas fa-history text-4xl text-gray-400"></i>
      </div>
      <h3 class="empty-title">Aucune activité trouvée</h3>
      <p class="empty-description">
        {{ hasFilters ? 'Aucune activité ne correspond aux filtres sélectionnés.' : 'Vous n\'avez pas encore d\'activité enregistrée.' }}
      </p>
      <button 
        v-if="hasFilters" 
        @click="$emit('clear-filters')"
        class="clear-filters-btn"
      >
        <i class="fas fa-times-circle"></i>
        Effacer les filtres
      </button>
    </div>

    <!-- Activity Items -->
    <div v-else class="activities-container">
      <div class="activities-header">
        <h3 class="activities-title">
          <i class="fas fa-history"></i>
          Historique d'activité
        </h3>
        <span class="activities-count">{{ totalCount }} activité(s)</span>
      </div>

      <div class="activities-list">
        <div 
          v-for="activity in activities" 
          :key="activity.id"
          class="activity-item"
          :class="{ 'activity-failed': !activity.success }"
          @mouseenter="showTooltip(activity, $event)"
          @mouseleave="hideTooltip"
        >
          <!-- Activity Icon -->
          <div class="activity-icon">
            <i :class="getActivityIcon(activity)" :style="{ color: getActivityColor(activity) }"></i>
            <div v-if="!activity.success" class="error-indicator">
              <i class="fas fa-exclamation-triangle text-red-500"></i>
            </div>
          </div>

          <!-- Activity Content -->
          <div class="activity-content">
            <div class="activity-main">
              <span class="activity-action">{{ getActivityDescription(activity) }}</span>
              <span v-if="activity.resource" class="activity-resource">{{ activity.resource }}</span>
            </div>
            
            <div class="activity-meta">
              <span class="activity-time">
                <i class="fas fa-clock"></i>
                {{ formatTime(activity.created_at) }}
              </span>
              <span v-if="activity.ip_address" class="activity-ip">
                <i class="fas fa-globe"></i>
                {{ activity.ip_address }}
              </span>
            </div>

            <!-- Error Message -->
            <div v-if="!activity.success && activity.error_message" class="activity-error">
              <i class="fas fa-exclamation-circle"></i>
              {{ activity.error_message }}
            </div>
          </div>

          <!-- Activity Status -->
          <div class="activity-status">
            <span 
              v-if="activity.success" 
              class="status-success"
              title="Action réussie"
            >
              <i class="fas fa-check-circle"></i>
            </span>
            <span 
              v-else 
              class="status-failed"
              title="Action échouée"
            >
              <i class="fas fa-times-circle"></i>
            </span>
          </div>
        </div>
      </div>

      <!-- Load More Button -->
      <div v-if="hasMore" class="load-more-section">
        <button 
          @click="$emit('load-more')"
          :disabled="loading"
          class="load-more-btn"
        >
          <i v-if="loading" class="fas fa-spinner fa-spin"></i>
          <i v-else class="fas fa-chevron-down"></i>
          {{ loading ? 'Chargement...' : 'Charger plus d\'activités' }}
        </button>
      </div>

      <!-- Pagination Info -->
      <div v-if="showPagination" class="pagination-info">
        <span class="pagination-text">
          Affichage de {{ ((currentPage - 1) * itemsPerPage) + 1 }} à 
          {{ Math.min(currentPage * itemsPerPage, totalCount) }} sur {{ totalCount }} activités
        </span>
      </div>
    </div>

    <!-- Tooltip -->
    <div 
      v-if="tooltip.show" 
      ref="tooltipRef"
      class="activity-tooltip"
      :style="tooltip.style"
    >
      <div class="tooltip-content">
        <div class="tooltip-header">
          <strong>{{ getActivityDescription(tooltip.activity) }}</strong>
        </div>
        <div class="tooltip-details">
          <div v-if="tooltip.activity.resource">
            <strong>Ressource :</strong> {{ tooltip.activity.resource }}
          </div>
          <div>
            <strong>Date :</strong> {{ formatFullDate(tooltip.activity.created_at) }}
          </div>
          <div v-if="tooltip.activity.user_agent">
            <strong>Navigateur :</strong> {{ getBrowserInfo(tooltip.activity.user_agent) }}
          </div>
          <div v-if="tooltip.activity.details">
            <strong>Détails :</strong>
            <pre class="tooltip-json">{{ JSON.stringify(tooltip.activity.details, null, 2) }}</pre>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'

// Props
const props = defineProps({
  activities: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  hasMore: {
    type: Boolean,
    default: false
  },
  totalCount: {
    type: Number,
    default: 0
  },
  currentPage: {
    type: Number,
    default: 1
  },
  itemsPerPage: {
    type: Number,
    default: 20
  },
  hasFilters: {
    type: Boolean,
    default: false
  },
  showPagination: {
    type: Boolean,
    default: true
  }
})

// Emits
const emit = defineEmits(['load-more', 'clear-filters'])

// Reactive data
const tooltip = ref({
  show: false,
  activity: null,
  style: {}
})

const tooltipRef = ref(null)

// Methods
const getActivityIcon = (activity) => {
  const icons = {
    'login': 'fas fa-sign-in-alt',
    'logout': 'fas fa-sign-out-alt',
    'file_download': 'fas fa-download',
    'file_upload': 'fas fa-upload',
    'file_delete': 'fas fa-trash',
    'file_rename': 'fas fa-edit',
    'folder_create': 'fas fa-folder-plus',
    'folder_delete': 'fas fa-folder-minus',
    'navigation': 'fas fa-compass',
    'favorite_add': 'fas fa-star',
    'favorite_remove': 'fas fa-star-o'
  }
  return icons[activity.action] || 'fas fa-info-circle'
}

const getActivityColor = (activity) => {
  if (!activity.success) return '#ef4444' // red-500
  
  const colors = {
    'login': '#10b981', // green-500
    'logout': '#f59e0b', // amber-500
    'file_download': '#3b82f6', // blue-500
    'file_upload': '#8b5cf6', // violet-500
    'file_delete': '#ef4444', // red-500
    'file_rename': '#f59e0b', // amber-500
    'folder_create': '#10b981', // green-500
    'folder_delete': '#ef4444', // red-500
    'navigation': '#6b7280', // gray-500
    'favorite_add': '#f59e0b', // amber-500
    'favorite_remove': '#6b7280' // gray-500
  }
  return colors[activity.action] || '#6b7280'
}

const getActivityDescription = (activity) => {
  const descriptions = {
    'login': 'Connexion',
    'logout': 'Déconnexion',
    'file_download': 'Téléchargement de fichier',
    'file_upload': 'Upload de fichier',
    'file_delete': 'Suppression de fichier',
    'file_rename': 'Renommage de fichier',
    'folder_create': 'Création de dossier',
    'folder_delete': 'Suppression de dossier',
    'navigation': 'Navigation',
    'favorite_add': 'Ajout aux favoris',
    'favorite_remove': 'Suppression des favoris'
  }
  return descriptions[activity.action] || activity.action
}

const formatTime = (timestamp) => {
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
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

const formatFullDate = (timestamp) => {
  const date = new Date(timestamp)
  return date.toLocaleString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

const getBrowserInfo = (userAgent) => {
  if (!userAgent) return 'Inconnu'
  
  if (userAgent.includes('Chrome')) return 'Chrome'
  if (userAgent.includes('Firefox')) return 'Firefox'
  if (userAgent.includes('Safari')) return 'Safari'
  if (userAgent.includes('Edge')) return 'Edge'
  
  return 'Autre'
}

const showTooltip = async (activity, event) => {
  tooltip.value.activity = activity
  tooltip.value.show = true
  
  await nextTick()
  
  const rect = event.target.getBoundingClientRect()
  const tooltipRect = tooltipRef.value?.getBoundingClientRect()
  
  if (tooltipRect) {
    let left = rect.left + rect.width / 2 - tooltipRect.width / 2
    let top = rect.top - tooltipRect.height - 10
    
    // Adjust if tooltip goes off screen
    if (left < 10) left = 10
    if (left + tooltipRect.width > window.innerWidth - 10) {
      left = window.innerWidth - tooltipRect.width - 10
    }
    if (top < 10) {
      top = rect.bottom + 10
    }
    
    tooltip.value.style = {
      left: `${left}px`,
      top: `${top}px`,
      position: 'fixed',
      zIndex: 1000
    }
  }
}

const hideTooltip = () => {
  tooltip.value.show = false
  tooltip.value.activity = null
}
</script>

<style scoped>
.activity-list {
  @apply bg-white rounded-lg shadow-sm border border-gray-200;
}

/* Loading State */
.loading-state {
  @apply flex flex-col items-center justify-center py-12;
}

.loading-spinner {
  @apply mb-4;
}

.loading-text {
  @apply text-gray-600 text-sm;
}

/* Empty State */
.empty-state {
  @apply flex flex-col items-center justify-center py-12 px-6 text-center;
}

.empty-icon {
  @apply mb-4;
}

.empty-title {
  @apply text-lg font-semibold text-gray-800 mb-2;
}

.empty-description {
  @apply text-gray-600 mb-4 max-w-md;
}

.clear-filters-btn {
  @apply px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
         transition-colors duration-200 flex items-center gap-2;
}

/* Activities Container */
.activities-container {
  @apply p-6;
}

.activities-header {
  @apply flex items-center justify-between mb-6 pb-4 border-b border-gray-200;
}

.activities-title {
  @apply text-lg font-semibold text-gray-800 flex items-center gap-2;
}

.activities-count {
  @apply text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full;
}

/* Activity Items */
.activities-list {
  @apply space-y-4;
}

.activity-item {
  @apply flex items-start gap-4 p-4 rounded-lg border border-gray-200 
         hover:border-gray-300 hover:shadow-sm transition-all duration-200 cursor-pointer;
}

.activity-failed {
  @apply border-red-200 bg-red-50;
}

.activity-icon {
  @apply relative flex-shrink-0 w-10 h-10 flex items-center justify-center 
         bg-gray-100 rounded-full;
}

.error-indicator {
  @apply absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full 
         flex items-center justify-center;
}

.activity-content {
  @apply flex-1 min-w-0;
}

.activity-main {
  @apply flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mb-2;
}

.activity-action {
  @apply font-medium text-gray-800;
}

.activity-resource {
  @apply text-sm text-gray-600 truncate;
}

.activity-meta {
  @apply flex flex-wrap items-center gap-4 text-xs text-gray-500;
}

.activity-time,
.activity-ip {
  @apply flex items-center gap-1;
}

.activity-error {
  @apply mt-2 p-2 bg-red-100 border border-red-200 rounded text-sm text-red-700 
         flex items-start gap-2;
}

.activity-status {
  @apply flex-shrink-0;
}

.status-success {
  @apply text-green-500 text-lg;
}

.status-failed {
  @apply text-red-500 text-lg;
}

/* Load More */
.load-more-section {
  @apply mt-6 text-center;
}

.load-more-btn {
  @apply px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 
         transition-colors duration-200 flex items-center gap-2 mx-auto
         disabled:opacity-50 disabled:cursor-not-allowed;
}

/* Pagination */
.pagination-info {
  @apply mt-4 pt-4 border-t border-gray-200 text-center;
}

.pagination-text {
  @apply text-sm text-gray-600;
}

/* Tooltip */
.activity-tooltip {
  @apply bg-gray-900 text-white rounded-lg shadow-lg p-3 max-w-sm;
}

.tooltip-content {
  @apply space-y-2;
}

.tooltip-header {
  @apply text-sm font-medium;
}

.tooltip-details {
  @apply text-xs space-y-1;
}

.tooltip-json {
  @apply text-xs bg-gray-800 p-2 rounded mt-1 overflow-x-auto;
}

/* Mobile responsiveness */
@media (max-width: 640px) {
  .activities-header {
    @apply flex-col items-start gap-2;
  }
  
  .activity-item {
    @apply flex-col gap-3;
  }
  
  .activity-icon {
    @apply self-start;
  }
  
  .activity-main {
    @apply flex-col items-start;
  }
  
  .activity-meta {
    @apply flex-col items-start gap-1;
  }
}
</style>