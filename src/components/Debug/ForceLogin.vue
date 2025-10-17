<template>
  <div class="force-login-container">
    <div class="login-card">
      <h2>🔧 Debug: Force Login</h2>
      <p>La page de login ne s'affiche pas normalement. Utilisez ce bouton pour forcer la navigation.</p>
      
      <div class="debug-info">
        <h3>État actuel :</h3>
        <ul>
          <li><strong>Route actuelle :</strong> {{ $route.path }}</li>
          <li><strong>Token présent :</strong> {{ hasToken ? 'Oui' : 'Non' }}</li>
          <li><strong>Utilisateur connecté :</strong> {{ isAuthenticated ? 'Oui' : 'Non' }}</li>
          <li><strong>Données utilisateur :</strong> {{ user ? user.username : 'Aucune' }}</li>
        </ul>
      </div>
      
      <div class="actions">
        <button @click="clearAllAndGoToLogin" class="btn-primary">
          🧹 Nettoyer et aller au login
        </button>
        <button @click="forceGoToLogin" class="btn-secondary">
          🚀 Forcer navigation login
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'
import TokenService from '@/services/tokenService'
import { isAuthenticated, getUser } from '@/services/auth'

export default {
  name: 'ForceLogin',
  setup() {
    const router = useRouter()
    const store = useStore()
    
    const hasToken = computed(() => TokenService.hasToken())
    const user = computed(() => getUser())
    
    const clearAllAndGoToLogin = () => {
      // Clear all auth data
      TokenService.removeToken()
      localStorage.removeItem('user_data')
      sessionStorage.removeItem('user_data')
      store.commit('LOGOUT')
      
      // Force navigation to login
      router.replace('/login').then(() => {
        console.log('✅ Navigated to login after clearing auth')
      }).catch(error => {
        console.error('❌ Error navigating to login:', error)
        // Fallback: reload the page
        window.location.href = '/login'
      })
    }
    
    const forceGoToLogin = () => {
      router.replace('/login').then(() => {
        console.log('✅ Forced navigation to login')
      }).catch(error => {
        console.error('❌ Error forcing navigation to login:', error)
        // Fallback: reload the page
        window.location.href = '/login'
      })
    }
    
    return {
      hasToken,
      isAuthenticated: computed(() => isAuthenticated()),
      user,
      clearAllAndGoToLogin,
      forceGoToLogin
    }
  }
}
</script>

<style scoped>
.force-login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
  padding: 20px;
}

.login-card {
  background: white;
  border-radius: 8px;
  padding: 30px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  max-width: 500px;
  width: 100%;
}

.login-card h2 {
  color: #dc2626;
  margin-bottom: 15px;
}

.debug-info {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 15px;
  margin: 20px 0;
}

.debug-info h3 {
  margin-top: 0;
  margin-bottom: 10px;
  color: #374151;
}

.debug-info ul {
  margin: 0;
  padding-left: 20px;
}

.debug-info li {
  margin-bottom: 5px;
  color: #6b7280;
}

.actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.btn-primary, .btn-secondary {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-primary {
  background: #dc2626;
  color: white;
}

.btn-primary:hover {
  background: #b91c1c;
}

.btn-secondary {
  background: #3b82f6;
  color: white;
}

.btn-secondary:hover {
  background: #2563eb;
}
</style>