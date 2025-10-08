<template>
  <div class="card bg-base-100 shadow-xl">
    <div class="card-body">
      <h2 class="card-title text-info">
        <i class="fas fa-search"></i>
        Debug Structure des Logs
      </h2>
      
      <div class="space-y-4">
        <!-- Informations générales -->
        <div class="alert alert-info">
          <div>
            <h3 class="font-bold">Informations générales</h3>
            <div class="text-sm space-y-1">
              <div><strong>Nombre total de logs:</strong> {{ logs.length }}</div>
              <div><strong>Nombre d'utilisateurs:</strong> {{ users.length }}</div>
              <div><strong>Filtre utilisateur actuel:</strong> {{ filters.userId || 'Aucun' }}</div>
            </div>
          </div>
        </div>

        <!-- Structure du premier log -->
        <div v-if="logs.length > 0">
          <h3 class="font-bold mb-2">Structure du premier log</h3>
          <div class="bg-base-300 p-3 rounded">
            <pre class="text-xs">{{ JSON.stringify(logs[0], null, 2) }}</pre>
          </div>
        </div>

        <!-- Test de filtrage -->
        <div>
          <h3 class="font-bold mb-2">Test de filtrage</h3>
          <div class="form-control w-full max-w-xs">
            <label class="label">
              <span class="label-text">Tester le filtre utilisateur</span>
            </label>
            <select v-model="testUserId" class="select select-bordered select-sm" @change="testFilter">
              <option value="">Tous les utilisateurs</option>
              <option v-for="user in users" :key="user.id" :value="user.id">
                {{ user.username || user.user || `User ${user.id}` }}
              </option>
            </select>
          </div>
          
          <div v-if="testUserId" class="mt-2">
            <div class="text-sm space-y-1">
              <div><strong>Utilisateur sélectionné:</strong> {{ getSelectedUser() }}</div>
              <div><strong>Logs correspondants:</strong> {{ getMatchingLogs().length }}</div>
            </div>
            
            <!-- Logs correspondants -->
            <div v-if="getMatchingLogs().length > 0" class="mt-2">
              <h4 class="font-semibold text-sm mb-1">Logs correspondants:</h4>
              <div class="bg-base-200 p-2 rounded max-h-40 overflow-y-auto">
                <div v-for="log in getMatchingLogs().slice(0, 5)" :key="log.id" class="text-xs mb-1">
                  <strong>ID:</strong> {{ log.id }}, 
                  <strong>user_id:</strong> {{ log.user_id }}, 
                  <strong>userId:</strong> {{ log.userId }}, 
                  <strong>user:</strong> {{ log.user }}, 
                  <strong>action:</strong> {{ log.action }}
                </div>
                <div v-if="getMatchingLogs().length > 5" class="text-xs text-base-content/60">
                  ... et {{ getMatchingLogs().length - 5 }} autres
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Analyse des champs utilisateur -->
        <div>
          <h3 class="font-bold mb-2">Analyse des champs utilisateur dans les logs</h3>
          <div class="overflow-x-auto">
            <table class="table table-compact w-full">
              <thead>
                <tr>
                  <th>Log ID</th>
                  <th>user_id</th>
                  <th>userId</th>
                  <th>user</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="log in logs.slice(0, 10)" :key="log.id">
                  <td>{{ log.id }}</td>
                  <td>{{ log.user_id || 'N/A' }}</td>
                  <td>{{ log.userId || 'N/A' }}</td>
                  <td>{{ log.user || 'N/A' }}</td>
                  <td>{{ log.action }}</td>
                </tr>
              </tbody>
            </table>
            <div v-if="logs.length > 10" class="text-xs text-base-content/60 mt-2">
              Affichage des 10 premiers logs seulement
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="divider">Actions</div>
        <div class="flex gap-2">
          <button @click="loadData" class="btn btn-sm btn-primary">
            <i class="fas fa-refresh"></i>
            Recharger données
          </button>
          <button @click="analyzeUserFields" class="btn btn-sm btn-info">
            <i class="fas fa-search"></i>
            Analyser champs utilisateur
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
const logs = ref([])
const users = ref([])
const testUserId = ref('')
const filters = ref({ userId: '' })

// Méthodes
const loadData = async () => {
  try {
    // Charger les logs
    const logsResponse = await adminAPI.getLogs(1, 100)
    logs.value = logsResponse.data.logs || logsResponse.data || []
    
    // Charger les utilisateurs
    const usersResponse = await adminAPI.getUsers()
    users.value = usersResponse.data || []
    
    console.log('Debug data loaded:', {
      logs: logs.value.length,
      users: users.value.length
    })
  } catch (error) {
    console.error('Error loading debug data:', error)
  }
}

const getSelectedUser = () => {
  const user = users.value.find(u => u.id == testUserId.value)
  return user ? `${user.username || user.user} (ID: ${user.id})` : 'Utilisateur non trouvé'
}

const getMatchingLogs = () => {
  if (!testUserId.value) return []
  
  return logs.value.filter(log => 
    log.userId == testUserId.value || log.user_id == testUserId.value
  )
}

const testFilter = () => {
  console.log('🧪 Test filter for user ID:', testUserId.value)
  const matching = getMatchingLogs()
  console.log('🧪 Matching logs:', matching.length, matching)
}

const analyzeUserFields = () => {
  const analysis = {
    hasUserId: 0,
    hasUser_id: 0,
    hasUser: 0,
    uniqueUserIds: new Set(),
    uniqueUser_ids: new Set()
  }
  
  logs.value.forEach(log => {
    if (log.userId !== undefined) {
      analysis.hasUserId++
      analysis.uniqueUserIds.add(log.userId)
    }
    if (log.user_id !== undefined) {
      analysis.hasUser_id++
      analysis.uniqueUser_ids.add(log.user_id)
    }
    if (log.user !== undefined) {
      analysis.hasUser++
    }
  })
  
  console.log('📊 Analyse des champs utilisateur:', {
    ...analysis,
    uniqueUserIds: Array.from(analysis.uniqueUserIds),
    uniqueUser_ids: Array.from(analysis.uniqueUser_ids)
  })
}

// Lifecycle
onMounted(() => {
  loadData()
})
</script>