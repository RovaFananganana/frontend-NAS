<template>
  <div class="sync-status">
    <!-- Sync Status Indicator -->
    <div class="flex items-center gap-2 text-sm">
      <div class="flex items-center gap-1">
        <div 
          class="w-2 h-2 rounded-full"
          :class="{
            'bg-success animate-pulse': syncStatus.connected && syncStatus.sync_in_progress,
            'bg-success': syncStatus.connected && !syncStatus.sync_in_progress,
            'bg-error': !syncStatus.connected,
            'bg-warning': syncStatus.errors.length > 0
          }"
        ></div>
        <span class="text-xs">
          {{ getStatusText() }}
        </span>
      </div>
      
      <!-- Sync Progress -->
      <div v-if="syncStatus.sync_in_progress" class="flex items-center gap-1">
        <div class="loading loading-spinner loading-xs"></div>
        <span class="text-xs">
          {{ syncStatus.pending_uploads + syncStatus.pending_downloads }} fichier(s)
        </span>
      </div>
      
      <!-- Last Sync Time -->
      <div v-if="syncStatus.last_sync" class="text-xs opacity-70">
        {{ formatLastSync(syncStatus.last_sync) }}
      </div>
      
      <!-- Force Sync Button -->
      <button 
        v-if="syncStatus.connected && !syncStatus.sync_in_progress"
        class="btn btn-xs btn-ghost"
        @click="forceSync"
        :disabled="loading"
        title="Forcer la synchronisation"
      >
        <i class="fas fa-sync-alt" :class="{ 'animate-spin': loading }"></i>
      </button>
      
      <!-- Synology Drive Link -->
      <button 
        class="btn btn-xs btn-ghost"
        @click="openSynologyDrive"
        title="Ouvrir Synology Drive"
      >
        <i class="fas fa-external-link-alt"></i>
      </button>
    </div>
    
    <!-- Error Messages -->
    <div v-if="syncStatus.errors.length > 0" class="mt-1">
      <div class="alert alert-warning alert-sm">
        <i class="fas fa-exclamation-triangle"></i>
        <div class="text-xs">
          {{ syncStatus.errors.length }} erreur(s) de synchronisation
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const syncStatus = ref({
  connected: false,
  last_sync: null,
  sync_in_progress: false,
  pending_uploads: 0,
  pending_downloads: 0,
  errors: []
})

const loading = ref(false)
const nasConfig = ref(null)
let statusInterval = null

const getStatusText = () => {
  if (!syncStatus.value.connected) return 'Déconnecté'
  if (syncStatus.value.sync_in_progress) return 'Synchronisation...'
  if (syncStatus.value.errors.length > 0) return 'Erreurs'
  return 'Synchronisé'
}

const formatLastSync = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  
  if (diffMins < 1) return 'À l\'instant'
  if (diffMins < 60) return `Il y a ${diffMins}min`
  if (diffMins < 1440) return `Il y a ${Math.floor(diffMins / 60)}h`
  return date.toLocaleDateString('fr-FR')
}

const loadSyncStatus = async () => {
  try {
    const response = await fetch('/nas/sync-status', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    
    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        syncStatus.value = result.status
      }
    }
  } catch (err) {
    console.error('Error loading sync status:', err)
  }
}

const loadNasConfig = async () => {
  try {
    const response = await fetch('/nas/config', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    
    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        nasConfig.value = result.config
      }
    }
  } catch (err) {
    console.error('Error loading NAS config:', err)
  }
}

const forceSync = async () => {
  loading.value = true
  
  try {
    const response = await fetch('/nas/force-sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ path: '/' })
    })
    
    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        // Refresh status after a short delay
        setTimeout(loadSyncStatus, 1000)
      }
    }
  } catch (err) {
    console.error('Error forcing sync:', err)
  } finally {
    loading.value = false
  }
}

const openSynologyDrive = () => {
  if (nasConfig.value?.drive_client_url) {
    // Try to open Synology Drive client
    window.location.href = nasConfig.value.drive_client_url
    
    // Fallback to web interface after a delay
    setTimeout(() => {
      if (nasConfig.value?.web_interface_url) {
        window.open(nasConfig.value.web_interface_url, '_blank')
      }
    }, 2000)
  }
}

onMounted(() => {
  loadSyncStatus()
  loadNasConfig()
  
  // Update status every 30 seconds
  statusInterval = setInterval(loadSyncStatus, 30000)
})

onUnmounted(() => {
  if (statusInterval) {
    clearInterval(statusInterval)
  }
})
</script>

<style scoped>
.sync-status {
  @apply flex items-center gap-2;
}
</style>