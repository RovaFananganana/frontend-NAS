# Composables - Gestion des Modes d'Affichage

## useViewMode

Le composable `useViewMode` fournit une gestion complète des modes d'affichage des fichiers avec persistance automatique des préférences utilisateur.

### Fonctionnalités

- **Modes d'affichage multiples** : Arbre et Liste détaillée
- **Tri dynamique** : Par nom, taille, type, date de modification
- **Sélection multiple** : Gestion complète de la sélection de fichiers
- **Persistance automatique** : Sauvegarde dans localStorage
- **Visibilité des colonnes** : Configuration flexible pour le mode liste
- **API réactive** : Intégration native avec Vue 3

### Utilisation de base

```javascript
import { useViewMode } from '@/composables/useViewMode.js'

export default {
  setup() {
    const {
      // État
      currentMode,
      sortColumn,
      sortDirection,
      selectedFiles,
      currentViewMode,
      availableModes,
      
      // Actions
      setCurrentMode,
      setSortColumn,
      toggleSelectedFile,
      clearSelection,
      
      // Utilitaires
      isSelected,
      sortFiles
    } = useViewMode()

    return {
      currentMode,
      setCurrentMode,
      // ... autres propriétés
    }
  }
}
```

### API Complète

#### État Réactif

- `currentMode` : Mode d'affichage actuel ('tree' | 'detailed-list')
- `sortColumn` : Colonne de tri actuelle ('name' | 'size' | 'type' | 'modified')
- `sortDirection` : Direction du tri ('asc' | 'desc')
- `selectedFiles` : Array des chemins de fichiers sélectionnés
- `columnVisibility` : Objet de visibilité des colonnes
- `currentViewMode` : Objet complet du mode actuel avec métadonnées
- `availableModes` : Array des modes disponibles
- `visibleColumns` : Array des colonnes visibles (mode liste)

#### Actions

- `setCurrentMode(modeId)` : Change le mode d'affichage
- `setSortColumn(column)` : Change la colonne de tri (inverse la direction si même colonne)
- `setSortDirection(direction)` : Force une direction de tri
- `setSelectedFiles(files)` : Définit la liste des fichiers sélectionnés
- `addSelectedFile(filePath)` : Ajoute un fichier à la sélection
- `removeSelectedFile(filePath)` : Retire un fichier de la sélection
- `toggleSelectedFile(filePath)` : Bascule la sélection d'un fichier
- `clearSelection()` : Vide la sélection
- `selectAll(files)` : Sélectionne tous les fichiers
- `setColumnVisibility(column, visible)` : Change la visibilité d'une colonne
- `toggleColumnVisibility(column)` : Bascule la visibilité d'une colonne

#### Utilitaires

- `isSelected(filePath)` : Vérifie si un fichier est sélectionné
- `getSelectedCount()` : Retourne le nombre de fichiers sélectionnés
- `isTreeMode` : Computed - true si mode arbre
- `isDetailedListMode` : Computed - true si mode liste
- `sortFiles(files)` : Trie un array de fichiers selon les paramètres actuels

### Exemple d'utilisation dans un composant

```vue
<template>
  <div class="file-explorer">
    <!-- Sélecteur de mode -->
    <div class="mode-selector">
      <button 
        v-for="mode in availableModes"
        :key="mode.id"
        :class="{ active: currentMode === mode.id }"
        @click="setCurrentMode(mode.id)"
      >
        <i :class="mode.icon"></i>
        {{ mode.label }}
      </button>
    </div>

    <!-- Liste des fichiers -->
    <div class="file-list">
      <div 
        v-for="file in sortedFiles"
        :key="file.path"
        :class="{ selected: isSelected(file.path) }"
        @click="toggleSelectedFile(file.path)"
      >
        {{ file.name }}
      </div>
    </div>

    <!-- Contrôles de tri -->
    <div class="sort-controls">
      <button @click="setSortColumn('name')">Nom</button>
      <button @click="setSortColumn('size')">Taille</button>
      <button @click="setSortColumn('modified')">Date</button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useViewMode } from '@/composables/useViewMode.js'

const {
  currentMode,
  availableModes,
  selectedFiles,
  setCurrentMode,
  setSortColumn,
  toggleSelectedFile,
  isSelected,
  sortFiles
} = useViewMode()

// Vos données de fichiers
const files = ref([...])

// Fichiers triés selon les préférences
const sortedFiles = computed(() => sortFiles(files.value))
</script>
```

### Persistance

Le composable sauvegarde automatiquement les préférences suivantes dans `localStorage` :

- Mode d'affichage actuel
- Colonne et direction de tri
- Visibilité des colonnes

La clé utilisée est : `nas-view-mode-preferences`

### Types

Les types sont définis dans `@/types/viewMode.js` avec JSDoc pour la compatibilité JavaScript :

- `ViewMode` : Définition d'un mode d'affichage
- `ViewModeState` : État complet du système
- `FileItem` : Structure d'un fichier
- `ViewColumn` : Définition d'une colonne

### Constantes

```javascript
import { VIEW_MODES, SORT_DIRECTIONS, SORT_COLUMNS } from '@/types/viewMode.js'

// Modes disponibles
VIEW_MODES.TREE // 'tree'
VIEW_MODES.DETAILED_LIST // 'detailed-list'

// Directions de tri
SORT_DIRECTIONS.ASC // 'asc'
SORT_DIRECTIONS.DESC // 'desc'

// Colonnes de tri
SORT_COLUMNS.NAME // 'name'
SORT_COLUMNS.SIZE // 'size'
SORT_COLUMNS.TYPE // 'type'
SORT_COLUMNS.MODIFIED // 'modified'
```

### Tests

Des tests manuels sont disponibles dans :
- `@/composables/__tests__/manual-test-useViewMode.html`
- `@/components/Examples/ViewModeExample.vue`

### Intégration avec Vuex

Le composable peut être utilisé indépendamment ou en complément du store Vuex existant. Une action `initializeViewMode` est disponible dans le store pour marquer l'initialisation du système.

```javascript
// Dans un composant
import { useStore } from 'vuex'

const store = useStore()
store.dispatch('initializeViewMode')
```