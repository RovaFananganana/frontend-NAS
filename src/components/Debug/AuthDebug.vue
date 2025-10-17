<!-- components/Debug/AuthDebug.vue -->
<template>
  <div class="card bg-base-100 shadow-lg border-2 border-warning">
    <div class="card-body">
      <h3 class="card-title text-warning">
        <i class="fas fa-bug mr-2"></i>
        Authentication Debug
      </h3>
      
      <div class="space-y-3">
        <!-- Token Status -->
        <div class="flex justify-between items-center">
          <span class="font-medium">Token Present:</span>
          <div class="badge" :class="hasToken ? 'badge-success' : 'badge-error'">
            {{ hasToken ? 'Yes' : 'No' }}
          </div>
        </div>
        
        <!-- Token Value (truncated) -->
        <div v-if="hasToken" class="flex justify-between items-center">
          <span class="font-medium">Token:</span>
          <code class="text-xs bg-base-200 p-1 rounded max-w-48 truncate">
            {{ tokenPreview }}
          </code>
        </div>
        
        <!-- User Status -->
        <div class="flex justify-between items-center">
          <span class="font-medium">User Logged In:</span>
          <div class="badge" :class="hasUser ? 'badge-success' : 'badge-error'">
            {{ hasUser ? 'Yes' : 'No' }}
          </div>
        </div>
        
        <!-- User Info -->
        <div v-if="hasUser" class="space-y-2">
          <div class="flex justify-between items-center">
            <span class="font-medium">Username:</span>
            <span class="text-sm">{{ user.username }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="font-medium">Role:</span>
            <div class="badge" :class="user.role === 'ADMIN' ? 'badge-primary' : 'badge-secondary'">
              {{ user.role }}
            </div>
          </div>
        </div>
        
        <!-- Backend Connection Test -->
        <div class="divider">Backend Connection</div>
        
        <div class="flex justify-between items-center">
          <span class="font-medium">Backend Status:</span>
          <div class="badge" :class="backendStatus === 'connected' ? 'badge-success' : backendStatus === 'error' ? 'badge-error' : 'badge-warning'">
            {{ backendStatus }}
          </div>
        </div>
        
        <div v-if="backendError" class="text-error text-sm">
          {{ backendError }}
        </div>
        
        <!-- Actions -->
        <div class="card-actions justify-end">
          <button class="btn btn-sm btn-outline" @click="testBackend" :disabled="testing">
            <i class="fas fa-sync mr-1" :class="{ 'animate-spin': testing }"></i>
            Test Backend
          </button>
          <button v-if="!hasUser" class="btn btn-sm btn-primary" @click="goToLogin">
            <i class="fas fa-sign-in-alt mr-1"></i>
            Login
          </button>
          <button v-else class="btn btn-sm btn-error" @click="logout">
            <i class="fas fa-sign-out-alt mr-1"></i>
            Logout
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import { getToken, getUser } from '@/services/auth.js'
import httpClient from '@/services/httpClient.js'

const store = useStore()
const router = useRouter()

// State
const backendStatus = ref('unknown')
const backendError = ref('')
const testing = ref(false)

// Computed
const hasToken = computed(() => !!getToken())
const hasUser = computed(() => !!getUser())
const user = computed(() => getUser())
const tokenPreview = computed(() => {
  const token = getToken()
  if (!token) return ''
  return token.length > 20 ? `${token.substring(0, 20)}...` : token
})

// Methods
const testBackend = async () => {
  testing.value = true
  backendStatus.value = 'testing'
  backendError.value = ''
  
  try {
    // First test NAS health endpoint (no auth required)
    console.log('Testing NAS health endpoint...')
    const healthData = await httpClient.get('/nas/health')
    console.log('NAS health check successful:', healthData)
    
    // If we have a token, test authenticated endpoint
    if (hasToken.value) {
      console.log('Testing authenticated endpoint...')
      try {
        const authData = await httpClient.get('/users/me')
        backendStatus.value = 'connected'
        console.log('Auth test successful:', authData)
      } catch (authError) {
        backendStatus.value = 'error'
        backendError.value = `Auth failed: ${authError.message}`
        
        if (authError.status === 401) {
          console.log('Removing invalid token...')
          store.dispatch('logout')
        }
      }
    } else {
      backendStatus.value = 'connected'
      backendError.value = 'Backend connected but no auth token'
    }
  } catch (error) {
    backendStatus.value = 'error'
    backendError.value = error.message
    console.error('Backend test failed:', error)
  } finally {
    testing.value = false
  }
}

const goToLogin = () => {
  router.push('/login')
}

const logout = () => {
  store.dispatch('logout')
  router.push('/login')
}

// Lifecycle
onMounted(() => {
  testBackend()
})
</script>

<style scoped>
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>