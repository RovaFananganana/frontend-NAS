import { createStore } from 'vuex'

export default createStore({
  state: {
    user: null,
    token: localStorage.getItem('token') || null,
    isAdmin: false
  },
  mutations: {
    setUser(state, user) {
      state.user = user
      state.isAdmin = user && user.role === 'ADMIN'
    },
    setToken(state, token) {
      state.token = token
      if (token) {
        localStorage.setItem('token', token)
      } else {
        localStorage.removeItem('token')
      }
    },
    logout(state) {
      state.user = null
      state.token = null
      state.isAdmin = false
      localStorage.removeItem('token')
    }
  },
  actions: {
    async login({ commit }, credentials) {
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(credentials)
        })
        
        if (response.ok) {
          const data = await response.json()
          commit('setToken', data.access_token)
          
          const userResponse = await fetch('/api/users/me', {
            headers: { 'Authorization': `Bearer ${data.access_token}` }
          })
          
          if (userResponse.ok) {
            const user = await userResponse.json()
            commit('setUser', user)
            return { success: true }
          }
        }
        return { success: false, error: 'Identifiants invalides' }
      } catch (error) {
        return { success: false, error: 'Erreur de connexion' }
      }
    },
    async fetchUser({ commit, state }) {
      if (state.token) {
        try {
          const response = await fetch('/api/users/me', {
            headers: { 'Authorization': `Bearer ${state.token}` }
          })
          
          if (response.ok) {
            const user = await response.json()
            commit('setUser', user)
          }
        } catch (error) {
          console.error('Erreur lors de la récupération des infos utilisateur')
        }
      }
    }
  }
})