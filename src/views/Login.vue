<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="max-w-md w-full bg-white rounded-lg shadow-md p-8">
      
      <!-- Logo et Nom de l'application -->
      <div class="text-center mb-6">
        <img src="@/assets/logo.png" alt="Logo" class="mx-auto w-24 h-24 mb-2">
        <h1 class="text-2xl font-bold text-gray-700">{{ appName }}</h1>
      </div>

      <!-- Formulaire de connexion -->
      <form @submit.prevent="handleLogin" class="space-y-4">
        <div>
          <label class="block text-gray-600 font-medium mb-1" for="username">Nom d'utilisateur</label>
          <input
            type="text"
            id="username"
            v-model="username"
            placeholder="Entrez votre nom d'utilisateur"
            class="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring focus:ring-indigo-200"
            required
          >
        </div>

        <div>
          <label class="block text-gray-600 font-medium mb-1" for="password">Mot de passe</label>
          <div class="relative">
            <input
              :type="showPassword ? 'text' : 'password'"
              id="password"
              v-model="password"
              placeholder="Entrez votre mot de passe"
              class="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring focus:ring-indigo-200 pr-10"
              required
            >
            <!-- Bouton œil -->
            <button 
              type="button"
              @click="togglePassword"
              class="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-gray-700"
            >
              <span v-if="showPassword">👁️‍🗨️</span>
              <span v-else>👁️</span>
            </button>
          </div>
        </div>

        <!-- Se souvenir de moi -->
        <div class="flex items-center justify-between">
          <label class="flex items-center text-gray-600">
            <input type="checkbox" v-model="rememberMe" class="mr-2">
            Se souvenir de moi
          </label>
        </div>

        <div>
          <button
            type="submit"
            :disabled="loading"
            class="w-full py-2 px-4 bg-indigo-200 hover:bg-indigo-300 text-gray-800 font-semibold rounded-md transition-colors"
          >
            {{ loading ? "Connexion..." : "Se connecter" }}
          </button>
        </div>

        <!-- Message d'erreur -->
        <p v-if="error" class="text-red-500 text-sm mt-2">{{ error }}</p>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'

const router = useRouter()
const store = useStore()

// Variables du formulaire
const username = ref('')
const password = ref('')
const rememberMe = ref(false)
const loading = ref(false)
const error = ref('')

// 👁️ état de l'affichage du mot de passe
const showPassword = ref(false)
const togglePassword = () => {
  showPassword.value = !showPassword.value
}
// Nom de l'application
const appName = "Documents NAS"

// Fonction de connexion
const handleLogin = async () => {
  loading.value = true
  error.value = ''
  try {
    // On passe par Vuex → store/index.js
    const user = await store.dispatch('login', {
      username: username.value,
      password: password.value,
      rememberMe: rememberMe.value
    })

    if (!user || !user.role) {
      throw new Error("Rôle utilisateur non défini")
    }

    // Redirection selon rôle
    if (user.role.toLowerCase() === 'admin') {
      router.push('/admin')
    } else {
      router.push('/user')
    }
  } catch (err) {
    console.error("Erreur login:", err)
    error.value = err.message || 'Nom d’utilisateur ou mot de passe incorrect'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
body {
  font-family: 'Inter', sans-serif;
}
</style>
