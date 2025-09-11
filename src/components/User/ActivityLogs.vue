<template>
  <section class="p-4 bg-white rounded-lg border">
    <header class="flex items-center justify-between mb-3">
       <div class="text-sm text-gray-500">Total : {{ total }}</div>
    </header>

    <div v-if="error" class="alert alert-error">{{ error }}</div>

    <div class="space-y-2">
      <div v-for="log in logs" :key="log.id" class="p-2 bg-gray-50 rounded">
        <div class="text-sm text-gray-600">{{ formatDate(log.created_at) }} — {{ log.action }}</div>
        <div class="text-xs text-gray-700">{{ log.details }}</div>
      </div>
    </div>

    <div class="flex items-center justify-between mt-4">
      <div class="text-sm text-gray-500">Page {{ page }} / {{ totalPages }}</div>
      <div class="space-x-2">
        <button class="btn" :disabled="page<=1" @click="go(page-1)">Précédent</button>
        <button class="btn" :disabled="page>=totalPages" @click="go(page+1)">Suivant</button>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { userAPI } from '@/services/api'

const page = ref(1)
const perPage = ref(20)
const logs = ref([])
const total = ref(0)
const error = ref('')

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / perPage.value)))

function formatDate(v) {
  if (!v) return '—'
  return new Date(v).toLocaleString()
}

async function load() {
  error.value = ''
  try {
    const { data } = await userAPI.getLogs(page.value, perPage.value)
    // expect { items, total }
    logs.value = data?.items || data || []
    total.value = data?.total ?? logs.value.length
  } catch (e) {
    error.value = e?.response?.data?.message || e?.message || 'Erreur récupération journaux'
  }
}

function go(p) {
  page.value = Math.min(Math.max(1, p), totalPages.value)
  load()
}

onMounted(load)
</script>

<style scoped>
.btn { @apply px-3 py-2 rounded border bg-white hover:bg-gray-50; }
.alert-error { @apply bg-red-50 border border-red-200 text-red-700 p-2 rounded; }
</style>
