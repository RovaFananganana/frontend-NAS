<template>
  <div class="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-700 p-6">
    <!-- Illustration ou icône -->
    <div class="mb-6">
      <svg
        class="w-32 h-32 text-gray-400"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M9.75 9.75h.008v.008H9.75V9.75zm4.5 0h.008v.008h-.008V9.75zM7.5 16.5h9a2.25 
             2.25 0 002.25-2.25V7.5A2.25 
             2.25 0 0016.5 5.25h-9A2.25 
             2.25 0 005.25 7.5v6.75A2.25 
             2.25 0 007.5 16.5z"
        />
      </svg>
    </div>

    <!-- Texte -->
    <h1 class="text-4xl font-bold mb-2">404</h1>
    <p class="text-lg text-gray-500 mb-6">
      Oups 😢 La page que vous recherchez est introuvable.
    </p>

    <!-- Bouton de retour -->
    <router-link
      to="/"
      class="px-6 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white shadow-md transition"
    >
      Retour à l'accueil
    </router-link>
  </div>
</template>

<script>
export default {
  name: "NotFound",
};
</script>

<style scoped>
/* Ajout d’un petit effet de fade-in */
div {
  animation: fadeIn 0.5s ease-in-out;
}
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
