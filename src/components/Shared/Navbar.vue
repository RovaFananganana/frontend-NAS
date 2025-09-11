<!-- components/Shared/Navbar.vue -->
<template>
  <div class="navbar bg-base-100 border-b border-base-200 px-4 sticky top-0 z-40">
    <!-- Mobile menu button -->
    <div class="navbar-start">
      <button 
        @click="$store.commit('TOGGLE_SIDEBAR')"
        class="btn btn-ghost btn-circle lg:hidden"
      >
        <i class="fas fa-bars text-lg"></i>
      </button>
    </div>

    <!-- Center - Page title -->
    <div class="navbar-center">
      <h2 class="text-lg font-semibold">{{ pageTitle }}</h2>
    </div>

    <!-- End - External links -->
    <div class="navbar-end flex items-center gap-2">
      <!-- Outlook -->
      <a 
        href="https://messagerie.asecna.org/owa/auth/logon.aspx?replaceCurrent=1&url=https%3a%2f%2fmessagerie.asecna.org%2fowa%2f"
        target="_blank"
        class="btn btn-ghost btn-circle"
        title="Outlook - Messagerie ASECNA"
      >
        <i class="fas fa-envelope text-lg text-blue-600"></i>
      </a>

      <!-- PGI -->
      <a 
        href="http://pgipappn.asecna.local:8020/OA_HTML/AppsLocalLogin.jsp"
        target="_blank"
        class="btn btn-ghost btn-circle"
        title="PGI - Progiciel de Gestion Intégrée"
      >
        <i class="fas fa-calculator text-lg text-green-600"></i>
      </a>

      <!-- MSH -->
      <a 
        href="https://www.msh-services.com/index_member.php?lang=fr"
        target="_blank"
        class="btn btn-ghost btn-circle"
        title="MSH Services"
      >
        <i class="fas fa-heart text-lg text-red-500"></i>
      </a>

      <!-- AXA -->
      <a 
        href="https://www.axa.fr/pro/epargne-retraite-entreprise.html"
        target="_blank"
        class="btn btn-ghost btn-circle"
        title="AXA - Épargne Retraite"
      >
        <i class="fas fa-shield-alt text-lg text-blue-800"></i>
      </a>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  pageTitle: {
    type: String,
    default: 'Tableau de bord'
  }
})
</script>

<style scoped>
.navbar {
  min-height: 4rem;
}

/* Styles pour les icônes avec couleurs personnalisées */
.text-blue-600 {
  color: #2563eb;
}

.text-green-600 {
  color: #059669;
}

.text-red-500 {
  color: #ef4444;
}

.text-blue-800 {
  color: #1e40af;
}

/* Effet hover sur les boutons */
.btn-ghost:hover {
  background-color: var(--fallback-b3, oklch(var(--b3)));
}

.btn-ghost:hover i {
  transform: scale(1.1);
  transition: transform 0.2s ease;
}
</style>