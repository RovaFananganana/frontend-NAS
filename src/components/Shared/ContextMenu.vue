<template>
  <div 
    v-if="show"
    class="fixed bg-base-100 border border-base-300 shadow-lg rounded-lg py-2 z-50 min-w-52"
    :style="{ left: x + 'px', top: y + 'px' }"
    @click.stop
  >
    <!-- Ouvrir -->
    <button 
      v-if="item"
      class="w-full text-left px-4 py-2 hover:bg-base-200 text-sm flex items-center gap-3"
      @click="$emit('open', item)"
    >
      <i class="fas w-4" :class="item.is_directory ? 'fa-folder-open' : 'fa-eye'"></i>
      {{ item.is_directory ? 'Ouvrir' : 'Prévisualiser' }}
    </button>

    <!-- Télécharger (fichiers seulement) -->
    <button 
      v-if="item && !item.is_directory && permissions.can_read"
      class="w-full text-left px-4 py-2 hover:bg-base-200 text-sm flex items-center gap-3"
      @click="$emit('download', item)"
    >
      <i class="fas fa-download w-4"></i>
      Télécharger
    </button>

    <div v-if="hasModifyActions" class="divider my-1"></div>

    <!-- Renommer -->
    <button 
      v-if="item && permissions.can_write"
      class="w-full text-left px-4 py-2 hover:bg-base-200 text-sm flex items-center gap-3"
      @click="$emit('rename', item)"
    >
      <i class="fas fa-edit w-4"></i>
      Renommer
    </button>

    <!-- Copier -->
    <button 
      v-if="item && permissions.can_read"
      class="w-full text-left px-4 py-2 hover:bg-base-200 text-sm flex items-center gap-3"
      @click="$emit('copy', item)"
    >
      <i class="fas fa-copy w-4"></i>
      Copier
    </button>

    <!-- Couper -->
    <button 
      v-if="item && permissions.can_write"
      class="w-full text-left px-4 py-2 hover:bg-base-200 text-sm flex items-center gap-3"
      @click="$emit('cut', item)"
    >
      <i class="fas fa-cut w-4"></i>
      Couper
    </button>

    <!-- Coller -->
    <button 
      v-if="showPasteOption && permissions.can_write"
      class="w-full text-left px-4 py-2 hover:bg-base-200 text-sm flex items-center gap-3"
      @click="$emit('paste')"
      :title="getPasteTooltip()"
    >
      <i class="fas fa-paste w-4"></i>
      Coller
      <span v-if="clipboardInfo" class="text-xs opacity-60 ml-auto">
        {{ clipboardInfo.count }} {{ clipboardInfo.operation === 'copy' ? 'copie(s)' : 'déplacement(s)' }}
      </span>
    </button>

    <!-- Permissions (Admin seulement) -->
    <button 
      v-if="item && isAdmin"
      class="w-full text-left px-4 py-2 hover:bg-base-200 text-sm flex items-center gap-3"
      @click="$emit('permissions', item)"
    >
      <i class="fas fa-shield-alt w-4"></i>
      Permissions
    </button>

    <!-- Ajouter/Retirer des favoris (Utilisateurs seulement) -->
    <button 
      v-if="item && !isAdmin"
      class="w-full text-left px-4 py-2 hover:bg-base-200 text-sm flex items-center gap-3"
      @click="$emit('toggle-favorite', item)"
    >
      <i class="fas w-4" :class="isFavorite ? 'fa-star text-warning' : 'fa-star-o'"></i>
      {{ isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris' }}
    </button>

    <!-- Envoyer vers / Déplacer -->
    <button 
      v-if="item && permissions.can_write"
      class="w-full text-left px-4 py-2 hover:bg-base-200 text-sm flex items-center gap-3"
      @click="$emit('move', item)"
    >
      <i class="fas fa-share w-4"></i>
      Envoyer vers
    </button>

    <!-- Nouveau dossier (sur espace vide seulement) -->
    <button 
      v-if="!item && permissions.can_write"
      class="w-full text-left px-4 py-2 hover:bg-base-200 text-sm flex items-center gap-3"
      @click="$emit('create-folder')"
    >
      <i class="fas fa-folder-plus w-4"></i>
      Nouveau dossier
    </button>

    <!-- Nouveau fichier (sur espace vide seulement) -->
    <button 
      v-if="!item && permissions.can_write"
      class="w-full text-left px-4 py-2 hover:bg-base-200 text-sm flex items-center gap-3"
      @click="$emit('create-file')"
    >
      <i class="fas fa-file-plus w-4"></i>
      Nouveau fichier
    </button>

    <div v-if="permissions.can_delete" class="divider my-1"></div>

    <!-- Supprimer -->
    <button 
      v-if="item && permissions.can_delete"
      class="w-full text-left px-4 py-2 hover:bg-base-200 text-sm text-error flex items-center gap-3"
      @click="$emit('delete', item)"
    >
      <i class="fas fa-trash w-4"></i>
      Supprimer
    </button>

    <div class="divider my-1"></div>
    
    <!-- Propriétés -->
    <button 
      v-if="item"
      class="w-full text-left px-4 py-2 hover:bg-base-200 text-sm flex items-center gap-3"
      @click="$emit('properties', item)"
    >
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
import { computed } from 'vue'
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
  }
})

const emit = defineEmits([
  'open',
  'download', 
  'rename',
  'copy',
  'cut',
  'paste',
  'permissions',
  'move',
  'create-folder',
  'create-file',
  'delete',
  'properties',
  'toggle-favorite'
])

const store = useStore()

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

const getPasteTooltip = () => {
  if (!props.clipboardInfo) return ''
  
  const { operation, count, description } = props.clipboardInfo
  const operationText = operation === 'copy' ? 'Copier' : 'Déplacer'
  
  return `${operationText} ${count} élément${count > 1 ? 's' : ''}`
}
</script>