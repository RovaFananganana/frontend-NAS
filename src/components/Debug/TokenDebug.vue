<template>
  <div class="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
    <h3 class="font-bold text-lg mb-4">🔍 Diagnostic des Tokens</h3>
    
    <div class="space-y-2 text-sm">
      <div class="grid grid-cols-2 gap-4">
        <div>
          <h4 class="font-semibold">LocalStorage:</h4>
          <ul class="ml-4">
            <li>auth_token: {{ localStorage.auth_token || 'null' }}</li>
            <li>token: {{ localStorage.token || 'null' }}</li>
            <li>access_token: {{ localStorage.access_token || 'null' }}</li>
          </ul>
        </div>
        
        <div>
          <h4 class="font-semibold">SessionStorage:</h4>
          <ul class="ml-4">
            <li>auth_token: {{ sessionStorage.auth_token || 'null' }}</li>
            <li>token: {{ sessionStorage.token || 'null' }}</li>
            <li>access_token: {{ sessionStorage.access_token || 'null' }}</li>
          </ul>
        </div>
      </div>
      
      <div class="mt-4">
        <h4 class="font-semibold">TokenService:</h4>
        <p>Token actuel: {{ currentToken || 'null' }}</p>
        <p>A un token: {{ hasToken ? 'Oui' : 'Non' }}</p>
      </div>
      
      <div class="mt-4">
        <h4 class="font-semibold">Store Vuex:</h4>
        <p>isAuthenticated: {{ store.getters.isAuthenticated }}</p>
        <p>authToken: {{ store.getters.authToken || 'null' }}</p>
        <p>User: {{ store.state.user ? JSON.stringify(store.state.user) : 'null' }}</p>
      </div>
      
      <div class="mt-4 flex gap-2">
        <button @click="cleanupTokens" class="btn btn-sm btn-warning">
          Nettoyer les anciens tokens
        </button>
        <button @click="refresh" class="btn btn-sm btn-primary">
          Actualiser
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useStore } from 'vuex'
import TokenService from '@/services/tokenService.js'

const store = useStore()

const localStorage = ref({})
const sessionStorage = ref({})
const currentToken = ref('')
const hasToken = ref(false)

const refresh = () => {
  // LocalStorage
  localStorage.value = {
    auth_token: window.localStorage.getItem('auth_token'),
    token: window.localStorage.getItem('token'),
    access_token: window.localStorage.getItem('access_token')
  }
  
  // SessionStorage
  sessionStorage.value = {
    auth_token: window.sessionStorage.getItem('auth_token'),
    token: window.sessionStorage.getItem('token'),
    access_token: window.sessionStorage.getItem('access_token')
  }
  
  // TokenService
  currentToken.value = TokenService.getToken()
  hasToken.value = TokenService.hasToken()
}

const cleanupTokens = () => {
  TokenService.cleanupLegacyTokens()
  refresh()
}

onMounted(() => {
  refresh()
})
</script>