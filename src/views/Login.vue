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
          <input
            type="password"
            id="password"
            v-model="password"
            placeholder="Entrez votre mot de passe"
            class="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring focus:ring-indigo-200"
            required
          >
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
import { login } from '../services/auth'
import { useRouter } from 'vue-router'

const router = useRouter()

// Variables du formulaire
const username = ref('')
const password = ref('')
const rememberMe = ref(false)
const loading = ref(false)
const error = ref('')

// Nom de l'application
const appName = "Documents NAS"

// Fonction de connexion
const handleLogin = async () => {
  loading.value = true
  error.value = ''
  try {
    // Appel à la fonction login (auth.js)
    const user = await login(username.value, password.value, rememberMe.value)

    // Redirection selon rôle
    if (user.role === 'admin') {
      router.push('/admin')
    } else {
      router.push('/user')
    }
  } catch (err) {
    error.value = 'Nom d’utilisateur ou mot de passe incorrect'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* Couleurs douces et design propre */
body {
  font-family: 'Inter', sans-serif;
}
</style>
