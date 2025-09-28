<!-- components/User/widgets/StorageInfoWidget.vue -->
<template>
  <div class="storage-info-widget">
    <div class="widget-header">
      <h3 class="widget-title">
        <i class="fas fa-hdd mr-2"></i>
        Stockage
      </h3>
    </div>
    
    <div class="widget-content">
      <div v-if="loading" class="loading-state">
        <div class="flex items-center justify-center py-8">
          <span class="loading loading-spinner loading-md"></span>
          <span class="ml-2">Chargement...</span>
        </div>
      </div>
      
      <div v-else class="storage-details">
        <!-- Usage Circle -->
        <div class="storage-circle">
          <div class="radial-progress text-primary" :style="{ '--value': usage.percentage }" role="progressbar">
            <span class="text-lg font-bold">{{ usage.percentage }}%</span>
          </div>
        </div>
        
        <!-- Storage Stats -->
        <div class="storage-stats">
          <div class="stat-item">
            <div class="stat-label">Utilisé</div>
            <div class="stat-value text-primary">{{ formatBytes(usage.used) }}</div>
          </div>
          
          <div class="stat-item">
            <div class="stat-label">Total</div>
            <div class="stat-value">{{ formatBytes(usage.total) }}</div>
          </div>
          
          <div class="stat-item">
            <div class="stat-label">Disponible</div>
            <div class="stat-value text-success">{{ formatBytes(usage.total - usage.used) }}</div>
          </div>
        </div>
        
        <!-- Storage Bar -->
        <div class="storage-bar">
          <div class="progress-container">
            <progress 
              class="progress progress-primary w-full" 
              :value="usage.percentage" 
              max="100"
            ></progress>
          </div>
          <div class="storage-bar-labels">
            <span class="text-xs text-base-content/60">{{ formatBytes(usage.used) }} utilisé</span>
            <span class="text-xs text-base-content/60">{{ formatBytes(usage.total) }} total</span>
          </div>
        </div>
        
        <!-- Storage Status -->
        <div class="storage-status">
          <div 
            class="alert alert-sm"
            :class="{
              'alert-success': usage.percentage < 70,
              'alert-warning': usage.percentage >= 70 && usage.percentage < 90,
              'alert-error': usage.percentage >= 90
            }"
          >
            <i 
              :class="{
                'fas fa-check-circle': usage.percentage < 70,
                'fas fa-exclamation-triangle': usage.percentage >= 70 && usage.percentage < 90,
                'fas fa-exclamation-circle': usage.percentage >= 90
              }"
            ></i>
            <span>{{ getStorageStatusMessage() }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  usage: {
    type: Object,
    default: () => ({
      used: 0,
      total: 0,
      percentage: 0
    })
  },
  loading: {
    type: Boolean,
    default: false
  }
})

// Utility methods
const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

const getStorageStatusMessage = () => {
  const percentage = props.usage.percentage
  
  if (percentage < 70) {
    return 'Espace de stockage suffisant'
  } else if (percentage < 90) {
    return 'Attention: espace de stockage limité'
  } else {
    return 'Critique: espace de stockage presque plein'
  }
}
</script>

<style scoped>
.storage-info-widget {
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

.storage-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.storage-circle {
  display: flex;
  justify-content: center;
  align-items: center;
}

.radial-progress {
  --size: 6rem;
  --thickness: 4px;
}

.storage-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  text-align: center;
}

.stat-item {
  @apply p-3 bg-base-200 rounded-lg;
}

.stat-label {
  @apply text-xs text-base-content/60 uppercase tracking-wider;
}

.stat-value {
  @apply text-sm font-semibold mt-1;
}

.storage-bar {
  @apply space-y-2;
}

.progress-container {
  @apply w-full;
}

.storage-bar-labels {
  @apply flex justify-between;
}

.storage-status {
  margin-top: auto;
}

.loading-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .storage-stats {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }
  
  .stat-item {
    padding: 0.75rem;
  }
  
  .radial-progress {
    --size: 4rem;
  }
}
</style>