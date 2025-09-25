/**
 * @fileoverview Définitions des types pour les modes d'affichage des fichiers
 * Ces types sont définis en JSDoc pour compatibilité avec le projet JavaScript
 */

/**
 * Mode d'affichage des fichiers
 * @typedef {Object} ViewMode
 * @property {string} id - Identifiant unique du mode (ex: 'tree', 'detailed-list')
 * @property {string} label - Libellé affiché à l'utilisateur (ex: 'Arbre', 'Liste détaillée')
 * @property {string} icon - Classes CSS pour l'icône FontAwesome (ex: 'fas fa-sitemap')
 * @property {string} component - Nom du composant Vue correspondant (ex: 'TreeView')
 */

/**
 * État complet des modes d'affichage
 * @typedef {Object} ViewModeState
 * @property {string} currentMode - Mode d'affichage actuellement sélectionné
 * @property {string} sortColumn - Colonne utilisée pour le tri ('name', 'size', 'type', 'modified')
 * @property {'asc'|'desc'} sortDirection - Direction du tri (ascendant ou descendant)
 * @property {string[]} selectedFiles - Liste des chemins des fichiers sélectionnés
 * @property {Object.<string, boolean>} columnVisibility - Visibilité de chaque colonne dans le mode liste
 */

/**
 * Colonne de la vue liste détaillée
 * @typedef {Object} ViewColumn
 * @property {string} key - Clé unique de la colonne
 * @property {string} label - Libellé affiché dans l'en-tête
 * @property {boolean} sortable - Indique si la colonne est triable
 * @property {boolean} [visible] - Indique si la colonne est visible (optionnel)
 * @property {number} [width] - Largeur de la colonne en pixels (optionnel)
 * @property {string} [align] - Alignement du contenu ('left', 'center', 'right')
 */

/**
 * Élément de fichier étendu pour l'affichage
 * @typedef {Object} FileItem
 * @property {string} name - Nom du fichier ou dossier
 * @property {string} path - Chemin complet du fichier
 * @property {boolean} is_directory - Indique si c'est un dossier
 * @property {number} [size] - Taille du fichier en octets (optionnel pour les dossiers)
 * @property {string} [modified_time] - Date de dernière modification (ISO string)
 * @property {string} [created_time] - Date de création (ISO string)
 * @property {string} [file_type] - Type de fichier détecté
 * @property {string} [permissions] - Permissions du fichier
 * @property {string} [description] - Description optionnelle du fichier
 */

/**
 * Configuration des préférences utilisateur pour les modes d'affichage
 * @typedef {Object} ViewModePreferences
 * @property {string} defaultMode - Mode d'affichage par défaut
 * @property {Object.<string, boolean>} columnVisibility - Visibilité par défaut des colonnes
 * @property {string} defaultSortColumn - Colonne de tri par défaut
 * @property {'asc'|'desc'} defaultSortDirection - Direction de tri par défaut
 * @property {boolean} rememberSelection - Mémoriser la sélection entre les changements de mode
 * @property {boolean} autoSort - Tri automatique lors du chargement
 */

/**
 * Événement émis lors du changement de mode
 * @typedef {Object} ViewModeChangeEvent
 * @property {string} oldMode - Ancien mode d'affichage
 * @property {string} newMode - Nouveau mode d'affichage
 * @property {number} timestamp - Timestamp du changement
 */

/**
 * Événement émis lors du changement de tri
 * @typedef {Object} SortChangeEvent
 * @property {string} column - Colonne de tri
 * @property {'asc'|'desc'} direction - Direction du tri
 * @property {number} timestamp - Timestamp du changement
 */

/**
 * Événement émis lors du changement de sélection
 * @typedef {Object} SelectionChangeEvent
 * @property {string[]} selectedFiles - Liste des fichiers sélectionnés
 * @property {string} action - Action effectuée ('add', 'remove', 'toggle', 'clear', 'selectAll')
 * @property {string} [targetFile] - Fichier cible de l'action (optionnel)
 * @property {number} timestamp - Timestamp du changement
 */

// Export des constantes utiles
export const VIEW_MODES = {
  TREE: 'tree',
  DETAILED_LIST: 'detailed-list'
}

export const SORT_DIRECTIONS = {
  ASC: 'asc',
  DESC: 'desc'
}

export const SORT_COLUMNS = {
  NAME: 'name',
  SIZE: 'size',
  TYPE: 'type',
  MODIFIED: 'modified'
}

export const SELECTION_ACTIONS = {
  ADD: 'add',
  REMOVE: 'remove',
  TOGGLE: 'toggle',
  CLEAR: 'clear',
  SELECT_ALL: 'selectAll'
}

// Configuration par défaut
export const DEFAULT_VIEW_MODE_STATE = {
  currentMode: VIEW_MODES.TREE,
  sortColumn: SORT_COLUMNS.NAME,
  sortDirection: SORT_DIRECTIONS.ASC,
  selectedFiles: [],
  columnVisibility: {
    name: true,
    size: true,
    type: true,
    modified: true
  }
}

export const DEFAULT_COLUMNS = [
  {
    key: SORT_COLUMNS.NAME,
    label: 'Nom',
    sortable: true,
    align: 'left'
  },
  {
    key: SORT_COLUMNS.SIZE,
    label: 'Taille',
    sortable: true,
    align: 'right'
  },
  {
    key: SORT_COLUMNS.TYPE,
    label: 'Type',
    sortable: true,
    align: 'left'
  },
  {
    key: SORT_COLUMNS.MODIFIED,
    label: 'Modifié',
    sortable: true,
    align: 'left'
  }
]