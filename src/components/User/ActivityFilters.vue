<template>
  <div class="activity-filters">
    <div class="filter-section">
      <h3 class="filter-title">Filtrer par période</h3>
      
      <!-- Period Filter Buttons -->
      <div class="filter-buttons">
        <button 
          @click="filterByPeriod('today')" 
          :class="{ 
            'active': activePeriod === 'today',
            'filter-btn': true,
            'filter-btn-primary': activePeriod === 'today',
            'filter-btn-secondary': activePeriod !== 'today'
          }"
          :aria-pressed="activePeriod === 'today'"
        >
          <i class="fas fa-calendar-day"></i>
          Aujourd'hui
        </button>
        
        <button 
          @click="filterByPeriod('week')" 
          :class="{ 
            'active': activePeriod === 'week',
            'filter-btn': true,
            'filter-btn-primary': activePeriod === 'week',
            'filter-btn-secondary': activePeriod !== 'week'
          }"
          :aria-pressed="activePeriod === 'week'"
        >
          <i class="fas fa-calendar-week"></i>
          Cette semaine
        </button>
        
        <button 
          @click="filterByPeriod('month')" 
          :class="{ 
            'active': activePeriod === 'month',
            'filter-btn': true,
            'filter-btn-primary': activePeriod === 'month',
            'filter-btn-secondary': activePeriod !== 'month'
          }"
          :aria-pressed="activePeriod === 'month'"
        >
          <i class="fas fa-calendar-alt"></i>
          Ce mois
        </button>
      </div>

      <!-- Custom Date Picker -->
      <div class="date-picker-section">
        <label for="custom-date" class="date-label">
          <i class="fas fa-calendar"></i>
          Date précise :
        </label>
        <input 
          id="custom-date"
          type="date" 
          v-model="customDate" 
          @change="filterByCustomDate"
          class="date-input"
          :max="today"
        />
      </div>

      <!-- Action Type Filter -->
      <div class="action-filter-section">
        <label for="action-filter" class="action-label">
          <i class="fas fa-filter"></i>
          Type d'action :
        </label>
        <select 
          id="action-filter"
          v-model="selectedAction" 
          @change="filterByAction"
          class="action-select"
        >
          <option value="">Toutes les actions</option>
          <option value="login">Connexion</option>
          <option value="logout">Déconnexion</option>
          <option value="file_download">Téléchargement</option>
          <option value="file_upload">Upload</option>
          <option value="file_delete">Suppression</option>
          <option value="file_rename">Renommage</option>
          <option value="folder_create">Création dossier</option>
          <option value="navigation">Navigation</option>
        </select>
      </div>

      <!-- Clear Filters -->
      <div class="clear-filters-section" v-if="hasActiveFilters">
        <button 
          @click="clearAllFilters" 
          class="clear-btn"
          title="Effacer tous les filtres"
        >
          <i class="fas fa-times-circle"></i>
          Effacer les filtres
        </button>
      </div>
    </div>

    <!-- Active Filters Display -->
    <div class="active-filters" v-if="hasActiveFilters">
      <span class="active-filters-label">Filtres actifs :</span>
      <div class="filter-tags">
        <span v-if="activePeriod" class="filter-tag">
          {{ getPeriodLabel(activePeriod) }}
          <button @click="clearPeriodFilter" class="remove-filter">
            <i class="fas fa-times"></i>
          </button>
        </span>
        <span v-if="customDate" class="filter-tag">
          {{ formatDate(customDate) }}
          <button @click="clearDateFilter" class="remove-filter">
            <i class="fas fa-times"></i>
          </button>
        </span>
        <span v-if="selectedAction" class="filter-tag">
          {{ getActionLabel(selectedAction) }}
          <button @click="clearActionFilter" class="remove-filter">
            <i class="fas fa-times"></i>
          </button>
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

// Props
const props = defineProps({
  initialFilters: {
    type: Object,
    default: () => ({})
  }
})

// Emits
const emit = defineEmits(['filter-changed', 'filters-cleared'])

// Reactive data
const activePeriod = ref(props.initialFilters.period || '')
const customDate = ref(props.initialFilters.date || '')
const selectedAction = ref(props.initialFilters.action || '')

// Computed
const today = computed(() => {
  return new Date().toISOString().split('T')[0]
})

const hasActiveFilters = computed(() => {
  return activePeriod.value || customDate.value || selectedAction.value
})

// Methods
const filterByPeriod = (period) => {
  activePeriod.value = period
  customDate.value = '' // Clear custom date when using period
  emitFilterChange()
}

const filterByCustomDate = () => {
  if (customDate.value) {
    activePeriod.value = '' // Clear period when using custom date
    emitFilterChange()
  }
}

const filterByAction = () => {
  emitFilterChange()
}

const clearPeriodFilter = () => {
  activePeriod.value = ''
  emitFilterChange()
}

const clearDateFilter = () => {
  customDate.value = ''
  emitFilterChange()
}

const clearActionFilter = () => {
  selectedAction.value = ''
  emitFilterChange()
}

const clearAllFilters = () => {
  activePeriod.value = ''
  customDate.value = ''
  selectedAction.value = ''
  emitFilterChange()
  emit('filters-cleared')
}

const emitFilterChange = () => {
  const filters = {
    period: activePeriod.value,
    date: customDate.value,
    action: selectedAction.value
  }
  
  // Remove empty values
  Object.keys(filters).forEach(key => {
    if (!filters[key]) {
      delete filters[key]
    }
  })
  
  emit('filter-changed', filters)
}

const getPeriodLabel = (period) => {
  const labels = {
    'today': 'Aujourd\'hui',
    'week': 'Cette semaine',
    'month': 'Ce mois'
  }
  return labels[period] || period
}

const getActionLabel = (action) => {
  const labels = {
    'login': 'Connexion',
    'logout': 'Déconnexion',
    'file_download': 'Téléchargement',
    'file_upload': 'Upload',
    'file_delete': 'Suppression',
    'file_rename': 'Renommage',
    'folder_create': 'Création dossier',
    'navigation': 'Navigation'
  }
  return labels[action] || action
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// Watch for prop changes
watch(() => props.initialFilters, (newFilters) => {
  activePeriod.value = newFilters.period || ''
  customDate.value = newFilters.date || ''
  selectedAction.value = newFilters.action || ''
}, { deep: true })
</script>

<style scoped>
.activity-filters {
  @apply bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6;
}

.filter-section {
  @apply space-y-6;
}

.filter-title {
  @apply text-lg font-semibold text-gray-800 mb-4;
}

.filter-buttons {
  @apply flex flex-wrap gap-3;
}

.filter-btn {
  @apply px-4 py-2 rounded-lg font-medium transition-all duration-200 
         flex items-center gap-2 border focus:outline-none focus:ring-2 focus:ring-blue-500;
}

.filter-btn-primary {
  @apply bg-blue-600 text-white border-blue-600 hover:bg-blue-700;
}

.filter-btn-secondary {
  @apply bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200;
}

.date-picker-section {
  @apply flex flex-col sm:flex-row sm:items-center gap-3;
}

.date-label {
  @apply text-sm font-medium text-gray-700 flex items-center gap-2;
}

.date-input {
  @apply px-3 py-2 border border-gray-300 rounded-lg focus:outline-none 
         focus:ring-2 focus:ring-blue-500 focus:border-blue-500;
}

.action-filter-section {
  @apply flex flex-col sm:flex-row sm:items-center gap-3;
}

.action-label {
  @apply text-sm font-medium text-gray-700 flex items-center gap-2;
}

.action-select {
  @apply px-3 py-2 border border-gray-300 rounded-lg focus:outline-none 
         focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white;
}

.clear-filters-section {
  @apply pt-4 border-t border-gray-200;
}

.clear-btn {
  @apply px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 
         transition-colors duration-200 flex items-center gap-2 font-medium;
}

.active-filters {
  @apply mt-6 pt-4 border-t border-gray-200;
}

.active-filters-label {
  @apply text-sm font-medium text-gray-700 mb-2 block;
}

.filter-tags {
  @apply flex flex-wrap gap-2;
}

.filter-tag {
  @apply inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 
         rounded-full text-sm font-medium;
}

.remove-filter {
  @apply text-blue-600 hover:text-blue-800 transition-colors duration-200;
}

/* Mobile responsiveness */
@media (max-width: 640px) {
  .filter-buttons {
    @apply flex-col;
  }
  
  .filter-btn {
    @apply w-full justify-center;
  }
  
  .date-picker-section,
  .action-filter-section {
    @apply flex-col items-start;
  }
}
</style>