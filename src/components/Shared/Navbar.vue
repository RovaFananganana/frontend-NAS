<!-- components/Shared/Navbar.vue -->
<template>
  <div class="navbar bg-base-100 border-b border-base-300 px-6 sticky top-0 z-40 shadow-sm">
    <!-- Start - Page title (now more prominent) -->
    <div class="navbar-start">
      <h1 class="text-2xl font-bold text-base-content opacity-90 tracking-wide">{{ pageTitle }}</h1>
    </div>

    <!-- End - External links -->
    <div class="navbar-end flex items-center gap-2">
      <!-- Outlook -->
      <a href="https://messagerie.asecna.org/owa/auth/logon.aspx?replaceCurrent=1&url=https%3a%2f%2fmessagerie.asecna.org%2fowa%2f"
        target="_blank" class="btn btn-ghost btn-circle" title="Outlook - Messagerie ASECNA">
        <i class="fas fa-envelope text-lg text-blue-600"></i>
      </a>

      <!-- PGI -->
      <a href="http://pgipappn.asecna.local:8020/OA_HTML/AppsLocalLogin.jsp" target="_blank"
        class="btn btn-ghost btn-circle" title="PGI - Progiciel de Gestion Intégrée">
        <i class="fas fa-calculator text-lg text-green-600"></i>
      </a>

      <!-- MSH -->
      <a href="https://www.msh-services.com/index_member.php?lang=fr" target="_blank" class="btn btn-ghost btn-circle"
        title="MSH Services">
        <i class="fas fa-heart text-lg text-red-500"></i>
      </a>

      <!-- Évaluation RH -->
      <a href="http://evalrh.asecna.local/" target="_blank" class="btn btn-ghost btn-circle"
        title="Évaluation RH - Plateforme d'évaluation annuelle">
        <i class="fas fa-user-check text-lg text-purple-600"></i>
      </a>

      <!-- AXA -->
      <a href="https://www.capretraite-entreprises.fr/Transactions/IndexSalarie.aspx" target="_blank"
        class="btn btn-ghost btn-circle" title="AXA - Épargne Retraite">
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

/* Enhanced page title styling */
.navbar-start h1 {
  position: relative;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

.navbar-start h1:hover {
  opacity: 1 !important;
  transform: translateY(-1px);
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

.text-purple-600 {
  color: #9333ea;
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