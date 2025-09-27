# Correction du problème "computed value is readonly"

## Problème identifié
```
[Vue warn] Write operation failed: computed value is readonly
at selectFile @ useFileExplorerNavigation.js:137
```

## Cause du problème
Dans `useViewMode.js`, `selectedFiles` était défini comme une computed value en lecture seule :
```javascript
const selectedFiles = computed(() => state.value.selectedFiles)
```

Mais `useFileExplorerNavigation.js` essayait d'écrire dedans :
```javascript
selectedFiles.value = [filePath]  // ❌ Erreur: readonly
```

## Solution implémentée

### ✅ Computed avec getter/setter
Modifié `useViewMode.js` pour permettre les écritures :
```javascript
const selectedFiles = computed({
  get: () => state.value.selectedFiles,
  set: (value) => {
    state.value.selectedFiles = value
  }
})
```

## Avantages de cette solution

1. **Compatibilité maintenue** : L'API reste la même
2. **Réactivité préservée** : Les changements sont toujours réactifs
3. **Écriture autorisée** : Plus d'erreur de readonly
4. **État synchronisé** : Les modifications sont sauvegardées dans l'état global

## Test de la correction

### Avant (erreur)
```
selectedFiles.value = [filePath]
// ❌ [Vue warn] Write operation failed: computed value is readonly
```

### Après (fonctionne)
```
selectedFiles.value = [filePath]
// ✅ Pas d'erreur, sélection mise à jour
```

## Autres computed values concernées

Si d'autres computed values ont le même problème, appliquer la même solution :
```javascript
// Au lieu de :
const myValue = computed(() => state.value.myValue)

// Utiliser :
const myValue = computed({
  get: () => state.value.myValue,
  set: (value) => {
    state.value.myValue = value
  }
})
```

Cette correction résout définitivement le warning Vue sans casser la fonctionnalité.