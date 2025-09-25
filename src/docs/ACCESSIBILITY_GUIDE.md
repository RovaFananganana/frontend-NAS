# Guide d'Accessibilité - Modes d'Affichage des Fichiers

## Vue d'ensemble

Ce guide documente les améliorations d'accessibilité implémentées pour les composants de modes d'affichage des fichiers, conformément aux directives WCAG 2.1 AA.

## Fonctionnalités d'Accessibilité Implémentées

### 1. Navigation au Clavier

#### Raccourcis Globaux
- **Alt + Shift + A** : Aller au contenu principal
- **Alt + Shift + N** : Aller à la navigation
- **Alt + Shift + S** : Aller à la recherche
- **F1** ou **?** : Afficher l'aide des raccourcis
- **Échap** : Fermer les modales ou annuler les actions

#### Navigation dans l'Explorateur
- **↑/↓** : Naviguer entre les fichiers
- **Home/End** : Aller au premier/dernier fichier
- **Page↑/Page↓** : Navigation par page
- **Entrée** : Ouvrir le fichier/dossier sélectionné
- **Espace** : Basculer la sélection
- **Ctrl + A** : Tout sélectionner
- **Shift + ↑/↓** : Étendre la sélection

#### Modes d'Affichage
- **Ctrl + 1** : Mode arbre
- **Ctrl + 2** : Liste détaillée

#### Tri
- **Ctrl + Shift + N** : Trier par nom
- **Ctrl + Shift + S** : Trier par taille
- **Ctrl + Shift + T** : Trier par type
- **Ctrl + Shift + D** : Trier par date

### 2. Support des Lecteurs d'Écran

#### Attributs ARIA Implémentés
- `role="application"` sur le conteneur principal
- `role="grid"` pour les listes de fichiers
- `role="gridcell"` pour les éléments de fichier
- `role="columnheader"` pour les en-têtes de colonnes
- `role="radiogroup"` pour le sélecteur de modes
- `role="radio"` pour les boutons de mode

#### Annonces Dynamiques
- `aria-live="polite"` pour les changements d'état
- `aria-live="assertive"` pour les erreurs
- Annonces automatiques des changements de tri
- Annonces des changements de sélection

#### Labels Accessibles
- Labels descriptifs pour tous les éléments interactifs
- Descriptions contextuelles avec `aria-describedby`
- États de sélection avec `aria-selected`
- États de tri avec `aria-sort`

### 3. Gestion du Focus

#### Focus Trap
- Piège à focus dans les modales
- Restauration automatique du focus
- Gestion du focus lors des changements de mode

#### Indicateurs Visuels
- Contours de focus visibles
- Styles de focus cohérents
- Support de `:focus-visible`

### 4. Responsive et Tactile

#### Zones de Touch
- Minimum 44px pour tous les éléments interactifs
- Zones de touch confortables (48px) sur mobile
- Espacement approprié entre les éléments

#### Adaptations Mobiles
- Interface simplifiée sur petit écran
- Masquage intelligent des colonnes
- Gestes tactiles supportés

### 5. Préférences Utilisateur

#### Réduction des Animations
- Support de `prefers-reduced-motion`
- Désactivation des animations si demandé
- Transitions simplifiées

#### Contraste Élevé
- Support de `prefers-contrast: high`
- Couleurs adaptées automatiquement
- Bordures renforcées

## Structure des Composants

### FileExplorer
```vue
<div 
  role="application"
  aria-label="Explorateur de fichiers"
  :aria-busy="loading"
>
  <!-- Skip links -->
  <div class="skip-links">
    <a href="#file-explorer-main" class="skip-link">
      Aller au contenu principal
    </a>
  </div>
  
  <!-- Toolbar -->
  <div 
    role="toolbar"
    aria-label="Modes d'affichage des fichiers"
  >
    <ViewModeSelector />
  </div>
  
  <!-- Main content -->
  <div 
    id="file-explorer-main"
    role="main"
    aria-label="Contenu de l'explorateur"
  >
    <!-- File list or tree -->
  </div>
</div>
```

### ViewModeSelector
```vue
<div 
  role="radiogroup"
  aria-label="Sélection du mode d'affichage"
>
  <button
    v-for="mode in modes"
    role="radio"
    :aria-pressed="isActive"
    :aria-checked="isActive"
    :aria-label="getAriaLabel(mode)"
  >
    {{ mode.label }}
  </button>
</div>
```

### DetailedListView
```vue
<div 
  role="grid"
  :aria-label="`Liste des fichiers, ${fileCount} éléments`"
  :aria-busy="loading"
>
  <table>
    <thead>
      <tr role="row">
        <th
          role="columnheader"
          :aria-sort="getSortDirection(column)"
          :aria-label="getSortLabel(column)"
          tabindex="0"
          @click="handleSort"
          @keydown.enter="handleSort"
          @keydown.space.prevent="handleSort"
        >
          {{ column.label }}
        </th>
      </tr>
    </thead>
    <tbody>
      <FileListItem
        v-for="file in files"
        :key="file.path"
        :file="file"
      />
    </tbody>
  </table>
</div>
```

### FileListItem
```vue
<tr 
  role="gridcell"
  :aria-selected="selected"
  :aria-label="getFileDescription()"
  :aria-describedby="`file-${index}-description`"
  :tabindex="focused ? 0 : -1"
>
  <td>
    <div aria-hidden="true">
      <!-- File icon -->
    </div>
    <span>{{ file.name }}</span>
  </td>
  
  <!-- Hidden description for screen readers -->
  <td class="sr-only">
    <div :id="`file-${index}-description`">
      {{ getDetailedDescription() }}
    </div>
  </td>
</tr>
```

## Classes CSS d'Accessibilité

### Utilitaires
```css
/* Screen reader only */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* Skip links */
.skip-link {
  position: absolute;
  top: -40px;
  left: 6px;
  background: var(--file-explorer-accent);
  color: white;
  padding: 8px;
  text-decoration: none;
  border-radius: 4px;
  z-index: 1000;
}

.skip-link:focus {
  top: 6px;
}

/* Focus visible only */
.focus-visible-only:focus:not(:focus-visible) {
  outline: none;
  box-shadow: none;
}

.focus-visible-only:focus-visible {
  outline: 2px solid var(--file-explorer-accent);
  outline-offset: 2px;
}
```

### Variables CSS
```css
:root {
  /* Couleurs accessibles */
  --file-explorer-focus-ring: hsl(var(--p) / 0.5);
  --file-explorer-selected: hsl(var(--p) / 0.15);
  
  /* Tailles tactiles */
  --touch-target-min: 44px;
  --touch-target-comfortable: 48px;
  
  /* Ombres de focus */
  --shadow-focus: 0 0 0 3px var(--file-explorer-focus-ring);
}
```

## Composable d'Accessibilité

### useAccessibility
```javascript
const {
  announce,           // Annoncer aux lecteurs d'écran
  focusElement,       // Déplacer le focus
  enhanceElement,     // Améliorer l'accessibilité d'un élément
  setupFocusTrap,     // Configurer un piège à focus
  validateAccessibility // Valider l'accessibilité
} = useAccessibility()

// Exemples d'utilisation
announce('Fichier sélectionné', 'polite')
focusElement('#main-content', { announce: true })
enhanceElement(element, { 
  role: 'button', 
  label: 'Ouvrir le fichier' 
})
```

## Tests d'Accessibilité

### Tests Automatisés
- Vérification des attributs ARIA
- Tests de navigation au clavier
- Validation des contrastes
- Tests de focus management

### Tests Manuels Recommandés
1. **Navigation au clavier uniquement**
   - Débrancher la souris
   - Naviguer avec Tab, flèches, Entrée, Espace
   - Vérifier que tous les éléments sont accessibles

2. **Lecteur d'écran**
   - Tester avec NVDA (Windows) ou VoiceOver (Mac)
   - Vérifier les annonces et descriptions
   - S'assurer que le contenu est logique

3. **Zoom**
   - Tester jusqu'à 200% de zoom
   - Vérifier que l'interface reste utilisable
   - S'assurer qu'il n'y a pas de défilement horizontal

## Conformité WCAG 2.1

### Niveau A
✅ **1.1.1** - Images avec texte alternatif  
✅ **1.3.1** - Information et relations  
✅ **1.4.1** - Utilisation de la couleur  
✅ **2.1.1** - Clavier  
✅ **2.1.2** - Pas de piège au clavier  
✅ **2.4.1** - Contournement de blocs  
✅ **2.4.3** - Parcours du focus  
✅ **3.2.1** - Au focus  
✅ **4.1.1** - Analyse syntaxique  
✅ **4.1.2** - Nom, rôle et valeur  

### Niveau AA
✅ **1.4.3** - Contraste (minimum)  
✅ **1.4.10** - Redistribution  
✅ **1.4.11** - Contraste du contenu non textuel  
✅ **2.4.5** - Plusieurs façons  
✅ **2.4.6** - En-têtes et étiquettes  
✅ **2.4.7** - Focus visible  
✅ **2.5.5** - Taille de la cible  

## Maintenance

### Checklist pour Nouvelles Fonctionnalités
- [ ] Tous les éléments interactifs ont un label accessible
- [ ] La navigation au clavier fonctionne
- [ ] Les changements d'état sont annoncés
- [ ] Le contraste est suffisant (4.5:1 minimum)
- [ ] Les zones de touch font au moins 44px
- [ ] Les animations respectent `prefers-reduced-motion`
- [ ] Tests d'accessibilité ajoutés

### Outils Recommandés
- **axe-core** : Tests automatisés d'accessibilité
- **WAVE** : Extension navigateur pour l'audit
- **Lighthouse** : Audit d'accessibilité intégré
- **Color Oracle** : Simulation de daltonisme
- **NVDA/VoiceOver** : Tests avec lecteurs d'écran

## Ressources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM](https://webaim.org/)
- [A11y Project](https://www.a11yproject.com/)