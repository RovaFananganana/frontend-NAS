<!-- components/Shared/ClipboardHelp.vue -->
<template>
  <div v-if="show" class="modal modal-open">
    <div class="modal-box max-w-2xl">
      <h3 class="font-bold text-lg mb-4">
        <i class="fas fa-clipboard mr-2"></i>
        Guide du Presse-papier
      </h3>

      <div class="space-y-4">
        <div class="alert alert-info">
          <i class="fas fa-info-circle"></i>
          <div>
            <h4 class="font-bold">Fonctionnement du presse-papier</h4>
            <p>Le bouton "Copier" effectue deux actions simultanément :</p>
          </div>
        </div>

        <div class="grid md:grid-cols-2 gap-4">
          <!-- Copie interne NAS -->
          <div class="card bg-base-100 border border-base-300">
            <div class="card-body p-4">
              <h5 class="card-title text-sm">
                <i class="fas fa-server text-primary"></i>
                Copie interne NAS
              </h5>
              <ul class="text-sm space-y-1">
                <li>✅ Tous types de fichiers</li>
                <li>✅ Coller dans d'autres dossiers NAS</li>
                <li>✅ Préserve les métadonnées</li>
                <li>✅ Fichiers volumineux supportés</li>
              </ul>
            </div>
          </div>

          <!-- Copie système -->
          <div class="card bg-base-100 border border-base-300">
            <div class="card-body p-4">
              <h5 class="card-title text-sm">
                <i class="fas fa-desktop text-secondary"></i>
                Copie système
              </h5>
              <ul class="text-sm space-y-1">
                <li>✅ Images (PNG, JPG, GIF, etc.)</li>
                <li>✅ Fichiers texte (contenu)</li>
                <li>⚠️ Autres fichiers (info seulement)</li>
                <li>❌ Limitation navigateur</li>
              </ul>
            </div>
          </div>
        </div>

        <div class="divider">Utilisation</div>

        <div class="space-y-3">
          <div class="flex items-start gap-3">
            <div class="badge badge-primary">1</div>
            <div>
              <h6 class="font-semibold">Copier depuis le NAS</h6>
              <p class="text-sm opacity-70">Clic droit → Copier sur un fichier</p>
            </div>
          </div>

          <div class="flex items-start gap-3">
            <div class="badge badge-primary">2</div>
            <div>
              <h6 class="font-semibold">Coller dans le NAS</h6>
              <p class="text-sm opacity-70">Clic droit → Coller dans un dossier</p>
            </div>
          </div>

          <div class="flex items-start gap-3">
            <div class="badge badge-secondary">3</div>
            <div>
              <h6 class="font-semibold">Coller dans Windows</h6>
              <p class="text-sm opacity-70">Ctrl+V dans l'Explorateur (images et texte)</p>
            </div>
          </div>

          <div class="flex items-start gap-3">
            <div class="badge badge-accent">4</div>
            <div>
              <h6 class="font-semibold">Copier depuis Windows</h6>
              <p class="text-sm opacity-70">Copier des fichiers → Clic droit → Coller dans le NAS</p>
            </div>
          </div>
        </div>

        <div class="alert alert-warning">
          <i class="fas fa-exclamation-triangle"></i>
          <div>
            <h4 class="font-bold">Limitations navigateur</h4>
            <p class="text-sm">
              Les navigateurs ne permettent pas de copier des fichiers binaires (documents, vidéos, etc.) 
              vers le presse-papier système. Seules les images et le texte fonctionnent parfaitement.
            </p>
          </div>
        </div>
      </div>

      <div class="modal-action">
        <button class="btn btn-primary" @click="$emit('close')">
          Compris
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  show: {
    type: Boolean,
    default: false
  }
})

defineEmits(['close'])
</script>