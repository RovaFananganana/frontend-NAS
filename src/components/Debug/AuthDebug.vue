<template>
  <div class="auth-debug" style="position: fixed; top: 10px; right: 10px; background: white; border: 2px solid red; padding: 10px; z-index: 9999; font-size: 12px; max-width: 300px;">
    <h4 style="margin: 0 0 10px 0; color: red;">🔍 Auth Debug</h4>
    
    <div><strong>Current Route:</strong> {{ currentRoute }}</div>
    <div><strong>Has Token:</strong> {{ hasToken }}</div>
    <div><strong>Token Value:</strong> {{ tokenPreview }}</div>
    <div><strong>Is Authenticated:</strong> {{ isAuthenticated }}</div>
    <div><strong>User Data:</strong> {{ userData }}</div>
    <div><strong>Is Admin:</strong> {{ isAdmin }}</div>
    <div><strong>Store Auth State:</strong> {{ storeAuthState }}</div>
    
    <div style="margin-top: 10px;">
      <button @click="clearAuth" style="background: red; color: white; border: none; padding: 5px; margin-right: 5px;">Clear Auth</button>
      <button @click="goToLogin" style="background: blue; color: white; border: none; padding: 5px;">Go to Login</button>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStore } from 'vuex'
import TokenService from '@/services/tokenService'
import { isAuthenticated, isAdmin, getUser } from '@/services/auth'

export default {
  name: 'AuthDebug',
  setup() {
    const route = useRoute()
    const router = useRouter()
    const store = useStore()
    
    const currentRoute = computed(() => route.path)
    const hasToken = computed(() => TokenService.hasToken())
    const tokenPreview = computed(() => {
      const token = TokenService.getToken()
      return token ? `${token.substring(0, 20)}...` : 'null'
    })
    const userData = computed(() => JSON.stringify(getUser()))
    const storeAuthState = computed(() => store.state.isAuthenticated)
    
    const clearAuth = () => {
      TokenService.removeToken()
      localStorage.removeItem('user_data')
      sessionStorage.removeItem('user_data')
      store.commit('LOGOUT')
      location.reload()
    }
    
    const goToLogin = () => {
      router.push('/login')
    }
    
    return {
      currentRoute,
      hasToken,
      tokenPreview,
      isAuthenticated: computed(() => isAuthenticated()),
      userData,
      isAdmin: computed(() => isAdmin()),
      storeAuthState,
      clearAuth,
      goToLogin
    }
  }
}
</script>