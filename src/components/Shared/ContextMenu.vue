<template>
  <div v-if="show" ref="contextMenu"
    class="fixed bg-base-100 border border-base-300 shadow-lg rounded-lg py-2 z-50 min-w-52" :style="menuPosition"
    @click.stop>
    <!-- Ouvrir -->
    <button v-if="item" class="w-full text-left px-4 py-2 hover:bg-base-200 text-sm flex items-center gap-3"
      @click="$emit('open', item)">
      <i class="fas w-4" :class="item.is_directory ? 'fa-folder-open' : 'fa-external-link-alt'"></i>
      Ouvrir
    </button>



    <!-- Télécharger (fichiers seulement) -->
    <button v-if="item && !item.is_directory && permissions.can_read"
      class="w-full text-left px-4 py-2 hover:bg-base-200 text-sm flex items-center gap-3"
      @click="$emit('download', item)">
      <i class="fas fa-download w-4"></i>
      Télécharger
    </button>

    <div v-if="item && hasModifyActions" class="divider my-1"></div>

    <!-- Renommer -->
    <button v-if="item && permissions.can_write"
      class="w-full text-left px-4 py-2 hover:bg-base-200 text-sm flex items-center gap-3"
      @click="$emit('rename', item)">
      <i class="fas fa-edit w-4"></i>
      Renommer
    </button>

    <!-- Copier -->
    <button v-if="item && permissions.can_read"
      class="w-full text-left px-4 py-2 hover:bg-base-200 text-sm flex items-center gap-3" @click="$emit('copy', item)"
      title="Copier pour coller dans le NAS ou vers le presse-papiers système">
      <i class="fas fa-copy w-4"></i>
      Copier
    </button>

    <!-- Couper -->
    <button v-if="item && permissions.can_write"
      class="w-full text-left px-4 py-2 hover:bg-base-200 text-sm flex items-center gap-3" @click="$emit('cut', item)">
      <i class="fas fa-cut w-4"></i>
      Couper
    </button>

    <!-- Coller -->
    <button v-if="showPasteOption && permissions.can_write"
      class="w-full text-left px-4 py-2 hover:bg-base-200 text-sm flex items-center gap-3" @click="$emit('paste')"
      :title="getPasteTooltip()">
      <i class="fas fa-paste w-4"></i>
      Coller
      <span v-if="clipboardInfo" class="text-xs opacity-60 ml-auto">
        {{ clipboardInfo.count }} {{ clipboardInfo.operation === 'copy' ? 'copie(s)' : 'déplacement(s)' }}
      </span>
    </button>

    <!-- Ajouter/Retirer des favoris (Utilisateurs seulement) -->
    <button v-if="item && !isAdmin" class="w-full text-left px-4 py-2 hover:bg-base-200 text-sm flex items-center gap-3"
      @click="$emit('toggle-favorite', item)">
      <i class="w-4" :class="isFavorite ? 'fas fa-star text-warning' : 'far fa-star'"></i>
      {{ isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris' }}
    </button>

    <!-- Envoyer vers / Déplacer -->
    <button v-if="item && permissions.can_write"
      class="w-full text-left px-4 py-2 hover:bg-base-200 text-sm flex items-center gap-3" @click="$emit('move', item)">
      <i class="fas fa-share w-4"></i>
      Envoyer vers
    </button>

    <!-- Nouveau (sur fichier/dossier seulement) -->
    <div v-if="item && permissions.can_write" class="relative submenu-container" @mouseenter="handleNewSubmenuEnter"
      @mouseleave="handleNewSubmenuLeave">
      <button class="w-full text-left px-4 py-2 hover:bg-base-200 text-sm flex items-center gap-3 justify-between"
        @click="toggleNewSubmenu">
        <div class="flex items-center gap-3">
          <i class="fas fa-plus w-4"></i>
          Nouveau
        </div>
        <i class="fas fa-chevron-right text-xs"></i>
      </button>

      <!-- Sous-menu Nouveau -->
      <div v-if="showNewSubmenu"
        class="absolute left-full top-0 ml-1 bg-base-100 border border-base-300 shadow-xl rounded-box py-2 z-[60] min-w-48 submenu-content animate-in slide-in-from-left-2 duration-200"
        @mouseenter="handleNewSubmenuContentEnter" @mouseleave="handleNewSubmenuContentLeave">
        <button
          class="w-full text-left px-4 py-2 hover:bg-base-200 text-sm flex items-center gap-3 transition-all duration-200 ease-in-out hover:translate-x-1"
          @click.stop="$emit('create-folder')">
          <i class="fas fa-folder-plus w-4 text-primary"></i>
          Nouveau dossier
        </button>

        <button
          class="w-full text-left px-4 py-2 hover:bg-base-200 text-sm flex items-center gap-3 transition-all duration-200 ease-in-out hover:translate-x-1"
          @click.stop="$emit('create-file')">
          <i class="fas fa-file-plus w-4 text-success"></i>
          Nouveau fichier
        </button>
      </div>
    </div>

    <!-- Affichage (toujours disponible) -->
    <div class="relative submenu-container" @mouseenter="handleViewSubmenuEnter" @mouseleave="handleViewSubmenuLeave">
      <button class="w-full text-left px-4 py-2 hover:bg-base-200 text-sm flex items-center gap-3 justify-between"
        @click="toggleViewModeSubmenu">
        <div class="flex items-center gap-3">
          <i class="fas fa-eye w-4"></i>
          Affichage
        </div>
        <i class="fas fa-chevron-right text-xs"></i>
      </button>

      <!-- Sous-menu des modes d'affichage -->
      <div v-if="showViewModeSubmenu"
        class="absolute left-full top-0 ml-1 bg-base-100 border border-base-300 shadow-xl rounded-box py-2 z-[60] min-w-48 submenu-content animate-in slide-in-from-left-2 duration-200"
        @mouseenter="handleViewSubmenuContentEnter" @mouseleave="handleViewSubmenuContentLeave">
        <button
          class="w-full text-left px-4 py-2 hover:bg-base-200 text-sm flex items-center gap-3 transition-all duration-200 ease-in-out"
          :class="{
            'bg-primary text-primary-content': currentViewMode === 'detailed-list',
            'hover:translate-x-1': currentViewMode !== 'detailed-list'
          }" @click.stop="changeViewMode('detailed-list')">
          <i class="fas fa-list w-4"></i>
          Liste
        </button>

        <button
          class="w-full text-left px-4 py-2 hover:bg-base-200 text-sm flex items-center gap-3 transition-all duration-200 ease-in-out"
          :class="{
            'bg-primary text-primary-content': currentViewMode === 'tree',
            'hover:translate-x-1': currentViewMode !== 'tree'
          }" @click.stop="changeViewMode('tree')">
          <i class="fas fa-sitemap w-4"></i>
          Arbre
        </button>

        <button
          class="w-full text-left px-4 py-2 hover:bg-base-200 text-sm flex items-center gap-3 transition-all duration-200 ease-in-out"
          :class="{
            'bg-primary text-primary-content': currentViewMode === 'mosaic',
            'hover:translate-x-1': currentViewMode !== 'mosaic'
          }" @click.stop="changeViewMode('mosaic')">
          <i class="fas fa-th w-4"></i>
          Mosaïque
        </button>
      </div>
    </div>

    <!-- Nouveau dossier (sur espace vide seulement) -->
    <button v-if="!item && permissions.can_write"
      class="w-full text-left px-4 py-2 hover:bg-base-200 text-sm flex items-center gap-3"
      @click="$emit('create-folder')">
      <i class="fas fa-folder-plus w-4"></i>
      Nouveau dossier
    </button>

    <!-- Nouveau fichier (sur espace vide seulement) -->
    <button v-if="!item && permissions.can_write"
      class="w-full text-left px-4 py-2 hover:bg-base-200 text-sm flex items-center gap-3"
      @click="$emit('create-file')">
      <i class="fas fa-file-plus w-4"></i>
      Nouveau fichier
    </button>

    <div v-if="item && permissions.can_delete" class="divider my-1"></div>

    <!-- Supprimer -->
    <button v-if="item && permissions.can_delete"
      class="w-full text-left px-4 py-2 hover:bg-base-200 text-sm text-error flex items-center gap-3"
      @click="$emit('delete', item)">
      <i class="fas fa-trash w-4"></i>
      Supprimer
    </button>

    <div v-if="item" class="divider my-1"></div>

    <!-- Propriétés -->
    <button v-if="item" class="w-full text-left px-4 py-2 hover:bg-base-200 text-sm flex items-center gap-3"
      @click="$emit('properties', item)">
      <i class="fas fa-info-circle w-4"></i>
      Propriétés
    </button>

    <!-- Messages d'erreur pour permissions insuffisantes -->
    <div v-if="showPermissionErrors" class="px-4 py-2 text-xs text-error opacity-60">
      <div v-if="!permissions.can_read">• Lecture non autorisée</div>
      <div v-if="!permissions.can_write">• Modification non autorisée</div>
      <div v-if="!permissions.can_delete">• Suppression non autorisée</div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, nextTick, watch } from 'vue'
import { useStore } from 'vuex'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  x: {
    type: Number,
    default: 0
  },
  y: {
    type: Number,
    default: 0
  },
  item: {
    type: Object,
    default: null
  },
  permissions: {
    type: Object,
    default: () => ({
      can_read: false,
      can_write: false,
      can_delete: false,
      can_share: false,
      can_modify: false
    })
  },
  clipboardInfo: {
    type: Object,
    default: null
  },
  showPermissionErrors: {
    type: Boolean,
    default: false
  },
  isFavorite: {
    type: Boolean,
    default: false
  },
  currentViewMode: {
    type: String,
    default: 'DETAILED_LIST'
  },
  clipboardSupported: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits([
  'open',
  'download',
  'rename',
  'copy',
  'cut',
  'paste',
   'move',
  'create-folder',
  'create-file',
  'delete',
  'properties',
  'toggle-favorite',
  'view-mode-changed'
])

// Debug logging removed for cleaner console

const store = useStore()

// État local pour les sous-menus
const showViewModeSubmenu = ref(false)
const showNewSubmenu = ref(false)
const viewSubmenuTimer = ref(null)
const newSubmenuTimer = ref(null)
const contextMenu = ref(null)

// Position calculée du menu pour éviter qu'il sorte de l'écran
const menuPosition = computed(() => {
  const menuWidth = 208 // min-w-52 = 208px
  const submenuWidth = 192 // min-w-48 = 192px
  const totalWidth = menuWidth + submenuWidth + 10 // largeur totale avec sous-menu
  const menuHeight = 450 // estimation de la hauteur maximale du menu (augmentée)
  const bottomMargin = 80 // marge pour éviter la barre des tâches

  let left = props.x
  let top = props.y

  // Vérifier si le menu + sous-menu sort à droite de l'écran
  if (left + totalWidth > window.innerWidth) {
    // Si pas assez de place à droite, positionner le menu plus à gauche
    left = window.innerWidth - totalWidth - 10
  }

  // Si toujours pas assez de place, au moins garder le menu principal visible
  if (left + menuWidth > window.innerWidth) {
    left = window.innerWidth - menuWidth - 10
  }

  // Vérifier si le menu sort en bas de l'écran (avec marge pour barre des tâches)
  if (top + menuHeight > window.innerHeight - bottomMargin) {
    top = window.innerHeight - menuHeight - bottomMargin
  }

  // S'assurer que le menu ne sort pas en haut ou à gauche
  left = Math.max(10, left)
  top = Math.max(10, top)

  return {
    left: left + 'px',
    top: top + 'px'
  }
})

const isAdmin = computed(() => store.getters.isAdmin)

const showPasteOption = computed(() => {
  return props.clipboardInfo &&
    props.clipboardInfo.items &&
    props.clipboardInfo.items.length > 0
})

const hasModifyActions = computed(() => {
  return props.permissions.can_write ||
    props.permissions.can_read ||
    props.isAdmin
})

const hasViewOrCreateActions = computed(() => {
  return true // Toujours afficher la section Affichage
})

const getPasteTooltip = () => {
  if (!props.clipboardInfo) return ''

  const { operation, count, description } = props.clipboardInfo
  const operationText = operation === 'copy' ? 'Copier' : 'Déplacer'

  return `${operationText} ${count} élément${count > 1 ? 's' : ''}`
}

// Méthodes pour le sous-menu d'affichage
const toggleViewModeSubmenu = () => {
  showViewModeSubmenu.value = !showViewModeSubmenu.value
  showNewSubmenu.value = false // Fermer l'autre sous-menu
}

const toggleNewSubmenu = () => {
  showNewSubmenu.value = !showNewSubmenu.value
  showViewModeSubmenu.value = false // Fermer l'autre sous-menu
}

const changeViewMode = (mode) => {
  emit('view-mode-changed', mode)
  showViewModeSubmenu.value = false

  // Nettoyer le timer
  if (viewSubmenuTimer.value) {
    clearTimeout(viewSubmenuTimer.value)
    viewSubmenuTimer.value = null
  }
}

// Gestion des événements de souris pour le sous-menu d'affichage
const handleViewSubmenuEnter = () => {
  if (viewSubmenuTimer.value) {
    clearTimeout(viewSubmenuTimer.value)
    viewSubmenuTimer.value = null
  }
  showViewModeSubmenu.value = true
  showNewSubmenu.value = false
}

const handleViewSubmenuLeave = () => {
  viewSubmenuTimer.value = setTimeout(() => {
    showViewModeSubmenu.value = false
  }, 500)
}

const handleViewSubmenuContentEnter = () => {
  if (viewSubmenuTimer.value) {
    clearTimeout(viewSubmenuTimer.value)
    viewSubmenuTimer.value = null
  }
  showViewModeSubmenu.value = true
}

const handleViewSubmenuContentLeave = () => {
  viewSubmenuTimer.value = setTimeout(() => {
    showViewModeSubmenu.value = false
  }, 150)
}

// Gestion des événements de souris pour le sous-menu Nouveau
const handleNewSubmenuEnter = () => {
  if (newSubmenuTimer.value) {
    clearTimeout(newSubmenuTimer.value)
    newSubmenuTimer.value = null
  }
  showNewSubmenu.value = true
  showViewModeSubmenu.value = false
}

const handleNewSubmenuLeave = () => {
  newSubmenuTimer.value = setTimeout(() => {
    showNewSubmenu.value = false
  }, 500)
}

const handleNewSubmenuContentEnter = () => {
  if (newSubmenuTimer.value) {
    clearTimeout(newSubmenuTimer.value)
    newSubmenuTimer.value = null
  }
  showNewSubmenu.value = true
}

const handleNewSubmenuContentLeave = () => {
  newSubmenuTimer.value = setTimeout(() => {
    showNewSubmenu.value = false
  }, 150)
}
</script>

<style scoped>
/* Zone de transition pour éviter la fermeture accidentelle du sous-menu */
.submenu-container::after {
  content: '';
  position: absolute;
  left: 100%;
  top: 0;
  width: 8px;
  height: 100%;
  background: transparent;
  z-index: 59;
}

/* Animation d'entrée personnalisée si les classes Tailwind ne fonctionnent pas */
@keyframes slideInFromLeft {
  from {
    opacity: 0;
    transform: translateX(-8px);
  }

  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.submenu-content {
  animation: slideInFromLeft 0.2s ease-out;
}
</style>