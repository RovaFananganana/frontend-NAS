<template>
  <section class="p-4 bg-white rounded-lg border max-w-2xl">
    <h3 class="text-lg font-semibold mb-4">Mon profil</h3>

    <div v-if="error" class="alert alert-error mb-3">{{ error }}</div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div>
        <label class="text-sm">Nom d'utilisateur</label>
        <input v-model="form.username" class="input w-full" />
      </div>
      <div>
        <label class="text-sm">Email</label>
        <input v-model="form.email" type="email" class="input w-full" />
      </div>
      <div class="md:col-span-2">
        <label class="text-sm">Avatar (URL)</label>
        <input v-model="form.avatar" class="input w-full" />
        <div v-if="form.avatar" class="mt-2">
          <img :src="form.avatar" alt="avatar" class="w-24 h-24 object-cover rounded" />
        </div>
      </div>

      <div class="md:col-span-2 flex justify-end gap-2 mt-2">
        <button class="btn" @click="load">Annuler</button>
        <button class="btn primary" :disabled="saving" @click="save">
          {{ saving ? 'Enregistrement…' : 'Enregistrer' }}
        </button>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { userAPI } from '@/services/api'

const form = ref({ username: '', email: '', avatar: '' })
const saving = ref(false)
const error = ref('')

async function load() {
  error.value = ''
  try {
    const { data } = await userAPI.getProfile()
    Object.assign(form.value, data || {})
  } catch (e) {
    error.value = e?.response?.data?.message || e?.message || 'Erreur récupération profil'
  }
}

async function save() {
  saving.value = true
  try {
    await userAPI.updateProfile(form.value)
    alert('Profil mis à jour')
  } catch (e) {
    alert(e?.response?.data?.message || e?.message || 'Erreur sauvegarde')
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<style scoped>
/* Boutons */
.btn {
  @apply px-3 py-2 rounded border transition-all duration-200;
}

.btn.primary {
  @apply btn-primary; /* DaisyUI gère automatiquement la couleur selon le thème */
}

.btn.secondary {
  @apply btn-secondary; /* Même principe que btn-primary */
}

.btn.accent {
  @apply btn-accent;
}

/* Inputs */
.input {
  @apply border rounded px-3 py-2 transition-colors duration-200;
}

/* Alerts */

/* Hover et focus enhancements (sans couleur fixe) */
.btn:hover,
.input:focus {
  @apply shadow-md transform -translate-y-0.5;
}

/* Pour les boutons désactivés */
.btn:disabled {
  @apply opacity-50 cursor-not-allowed;
}
</style>

