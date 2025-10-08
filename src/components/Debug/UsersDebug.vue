<template>
  <div class="card bg-base-100 shadow-xl">
    <div class="card-body">
      <h2 class="card-title text-info">
        <i class="fas fa-users"></i>
        Debug Utilisateurs
      </h2>
      
      <div class="space-y-4">
        <!-- État du chargement -->
        <div class="alert alert-info">
          <div>
            <h3 class="font-bold">État du chargement</h3>
            <div class="text-sm space-y-1">
              <div><strong>Nombre d'utilisateurs:</strong> {{ users.length }}</div>
              <div><strong>Chargement:</strong> {{ loading ? 'En cours...' : 'Terminé' }}</div>
              <div><strong>Erreur:</strong> {{ error || 'Aucune' }}</div>
            </div>
          </div>
        </div>

        <!-- Liste des utilisateurs -->
        <div v-if="users.length > 0">
          <h3 class="font-bold mb-2">Utilisateurs chargés</h3>
          <div class="overflow-x-auto">
            <table class="table table-zebra table-compact w-full">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Username</th>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="user in users" :key="user.id">
                  <td>{{ user.id }}</td>
                  <td>{{ user.username || 'N/A' }}</td>
                  <td>{{ user.user || 'N/A' }}</td>
                  <td>{{ user.email || 'N/A' }}</td>
                  <td>{{ user.role || 'N/A' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Test du select -->
        <div>
          <h3 class="font-bold mb-2">Test du select</h3>
          <div class="form-control w-full max-w-xs">
            <label class="label">
              <span class="label-text">Sélectionner un utilisateur</span>
            </label>
            <select v-model="selectedUserId" class="select select-bordered select-sm">
              <option value="">Tous les utilisateurs</option>
              <option v-for="user in users" :key="user.id" :value="user.id">
                {{ user.username || user.user || `User ${user.id}` }}
              </option>
            </select>
          </div>
          <div v-if="selectedUserId" class="mt-2 text-sm">
            <strong>Utilisateur sélectionné:</strong> {{ getSelectedUserInfo() }}
          </div>
        </div>

        <!-- Actions -->
        <div class="divider">Actions</div>
        <div class="flex gap-2">
          <button @click="loadUsers" class="btn btn-sm btn-primary" :disabled="loading">
            <i class="fas fa-refresh"></i>
            Recharger utilisateurs
          </button>
          <button @click="testAPI" class="btn btn-sm btn-info">
            <i class="fas fa-flask"></i>
            Test API
          </button>
        </div>

        <!-- Logs -->
        <div v-if="logs.length > 0">
          <h3 class="font-bold mb-2">Logs de debug</h3>
          <div class="bg-base-300 p-3 rounded max-h-40 overflow-y-auto">
            <div v-for="(log, index) in logs" :key="index" class="text-xs font-mono mb-1">
              <span class="text-base-content/60">{{ log.timestamp }}</span>
              <span :class="getLogColor(log.type)">{{ log.message }}</span>
            </div>
          </div>
          <button @click="clearLogs" class="btn btn-xs btn-ghost mt-2">
            <i class="fas fa-trash"></i>
            Vider les logs
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { adminAPI } from '@/services/api'

// État local
const users = ref([])
const loading = ref(false)
const error = ref(null)
const selectedUserId = ref('')
const logs = ref([])

// Méthodes utilitaires
const addLog = (message, type = 'info') => {
  const timestamp = new Date().toLocaleTimeString()
  logs.value.push({
    timestamp,
    message,
    type
  })
  
  // Garder seulement les 20 derniers logs
  if (logs.value.length > 20) {
    logs.value = logs.value.slice(-20)
  }
}

const getLogColor = (type) => {
  const colors = {
    info: 'text-info',
    success: 'text-success',
    error: 'text-error',
    warning: 'text-warning'
  }
  return colors[type] || 'text-base-content'
}

const clearLogs = () => {
  logs.value = []
}

const getSelectedUserInfo = () => {
  const user = users.value.find(u => u.id == selectedUserId.value)
  if (!user) return 'Utilisateur non trouvé'
  
  return `ID: ${user.id}, Username: ${user.username || 'N/A'}, User: ${user.user || 'N/A'}`
}

// Méthodes principales
const loadUsers = async () => {
  loading.value = true
  error.value = null
  addLog('🔄 Chargement des utilisateurs...', 'info')
  
  try {
    const response = await adminAPI.getUsers()
    users.value = response.data || []
    addLog(`✅ ${users.value.length} utilisateurs chargés`, 'success')
    
    // Log des détails des premiers utilisateurs
    if (users.value.length > 0) {
      const firstUser = users.value[0]
      addLog(`📊 Premier utilisateur: ${JSON.stringify(firstUser)}`, 'info')
    }
  } catch (err) {
    error.value = err.message
    addLog(`❌ Erreur: ${err.message}`, 'error')
  } finally {
    loading.value = false
  }
}

const testAPI = async () => {
  addLog('🧪 Test de l\'API adminAPI.getUsers()', 'info')
  
  try {
    const response = await adminAPI.getUsers()
    addLog(`📡 Réponse API: ${JSON.stringify(response, null, 2)}`, 'info')
  } catch (err) {
    addLog(`❌ Erreur API: ${err.message}`, 'error')
  }
}

// Lifecycle
onMounted(() => {
  addLog('🚀 Composant de debug monté', 'info')
  loadUsers()
})
</script>