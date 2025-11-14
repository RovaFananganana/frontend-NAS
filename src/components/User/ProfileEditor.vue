<template>
  <section class="p-4 bg-white rounded-lg border max-w-2xl">
    <h3 class="text-lg font-semibold mb-4">Mon profil</h3>

    <div v-if="error" class="alert alert-error mb-3">{{ error }}</div>

    <!-- Basic info -->
    <div class="grid grid-cols-1 gap-3">
      <div>
        <label class="text-sm">Nom d'utilisateur</label>
        <input v-model="form.username" class="input w-full" disabled />
      </div>
      <div>
        <label class="text-sm">Rôle</label>
        <input v-model="form.role" class="input w-full" disabled />
      </div>
    </div>

    <!-- Section Stockage -->
    <div class="divider mt-6">Stockage</div>
    
    <div class="bg-base-100 p-4 rounded-lg border border-base-300">
      <div class="grid grid-cols-3 gap-4 text-center mb-4">
        <div>
          <div class="text-2xl font-bold text-info">{{ formatBytes(storage.used) }}</div>
          <div class="text-xs opacity-70">Utilisé</div>
        </div>
        <div>
          <div class="text-2xl font-bold text-warning">{{ formatBytes(storage.quota) }}</div>
          <div class="text-xs opacity-70">Quota</div>
        </div>
        <div>
          <div class="text-2xl font-bold" :class="storage.percentage > 90 ? 'text-error' : 'text-success'">
            {{ storage.percentage }}%
          </div>
          <div class="text-xs opacity-70">Utilisation</div>
        </div>
      </div>

      <!-- Progress Bar -->
      <div class="w-full">
        <progress 
          class="progress w-full"
          :class="{
            'progress-success': storage.percentage < 70,
            'progress-warning': storage.percentage >= 70 && storage.percentage < 90,
            'progress-error': storage.percentage >= 90
          }"
          :value="storage.percentage" 
          max="100"
        ></progress>
      </div>

      <!-- Storage status message -->
      <div class="mt-3 text-xs text-center">
        <div v-if="storage.percentage < 70" class="text-success">
          ✓ Espace de stockage suffisant
        </div>
        <div v-else-if="storage.percentage < 90" class="text-warning">
          ⚠ Attention: espace limité
        </div>
        <div v-else class="text-error">
          ⛔ Critique: espace presque plein
        </div>
      </div>
    </div>

    <!-- Close button -->
    <div class="flex justify-end gap-2 mt-6">
      <button class="btn" @click="close">Fermer</button>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { userAPI } from '@/services/api'

const form = ref({ username: '', role: '' })
const storage = ref({ used: 0, quota: 0, percentage: 0 })
const error = ref('')

function formatBytes(bytes) {
  if (bytes === 0) return '0 B'
  if (!bytes) return '—'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

async function loadStorage() {
  try {
    const { data } = await userAPI.getStorageInfo()
    if (data) {
      storage.value.used = data.used_bytes || 0
      storage.value.quota = data.quota_bytes || data.total_bytes || 0
      storage.value.percentage = data.usage_percentage || 0
      console.log('Storage info loaded:', storage.value)
    }
  } catch (e) {
    console.error('Error loading storage info:', e)
  }
}

async function load() {
  error.value = ''
  try {
    const { data } = await userAPI.getProfile()
    form.value.username = data.username || ''
    form.value.role = data.role || ''
    await loadStorage()
  } catch (e) {
    error.value = e?.response?.data?.message || e?.message || 'Erreur récupération profil'
  }
}

function close() {
  // Close/reset the profile editor - could emit an event or just reload
  load()
}

onMounted(load)
</script>

<style scoped>
/* Boutons */
.btn {
  @apply px-3 py-2 rounded border transition-all duration-200;
}

/* Inputs */
.input {
  @apply border rounded px-3 py-2 transition-colors duration-200;
  @apply disabled:opacity-60 disabled:cursor-not-allowed;
}

/* Hover enhancements */
.btn:hover {
  @apply shadow-md;
}

/* Alerts */
.alert-error {
  @apply bg-red-50 border border-red-200 text-red-700 p-2 rounded;
}
</style>

