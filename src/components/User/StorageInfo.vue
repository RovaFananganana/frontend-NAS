<template>
  <section class="p-4 bg-base-100 rounded-lg border border-base-300">
      <div v-if="error" class="alert alert-error">{{ error }}</div>

    <div v-else>
      <div class="flex items-center gap-4">
        <div class="flex-1">
          <div class="w-full bg-base-200 rounded-full h-4 overflow-hidden">
            <div :style="{ width: percent + '%' }" class="h-4 bg-primary rounded-full"></div>
          </div>
          <div class="text-sm text-base-content opacity-70 mt-2">{{ human(used) }} utilisés sur {{ human(total) }} ({{ percent }}%)</div>
        </div>
        <div class="text-right">
          <div class="text-sm">Fichiers</div>
          <div class="font-semibold">{{ stats.files ?? '—' }}</div>
        </div>
      </div>

      <div class="mt-3 text-sm text-gray-500">
        <div>Quota: {{ human(quota) }}</div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { userAPI } from '@/services/api'

const stats = ref({})
const error = ref('')
const loading = ref(false)

const used = computed(() => stats.value.used_bytes ?? 0)
const total = computed(() => stats.value.total_bytes ?? 0)
const quota = computed(() => stats.value.quota_bytes ?? total.value)

const percent = computed(() => {
  if (!total.value) return 0
  return Math.round((used.value / total.value) * 100)
})

function human(v) {
  if (v === 0) return '0 B'
  if (!v) return '—'
  const i = Math.floor(Math.log(v) / Math.log(1024))
  const sizes = ['B','KB','MB','GB','TB']
  return `${(v / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await userAPI.getStorageInfo()
    // expect { used_bytes, total_bytes, quota_bytes, files }
    Object.assign(stats.value, data || {})
  } catch (e) {
    error.value = e?.response?.data?.message || e?.message || 'Erreur récupération stockage'
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.alert-error { @apply bg-red-50 border border-red-200 text-red-700 p-2 rounded; }
.bg-primary { background-color: theme('colors.blue.500'); }
</style>
